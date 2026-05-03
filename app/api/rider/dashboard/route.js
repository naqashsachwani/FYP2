import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import authRider from '@/middlewares/authRider';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(req) {
  try {
    const { userId } = getAuth(req);
    const riderId = await authRider(userId);
    if (!riderId) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    // Fetch the rider profile to get totalEarnings and status
    const profile = await prisma.riderProfile.findUnique({ where: { id: riderId } });

    // ✅ STRICT ENFORCEMENT: Block suspended or rejected riders from accessing dashboard data
    if (profile?.status === 'SUSPENDED' || profile?.status === 'REJECTED') {
        return NextResponse.json({ error: "Account Suspended or Rejected" }, { status: 403 });
    }

    // Fetch PENDING assignments (Delivery Requests from Store)
    const pendingAssignments = await prisma.deliveryAssignment.findMany({
      where: { riderId, status: 'PENDING' },
      include: {
        delivery: { 
            include: { 
                goal: { include: { user: true, product: { include: { store: true } } } } 
            } 
        }
      }
    });

    // Fetch Active Deliveries (Accepted but not yet Delivered/Failed)
    const activeDeliveries = await prisma.delivery.findMany({
      where: { 
          currentRiderId: riderId, 
          status: { in: ['ACCEPTED', 'DISPATCHED', 'PICKED_UP', 'IN_TRANSIT'] } 
      },
      include: {
        goal: { include: { user: true, product: { include: { store: true } } } }
      }
    });

    // Safely stringify BigInt values if any exist in the schema
    const safeData = JSON.parse(JSON.stringify(
        { profile, pendingAssignments, activeDeliveries }, 
        (key, value) => typeof value === 'bigint' ? value.toString() : value
    ));

    return NextResponse.json(safeData);
  } catch (error) {
    console.error("Rider Dashboard Fetch Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { userId } = getAuth(req);
    const riderId = await authRider(userId);
    if (!riderId) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    // ✅ Security check: Verify suspension status before allowing assignment actions
    const profile = await prisma.riderProfile.findUnique({ where: { id: riderId } });
    if (profile?.status === 'SUSPENDED' || profile?.status === 'REJECTED') {
        return NextResponse.json({ error: "Account Suspended or Rejected" }, { status: 403 });
    }

    const { assignmentId, deliveryId, action } = await req.json(); // Action = ACCEPT or REJECT

    if (action === 'ACCEPT') {
        // Update Assignment Status
        await prisma.deliveryAssignment.update({
            where: { id: assignmentId },
            data: { status: 'ACCEPTED', respondedAt: new Date() }
        });

        // Link Rider to Delivery and set status to ACCEPTED
        await prisma.delivery.update({
            where: { id: deliveryId },
            data: { currentRiderId: riderId, status: 'ACCEPTED' }
        });
    } else {
        // Reject the Assignment
        await prisma.deliveryAssignment.update({
            where: { id: assignmentId },
            data: { status: 'REJECTED', respondedAt: new Date() }
        });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Assignment Action Error:", error);
    return NextResponse.json({ error: "Action Failed" }, { status: 500 });
  }
}