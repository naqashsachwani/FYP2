import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuth } from '@clerk/nextjs/server';
import imagekit from "@/configs/imageKit";

// ✅ NEW: GET method to check if the user already has a rider profile
export async function GET(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await prisma.riderProfile.findUnique({ 
        where: { userId } 
    });

    return NextResponse.json({ profile });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { userId } = getAuth(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const phoneNumber = formData.get("phoneNumber"); 
    const vehicleType = formData.get("vehicleType");
    const vehiclePlate = formData.get("vehiclePlate");
    const cnicNumber = formData.get("cnicNumber");
    const licenseNumber = formData.get("licenseNumber");
    
    const files = formData.getAll("idImages"); 

    if (!phoneNumber || !vehicleType || !vehiclePlate || !cnicNumber || !licenseNumber || files.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existingProfile = await prisma.riderProfile.findUnique({ where: { userId } });
    if (existingProfile) return NextResponse.json({ error: "You have already applied." }, { status: 400 });

    const uploadPromises = files.map(async (file, index) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        const uploadRes = await imagekit.upload({
          file: buffer,
          fileName: `rider-${userId}-${index}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`,
          folder: "/riders"
        });
        return uploadRes.url;
    });

    const uploadedUrls = await Promise.all(uploadPromises);
    const idImageUrlString = JSON.stringify(uploadedUrls);

    const rider = await prisma.riderProfile.create({
      data: {
        userId,
        phoneNumber, 
        vehicleType,
        vehiclePlate,
        cnicNumber,
        licenseNumber,
        idImageUrl: idImageUrlString,
        status: "PENDING_APPROVAL"
      }
    });

    return NextResponse.json({ success: true, rider });
  } catch (error) {
    if (error.code === 'P2002') return NextResponse.json({ error: "CNIC or License already registered." }, { status: 400 });
    return NextResponse.json({ error: "Failed to submit application" }, { status: 500 });
  }
}