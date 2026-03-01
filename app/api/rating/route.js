import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const { userId } = getAuth(req);
        
        if (!userId) {
            return NextResponse.json({ error: "You must be logged in to leave a review." }, { status: 401 });
        }

        const body = await req.json();
        const { productId, rating, review } = body;

        // 1. Basic Validation
        if (!productId || !rating) {
            return NextResponse.json({ error: "Product ID and Rating are required." }, { status: 400 });
        }

        // 2. FIND THE DELIVERED GOAL
        // We look for a Goal matching this user and product, where the linked Delivery is specifically 'DELIVERED'.
        const completedGoal = await prisma.goal.findFirst({
            where: {
                userId: userId,
                productId: productId,
                delivery: {
                    status: 'DELIVERED' 
                }
            },
            include: { delivery: true } // We must include this so we can grab the delivery.id
        });

        // If no delivered goal exists, politely block them
        if (!completedGoal || !completedGoal.delivery) {
            return NextResponse.json({ 
                error: "You can only review products after your DreamSaver Goal has been successfully delivered." 
            }, { status: 403 });
        }

        // 3. ENFORCE "WRITE ONCE" RULE
        // Check if a review already exists for this specific User + Product + Goal combination
        const existingRating = await prisma.rating.findFirst({
            where: { 
                userId: userId, 
                productId: productId,
                goalId: completedGoal.id 
            }
        });

        if (existingRating) {
            return NextResponse.json({ error: "You have already submitted a review for this delivered product." }, { status: 403 });
        }

        // 4. SAVE TO DATABASE
        // Notice how we perfectly match your new schema by connecting all 4 required tables!
        const newRating = await prisma.rating.create({
            data: {
                rating: Number(rating),
                review: review || "",
                
                // Explicitly connecting the 4 required relationships
                user:     { connect: { id: userId } },
                product:  { connect: { id: productId } },
                goal:     { connect: { id: completedGoal.id } },
                delivery: { connect: { id: completedGoal.delivery.id } } 
            },
            include: { user: true } // Returns the user data so the frontend updates instantly
        });

        return NextResponse.json({ message: "Review submitted successfully!", rating: newRating }, { status: 201 });

    } catch (error) {
        console.error("POST /api/rating error:", error);
        return NextResponse.json({ 
            error: "Database error while saving review.", 
            details: error.message 
        }, { status: 500 });
    }
}