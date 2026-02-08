import authSeller from "@/middlewares/authSeller"; // Middleware to check if user is a seller
import { getAuth } from "@clerk/nextjs/server"; // Clerk authentication for server-side requests
import prisma from "@/lib/prisma"; // Prisma client for database operations
import { NextResponse } from "next/server"; // Next.js response helper

// ================== GET: Verify Seller & Fetch Store Info ==================
export async function GET(request) {
    try {
        // Get authenticated user's ID
        const { userId } = getAuth(request);

        //  Check if the user is a seller using middleware
        const isSeller = await authSeller(userId);

        // If not a seller, return 401 Unauthorized
        if (!isSeller) {
            return NextResponse.json({ error: 'not authorized' }, { status: 401 });
        }

        //  Fetch the store associated with this seller
        const storeInfo = await prisma.store.findUnique({
            where: { userId }
        });

        //  Return seller status and store info
        return NextResponse.json({ isSeller, storeInfo });

    } catch (error) {
        // Log any errors for debugging
        console.error(error);

        // Return 400 Bad Request with error message
        return NextResponse.json({ error: error.code || error.message }, { status: 400 });
    }
}
