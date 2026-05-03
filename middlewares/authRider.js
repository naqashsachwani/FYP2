import prisma from "@/lib/prisma"; // Prisma client for database operations

// ================== AUTH: Rider Check ==================
const authRider = async (userId) => {
    try {
        // If no userId provided, return false immediately
        if (!userId) return false;

        // Fetch the RiderProfile associated with this userId
        const riderProfile = await prisma.riderProfile.findUnique({
            where: { userId: userId }, // Find rider profile by userId
        });

        // Check if the user actually has a rider profile
        if (riderProfile) {
            // Only return rider ID if their profile is explicitly APPROVED by admin
            if (riderProfile.status === 'APPROVED') {
                return riderProfile.id; // Rider verified, return rider ID
            } else {
                // Profile exists but is PENDING_APPROVAL, REJECTED, or SUSPENDED
                return false; 
            }
        } else {
            // No rider profile found → user is not a rider
            return false;
        }

    } catch (error) {
        // Log any errors for debugging
        console.error("AuthRider Error:", error);

        // Return false on error to prevent unauthorized access
        return false;
    }
};

export default authRider; // Export for use in endpoints or middleware