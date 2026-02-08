import prisma from "@/lib/prisma"; // Prisma client for DB operations
import authSeller from "@/middlewares/authSeller"; // Middleware to check if user is a seller
import { getAuth } from "@clerk/nextjs/server"; // Clerk server-side authentication
import { NextResponse } from "next/server"; // Next.js response helper

// ================== POST: Update Order Status ==================
export async function POST(request) {
  try {
    //  Get authenticated user
    const { userId } = getAuth(request);

    //  Verify seller and get their storeId
    const storeId = await authSeller(userId);

    //  Unauthorized if user is not a seller
    if (!storeId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }

    //  Extract orderId and new status from request body
    const { orderId, status } = await request.json();

    //  Update the order status, ensuring it belongs to this store
    await prisma.order.updateMany({
      where: { id: orderId, storeId }, // Only allow updating orders for this store
      data: { status },
    });

    // Return success message
    return NextResponse.json({ message: "Order status updated successfully" });

  } catch (error) {
    // Log errors for debugging
    console.error(error);

    // Return 400 Bad Request with error details
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}

// ================== GET: Get All Orders for a Store ==================
export async function GET(request) {
  try {
    //  Get authenticated user
    const { userId } = getAuth(request);

    //  Verify seller and get storeId
    const storeId = await authSeller(userId);

    //  Unauthorized if not a seller
    if (!storeId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }

    // Fetch all orders for this store
    const orders = await prisma.order.findMany({
      where: { storeId }, // Only orders for this store
      include: {
        user: true, // Include user info
        address: true, // Include shipping/billing address
        coupon: true, // Include applied coupon
        orderItems: { include: { product: true } }, // Include products in the order
      },
      orderBy: { createdAt: "desc" }, // Most recent orders first
    });

    //  Return the list of orders
    return NextResponse.json({ orders });

  } catch (error) {
    // Log errors for debugging
    console.error(error);

    // Return 400 Bad Request with error details
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}
