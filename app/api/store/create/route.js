import prisma from "@/lib/prisma" 
import { getAuth } from "@clerk/nextjs/server" 
import { NextResponse } from "next/server" 
import imagekit from "@/configs/imageKit" 
import { sendNotification } from "@/lib/sendNotification" 
import { writeSecurityAuditLog } from "@/lib/security/auditLog"
import { getRequestContext } from "@/lib/security/requestContext"
import { checkRateLimit } from "@/lib/security/rateLimit"
import { validateImageFiles } from "@/lib/security/uploadValidation"

export async function POST(request) {
  try {
    // ================== AUTHENTICATION ==================
    const { userId } = getAuth(request)
    const context = getRequestContext(request, userId)
    if (!userId) 
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const rateLimit = checkRateLimit({
      key: `store-application:${userId}:${context.ipAddress}`,
      limit: 5,
      windowMs: 60 * 60 * 1000,
    })
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "Too many store application attempts. Please try again later." }, { status: 429 })
    }

    // ================== FORM DATA ==================
    const formData = await request.formData()
    
    const name = formData.get("name")
    const username = formData.get("username")
    const description = formData.get("description")
    const email = formData.get("email")
    const contact = formData.get("contact")
    const address = formData.get("address")
    const cnic = formData.get("cnic")
    const taxId = formData.get("taxId")
    const bankName = formData.get("bankName")
    const accountNumber = formData.get("accountNumber")

    // Parse existing images that were kept during a resubmission
    const existingImages = JSON.parse(formData.get("existingImages") || "[]")

    if (!name || !username || !email || !contact || !address || !cnic || !bankName || !accountNumber) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // ================== MULTI-IMAGE UPLOAD ==================
    const newImageFiles = formData.getAll("images") // Get all uploaded files
    let uploadedImageUrls = []

    if (newImageFiles.length > 0) {
      // Validate all files at once
      const uploadValidation = validateImageFiles(newImageFiles, { maxImages: 5, maxFileBytes: 3 * 1024 * 1024 })
      if (!uploadValidation.ok) {
        return NextResponse.json({ error: uploadValidation.error }, { status: 400 })
      }

      // Upload files concurrently to ImageKit
      const uploadPromises = newImageFiles.map(async (file, index) => {
        const buffer = Buffer.from(await file.arrayBuffer())
        const uploadRes = await imagekit.upload({
          file: buffer,
          fileName: `store_img_${username}_${Date.now()}_${index}`,
          folder: "stores"
        })
        return uploadRes.url
      })

      uploadedImageUrls = await Promise.all(uploadPromises)
    }

    // Combine existing images (if resubmitting) with newly uploaded ones
    const finalImagesArray = [...existingImages, ...uploadedImageUrls]
    // Designate the first image as the main logo (fallback to empty if none)
    const logoUrl = finalImagesArray.length > 0 ? finalImagesArray[0] : ""

    // ================== EXISTING STORE CHECK ==================
    const existingStore = await prisma.store.findUnique({ where: { userId } })

    // ================== RESUBMISSION LOGIC ==================
    if (existingStore) {
      if (existingStore.status === 'approved') return NextResponse.json({ error: "Store already exists" }, { status: 400 })
      if (existingStore.status === 'pending') return NextResponse.json({ error: "Application already under review" }, { status: 400 })
      
      await prisma.$transaction(async (tx) => {
        await tx.store.update({
          where: { id: existingStore.id },
          data: {
            name, username, description, email, contact, address,
            status: "pending", isActive: false,
            logo: logoUrl,
            images: finalImagesArray // Save array of images
          }
        })

        const appData = {
          businessName: name, contactEmail: email, contactPhone: contact,
          address: address, cnic: cnic, taxId: taxId || null,
          bankName: bankName, accountNumber: accountNumber,
          status: "PENDING", reviewNotes: null, reviewedBy: null, reviewedAt: null
        }
        
        await tx.storeApplication.upsert({
          where: { storeId: existingStore.id },
          update: appData,
          create: {
            userId, storeId: existingStore.id, ...appData,
            documents: { images: finalImagesArray }
          }
        })
      })

      // Notify user
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
          await sendNotification({
              userId: user.id, email: user.email, title: "Store Application Resubmitted 🏪",
              message: `Your revised application for "${name}" has been received.`,
              type: "SYSTEM_ALERT", notifyInApp: true, notifyEmail: true
          });
      }

      await writeSecurityAuditLog({
        action: "STORE_APPLICATION_RESUBMIT", actorUserId: userId, entityType: "Store",
        entityId: existingStore.id, ipAddress: context.ipAddress, userAgent: context.userAgent,
        metadata: { username, status: "pending" },
      })

      return NextResponse.json({ message: "Application resubmitted successfully!" })
    }

    // ================== NEW STORE CREATION ==================
    const createdStore = await prisma.$transaction(async (tx) => {
      const newStore = await tx.store.create({
        data: {
          userId, name, username, description, email, contact, address,
          logo: logoUrl, 
          images: finalImagesArray, // Save array
          status: "pending", isActive: false 
        }
      })

      await tx.storeApplication.create({
        data: {
          userId, storeId: newStore.id, businessName: name, contactEmail: email,
          contactPhone: contact, address: address, cnic: cnic, taxId: taxId || null,
          bankName: bankName, accountNumber: accountNumber,
          documents: { images: finalImagesArray },
          status: "PENDING"
        }
      })

      return newStore
    })

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
        await sendNotification({
            userId: user.id, email: user.email, title: "Store Application Received 🏪",
            message: `Your application to open "${name}" has been received successfully!`,
            type: "SYSTEM_ALERT", notifyInApp: true, notifyEmail: true
        });
    }

    await writeSecurityAuditLog({
      action: "STORE_APPLICATION_CREATE", actorUserId: userId, entityType: "Store",
      entityId: createdStore.id, ipAddress: context.ipAddress, userAgent: context.userAgent,
      metadata: { username, status: "pending" },
    })

    return NextResponse.json({ message: "Store application submitted successfully!" })

  } catch (error) {
    console.error("Create Store Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}