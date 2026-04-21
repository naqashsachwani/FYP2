import StoreLayout from "@/components/store/StoreLayout";
// Imports Clerk's authentication components for declarative access control and the pre-built login form
import { SignedIn, SignedOut, SignIn } from "@clerk/nextjs"

export const metadata = {
    title: "DreamSaver. - Your Dreams. Digitally Reserved",
    description: "DreamSaver. - Your Dreams. Digitally Reserved",
};


// --- Main Layout Component ---
export default function StoreRootLayout({ children }) {

    return (
        <>
        {/* ================= AUTHENTICATED STATE ================= */}
        <SignedIn>
            <StoreLayout>
                {children}
            </StoreLayout>
        </SignedIn>

        {/* ================= UNAUTHENTICATED STATE ================= */}
        <SignedOut>
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                 <SignIn 
                    fallbackRedirectUrl="/store" 
                    // 'hash' routing prevents 404 errors if the user refreshes the page during the login flow
                    routing="hash" 
                    
                    // Custom Styling to seamlessly integrate the Clerk component into the application's theme
                    appearance={{
                        elements: {
                            rootBox: "mx-auto", 
                            card: "bg-white shadow-xl rounded-2xl" 
                        }
                    }}
                 />
            </div>
        </SignedOut>
        </>
    );
}