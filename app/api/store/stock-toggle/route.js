import { getAuth } from "@clerk/nextjs/server"; // Clerk authentication helper
import authSeller from "@/middlewares/authSeller"; // Middleware to verify if user is a seller
import prisma from "@/lib/prisma"; // Prisma client for database operations
import { NextResponse } from "next/server"; // Next.js response helper

// POST API route to toggle the stock status of a product
export async function POST(request) {
  try {
    // 1. Get the authenticated user's ID
    const { userId } = getAuth(request);

    // 2. Parse JSON body to get the productId
    const { productId } = await request.json();

    // 3. Validate input: ensure productId is provided
    if (!productId) {
      return NextResponse.json(
        { error: "Missing productId" },
        { status: 400 } // Bad Request
      );
    }

    // 4. Verify the user is a seller and get their storeId
    const storeId = await authSeller(userId);
    if (!storeId) {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 401 } // Unauthorized
      );
    }

    // 5. Check if the product exists and belongs to this seller's store
    const product = await prisma.product.findFirst({
      where: { id: productId, storeId },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 } // Not Found
      );
    }

    // 6. Toggle the inStock status (true → false or false → true)
    await prisma.product.update({
      where: { id: productId },
      data: { inStock: !product.inStock },
    });

    // 7. Return success response
    return NextResponse.json({ message: "Product stock updated successfully" });
  } catch (error) {
    // 8. Catch and log any errors
    console.error("Toggle Stock API Error:", error);

    // 9. Return error response
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
