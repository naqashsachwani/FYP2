import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { sendNotification } from "@/lib/sendNotification"; 

export async function GET(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const store = await prisma.store.findUnique({ where: { userId } });
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const requests = await prisma.complaint.findMany({
      where: { filerStoreId: store.id },
      include: {
        targetUser: { select: { name: true, email: true } },
        goal: { 
          select: { 
            id: true, 
            targetAmount: true,
            product: { select: { name: true } } 
          } 
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // ✅ FETCH IMAGES: Ensure product images are fetched for the dropdown
    const activeGoals = await prisma.goal.findMany({
      where: { 
        product: { storeId: store.id },
        status: { in: ["ACTIVE", "COMPLETED"] } 
      },
      include: { 
        product: { select: { name: true, images: true } }, // Images added here
        user: { select: { id: true, name: true } },
        delivery: {
           include: { rider: { include: { user: { select: { id: true, name: true } } } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ requests, activeGoals });
  } catch (error) {
    console.error("Fetch Store Requests Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const store = await prisma.store.findUnique({ where: { userId } });
    if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });

    const { title, description, type, goalId, targetUserId } = await req.json();

    if (!title || !description || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newRequest = await prisma.complaint.create({
      data: {
        title,
        description,
        type,
        filerStoreId: store.id,
        targetUserId: targetUserId || null, 
        goalId: goalId || null,
        status: "OPEN"
      }
    });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
        await sendNotification({
            userId: user.id,
            email: user.email,
            title: "Request Submitted 📝",
            message: `Your request regarding "${title}" has been successfully submitted to the admin team for review.`,
            type: "COMPLAINT_POSTED",
            notifyInApp: true,
            notifyEmail: true
        });
    }

    return NextResponse.json({ success: true, request: newRequest });

  } catch (error) {
    console.error("Create Store Request Error:", error);
    return NextResponse.json({ error: "Failed to submit request" }, { status: 500 });
  }
}