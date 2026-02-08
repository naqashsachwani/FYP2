import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuth } from "@clerk/nextjs/server";

// GET: Fetch current Store Settings
export async function GET(request) {
  const { userId } = getAuth(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const store = await prisma.store.findUnique({ where: { userId } });
    return NextResponse.json({ store });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

// POST: Update Store Address & Coordinates
export async function POST(request) {
  const { userId } = getAuth(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { address, city, zip, latitude, longitude } = body;

    // Helper to safely parse coordinates
    // We check if value is not empty string, otherwise set to null
    const safeFloat = (val) => (val !== "" && val !== undefined && val !== null) ? parseFloat(val) : null;

    const updatedStore = await prisma.store.update({
      where: { userId },
      data: {
        address,
        city,
        zip,
        latitude: safeFloat(latitude),
        longitude: safeFloat(longitude),
      }
    });

    return NextResponse.json({ success: true, store: updatedStore });

  } catch (error) {
    console.error("Settings Update Error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}