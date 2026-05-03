import { clerkClient } from "@clerk/nextjs/server"; 

// ================== AUTH: Admin Check ==================
const authAdmin = async (userId) => {
    try {
        if (!userId) return false;

        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        
        // 1. Parse the .env emails (handle spaces and make lowercase for safety)
        const emailAllowList = (process.env.ADMIN_EMAIL || "")
            .split(",")
            .map((value) => value.trim().toLowerCase())
            .filter(Boolean);
        
        // 2. Safely check ALL emails attached to this Clerk user
        const userEmails = user.emailAddresses.map(e => e.emailAddress.toLowerCase());
        const isAdminEmail = userEmails.some(email => emailAllowList.includes(email));

        const role = user.publicMetadata?.role || user.privateMetadata?.role;
        const isAdminRole = role === "admin" || role === "superadmin";

        // If they don't match the role or the email list, reject immediately
        if (!(isAdminRole || isAdminEmail)) {
            return false;
        }

        // 3. MFA Security Check
        const requireMfa = process.env.ADMIN_REQUIRE_MFA !== "false";
        const hasMfa = user.twoFactorEnabled === true;

        if (requireMfa && !hasMfa) {
            console.warn(`[SECURITY] Admin Access Denied: The user ${userEmails[0]} is an admin, but does not have 2FA/MFA enabled on their Clerk account.`);
            return false;
        }

        return true;

    } catch (error) {
        console.error("AuthAdmin Middleware Error:", error);
        return false;
    }
};

export default authAdmin;