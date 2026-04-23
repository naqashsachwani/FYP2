import prisma from "@/lib/prisma";           // Prisma client to access your database
import { NextResponse } from "next/server";  // Next.js helper for responses

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const storeId = searchParams.get("storeId");

        // Keep the listing query lean because it powers the global public catalog.
        const products = await prisma.product.findMany({
            where: {
                ...(storeId ? { storeId } : {}),
                store: {
                    isActive: true,
                },
            },
            select: {
                id: true,
                name: true,
                description: true,
                mrp: true,
                price: true,
                images: true,
                category: true,
                inStock: true,
                storeId: true,
                createdAt: true,
                updatedAt: true,
                ratings: {
                    select: {
                        rating: true,
                    },
                },
                store: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        logo: true,
                        isActive: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(
            { products },
            {
                headers: {
                    'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
                },
            }
        )
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "An internal server error occurred" },
            { status: 500 }
        );
    }
}
