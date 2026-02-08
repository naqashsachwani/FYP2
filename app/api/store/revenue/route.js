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
      orderBy: { releasedAt: 'desc' },
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

    // 4. Calculate Stats & Map Transactions
    let totalRevenue = 0;
    let totalPlatformFees = 0;
    
    const transactions = payouts.map(p => {
        const total = Number(p.amount);
        let storeNet = 0;
        let adminFee = 0; // This is what shows in the table column
        let statusLabel = "PAID";

        if (p.status === "RELEASED") {
            // --- DELIVERED: Store pays 5% fee ---
            adminFee = Number(p.platformFee); 
            storeNet = Number(p.netAmount);   
            statusLabel = "PAID";

            // ✅ Add to Fees Card (Store actually paid this)
            totalPlatformFees += adminFee; 
        } 
        else if (p.status === "REFUNDED") {
            // --- CANCELLED: Store receives 10% free ---
            storeNet = total * 0.10; 
            adminFee = 0; // Visual fix: Store didn't "pay" a fee here, they just got a cut
            statusLabel = "COMPENSATED";

            // ❌ DO NOT add to Fees Card (Store didn't pay anything)
        }

        // Add to Total Earnings Card
        totalRevenue += storeNet;

        return {
            id: p.id,
            goalId: p.goalId,
            date: p.releasedAt,
            productName: p.goal?.product?.name || "Unknown Product",
            productImage: p.goal?.product?.images?.[0] || "/placeholder.png",
            customerName: p.goal?.user?.name || "Unknown User",
            totalAmount: total,
            platformFee: adminFee, // Passed to frontend table
            netPayout: storeNet,
            status: statusLabel 
        };
    });

    // Calculate Pending (Est 95%)
    const pendingGross = pending.reduce((acc, curr) => acc + Number(curr.amount), 0);
    const pendingNet = pendingGross * 0.95;

    const normalize = (val) => Number(val || 0);

    return NextResponse.json({
      storeName: store.name,
      stats: {
        totalRevenue: normalize(totalRevenue),
        platformFees: normalize(totalPlatformFees), // Now correctly excludes refund shares
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