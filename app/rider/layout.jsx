'use client'

import { useState } from "react"
import { useAuth, SignInButton } from "@clerk/nextjs"
import { Loader2, ShieldAlert } from "lucide-react"
import RiderNavbar from "@/components/rider/RiderNavbar"
import RiderSidebar from "@/components/rider/RiderSidebar"

export default function RiderLayout({ children }) {
  const { isLoaded, userId } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // 1. Loading State
  // ✅ Responsive Fix: min-h-[100dvh]
  if (!isLoaded) return <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-green-600 w-10 h-10" /></div>;

  // 2. Rider Protection Block (Auth Check)
  // ✅ Responsive Fix: min-h-[100dvh] and padding for small screens
  if (isLoaded && !userId) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-slate-50 p-4 sm:p-6 text-center">
        <ShieldAlert className="w-16 h-16 sm:w-20 sm:h-20 text-green-500 mb-4 sm:mb-6" />
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 mb-6 max-w-md">Please login to continue.</h2>
        <SignInButton mode="modal" fallbackRedirectUrl="/rider/dashboard">
          <button className="px-8 py-3 sm:py-3.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors shadow-lg active:scale-95 text-sm sm:text-base w-full sm:w-auto">
            Sign In
          </button>
        </SignInButton>
      </div>
    );
  }

  return (
    // ✅ Responsive Fix: h-[100dvh] so it takes up exact viewport height on mobile
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-slate-50">
      {/* Top Global Navbar */}
      <RiderNavbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} />
      
      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        <RiderSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        {/* ✅ Add padding bottom for mobile scrolling buffer if needed */}
        <main className="flex-1 overflow-y-auto bg-slate-50 w-full relative z-0">
          {children}
        </main>
      </div>
    </div>
  )
}