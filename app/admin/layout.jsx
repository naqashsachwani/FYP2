import AdminLayout from "@/components/admin/AdminLayout"; 
import { SignedIn, SignedOut, SignIn } from "@clerk/nextjs"; 

export const metadata = {
    title: "DreamSaver. - Admin", 
    description: "DreamSaver. - Your Dreams. Digitally Reserved", 
};

// --- Main Layout Component ---
export default function RootAdminLayout({ children }) {

    return (
        <>
           {/* ================= AUTHENTICATED STATE ================= */}
           {/* if user is actively signed in and recognized by Clerk */}
           <SignedIn>
            <AdminLayout>
                {children} 
            </AdminLayout>
           </SignedIn>

           {/* ================= UNAUTHENTICATED STATE ================= */}
           <SignedOut>
              <div className="min-h-screen flex items-center justify-center">
                 <SignIn 
                     fallbackRedirectUrl="/admin" 
                     routing="hash" 
                 />
              </div>
           </SignedOut>
        </>
    );
}