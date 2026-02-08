import prisma from "@/lib/prisma"; // Prisma client for database operations
import { getAuth } from "@clerk/nextjs/server"; // Clerk server-side authentication
import { NextResponse } from "next/server"; // Next.js Response helper

// ================== GET: Check if user has a store ==================
export async function GET(request) {
  // Get the authenticated user's ID from the request
  const { userId } = getAuth(request);

  // If user is not logged in, return exists: false
  if (!userId) return NextResponse.json({ exists: false });

  // Fetch the store associated with this user
  // Include the related store application to get review notes and status
  const store = await prisma.store.findUnique({
    where: { userId }, // Find store by owner userId
    include: {
      storeApplication: {
        select: {
          reviewNotes: true, // Notes from the review process
          status: true,      // Application status (e.g., PENDING, APPROVED, REJECTED)
        }
      }
    }
  });

  // If a store exists, return exists: true with full store details
  if (store) {
    return NextResponse.json({ exists: true, store });
  }

  // If no store found, return exists: false
  return NextResponse.json({ exists: false });
}
