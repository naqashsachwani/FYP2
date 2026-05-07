import { getAuth } from "@clerk/nextjs/server"; 
import authSeller from "@/middlewares/authSeller"; 
import { NextResponse } from "next/server"; 
import imagekit from "@/configs/imageKit"; 
import prisma from "@/lib/prisma"; 
import { writeSecurityAuditLog } from "@/lib/security/auditLog";
import { getRequestContext } from "@/lib/security/requestContext";
import { checkRateLimit } from "@/lib/security/rateLimit";
import { validateImageFiles } from "@/lib/security/uploadValidation";

// GET: Fetch all products
export async function GET(request) {
  try {
    const { userId } = getAuth(request); 
    const storeId = await authSeller(userId); 

    if (!storeId) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

    const products = await prisma.product.findMany({
      where: { storeId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// POST: Add a new product
export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const storeId = await authSeller(userId);
    const context = getRequestContext(request, userId);

    if (!storeId) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

    const rateLimit = checkRateLimit({
      key: `store-product-create:${userId}:${context.ipAddress}`,
      limit: 10,
      windowMs: 60 * 1000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "Too many product changes. Please try again shortly." }, { status: 429 });
    }

    const formData = await request.formData(); 
    const name = formData.get("name");
    const description = formData.get("description");
    const mrp = Number(formData.get("mrp")); 
    const price = Number(formData.get("price"));
    const category = formData.get("category");
    const images = formData.getAll("images"); 

    if (!name || !description || !mrp || !price || !category || images.length < 1)
      return NextResponse.json({ error: "Missing product details" }, { status: 400 });

    const uploadValidation = validateImageFiles(images);
    if (!uploadValidation.ok) {
      return NextResponse.json({ error: uploadValidation.error }, { status: 400 });
    }

    const imageUrls = await Promise.all(
      images.map(async (image) => {
        const buffer = Buffer.from(await image.arrayBuffer());
        const response = await imagekit.upload({
          file: buffer,
          fileName: image.name,
          folder: "products",
        });

        return imagekit.url({
          path: response.filePath,
          transformation: [
            { quality: "auto" },
            { format: "webp" },
            { width: "1024" },
          ],
        });
      })
    );

    const product = await prisma.product.create({
      data: { name, description, mrp, price, category, images: imageUrls, storeId },
    });

    await writeSecurityAuditLog({
      action: "STORE_PRODUCT_CREATE",
      actorUserId: userId,
      entityType: "Product",
      entityId: product.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: { storeId, category },
    });

    return NextResponse.json({ message: "Product added successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// PUT: Edit an existing product (supports updating specific images)
export async function PUT(request) {
  try {
    const { userId } = getAuth(request);
    const storeId = await authSeller(userId);
    const context = getRequestContext(request, userId);

    if (!storeId) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

    const rateLimit = checkRateLimit({
      key: `store-product-update:${userId}:${context.ipAddress}`,
      limit: 20,
      windowMs: 60 * 1000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "Too many product changes. Please try again shortly." }, { status: 429 });
    }

    const formData = await request.formData();
    const id = formData.get("id"); 
    const name = formData.get("name");
    const description = formData.get("description");
    const price = Number(formData.get("price"));
    const mrp = Number(formData.get("mrp"));

    if (!id) return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    
    // Fetch the existing product to retrieve its current images array
    const existingProduct = await prisma.product.findFirst({
      where: { id, storeId },
      select: { id: true, images: true },
    });
    
    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    let updateData = { name, description, price, mrp };
    let updatedImages = [...existingProduct.images];
    let hasImageUpdates = false;

    // Loop through existing images to see if specific indexes were replaced
    for (let i = 0; i < updatedImages.length; i++) {
      const imageFile = formData.get(`image_${i}`);
      
      if (imageFile && typeof imageFile !== "string") {
        const uploadValidation = validateImageFiles([imageFile], { maxImages: 1 });
        if (!uploadValidation.ok) {
          return NextResponse.json({ error: uploadValidation.error }, { status: 400 });
        }

        const buffer = Buffer.from(await imageFile.arrayBuffer());
        const response = await imagekit.upload({
          file: buffer,
          fileName: imageFile.name,
          folder: "products",
        });

        const imageUrl = imagekit.url({
          path: response.filePath,
          transformation: [
            { quality: "auto" },
            { format: "webp" },
            { width: "1024" },
          ],
        });

        updatedImages[i] = imageUrl; // Replace specifically at this index
        hasImageUpdates = true;
      }
    }

    // Only update images array if at least one image was modified
    if (hasImageUpdates) {
        updateData.images = updatedImages;
    }

    await prisma.product.update({
      where: { id: existingProduct.id },
      data: updateData,
    });

    await writeSecurityAuditLog({
      action: "STORE_PRODUCT_UPDATE",
      actorUserId: userId,
      entityType: "Product",
      entityId: existingProduct.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: { storeId },
    });

    return NextResponse.json({ message: "Product updated successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// DELETE: Remove a product
export async function DELETE(request) {
  try {
    const { userId } = getAuth(request);
    const storeId = await authSeller(userId);
    const context = getRequestContext(request, userId);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id"); 

    if (!storeId) return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    if (!id) return NextResponse.json({ error: "Missing product ID" }, { status: 400 });

    const existingProduct = await prisma.product.findFirst({
      where: { id, storeId },
      select: { id: true },
    });
    if (!existingProduct) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    await prisma.product.delete({ where: { id: existingProduct.id } });

    await writeSecurityAuditLog({
      action: "STORE_PRODUCT_DELETE",
      actorUserId: userId,
      entityType: "Product",
      entityId: existingProduct.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: { storeId },
    });

    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}