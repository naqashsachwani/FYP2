import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Fetch Delivery Details
export async function GET(request, { params }) {
  const { id } = await params;

  try {
    const delivery = await prisma.delivery.findUnique({
      where: { id: id },
      include: {
        // Include latest tracking first
        deliveryTrackings: { orderBy: { recordedAt: 'desc' } },
        goal: { include: { product: { include: { store: true } }, user: true } }
      }
    });

    if (!delivery) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Handle BigInt serialization if necessary
    const sanitized = JSON.parse(JSON.stringify(delivery, (key, value) => 
      (typeof value === 'bigint') ? value.toString() : value
    ));

    return NextResponse.json(sanitized);
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

// POST: Handle Status & Location Updates
export async function POST(request, { params }) {
  const { id } = await params;
  
  try {
    const body = await request.json();
    const { status, latitude, longitude, location } = body;

    const dataToUpdate = {};

    // 1. Handle Status Update (ONLY if explicitly provided in body)
    if (status) {
        dataToUpdate.status = status;
        if (status === 'DELIVERED') {
            dataToUpdate.deliveryDate = new Date();
        }
    }

    // 2. Handle Location Update
    // We check '!== undefined' so we can explicitly pass 'null' to hide the driver
    if (latitude !== undefined) {
        dataToUpdate.latitude = latitude === null ? null : parseFloat(latitude);
    }
    if (longitude !== undefined) {
        dataToUpdate.longitude = longitude === null ? null : parseFloat(longitude);
    }
    if (location !== undefined) {
        dataToUpdate.location = location;
    }

    // If payload is empty, reject (Basic validation)
    if (Object.keys(dataToUpdate).length === 0) {
        return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    // 3. Update the Delivery Record
    const updatedDelivery = await prisma.delivery.update({
      where: { id: id },
      data: dataToUpdate
    });

    // 4. Create Tracking History (ONLY if coordinates are valid numbers)
    if (latitude && longitude) {
      await prisma.deliveryTracking.create({
        data: {
          deliveryId: id,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          location: location || 'En Route',
          // ✅ CRITICAL FIX: Use the EXISTING status. Do NOT default to 'IN_TRANSIT'.
          status: status || updatedDelivery.status, 
        }
      });
    }

    // Sanitize response
    const sanitizedResponse = JSON.parse(JSON.stringify(updatedDelivery, (key, value) => 
       (typeof value === 'bigint') ? value.toString() : value
    ));

    return NextResponse.json({ success: true, data: sanitizedResponse });

  } catch (error) {
    console.error("Update Error:", error);
    return NextResponse.json({ error: "Update Failed: " + error.message }, { status: 500 });
  }
}