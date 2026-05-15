'use client'

import { useState, useEffect } from "react"
import { useAuth } from "@clerk/nextjs"
import { usePathname, useRouter } from "next/navigation"
import axios from "axios"
import { Loader2 } from "lucide-react"

import RiderNavbar from "@/components/rider/RiderNavbar"
import RiderSidebar from "@/components/rider/RiderSidebar"

export default function RiderLayout({ children }) {
  const { isLoaded, userId } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isCheckingAccess, setIsCheckingAccess] = useState(true)

  // Identify if we are currently looking at the signup page
  const isSignupPage = pathname === "/rider/rider-signup"

  useEffect(() => {
    if (!isLoaded) return;

    // RULE 1: If not logged in and trying to access the dashboard -> kick to signup
    // (The signup page handles the "Please login" UI perfectly)
    if (!userId) {
      setIsCheckingAccess(false);
      if (!isSignupPage) {
        router.push("/rider/rider-signup");
      }
      return;
    }

    // Verify database status if logged in
    const verifyRiderAccess = async () => {
      try {
        const { data } = await axios.get("/api/rider/is-rider");

        if (data.isRider) {
          // RULE 2: If an approved rider tries to view the signup page -> kick to dashboard
          if (isSignupPage) {
            router.push("/rider/dashboard");
          }
        } else {
          // RULE 3: If an unapproved user tries to view the dashboard -> kick to signup
          // (The signup page will show them their Pending/Rejected/Suspended status)
          if (!isSignupPage) {
            router.push("/rider/rider-signup");
          }
        }
      } catch (error) {
        console.error("Rider access verification failed", error);
        if (!isSignupPage) {
          router.push("/rider/rider-signup");
        }
      } finally {
        setIsCheckingAccess(false);
      }
    };

    verifyRiderAccess();
  }, [isLoaded, userId, pathname, router]);

  // ==========================================
  // 1. GLOBAL LOADING STATE
  // ==========================================
  if (!isLoaded || isCheckingAccess) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-green-600 w-10 h-10" />
      </div>
    );
  }

  // ==========================================
  // 2. SIGNUP / STATUS PAGE VIEW (No Menus)
  // ==========================================
  if (isSignupPage) {
    return <div className="min-h-[100dvh] bg-slate-50">{children}</div>;
  }

  // ==========================================
  // 3. AUTHORIZED DASHBOARD VIEW (With Menus)
  // ==========================================
  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-slate-50">
      {/* Top Global Navbar */}
      <RiderNavbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} />
      
      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        <RiderSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        
        <main className="flex-1 overflow-y-auto bg-slate-50 w-full relative z-0">
          {children}
        </main>
      </div>
    </div>
  )
}