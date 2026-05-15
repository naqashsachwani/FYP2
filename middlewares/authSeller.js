import prisma from "@/lib/prisma"; // Prisma client for database operations

// ================== AUTH: Seller Check ==================
const authSeller = async (userId) => {
    try {
        // 🛡️ THE FIX: Stop immediately if userId is empty to prevent Prisma crashes
        if (!userId) {
            return false;
        }

        // Fetch the user by ID and include their store info
        const user = await prisma.user.findUnique({
            where: { id: userId }, // Find user by primary key
            include: { store: true }, // Include associated store
        });

        // Check if the user has a store
        if (user && user.store) {
            // Only return store ID if the store is approved
            if (user.store.status === 'approved') {
                return user.store.id; // Seller verified, return store ID
            }
        } 
        
        // No store found or not approved → user is not an active seller
        return false;

    } catch (error) {
        // Log any errors for debugging
        console.error("AuthSeller Middleware Error:", error);

        // Return false on error to prevent unauthorized access
        return false;
    }
};

export default authSeller;