'use client' 

import { useUser, useClerk } from "@clerk/nextjs" 
import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, Home, Settings, LogOut, ShieldCheck, Bell, Trash2, ChevronLeft, ChevronRight, X, Truck, Store } from "lucide-react" 
import toast from "react-hot-toast"

export default function RiderNavbar({ onToggleSidebar, isSidebarOpen }) {
  const { user } = useUser()
  const { openUserProfile, signOut } = useClerk()
  
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isBellOpen, setIsBellOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  // Strict Role Logic
  const [showAdminBtn, setShowAdminBtn] = useState(false)
  const [showSellerBtn, setShowSellerBtn] = useState(false)
  const [showRiderBtn, setShowRiderBtn] = useState(false)

  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const checkRoles = async () => {
      try {
        const adminRes = await fetch('/api/admin/is-admin').catch(()=>null);
        const sellerRes = await fetch('/api/store/is-seller').catch(()=>null);
        const riderRes = await fetch('/api/rider/is-rider').catch(()=>null);

        if (adminRes?.ok) setShowAdminBtn((await adminRes.json()).isAdmin === true);
        if (sellerRes?.ok) setShowSellerBtn(!!(await sellerRes.json()).isSeller);
        if (riderRes?.ok) setShowRiderBtn((await riderRes.json()).isRider === true);
      } catch (error) { console.error(error) }
    }

    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications');
        const data = await res.json();
        if (data.notifications) {
          setNotifications(data.notifications);
          setUnreadCount(data.notifications.filter(n => !n.isRead).length);
        }
      } catch (error) { console.error(error); }
    };

    if (mounted && user) {
      checkRoles();
      fetchNotifications();
    }
  }, [mounted, user])

  const markAsRead = async (id, e) => {
    e.stopPropagation();
    await fetch('/api/notifications', { method: 'PATCH', body: JSON.stringify({ id }) });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  return (
    <header className="flex items-center justify-between px-4 lg:px-8 py-4 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm sticky top-0 z-40">
      
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
        >
          {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="text-2xl lg:text-3xl font-bold text-slate-800 group-hover:scale-105 transition-transform inline-block">
            <span className="text-green-600">Dream</span>Saver
          </span>
          <span className="hidden md:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-white bg-green-600 shadow-md">
            Rider
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {mounted && user && (
          <div className="relative">
            <button
              onClick={() => { setIsBellOpen(!isBellOpen); setIsProfileOpen(false); }}
              className="relative p-2 text-slate-600 hover:text-green-600 transition rounded-full hover:bg-green-50"
            >
              <Bell size={22} />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {isBellOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsBellOpen(false)}></div>
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 flex flex-col z-40 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <p className="text-sm font-bold text-slate-800">Notifications</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="px-4 py-6 text-sm text-slate-500 text-center">No new notifications.</p>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} onClick={(e) => markAsRead(n.id, e)} className={`p-3 border-b cursor-pointer ${!n.isRead ? 'bg-green-50' : 'bg-white'}`}>
                          <p className="text-sm font-semibold">{n.title}</p>
                          <p className="text-xs text-slate-600 truncate">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <div className="relative">
          <button 
            onClick={() => { setIsProfileOpen(!isProfileOpen); setIsBellOpen(false); }}
            className="flex items-center gap-3 bg-slate-50 rounded-full pl-2 pr-4 py-1.5 shadow-sm hover:bg-slate-100 transition-all"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-green-200">
              <img src={user?.imageUrl} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-slate-700 leading-tight">Hi, {user?.firstName}</p>
            </div>
          </button>

          {isProfileOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setIsProfileOpen(false)}></div>
              <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-40 overflow-hidden">
                <div className="px-2 space-y-1">
                  
                  <Link href="/" className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg font-medium">
                    <Home size={16} className="text-slate-500" /> Go to Homepage
                  </Link>
                  
                  {showAdminBtn && (
                    <Link href="/admin" className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg font-medium">
                      <ShieldCheck size={16} className="text-slate-500" /> Admin Dashboard
                    </Link>
                  )}
                  
                  {(showAdminBtn || showSellerBtn) && (
                    <Link href="/store" className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg font-medium">
                      <Store size={16} className="text-slate-500" /> Store Dashboard
                    </Link>
                  )}

                  <button onClick={() => openUserProfile()} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg font-medium">
                    <Settings size={16} className="text-slate-500" /> Manage Account
                  </button>

                </div>
                <div className="border-t border-slate-100 mt-2 pt-2 px-2">
                  <button onClick={() => signOut({ redirectUrl: '/' })} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg font-medium">
                    <LogOut size={16} className="text-red-500" /> Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}