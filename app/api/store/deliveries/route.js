import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuth } from "@clerk/nextjs/server";

export async function GET(request) {
  try {
    // 1. Get the current User ID from Clerk
    const { userId } = getAuth(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Find the Store associated with this User
    const store = await prisma.store.findUnique({
      where: { userId: userId }
    });

    if (!store) {
      // If the user has no store, return an empty list (or error if you prefer)
      return NextResponse.json({ 
        deliveries: [], 
        message: "No store found for this user" 
      });
    }

    // 3. Find Deliveries for Products that belong to this Store
    // Logic: Delivery -> Goal -> Product -> StoreId check
    const deliveries = await prisma.delivery.findMany({
      where: {
        goal: {
          product: {
            storeId: store.id 
          }
        }
      },
      include: {
        goal: {
          include: {
            user: true, // To show Customer Name
            product: {
                include: { store: true } // To show Product Details
            }
          }
        },
        deliveryTrackings: {
          orderBy: { recordedAt: 'desc' },
          take: 1 // Get the most recent location update for the map
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // 4. Sanitize Data (Convert BigInt/Decimal to Numbers for JSON)
    const sanitizedDeliveries = JSON.parse(JSON.stringify(deliveries, (key, value) => 
      (typeof value === 'object' && value !== null && value.s) ? Number(value) : value
    ));

    return NextResponse.json({ deliveries: sanitizedDeliveries });

  } catch (error) {
    console.error("Store Delivery API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}