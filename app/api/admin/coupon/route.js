import { inngest } from "@/inngest/client"; 
import prisma from "@/lib/prisma";         
import authAdmin from "@/middlewares/authAdmin"; 
import { getAuth } from "@clerk/nextjs/server"; 
import { NextResponse } from "next/server";     

// ================= ADD NEW COUPON =================
export async function POST(request) {
  try {
    // Authentication
    const { userId } = getAuth(request);

    // Authorization (Role-Based Access Control)
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) {
      // Reject immediately if the user lacks the proper role
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }

    // Payload Parsing
    const { coupon } = await request.json();
    
    const {
      code,
      description,
      discount,
      usageLimit, 
      forNewUser,
      forMember,
      isPublic,
      expiresAt
    } = coupon;

    // Database Insertion
    const createdCoupon = await prisma.coupon.create({ 
      data: {
        code: code.toUpperCase(), 
        description,
        discount,
        usageLimit: usageLimit || 1, 
        forNewUser,
        forMember,
        isPublic,
        expiresAt
      } 
    });

    // Send an asynchronous event to Inngest to handle the expiration logic.
    await inngest.send({
      name: "app/coupon.expired", 
      data: {
        code: createdCoupon.code,
        expires_at: createdCoupon.expiresAt, 
      },
    });

    return NextResponse.json({ message: "Coupon added successfully", coupon: createdCoupon });
  } catch (error) {
    // Catch database errors (e.g., trying to create a coupon code that already exists)
    console.error(error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}

// ================= DELETE COUPON =================
export async function DELETE(request) {
  try {
    // Authentication
    const { userId } = getAuth(request);

    // Authorization
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "not authorized" }, { status: 401 });
    }

    // Extract Parameters
    // Parse the URL to grab query parameters. 
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

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
    // Authentication
    const { userId } = getAuth(request);

    //Authorization
    const isAdmin = await authAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: "not authorized" }, { status: 401 });
    }

    // Fetch all records from the 'coupon' table
    const coupons = await prisma.coupon.findMany({
        orderBy: { createdAt: 'desc' }
    });
    
    // Return the array of coupons to the frontend admin dashboard
    return NextResponse.json({ coupons });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 });
  }
}