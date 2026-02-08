import prisma from "@/lib/prisma"; // Prisma client for database operations
import authAdmin from "@/middlewares/authAdmin"; // Middleware to check if user is admin
import { getAuth } from "@clerk/nextjs/server"; // Clerk server-side auth helper
import { NextResponse } from "next/server"; // Next.js response helper

// ================================
// POST: Approve or Reject a Store
// ================================
export async function POST(request) {
  try {
    // Get authenticated user ID
    const { userId } = getAuth(request);

    // Check if user is an admin
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "not-authorized" }, { status: 401 });
    }

    // Parse storeId and status ('approved' or 'rejected') from request body
    const { storeId, status } = await request.json();

    //  Execute transactional update to ensure consistency
    await prisma.$transaction(async (tx) => {
        // ---- Update the store's status and active flag ----
        const storeUpdateData = {
            status: status, // store status = 'approved' or 'rejected'
            isActive: status === "approved" // Only active if approved
        };
        await tx.store.update({
            where: { id: storeId },
            data: storeUpdateData
        });

        // ---- Update the associated store application ----
        const appStatus = status === "approved" ? "APPROVED" : "REJECTED";
        
        // Use updateMany in case there are multiple applications for the same store (edge case)
        await tx.storeApplication.updateMany({
            where: { storeId: storeId },
            data: { 
                status: appStatus,
                reviewedBy: userId, // Track which admin reviewed it
                reviewedAt: new Date() // Timestamp of review
            }
        });
    });

    //  Return success message
    return NextResponse.json({ message: `Store ${status} successfully` });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}

// ==========================================
// GET: Fetch all pending or rejected stores
// ==========================================
export async function GET(request) {
  try {
    // 1️⃣ Get authenticated user ID
    const { userId } = getAuth(request);

    // 2️⃣ Ensure user is an admin
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "not authorized" }, { status: 401 });
    }

    // 3️⃣ Fetch stores with status 'pending' or 'rejected'
    // Include user and storeApplication data for admin panel display
    const stores = await prisma.store.findMany({
      where: { status: { in: ["pending", "rejected"] } },
      include: { 
          user: true, // Include user info (name, email)
          storeApplication: true // Include application info (CNIC, bank, etc.)
      },
    });

    // 4️⃣ Return stores data
    return NextResponse.json({ stores });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}
