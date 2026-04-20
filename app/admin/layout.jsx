// --- Imports ---
// Imports a custom layout component specifically designed for the admin dashboard (e.g., containing a sidebar and header).
import AdminLayout from "@/components/admin/AdminLayout"; 
// Imports authentication components from Clerk to control access to the admin area.
import { SignedIn, SignedOut, SignIn } from "@clerk/nextjs"; 

// --- Metadata Configuration ---
// Next.js uses this exported object to generate the <head> HTML tags (like <title> and <meta name="description">)
// for all pages nested under the /admin route.
export const metadata = {
    title: "DreamSaver. - Admin", 
    description: "DreamSaver. - Your Dreams. Digitally Reserved", 
};

// --- Main Layout Component ---
// This is a Server Component layout that wraps all pages within the `app/admin` directory.
// The `children` prop represents the specific page content being rendered (e.g., the dashboard or settings page).
export default function RootAdminLayout({ children }) {
    // Root layout for admin pages

    return (
        // React Fragment (<>...</>) used to group multiple sibling elements without adding an extra DOM node.
        <>
           {/* ================= AUTHENTICATED STATE ================= */}
           {/* Render this section only if user is actively signed in and recognized by Clerk */}
           <SignedIn>
            {/* AdminLayout wraps the admin page content, providing consistent UI elements like navigation. */}
            <AdminLayout>
                {children} {/* The main content of the specific admin page currently being viewed */}
            </AdminLayout>
           </SignedIn>

           {/* ================= UNAUTHENTICATED STATE ================= */}
           {/* Render this section only if the user is NOT signed in */}
           <SignedOut>
              {/* Centers the login form both vertically and horizontally on the screen */}
              <div className="min-h-screen flex items-center justify-center">
                 {/* Display the pre-built Clerk SignIn form component */}
                 <SignIn 
                     fallbackRedirectUrl="/admin" 
                     routing="hash" 
                     // fallbackRedirectUrl → After a successful login, it explicitly forces the user back to the /admin route, rather than the app's default homepage.
                     // routing="hash" → Instructs Clerk to use hash-based routing (e.g., #/sign-in) for the auth flow. This is often necessary when embedding the SignIn component directly on a page instead of routing to a dedicated /sign-in URL.
                 />
              </div>
           </SignedOut>
        </>
    );
}