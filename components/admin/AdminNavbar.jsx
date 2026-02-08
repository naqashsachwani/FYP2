'use client' // Enables client-side hooks and interactivity

/* ================= Imports ================= */

import Link from "next/link"
import { useUser, UserButton } from "@clerk/nextjs" // Clerk authentication UI & data
import { CrownIcon, MenuIcon, XIcon } from "lucide-react" // Icons

/**
 * ADMIN NAVBAR COMPONENT
 * ---------------------
 * Top navigation bar for the Admin Dashboard.
 * - Displays brand + admin badge
 * - Handles mobile sidebar toggle
 * - Shows authenticated user info and sign-out button
 */
export default function AdminNavbar({ onToggleSidebar, isSidebarOpen }) {

  /* ================= AUTH HOOK ================= */

  // useUser provides the logged-in user's data (name, image, etc.)
  const { user } = useUser()

  return (
    <header className="flex items-center justify-between px-4 lg:px-8 py-4 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm sticky top-0 z-50">
      
      {/* ================= LEFT SECTION ================= */}
      {/* Mobile toggle button + Logo */}
      <div className="flex items-center gap-3">
        
        {/* MOBILE SIDEBAR TOGGLE
            - Visible only on mobile/tablet (lg:hidden)
            - Toggles between Menu and Close icon
        */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
          aria-label="Toggle Sidebar" // Improves accessibility for screen readers
        >
          {/* Icon switches based on sidebar state */}
          {isSidebarOpen ? <XIcon size={22} /> : <MenuIcon size={22} />}
        </button>

        {/* LOGO + HOME LINK */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group"
        >
          {/* Brand text */}
          <span className="text-2xl lg:text-3xl font-bold text-slate-800 group-hover:scale-105 transition-transform duration-200 ease-in-out inline-block">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Dream
            </span>
            Saver
          </span>

          {/* ADMIN BADGE
              - Hidden on small screens to save space
              - Visually indicates admin-only area
          */}
          <span className="hidden md:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-500 shadow-md group-hover:scale-105 transition-transform duration-200 ease-in-out">
            <CrownIcon size={10} />
            Admin
          </span>
        </Link>
      </div>

      {/* ================= RIGHT SECTION ================= */}
      {/* User info + Clerk user button */}
      <div className="flex items-center gap-3 bg-slate-50 rounded-full pl-2 pr-4 py-1.5 shadow-sm hover:shadow-md hover:bg-slate-100 transition-all">
        
        {/* Clerk User Button
            - Shows avatar
            - Handles profile & sign-out automatically
        */}
           <UserButton redirectUrl="/" />

        <div className="hidden sm:block">
          <p className="text-sm font-medium text-slate-700">
            {/* Fallback name while user data is loading */}
            Hi, {user?.firstName || 'Admin'}
          </p>
          <p className="text-xs text-slate-500">
            Administrator
          </p>
        </div>
      </div>
    </header>
  )
}
