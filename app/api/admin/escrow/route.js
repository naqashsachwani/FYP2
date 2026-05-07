import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import authAdmin from "@/middlewares/authAdmin";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { userId } = getAuth(req);
    const isAdmin = await authAdmin(userId);

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const filter = searchParams.get("filter") || "ALL";

    const normalize = (val) => Number(val || 0);

    // 1. Fetch Aggregates Safely
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

    // 2. Fetch Actionables Safely (Removed the broken 'delivery' relation from RiderPayout)
    const pendingReleases = await prisma.escrow.findMany({
      where: {
        status: "HELD",
        goal: { delivery: { status: "DELIVERED" } }
      },
      include: {
        goal: { include: { user: true, product: { include: { store: true } } } }
      }
    });

    const pendingRefunds = await prisma.refundRequest.findMany({
      where: { status: "REQUESTED" },
      include: {
        user: true, goal: { include: { product: true } }
      }
    });

    // ✅ Safely fetches Rider Withdrawal Requests
    const pendingRiderPayouts = await prisma.riderPayout.findMany({
      where: { status: "PENDING" },
      include: { rider: { include: { user: true } } } 
    });

    // 3. Fetch History
    let whereClause = {};
    if (filter === "ACTIVE") whereClause = { status: "HELD" };
    else if (filter === "HISTORY") whereClause = { status: { in: ["RELEASED", "REFUNDED"] } };

    let escrowHistory = [];
    if (filter !== "EXTRA_PAYMENTS") {
      escrowHistory = await prisma.escrow.findMany({
        where: whereClause,
        orderBy: { updatedAt: 'desc' },
        include: { goal: { include: { user: { select: { name: true } }, product: { include: { store: { select: { name: true } } } } } } }
      });
    }

    let manualHistory = [];
    if (filter === "ALL" || filter === "EXTRA_PAYMENTS") {
      manualHistory = await prisma.manualPayout.findMany({
        orderBy: { createdAt: 'desc' }
      });
    }

    // 4. Map and Format Everything
    const formattedEscrow = escrowHistory.map(e => ({
      id: e.id,
      goalId: e.goalId,
      amount: normalize(e.amount),
      platformFee: normalize(e.platformFee),
      netAmount: normalize(e.netAmount),
      status: e.status,
      date: e.releasedAt || e.heldSince || e.createdAt,
      customerName: e.goal?.user?.name || "Unknown",
      storeName: e.goal?.product?.store?.name || "Unknown",
      productName: e.goal?.product?.name || "Unknown Product",
      type: "ESCROW"
    }));

    const formattedManual = manualHistory.map(m => ({
      id: m.id,
      goalId: "BONUS",
      amount: normalize(m.amount),
      platformFee: 0,
      netAmount: normalize(m.amount),
      status: "EXTRA_PAYMENT",
      date: m.createdAt,
      customerName: "Platform Admin",
      storeName: m.recipientName || "Unknown",
      productName: `Bonus (${m.recipientType})`,
      type: "MANUAL"
    }));

    const combinedHistory = [...formattedEscrow, ...formattedManual].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    const totalRecords = combinedHistory.length;
    const paginatedData = combinedHistory.slice((page - 1) * limit, page * limit);

    const formattedReleases = pendingReleases.map(e => ({
      id: e.id, sourceTable: "ESCROW", goalId: e.goalId, amount: normalize(e.amount), type: "RELEASE",
      customerName: e.goal?.user?.name, storeName: e.goal?.product?.store?.name, productName: e.goal?.product?.name
    }));

    const formattedRefunds = pendingRefunds.map(r => ({
      id: r.id, sourceTable: "REFUND_REQUEST", goalId: r.goalId, amount: normalize(r.amount), type: "REFUND",
      customerName: r.user?.name, storeName: "N/A", productName: r.goal?.product?.name
    }));

    const formattedRiders = pendingRiderPayouts.map(p => ({
      id: p.id, sourceTable: "RIDER_PAYOUT", amount: normalize(p.amount), type: "RIDER_PAYOUT",
      customerName: p.rider?.user?.name, storeName: "Rider Withdrawal", productName: p.description || "Withdrawal Request"
    }));

    const grossEarnings = normalize(earningsAgg._sum.platformFee);
    const totalExpenses = normalize(riderPayoutsAgg._sum.amount) + normalize(storeBonusesAgg._sum.amount);

    return NextResponse.json({
      stats: {
        totalEarnings: grossEarnings - totalExpenses,
        grossEarnings: grossEarnings,
        riderCosts: normalize(riderPayoutsAgg._sum.amount),
        totalHeld: normalize(depositsAgg._sum.amount),
        pendingActions: formattedReleases.length + formattedRefunds.length + formattedRiders.length
      },
      actionable: [...formattedReleases, ...formattedRefunds, ...formattedRiders],
      history: {
        data: paginatedData,
        totalPages: Math.max(1, Math.ceil(totalRecords / limit)),
        currentPage: page,
        totalRecords: totalRecords
      }
    });

  } catch (error) {
    console.error("Escrow Fetch Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}