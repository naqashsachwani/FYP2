import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { sendNotification } from "@/lib/sendNotification"; 
import { depositConfirmationTemplate } from "@/lib/emailTemplates"; 

// Helper: Normalize Prisma Decimals to Numbers
const normalize = (obj) => JSON.parse(
  JSON.stringify(obj, (key, value) => 
    (typeof value === 'object' && value !== null && value.type === 'Decimal') 
      ? Number(value) 
      : value
  )
);

/* ===================== GET GOAL DETAILS ===================== */
export async function GET(req, { params }) {
  const { goalId } = await params; 
  const { userId } = getAuth(req);

  if (!userId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  
  try {
    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: { 
        deposits: { orderBy: { createdAt: 'desc' } }, 
        product: { include: { store: true } }, 
        delivery: true 
      },
    });

    if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

    const saved = Number(goal.saved);
    const target = Number(goal.targetAmount);
    const progressPercent = target > 0 ? (saved / target) * 100 : 0;

    return NextResponse.json({ 
      goal: normalize({ ...goal, progressPercent }) 
    });
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

/* ===================== ADD DEPOSIT ===================== */
export async function POST(req, { params }) {
  const { goalId } = await params; 
  const { userId } = getAuth(req);

  if (!userId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  try {
    const body = await req.json();
    const amount = Number(body.amount);

    if (!amount || amount <= 0) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });

    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
    });

    if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

    if (goal.status === "COMPLETED") {
      return NextResponse.json({ error: "Goal already completed." }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
        // 1. Create deposit
        const deposit = await tx.deposit.create({
          data: {
            goalId,
            userId,
            amount,
            paymentMethod: body.paymentMethod || "STRIPE",
            status: "COMPLETED",
            receiptNumber: crypto.randomUUID(),
          },
        });

        // 2. Update Totals
        const totalSavedAgg = await tx.deposit.aggregate({
          _sum: { amount: true },
          where: { goalId },
        });
        const totalSavedAmount = Number(totalSavedAgg._sum.amount || 0);

        const newStatus = totalSavedAmount >= Number(goal.targetAmount) ? "COMPLETED" : goal.status;

        // 3. Update Goal
        const updatedGoal = await tx.goal.update({
          where: { id: goalId },
          data: {
            saved: totalSavedAmount,
            status: newStatus,
            // ✅ FIXED: Removed the ternary operator that was wiping out the endDate (deadline) with null!
          },
          include: { deposits: true, product: true, user: true }, 
        });

        // 4. Sync Escrow Table
        const existingEscrow = await tx.escrow.findUnique({ where: { goalId } });
        if (existingEscrow) {
            await tx.escrow.update({
                where: { id: existingEscrow.id },
                data: { amount: totalSavedAmount }
            });
        } else {
            await tx.escrow.create({
                data: {
                    goalId,
                    amount: totalSavedAmount,
                    status: "HELD",
                    currency: "PKR"
                }
            });
        }

        return { updatedGoal, deposit };
    });

    // ==========================================
    // NOTIFICATIONS
    // ==========================================
    const savedGoal = result.updatedGoal;
    
    if (savedGoal.user) {
        await sendNotification({
            userId: savedGoal.user.id,
            email: savedGoal.user.email,
            title: "Payment Received! ",
            message: `Your deposit of Rs ${amount} was successful.`,
            html: depositConfirmationTemplate(
                savedGoal.user.name, 
                amount, 
                savedGoal.product?.name || "your goal", 
                savedGoal.saved, 
                savedGoal.targetAmount
            ),
            type: "DEPOSIT_CONFIRMATION",
            goalId: savedGoal.id,
            notifyInApp: true,
            notifyEmail: true
        });

        if (savedGoal.status === "COMPLETED") {
            await sendNotification({
                userId: savedGoal.user.id,
                email: savedGoal.user.email,
                title: "Goal Completed! ",
                message: "Congratulations! Your savings goal is now complete. You can now redeem your product.",
                type: "GOAL_COMPLETE",
                goalId: savedGoal.id,
                notifyInApp: true,
                notifyEmail: true
            });
        }
    }

    return NextResponse.json({
      success: true,
      goalCompleted: result.updatedGoal.status === "COMPLETED",
      goal: normalize(result.updatedGoal),
      deposit: normalize(result.deposit),
    });

  } catch (error) {
    console.error("Deposit Error:", error);
    return NextResponse.json({ error: "Failed to process deposit" }, { status: 500 });
  }
}

/* ===================== DELETE GOAL ===================== */
export async function DELETE(req, { params }) {
  const { goalId } = await params;
  const { userId } = getAuth(req);

  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const goal = await prisma.goal.findUnique({ 
        where: { id: goalId },
        include: { escrow: true, refundRequest: true, user: true, product: true } 
    });

    if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

    const savedAmount = Number(goal.saved);

    // 1. CLEAN DELETE
    if (savedAmount === 0) {
      await prisma.$transaction([
        prisma.priceLock.deleteMany({ where: { goalId } }),
        prisma.deposit.deleteMany({ where: { goalId } }),
        prisma.escrow.deleteMany({ where: { goalId } }),
        prisma.refundRequest.deleteMany({ where: { goalId } }), 
        prisma.goal.delete({ where: { id: goalId } }),
      ]);
      return NextResponse.json({ message: "Goal deleted successfully" });
    } 
    
    // 2. CREATE REFUND REQUEST
    else {
      if (goal.refundRequest) {
        return NextResponse.json({ message: "Refund request already pending." });
      }

      await prisma.$transaction(async (tx) => {
        await tx.refundRequest.create({
          data: {
            userId: userId,
            goalId: goalId,
            amount: savedAmount,
            reason: "User initiated cancellation",
            status: "REQUESTED"
          }
        });

        await tx.goal.update({
          where: { id: goalId },
          data: { status: "CANCELLED" }, 
        });

        if (goal.escrow) {
            await tx.escrow.update({
                where: { id: goal.escrow.id },
                data: { status: "HELD" }
            });
        }
      });

      if (goal.user) {
          await sendNotification({
              userId: goal.user.id,
              email: goal.user.email,
              title: "Cancellation & Refund Initiated",
              message: `You have successfully cancelled your goal for ${goal.product?.name}. Your refund request for Rs ${savedAmount.toLocaleString()} is now processing.`,
              type: "SYSTEM_ALERT",
              goalId: goal.id,
              notifyInApp: true,
              notifyEmail: true
          });
      }

      return NextResponse.json({ message: "Cancellation initiated. Refund Request created." });
    }
  } catch (error) {
    console.error("Delete Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}