import prisma from "@/lib/prisma"; // Prisma client for DB access
import { getAuth } from "@clerk/nextjs/server"; // Clerk server-side authentication helper
import { NextResponse } from "next/server"; // Next.js response helper

// ==============================
// POST: Validate a coupon code
// ==============================
export async function POST(request) {
  try {
    // 1️⃣ Get authenticated user info from Clerk
    const { userId, has } = getAuth(request); // `has` is used to check subscription/plan

    // 2️⃣ Parse coupon code from request body
    const { code } = await request.json();

    // 3️⃣ Validate input
    if (!code) {
      return NextResponse.json(
        { error: "Coupon code is required" },
        { status: 400 }
      );
    }

    // 4️⃣ Find coupon in database and ensure it is not expired
    const coupon = await prisma.coupon.findFirst({
      where: {
        code: code.toUpperCase(), // Case-insensitive match
        expiresAt: { gt: new Date() }, // Ensure coupon hasn't expired
      },
    });

    // 5️⃣ If coupon not found or expired, return error
    if (!coupon) {
      return NextResponse.json(
        { error: "Invalid or expired coupon" },
        { status: 400 }
      );
    }

    // 6️⃣ Restrict coupon to new users only (if applicable)
    if (coupon.forNewUser) {
      const userOrders = await prisma.order.findMany({ where: { userId } });
      if (userOrders.length > 0) {
        return NextResponse.json(
          { error: "Coupon valid for new users only" },
          { status: 400 }
        );
      }
    }

    // 7️⃣ Restrict coupon to Plus plan members only (if applicable)
    if (coupon.forMember) {
      const hasPlusPlan = has({ plan: "plus" });
      if (!hasPlusPlan) {
        return NextResponse.json(
          { error: "Coupon valid for members only" },
          { status: 400 }
        );
      }
    }

    // 8️⃣ If all checks pass, return coupon details
    return NextResponse.json({ coupon });
  } catch (error) {
    // Log server errors for debugging
    console.error(error);

    // Return generic server error if something fails
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
