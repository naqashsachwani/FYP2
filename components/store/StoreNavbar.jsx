'use client' // Marks this as a Client Component (needed for hooks & Clerk)

// Clerk authentication hooks & components
import { useUser, UserButton } from "@clerk/nextjs"

// Next.js routing
import Link from "next/link"

// Icon for mobile menu
import { Menu } from "lucide-react"

// Store Navbar Component
const StoreNavbar = ({ onMenuClick }) => {

  // Get current logged-in user from Clerk
  const { user } = useUser()

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

          {/* Clerk user avatar & menu */}
          <UserButton afterSignOutUrl="/" />
        </div>

      </div>
    </header>
  )
}

export default StoreNavbar
