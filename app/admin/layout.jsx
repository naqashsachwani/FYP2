import AdminLayout from "@/components/admin/AdminLayout"; 
import { SignedIn, SignedOut, SignIn } from "@clerk/nextjs"; 

export const metadata = {
    title: "DreamSaver. - Admin", 
    description: "DreamSaver. - Your Dreams. Digitally Reserved", 
};

export default function RootAdminLayout({ children }) {
    // Root layout for admin pages

    return (
        <>
           {/* Render this section only if user is signed in */}
           <SignedIn>
            {/* AdminLayout wraps the admin page content with sidebar, header, etc. */}
            <AdminLayout>
                {children} {/* The main content of each admin page */}
            </AdminLayout>
           </SignedIn>

           {/* Render this section only if user is not signed in */}
           <SignedOut>
              <div className="min-h-screen flex items-center justify-center">
                 {/* Display the SignIn form */}
                 <SignIn 
                     fallbackRedirectUrl="/admin" 
                     routing="hash" 
                     // fallbackRedirectUrl → after login, redirects user to /admin
                     // routing="hash" → URL uses hash routing (Clerk specific)
                 />
              </div>
           </SignedOut>
        </>
    );
}
