import prisma from "@/lib/prisma"; // Import Prisma client for database access
import { NextResponse } from "next/server"; // Import Next.js Response helper

// GET handler to fetch product details by productId
export async function GET(request, context) {
  // ================== PARAMS ==================
  // Extract 'productId' from URL params
  const { productId } = await context.params; 

  // Validate productId: return 400 if not provided
  if (!productId) {
    return NextResponse.json(
      { error: "Product ID is required" },
      { status: 400 }
    );
  }

  // ================== FETCH PRODUCT ==================
  // Fetch product from database with related ratings and store
  const product = await prisma.product.findUnique({
    where: { id: productId }, // Filter by ID
    include: {
      ratings: {
        select: {
          rating: true, // Include numeric rating
          review: true, // Include review text
          user: { select: { name: true, image: true } }, // Include reviewer details
        },
      },
      store: true, // Include store information
    },
  });

  // If product does not exist, return 404
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  // If the product's store is inactive, prevent access
  if (!product.store.isActive) {
    return NextResponse.json(
      { error: "Product store is not active" },
      { status: 404 }
    );
  }

  // ================== SUCCESS RESPONSE ==================
  // Return product details including ratings and store info
  return NextResponse.json({ product });
}
