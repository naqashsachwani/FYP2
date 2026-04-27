import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
  // Extract the tracking number from the URL
  const { trackingNumber } = await params;

  if (!trackingNumber) {
    return NextResponse.json({ error: 'Tracking number is required' }, { status: 400 });
  }

  try {
    // ✅ FIXED: Changed findUnique to findFirst so it searches correctly!
    const delivery = await prisma.delivery.findFirst({
      where: { 
        trackingNumber: trackingNumber.trim().toUpperCase() 
      },
      include: {
        goal: { 
          include: { 
            product: { 
              include: { store: true } 
            } 
          } 
        }
      }
    });

    if (!delivery) {
      return NextResponse.json({ error: 'Tracking number not found' }, { status: 404 });
    }

    // Sanitize BigInt if necessary
    const sanitized = JSON.parse(JSON.stringify(delivery, (key, value) => 
      (typeof value === 'bigint') ? value.toString() : value
    ));

    return NextResponse.json(sanitized);
  } catch (error) {
    console.error("Public Tracking API Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}