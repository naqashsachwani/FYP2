import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { sendNotification } from "@/lib/sendNotification";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const { userId } = getAuth(req);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Fetch Store Safely
    const store = await prisma.store.findUnique({
      where: { userId: userId },
    });

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    // 2. Fetch Payouts explicitly to avoid relation crashes
    const storePayouts = await prisma.storePayout.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: "desc" }
    });

    const payouts = await prisma.escrow.findMany({
      where: {
        status: { in: ["RELEASED", "REFUNDED"] },
        goal: { product: { storeId: store.id } },
      },
      include: {
        goal: {
          include: {
            product: { select: { name: true, images: true } },
            user: { select: { name: true } },
          },
        },
      },
    });

    const pending = await prisma.escrow.findMany({
      where: {
        status: "HELD",
        goal: {
          product: { storeId: store.id },
          delivery: { status: "DELIVERED" },
        },
      },
    });

    const penalties = await prisma.refund.findMany({
      where: { 
        storeId: store.id, 
        status: "COMPLETED" 
      },
      include: {
        goal: {
          include: {
            product: { select: { name: true, images: true } },
            user: { select: { name: true } },
          },
        },
      },
    });

    // Safely filter the direct payouts array
    const dbWithdrawals = storePayouts.filter((p) => p.type === "WITHDRAWAL") || [];
    const dbBonuses = storePayouts.filter((p) => p.type === "BONUS") || [];

    const totalWithdrawn = dbWithdrawals.reduce((acc, curr) => acc + Number(curr.amount), 0);

    let totalRevenue = 0;
    let totalPlatformFees = 0;
    let totalDeductions = 0;

    let transactions = payouts.map((p) => {
      const total = Number(p.amount);
      let storeNet = 0;
      let adminFee = 0;
      let statusLabel = "PAID";

      if (p.status === "RELEASED") {
        adminFee = Number(p.platformFee);
        storeNet = Number(p.netAmount);
        statusLabel = "PAID";
        totalPlatformFees += adminFee;
      } else if (p.status === "REFUNDED") {
        storeNet = total * 0.10;
        adminFee = 0;
        statusLabel = "COMPENSATED";
      }

      totalRevenue += storeNet;

      return {
        id: p.id,
        goalId: p.goalId,
        date: p.releasedAt,
        productName: p.goal?.product?.name || "Unknown Product",
        productImage: p.goal?.product?.images?.[0] || "/placeholder.png",
        customerName: p.goal?.user?.name || "Unknown User",
        totalAmount: total,
        platformFee: adminFee,
        netPayout: storeNet,
        status: statusLabel,
      };
    });

    const penaltyTransactions = penalties.map((p) => {
      const penaltyAmount = Number(p.amount);
      totalDeductions += penaltyAmount;
      totalRevenue -= penaltyAmount;

      return {
        id: p.id,
        goalId: p.goalId,
        date: p.createdAt,
        productName: p.goal?.product?.name || "Unknown Product",
        productImage: p.goal?.product?.images?.[0] || "/placeholder.png",
        customerName: p.goal?.user?.name || "Unknown User",
        totalAmount: penaltyAmount,
        platformFee: 0,
        netPayout: -penaltyAmount,
        status: "PENALTY",
        reason: p.reason,
      };
    });

    const bonusTransactions = dbBonuses.map((b) => {
      const bonusAmount = Number(b.amount);
      totalRevenue += bonusAmount;

      return {
        id: b.id,
        goalId: "BONUS-PAYMENT",
        date: b.createdAt,
        productName: "Admin Bonus / Compensation",
        productImage: "/placeholder.png",
        customerName: "Platform Admin",
        totalAmount: bonusAmount,
        platformFee: 0,
        netPayout: bonusAmount,
        status: "COMPENSATED",
        reason: b.description,
      };
    });

    transactions = [...transactions, ...penaltyTransactions, ...bonusTransactions].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    const parsedWithdrawals = dbWithdrawals.map((w) => ({
      id: w.id,
      date: w.createdAt,
      amount: Number(w.amount),
      description: w.description,
    }));

    const pendingNet = pending.reduce((acc, curr) => acc + Number(curr.amount), 0) * 0.95;
    const availableBalance = totalRevenue - totalWithdrawn;
    const normalize = (val) => Number(val || 0);

    return NextResponse.json({
      storeName: store.name,
      stats: {
        totalRevenue: normalize(totalRevenue),
        availableBalance: normalize(availableBalance),
        totalWithdrawn: normalize(totalWithdrawn),
        platformFees: normalize(totalPlatformFees),
        totalDeductions: normalize(totalDeductions),
        pendingPayouts: normalize(pendingNet),
        completedOrders: payouts.length,
      },
      transactions: transactions,
      withdrawals: parsedWithdrawals,
    });
  } catch (error) {
    console.error("Store Revenue Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const store = await prisma.store.findUnique({
      where: { userId },
    });

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    // Direct Query safely bypasses relation bugs
    const storePayouts = await prisma.storePayout.findMany({
      where: { storeId: store.id }
    });

    const { amount, accountName, accountNumber } = await req.json();
    const withdrawAmount = Number(amount);

    const payouts = await prisma.escrow.findMany({
      where: {
        status: { in: ["RELEASED", "REFUNDED"] },
        goal: { product: { storeId: store.id } },
      },
    });

    let totalRev = 0;

    payouts.forEach((p) => {
      if (p.status === "RELEASED") {
        totalRev += Number(p.netAmount);
      }
      if (p.status === "REFUNDED") {
        totalRev += Number(p.amount) * 0.10;
      }
    });

    const penalties = await prisma.refund.findMany({
      where: { 
        storeId: store.id, 
        status: "COMPLETED" 
      },
    });

    const penaltySum = penalties.reduce((sum, p) => sum + Number(p.amount), 0);
    totalRev -= penaltySum;

    const totalBonuses = storePayouts
      .filter((p) => p.type === "BONUS")
      .reduce((sum, t) => sum + Number(t.amount), 0);
      
    totalRev += totalBonuses;

    const totalWithdrawn = storePayouts
      .filter((p) => p.type === "WITHDRAWAL")
      .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

    const availableBalance = totalRev - totalWithdrawn;

    if (withdrawAmount > availableBalance) {
      return NextResponse.json({ error: "Insufficient funds" }, { status: 400 });
    }

    await prisma.storePayout.create({
      data: {
        storeId: store.id,
        amount: withdrawAmount,
        type: "WITHDRAWAL",
        status: "COMPLETED",
        description: `Bank Transfer to ${accountName} (${accountNumber.slice(-4)})`,
      },
    });

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (user?.email) {
      await sendNotification({
        userId: userId,
        email: user.email,
        title: "Funds Withdrawn Successfully 💸",
        message: `You have successfully withdrawn Rs ${withdrawAmount.toLocaleString()} to account ending in ${accountNumber.slice(-4)}. The funds will reflect in your bank account shortly.`,
        type: "WITHDRAWAL_SUCCESS",
        notifyInApp: true,
        notifyEmail: true,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Store Withdraw Error:", error);
    return NextResponse.json({ error: "Failed to process withdrawal" }, { status: 500 });
  }
}