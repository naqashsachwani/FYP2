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
        const email = user.emailAddresses?.[0]?.emailAddress;
        const emailAllowList = (process.env.ADMIN_EMAIL || "")
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean);
        const role = user.publicMetadata?.role || user.privateMetadata?.role;
        const isAdminRole = role === "admin" || role === "superadmin";
        const isAdminEmail = emailAllowList.includes(email);
        const requireMfa = process.env.ADMIN_REQUIRE_MFA !== "false";
        const hasMfa = user.twoFactorEnabled === true;

        if (!(isAdminRole || isAdminEmail)) {
            return false;
        }

        if (requireMfa && !hasMfa) {
            return false;
        }

        return true;

    } catch (error) {
        // Log any errors for debugging
        console.error(error);

        // Return false on error to prevent accidental admin access
        return false;
    }
};

export default authAdmin; // Export the function for use in other middleware or endpoints
