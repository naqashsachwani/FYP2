'use client'

import { usePathname } from "next/navigation"
import { 
  LayoutGrid, 
  ClipboardList, 
  MapPin, 
  History, 
  Wallet, 
  MessageSquareWarning,
  LogOut
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useUser, SignOutButton } from "@clerk/nextjs"

export default function RiderSidebar({ isOpen, onClose }) {
  const { user } = useUser()
  const pathname = usePathname()

  const sidebarLinks = [
    { name: 'Dashboard', href: '/rider/dashboard', icon: LayoutGrid },
    { name: 'Delivery Requests', href: '/rider/requests', icon: ClipboardList },
    { name: 'Active Jobs', href: '/rider/active-jobs', icon: MapPin },
    { name: 'My Wallet', href: '/rider/wallet', icon: Wallet },
    { name: 'Job History', href: '/rider/history', icon: History },
    { name: 'Support & Complaints', href: '/rider/complaints', icon: MessageSquareWarning },
  ]

  return (
    <>
      {/* Mobile Overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-[280px] 
        bg-white border-r border-slate-100 shadow-xl lg:shadow-none 
        transform transition-transform duration-300 ease-in-out 
        flex flex-col 
        ${isOpen ? "translate-x-0" : "-translate-x-full"} 
        lg:translate-x-0`}
      >

        {/* User Profile Header */}
        <div className="relative pt-8 pb-6 px-6 flex flex-col items-center border-b border-slate-50 shrink-0">
          {/* Background Gradient */}
          <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-green-50/50 to-transparent -z-10" />
          
          <div className="relative group cursor-pointer">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl opacity-75 group-hover:opacity-100 transition duration-200 blur-[2px]" />
            <Image
              className="relative w-16 h-16 rounded-2xl border-2 border-white object-cover z-10 bg-white"
              src={user?.imageUrl || "/default-avatar.png"}
              alt="Rider profile"
              width={64}
              height={64}
            />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white z-20" />
          </div>

          <div className="mt-4 text-center">
            <h3 className="text-slate-900 font-bold text-lg tracking-tight">
              {user?.fullName || "Delivery Partner"}
            </h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 mt-1 border border-green-100">
              Rider Account
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 pr-2">
          <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Workspace
          </p>

          {sidebarLinks.map((link, i) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={i}
                href={link.href}
                onClick={onClose} 
                className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group font-medium
                  ${isActive 
                    ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/20" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
              >
                <link.icon size={20} className={isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"} />
                <span>{link.name}</span>
                {isActive && <div className="absolute right-3 w-1.5 h-1.5 bg-white/40 rounded-full" />}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
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