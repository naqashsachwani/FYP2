import prisma from "@/lib/prisma" 
import { getAuth } from "@clerk/nextjs/server" 
import { NextResponse } from "next/server" 
import imagekit from "@/configs/imageKit" 
import { sendNotification } from "@/lib/sendNotification" // ✅ IMPORT ENGINE

// ================== POST: Create or Resubmit Store Application ==================
export async function POST(request) {
  try {
    // ================== AUTHENTICATION ==================
    const { userId } = getAuth(request)
    if (!userId) 
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // ================== FORM DATA ==================
    const formData = await request.formData()
    
    // Extract all fields from form data
    const name = formData.get("name")
    const username = formData.get("username")
    const description = formData.get("description")
    const email = formData.get("email")
    const contact = formData.get("contact")
    const address = formData.get("address")
    const imageFile = formData.get("image")
    const cnic = formData.get("cnic")
    const taxId = formData.get("taxId")
    const bankName = formData.get("bankName")
    const accountNumber = formData.get("accountNumber")

    // Validate required fields
    if (!name || !username || !email || !contact || !address || !cnic || !bankName || !accountNumber) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // ================== IMAGE UPLOAD ==================
    let logoUrl = null
    if (imageFile && typeof imageFile !== "string") {
      // Convert file to buffer
      const buffer = Buffer.from(await imageFile.arrayBuffer())
      // Upload to ImageKit
      const uploadRes = await imagekit.upload({
        file: buffer,
        fileName: `store_logo_${username}`,
        folder: "stores"
      })
      logoUrl = uploadRes.url // Store uploaded image URL
    }

    // ================== EXISTING STORE CHECK ==================
    const existingStore = await prisma.store.findUnique({ where: { userId } })

    // ================== RESUBMISSION LOGIC ==================
    if (existingStore) {
      // Case 1: Already approved → cannot resubmit
      if (existingStore.status === 'approved') {
        return NextResponse.json({ error: "Store already exists" }, { status: 400 })
      }
      // Case 2: Application pending → cannot resubmit
      else if (existingStore.status === 'pending') {
        return NextResponse.json({ error: "Application already under review" }, { status: 400 })
      }
      
      // Case 3: Rejected → allow resubmission
      await prisma.$transaction(async (tx) => {
        // Update store info
        const updateData = {
          name, username, description, email, contact, address,
          status: "pending", // Reset to pending
          isActive: false
        }
        if (logoUrl) updateData.logo = logoUrl // Update logo if provided

        await tx.store.update({
          where: { id: existingStore.id },
          data: updateData
        })

        //  Update or create store application
        const appData = {
          businessName: name,
          contactEmail: email,
          contactPhone: contact,
          address: address,
          cnic: cnic,
          taxId: taxId || null,
          bankName: bankName,
          accountNumber: accountNumber,
          status: "PENDING", // Reset to pending
          reviewNotes: null, // Clear previous rejection notes
          reviewedBy: null,
          reviewedAt: null
        }
        
        await tx.storeApplication.upsert({
          where: { storeId: existingStore.id },
          update: appData, // Update existing application
          create: {
            userId,
            storeId: existingStore.id,
            ...appData,
            documents: { logo: logoUrl || existingStore.logo } // Attach logo
          }
        })
      })

      // ✅ FIRE ENGINE: Notify user of resubmission
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
          await sendNotification({
              userId: user.id,
              email: user.email,
              title: "Store Application Resubmitted 🏪",
              message: `Your revised application for "${name}" has been received. Our team will review it shortly.`,
              type: "SYSTEM_ALERT",
              notifyInApp: true,
              notifyEmail: true
          });
      }

      return NextResponse.json({ message: "Application resubmitted successfully!" })
    }

    // ================== NEW STORE CREATION ==================
    await prisma.$transaction(async (tx) => {
      //  Create store
      const newStore = await tx.store.create({
        data: {
          userId,
          name,
          username,
          description,
          email,
          contact,
          address,
          logo: logoUrl || "", 
          status: "pending",
          isActive: false 
        }
      })

      // Create store application with documents
      await tx.storeApplication.create({
        data: {
          userId,
          storeId: newStore.id,
          businessName: name,
          contactEmail: email,
          contactPhone: contact,
          address: address,
          cnic: cnic,
          taxId: taxId || null,
          bankName: bankName,
          accountNumber: accountNumber,
          documents: { logo: logoUrl },
          status: "PENDING"
        }
      })
    })

    // ✅ FIRE ENGINE: Notify user of initial submission
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
        await sendNotification({
            userId: user.id,
            email: user.email,
            title: "Store Application Received 🏪",
            message: `Your application to open "${name}" has been received successfully! Our team is currently reviewing your details.`,
            type: "SYSTEM_ALERT",
            notifyInApp: true,
            notifyEmail: true
        });
    }

    return NextResponse.json({ message: "Store application submitted successfully!" })

  } catch (error) {
    console.error("Create Store Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}