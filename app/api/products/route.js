import prisma from "@/lib/prisma";           // Prisma client to access your database
import { NextResponse } from "next/server";  // Next.js helper for responses

export async function GET(request) {
    try {
        // 1Fetch all products from the database
        let products = await prisma.product.findMany({
            // Removed `where: { inStock: true }` so all products are fetched.
            // Stock availability will be handled in the UI instead.

            include: {
                // Include related ratings with only necessary fields
                ratings: {  
                    select: {
                        createdAt: true,      // When the rating was made
                        rating: true,         // Rating value (1-5)
                        review: true,         // Optional review text
                        user: { select: { name: true, image: true } } // Only user name & image
                    }
                },
                // Include the product's store information
                store: true,
            },
            // Order products so newest ones appear first
            orderBy: { createdAt: 'desc' }
        })

        // Filter out products whose STORE is inactive
        // Even if the product is in stock, we don't show it if its store is inactive
        products = products.filter(product => product.store.isActive)

        // Return the filtered products
        return NextResponse.json({ products })
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "An internal server error occurred" },
            { status: 500 }
        );
    }
}
