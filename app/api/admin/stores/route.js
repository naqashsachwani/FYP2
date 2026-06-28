import prisma from "@/lib/prisma"; // Prisma client for database operations
import authAdmin from "@/middlewares/authAdmin"; // Middleware to check if user is admin
import { getAuth } from "@clerk/nextjs/server"; // Clerk server-side auth helper
import { NextResponse } from "next/server"; // Next.js response helper

// ==============================
// GET: Fetch all approved stores (Admin only)
// ==============================
export async function GET(request) {
  try {
    // Get authenticated user ID
    const { userId } = getAuth(request);

    // Check if the user is an admin
    const isAdmin = await authAdmin(userId);

    // Deny access if not admin
    if (!isAdmin) {
      return NextResponse.json(
        { error: "not authorized" },
        { status: 401 }
      );
    }

    // Fetch all approved stores from the database
    const stores = await prisma.store.findMany({
      where: { status: "approved" }, // Only approved stores
      include: { 
        user: true, // Include owner/user info (name, email)
        storeApplication: true // Include application info (CNIC, bank info, legal docs)
      },
      orderBy: { createdAt: "desc" }, // Latest approved stores first
    });

    // Return the list of stores
    return NextResponse.json({ stores });
  } catch (error) {
    // Log errors for debugging
    console.error(error);

    // Return error response with status 400
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}

// ==============================
// DELETE: Remove a store from the platform (Admin only)
// ==============================
export async function DELETE(request) {
  try {
    // 1. Authenticate the User
    const { userId } = getAuth(request);
    const isAdmin = await authAdmin(userId);
    
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    // 2. Extract the store ID from the URL search params (e.g., ?id=123)
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('id');

    if (!storeId) {
      return NextResponse.json({ error: "Store ID is required" }, { status: 400 });
    }

    // 3. Delete the store from the database
    // Note: If you have foreign key constraints (like products tied to this store), 
    // Prisma will handle cascading deletes if you configured it in your schema.prisma.
    // Otherwise, you may need to delete those related records first.
    await prisma.store.delete({
      where: {
        id: storeId
      }
    });

    // 4. Return Success
    return NextResponse.json({ message: "Store deleted successfully" }, { status: 200 });

  } catch (error) {
    console.error("Error deleting store:", error);
    
    // If the record doesn't exist, Prisma throws a specific error code (P2025)
    if (error.code === 'P2025') {
       return NextResponse.json({ error: "Store not found in database" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to delete store from database" },
      { status: 500 }
    );
  }
}