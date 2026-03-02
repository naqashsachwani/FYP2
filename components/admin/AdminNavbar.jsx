'use client' // Enables client-side hooks and interactivity

/* ================= Imports ================= */
import Link from "next/link"
import { useState, useEffect } from "react"
// Removed UserButton, imported useClerk for custom menu actions
import { useUser, useClerk } from "@clerk/nextjs" 
// Added icons for the new custom dropdown menu
import { CrownIcon, MenuIcon, XIcon, Home, Store, Settings, LogOut } from "lucide-react" 

/**
 * ADMIN NAVBAR COMPONENT
 * ---------------------
 * Top navigation bar for the Admin Dashboard.
 * - Displays brand + admin badge
 * - Handles mobile sidebar toggle
 * - Shows completely custom, right-click friendly profile menu
 */
export default function AdminNavbar({ onToggleSidebar, isSidebarOpen }) {

  /* ================= HOOKS & STATE ================= */

  // Clerk hooks for user data and actions
  const { user } = useUser()
  const { openUserProfile, signOut } = useClerk()
  
  // Custom Profile Dropdown State
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  // State to check if the admin also has a store
  const [showSellerBtn, setShowSellerBtn] = useState(false)

  // Hydration safety check
  useEffect(() => {
    setMounted(true)
  }, [])

  // Check if this admin is ALSO a seller so we can show the Store button
  useEffect(() => {
    const checkRoles = async () => {
      if (user) {
        try {
          const sellerRes = await fetch('/api/store/is-seller');
          const sellerData = await sellerRes.json();
          setShowSellerBtn(!!sellerData.isSeller);
        } catch (error) {
          console.error("Role verification failed", error);
        }
      }
    };

    if (mounted && user) {
      checkRoles();
    }
  }, [mounted, user]);

  return (
    <header className="flex items-center justify-between px-4 lg:px-8 py-4 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm sticky top-0 z-50">
      
      {/* ================= LEFT SECTION ================= */}
      {/* Mobile toggle button + Logo */}
      <div className="flex items-center gap-3">
        
        {/* MOBILE SIDEBAR TOGGLE */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
          aria-label="Toggle Sidebar" 
        >
          {isSidebarOpen ? <XIcon size={22} /> : <MenuIcon size={22} />}
        </button>

        {/* LOGO + HOME LINK */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group"
        >
          <span className="text-2xl lg:text-3xl font-bold text-slate-800 group-hover:scale-105 transition-transform duration-200 ease-in-out inline-block">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Dream
            </span>
            Saver
          </span>

          {/* ADMIN BADGE */}
          <span className="hidden md:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-500 shadow-md group-hover:scale-105 transition-transform duration-200 ease-in-out">
            <CrownIcon size={10} />
            Admin
          </span>
        </Link>
      </div>

      {/* ================= RIGHT SECTION ================= */}
      {/* Custom User Profile Dropdown */}
      <div className="relative flex items-center">
        
        {!mounted ? (
          // Hydration Safe Skeleton
          <div className="w-32 h-10 bg-slate-100 animate-pulse rounded-full hidden sm:block"></div>
        ) : (
          <div className="relative">
            {/* Clickable Profile Pill */}
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 bg-slate-50 rounded-full pl-2 pr-4 py-1.5 shadow-sm hover:shadow-md hover:bg-slate-100 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-slate-200">
                <img src={user?.imageUrl} alt={user?.fullName || "Admin"} className="w-full h-full object-cover" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-slate-700 leading-tight">
                  Hi, {user?.firstName || 'Admin'}
                </p>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  Administrator
                </p>
              </div>
            </button>

            {/* Dropdown Menu */}
            {isProfileOpen && (
              <>
                {/* Invisible background overlay to close menu on outside click */}
                <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>

                {/* Menu Panel */}
                <div className="absolute right-0 top-full mt-3 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 overflow-hidden">
                  
                  {/* User Info Header (Mobile mainly) */}
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 mb-1 sm:hidden">
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

                    {/* --- TRUE LINKS (Supports Right-Click New Tab) --- */}
                    <Link
                      href="/"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                    >
                      <Home size={16} className="text-slate-500" /> Go to Homepage
                    </Link>

                    {/* Conditionally show Store Dashboard if they have a store */}
                    {showSellerBtn && (
                      <Link
                        href="/store"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                      >
                        <Store size={16} className="text-slate-500" /> Store Dashboard
                      </Link>
                    )}
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

    </header>
  )
}