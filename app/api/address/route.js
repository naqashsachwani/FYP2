import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server"; 

// ===========================
// GET: Fetch all addresses
// ===========================
export async function GET() {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const addresses = await prisma.address.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ addresses });
  } catch (error) {
    console.error("GET Address Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ===========================
// POST: Add a new address
// ===========================
export async function POST(request) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    
    // 🔍 LOG THE RECEIVED DATA
    console.log("📥 API Received Address Data:", body);

    const data = body.address || body;
    const { name, street, city, state, zip, country, phone, latitude, longitude } = data;

    if (!name || !street || !city || !zip) {
      console.log("❌ Missing Fields:", { name, street, city, zip });
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newAddress = await prisma.address.create({
      data: {
        userId: user.id,
        email: user.emailAddresses?.[0]?.emailAddress || "no-email@recorded.com", 
        name,
        street,
        city,
        state: state || "",
        zip,
        country: country || "Pakistan",
        phone: phone || "",
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
      }
    });

    console.log("✅ Address Saved Successfully:", newAddress.id);
    return NextResponse.json({ success: true, newAddress, message: 'Address added successfully' });

  } catch (error) {
    // 🛑 THIS PRINTS THE REAL ERROR TO YOUR TERMINAL
    console.error("❌ CRITICAL DB ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}