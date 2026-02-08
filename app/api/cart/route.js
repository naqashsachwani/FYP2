import prisma from "@/lib/prisma"; // Prisma client to interact with the database
import { getAuth } from "@clerk/nextjs/server"; // Clerk auth for server-side user validation
import { NextResponse } from "next/server"; // Next.js response helper

// ======================== POST: Update User Cart ========================
// This endpoint updates the authenticated user's cart
export async function POST(request) {
  try {
    // Get authenticated user's ID
    const { userId } = getAuth(request);

    // Deny access if user is not authenticated
    if (!userId) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Parse cart data from request body
    const { cart } = await request.json();

    // Validate cart data
    if (!cart) {
      return NextResponse.json(
        { error: "Cart data is required" },
        { status: 400 }
      );
    }

    // Update the user's cart in the database
    const user = await prisma.user.update({
      where: { id: userId },
      data: { cart }, // Store the cart array/object
    });

    // Return success response with updated cart
    return NextResponse.json({
      message: "Cart updated successfully",
      cart: user.cart || [], // Fallback to empty array if undefined
    });

  } catch (error) {
    console.error("POST /api/cart error:", error); // Log for debugging
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// ======================== GET: Retrieve User Cart ========================
// This endpoint fetches the authenticated user's cart
export async function GET(request) {
  try {
    // Get authenticated user's ID
    const { userId } = getAuth(request);

    // Deny access if not authenticated
    if (!userId) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    // Handle case where user does not exist
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Return cart (or empty array if undefined)
    return NextResponse.json({ cart: user.cart || [] });

  } catch (error) {
    console.error("GET /api/cart error:", error); // Log errors
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
