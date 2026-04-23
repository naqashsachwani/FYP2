import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuth } from "@clerk/nextjs/server";
import { sendNotification } from "@/lib/sendNotification"; 
import { writeSecurityAuditLog } from "@/lib/security/auditLog";
import { getRequestContext } from "@/lib/security/requestContext";
import { checkRateLimit } from "@/lib/security/rateLimit";

export async function POST(request, { params }) {
  try {
    const { goalId } = await params;
    const { userId } = getAuth(request);
    const context = getRequestContext(request, userId);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = checkRateLimit({
      key: `goal-redeem:${userId}:${context.ipAddress}`,
      limit: 5,
      windowMs: 10 * 60 * 1000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "Too many redemption attempts. Please try again later." }, { status: 429 });
    }
    
    const body = await request.json();
    const { addressId, deliveryDate } = body; 

    if (!addressId || !deliveryDate) {
      return NextResponse.json({ error: "Address and Date are required" }, { status: 400 });
    }

    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: { delivery: true, user: true, product: true } 
    });

    if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    if (goal.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (goal.delivery) return NextResponse.json({ success: true, deliveryId: goal.delivery.id });

    // 1. Get Address (Includes Latitude/Longitude)
    const address = await prisma.address.findFirst({ where: { id: addressId, userId } });
    if (!address) return NextResponse.json({ error: "Invalid address" }, { status: 400 });

    // 2. Create Delivery
    const newDelivery = await prisma.delivery.create({
      data: {
        goalId: goalId,
        status: 'PENDING',
        shippingAddress: `${address.street}, ${address.city}, ${address.state}, ${address.zip}`,
        
        // CRITICAL FIX: Save the Destination Coordinates!
        destinationLat: address.latitude,
        destinationLng: address.longitude,

        estimatedDate: new Date(deliveryDate), 
        deliveryDate: new Date(deliveryDate), 
        trackingNumber: `TRK-${Math.floor(Math.random() * 1000000)}`,
      }
    });

    // FIRE ENGINE: Notify user that redemption was successful
    if (goal.user) {
        await sendNotification({
            userId: goal.user.id,
            email: goal.user.email,
            title: "Redemption Successful! 📦",
            message: `Your redemption request for ${goal.product?.name} has been processed. Your tracking number is ${newDelivery.trackingNumber}.`,
            type: "SYSTEM_ALERT",
            goalId: goal.id,
            deliveryId: newDelivery.id,
            notifyInApp: true,
            notifyEmail: true
        });
    }

    await writeSecurityAuditLog({
      action: "GOAL_REDEEM",
      actorUserId: userId,
      entityType: "Goal",
      entityId: goalId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: { addressId, deliveryId: newDelivery.id },
    });

    return NextResponse.json({ success: true, deliveryId: newDelivery.id });

  } catch (error) {
    console.error("Redemption Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
