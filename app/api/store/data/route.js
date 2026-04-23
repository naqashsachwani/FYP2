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
        const store = await prisma.store.findFirst({
            where: { username, isActive: true },
            select: {
                id: true,
                name: true,
                description: true,
                username: true,
                logo: true,
                isActive: true,
                products: {
                    where: { inStock: true },
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        mrp: true,
                        price: true,
                        images: true,
                        category: true,
                        inStock: true,
                        createdAt: true,
                        updatedAt: true,
                        ratings: {
                            select: {
                                rating: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                },
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
        return NextResponse.json(
            { store },
            {
                headers: {
                    'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
                },
            }
        );

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
