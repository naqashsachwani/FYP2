import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { sendNotification } from "@/lib/sendNotification"; // ✅ IMPORT ENGINE

export async function POST(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { amount, payoutMethod, accountName, accountNumber } = await req.json();
    const withdrawAmount = Number(amount);

    if (!withdrawAmount || withdrawAmount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    
    if (!payoutMethod || !accountName || !accountNumber) {
      return NextResponse.json({ error: "Please provide all account details." }, { status: 400 });
    }

    // 1. Check wallet balance
    const wallet = await prisma.wallet.findUnique({ 
        where: { userId },
        include: { user: true } // ✅ INCLUDE USER FOR EMAIL
    });
    
    if (!wallet || Number(wallet.balance) < withdrawAmount) {
      return NextResponse.json({ error: "Insufficient wallet balance" }, { status: 400 });
    }

    // 2. Update the local database
    await prisma.$transaction(async (tx) => {
      // Deduct from wallet
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: withdrawAmount } },
      });

      // Log the withdrawal with the user's bank details so Admin knows where to send it
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: withdrawAmount, 
          type: "WITHDRAWAL",
          description: `Withdrawal to ${payoutMethod} (${accountNumber} - ${accountName})`,
        },
      });
    });

    // ✅ FIRE ENGINE: Notify user that the withdrawal request was received
    if (wallet.user) {
        await sendNotification({
            userId: wallet.user.id,
            email: wallet.user.email,
            title: "Withdrawal Requested 🏦",
            message: `Your request to withdraw Rs ${withdrawAmount.toLocaleString()} to your ${payoutMethod} account has been received and is pending admin approval.`,
            type: "SYSTEM_ALERT",
            notifyInApp: true,
            notifyEmail: true
        });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Withdrawal request submitted successfully.",
    });

  } catch (error) {
    console.error("Withdrawal Error:", error);
    return NextResponse.json({ error: "Failed to process withdrawal request" }, { status: 500 });
  }
}