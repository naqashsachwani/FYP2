import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { sendNotification } from "@/lib/sendNotification";

export const dynamic = "force-dynamic"; 

export async function GET(req) {
  const { userId } = getAuth(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // ✅ FETCH ISOLATED STORE PAYOUTS
    const store = await prisma.store.findUnique({
      where: { userId: userId },
      include: { payouts: { orderBy: { createdAt: 'desc' } } }
    });

    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const payouts = await prisma.escrow.findMany({
      where: { status: { in: ["RELEASED", "REFUNDED"] }, goal: { product: { storeId: store.id } } },
      include: { goal: { include: { product: { select: { name: true, images: true } }, user: { select: { name: true } } } } }
    });

    const pending = await prisma.escrow.findMany({
      where: { status: "HELD", goal: { product: { storeId: store.id }, delivery: { status: "DELIVERED" } } }
    });

    const penalties = await prisma.refund.findMany({
      where: { storeId: store.id, status: "COMPLETED" },
      include: { goal: { include: { product: { select: { name: true, images: true } }, user: { select: { name: true } } } } }
    });
    
    // ✅ CLEAN STORE-ONLY WITHDRAWALS
    const dbWithdrawals = store.payouts || [];
    const totalWithdrawn = dbWithdrawals.reduce((acc, curr) => acc + Number(curr.amount), 0);

    let totalRevenue = 0;
    let totalPlatformFees = 0;
    let totalDeductions = 0;
    
    let transactions = payouts.map(p => {
        const total = Number(p.amount);
        let storeNet = 0; let adminFee = 0; let statusLabel = "PAID";
        if (p.status === "RELEASED") { adminFee = Number(p.platformFee); storeNet = Number(p.netAmount); statusLabel = "PAID"; totalPlatformFees += adminFee; } 
        else if (p.status === "REFUNDED") { storeNet = total * 0.10; adminFee = 0; statusLabel = "COMPENSATED"; }
        totalRevenue += storeNet;
        return {
            id: p.id, goalId: p.goalId, date: p.releasedAt, productName: p.goal?.product?.name || "Unknown Product",
            productImage: p.goal?.product?.images?.[0] || "/placeholder.png", customerName: p.goal?.user?.name || "Unknown User",
            totalAmount: total, platformFee: adminFee, netPayout: storeNet, status: statusLabel 
        };
    });

    const penaltyTransactions = penalties.map(p => {
        const penaltyAmount = Number(p.amount);
        totalDeductions += penaltyAmount; totalRevenue -= penaltyAmount; 
        return {
            id: p.id, goalId: p.goalId, date: p.createdAt, productName: p.goal?.product?.name || "Unknown Product",
            productImage: p.goal?.product?.images?.[0] || "/placeholder.png", customerName: p.goal?.user?.name || "Unknown User",
            totalAmount: penaltyAmount, platformFee: 0, netPayout: -penaltyAmount, status: "PENALTY", reason: p.reason
        };
    });

    transactions = [...transactions, ...penaltyTransactions].sort((a, b) => new Date(b.date) - new Date(a.date));

    // ✅ SEPARATED WITHDRAWAL ARRAY FOR NEW UI SECTION
    const parsedWithdrawals = dbWithdrawals.map(w => ({
        id: w.id, date: w.createdAt, amount: Number(w.amount), description: w.description
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
        completedOrders: payouts.length
      },
      transactions: transactions,
      withdrawals: parsedWithdrawals 
    });

  } catch (error) {
    console.error("Store Revenue Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
    try {
        const { userId } = getAuth(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // ✅ FETCH STORE WITH PAYOUTS
        const store = await prisma.store.findUnique({ 
            where: { userId }, include: { payouts: true } 
        });
        
        if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

        const { amount, accountName, accountNumber } = await req.json();
        const withdrawAmount = Number(amount);

        const payouts = await prisma.escrow.findMany({
            where: { status: { in: ["RELEASED", "REFUNDED"] }, goal: { product: { storeId: store.id } } }
        });
        let totalRev = 0;
        payouts.forEach(p => {
            if (p.status === "RELEASED") totalRev += Number(p.netAmount);
            if (p.status === "REFUNDED") totalRev += Number(p.amount) * 0.10;
        });

        const penalties = await prisma.refund.findMany({ where: { storeId: store.id, status: "COMPLETED" } });
        const penaltySum = penalties.reduce((sum, p) => sum + Number(p.amount), 0);
        totalRev -= penaltySum;

        // ✅ ISOLATED STORE BALANCE CHECK
        const totalWithdrawn = store.payouts.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
        const availableBalance = totalRev - totalWithdrawn;

        if (withdrawAmount > availableBalance) {
            return NextResponse.json({ error: "Insufficient funds" }, { status: 400 });
        }

        // ✅ DIRECT STORE WITHDRAWAL CREATION (Never touches User Wallet)
        await prisma.storePayout.create({
            data: {
                storeId: store.id,
                amount: withdrawAmount,
                status: "COMPLETED", // Instant withdrawal!
                description: `Bank Transfer to ${accountName} (${accountNumber.slice(-4)})`
            }
        });

        // ✅ EMAIL AND IN-APP NOTIFICATION TRIGGERS HERE
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user?.email) {
            await sendNotification({
                userId: userId, 
                email: user.email, 
                title: "Funds Withdrawn Successfully 💸",
                message: `You have successfully withdrawn Rs ${withdrawAmount.toLocaleString()} to account ending in ${accountNumber.slice(-4)}. The funds will reflect in your bank account shortly.`,
                type: "WITHDRAWAL_SUCCESS", 
                notifyInApp: true, 
                notifyEmail: true
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Store Withdraw Error:", error);
        return NextResponse.json({ error: "Failed to process withdrawal" }, { status: 500 });
    }
}