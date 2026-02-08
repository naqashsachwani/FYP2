import { inngest } from "@/inngest/client"; // For sending events to Inngest (serverless event handling)
import prisma from "@/lib/prisma";         // Prisma client for database access
import authAdmin from "@/middlewares/authAdmin"; // Middleware to check admin authorization
import { getAuth } from "@clerk/nextjs/server"; // Get auth info from Clerk
import { NextResponse } from "next/server";     // Next.js server response helper

// ================= ADD NEW COUPON =================
export async function POST(request) {
  try {
    // Get authenticated user ID
    const { userId } = getAuth(request);

    // Check if user is admin
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }

    // Parse coupon from request body
    const { coupon } = await request.json();
    coupon.code = coupon.code.toUpperCase(); // Standardize coupon code to uppercase

    // Create coupon in database
    const createdCoupon = await prisma.coupon.create({ data: coupon });

    // Send event to Inngest to schedule coupon expiration
    await inngest.send({
      name: "app/coupon.expired", // Event name
      data: {
        code: createdCoupon.code,
        expires_at: createdCoupon.expiresAt, // Must match your schema field
      },
    });

    return NextResponse.json({ message: "Coupon added successfully", coupon: createdCoupon });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}

// ================= DELETE COUPON =================
// Delete coupon using query param: /api/admin/coupon?code=COUPONCODE
export async function DELETE(request) {
  try {
    // Get authenticated user ID
    const { userId } = getAuth(request);

    // Check admin authorization
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "not authorized" }, { status: 401 });
    }

    // Extract coupon code from query parameters
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    // Delete coupon from database
    await prisma.coupon.delete({ where: { code } });

    return NextResponse.json({ message: "Coupon deleted successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}

// ================= GET ALL COUPONS =================
export async function GET(request) {
  try {
    // Get authenticated user ID
    const { userId } = getAuth(request);

    // Check if user is admin
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "not authorized" }, { status: 401 });
    }

    // Fetch all coupons from database
    const coupons = await prisma.coupon.findMany({});
    return NextResponse.json({ coupons });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}
