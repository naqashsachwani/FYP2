import prisma from "@/lib/prisma"; // Import Prisma client for database operations
import { getAuth } from "@clerk/nextjs/server"; // Import Clerk for server-side authentication
import { NextResponse } from "next/server"; // Import Next.js response helper


// ================== POST: Add new rating ==================
export async function POST(request) {
    try {
        // Get authenticated user's ID
        const { userId } = getAuth(request);

        // Extract data from request body
        const { orderId, productId, rating, review } = await request.json();

        // Verify that the order exists and belongs to the user
        const order = await prisma.order.findUnique({
            where: { id: orderId, userId } // Only allow rating if user owns the order
        });

        if (!order) {
            // Return 404 if order not found or does not belong to user
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // Check if this product has already been rated for this order
        const isAlreadyRated = await prisma.rating.findFirst({
            where: { productId, orderId }
        });

        if (isAlreadyRated) {
            // Prevent duplicate ratings
            return NextResponse.json({ error: "Product already rated" }, { status: 400 });
        }

        // Create new rating in the database
        const response = await prisma.rating.create({
            data: { userId, productId, rating, review, orderId }
        });

        // Return success message with the newly created rating
        return NextResponse.json({ message: "Rating added successfully", rating: response });

    } catch (error) {
        // Log the error for debugging
        console.error(error);

        // Return error response
        return NextResponse.json({ error: error.code || error.message }, { status: 400 });
    }
}


// ================== GET: Fetch all ratings for authenticated user ==================
export async function GET(request) {
    try {
        // Get authenticated user's ID
        const { userId } = getAuth(request);

        // If user is not logged in, return 401
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch all ratings created by this user
        const ratings = await prisma.rating.findMany({
            where: { userId }
        });

        // Return the list of ratings
        return NextResponse.json(ratings);

    } catch (error) {
        // Log the error for debugging
        console.error(error);

        // Return error response
        return NextResponse.json({ error: error.code || error.message }, { status: 400 });
    }
}
