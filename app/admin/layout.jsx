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
              <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50 p-4">
                 <SignIn 
                     fallbackRedirectUrl="/admin" 
                     routing="hash" 
                     appearance={{
                        elements: {
                            rootBox: "mx-auto w-full max-w-sm sm:max-w-md", 
                            card: "bg-white shadow-2xl rounded-2xl sm:rounded-3xl border border-slate-100" 
                        }
                    }}
                 />
              </div>
           </SignedOut>
        </>
    );
}