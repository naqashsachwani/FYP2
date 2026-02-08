import prisma from "@/lib/prisma";                 // Prisma client for DB operations
import authAdmin from "@/middlewares/authAdmin";   // Middleware to check admin access
import { getAuth } from "@clerk/nextjs/server";   // Clerk server-side authentication
import { NextResponse } from "next/server";       // Next.js response helper

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

    // Find store in the database
    const store = await prisma.store.findUnique({ where: { id: storeId } });

    // Return error if store doesn't exist
    if (!store) {
      return NextResponse.json({ error: "store not found" }, { status: 400 });
    }

    // Toggle isActive field: true -> false, false -> true
    await prisma.store.update({
      where: { id: storeId },
      data: { isActive: !store.isActive },
    });

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
