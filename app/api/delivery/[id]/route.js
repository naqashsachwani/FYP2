import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendNotification } from "@/lib/sendNotification";
import { getAuth } from '@clerk/nextjs/server'; 

// GET: Fetch Delivery Details (Smart Lookup)
export async function GET(request, { params }) {
  const { id } = await params;

  try {
    const delivery = await prisma.delivery.findFirst({
      where: {
        OR: [
          { id: id },
          { goalId: id },
          { trackingNumber: id }
        ]
      },
      include: {
        deliveryTrackings: { orderBy: { recordedAt: 'desc' } },
        goal: { include: { product: { include: { store: true } }, user: true } },
        rider: { include: { user: true } }
      }
    });

    if (!delivery) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const sanitized = JSON.parse(JSON.stringify(delivery, (key, value) => 
      (typeof value === 'bigint') ? value.toString() : value
    ));

    return NextResponse.json(sanitized);
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

// POST: Handle Status Updates (Triggered by Customer "Confirm Received" or Store Dashboard)
export async function POST(request, { params }) {
  const { id } = await params;
  
  try {
    const body = await request.json();
    const { status, latitude, longitude, location } = body;

    const existingDelivery = await prisma.delivery.findFirst({
        where: {
          OR: [
            { id: id },
            { goalId: id },
            { trackingNumber: id }
          ]
        },
        include: { goal: { include: { user: true, product: true } } }
    });

    if (!existingDelivery) return NextResponse.json({ error: "Delivery not found" }, { status: 404 });

    const trueDeliveryId = existingDelivery.id;
    const dataToUpdate = {};

    if (status) {
        dataToUpdate.status = status;

        if (status === 'DELIVERED') {
            dataToUpdate.deliveryDate = new Date();

            // Process Rider Payout if assigned
            if (existingDelivery.currentRiderId) {
                const existingPayout = await prisma.riderPayout.findUnique({ 
                    where: { deliveryId: trueDeliveryId } 
                });
                
                if (!existingPayout) {
                    const itemPrice = parseFloat(existingDelivery.goal?.targetAmount || existingDelivery.goal?.product?.price || 0);
                    const payoutAmount = itemPrice >= 5000 ? 400.0 : 200.0;
                    
                    // ✅ THE FIX: Create the payout as PENDING and DO NOT update RiderProfile.totalEarnings.
                    // The money will stay locked until the Admin clicks "Pay Rider" in Escrow.
                    await prisma.riderPayout.create({
                        data: { 
                            riderId: existingDelivery.currentRiderId, 
                            deliveryId: trueDeliveryId, 
                            amount: payoutAmount,
                            status: 'PENDING' 
                        }
                    });
                }
            }
        }
    }

    if (latitude !== undefined) dataToUpdate.latitude = latitude === null ? null : parseFloat(latitude);
    if (longitude !== undefined) dataToUpdate.longitude = longitude === null ? null : parseFloat(longitude);
    if (location !== undefined) dataToUpdate.location = location;

    if (Object.keys(dataToUpdate).length === 0) return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });

    const updatedDelivery = await prisma.delivery.update({
      where: { id: trueDeliveryId },
      data: dataToUpdate
    });

    if (latitude && longitude) {
      await prisma.deliveryTracking.create({
        data: {
          deliveryId: trueDeliveryId,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          location: location || 'En Route',
          status: status || updatedDelivery.status, 
        }
      });
    }

    if (status && ['DISPATCHED', 'DELIVERED'].includes(status)) {
        if (existingDelivery?.goal?.user) {
            const isDelivered = status === 'DELIVERED';
            await sendNotification({
                userId: existingDelivery.goal.userId,
                email: existingDelivery.goal.user.email,
                title: isDelivered ? "Order Delivered! 📦" : "Order Dispatched! 🚚",
                message: isDelivered 
                    ? `Your order for ${existingDelivery.goal.product?.name} has been delivered successfully. Enjoy!` 
                    : `Your order for ${existingDelivery.goal.product?.name} has been dispatched and is on its way.`,
                type: "DELIVERY_UPDATE",
                deliveryId: trueDeliveryId,
                goalId: existingDelivery.goalId,
                notifyInApp: true,
                notifyEmail: true
            });
        }
    }

    const sanitizedResponse = JSON.parse(JSON.stringify(updatedDelivery, (key, value) => 
       (typeof value === 'bigint') ? value.toString() : value
    ));

    return NextResponse.json({ success: true, data: sanitizedResponse });

  } catch (error) {
    return NextResponse.json({ error: "Update Failed: " + error.message }, { status: 500 });
  }
}