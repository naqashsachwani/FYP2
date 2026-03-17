'use client' // Marks this as a Client Component (needed for hooks & Clerk)

// Clerk authentication hooks & components
import { useUser, useClerk } from "@clerk/nextjs" 

// React hooks
import { useState, useEffect } from "react"

// Next.js routing
import Link from "next/link"

// Icons - ✅ Added ShieldCheck for the Admin link
import { Menu, Home, Settings, LogOut, ShieldCheck } from "lucide-react"

// Store Navbar Component
const StoreNavbar = ({ onMenuClick }) => {

  // Get current logged-in user and Clerk functions
  const { user } = useUser()
  const { openUserProfile, signOut } = useClerk()
  
  // Custom Profile Dropdown State
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  // ✅ NEW: State for the Admin Button
  const [showAdminBtn, setShowAdminBtn] = useState(false)

  // Hydration safety
  useEffect(() => {
    setMounted(true)
  }, [])

  // ✅ NEW: Fetch admin role to conditionally show the dashboard link
  useEffect(() => {
    const checkRoles = async () => {
      if (user) {
        try {
          const adminRes = await fetch('/api/admin/is-admin')
          const adminData = await adminRes.json()
          setShowAdminBtn(adminData.isAdmin === true)
        } catch (error) {
          console.error("Role verification failed", error)
        }
      }
    }

    if (mounted && user) {
      checkRoles()
    }
  }, [mounted, user])

  return (
    // Sticky top navigation bar
    <header className="w-full bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">

      <div className="flex items-center justify-between px-4 sm:px-8 lg:px-12 py-3">

        {/* ================= MOBILE MENU BUTTON ================= */}
        {/* Visible only on small screens */}
        <button
          onClick={onMenuClick} // Trigger sidebar open/close
          className="sm:hidden p-2 rounded-md bg-blue-100 text-blue-600 hover:bg-blue-200 transition"
        >
          <Menu size={22} />
        </button>

        {/* ================= BRAND / LOGO ================= */}
        <Link
          href="/" // Redirect to home page
          className="relative text-3xl sm:text-4xl font-extrabold text-gray-800 select-none"
        >
          {/* Brand name styling */}
          <span className="text-blue-600">Dream</span>
          Saver
          <span className="text-blue-600 text-5xl leading-0">.</span>

          {/* Store badge */}
          <span className="absolute text-[10px] font-semibold -top-1 -right-10 px-2.5 py-[1px] rounded-full flex items-center gap-1 text-white bg-blue-500">
            Store
          </span>
        </Link>

        {/* ================= USER INFO ================= */}
        <div className="flex items-center gap-3">

          {/* Greeting (hidden on mobile) */}
          <p className="hidden sm:block text-gray-700 text-sm font-medium">
            Hi, <span className="text-blue-600">{user?.firstName}</span>
          </p>

          {/* Custom Clerk User Avatar & Menu */}
          {!mounted ? (
            <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse"></div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="w-8 h-8 rounded-full overflow-hidden border-2 border-slate-200 hover:border-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <img src={user?.imageUrl} alt={user?.fullName || "User"} className="w-full h-full object-cover" />
              </button>

              {isProfileOpen && (
                <>
                  {/* Invisible overlay to close dropdown when clicking anywhere else */}
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>

                  {/* Dropdown Menu Container */}
                  <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 overflow-hidden">
                    
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 mb-1">
                      <p className="text-sm font-semibold text-slate-800 truncate">{user?.fullName}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.primaryEmailAddress?.emailAddress}</p>
                    </div>

                    <div className="px-2 space-y-1">
                      <button
                        onClick={() => { openUserProfile(); setIsProfileOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                      >
                        <Settings size={16} className="text-slate-500" /> Manage Account
                      </button>

                      {/* --- NEW: SECURE ADMIN LINK --- */}
                      {showAdminBtn && (
                        <Link
                          href="/admin"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                        >
                          <ShieldCheck size={16} className="text-slate-500" /> Admin Dashboard
                        </Link>
                      )}

                      {/* --- TRUE LINK FOR HOMEPAGE --- */}
                      <Link
                        href="/"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                      >
                        <Home size={16} className="text-slate-500" /> Go to Homepage
                      </Link>
                    </div>

                    {/* Sign Out Section */}
                    <div className="border-t border-slate-100 mt-2 pt-2 px-2">
                      <button
                        onClick={() => signOut({ redirectUrl: '/' })}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                      >
                        <LogOut size={16} className="text-red-500" /> Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </header>
  )
}

export default StoreNavbar