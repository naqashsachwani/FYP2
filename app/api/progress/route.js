import prisma from "@/lib/prisma"; // Import Prisma client for database access
import { getAuth } from "@clerk/nextjs/server"; // Import Clerk server-side authentication
import { NextResponse } from "next/server"; // Import Next.js Response helper

// GET handler to fetch all goals of the authenticated user
export async function GET(request) {
  // ================== AUTHENTICATION ==================
  // Get the authenticated user's ID from the request
  const { userId } = getAuth(request);

  // If user is not logged in, return 401 Unauthorized
  if (!userId)
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  // ================== FETCH GOALS ==================
  // Fetch all goals belonging to this user, including the associated product
  const goals = await prisma.goal.findMany({
    where: { userId }, // Filter goals by the authenticated user
    include: { product: true }, // Include related product info
  });

  // ================== CALCULATE PROGRESS ==================
  // Map through goals to add calculated fields:
  const goalsWithProgress = goals.map(goal => ({
    ...goal, // Spread original goal properties
    // Calculate progress percentage (saved / targetAmount * 100)
    // If targetAmount is 0, set progressPercent to 0 to avoid division by zero
    progressPercent: goal.targetAmount > 0 
      ? (Number(goal.saved) / Number(goal.targetAmount)) * 100 
      : 0,
    // Calculate remaining amount to reach the goal
    remaining: Number(goal.targetAmount) - Number(goal.saved),
  }));

  // ================== RESPONSE ==================
  // Return JSON response containing the goals with calculated progress
  return NextResponse.json({ goals: goalsWithProgress });
}
