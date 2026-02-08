import prisma from "@/lib/prisma"; // Import Prisma client to interact with the database
import { getAuth } from "@clerk/nextjs/server"; // Import Clerk for server-side authentication
import { NextResponse } from "next/server"; // Import Next.js response helper

export const dynamic = 'force-dynamic'; 
// Ensures this route is always treated as dynamic, disabling static optimization

// Helper: Convert Prisma Decimal objects to numbers for JSON responses
const normalize = (obj) => JSON.parse(JSON.stringify(obj, (key, value) => 
  (typeof value === 'object' && value !== null && value.type === 'Decimal') ? Number(value) : value
));

// ================== GET: Fetch user goals ==================
export async function GET(request) {
  try {
    // Get the authenticated user
    const { userId } = getAuth(request);
    if (!userId) 
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    // Fetch all goals for this user, ordered by newest first
    // Include related product and deposits for richer data
    const goals = await prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { product: true, deposits: true },
    });

    // Add calculated progressPercent to each goal
    const goalsWithProgress = goals.map(goal => ({
      ...goal,
      progressPercent: goal.targetAmount > 0 
        ? (Number(goal.saved) / Number(goal.targetAmount)) * 100 
        : 0,
    }));

    // Return normalized JSON (Decimal -> Number)
    return NextResponse.json({ goals: normalize(goalsWithProgress) });

  } catch (err) {
    // Return 500 on server errors
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}

// ================== POST: Create or Update Goal ==================
export async function POST(request) {
  try {
    // Get authenticated user
    const { userId } = getAuth(request);
    if (!userId) 
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

    // Parse request body safely
    const body = await request.json().catch(() => null);
    if (!body) 
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

    const { productId, targetAmount, targetDate, status = "ACTIVE" } = body;

    // Debug log to check incoming data
    console.log(`[API] Create Goal - Product: ${productId}, Date: ${targetDate}`);

    if (!productId) 
      return NextResponse.json({ error: "productId is required" }, { status: 400 });

    const amountNum = Number(targetAmount);

    // ================== CASE 1: Updating a Draft ==================
    if (status === "SAVED") {
      // Find existing draft goal for this product & user
      const existingDraft = await prisma.goal.findFirst({
        where: { userId, productId, status: "SAVED" } 
      });

      if (existingDraft) {
        // Update draft goal
        const updatedDraft = await prisma.goal.update({
          where: { id: existingDraft.id },
          data: {
            targetAmount: amountNum,
            endDate: targetDate ? new Date(targetDate) : existingDraft.endDate,
          },
        });
        return NextResponse.json({ message: "Draft updated", goal: normalize(updatedDraft) });
      }
    }

    // ================== CASE 2: Starting a New Goal ==================
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) 
      return NextResponse.json({ error: "Product not found" }, { status: 404 });

    // Ensure valid Date object or null
    const finalEndDate = targetDate ? new Date(targetDate) : null;

    // Use Prisma transaction to create goal & price lock atomically
    const result = await prisma.$transaction(async (tx) => {
      // Create new goal
      const newGoal = await tx.goal.create({
        data: {
          userId,
          productId,
          targetAmount: amountNum,
          endDate: finalEndDate, // Save goal's end date
          status: status,
          saved: 0, // Initially zero saved
          lockedPrice: product.price, // Lock the product price
          priceLocked: true,
        },
      });

      // Create a price lock record for this goal
      await tx.priceLock.create({
        data: {
          productId,
          goalId: newGoal.id,
          lockedPrice: product.price,
          originalPrice: product.price,
          lockedBy: userId,
          status: "ACTIVE",
          storeId: product.storeId,
          expiresAt: finalEndDate, // Expiry of price lock syncs with goal's end date
        },
      });

      return newGoal; // Return the newly created goal
    });

    // Respond with the newly created goal
    return NextResponse.json({ message: "New goal created", goal: normalize(result) });

  } catch (err) {
    // Log error for debugging
    console.error("set-goal POST error:", err);
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}
