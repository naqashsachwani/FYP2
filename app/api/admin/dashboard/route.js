import prisma from "@/lib/prisma"; 
import authAdmin from "@/middlewares/authAdmin"; 
import { getAuth } from "@clerk/nextjs/server"; 
import { NextResponse } from "next/server";

export async function GET(request) {
    try {
        const { userId } = getAuth(request);
        const isAdmin = await authAdmin(userId);
        
        if (!isAdmin) {
            return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
        }

        // Added prisma.riderPayout.aggregate to the transaction array
        const [
            productsCount,
            storesCount,
            ridersCount,
            revenueAgg,
            riderPayoutsAgg, // ✅ Fetch all Paid Rider Payouts
            escrowStats,
            refundStats,
            recentTransactions
        ] = await prisma.$transaction([
            prisma.product.count(),
            prisma.store.count(),
            prisma.riderProfile.count(),
            prisma.escrow.aggregate({
                _sum: { platformFee: true },
                where: { status: { in: ["RELEASED", "REFUNDED"] } }
            }),
            prisma.riderPayout.aggregate({
                _sum: { amount: true },
                where: { status: "TRANSFERRED" } // ✅ Only deduct completed payments
            }),
            prisma.escrow.groupBy({
                by: ['status'],
                _count: { id: true }
            }),
            prisma.refundRequest.groupBy({
                by: ['status'],
                _count: { id: true }
            }),
            prisma.escrow.findMany({
                take: 20,
                orderBy: { updatedAt: 'desc' },
                include: {
                    goal: {
                        include: { user: { select: { name: true } } }
                    }
                }
            })
        ]);

        const heldOrders = escrowStats.find(s => s.status === 'HELD')?._count.id || 0;
        const releasedOrders = escrowStats.find(s => s.status === 'RELEASED')?._count.id || 0;
        const refundedOrders = escrowStats.find(s => s.status === 'REFUNDED')?._count.id || 0;
        const totalOrders = heldOrders + releasedOrders;

        const refundPending = refundStats.find(s => s.status === 'REQUESTED')?._count.id || 0;
        const refundApproved = refundStats.find(s => s.status === 'APPROVED')?._count.id || 0;

        const formattedOrders = recentTransactions.map(t => ({
            id: t.id,
            createdAt: t.releasedAt || t.createdAt, 
            customer: t.goal?.user?.name || "Unknown", 
            total: Number(t.platformFee) || 0, 
            status: t.status
        }));

        // ✅ Mathematical Deduction Logic
        const grossRevenue = Number(revenueAgg._sum.platformFee) || 0;
        const totalRiderCosts = Number(riderPayoutsAgg._sum.amount) || 0;
        const netRevenue = grossRevenue - totalRiderCosts;

        const dashboardData = {
            products: productsCount,
            stores: storesCount,
            riders: ridersCount,
            revenue: netRevenue,           // Net Revenue (Gross - Rider Costs)
            grossRevenue: grossRevenue,    // Kept just in case frontend needs it
            riderCosts: totalRiderCosts,   // The exact amount paid to riders
            orders: totalOrders,
            refundPending,
            orderCancelled: refundedOrders,
            refundApproved,
            allOrders: formattedOrders, 
        };

        return NextResponse.json({ dashboardData });

    } catch (error) {
        console.error("Admin Dashboard Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}