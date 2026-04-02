import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import imagekit from "@/configs/imageKit";
import { revalidatePath } from "next/cache";
import { sendNotification } from "@/lib/sendNotification"; // ✅ IMPORT ENGINE

export async function POST(req) {
    try {
        const { userId } = getAuth(req);
        
        if (!userId) {
            return NextResponse.json({ error: "You must be logged in to leave a review." }, { status: 401 });
        }

        const body = await req.json();
        const { productId, rating, review, images } = body;

        // 1. Basic Validation
        if (!productId || !rating) {
            return NextResponse.json({ error: "Product ID and Rating are required." }, { status: 400 });
        }

        // --- UPDATED: Allow up to 5 images ---
        if (images && Array.isArray(images) && images.length > 5) {
            return NextResponse.json({ error: "You can only upload a maximum of 5 images." }, { status: 400 });
        }

        // 2. FIND THE DELIVERED GOAL
        const completedGoal = await prisma.goal.findFirst({
            where: {
                userId: userId,
                productId: productId,
                delivery: { status: 'DELIVERED' }
            },
            include: { delivery: true }
        });

        if (!completedGoal || !completedGoal.delivery) {
            return NextResponse.json({ 
                error: "You can only review products after your DreamSaver Goal has been successfully delivered." 
            }, { status: 403 });
        }

        // 3. ENFORCE "WRITE ONCE" RULE
        const existingRating = await prisma.rating.findFirst({
            where: { userId: userId, productId: productId, goalId: completedGoal.id }
        });

        if (existingRating) {
            return NextResponse.json({ error: "You have already submitted a review for this delivered product." }, { status: 403 });
        }

        // 4. IMAGEKIT UPLOAD
        let uploadedImageUrls = [];
        
        if (images && images.length > 0) {
            for (let i = 0; i < images.length; i++) {
                try {
                    const response = await imagekit.upload({
                        file: images[i], 
                        fileName: `review-${userId}-${Date.now()}-${i}.jpg`,
                        folder: "/fyp_reviews",
                    });
                    uploadedImageUrls.push(response.url);
                } catch (uploadError) {
                    console.error("❌ IMAGEKIT UPLOAD ERROR:", uploadError);
                    return NextResponse.json({ 
                        error: `Image upload failed: ${uploadError.message || 'Unknown error'}` 
                    }, { status: 500 });
                }
            }
        }

        // 5. SAVE TO DATABASE
        const newRating = await prisma.rating.create({
            data: {
                rating: Number(rating),
                review: review || "",
                images: uploadedImageUrls, 
                user: { connect: { id: userId } },
                product: { connect: { id: productId } },
                goal: { connect: { id: completedGoal.id } },
                delivery: { connect: { id: completedGoal.delivery.id } } 
            },
            include: { user: true }
        });

        // 6. ✅ FIRE ENGINE: Notify the Store Owner
        const productWithStore = await prisma.product.findUnique({
            where: { id: productId },
            include: { store: { include: { user: true } } }
        });

        if (productWithStore?.store?.user) {
            await sendNotification({
                userId: productWithStore.store.userId,
                email: productWithStore.store.user.email,
                title: "New Product Review! ⭐",
                message: `Your product "${productWithStore.name}" just received a ${rating}-star review.`,
                type: "SYSTEM_ALERT",
                notifyInApp: true,
                notifyEmail: true
            });
        }

        // Clear cache for this product page
        revalidatePath(`/product/${productId}`);

        return NextResponse.json({ message: "Review submitted successfully!", rating: newRating }, { status: 201 });

    } catch (error) {
        console.error("POST /api/rating error:", error);
        return NextResponse.json({ error: "Database error while saving review.", details: error.message }, { status: 500 });
    }
}