import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import authRider from '@/middlewares/authRider';

export async function GET(req) {
  try {
    const { userId } = getAuth(req);
    const riderId = await authRider(userId);
    
    if (!riderId) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    // ✅ STRICT ISOLATION: Only fetch complaints specifically filed by this Rider Identity
    const complaints = await prisma.complaint.findMany({
        where: { filerRiderId: riderId },
        include: { goal: { include: { product: true } } },
        orderBy: { createdAt: 'desc' }
    });

    // Fetch their deliveries so they can attach them to new complaints
    const deliveries = await prisma.delivery.findMany({
        where: { currentRiderId: riderId },
        include: { goal: { include: { product: { include: { store: true } }, user: true } } },
        orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json({ complaints, deliveries });
  } catch (error) {
    console.error("Rider Complaints Fetch Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { userId } = getAuth(req);
    const riderId = await authRider(userId);
    
    if (!riderId) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const formData = await req.formData();
    const title = formData.get("title");
    const type = formData.get("type");
    const description = formData.get("description");
    const goalId = formData.get("goalId");
    const targetUserId = formData.get("targetUserId");
    const targetStoreId = formData.get("targetStoreId");

    const newComplaint = await prisma.complaint.create({
      data: {
        title,
        type,
        description,
        filerRiderId: riderId, // ✅ STRICT ISOLATION: Assigns to Rider, NOT User
        goalId: goalId || null,
        targetUserId: targetUserId || null,
        targetStoreId: targetStoreId || null,
        status: "OPEN"
      }
    });

    return NextResponse.json({ success: true, complaint: newComplaint });
  } catch (error) {
    console.error("Create Complaint Error:", error);
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
}