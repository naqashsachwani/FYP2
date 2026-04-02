import prisma from "@/lib/prisma";                 
import authAdmin from "@/middlewares/authAdmin";   
import { getAuth } from "@clerk/nextjs/server";   
import { NextResponse } from "next/server";       
import { sendNotification } from "@/lib/sendNotification"; // ✅ IMPORT ENGINE

// ================= TOGGLE STORE ACTIVE STATUS =================
// Only admins can toggle a store's isActive flag
export async function POST(request) {
  try {
    // Get authenticated user ID
    const { userId } = getAuth(request);

    // Check if user is an admin
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) {
      // ❌ Deny access if not admin
      return NextResponse.json({ error: "not authorized" }, { status: 401 });
    }

    // Parse storeId from request body
    const { storeId } = await request.json();

    // Validate storeId
    if (!storeId) {
      return NextResponse.json({ error: "missing storeId" }, { status: 400 });
    }

    // Find store in the database AND grab the user info for the email
    const store = await prisma.store.findUnique({ 
        where: { id: storeId },
        include: { user: true } // ✅ Include user for notification
    });

    // Return error if store doesn't exist
    if (!store) {
      return NextResponse.json({ error: "store not found" }, { status: 400 });
    }

    const newStatus = !store.isActive;

    // Toggle isActive field: true -> false, false -> true
    await prisma.store.update({
      where: { id: storeId },
      data: { isActive: newStatus },
    });

    // ✅ FIRE ENGINE: Notify Store Owner of Suspension/Reactivation
    if (store.user) {
        const title = newStatus ? "Store Reactivated ✅" : "Store Suspended ⚠️";
        const message = newStatus 
            ? `Good news! Your store "${store.name}" has been reactivated by an admin. You can now resume operations.`
            : `Important: Your store "${store.name}" has been temporarily suspended by an admin. Please contact support for details.`;

        await sendNotification({
            userId: store.userId,
            email: store.user.email,
            title: title,
            message: message,
            type: "SYSTEM_ALERT",
            notifyInApp: true,
            notifyEmail: true
        });
    }

    // Success response
    return NextResponse.json({ message: "Store updated successfully" });
  } catch (error) {
    // Log error for debugging
    console.error(error);

    // Return error response
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}