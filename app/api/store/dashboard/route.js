import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic"; 

export async function GET(req) {
  const { userId } = getAuth(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // ✅ FETCH STORE ALONG WITH ITS DEDICATED PAYOUTS
    const store = await prisma.store.findUnique({
      where: { userId: userId },
      select: { id: true, payouts: true } 
    });

    if (!store) {
      return NextResponse.json({
        dashboardData: {
          totalProducts: 0, totalEarnings: 0, availableBalance: 0, totalWithdrawn: 0,
          totalPenalties: 0, totalOrders: 0, ordersDelivered: 0, pendingDeliveries: 0, allOrders: []
        }
      });
    }

    const [totalProducts, financialRecords, deliveryStats, penaltyRecords] = await prisma.$transaction([
      prisma.product.count({ where: { storeId: store.id } }),

      prisma.escrow.findMany({
        where: { goal: { product: { storeId: store.id } } },
        select: { status: true, amount: true, netAmount: true, releasedAt: true, createdAt: true }
      }),

      prisma.delivery.findMany({
        where: { goal: { product: { storeId: store.id } } },
        select: { status: true }
      }),

      prisma.refund.findMany({
        where: { storeId: store.id, status: "COMPLETED" },
        select: { amount: true, createdAt: true }
      })
    ]);

    let totalEarnings = 0;
    let totalPenalties = 0;
    const allOrders = [];

    financialRecords.forEach(record => {
      const gross = Number(record.amount);
      const net = Number(record.netAmount);

      if (record.status === "RELEASED") {
        totalEarnings += net; 
        allOrders.push({ createdAt: record.releasedAt || record.createdAt, total: net });
      } 
      else if (record.status === "REFUNDED") {
        const compensation = gross * 0.10;
        totalEarnings += compensation;
        allOrders.push({ createdAt: record.releasedAt || record.createdAt, total: compensation });
      }
    });

    penaltyRecords.forEach(record => {
      const penaltyAmount = Number(record.amount);
      totalPenalties += penaltyAmount;
      allOrders.push({ createdAt: record.createdAt, total: -penaltyAmount });
    });

    // ✅ ISOLATED WITHDRAWAL MATH
    const totalWithdrawn = store.payouts.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

    totalEarnings -= totalPenalties; 
    const availableBalance = totalEarnings - totalWithdrawn; 

    let ordersDelivered = 0;
    let pendingDeliveries = 0;

    deliveryStats.forEach(d => {
        const status = d.status?.toUpperCase();
        if (status === 'DELIVERED') ordersDelivered++;
        else if (['PENDING', 'DISPATCHED', 'IN_TRANSIT', 'IN TRANSIT'].includes(status)) pendingDeliveries++;
    });

    return NextResponse.json({
      dashboardData: {
        totalProducts,
        totalEarnings: Math.round(totalEarnings),
        availableBalance: Math.round(availableBalance), 
        totalWithdrawn: Math.round(totalWithdrawn), 
        totalPenalties: Math.round(totalPenalties),
        totalOrders: ordersDelivered + pendingDeliveries, 
        ordersDelivered,
        pendingDeliveries,
        allOrders
      }
    });

  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}