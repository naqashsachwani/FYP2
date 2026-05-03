import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(req) {
  try {
    const { userId } = getAuth(req);
    // Add your admin verification here if needed
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    // 1. Fetch Deliveries that need a rider (PENDING or FAILED)
    // ✅ FIXED: Removed 'REJECTED' and 'CANCELLED' to match your strict Prisma schema
    const pendingDeliveries = await prisma.delivery.findMany({
      where: {
        status: { in: ['PENDING', 'FAILED'] } 
      },
      include: {
        goal: {
          include: {
            user: true,
            product: {
              include: { store: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // 2. Fetch Active Deliveries (Assigned to riders but not yet delivered)
    const activeDeliveries = await prisma.delivery.findMany({
      where: {
        status: { in: ['DISPATCHED', 'IN_TRANSIT'] }
      },
      include: {
        goal: { include: { user: true, product: { include: { store: true } } } },
        rider: { include: { user: true } }
      },
      orderBy: { updatedAt: "desc" }
    });

    // 3. Fetch Completed Deliveries
    const completedDeliveries = await prisma.delivery.findMany({
      where: { status: 'DELIVERED' },
      include: {
        goal: { include: { user: true, product: { include: { store: true } } } },
        rider: { include: { user: true } }
      },
      orderBy: { deliveryDate: "desc" },
      take: 50 // Limit to recent 50 for performance
    });

    // Sanitize BigInts for JSON serialization
    const sanitizedPending = JSON.parse(JSON.stringify(pendingDeliveries, (k, v) => typeof v === 'bigint' ? v.toString() : v));
    const sanitizedActive = JSON.parse(JSON.stringify(activeDeliveries, (k, v) => typeof v === 'bigint' ? v.toString() : v));
    const sanitizedCompleted = JSON.parse(JSON.stringify(completedDeliveries, (k, v) => typeof v === 'bigint' ? v.toString() : v));

    return NextResponse.json({
      pending: sanitizedPending,
      active: sanitizedActive,
      completed: sanitizedCompleted
    });

  } catch (error) {
    console.error("Admin Logistics Fetch Error:", error);
    return NextResponse.json({ error: "Failed to fetch logistics data" }, { status: 500 });
  }
}