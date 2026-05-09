import prisma from "@/lib/prisma";
import { getAuth, currentUser } from "@clerk/nextjs/server"; // ✅ Added currentUser
import { NextResponse } from "next/server";
import imagekit from "@/configs/imageKit";
import { revalidatePath } from "next/cache";
import { sendNotification } from "@/lib/sendNotification";
import { writeSecurityAuditLog } from "@/lib/security/auditLog";
import { getRequestContext } from "@/lib/security/requestContext";
import { checkRateLimit } from "@/lib/security/rateLimit";
import { validateBase64Images } from "@/lib/security/uploadValidation";

export async function POST(req) {
    try {
        const { userId } = getAuth(req);
        const clerkUser = await currentUser(); // ✅ Fetch actual profile data from Clerk
        const context = getRequestContext(req, userId);

        if (!userId) {
            return NextResponse.json({ error: "You must be logged in to leave a review." }, { status: 401 });
        }

        const rateLimit = checkRateLimit({
            key: `rating-create:${userId}:${context.ipAddress}`,
            limit: 5,
            windowMs: 60 * 1000,
        });
        if (!rateLimit.allowed) {
            return NextResponse.json({ error: "Too many review attempts. Please try again shortly." }, { status: 429 });
        }

        const body = await req.json();
        const { productId, rating, review, images } = body;

        if (!productId || !rating) {
            return NextResponse.json({ error: "Product ID and Rating are required." }, { status: 400 });
        }

        if (images) {
            const uploadValidation = validateBase64Images(images);
            if (!uploadValidation.ok) {
                return NextResponse.json({ error: uploadValidation.error }, { status: 400 });
            }
        }

        const completedGoal = await prisma.goal.findFirst({
            where: {
                userId,
                productId,
                delivery: { status: "DELIVERED" }
            },
            include: { delivery: true }
        });

        if (!completedGoal || !completedGoal.delivery) {
            return NextResponse.json({
                error: "You can only review products after your DreamSaver Goal has been successfully delivered."
            }, { status: 403 });
        }

        const existingRating = await prisma.rating.findFirst({
            where: { userId, productId, goalId: completedGoal.id }
        });

        if (existingRating) {
            return NextResponse.json({ error: "You have already submitted a review for this delivered product." }, { status: 403 });
        }

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
                    console.error("IMAGEKIT UPLOAD ERROR:", uploadError);
                    return NextResponse.json({
                        error: `Image upload failed: ${uploadError.message || "Unknown error"}`
                    }, { status: 500 });
                }
            }
        }

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

        const productWithStore = await prisma.product.findUnique({
            where: { id: productId },
            include: { store: { include: { user: true } } }
        });

        if (productWithStore?.store?.user) {
            await sendNotification({
                userId: productWithStore.store.userId,
                email: productWithStore.store.user.email,
                title: "New Product Review!",
                message: `Your product "${productWithStore.name}" just received a ${rating}-star review.`,
                type: "SYSTEM_ALERT",
                notifyInApp: true,
                notifyEmail: true
            });
        }

        // Invalidate server cache
        revalidatePath(`/product/${productId}`);

        await writeSecurityAuditLog({
            action: "PRODUCT_RATING_CREATE",
            actorUserId: userId,
            entityType: "Product",
            entityId: productId,
            ipAddress: context.ipAddress,
            userAgent: context.userAgent,
            metadata: { goalId: completedGoal.id, deliveryId: completedGoal.delivery.id },
        });

        // ✅ Stitch the accurate Clerk data into the response so the frontend UI doesn't crash or show "Anonymous"
        const enrichedRating = {
            ...newRating,
            user: {
                ...newRating.user,
                firstName: clerkUser?.firstName,
                lastName: clerkUser?.lastName,
                name: `${clerkUser?.firstName || ''} ${clerkUser?.lastName || ''}`.trim() || "Anonymous User",
                fullName: `${clerkUser?.firstName || ''} ${clerkUser?.lastName || ''}`.trim() || "Anonymous User",
                imageUrl: clerkUser?.imageUrl
            }
        };

        return NextResponse.json({ message: "Review submitted successfully!", rating: enrichedRating }, { status: 201 });

    } catch (error) {
        console.error("POST /api/rating error:", error);
        return NextResponse.json({ error: "Database error while saving review.", details: error.message }, { status: 500 });
    }
}