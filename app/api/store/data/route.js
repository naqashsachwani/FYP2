import prisma from "@/lib/prisma"; // Prisma client to interact with the database
import { NextResponse } from "next/server"; // Next.js response helper

// GET API route to fetch store details by username
export async function GET(request) {
    try {
        // 1. Extract query parameters from the request URL
        const { searchParams } = new URL(request.url);

        // 2. Get the 'username' parameter and convert to lowercase for consistency
        const username = searchParams.get('username')?.toLowerCase();

        // 3. Validate input: ensure username is provided
        if (!username) {
            return NextResponse.json(
                { error: "Missing username" }, // Error message
                { status: 400 } // Bad Request status
            );
        }

        // 4. Query the database for a store matching the username and active status
        const store = await prisma.store.findUnique({
            where: { username, isActive: true }, // Look for an active store with this username
            include: {
                // Include all products of the store
                products: { 
                    include: { rating: true } // Also include all ratings for each product
                }
            }
        });

        // 5. Handle case when store is not found
        if (!store) {
            return NextResponse.json(
                { error: "Store not found" }, // Error message
                { status: 404 } // Not Found status
            );
        }

        // 6. Return the store data including products and ratings
        return NextResponse.json({ store });

    } catch (error) {
        // 7. Catch any unexpected errors and log them
        console.error("API Error:", error);

        // 8. Return a 500 Internal Server Error response with the error message
        return NextResponse.json(
            { error: error.message || "Internal Server Error" }, 
            { status: 500 }
        );
    }
}
