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
  if (!isLoaded) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-green-600 w-10 h-10" /></div>;

  // 2. Rider Protection Block (Auth Check)
  if (isLoaded && !userId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <ShieldAlert className="w-16 h-16 text-green-500 mb-4" />
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-6 text-center">Please login to continue.</h2>
        <SignInButton mode="modal" fallbackRedirectUrl="/rider/dashboard">
          <button className="px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition shadow-md">
            Sign In
          </button>
        </SignInButton>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <RiderSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex flex-col flex-1 w-full overflow-hidden">
        <RiderNavbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} isSidebarOpen={isSidebarOpen} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}