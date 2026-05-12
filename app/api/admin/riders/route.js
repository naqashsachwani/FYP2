import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import authAdmin from '@/middlewares/authAdmin';
import { getAuth } from '@clerk/nextjs/server';

// GET: Fetch all riders
export async function GET(req) {
  try {
    const { userId } = getAuth(req);
    if (!(await authAdmin(userId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const riders = await prisma.riderProfile.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(riders);
  } catch (error) {
    console.error("GET Riders Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

// PATCH: Approve, Reject, Suspend, OR Update Details
export async function PATCH(req) {
  try {
    const { userId } = getAuth(req);
    if (!(await authAdmin(userId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { riderId, status, phoneNumber, vehicleType, vehiclePlate, cnicNumber, licenseNumber, idImageUrl } = body;

    // Dynamically build the update object so it only updates fields that are provided
    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (vehicleType !== undefined) updateData.vehicleType = vehicleType;
    if (vehiclePlate !== undefined) updateData.vehiclePlate = vehiclePlate;
    if (cnicNumber !== undefined) updateData.cnicNumber = cnicNumber;
    if (licenseNumber !== undefined) updateData.licenseNumber = licenseNumber;
    if (idImageUrl !== undefined) updateData.idImageUrl = idImageUrl;

    const updatedRider = await prisma.riderProfile.update({
      where: { id: riderId },
      data: updateData
    });

    return NextResponse.json({ success: true, rider: updatedRider });
  } catch (error) {
    console.error("PATCH Riders Error:", error);
    return NextResponse.json({ error: "Update Failed" }, { status: 500 });
  }
}