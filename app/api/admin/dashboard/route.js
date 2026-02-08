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

        // ------------------- DATA FETCH -------------------
        // Run queries in parallel for performance
        const [
            productsCount,
            storesCount,
            revenueAgg,
            escrowStats,
            refundStats,
            recentTransactions
        ] = await prisma.$transaction([
            // 1. Total Products
            prisma.product.count(),

            // 2. Total Stores
            prisma.store.count(),

            // 3. Total Platform Revenue (Sum of fees from Released & Refunded)
            prisma.escrow.aggregate({
                _sum: { platformFee: true },
                where: { status: { in: ["RELEASED", "REFUNDED"] } }
            }),

            // 4. Order Counts (Escrow based)
            prisma.escrow.groupBy({
                by: ['status'],
                _count: { id: true }
            }),

            // 5. Refund Requests Counts
            prisma.refundRequest.groupBy({
                by: ['status'],
                _count: { id: true }
            }),

            // 6. Recent Transactions (For Table & Chart)
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

        // ------------------- DATA PROCESSING -------------------
        
        // A. Calculate Order Counts
        const heldOrders = escrowStats.find(s => s.status === 'HELD')?._count.id || 0;
        const releasedOrders = escrowStats.find(s => s.status === 'RELEASED')?._count.id || 0;
        const refundedOrders = escrowStats.find(s => s.status === 'REFUNDED')?._count.id || 0;
        
        // "Total Orders" usually implies successful or pending ones, excluding cancellations
        const totalOrders = heldOrders + releasedOrders;

        // B. Calculate Refund Stats
        const refundPending = refundStats.find(s => s.status === 'REQUESTED')?._count.id || 0;
        const refundApproved = refundStats.find(s => s.status === 'APPROVED')?._count.id || 0;

        // C. Format Recent Transactions for Frontend
        const formattedOrders = recentTransactions.map(t => ({
            id: t.id,
            createdAt: t.releasedAt || t.createdAt, // Use release date if available
            customer: t.goal?.user?.name || "Unknown",
            total: Number(t.platformFee) || 0, // Show Platform Fee as the "Amount" for Admin
            status: t.status
        }));

        const dashboardData = {
            products: productsCount,
            stores: storesCount,
            revenue: Number(revenueAgg._sum.platformFee) || 0,
            orders: totalOrders,
            refundPending,
            orderCancelled: refundedOrders,
            refundApproved,
            allOrders: formattedOrders, 
        };

        return NextResponse.json({ dashboardData });

    } catch (error) {
        console.error("Admin Dashboard Error:", error);
        return NextResponse.json(
            { error: error.message }, 
            { status: 500 }
        );
    }
}