import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuth } from '@clerk/nextjs/server';
import authRider from '@/middlewares/authRider'; // ✅ Fixed import

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'active'; 
    
    const { userId } = getAuth(req);
    // ✅ Securely fetch rider ID. Will return 403 if suspended/rejected/not found.
    const riderId = await authRider(userId); 
    
    if (!riderId) {
        return NextResponse.json({ error: "Unauthorized Rider" }, { status: 403 });
    }

    let data = [];

    // Pending Requests
    if (type === 'pending') {
        data = await prisma.deliveryAssignment.findMany({
          where: { riderId: riderId, status: 'PENDING' },
          include: { delivery: { include: { goal: { include: { user: true, product: { include: { store: true } } } } } } },
          orderBy: { createdAt: 'desc' }
        });
    } 
    // Active Deliveries
    else if (type === 'active') {
        data = await prisma.delivery.findMany({
          where: { currentRiderId: riderId, status: { in: ['ACCEPTED', 'DISPATCHED', 'PICKED_UP', 'IN_TRANSIT'] } },
          include: { goal: { include: { user: true, product: { include: { store: true } } } } },
          orderBy: { updatedAt: 'desc' }
        });
    } 
    // Job History
    else if (type === 'history') {
        data = await prisma.delivery.findMany({
          where: { currentRiderId: riderId, status: { in: ['DELIVERED', 'FAILED', 'REASSIGNED', 'CANCELLED'] } },
          include: { goal: { include: { user: true, product: { include: { store: true } } } } },
          orderBy: { updatedAt: 'desc' }
        });
    }

    // Safely parse out any BigInts before sending to frontend
    const safeData = JSON.parse(JSON.stringify(data, (key, value) => typeof value === 'bigint' ? value.toString() : value));
    
    return NextResponse.json(safeData);
  } catch (error) {
    console.error("Jobs API Error:", error);
    return NextResponse.json({ error: "Server Error", details: error.message }, { status: 500 });
  }
}