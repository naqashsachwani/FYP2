import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import authRider from '@/middlewares/authRider';
import { sendNotification } from "@/lib/sendNotification";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { userId } = getAuth(req);
    const riderId = await authRider(userId);
    
    if (!riderId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const payouts = await prisma.riderPayout.findMany({
      where: { riderId: riderId },
      orderBy: { createdAt: 'desc' }
    });

    let earnings = 0;
    let withdrawals = 0;

    // ✅ FIXED: Both Earnings and Withdrawals use "TRANSFERRED" as their success state
    payouts.forEach((p) => {
      if (p.type === 'EARNING' && p.status === 'TRANSFERRED') {
        earnings += p.amount;
      } else if (p.type === 'WITHDRAWAL' && p.status === 'TRANSFERRED') {
        withdrawals += p.amount;
      }
    });

    const dynamicBalance = earnings - withdrawals;

    return NextResponse.json({
      balance: dynamicBalance,
      transactions: payouts 
    });

  } catch (error) {
    console.error("Rider Wallet Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { userId } = getAuth(req);
    const riderId = await authRider(userId);
    
    if (!riderId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const userRecord = await prisma.user.findUnique({ 
      where: { id: userId } 
    });

    const { amount, payoutMethod, accountName, accountNumber } = await req.json();
    const withdrawAmount = Number(amount);

    const payouts = await prisma.riderPayout.findMany({ 
      where: { riderId: riderId } 
    });

    let earnings = 0;
    let withdrawals = 0;

    // ✅ FIXED: Using "TRANSFERRED" for the balance check calculations
    payouts.forEach((p) => {
      if (p.type === 'EARNING' && p.status === 'TRANSFERRED') {
        earnings += p.amount;
      } else if (p.type === 'WITHDRAWAL' && p.status === 'TRANSFERRED') {
        withdrawals += p.amount;
      }
    });

    const currentBalance = earnings - withdrawals;

    if (withdrawAmount > currentBalance) {
      return NextResponse.json({ error: "Insufficient funds" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      // ✅ FIXED: Status changed from "COMPLETED" to "TRANSFERRED"
      await tx.riderPayout.create({
        data: {
          riderId: riderId,
          amount: withdrawAmount,
          type: "WITHDRAWAL",
          status: "TRANSFERRED",
          description: `Bank Transfer to ${accountName} (${accountNumber.slice(-4)})`
        }
      });

      await tx.riderProfile.update({
        where: { id: riderId },
        data: { walletBalance: { decrement: withdrawAmount } }
      });
    });

    if (userRecord?.email) {
      await sendNotification({
        userId: userId,
        email: userRecord.email,
        title: "Funds Withdrawn Successfully 💸",
        message: `You have successfully withdrawn Rs ${withdrawAmount.toLocaleString()} to account ending in ${accountNumber.slice(-4)}. The funds will reflect in your bank account shortly.`,
        type: "SYSTEM_ALERT",
        notifyInApp: true,
        notifyEmail: true
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Rider Withdrawal Error:", error);
    return NextResponse.json({ error: "Failed to process withdrawal" }, { status: 500 });
  }
}