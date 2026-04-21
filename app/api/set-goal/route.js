import prisma from "@/lib/prisma"; // Import Prisma client to interact with the database
import { getAuth } from "@clerk/nextjs/server"; // Import Clerk for server-side authentication
import { NextResponse } from "next/server"; // Import Next.js response helper
import { sendNotification } from "@/lib/sendNotification"; 
import { goalStartedTemplate } from "@/lib/emailTemplates"; 

export const dynamic = 'force-dynamic'; 
// Ensures this route is always treated as dynamic, disabling static optimization

// Helper: Convert Prisma Decimal objects to numbers for JSON responses
const normalize = (obj) => JSON.parse(JSON.stringify(obj, (key, value) => 
  (typeof value === 'object' && value !== null && value.type === 'Decimal') ? Number(value) : value
));

// ================== GET: Fetch user goals ==================
export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    const goals = await prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { product: true, deposits: true },
    });

    const goalsWithProgress = goals.map(goal => ({
      ...goal,
      progressPercent: goal.targetAmount > 0 
        ? (Number(goal.saved) / Number(goal.targetAmount)) * 100 
        : 0,
    }));

    return NextResponse.json({ goals: normalize(goalsWithProgress) });

  } catch (err) {
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}

// ================== POST: Create or Update Goal ==================
export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

    // Note: We do NOT take targetAmount from the frontend for security reasons.
    const { productId, targetDate, status = "ACTIVE", couponCode } = body;

    if (!productId) return NextResponse.json({ error: "productId is required" }, { status: 400 });

    // 1. Fetch Product to get the true Base Price
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const basePrice = Number(product.price);
    let discountAmount = 0;
    let appliedCouponCode = null;

    // 2. Validate Coupon (If provided)
    if (couponCode) {
        const coupon = await prisma.coupon.findUnique({ 
            where: { code: couponCode.toUpperCase() } 
        });

        if (!coupon) {
            return NextResponse.json({ error: "Invalid coupon code" }, { status: 400 });
        }
        if (new Date(coupon.expiresAt) < new Date()) {
            return NextResponse.json({ error: "Coupon has expired" }, { status: 400 });
        }
        
        // Enforce Usage Limit
        const usageCount = await prisma.couponUsage.count({
            where: { userId, couponCode: coupon.code }
        });
        if (usageCount >= coupon.usageLimit) {
            return NextResponse.json({ error: `Coupon limit reached (${coupon.usageLimit}x max)` }, { status: 400 });
        }

        // Enforce New User Rule
        if (coupon.forNewUser) {
            const pastGoals = await prisma.goal.count({ where: { userId } });
            if (pastGoals > 0) {
                return NextResponse.json({ error: "This coupon is strictly for new users." }, { status: 400 });
            }
        }

        // Coupon is fully valid! Calculate discount.
        discountAmount = basePrice * (coupon.discount / 100);
        appliedCouponCode = coupon.code;
    }

    // 3. Calculate Delivery Fee & Final Target Amount
    const deliveryFee = basePrice > 5000 ? 0 : 250;
    const finalTargetAmount = basePrice - discountAmount + deliveryFee;
    const finalEndDate = targetDate ? new Date(targetDate) : null;

    // ================== CASE 1: Updating a Draft ==================
    if (status === "SAVED") {
      const existingDraft = await prisma.goal.findFirst({
        where: { userId, productId, status: "SAVED" } 
      });

      if (existingDraft) {
        const updatedDraft = await prisma.goal.update({
          where: { id: existingDraft.id },
          data: {
            targetAmount: finalTargetAmount,
            endDate: targetDate ? new Date(targetDate) : existingDraft.endDate,
            couponCode: appliedCouponCode,
            deliveryFee: deliveryFee,
            discountAmount: discountAmount
          },
        });
        return NextResponse.json({ message: "Draft updated", goal: normalize(updatedDraft) });
      }
    }

    // ================== CASE 2: Starting a New Goal ==================
    // Use Prisma transaction to ensure everything creates successfully, or rolls back if it fails
    const result = await prisma.$transaction(async (tx) => {
      
      // A. Create the Goal with the exact financial math
      const newGoal = await tx.goal.create({
        data: {
          userId,
          productId,
          targetAmount: finalTargetAmount,
          endDate: finalEndDate,
          status: status,
          saved: 0,
          lockedPrice: basePrice,
          priceLocked: true,
          couponCode: appliedCouponCode,
          deliveryFee: deliveryFee,
          discountAmount: discountAmount
        },
      });

      // B. Create a price lock record for this goal
      await tx.priceLock.create({
        data: {
          productId,
          goalId: newGoal.id,
          lockedPrice: basePrice,
          originalPrice: basePrice,
          lockedBy: userId,
          status: "ACTIVE",
          storeId: product.storeId,
          expiresAt: finalEndDate, 
        },
      });

      // C. If a coupon was used, CREATE A USAGE RECORD!
      // This is crucial to ensure the 'usageLimit' logic works next time they try to use it.
      if (appliedCouponCode) {
          await tx.couponUsage.create({
              data: {
                  userId,
                  couponCode: appliedCouponCode
              }
          });
      }

      return newGoal; 
    });

    // FIRE ENGINE: Send Welcome Email (Only if they actually activated the goal)
    if (status === "ACTIVE") {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user) {
            await sendNotification({
                userId: user.id,
                email: user.email,
                title: "Your DreamSaver Goal is Live!",
                message: `You started saving for ${product.name}. Target: Rs ${finalTargetAmount.toLocaleString()}`,
                html: goalStartedTemplate(user.name, product.name, finalTargetAmount),
                type: "GOAL_START",
                goalId: result.id,
                notifyInApp: true,
                notifyEmail: true
            });
        }
    }

    return NextResponse.json({ message: "New goal created", goal: normalize(result) });

  } catch (err) {
    console.error("set-goal POST error:", err);
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}