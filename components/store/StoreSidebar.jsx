'use client' 

import { usePathname } from "next/navigation"
import { 
  HomeIcon, 
  LayoutListIcon, 
  SquarePenIcon, 
  SquarePlusIcon, 
  Settings, 
  X, 
  Store, 
  DollarSign,
  MessageSquareWarning 
} from "lucide-react"

import Image from "next/image"
import Link from "next/link"

const StoreSidebar = ({ storeInfo, isOpen, onClose }) => {
  const pathname = usePathname()

  const sidebarLinks = [
    { name: 'Dashboard', href: '/store', icon: HomeIcon },
    { name: 'Add Product', href: '/store/add-product', icon: SquarePlusIcon },
    { name: 'Manage Product', href: '/store/manage-product', icon: SquarePenIcon },
    { name: 'Orders', href: '/store/orders', icon: LayoutListIcon },
    { name: 'Revenue', href: '/store/revenue', icon: DollarSign },
    { name: 'Location Settings', href: '/store/store-settings', icon: Settings },
    { name: 'Requests & Support', href: '/store/request', icon: MessageSquareWarning },
  ]

  return (
    <>
      {/* ================= OVERLAY (MOBILE) ================= */}
      <div
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300
          ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
        onClick={onClose}
      />

      {/* ================= SIDEBAR CONTAINER ================= */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-[260px] sm:w-[280px] bg-white border-r border-slate-100 shadow-2xl lg:shadow-none
          transform transition-transform duration-300 z-50
          flex flex-col shrink-0 overflow-hidden
          ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
        `}
      >
        {/* ================= 1. FIXED HEADER (Does Not Scroll) ================= */}
        <div className="relative pt-8 pb-6 px-4 sm:px-6 flex flex-col items-center border-b border-slate-50 shrink-0"> 
          <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-blue-50/50 to-transparent -z-10" />

          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-violet-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition"></div>
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl p-1 bg-white shadow-sm ring-1 ring-slate-100">
              <Image
                src={storeInfo?.logo || '/default-store.png'}
                alt="Store Logo"
                fill
                className="rounded-xl object-cover"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-emerald-500 rounded-full border-2 sm:border-4 border-white" />
          </div>

          <div className="mt-4 text-center w-full px-2">
            <h3 className="text-slate-900 font-bold text-base sm:text-lg truncate">
              {storeInfo?.name || "My Store"}
            </h3>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-blue-50 text-blue-700 mt-1 border border-blue-100">
              <Store size={10} className="shrink-0" />
              Store Owner
            </span>
          </div>

          <button
            onClick={onClose}
            className="absolute top-3 right-3 lg:hidden p-1.5 sm:p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* ================= 2. SCROLLABLE NAVIGATION ================= */}
        <nav className="flex-1 overflow-y-auto pt-6 pb-24 px-3 sm:px-4 space-y-1.5 overscroll-contain [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 pr-2">
          
          <p className="px-3 sm:px-4 text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Store Management
          </p>

          {sidebarLinks.map((link, index) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={index}
                href={link.href}
                onClick={onClose}
                className={`relative flex items-center gap-3 px-3 sm:px-4 py-3 sm:py-3.5 rounded-xl transition font-medium text-sm group shrink-0
                  ${isActive
                    ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-md shadow-blue-500/20"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }
                `}
              >
                <link.icon
                  size={18}
                  className={`sm:w-[20px] sm:h-[20px] shrink-0 ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"}`}
                />
                <span className="truncate">{link.name}</span>
                {isActive && (
                  <div className="absolute right-3 w-1.5 h-1.5 bg-white/40 rounded-full" />
                )}
              </Link>
            )
          })}
        </nav>

      </aside>
    </>
  )
}

export default StoreSidebar