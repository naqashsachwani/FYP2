import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// ==============================
// GET: Fetch user's notifications
// ==============================
export async function GET(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20 // Keep the dropdown clean by limiting to the 20 most recent
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("Fetch Notifications Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

// ==============================
// PATCH: Mark notification as read
// ==============================
export async function PATCH(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await req.json();

    if (!id) return NextResponse.json({ error: "Notification ID required" }, { status: 400 });

    const updatedNotification = await prisma.notification.update({
      where: { id, userId }, // Ensure the user actually owns this notification
      data: { isRead: true }
    });

    return NextResponse.json({ success: true, notification: updatedNotification });
  } catch (error) {
    console.error("Update Notification Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}