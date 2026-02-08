import authAdmin from "@/middlewares/authAdmin"; // Middleware to check if user is admin
import { getAuth } from "@clerk/nextjs/server"; // Clerk server-side authentication helper
import { NextResponse } from "next/server"; // Next.js Response helper

// ==============================
// GET: Check if the authenticated user is an admin
// ==============================
export async function GET(request) {
    try {
        // Get the authenticated user's ID from the request
        const { userId } = getAuth(request);

        // Check if the user is an admin using the authAdmin middleware
        const isAdmin = await authAdmin(userId);

        // If the user is not an admin, return 401 Unauthorized
        if (!isAdmin) {
            return NextResponse.json(
                { error: 'not authorized' },
                { status: 401 }
            );
        }

        // If the user is an admin, return { isAdmin: true }
        return NextResponse.json({ isAdmin });
    } catch (error) {
        // Log the error for debugging
        console.error(error);

        // Return error response with status 400
        return NextResponse.json(
            { error: error.code || error.message },
            { status: 400 }
        );
    }
}
