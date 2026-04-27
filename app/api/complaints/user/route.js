import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { sendNotification } from "@/lib/sendNotification";
import imagekit from "@/configs/imageKit"; // ✅ IMPORT IMAGEKIT
import crypto from "crypto"; // ✅ IMPORT CRYPTO FOR ID GENERATION

// ==============================
// GET: Fetch User's Complaints
// ==============================
export async function GET(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const complaints = await prisma.complaint.findMany({
      where: { filerUserId: userId },
      include: {
        targetStore: { select: { name: true } },
        goal: { select: { product: { select: { name: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const goals = await prisma.goal.findMany({
      where: { userId },
      include: { 
        product: { 
          select: { 
            name: true, 
            storeId: true,
            images: true 
          } 
        } 
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ complaints, goals });
  } catch (error) {
    console.error("Fetch Complaints Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

// ==============================
// POST: File a New Complaint
// ==============================
export async function POST(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // ✅ CHANGED: Parse FormData instead of JSON to handle the file
    const formData = await req.formData();
    const title = formData.get("title");
    const description = formData.get("description");
    const type = formData.get("type");
    const goalId = formData.get("goalId");
    const file = formData.get("image"); // Optional image file

    if (!title || !description || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let targetStoreId = null;

    // THE 7-DAY RULE LOGIC
    if (goalId && goalId !== "null" && goalId !== "") {
      const goal = await prisma.goal.findUnique({
        where: { id: goalId },
        include: { delivery: true, product: true }
      });

      if (!goal) return NextResponse.json({ error: "Linked goal not found" }, { status: 404 });
      
      targetStoreId = goal.product?.storeId;

      if (["DELIVERY", "PRODUCT_ISSUE"].includes(type) && goal.delivery?.status === "DELIVERED") {
        const deliveryDate = new Date(goal.delivery.deliveryDate || goal.delivery.updatedAt);
        const currentDate = new Date();
        const diffInMs = currentDate - deliveryDate;
        const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

        if (diffInDays > 7) {
          return NextResponse.json({ 
            error: "Complaints regarding delivered products must be filed within 7 days of delivery." 
          }, { status: 400 });
        }
      }
    }

    // ✅ IMAGE UPLOAD LOGIC
    let imageUrl = null;
    if (file && file.size > 0) {
      // Convert file to buffer for ImageKit SDK
      const buffer = Buffer.from(await file.arrayBuffer());
      const uploadRes = await imagekit.upload({
        file: buffer,
        fileName: `complaint-${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`,
        folder: "/complaints"
      });
      imageUrl = uploadRes.url;
    }

    // ✅ GENERATE HUMAN-READABLE COMPLAINT ID
    const complaintId = `CMP-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

    // Create the complaint
    const newComplaint = await prisma.complaint.create({
      data: {
        complaintId, // Save unique ID
        title,
        description,
        type,
        filerUserId: userId,
        targetStoreId, 
        goalId: (goalId && goalId !== "null" && goalId !== "") ? goalId : null,
        imageUrl, // Save image URL if it exists
        status: "OPEN"
      }
    });

    // ✅ FIRE ENGINE: Acknowledge the user's complaint with the new ID
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
        await sendNotification({
            userId: user.id,
            email: user.email,
            title: "Complaint Received 📝",
            message: `We have received your complaint (ID: ${complaintId}) regarding "${title}". Our admin team will review it shortly.`,
            type: "COMPLAINT_POSTED",
            notifyInApp: true,
            notifyEmail: true
        });
    }

    return NextResponse.json({ success: true, complaint: newComplaint });

  } catch (error) {
    console.error("Create Complaint Error:", error);
    return NextResponse.json({ error: "Failed to submit complaint" }, { status: 500 });
  }
}