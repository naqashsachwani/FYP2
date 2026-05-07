import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const { userId } = getAuth(req);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Fetch Store without the fragile 'include' relation
    const store = await prisma.store.findUnique({
      where: { userId: userId },
    });

    if (!store) {
      return NextResponse.json({
        dashboardData: {
          totalProducts: 0,
          totalEarnings: 0,
          availableBalance: 0,
          totalWithdrawn: 0,
          totalPenalties: 0,
          totalOrders: 0,
          ordersDelivered: 0,
          pendingDeliveries: 0,
          allOrders: [],
        },
      });
    }

    // 2. Fetch all related data safely using direct queries
    const [
      totalProducts,
      financialRecords,
      deliveryStats,
      penaltyRecords,
      storePayouts // ✅ Fetched directly to bypass schema errors
    ] = await prisma.$transaction([
      prisma.product.count({
        where: { storeId: store.id },
      }),
      prisma.escrow.findMany({
        where: { goal: { product: { storeId: store.id } } },
        select: {
          status: true,
          amount: true,
          netAmount: true,
          releasedAt: true,
          createdAt: true,
        },
      }),
      prisma.delivery.findMany({
        where: { goal: { product: { storeId: store.id } } },
        select: { status: true },
      }),
      prisma.refund.findMany({
        where: { storeId: store.id, status: "COMPLETED" },
        select: { amount: true, createdAt: true },
      }),
      prisma.storePayout.findMany({
        where: { storeId: store.id }
      })
    ]);

    let totalEarnings = 0;
    let totalPenalties = 0;
    const allOrders = [];

    financialRecords.forEach((record) => {
      if (record.status === "RELEASED") {
        totalEarnings += Number(record.netAmount);
        allOrders.push({
          createdAt: record.releasedAt || record.createdAt,
          total: Number(record.netAmount),
        });
      } else if (record.status === "REFUNDED") {
        totalEarnings += Number(record.amount) * 0.10;
        allOrders.push({
          createdAt: record.releasedAt || record.createdAt,
          total: Number(record.amount) * 0.10,
        });
      }
    });

    penaltyRecords.forEach((record) => {
      totalPenalties += Number(record.amount);
      allOrders.push({
        createdAt: record.createdAt,
        total: -Number(record.amount),
      });
    });

    // Extract bonuses safely from the new direct query
    const bonuses = storePayouts.filter((p) => p.type === "BONUS");
    bonuses.forEach((b) => {
      totalEarnings += Number(b.amount);
      allOrders.push({
        createdAt: b.createdAt,
        total: Number(b.amount),
      });
    });

    const totalWithdrawn = storePayouts
      .filter((p) => p.type === "WITHDRAWAL")
      .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

    totalEarnings -= totalPenalties;
    const availableBalance = totalEarnings - totalWithdrawn;

    let ordersDelivered = 0;
    let pendingDeliveries = 0;

    deliveryStats.forEach((d) => {
      const status = d.status?.toUpperCase();
      if (status === "DELIVERED") {
        ordersDelivered++;
      } else if (["PENDING", "DISPATCHED", "IN_TRANSIT", "IN TRANSIT"].includes(status)) {
        pendingDeliveries++;
      }
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
        allOrders,
      },
    });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}