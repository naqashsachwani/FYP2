import { clerkClient } from "@clerk/nextjs/server"; // Clerk server-side client for fetching user info

// ================== AUTH: Admin Check ==================
const authAdmin = async (userId) => {
    try {
        //  If no userId provided, return false immediately
        if (!userId) return false;

        //  Initialize Clerk client (server-side)
        const client = await clerkClient();

        //  Fetch the user details from Clerk
        const user = await client.users.getUser(userId);

        //  Check if the user's email is in the ADMIN_EMAIL list
        // ADMIN_EMAIL is a comma-separated string of admin emails in .env
        // e.g., ADMIN_EMAIL="admin1@example.com,admin2@example.com"
        return process.env.ADMIN_EMAIL.split(',').includes(
            user.emailAddresses[0].emailAddress // Take the first verified email
        );

    } catch (error) {
        // Log any errors for debugging
        console.error(error);

        // Return false on error to prevent accidental admin access
        return false;
    }
};

export default authAdmin; // Export the function for use in other middleware or endpoints
