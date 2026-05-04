import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import authRider from '@/middlewares/authRider';
import { getAuth } from '@clerk/nextjs/server';
import { sendNotification } from "@/lib/sendNotification"; // ✅ Added Notification System

export async function GET(req) {
  try {
    const { userId } = getAuth(req);
    const riderId = await authRider(userId);
    if (!riderId) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const profile = await prisma.riderProfile.findUnique({ where: { id: riderId } });

    if (profile?.status === 'SUSPENDED' || profile?.status === 'REJECTED') {
        return NextResponse.json({ error: "Account Suspended or Rejected" }, { status: 403 });
    }

    const pendingAssignments = await prisma.deliveryAssignment.findMany({
      where: { riderId, status: 'PENDING' },
      include: { delivery: { include: { goal: { include: { user: true, product: { include: { store: true } } } } } } }
    });

    const activeDeliveries = await prisma.delivery.findMany({
      where: { currentRiderId: riderId, status: { in: ['ACCEPTED', 'DISPATCHED', 'PICKED_UP', 'IN_TRANSIT'] } },
      include: { goal: { include: { user: true, product: { include: { store: true } } } } }
    });

    const completedCount = await prisma.delivery.count({
        where: { currentRiderId: riderId, status: 'DELIVERED' }
    });

    const payouts = await prisma.riderPayout.findMany({ where: { riderId: riderId } });
    const trueEarnings = payouts.filter(p => p.type === 'EARNING').reduce((acc, curr) => acc + curr.amount, 0);
    const trueWithdrawals = payouts.filter(p => p.type === 'WITHDRAWAL').reduce((acc, curr) => acc + curr.amount, 0);
    const dynamicBalance = trueEarnings - trueWithdrawals;

    const safeData = JSON.parse(JSON.stringify(
        { 
            profile: { ...profile, totalEarnings: trueEarnings, walletBalance: dynamicBalance }, 
            pendingAssignments, 
            activeDeliveries,
            payouts, 
            stats: {
                completedDeliveries: completedCount,
                pendingDeliveries: pendingAssignments.length,
                activeDeliveriesCount: activeDeliveries.length
            }
        }, 
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

    const profile = await prisma.riderProfile.findUnique({ where: { id: riderId }, include: { user: true } });
    if (profile?.status === 'SUSPENDED' || profile?.status === 'REJECTED') {
        return NextResponse.json({ error: "Account Suspended or Rejected" }, { status: 403 });
    }

    const { assignmentId, deliveryId, action } = await req.json(); 

    if (action === 'ACCEPT') {
        await prisma.deliveryAssignment.update({
            where: { id: assignmentId },
            data: { status: 'ACCEPTED', respondedAt: new Date() }
        });

        const updatedDelivery = await prisma.delivery.update({
            where: { id: deliveryId },
            data: { currentRiderId: riderId, status: 'ACCEPTED' },
            include: { goal: { include: { product: { include: { store: { include: { user: true } } } } } } }
        });

        // ✅ NOTIFY STORE OWNER THAT RIDER ACCEPTED THE JOB
        const storeOwner = updatedDelivery.goal?.product?.store?.user;
        if (storeOwner) {
            await sendNotification({
                userId: storeOwner.id,
                email: storeOwner.email,
                title: "Rider Assigned! 🚚",
                message: `Good news! Rider ${profile.user.name} has accepted the delivery assignment for "${updatedDelivery.goal.product.name}". Please prepare the package for pickup.`,
                type: "DELIVERY_UPDATE",
                notifyInApp: true,
                notifyEmail: true
            });
        }
    } else {
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