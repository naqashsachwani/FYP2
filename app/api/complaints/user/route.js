import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { sendNotification } from "@/lib/sendNotification";
import imagekit from "@/configs/imageKit"; 
import crypto from "crypto"; 

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
        targetUser: { select: { name: true } }, // Useful for showing targeted Riders
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

    const formData = await req.formData();
    const title = formData.get("title");
    const description = formData.get("description");
    const type = formData.get("type");
    const goalId = formData.get("goalId");
    
    // ✅ NEW: Extract all files passed under the 'images' key
    const files = formData.getAll("images"); 

    if (!title || !description || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let targetStoreId = null;
    let targetUserId = null; // ✅ NEW: To target riders

    // THE 7-DAY RULE & TARGET ASSIGNMENT LOGIC
    if (goalId && goalId !== "null" && goalId !== "") {
      const goal = await prisma.goal.findUnique({
        where: { id: goalId },
        include: { delivery: { include: { rider: true } }, product: true }
      });

      if (!goal) return NextResponse.json({ error: "Linked goal not found" }, { status: 404 });
      
      // ✅ Assign Target: If it's a Rider issue, target the Rider's User ID. Otherwise, target the Store.
      if (type === "RIDER_ISSUE" && goal.delivery?.rider) {
          targetUserId = goal.delivery.rider.userId;
      } else {
          targetStoreId = goal.product?.storeId;
      }

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

    // ✅ MULTIPLE IMAGE UPLOAD LOGIC
    let uploadedUrls = [];
    if (files && files.length > 0) {
      for (const file of files) {
        if (file && file.size > 0) {
           const buffer = Buffer.from(await file.arrayBuffer());
           const uploadRes = await imagekit.upload({
             file: buffer,
             fileName: `complaint-${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`,
             folder: "/complaints"
           });
           uploadedUrls.push(uploadRes.url);
        }
      }
    }
    
    // Convert array to JSON string to store in the single imageUrl column
    const imageUrl = uploadedUrls.length > 0 ? JSON.stringify(uploadedUrls) : null;

    const complaintId = `CMP-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

    const newComplaint = await prisma.complaint.create({
      data: {
        complaintId, 
        title,
        description,
        type,
        filerUserId: userId,
        targetStoreId, 
        targetUserId, // ✅ Save Rider Target if applicable
        goalId: (goalId && goalId !== "null" && goalId !== "") ? goalId : null,
        imageUrl, 
        status: "OPEN"
      }
    });

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