import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(req) {
  const { userId } = getAuth(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // 1. Find Store
    const store = await prisma.store.findUnique({
      where: { userId: userId },
      select: { id: true, name: true }
    });

    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

    // 2. Fetch Payouts (RELEASED OR REFUNDED)
    const payouts = await prisma.escrow.findMany({
      where: {
        status: { in: ["RELEASED", "REFUNDED"] },
        goal: { product: { storeId: store.id } }
      },
      include: {
        goal: {
          include: {
            product: { select: { name: true, images: true } },
            user: { select: { name: true } },
          }
        }
      }
    });

    // 3. Fetch Pending Payouts
    const pending = await prisma.escrow.findMany({
      where: {
        status: "HELD",
        goal: {
            product: { storeId: store.id },
            delivery: { status: "DELIVERED" }
        }
      }
    });

    // 4. Fetch Penalties (Deductions from Store Revenue)
    const penalties = await prisma.refund.findMany({
      where: { storeId: store.id, status: "COMPLETED" },
      include: {
        goal: {
          include: {
            product: { select: { name: true, images: true } },
            user: { select: { name: true } }
          }
        }
      }
    });

    // 5. Calculate Stats & Map Transactions
    let totalRevenue = 0;
    let totalPlatformFees = 0;
    let totalDeductions = 0;
    
    let transactions = payouts.map(p => {
        const total = Number(p.amount);
        let storeNet = 0;
        let adminFee = 0; 
        let statusLabel = "PAID";

        if (p.status === "RELEASED") {
            adminFee = Number(p.platformFee); 
            storeNet = Number(p.netAmount);   
            statusLabel = "PAID";
            totalPlatformFees += adminFee; 
        } 
        else if (p.status === "REFUNDED") {
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
            status: statusLabel 
        };
    });

    // Inject Penalties into Transaction Ledger
    const penaltyTransactions = penalties.map(p => {
        const penaltyAmount = Number(p.amount);
        totalDeductions += penaltyAmount;
        totalRevenue -= penaltyAmount; // Deduct from total net revenue

        return {
            id: p.id,
            goalId: p.goalId,
            date: p.createdAt,
            productName: p.goal?.product?.name || "Unknown Product",
            productImage: p.goal?.product?.images?.[0] || "/placeholder.png",
            customerName: p.goal?.user?.name || "Unknown User",
            totalAmount: penaltyAmount,
            platformFee: 0,
            netPayout: -penaltyAmount, // Negative to signify deduction
            status: "PENALTY",
            reason: p.reason
        };
    });

    // Merge and sort all transactions by Date
    transactions = [...transactions, ...penaltyTransactions].sort((a, b) => new Date(b.date) - new Date(a.date));

    // Calculate Pending (Est 95%)
    const pendingGross = pending.reduce((acc, curr) => acc + Number(curr.amount), 0);
    const pendingNet = pendingGross * 0.95;

    const normalize = (val) => Number(val || 0);

    return NextResponse.json({
      storeName: store.name,
      stats: {
        totalRevenue: normalize(totalRevenue),
        platformFees: normalize(totalPlatformFees), 
        totalDeductions: normalize(totalDeductions), // Sent to new card
        pendingPayouts: normalize(pendingNet),
        completedOrders: transactions.length
      },
      transactions: transactions
    });

  } catch (error) {
    console.error("Store Revenue Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}