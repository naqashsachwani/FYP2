import prisma from "@/lib/prisma";
import authAdmin from "@/middlewares/authAdmin";
import { getAuth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Prevent Next.js from caching this route so the admin panel always shows fresh data
export const dynamic = 'force-dynamic'; 

// ================= READ: GET ALL USERS =================
export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch all users, sorted alphabetically by name
    const users = await prisma.user.findMany({
      orderBy: { name: 'asc' }
    });
    
    return NextResponse.json({ users });
  } catch (error) {
    console.error("Fetch Users Error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// ================= TOGGLE: ENABLE / DISABLE USER =================
export async function PATCH(request) {
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { id, currentStatus } = body;

    if (!id) return NextResponse.json({ error: "User ID is required" }, { status: 400 });

    const newStatus = !currentStatus; // Flip the status
    const client = await clerkClient();

    if (newStatus === false) {
      // DISABLE: Ban them in Clerk to instantly revoke login access
      await client.users.banUser(id);
    } else {
      // ENABLE: Unban them in Clerk to restore access
      await client.users.unbanUser(id);
    }

    // Update the local database flag
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: newStatus }
    });

    return NextResponse.json({ 
        message: newStatus ? "User account restored and enabled." : "User account suspended.", 
        user: updatedUser 
    });

  } catch (error) {
    console.error("Toggle Status Error:", error);
    return NextResponse.json({ error: "Failed to change user status." }, { status: 500 });
  }
}

// ================= DELETE: "SECOND CHANCE" LOGIC =================
export async function DELETE(request) {
  try {
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "User ID is required" }, { status: 400 });

    // 1. Get user details before deleting so we have their email
    const userToDelete = await prisma.user.findUnique({ where: { id } });
    if (!userToDelete) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const email = userToDelete.email;
    const client = await clerkClient();

    // 2. Check the Deletion Tracker for this email
    const tracker = await prisma.deletionTracker.findUnique({ where: { email } });
    const currentCount = tracker ? tracker.count : 0;

    let actionMessage = "";

    if (currentCount === 0) {
      // FIRST OFFENSE: Delete from Clerk. This frees the email so they can sign up exactly ONE more time.
      await client.users.deleteUser(id);
      
      // Log the deletion in the tracker
      await prisma.deletionTracker.create({
        data: { email, count: 1 }
      });
      
      actionMessage = "User deleted. They are permitted to recreate their account one more time.";
    } else {
      // SECOND OFFENSE: They used their second chance. Permanently Ban them in Clerk.
      await client.users.banUser(id);
      
      // Update the log counter
      await prisma.deletionTracker.update({
        where: { email },
        data: { count: currentCount + 1 }
      });

      actionMessage = "User permanently BANNED. They have exhausted their recreations.";
    }

    // 3. Delete from Local Database
    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ message: actionMessage });

  } catch (error) {
    console.error("Delete User Error:", error);
    return NextResponse.json({ error: "Failed to process user deletion. They may have attached data." }, { status: 500 });
  }
}