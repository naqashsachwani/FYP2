import prisma from "@/lib/prisma"; // Prisma client for DB
import { getAuth } from "@clerk/nextjs/server"; // Clerk auth for server
import { NextResponse } from "next/server"; // Next.js response helper

// ---------------- Normalize Decimal to Number ----------------
// Prisma stores decimals as objects; this converts them to normal numbers for JSON
const normalize = (obj) => JSON.parse(
  JSON.stringify(obj, (key, value) => 
    (typeof value === 'object' && value !== null && value.type === 'Decimal') 
      ? Number(value) 
      : value
  )
);

/* ================= GET ALL GOALS ================= */
export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) 
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    // Fetch all goals of this user with related data
    const goals = await prisma.goal.findMany({
      where: { userId },
      include: { 
        product: true, // Product info
        deposits: { orderBy: { createdAt: "desc" } }, // Deposits history
        priceLock: true // Linked PriceLock data
      },
      orderBy: { createdAt: "desc" }, // Latest first
    });

    // Map goals to include progress calculations
    const goalsWithProgress = goals.map(goal => ({
      ...goal,
      saved: Number(goal.saved),
      targetAmount: Number(goal.targetAmount),
      progressPercent: goal.targetAmount > 0 
        ? (Number(goal.saved) / Number(goal.targetAmount)) * 100 
        : 0,
      remaining: Number(goal.targetAmount) - Number(goal.saved),
    }));

    return NextResponse.json({ goals: normalize(goalsWithProgress) });
  } catch (err) {
    console.error("GET /api/goals error:", err);
    return NextResponse.json({ error: "Failed to fetch goals" }, { status: 500 });
  }
}

/* ================= CREATE / UPDATE GOAL ================= */
export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    if (!userId) 
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    const body = await request.json();
    const { productId, targetAmount, targetDate, status = "ACTIVE" } = body;

    // Input validation
    if (!productId) return NextResponse.json({ error: "productId is required" }, { status: 400 });
    const amountNum = Number(targetAmount);
    if (!amountNum || amountNum <= 0) 
      return NextResponse.json({ error: "targetAmount must be positive" }, { status: 400 });

    // ---------------- Check if a live goal exists ----------------
    const existingGoal = await prisma.goal.findFirst({
      where: { 
        userId, 
        productId,
        status: { in: ["ACTIVE", "SAVED"] } 
      } 
    });

    // ---------------- Update existing goal ----------------
    if (existingGoal) {
      const updatedData = await prisma.$transaction(async (tx) => {
        // Update Goal
        const goalUpdate = await tx.goal.update({
          where: { id: existingGoal.id },
          data: { 
            targetAmount: amountNum, 
            endDate: targetDate ? new Date(targetDate) : existingGoal.endDate,
            status: status 
          },
          include: { priceLock: true } // Return PriceLock for further update
        });

        // Update linked PriceLock expiry to match goal endDate
        if (goalUpdate.priceLock) {
           await tx.priceLock.update({
             where: { id: goalUpdate.priceLock.id },
             data: {
               expiresAt: targetDate ? new Date(targetDate) : existingGoal.endDate
             }
           });
        }

        return goalUpdate;
      });

      return NextResponse.json({ message: "Goal updated", goal: normalize(updatedData) });
    }

    // ---------------- Create new goal ----------------
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const result = await prisma.$transaction(async (tx) => {
      // Create Goal
      const newGoal = await tx.goal.create({
        data: {
          userId,
          productId,
          targetAmount: amountNum,
          endDate: targetDate ? new Date(targetDate) : null,
          status: status, 
          saved: 0,
          lockedPrice: product.price,
          priceLocked: true,
        },
      });

      // Create linked PriceLock
      await tx.priceLock.create({
        data: {
          productId,
          goalId: newGoal.id,
          lockedPrice: product.price,
          originalPrice: product.price,
          lockedBy: userId,
          status: "ACTIVE",
          storeId: product.storeId,
          expiresAt: targetDate ? new Date(targetDate) : null,
        },
      });

      return newGoal;
    });

    return NextResponse.json({ message: "Goal created", goal: normalize(result) });

  } catch (err) {
    console.error("POST /api/goals error:", err);
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}
