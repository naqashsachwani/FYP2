import authSeller from "@/middlewares/authSeller"; 
import { getAuth } from "@clerk/nextjs/server"; 
import prisma from "@/lib/prisma"; 
import { NextResponse } from "next/server"; 

// ================== GET: Verify Seller & Fetch Store Info ==================
export async function GET(request) {
    try {
        // Get authenticated user's ID
        const { userId } = getAuth(request);

        // 🛡️ THE FIX: If Clerk hasn't loaded the user yet, return false gracefully
        if (!userId) {
            return NextResponse.json({ isSeller: false }, { status: 200 });
        }

        // Check if the user is a seller using middleware
        const sellerStoreId = await authSeller(userId);

        // If not a seller, return 401 Unauthorized
        if (!sellerStoreId) {
            return NextResponse.json({ error: 'not authorized' }, { status: 401 });
        }

        // Fetch the store associated with this seller
        const storeInfo = await prisma.store.findUnique({
            where: { userId }
        });

        // Return seller status and store info
        return NextResponse.json({ isSeller: true, storeInfo });

    } catch (error) {
        // Log any errors for debugging
        console.error("is-seller API Error:", error);

        // Return 500 with error message
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}