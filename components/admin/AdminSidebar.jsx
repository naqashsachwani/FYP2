'use client'

import { usePathname } from "next/navigation"
import { 
  ShieldCheckIcon, 
  StoreIcon, 
  TicketPercentIcon, 
  LayoutGrid, 
  Wallet, // ✅ Added Wallet Icon
  LogOut  // ✅ Added LogOut Icon for the footer
} from "lucide-react"

import Image from "next/image"
import Link from "next/link"
import { useUser, SignOutButton } from "@clerk/nextjs"

export default function AdminSidebar({ isOpen, onClose }) {
  const { user } = useUser()
  const pathname = usePathname()

  const sidebarLinks = [
    { name: 'Dashboard', href: '/admin', icon: LayoutGrid },
    { name: 'Stores', href: '/admin/stores', icon: StoreIcon },
    { name: 'Approve Store', href: '/admin/approve', icon: ShieldCheckIcon },
    { name: 'Coupons', href: '/admin/coupons', icon: TicketPercentIcon },
    { name: 'Escrow', href: '/admin/escrow', icon: Wallet }, // ✅ Escrow Link
  ]

  return (
    <>
      {/* ======================================================
          MOBILE OVERLAY (Backdrop)
      ======================================================= */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* ======================================================
          SIDEBAR CONTAINER
      ======================================================= */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-[280px] 
        bg-white border-r border-slate-100 shadow-xl lg:shadow-none 
        transform transition-transform duration-300 ease-in-out 
        flex flex-col /* ✅ Essential for sticky header/footer */
        ${isOpen ? "translate-x-0" : "-translate-x-full"} 
        lg:translate-x-0`}
      >

        {/* ======================================================
            1. FIXED HEADER (User Profile)
        ======================================================= */}
        <div className="relative pt-8 pb-6 px-6 flex flex-col items-center border-b border-slate-50 shrink-0">
          {/* Background Gradient */}
          <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-blue-50/50 to-transparent -z-10" />
          
          {/* Avatar */}
          <div className="relative group cursor-pointer">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl opacity-75 group-hover:opacity-100 transition duration-200 blur-[2px]" />
            <Image
              className="relative w-16 h-16 rounded-2xl border-2 border-white object-cover"
              src={user?.imageUrl || "/default-avatar.png"}
              alt="Admin profile"
              width={64}
              height={64}
            />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
          </div>

          {/* Name & Role */}
          <div className="mt-4 text-center">
            <h3 className="text-slate-900 font-bold text-lg tracking-tight">
              {user?.fullName || "Administrator"}
            </h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 mt-1">
              Admin
            </span>
          </div>
        </div>

        {/* ======================================================
            2. SCROLLABLE NAVIGATION (Middle Section)
        ======================================================= */}
        <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Main Menu
          </p>

          {sidebarLinks.map((link, i) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={i}
                href={link.href}
                onClick={onClose} // Close sidebar on mobile click
                className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group font-medium
                  ${isActive 
                    ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-500/20" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
              >
                <link.icon
                  size={20}
                  className={isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"}
                />
                <span>{link.name}</span>
                
                {/* Active Indicator Dot */}
                {isActive && (
                  <div className="absolute right-3 w-1.5 h-1.5 bg-white/40 rounded-full" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* ======================================================
            3. FIXED FOOTER (Sign Out)
        ======================================================= */}
        <div className="p-4 border-t border-slate-50 shrink-0 bg-white">
            <SignOutButton>
                <button className="flex items-center justify-center gap-3 px-4 py-3 w-full rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors duration-200 font-medium group">
                    <LogOut size={20} className="group-hover:stroke-red-600" />
                    <span>Sign Out</span>
                </button>
            </SignOutButton>
        </div>

      </aside>
    </>
  )
}