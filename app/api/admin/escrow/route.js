import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const { userId } = getAuth(req);
  
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const filter = searchParams.get("filter") || "ALL";

  try {
    const normalize = (val) => Number(val || 0);

    const [
      earningsAgg, 
      depositsAgg, 
      riderPayoutsAgg, 
      storeBonusesAgg
    ] = await prisma.$transaction([
      prisma.escrow.aggregate({
        _sum: { platformFee: true },
        where: { status: { in: ["RELEASED", "REFUNDED"] } }
      }),
      prisma.escrow.aggregate({
        _sum: { amount: true },
        where: { status: "HELD" }
      }),
      prisma.riderPayout.aggregate({
        _sum: { amount: true },
        where: { status: "TRANSFERRED" }
      }),
      prisma.storePayout.aggregate({
        _sum: { amount: true },
        where: { type: "BONUS" } 
      })
    ]);

    const pendingReleases = await prisma.escrow.findMany({
      where: {
        status: "HELD",
        goal: { delivery: { status: "DELIVERED" } }
      },
      include: {
        goal: {
          include: {
            user: true,
            product: { include: { store: true } }
          }
        }
      }
    });

    const pendingRefunds = await prisma.refundRequest.findMany({
      where: { status: "REQUESTED" },
      include: {
        user: true,
        goal: { include: { product: true } }
      }
    });

    const pendingRiderPayouts = await prisma.riderPayout.findMany({
      where: { status: "PENDING" },
      include: {
        rider: { include: { user: true } },
        delivery: {
          include: {
            goal: { include: { product: true } }
          }
        }
      }
    });

    let whereClause = {};
    if (filter === "ACTIVE") {
      whereClause = { status: "HELD" };
    } else if (filter === "HISTORY") {
      whereClause = { status: { in: ["RELEASED", "REFUNDED"] } };
    }

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
              include: { store: { select: { name: true } } }
            }
          }
        }
      }
    });

    const formattedReleases = pendingReleases.map(e => ({
      id: e.id,
      sourceTable: "ESCROW",
      goalId: e.goalId,
      amount: normalize(e.amount),
      type: "RELEASE",
      customerName: e.goal?.user?.name,
      storeName: e.goal?.product?.store?.name,
      productName: e.goal?.product?.name
    }));

    const formattedRefunds = pendingRefunds.map(r => ({
      id: r.id,
      sourceTable: "REFUND_REQUEST",
      goalId: r.goalId,
      amount: normalize(r.amount),
      type: "REFUND",
      customerName: r.user?.name,
      storeName: "N/A",
      productName: r.goal?.product?.name
    }));

    const formattedRiders = pendingRiderPayouts.map(p => ({
      id: p.id,
      sourceTable: "RIDER_PAYOUT",
      deliveryId: p.deliveryId,
      amount: normalize(p.amount),
      type: "RIDER_PAYOUT",
      customerName: p.rider?.user?.name,
      storeName: "Rider Payout",
      productName: p.delivery?.goal?.product?.name
    }));

    const actionable = [...formattedReleases, ...formattedRefunds, ...formattedRiders];

    const grossEarnings = normalize(earningsAgg._sum.platformFee);
    const totalExpenses = normalize(riderPayoutsAgg._sum.amount) + normalize(storeBonusesAgg._sum.amount);
    const netEarnings = grossEarnings - totalExpenses;

    const formattedHistory = paginatedHistory.map(e => ({
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
    }));

    return NextResponse.json({
      stats: {
        totalEarnings: netEarnings,
        grossEarnings: grossEarnings,
        riderCosts: normalize(riderPayoutsAgg._sum.amount),
        totalHeld: normalize(depositsAgg._sum.amount),
        pendingActions: actionable.length
      },
      actionable: actionable,
      history: {
        data: formattedHistory,
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