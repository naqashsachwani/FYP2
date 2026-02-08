import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// --- HELPER: AUTO-SYNC FUNCTION ---
async function runAutoSync() {
  try {
    const missingEscrows = await prisma.goal.findMany({
      where: { saved: { gt: 0 }, escrow: null }
    });

    if (missingEscrows.length > 0) {
      for (const goal of missingEscrows) {
         let status = "HELD";
         if (goal.status === "COMPLETED") status = "RELEASED"; 
         if (goal.status === "REFUNDED") status = "REFUNDED";

         await prisma.escrow.create({
           data: {
             goalId: goal.id,
             amount: goal.saved,
             status: status,
             currency: "PKR",
             releasedAt: status === "RELEASED" || status === "REFUNDED" ? goal.updatedAt : null
           }
         });
      }
    }
  } catch (e) { console.warn("Auto-Sync Warning:", e.message); }
}

export async function GET(req) {
  const { userId } = getAuth(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await runAutoSync(); 

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const filter = searchParams.get("filter") || "ALL";

  try {
    const normalize = (val) => Number(val || 0);

    // 1. Stats
    const earningsAgg = await prisma.escrow.aggregate({
      _sum: { platformFee: true },
      where: { status: { in: ["RELEASED", "REFUNDED"] } }
    });
    const depositsAgg = await prisma.escrow.aggregate({
      _sum: { amount: true },
      where: { status: "HELD" }
    });

    // 2. Pending Actions
    const pendingReleases = await prisma.escrow.findMany({
      where: { status: "HELD", goal: { delivery: { status: "DELIVERED" } } },
      include: { goal: { include: { user: true, product: { include: { store: true } } } } }
    });

    const pendingRefunds = await prisma.refundRequest.findMany({
      where: { status: "REQUESTED" },
      include: { user: true, goal: { include: { product: true } } }
    });

    // 3. Paginated History
    let whereClause = {};
    if (filter === "ACTIVE") whereClause = { status: "HELD" };
    if (filter === "HISTORY") whereClause = { status: { in: ["RELEASED", "REFUNDED"] } };

    const totalRecords = await prisma.escrow.count({ where: whereClause });
    
    const paginatedHistory = await prisma.escrow.findMany({
      where: whereClause,
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { updatedAt: 'desc' },
      include: {
        goal: {
          include: {
            user: { select: { name: true } },
            product: { 
              // ✅ FIX: Removed 'name: true' from here. 
              // 'include' fetches all scalar fields (like name) automatically.
              include: { 
                store: { select: { name: true } } 
              } 
            } 
          }
        }
      }
    });

    // 4. Response Construction
    const actionable = [
        ...pendingReleases.map(e => ({
            id: e.id, sourceTable: "ESCROW", goalId: e.goalId, amount: normalize(e.amount),
            type: "RELEASE", 
            customerName: e.goal?.user?.name, 
            storeName: e.goal?.product?.store?.name, 
            productName: e.goal?.product?.name
        })),
        ...pendingRefunds.map(r => ({
            id: r.id, sourceTable: "REFUND_REQUEST", goalId: r.goalId, amount: normalize(r.amount),
            type: "REFUND", 
            customerName: r.user?.name, 
            storeName: "N/A", 
            productName: r.goal?.product?.name 
        }))
    ];

    return NextResponse.json({
      stats: {
        totalEarnings: normalize(earningsAgg._sum.platformFee),
        totalHeld: normalize(depositsAgg._sum.amount),
        pendingActions: actionable.length
      },
      actionable: actionable,
      history: {
        data: paginatedHistory.map(e => ({
          id: e.id,
          goalId: e.goalId,
          amount: normalize(e.amount),
          platformFee: normalize(e.platformFee),
          netAmount: normalize(e.netAmount),
          status: e.status,
          date: e.releasedAt || e.heldSince || e.createdAt,
          customerName: e.goal?.user?.name || "Unknown",
          storeName: e.goal?.product?.store?.name || "Unknown",
          productName: e.goal?.product?.name || "Unknown Product" 
        })),
        totalPages: Math.ceil(totalRecords / limit),
        currentPage: page,
        totalRecords: totalRecords
      }
    });

  } catch (error) {
    console.error("Escrow Fetch Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}