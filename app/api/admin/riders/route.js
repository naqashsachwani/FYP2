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
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

// PATCH: Approve, Reject, or Suspend
export async function PATCH(req) {
  try {
    const { userId } = getAuth(req);
    if (!(await authAdmin(userId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { riderId, status } = await req.json(); // status = 'APPROVED', 'REJECTED', or 'SUSPENDED'

    const updatedRider = await prisma.riderProfile.update({
      where: { id: riderId },
      data: { status }
    });

    return NextResponse.json({ success: true, rider: updatedRider });
  } catch (error) {
    return NextResponse.json({ error: "Update Failed" }, { status: 500 });
  }
}