import prisma from "@/lib/prisma"; 
import authAdmin from "@/middlewares/authAdmin"; 
import { getAuth } from "@clerk/nextjs/server"; 
import { NextResponse } from "next/server";

export async function GET(request) {
    try {
        // Authentication
        const { userId } = getAuth(request);
        
        // Authorization (Role-Based Access Control)
        const isAdmin = await authAdmin(userId);
        
        if (!isAdmin) {
            return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
        }

        // ------------------- DATA FETCH -------------------
        
        const [
            productsCount,
            storesCount,
            revenueAgg,
            escrowStats,
            refundStats,
            recentTransactions
        ] = await prisma.$transaction([
            // Total Products: Simple count of all rows in the Product table
            prisma.product.count(),

            // Total Stores: Simple count of all rows in the Store table
            prisma.store.count(),

            // Total Platform Revenue: Calculates the sum of the 'platformFee' column 
            prisma.escrow.aggregate({
                _sum: { platformFee: true },
                where: { status: { in: ["RELEASED", "REFUNDED"] } }
            }),

            // Order Counts: Groups Escrow records by their 'status' column and counts them.
            prisma.escrow.groupBy({
                by: ['status'],
                _count: { id: true }
            }),

            // Refund Requests Counts: Groups Refund records by their 'status' column and counts them.
            prisma.refundRequest.groupBy({
                by: ['status'],
                _count: { id: true }
            }),

            // Recent Transactions
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
        // Calculate Order Counts
        const heldOrders = escrowStats.find(s => s.status === 'HELD')?._count.id || 0;
        const releasedOrders = escrowStats.find(s => s.status === 'RELEASED')?._count.id || 0;
        const refundedOrders = escrowStats.find(s => s.status === 'REFUNDED')?._count.id || 0;
        
        const totalOrders = heldOrders + releasedOrders;

        // Calculate Refund Stats
        const refundPending = refundStats.find(s => s.status === 'REQUESTED')?._count.id || 0;
        const refundApproved = refundStats.find(s => s.status === 'APPROVED')?._count.id || 0;

        // Format Recent Transactions for Frontend
        const formattedOrders = recentTransactions.map(t => ({
            id: t.id,
            createdAt: t.releasedAt || t.createdAt, 
            customer: t.goal?.user?.name || "Unknown", 
            total: Number(t.platformFee) || 0, 
            status: t.status
        }));

        // Assemble the final payload
        const dashboardData = {
            products: productsCount,
            stores: storesCount,
            // Convert the aggregated sum to a Number to prevent serialization issues, fallback to 0
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