import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { sendNotification } from "@/lib/sendNotification"; // ✅ IMPORT ENGINE

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

    // ✅ UPDATED: Include product images for the frontend picker
    const goals = await prisma.goal.findMany({
      where: { userId },
      include: { 
        product: { 
          select: { 
            name: true, 
            storeId: true,
            images: true // ADD THIS
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

    const { title, description, type, goalId } = await req.json();

    if (!title || !description || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let targetStoreId = null;

    // ✅ THE 7-DAY RULE LOGIC
    if (goalId) {
      const goal = await prisma.goal.findUnique({
        where: { id: goalId },
        include: { delivery: true, product: true }
      });

      if (!goal) return NextResponse.json({ error: "Linked goal not found" }, { status: 404 });
      
      // Automatically link the store associated with this goal
      targetStoreId = goal.product?.storeId;

      // Only enforce 7-day limit for Product/Delivery issues on Delivered items
      if (["DELIVERY", "PRODUCT_ISSUE"].includes(type) && goal.delivery?.status === "DELIVERED") {
        // Fallback to updatedAt if deliveryDate isn't explicitly set
        const deliveryDate = new Date(goal.delivery.deliveryDate || goal.delivery.updatedAt);
        const currentDate = new Date();
        
        // Calculate difference in days
        const diffInMs = currentDate - deliveryDate;
        const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

        if (diffInDays > 7) {
          return NextResponse.json({ 
            error: "Complaints regarding delivered products must be filed within 7 days of delivery." 
          }, { status: 400 });
        }
      }
    }

    // Create the complaint
    const newComplaint = await prisma.complaint.create({
      data: {
        title,
        description,
        type,
        filerUserId: userId,
        targetStoreId, 
        goalId: goalId || null, // Optional
        status: "OPEN"
      }
    });

    // ✅ FIRE ENGINE: Acknowledge the user's complaint
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
        await sendNotification({
            userId: user.id,
            email: user.email,
            title: "Complaint Received 📝",
            message: `We have received your complaint regarding "${title}". Our admin team will review it shortly.`,
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