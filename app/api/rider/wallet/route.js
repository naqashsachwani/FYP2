import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import authRider from '@/middlewares/authRider';
import { sendNotification } from "@/lib/sendNotification"; // ✅ Added Notification System

export async function GET(req) {
  try {
    const { userId } = getAuth(req);
    const riderId = await authRider(userId);
    
    if (!riderId) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const payouts = await prisma.riderPayout.findMany({
        where: { riderId: riderId },
        orderBy: { createdAt: 'desc' }
    });

    const earnings = payouts.filter(p => p.type === 'EARNING').reduce((acc, curr) => acc + curr.amount, 0);
    const withdrawals = payouts.filter(p => p.type === 'WITHDRAWAL').reduce((acc, curr) => acc + curr.amount, 0);
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
    
    if (!riderId) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const userRecord = await prisma.user.findUnique({ where: { id: userId } });

    const { amount, payoutMethod, accountName, accountNumber } = await req.json();
    const withdrawAmount = Number(amount);

    const payouts = await prisma.riderPayout.findMany({ where: { riderId: riderId } });
    const earnings = payouts.filter(p => p.type === 'EARNING').reduce((sum, p) => sum + p.amount, 0);
    const withdrawals = payouts.filter(p => p.type === 'WITHDRAWAL').reduce((sum, p) => sum + p.amount, 0);
    const currentBalance = earnings - withdrawals;

    if (withdrawAmount > currentBalance) {
        return NextResponse.json({ error: "Insufficient funds" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.riderPayout.create({
         data: {
           riderId: riderId,
           amount: withdrawAmount,
           type: "WITHDRAWAL",
           status: "PENDING",
           description: `Bank Transfer to ${accountName} (${accountNumber.slice(-4)})`
         }
      });

      await tx.riderProfile.update({
         where: { id: riderId },
         data: { walletBalance: { decrement: withdrawAmount } }
      });
    });

    // ✅ NOTIFY RIDER OF WITHDRAWAL REQUEST
    if (userRecord?.email) {
        await sendNotification({
            userId: userId,
            email: userRecord.email,
            title: "Withdrawal Requested 💸",
            message: `Your request to withdraw Rs ${withdrawAmount.toLocaleString()} to account ending in ${accountNumber.slice(-4)} has been successfully submitted. It is currently pending processing.`,
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