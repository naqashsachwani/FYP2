'use client' 

import { useUser, useClerk } from "@clerk/nextjs" 
import { useState, useEffect } from "react"
import Link from "next/link"
import { 
  Menu, Home, Settings, LogOut, ShieldCheck, Bell, X, Store, 
  Trash2, ChevronLeft, ChevronRight 
} from "lucide-react" 

export default function RiderNavbar({ onToggleSidebar, isSidebarOpen }) {
  const { user } = useUser()
  const { openUserProfile, signOut } = useClerk()
  
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isBellOpen, setIsBellOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  // Strict Role Logic
  const [showAdminBtn, setShowAdminBtn] = useState(false)
  const [showSellerBtn, setShowSellerBtn] = useState(false)

  // Notification & Pagination State
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifPage, setNotifPage] = useState(1)
  const NOTIFS_PER_PAGE = 4

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const checkRoles = async () => {
      try {
        const adminRes = await fetch('/api/admin/is-admin').catch(()=>null);
        const sellerRes = await fetch('/api/store/is-seller').catch(()=>null);

        if (adminRes?.ok) setShowAdminBtn((await adminRes.json()).isAdmin === true);
        if (sellerRes?.ok) setShowSellerBtn(!!(await sellerRes.json()).isSeller);
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

  // Reset pagination if dropdown is closed
  useEffect(() => {
    if (!isBellOpen) setNotifPage(1);
  }, [isBellOpen]);

  // Mark single notification as read
  const markAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await fetch('/api/notifications', { method: 'PATCH', body: JSON.stringify({ id }) });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) { console.error(error) }
  };

  // Delete a notification
  const deleteNotification = async (id, e) => {
    e.stopPropagation();
    try {
      await fetch('/api/notifications', { method: 'DELETE', body: JSON.stringify({ id }) });
      setNotifications(prev => {
        const isUnread = prev.find(n => n.id === id)?.isRead === false;
        if (isUnread) setUnreadCount(count => Math.max(0, count - 1));
        return prev.filter(n => n.id !== id);
      });
      
      // Adjust pagination if we delete the last item on a page
      const newTotalPages = Math.max(1, Math.ceil((notifications.length - 1) / NOTIFS_PER_PAGE));
      if (notifPage > newTotalPages) setNotifPage(newTotalPages);

    } catch (error) { console.error(error) }
  };

  // Derived Pagination Variables
  const totalNotifPages = Math.max(1, Math.ceil(notifications.length / NOTIFS_PER_PAGE));
  const currentNotifs = notifications.slice((notifPage - 1) * NOTIFS_PER_PAGE, notifPage * NOTIFS_PER_PAGE);

  return (
    <header className="h-[73px] shrink-0 flex items-center justify-between px-3 sm:px-4 lg:px-6 bg-white border-b border-slate-200 z-40 relative">
      
      {/* Left Area: Logo matches Admin exactly */}
      <div className="flex items-center gap-2 sm:gap-4 lg:w-[240px] shrink-0">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-1.5 sm:p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all shrink-0"
        >
          {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <Link href="/" className="flex items-center gap-2 group truncate">
          <span className="text-xl sm:text-2xl font-bold text-slate-800 group-hover:opacity-80 transition-opacity truncate">
            <span className="text-blue-600">Dream</span>Saver
          </span>
          <span className="hidden sm:flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-blue-600 shadow-sm shrink-0">
            Rider
          </span>
        </Link>
      </div>

      {/* Right Area: Profile & Notifications */}
      <div className="flex items-center gap-2 sm:gap-4">
        {mounted && user && (
          <div className="relative">
            <button
              onClick={() => { setIsBellOpen(!isBellOpen); setIsProfileOpen(false); }}
              className="relative p-2 sm:p-2.5 text-slate-600 hover:text-blue-600 transition rounded-full hover:bg-blue-50 focus:outline-none"
            >
              <Bell className="w-[20px] h-[20px] sm:w-[22px] sm:h-[22px]" />
              {unreadCount > 0 && (
                <span className="absolute top-1 sm:top-1.5 right-1 sm:right-1.5 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full border border-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {isBellOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsBellOpen(false)}></div>
                <div className="absolute right-[-10px] sm:right-0 mt-3 w-[calc(100vw-24px)] sm:w-[380px] max-w-[400px] bg-white rounded-2xl shadow-xl border border-slate-100 flex flex-col z-40 overflow-hidden transform transition-all">
                  
                  {/* Notifications Header */}
                  <div className="px-5 py-4 flex justify-between items-center shrink-0">
                    <p className="text-base font-bold text-slate-900">Notifications</p>
                    {unreadCount > 0 && (
                      <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                        {unreadCount} New
                      </span>
                    )}
                  </div>

                  {/* Notifications List with Custom Scrollbar */}
                  <div className="max-h-[380px] overflow-y-auto px-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-400 pr-1 pb-2">
                    {notifications.length === 0 ? (
                      <p className="px-4 py-8 text-sm text-slate-500 text-center">No new notifications.</p>
                    ) : (
                      currentNotifs.map(n => (
                        <div key={n.id} className={`px-4 py-4 mb-2 rounded-xl transition-colors border ${!n.isRead ? 'bg-white border-slate-100 shadow-sm' : 'bg-transparent border-transparent'}`}>
                          <div className="flex justify-between items-start gap-2 mb-1.5">
                            <p className={`text-sm font-bold truncate ${!n.isRead ? 'text-slate-900' : 'text-slate-700'}`}>
                                {n.title}
                            </p>
                            
                            {/* Action Buttons */}
                            <div className="flex items-center gap-3 shrink-0 mt-0.5">
                              {!n.isRead && (
                                <button 
                                  onClick={(e) => markAsRead(n.id, e)} 
                                  className="text-[11px] bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold px-2 py-1 rounded-md transition-colors"
                                >
                                  Mark Read
                                </button>
                              )}
                              <button 
                                onClick={(e) => deleteNotification(n.id, e)} 
                                className="text-slate-300 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                          
                          <p className="text-[13px] text-slate-600 line-clamp-2 leading-relaxed mb-2 pr-4">
                            {n.message}
                          </p>
                          
                          <p className="text-[11px] font-medium text-slate-400">
                            {n.createdAt ? new Date(n.createdAt).toLocaleDateString('en-GB') : "Recently"} at {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ""}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Pagination Footer */}
                  {notifications.length > 0 && (
                    <div className="px-5 py-3 border-t border-slate-100 flex justify-between items-center bg-white rounded-b-2xl">
                      <span className="text-xs font-bold text-slate-500">Page {notifPage} of {totalNotifPages}</span>
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setNotifPage(p => Math.max(1, p - 1)); }} 
                          disabled={notifPage === 1} 
                          className="p-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-600 transition-colors"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setNotifPage(p => Math.min(totalNotifPages, p + 1)); }} 
                          disabled={notifPage === totalNotifPages} 
                          className="p-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-600 transition-colors"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </>
            )}
          </div>
        )}

        {/* Profile Dropdown */}
        <div className="relative">
          <button 
            onClick={() => { setIsProfileOpen(!isProfileOpen); setIsBellOpen(false); }}
            className="flex items-center gap-2 sm:gap-3 bg-slate-50 rounded-full pl-1.5 sm:pl-2 pr-2 sm:pr-4 py-1.5 shadow-sm border border-slate-100 hover:bg-slate-100 transition-all focus:outline-none"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border border-blue-200 bg-white shrink-0">
              <img src={user?.imageUrl} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <div className="hidden sm:block text-left truncate max-w-[100px] lg:max-w-[150px]">
              <p className="text-sm font-bold text-slate-700 leading-tight truncate">Hi, {user?.firstName}</p>
              <p className="text-[10px] text-slate-500 font-medium truncate">RIDER</p>
            </div>
          </button>

          {isProfileOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setIsProfileOpen(false)}></div>
              <div className="absolute right-0 mt-3 w-[calc(100vw-24px)] sm:w-64 max-w-[280px] bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-40 overflow-hidden transform transition-all">
                <div className="px-2 space-y-1">
                  
                  <Link href="/" className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition-colors">
                    <Home size={16} className="text-slate-500 shrink-0" /> Go to Homepage
                  </Link>
                  
                  {showAdminBtn && (
                    <Link href="/admin" className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition-colors">
                      <ShieldCheck size={16} className="text-slate-500 shrink-0" /> Admin Dashboard
                    </Link>
                  )}
                  
                  {(showAdminBtn || showSellerBtn) && (
                    <Link href="/store" className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition-colors">
                      <Store size={16} className="text-slate-500 shrink-0" /> Store Dashboard
                    </Link>
                  )}

                  <button onClick={() => openUserProfile()} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition-colors">
                    <Settings size={16} className="text-slate-500 shrink-0" /> Manage Account
                  </button>

                </div>
                <div className="border-t border-slate-100 mt-2 pt-2 px-2">
                  <button onClick={() => signOut({ redirectUrl: '/' })} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors">
                    <LogOut size={16} className="text-red-500 shrink-0" /> Sign Out
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