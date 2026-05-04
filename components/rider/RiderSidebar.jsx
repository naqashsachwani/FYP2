'use client'

import { usePathname } from "next/navigation"
import { 
  LayoutGrid, 
  ClipboardList, 
  MapPin, 
  History, 
  Wallet, 
  MessageSquareWarning
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useUser } from "@clerk/nextjs"

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
        className={`fixed lg:relative z-40 h-full w-[260px] shrink-0
        bg-white border-r border-slate-200 shadow-xl lg:shadow-none 
        transform transition-transform duration-300 ease-in-out 
        flex flex-col 
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} 
        `}
      >

        {/* User Profile Block */}
        <div className="pt-8 pb-6 px-6 flex flex-col items-center border-b border-slate-100 shrink-0">
          <div className="relative">
            <Image
              className="w-16 h-16 rounded-2xl border border-slate-200 object-cover bg-white shadow-sm"
              src={user?.imageUrl || "/default-avatar.png"}
              alt="Profile"
              width={64}
              height={64}
            />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-sm" />
          </div>

          <div className="mt-4 text-center">
            <h3 className="text-slate-900 font-bold text-sm tracking-tight">
              {user?.fullName || "Delivery Partner"}
            </h3>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 mt-1 border border-blue-100">
              Rider Account
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            Workspace
          </p>

          {sidebarLinks.map((link, i) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={i}
                href={link.href}
                onClick={onClose} 
                className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-sm font-bold
                  ${isActive 
                    ? "bg-blue-600 text-white shadow-sm" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
              >
                <link.icon size={18} className={isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"} />
                <span>{link.name}</span>
                {isActive && <div className="absolute right-3 w-1.5 h-1.5 bg-white/60 rounded-full" />}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}