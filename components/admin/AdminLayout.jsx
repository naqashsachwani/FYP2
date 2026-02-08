'use client' // Enables client-side rendering (hooks, auth, effects)

/* ================= Imports ================= */

import { useEffect, useState } from "react"
import Loading from "../Loading"
import Link from "next/link"

// Icons used across the admin layout
import { ArrowRightIcon, CrownIcon, Shield } from "lucide-react"

// Admin UI components
import AdminNavbar from "./AdminNavbar"
import AdminSidebar from "./AdminSidebar"

// Clerk authentication hooks
import { useAuth, useUser } from "@clerk/nextjs"

// HTTP client for API requests
import axios from "axios"

/**
 * ADMIN LAYOUT COMPONENT
 * ----------------------
 * Acts as a secure wrapper for all admin pages.
 * - Verifies admin role from backend
 * - Blocks unauthorized access
 * - Provides consistent navbar + sidebar layout
 */
export default function AdminLayout({ children }) {

  /* ================= AUTH HOOKS ================= */

  // Clerk user object (used for UI logic)
  const { user } = useUser()

  // getToken() provides a secure JWT for backend verification
  const { getToken } = useAuth()

  /* ================= STATE MANAGEMENT ================= */

  // Stores backend-confirmed admin status
  // Default: false (security-first approach)
  const [isAdmin, setIsAdmin] = useState(false)

  // Prevents access-denied flicker while verifying role
  const [loading, setLoading] = useState(true)

  // Controls mobile sidebar visibility
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  /**
   * SECURITY FUNCTION: fetchIsAdmin
   * --------------------------------
   * WHY backend check?
   * - Frontend role data can be spoofed
   * - JWT is sent securely to backend
   * - Backend validates role from database
   */
  const fetchIsAdmin = async () => {
    try {
      // A. Retrieve Clerk-issued JWT
      const token = await getToken()

      // B. Secure API request with Bearer token
      const { data } = await axios.get("/api/admin/is-admin", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      // C. Trust ONLY backend response
      setIsAdmin(data?.isAdmin === true)

    } catch (err) {
      console.error("Admin check failed:", err)

      // Fail-safe: deny access on error
      setIsAdmin(false)
    } finally {
      // Stop loading state regardless of outcome
      setLoading(false)
    }
  }

  /**
   * Run admin verification when user is available
   */
  useEffect(() => {
    if (user) fetchIsAdmin()
  }, [user])

  /* ================= LOADING STATE ================= */

  // Display spinner while verifying admin privileges
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <Loading />
          <p className="mt-4 text-slate-600 font-medium">
            Checking admin privileges...
          </p>
        </div>
      </div>
    )
  }

  /* ================= ACCESS DENIED VIEW ================= */

  // Rendered when backend confirms user is NOT an admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">

        {/* Decorative background blobs */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-200 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-200 rounded-full blur-3xl opacity-30"></div>

        {/* Access denied card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 max-w-md w-full border border-white/60 relative z-10">

          {/* Icon */}
          <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center shadow-lg">
            <CrownIcon className="w-12 h-12 text-white" />
          </div>

          {/* Message */}
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-4">
            Access Restricted
          </h1>

          <p className="text-slate-700 mb-3 text-lg font-medium">
            Administrator Access Required
          </p>

          <p className="text-slate-500 mb-8 leading-relaxed">
            This area is reserved for authorized administrators only.
          </p>

          {/* Redirect CTA */}
          <Link
            href="/"
            className="group bg-gradient-to-r from-slate-800 to-slate-700 text-white flex items-center justify-center gap-3 p-4 px-8 rounded-2xl transition-all duration-300 shadow-lg hover:scale-105"
          >
            <span className="font-semibold">Return to Home</span>
            <ArrowRightIcon size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    )
  }

  /* ================= ADMIN DASHBOARD VIEW ================= */

  // If execution reaches here → user is VERIFIED admin
  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">

      {/* Decorative background */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-20 -z-0"></div>
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-purple-100 rounded-full blur-3xl opacity-20 -z-0"></div>

      {/* Top Navigation Bar */}
      <AdminNavbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />

      {/* Layout Container */}
      <div className="flex flex-1 h-full overflow-hidden relative z-10">

        {/* Sidebar Navigation */}
        <AdminSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/60 min-h-full p-6 lg:p-8">
            
            {/* Injected Admin Pages */}
            {children}

          </div>
        </main>
      </div>
    </div>
  )
}
