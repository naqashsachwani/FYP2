import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import authRider from "@/middlewares/authRider";

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    
    // 1. Not logged in
    if (!userId) {
      return NextResponse.json({ isRider: false }, { status: 401 });
    }

    // 2. Use your existing middleware to check if they are an APPROVED rider
    const riderId = await authRider(userId);

    if (riderId) {
      return NextResponse.json({ isRider: true });
    }

    // 3. Logged in, but either hasn't applied, is pending, suspended, or rejected
    return NextResponse.json({ isRider: false });
    
  } catch (error) {
    console.error("is-rider API error:", error);
    return NextResponse.json({ isRider: false, error: error.message }, { status: 500 });
  }
}