import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request, { params }) {
  try {
    const { goalId } = await params;
    
    const body = await request.json();
    const { addressId, deliveryDate } = body; 

    if (!addressId || !deliveryDate) {
      return NextResponse.json({ error: "Address and Date are required" }, { status: 400 });
    }

    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: { delivery: true }
    });

    if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    if (goal.delivery) return NextResponse.json({ success: true, deliveryId: goal.delivery.id });

    // 1. Get Address (Includes Latitude/Longitude)
    const address = await prisma.address.findUnique({ where: { id: addressId } });
    if (!address) return NextResponse.json({ error: "Invalid address" }, { status: 400 });

    // 2. Create Delivery
    const newDelivery = await prisma.delivery.create({
      data: {
        goalId: goalId,
        status: 'PENDING',
        shippingAddress: `${address.street}, ${address.city}, ${address.state}, ${address.zip}`,
        
        // ✅ CRITICAL FIX: Save the Destination Coordinates!
        destinationLat: address.latitude,
        destinationLng: address.longitude,

        estimatedDate: new Date(deliveryDate), 
        deliveryDate: new Date(deliveryDate), 
        trackingNumber: `TRK-${Math.floor(Math.random() * 1000000)}`,
      }
    });

    return NextResponse.json({ success: true, deliveryId: newDelivery.id });

  } catch (error) {
    console.error("Redemption Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}