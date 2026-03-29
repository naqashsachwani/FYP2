import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import crypto from "crypto";

// Helper: Normalize Prisma Decimals
const normalize = (obj) => JSON.parse(
  JSON.stringify(obj, (key, value) => 
    (typeof value === 'object' && value !== null && value.type === 'Decimal') 
      ? Number(value) 
      : value
  )
);

export async function POST(req, { params }) {
  const { goalId } = await params;
  const { userId } = getAuth(req);

  if (!userId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  try {
    const { amount } = await req.json();
    const depositAmount = Number(amount);

    if (!depositAmount || depositAmount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // 1. Fetch Goal
    const goal = await prisma.goal.findUnique({ where: { id: goalId } });
    if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    if (goal.status === "COMPLETED") return NextResponse.json({ error: "Goal already completed." }, { status: 400 });

    const remainingAmount = Math.max(0, Number(goal.targetAmount) - Number(goal.saved));
    if (depositAmount > remainingAmount) {
      return NextResponse.json({ error: `Cannot exceed remaining target of Rs ${remainingAmount}` }, { status: 400 });
    }

    // 2. Fetch Wallet
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet || Number(wallet.balance) < depositAmount) {
      return NextResponse.json({ error: "Insufficient wallet balance" }, { status: 400 });
    }

    // 3. Execute Transaction
    const result = await prisma.$transaction(async (tx) => {
      // A. Deduct from Wallet
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: depositAmount } }
      });

      // B. Record Wallet Transaction
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: depositAmount,
          type: "DEPOSIT_PAYMENT",
          description: "Used Wallet balance for Goal Deposit",
          referenceId: goalId
        }
      });

      // C. Create Deposit Record
      const deposit = await tx.deposit.create({
        data: {
          goalId,
          userId,
          amount: depositAmount,
          paymentMethod: "WALLET",
          status: "COMPLETED",
          receiptNumber: `WAL-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
        },
      });

      // D. Update Goal Totals
      const totalSavedAgg = await tx.deposit.aggregate({
        _sum: { amount: true },
        where: { goalId },
      });
      const totalSavedAmount = Number(totalSavedAgg._sum.amount || 0);
      const newStatus = totalSavedAmount >= Number(goal.targetAmount) ? "COMPLETED" : goal.status;

      const updatedGoal = await tx.goal.update({
        where: { id: goalId },
        data: {
          saved: totalSavedAmount,
          status: newStatus,
          endDate: newStatus === "COMPLETED" ? new Date() : null,
        },
        include: { deposits: true, product: true },
      });

      // E. Sync Escrow
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

      // F. Notification if completed
      if (newStatus === "COMPLETED") {
        await tx.notification.create({
          data: {
            userId, goalId, type: "GOAL_COMPLETE", title: "Goal Completed 🎉",
            message: "Congratulations! Your savings goal is now complete.",
          },
        });
      }

      return { updatedGoal, deposit };
    });

    return NextResponse.json({
      success: true,
      goalCompleted: result.updatedGoal.status === "COMPLETED",
      goal: normalize(result.updatedGoal),
      deposit: normalize(result.deposit),
    });

  } catch (error) {
    console.error("Wallet Deposit Error:", error);
    return NextResponse.json({ error: "Failed to process wallet deposit" }, { status: 500 });
  }
}