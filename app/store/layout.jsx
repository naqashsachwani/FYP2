import StoreLayout from "@/components/store/StoreLayout";
import { SignedIn, SignedOut, SignIn } from "@clerk/nextjs"

export const metadata = {
    title: "DreamSaver. - Your Dreams. Digitally Reserved",
    description: "DreamSaver. - Your Dreams. Digitally Reserved",
};

/**
 * Clerk's conditional rendering components. 
 * - If the user is <SignedIn>, they see the protected StoreLayout.
 * - If they are <SignedOut>, they are immediately shown the Login form."
 */
export default function StoreRootLayout({ children }) {

    return (
        <>
        <SignedIn>
            {/* StoreLayout contains the Sidebar, Header, and Navigation specific to the Store Dashboard. */}
            <StoreLayout>
                {/* 'children' represents the specific page content (e.g., Dashboard, Products, Orders) */}
                {children}
            </StoreLayout>
        </SignedIn>

        <SignedOut>
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                 
                 <SignIn 
                    // Where to send the user after they successfully log in
                    fallbackRedirectUrl="/store" 
                    
                    // 'hash' routing prevents 404 errors if the user refreshes the page during the login flow
                    routing="hash" 
                    
                    // Custom Styling to match the application theme
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