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
