import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server"; 
import { sendNotification } from "@/lib/sendNotification"; 


export async function GET() {
  try {
    // Attempt to securely identify the user making the request via Clerk's session token
    const user = await currentUser();
    
    // Auth Guard: If the user is not logged in, immediately reject the request with a 401 Unauthorized status
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

export async function POST(request) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    console.log(" API Received Address Data:", body);
    const data = body.address || body;
    const { name, street, city, state, zip, country, phone, latitude, longitude } = data;
  
    if (!name || !street || !city) {
      console.log(" Missing Fields:", { name, street, city });
      // If missing, reject the request with a 400 Bad Request status
      return NextResponse.json({ error: "Missing required fields (Name, Street, City)" }, { status: 400 });
    }

    // Create a new record in the database using Prisma
    const newAddress = await prisma.address.create({
      data: {
        userId: user.id, 
        email: user.emailAddresses?.[0]?.emailAddress || "no-email@recorded.com", 
        name,
        street,
        city,
        state: state || "",
        zip: zip || "00000",
        country: country || "Pakistan",
        phone: phone || "",
        // Convert string coordinates from the frontend into precise float numbers for the database.
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
      }
    });

    await sendNotification({
      userId: user.id,
      title: "New Address Added ",
      message: `Your address at ${street}, ${city} was saved successfully.`,
      type: "SYSTEM_ALERT",
      notifyInApp: true,   
      notifyEmail: false  
    });

    // Log success to the server console
    console.log(" Address Saved Successfully:", newAddress.id);
    return NextResponse.json({ success: true, newAddress, message: 'Address added successfully' });

  } catch (error) {
    //  THIS PRINTS THE REAL ERROR TO YOUR TERMINAL
    console.error(" CRITICAL DB ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}