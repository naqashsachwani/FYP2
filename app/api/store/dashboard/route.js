import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(req) {
  const { userId } = getAuth(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // 1. Get Store ID
    const store = await prisma.store.findUnique({
      where: { userId: userId },
      select: { id: true }
    });

    if (!store) {
      return NextResponse.json({
        dashboardData: {
          totalProducts: 0,
          totalEarnings: 0,
          totalOrders: 0,
          ordersDelivered: 0,
          pendingDeliveries: 0,
          allOrders: []
        }
      });
    }

    // 2. Run Parallel Queries
    const [totalProducts, financialRecords, deliveryStats] = await prisma.$transaction([
      // A. Count Products
      prisma.product.count({ where: { storeId: store.id } }),

      // B. Fetch Escrow Records (For Earnings Calculation Only)
      prisma.escrow.findMany({
        where: {
          goal: { product: { storeId: store.id } }
        },
        select: {
          status: true,      // HELD, RELEASED, REFUNDED
          amount: true,      // Total amount
          netAmount: true,   // Amount after fees
          releasedAt: true,  
          createdAt: true    
        }
      }),

      // C. Fetch Delivery Records (For Order Counts Only - Matches Order Page)
      prisma.delivery.findMany({
        where: {
          goal: { product: { storeId: store.id } }
        },
        select: {
          status: true // Pending, Dispatched, In_Transit, Delivered
        }
      })
    ]);

    // 3. Process Financial Data (Earnings)
    let totalEarnings = 0;
    const allOrders = [];

    financialRecords.forEach(record => {
      const gross = Number(record.amount);
      const net = Number(record.netAmount);

      if (record.status === "RELEASED") {
        totalEarnings += net; // Store gets ~95%
        allOrders.push({
          createdAt: record.releasedAt || record.createdAt,
          total: net
        });
      } 
      else if (record.status === "REFUNDED") {
        const compensation = gross * 0.10;
        totalEarnings += compensation;
        allOrders.push({
          createdAt: record.releasedAt || record.createdAt,
          total: compensation
        });
      }
    });

    // 4. Process Delivery Data (Order Counts)
    let ordersDelivered = 0;
    let pendingDeliveries = 0;

    deliveryStats.forEach(d => {
        // Normalize status check (case insensitive just in case)
        const status = d.status?.toUpperCase();

        if (status === 'DELIVERED') {
            ordersDelivered++;
        } else if (['PENDING', 'DISPATCHED', 'IN_TRANSIT', 'IN TRANSIT'].includes(status)) {
            pendingDeliveries++;
        }
    });

    const totalOrders = ordersDelivered + pendingDeliveries;

    return NextResponse.json({
      dashboardData: {
        totalProducts,
        totalEarnings: Math.round(totalEarnings),
        totalOrders, 
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