'use client' 

import { useState } from "react"
import { usePathname } from "next/navigation"
import { 
  HomeIcon, 
  LayoutListIcon, 
  SquarePenIcon, 
  SquarePlusIcon, 
  Settings, 
  Menu, 
  X, 
  Store, 
  DollarSign 
} from "lucide-react"

import Image from "next/image"
import Link from "next/link"

const StoreSidebar = ({ storeInfo }) => {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const sidebarLinks = [
    { name: 'Dashboard', href: '/store', icon: HomeIcon },
    { name: 'Add Product', href: '/store/add-product', icon: SquarePlusIcon },
    { name: 'Manage Product', href: '/store/manage-product', icon: SquarePenIcon },
    { name: 'Orders', href: '/store/orders', icon: LayoutListIcon },
    { name: 'Revenue', href: '/store/revenue', icon: DollarSign },
    { name: 'Location Settings', href: '/store/store-settings', icon: Settings },
  ]

  return (
    <>
      {/* ================= MOBILE TOP BAR ================= */}
      <div className="lg:hidden flex justify-between items-center px-4 py-3 bg-white/80 backdrop-blur-md border-b border-slate-200 fixed top-0 left-0 right-0 z-40">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-200 shadow-sm">
            <Image 
              src={storeInfo?.logo || '/default-store.png'} 
              alt="Logo" 
              fill 
              className="object-cover" 
            />
          </div>
          <span className="font-bold text-slate-800 tracking-tight">DreamSaver</span>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="p-2.5 rounded-xl bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition border border-slate-200"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* ================= OVERLAY (MOBILE) ================= */}
      <div
        className={`fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300
          ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
        onClick={() => setIsOpen(false)}
      />

      {/* ================= SIDEBAR CONTAINER ================= */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-[280px] bg-white border-r border-slate-100 shadow-2xl lg:shadow-none
          transform transition-transform duration-300 z-50
          flex flex-col /* ✅ Essential for scrolling layout */
          ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
        `}
      >
        {/* ================= 1. FIXED HEADER (Does Not Scroll) ================= */}
        <div className="relative pt-8 pb-6 px-6 flex flex-col items-center border-b border-slate-50 shrink-0"> 
          {/* shrink-0 ensures header stays fixed size even on short screens */}

          {/* Decorative gradient */}
          <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-blue-50/50 to-transparent -z-10" />

          {/* Store Logo */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-violet-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition"></div>
            <div className="relative w-20 h-20 rounded-2xl p-1 bg-white shadow-sm ring-1 ring-slate-100">
              <Image
                src={storeInfo?.logo || '/default-store.png'}
                alt="Store Logo"
                fill
                className="rounded-xl object-cover"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-4 border-white" />
          </div>

          {/* Store Name & Role */}
          <div className="mt-4 text-center">
            <h3 className="text-slate-900 font-bold text-lg truncate max-w-[200px]">
              {storeInfo?.name || "My Store"}
            </h3>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 mt-1 border border-blue-100">
              <Store size={10} />
              Store Owner
            </span>
          </div>

          {/* Close button (mobile only) */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 lg:hidden p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        {/* ================= 2. SCROLLABLE NAVIGATION ================= */}
        {/* flex-1: fills remaining height. overflow-y-auto: enables scrolling */}
        <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          
          <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Store Management
          </p>

          {sidebarLinks.map((link, index) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={index}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`relative flex items-center gap-3 px-4 py-3.5 rounded-xl transition font-medium text-sm group
                  ${isActive
                    ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-500/20"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }
                `}
              >
                <link.icon
                  size={20}
                  className={isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"}
                />
                <span>{link.name}</span>
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