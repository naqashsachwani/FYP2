import prisma from "@/lib/prisma"; // Prisma client for database operations

// ================== AUTH: Seller Check ==================
const authSeller = async (userId) => {
    try {
        // Fetch the user by ID and include their store info
        const user = await prisma.user.findUnique({
            where: { id: userId }, // Find user by primary key
            include: { store: true }, // Include associated store
        });

        //  Check if the user has a store
        if (user.store) {
            //  Only return store ID if the store is approved
            if (user.store.status === 'approved') {
                return user.store.id; // Seller verified, return store ID
            }
        } else {
            //  No store found → user is not a seller
            return false;
        }

        // Optional: if store exists but not approved, implicitly returns undefined → treated as false
    } catch (error) {
        //  Log any errors for debugging
        console.error(error);

        //  Return false on error to prevent unauthorized access
        return false;
    }
};

export default authSeller; // Export for use in endpoints or middleware
