import prisma from "@/lib/prisma";
import authAdmin from "@/middlewares/authAdmin";
import { getAuth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { sendNotification } from "@/lib/sendNotification"; // ✅ IMPORT ENGINE

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

    // ✅ BACKEND SAFETY CHECK: Admin cannot suspend themselves
    if (id === userId) {
      return NextResponse.json({ error: "You cannot suspend your own account." }, { status: 403 });
    }

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

    // ✅ FIRE ENGINE: Notify User of Account Status Change
    const title = newStatus ? "Account Restored ✅" : "Account Suspended ⚠️";
    const message = newStatus 
        ? "Your account access has been fully restored by an administrator."
        : "Your account has been temporarily suspended by an administrator due to a policy violation. Please contact support.";

    await sendNotification({
        userId: updatedUser.id,
        email: updatedUser.email,
        title: title,
        message: message,
        type: "SYSTEM_ALERT",
        notifyInApp: false, // They are banned, so they can't log in to see the app alert. Send to Email.
        notifyEmail: true
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

    // ✅ BACKEND SAFETY CHECK: Admin cannot delete themselves
    if (id === userId) {
      return NextResponse.json({ error: "You cannot delete your own account." }, { status: 403 });
    }

    // 1. Get user details before deleting so we have their email
    const userToDelete = await prisma.user.findUnique({ where: { id } });
    if (!userToDelete) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const email = userToDelete.email;
    const client = await clerkClient();

    // 2. Check the Deletion Tracker for this email
    const tracker = await prisma.deletionTracker.findUnique({ where: { email } });
    const currentCount = tracker ? tracker.count : 0;

    let actionMessage = "";
    let emailTitle = "";
    let emailBody = "";

    if (currentCount === 0) {
      // FIRST OFFENSE: Delete from Clerk. This frees the email so they can sign up exactly ONE more time.
      await client.users.deleteUser(id);
      
      // Log the deletion in the tracker
      await prisma.deletionTracker.create({
        data: { email, count: 1 }
      });
      
      actionMessage = "User deleted. They are permitted to recreate their account one more time.";
      emailTitle = "Account Deleted - Second Chance Available ⚠️";
      emailBody = "Your DreamSaver account has been deleted due to a severe policy violation. Because this is your first offense, you are permitted to recreate your account using this email address ONE time. Any further violations will result in a permanent ban.";

    } else {
      // SECOND OFFENSE: They used their second chance. Permanently Ban them in Clerk.
      await client.users.banUser(id);
      
      // Update the log counter
      await prisma.deletionTracker.update({
        where: { email },
        data: { count: currentCount + 1 }
      });

      actionMessage = "User permanently BANNED. They have exhausted their recreations.";
      emailTitle = "Account Permanently Banned 🚫";
      emailBody = "Your DreamSaver account has been permanently banned. You have exhausted your second chance and are no longer permitted to use our services.";
    }

    // ✅ FIRE ENGINE: Send the final email before deleting their local DB record
    await sendNotification({
        userId: userToDelete.id, // Will be deleted from DB soon, but needed for the function signature
        email: email,
        title: emailTitle,
        message: emailBody,
        type: "SYSTEM_ALERT",
        notifyInApp: false, // They can't log in
        notifyEmail: true
    });

    // 3. Delete from Local Database
    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ message: actionMessage });

  } catch (error) {
    console.error("Delete User Error:", error);
    return NextResponse.json({ error: "Failed to process user deletion. They may have attached data." }, { status: 500 });
  }
}