// --- Imports ---
// Imports the UI wrapper specific to the store dashboard (likely contains the sidebar, navbar, etc.)
import StoreLayout from "@/components/store/StoreLayout";
// Imports Clerk's authentication components for declarative access control and the pre-built login form
import { SignedIn, SignedOut, SignIn } from "@clerk/nextjs"

// --- Metadata Configuration ---
// Next.js uses this exported object to automatically generate the <head> HTML tags 
// (like <title> and <meta name="description">) for all pages under the /store route.
export const metadata = {
    title: "DreamSaver. - Your Dreams. Digitally Reserved",
    description: "DreamSaver. - Your Dreams. Digitally Reserved",
};

/**
 * Clerk's conditional rendering components. 
 * - If the user is <SignedIn>, they see the protected StoreLayout.
 * - If they are <SignedOut>, they are immediately shown the Login form."
 */
// --- Main Layout Component ---
// This is a Server Component layout that acts as the root wrapper for the entire /store directory.
// The `children` prop represents whatever specific page content is currently active (e.g., /store/products).
export default function StoreRootLayout({ children }) {

    return (
        // React Fragment (<>...</>) used to group multiple sibling elements without adding an extra DOM node.
        <>
        {/* ================= AUTHENTICATED STATE ================= */}
        <SignedIn>
            {/* StoreLayout contains the Sidebar, Header, and Navigation specific to the Store Dashboard. */}
            <StoreLayout>
                {/* 'children' represents the specific page content (e.g., Dashboard, Products, Orders) */}
                {children}
            </StoreLayout>
        </SignedIn>

        {/* ================= UNAUTHENTICATED STATE ================= */}
        <SignedOut>
            {/* Tailwind wrapper to ensure the login form is perfectly centered on a full-height screen */}
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                 
                 {/* Clerk's pre-built drop-in authentication component */}
                 <SignIn 
                    // Where to send the user after they successfully log in
                    // Prevents them from being kicked back to the homepage
                    fallbackRedirectUrl="/store" 
                    
                    // 'hash' routing prevents 404 errors if the user refreshes the page during the login flow
                    // It manages the multi-step login states (email -> password) using URL hashes (e.g., #/sign-in)
                    routing="hash" 
                    
                    // Custom Styling to seamlessly integrate the Clerk component into the application's theme
                    appearance={{
                        elements: {
                            rootBox: "mx-auto", // Centers the root container
                            card: "bg-white shadow-xl rounded-2xl" // Adds modern styling to the form card
                        }
                    }}
                 />
            </div>
        </SignedOut>
        </>
    );
}