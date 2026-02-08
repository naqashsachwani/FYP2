import { getAuth } from "@clerk/nextjs/server"; // Clerk authentication helper
import authSeller from "@/middlewares/authSeller"; // Middleware to verify if user is a seller
import { NextResponse } from "next/server"; // Next.js response helper
import imagekit from "@/configs/imageKit"; // ImageKit configuration for image uploads
import prisma from "@/lib/prisma"; // Prisma client for database operations

//  GET: Fetch all products for the authenticated seller
export async function GET(request) {
  try {
    const { userId } = getAuth(request); // Get authenticated user ID
    const storeId = await authSeller(userId); // Verify user is seller and get store ID

    if (!storeId)
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });

    // Fetch all products for this store, newest first
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

//  POST: Add a new product
export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const storeId = await authSeller(userId);

    if (!storeId)
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });

    const formData = await request.formData(); // Get submitted form data
    const name = formData.get("name");
    const description = formData.get("description");
    const mrp = Number(formData.get("mrp")); // Convert to number
    const price = Number(formData.get("price"));
    const category = formData.get("category");
    const images = formData.getAll("images"); // Get all uploaded images

    // Validate required fields
    if (!name || !description || !mrp || !price || !category || images.length < 1)
      return NextResponse.json({ error: "Missing product details" }, { status: 400 });

    // Upload images to ImageKit and get optimized URLs
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

    // Save product to database
    await prisma.product.create({
      data: { name, description, mrp, price, category, images: imageUrls, storeId },
    });

    return NextResponse.json({ message: "Product added successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

//  PUT: Edit an existing product (supports updating image)
export async function PUT(request) {
  try {
    const { userId } = getAuth(request);
    const storeId = await authSeller(userId);

    if (!storeId)
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });

    const formData = await request.formData();
    const id = formData.get("id"); // Product ID to update
    const name = formData.get("name");
    const description = formData.get("description");
    const price = Number(formData.get("price"));
    const mrp = Number(formData.get("mrp"));
    const imageFile = formData.get("image"); // Optional new image

    if (!id) return NextResponse.json({ error: "Product ID is required" }, { status: 400 });

    let updateData = { name, description, price, mrp };

    // If a new image is provided, upload it and update images array
    if (imageFile && typeof imageFile !== "string") {
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

      updateData.images = [imageUrl];
    }

    // Update product in database
    await prisma.product.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ message: "Product updated successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

//  DELETE: Remove a product
export async function DELETE(request) {
  try {
    const { userId } = getAuth(request);
    const storeId = await authSeller(userId);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id"); // Product ID to delete

    if (!storeId)
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    if (!id)
      return NextResponse.json({ error: "Missing product ID" }, { status: 400 });

    await prisma.product.delete({ where: { id } });

    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
