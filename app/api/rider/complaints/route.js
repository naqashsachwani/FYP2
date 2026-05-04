import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import authRider from '@/middlewares/authRider';
import { sendNotification } from "@/lib/sendNotification"; // ✅ Added Notification System

export async function GET(req) {
  try {
    const { userId } = getAuth(req);
    const riderId = await authRider(userId);
    
    if (!riderId) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const complaints = await prisma.complaint.findMany({
        where: { filerRiderId: riderId },
        include: { goal: { include: { product: true } } },
        orderBy: { createdAt: 'desc' }
    });

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

    const userRecord = await prisma.user.findUnique({ where: { id: userId } });

    const formData = await req.formData();
    const title = formData.get("title");
    const type = formData.get("type");
    const description = formData.get("description");
    const goalId = formData.get("goalId");
    const targetUserId = formData.get("targetUserId");
    const targetStoreId = formData.get("targetStoreId");

    // ✅ GENERATE A CLEAN, READABLE COMPLAINT ID
    const generatedComplaintId = `CMP-${Math.floor(100000 + Math.random() * 900000)}`;

    const newComplaint = await prisma.complaint.create({
      data: {
        complaintId: generatedComplaintId, // ✅ Injecting the ID here
        title,
        type,
        description,
        filerRiderId: riderId, 
        goalId: goalId || null,
        targetUserId: targetUserId || null,
        targetStoreId: targetStoreId || null,
        status: "OPEN"
      }
    });

    // ✅ NOTIFY RIDER THAT COMPLAINT IS FILED WITH THE ID
    if (userRecord?.email) {
        await sendNotification({
            userId: userId,
            email: userRecord.email,
            title: "Support Ticket Opened 🎫",
            message: `Your ticket (ID: ${generatedComplaintId}) regarding "${title}" has been successfully submitted. Our Admin team will review it shortly.`,
            type: "COMPLAINT_POSTED",
            notifyInApp: true,
            notifyEmail: true
        });
    }

    return NextResponse.json({ success: true, complaint: newComplaint });
  } catch (error) {
    console.error("Create Complaint Error:", error);
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
}