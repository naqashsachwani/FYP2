import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { sendNotification } from "@/lib/sendNotification"; 
import { depositConfirmationTemplate } from "@/lib/emailTemplates"; 

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

    if (!amount || amount <= 0) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });

    // 1. Fetch Goal (Read operation outside transaction for speed)
    const goal = await prisma.goal.findUnique({ where: { id: goalId } });
    if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

    if (goal.status === "COMPLETED") {
      return NextResponse.json({ error: "Goal already completed." }, { status: 400 });
    }

    // 2. Start Transaction with INCREASED TIMEOUT
    const result = await prisma.$transaction(async (tx) => {
      
      // A. Create Deposit Record
      const newDeposit = await tx.deposit.create({
        data: {
          goalId,
          userId,
          amount,
          paymentMethod: "STRIPE",
          status: "COMPLETED",
          receiptNumber: crypto.randomUUID(),
        },
      });

      // B. Create Ledger Transaction (For Bookkeeping)
      await tx.transaction.create({
        data: {
          userId,
          goalId,
          amount,
          currency: "PKR",
          provider: "STRIPE",
          status: "COMPLETED",
          providerPaymentId: newDeposit.receiptNumber,
          metadata: { type: "GOAL_DEPOSIT", source: "STRIPE_CHECKOUT" },
        },
      });

      // C. Recalculate Total Saved
      const totalSavedAgg = await tx.deposit.aggregate({
        _sum: { amount: true },
        where: { goalId },
      });
      const totalSavedAmount = Number(totalSavedAgg._sum.amount || 0);

      // D. Determine New Status
      const isCompleted = totalSavedAmount >= Number(goal.targetAmount);
      const newStatus = isCompleted ? "COMPLETED" : "ACTIVE";

      // E. Update Goal
      const updatedGoal = await tx.goal.update({
        where: { id: goalId },
        data: {
          saved: totalSavedAmount,
          status: newStatus,
          endDate: isCompleted ? new Date() : undefined,
        },
        //  ADDED USER TO INCLUDE FOR NOTIFICATION EMAILS
        include: { deposits: true, product: true, user: true },
      });

      // F.  CRITICAL: Sync with Escrow Table (For Admin Dashboard)
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

      return updatedGoal;

    }, {
      maxWait: 5000, 
      timeout: 20000 //  FIXED: Increased timeout to 20s to prevent crashes
    });

    // ==========================================
    //  FIRE ENGINE: OUTSIDE TRANSACTION FOR SPEED
    // ==========================================
    
    // 1. Send Deposit Confirmation
    if (result.user) {
        await sendNotification({
            userId: result.user.id,
            email: result.user.email,
            title: "Payment Received! 💰",
            message: `Your deposit of Rs ${amount} was successful.`,
            html: depositConfirmationTemplate(
                result.user.name, 
                amount, 
                result.product?.name || "your goal", 
                result.saved, 
                result.targetAmount
            ),
            type: "DEPOSIT_CONFIRMATION",
            goalId: result.id,
            notifyInApp: true,
            notifyEmail: true
        });

        // 2. If Completed, Send Celebration Email!
        if (result.status === "COMPLETED") {
            await sendNotification({
                userId: result.user.id,
                email: result.user.email,
                title: "Goal Completed! 🎉",
                message: "Congratulations! Your savings goal is now complete. You can now redeem your product.",
                html: `
                  <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: #16a34a;">Congratulations, ${result.user.name}! 🎊</h2>
                    <p>You did it! You have successfully reached your savings target of <strong>Rs ${Number(result.targetAmount).toLocaleString()}</strong> for your <strong>${result.product?.name}</strong>.</p>
                    <p>Log into your dashboard now to enter your shipping address and redeem your item!</p>
                  </div>
                `,
                type: "GOAL_COMPLETE",
                goalId: result.id,
                notifyInApp: true,
                notifyEmail: true
            });
        }
    }

    return NextResponse.json({
      success: true,
      goalCompleted: result.status === "COMPLETED",
      goal: normalize(result),
    });

  } catch (error) {
    console.error("Confirm Error:", error);
    return NextResponse.json({ error: "Transaction failed" }, { status: 500 });
  }
}