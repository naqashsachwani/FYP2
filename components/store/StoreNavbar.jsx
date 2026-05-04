'use client' 

import { useUser, useClerk } from "@clerk/nextjs" 
import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, Home, Settings, LogOut, ShieldCheck, Bell, X, Truck, Trash2, ChevronLeft, ChevronRight } from "lucide-react" 
import toast from "react-hot-toast"

export default function StoreNavbar({ onToggleSidebar, isSidebarOpen }) {
  const { user } = useUser()
  const { openUserProfile, signOut } = useClerk()
  
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isBellOpen, setIsBellOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  const [showAdminBtn, setShowAdminBtn] = useState(false)
  const [showRiderBtn, setShowRiderBtn] = useState(false)

  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifPage, setNotifPage] = useState(1)
  const NOTIFS_PER_PAGE = 5
  const [selectedNotif, setSelectedNotif] = useState(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    let intervalId;

    const checkRoles = async () => {
      try {
        const adminRes = await fetch('/api/admin/is-admin').catch(()=>null);
        const riderRes = await fetch('/api/rider/is-rider').catch(()=>null);

        if (adminRes?.ok) setShowAdminBtn((await adminRes.json()).isAdmin === true);
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
      intervalId = setInterval(fetchNotifications, 30000);
    }

    return () => { if (intervalId) clearInterval(intervalId); };
  }, [mounted, user])

  const totalNotifPages = Math.max(1, Math.ceil(notifications.length / NOTIFS_PER_PAGE));
  const currentNotifications = notifications.slice((notifPage - 1) * NOTIFS_PER_PAGE, notifPage * NOTIFS_PER_PAGE);

  useEffect(() => {
      if (notifPage > totalNotifPages) setNotifPage(totalNotifPages);
  }, [notifications.length, notifPage, totalNotifPages]);

  const markAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await fetch('/api/notifications', { method: 'PATCH', body: JSON.stringify({ id }) });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) { console.error(error); }
  };

  const deleteNotification = async (id, e) => {
    e.stopPropagation();
    try {
      await fetch('/api/notifications', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      const notifToDelete = notifications.find(n => n.id === id);
      if (notifToDelete && !notifToDelete.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
      }
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success("Notification deleted");
    } catch (error) { toast.error("Failed to delete notification"); }
  };

  const openNotification = (notif) => {
      if (!notif.isRead) markAsRead(notif.id);
      setSelectedNotif(notif);
      setIsBellOpen(false);
  };

  return (
    <>
    <header className="h-[73px] shrink-0 flex items-center justify-between px-4 lg:px-6 bg-white border-b border-slate-200 z-40">
      
      {/* Left Area: Logo */}
      <div className="flex items-center gap-4 lg:w-[240px] shrink-0">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
        >
          {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-2xl font-bold text-slate-800 group-hover:opacity-80 transition-opacity">
            <span className="text-blue-600">Dream</span>Saver
          </span>
          <span className="hidden sm:flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-blue-600 shadow-sm">
            Store
          </span>
        </Link>
      </div>

      {/* Right Area: Notifications & Profile Pill */}
      <div className="flex items-center gap-3 sm:gap-5">
        {mounted && user && (
          <div className="relative">
            <button
              onClick={() => { setIsBellOpen(!isBellOpen); setIsProfileOpen(false); }}
              className="relative p-2.5 text-slate-600 hover:text-blue-600 transition rounded-full hover:bg-blue-50"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full border border-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {isBellOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsBellOpen(false)}></div>
                <div className="absolute right-0 mt-3 w-[320px] sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-100 flex flex-col z-40 overflow-hidden transform transition-all animate-in slide-in-from-top-2">
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
                    <p className="text-sm font-bold text-slate-800">Notifications</p>
                    <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">{unreadCount} New</span>
                  </div>
                  
                  <div className="max-h-[60vh] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="px-4 py-8 text-sm text-slate-500 text-center font-medium">You have no notifications.</p>
                    ) : (
                      currentNotifications.map(notif => (
                        <div key={notif.id} onClick={() => openNotification(notif)} className={`px-4 py-3 border-b border-slate-50 cursor-pointer transition-colors hover:bg-slate-50 ${!notif.isRead ? 'bg-blue-50/30' : ''}`}>
                          <div className="flex justify-between items-start mb-1">
                            <p className={`text-sm pr-2 line-clamp-1 ${!notif.isRead ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                                {notif.title}
                            </p>
                            <div className="flex items-center gap-2 shrink-0">
                                {!notif.isRead && (
                                  <button onClick={(e) => markAsRead(notif.id, e)} className="text-[10px] text-blue-600 font-bold hover:underline bg-blue-100 px-1.5 py-0.5 rounded">
                                    Mark Read
                                  </button>
                                )}
                                <button onClick={(e) => deleteNotification(notif.id, e)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1 rounded transition-colors" title="Delete">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                          </div>
                          <p className="text-xs text-slate-600 line-clamp-2">{notif.message}</p>
                          <span className="text-[10px] text-slate-400 block mt-1.5 font-medium">
                            {new Date(notif.createdAt).toLocaleDateString('en-GB')} at {new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  {notifications.length > 0 && (
                      <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
                          <span className="text-xs font-semibold text-slate-500">Page {notifPage} of {totalNotifPages}</span>
                          <div className="flex gap-2">
                              <button onClick={(e) => { e.stopPropagation(); setNotifPage(p => Math.max(1, p - 1)); }} disabled={notifPage === 1} className="p-1 bg-white border rounded hover:bg-slate-100 disabled:opacity-50 text-slate-600 transition"><ChevronLeft size={16} /></button>
                              <button onClick={(e) => { e.stopPropagation(); setNotifPage(p => Math.min(totalNotifPages, p + 1)); }} disabled={notifPage === totalNotifPages} className="p-1 bg-white border rounded hover:bg-slate-100 disabled:opacity-50 text-slate-600 transition"><ChevronRight size={16} /></button>
                          </div>
                      </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ✅ THE PILL STYLE PROFILE */}
        <div className="relative">
          <button 
            onClick={() => { setIsProfileOpen(!isProfileOpen); setIsBellOpen(false); }}
            className="flex items-center gap-3 bg-white rounded-full pl-2 pr-4 py-1.5 shadow-sm border border-slate-200 hover:bg-slate-50 transition-all focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-100 bg-slate-50 shrink-0">
              <img src={user?.imageUrl} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-bold text-slate-800 leading-tight">Hi, {user?.firstName}</p>
              <p className="text-[10px] text-black-600 font-bold uppercase tracking-wider">Store</p>
            </div>
          </button>

          {isProfileOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setIsProfileOpen(false)}></div>
              <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-40 overflow-hidden">
                <div className="px-2 space-y-1">
                  
                  <Link href="/" className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition-colors">
                    <Home size={16} className="text-slate-500" /> Go to Homepage
                  </Link>
                  
                  {showAdminBtn && (
                    <Link href="/admin" className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition-colors">
                      <ShieldCheck size={16} className="text-slate-500" /> Admin Dashboard
                    </Link>
                  )}
                  
                  {showRiderBtn && (
                    <Link href="/rider/dashboard" className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition-colors">
                      <Truck size={16} className="text-slate-500" /> Rider Dashboard
                    </Link>
                  )}

                  <button onClick={() => openUserProfile()} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition-colors">
                    <Settings size={16} className="text-slate-500" /> Manage Account
                  </button>

                </div>
                <div className="border-t border-slate-100 mt-2 pt-2 px-2">
                  <button onClick={() => signOut({ redirectUrl: '/' })} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors">
                    <LogOut size={16} className="text-red-500" /> Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </header>

    {/* NOTIFICATION MODAL */}
    {selectedNotif && (
        <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50 shrink-0">
              <div className="flex items-center gap-2 text-slate-800">
                  <Bell className="text-blue-600" size={20} />
                  <h3 className="font-bold text-lg">Notification</h3>
              </div>
              <button onClick={() => setSelectedNotif(null)} className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-full transition-colors"><X size={20} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <h4 className="font-bold text-xl text-slate-900 mb-2">{selectedNotif.title}</h4>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6 border-b border-slate-100 pb-4">
                  {new Date(selectedNotif.createdAt).toLocaleDateString('en-GB')} at {new Date(selectedNotif.createdAt).toLocaleTimeString()}
              </p>
              
              <div className="text-slate-700 leading-relaxed text-sm whitespace-pre-wrap font-medium" dangerouslySetInnerHTML={{ __html: selectedNotif.html || selectedNotif.message }}>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-white flex gap-3 shrink-0">
              <button 
                onClick={() => { deleteNotification(selectedNotif.id, { stopPropagation: () => {} }); setSelectedNotif(null); }} 
                className="flex-1 py-3 bg-white border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition flex items-center justify-center gap-2 text-sm"
              >
                <Trash2 size={16} /> Delete
              </button>
              <button 
                onClick={() => setSelectedNotif(null)} 
                className="flex-[2] py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}