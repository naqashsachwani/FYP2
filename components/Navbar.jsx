'use client';

import { Search, ShoppingCart, Menu, X, History, ShieldCheck, Store, Settings, LogOut, Ticket, Wallet, Bell, Trash2, ChevronLeft, ChevronRight, Truck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import toast from "react-hot-toast";

const Navbar = () => {
  const { user } = useUser();
  const { openSignIn, openUserProfile, signOut } = useClerk();
  const router = useRouter();
  
  const [search, setSearch] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Dropdown States
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isBellOpen, setIsBellOpen] = useState(false);

  const [mounted, setMounted] = useState(false); 

  // Role & Notification States
  const [showAdminBtn, setShowAdminBtn] = useState(false);
  const [showSellerBtn, setShowSellerBtn] = useState(false);
  const [showRiderBtn, setShowRiderBtn] = useState(false); // ✅ NEW: Rider State
  
  // Notification Management
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifPage, setNotifPage] = useState(1);
  const NOTIFS_PER_PAGE = 5;
  const [selectedNotif, setSelectedNotif] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch roles & notifications
  useEffect(() => {
    let intervalId;

    const checkRoles = async () => {
      try {
        // Fetch all roles concurrently, catching errors so one failure doesn't break the others
        const adminRes = await fetch('/api/admin/is-admin').catch(() => null);
        const sellerRes = await fetch('/api/store/is-seller').catch(() => null);
        const riderRes = await fetch('/api/rider/is-rider').catch(() => null); // ✅ NEW: Check Rider status

        if (adminRes && adminRes.ok) {
           const adminData = await adminRes.json();
           setShowAdminBtn(adminData.isAdmin === true);
        }
        if (sellerRes && sellerRes.ok) {
           const sellerData = await sellerRes.json();
           setShowSellerBtn(!!sellerData.isSeller);
        }
        if (riderRes && riderRes.ok) {
           const riderData = await riderRes.json();
           setShowRiderBtn(riderData.isRider === true);
        }
      } catch (error) {
        console.error("Role verification failed", error);
      }
    };

    const fetchNotifications = async () => {
      try {
        const notifRes = await fetch('/api/notifications');
        const notifData = await notifRes.json();
        if (notifData.notifications) {
          setNotifications(notifData.notifications);
          setUnreadCount(notifData.notifications.filter(n => !n.isRead).length);
        }
      } catch (error) {
        console.error("Notification fetch failed", error);
      }
    };

    if (mounted && user) {
      checkRoles(); 
      fetchNotifications(); 

      const refreshIfVisible = () => {
        if (document.visibilityState === 'visible') {
          fetchNotifications();
        }
      };

      intervalId = setInterval(refreshIfVisible, 60000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [mounted, user]);

  const totalNotifPages = Math.max(1, Math.ceil(notifications.length / NOTIFS_PER_PAGE));
  const currentNotifications = notifications.slice((notifPage - 1) * NOTIFS_PER_PAGE, notifPage * NOTIFS_PER_PAGE);

  useEffect(() => {
      if (notifPage > totalNotifPages) {
          setNotifPage(totalNotifPages);
      }
  }, [notifications.length, notifPage, totalNotifPages]);

  const markAsRead = async (id, e = null) => {
    if (e) e.stopPropagation();
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark read", error);
    }
  };

  const deleteNotification = async (id, e) => {
    e.stopPropagation();
    try {
      await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      
      const notifToDelete = notifications.find(n => n.id === id);
      if (notifToDelete && !notifToDelete.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success("Notification deleted");
    } catch (error) {
      console.error("Failed to delete", error);
      toast.error("Failed to delete notification");
    }
  };

  const openNotification = (notif) => {
      if (!notif.isRead) {
          markAsRead(notif.id);
      }
      setSelectedNotif(notif);
      setIsBellOpen(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/shop?search=${encodeURIComponent(search)}`);
      setSearch("");
      setIsMobileMenuOpen(false); 
    }
  };

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/shop", label: "Shop" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">

            {/* Logo Section */}
            <Link href="/" className="flex items-center gap-1 relative group">
              <h1 className="text-3xl lg:text-4xl font-bold text-slate-800 group-hover:text-green-600 transition-colors">
                <span className="text-green-600">Dream</span>Saver
              </h1>
              <span className="text-green-600 text-4xl lg:text-5xl absolute -top-1 -right-3">.</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-8 font-medium text-slate-700">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative group hover:text-green-600 transition-colors"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-green-600 group-hover:w-full transition-all duration-300"></span>
                </Link>
              ))}
            </div>

            {/* Desktop Search */}
            <form
              onSubmit={handleSearch}
              className="hidden lg:flex items-center w-72 bg-slate-100 px-3 py-2 rounded-xl border border-slate-200 text-sm focus-within:ring-2 focus-within:ring-green-400 transition shadow-sm hover:shadow-md"
            >
              <Search size={18} className="text-slate-500" />
              <input
                className="w-full bg-transparent ml-2 outline-none text-slate-700 placeholder-slate-500"
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </form>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 lg:gap-4 relative">
              
              <Link
                href="/cart"
                className="relative flex items-center gap-2 text-slate-600 hover:text-green-600 transition p-2 rounded-xl hover:bg-green-50 shadow-sm hover:shadow-md"
              >
                <ShoppingCart size={20} />
                <span className="hidden sm:block text-sm font-medium">My Goals</span>
              </Link>

              {mounted && user && (
                <div className="relative">
                  <button
                    onClick={() => { setIsBellOpen(!isBellOpen); setIsProfileOpen(false); }}
                    className="relative p-2 text-slate-600 hover:text-green-600 transition rounded-xl hover:bg-green-50 shadow-sm hover:shadow-md"
                  >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-white">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {isBellOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsBellOpen(false)}></div>
                      <div className="absolute right-[-40px] sm:right-0 mt-3 w-[320px] sm:w-80 bg-white rounded-2xl shadow-xl border border-slate-100 flex flex-col z-50 overflow-hidden transform transition-all">
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
                          <p className="text-sm font-bold text-slate-800">Notifications</p>
                          <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">{unreadCount} New</span>
                        </div>
                        
                        <div className="max-h-[60vh] overflow-y-auto">
                          {notifications.length === 0 ? (
                            <p className="px-4 py-8 text-sm text-slate-500 text-center font-medium">You have no notifications.</p>
                          ) : (
                            currentNotifications.map(notif => (
                              <div 
                                key={notif.id} 
                                onClick={() => openNotification(notif)}
                                className={`px-4 py-3 border-b border-slate-50 cursor-pointer transition-colors hover:bg-slate-50 ${!notif.isRead ? 'bg-green-50/30' : ''}`}
                              >
                                <div className="flex justify-between items-start mb-1">
                                  <p className={`text-sm pr-2 line-clamp-1 ${!notif.isRead ? 'font-bold text-gray-900' : 'font-semibold text-slate-700'}`}>
                                      {notif.title}
                                  </p>
                                  <div className="flex items-center gap-2 shrink-0">
                                      {!notif.isRead && (
                                        <button onClick={(e) => markAsRead(notif.id, e)} className="text-[10px] text-green-600 font-bold hover:underline bg-green-100 px-1.5 py-0.5 rounded">
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
                                  {new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                              </div>
                            ))
                          )}
                        </div>

                        {notifications.length > 0 && (
                            <div className="p-3 border-t border-slate-100 bg-gray-50 flex items-center justify-between shrink-0">
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

              {/* Authentication & Profile Dropdown */}
              {!mounted ? (
                <div className="hidden sm:block w-9 h-9 bg-slate-200 rounded-full animate-pulse ml-2"></div>
              ) : !user ? (
                <button
                  onClick={openSignIn}
                  className="hidden sm:flex items-center px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl shadow-md hover:scale-105 transition-all duration-200 active:scale-95 ml-2"
                >
                  Sign In
                </button>
              ) : (
                <div className="relative hidden sm:block ml-2 mt-1.5">
                  <button
                    onClick={() => { setIsProfileOpen(!isProfileOpen); setIsBellOpen(false); }}
                    className="w-9 h-9 rounded-full overflow-hidden border-2 border-slate-200 hover:border-green-500 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  >
                    <img src={user?.imageUrl} alt={user?.fullName || "User"} className="w-full h-full object-cover" />
                  </button>

                  {isProfileOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
                      <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 mb-1">
                          <p className="text-sm font-semibold text-slate-800 truncate">{user?.fullName}</p>
                          <p className="text-xs text-slate-500 truncate">{user?.primaryEmailAddress?.emailAddress}</p>
                        </div>

                        <div className="px-2 space-y-1">
                          <button
                            onClick={() => { openUserProfile(); setIsProfileOpen(false); }}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                          >
                            <Settings size={16} className="text-slate-500" /> Manage Account
                          </button>

                          {showAdminBtn && (
                            <Link href="/admin" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-medium">
                              <ShieldCheck size={16} className="text-slate-500" /> Admin Dashboard
                            </Link>
                          )}

                          {showSellerBtn && (
                            <Link href="/store" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-medium">
                              <Store size={16} className="text-slate-500" /> Store Dashboard
                            </Link>
                          )}

                          {/* ✅ NEW: Rider Dashboard Link */}
                          {(showAdminBtn || showRiderBtn) && (
                            <Link href="/rider/dashboard" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-medium">
                              <Truck size={16} className="text-slate-500" /> Rider Dashboard
                            </Link>
                          )}

                          <Link href="/wallet" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-medium">
                            <Wallet size={16} className="text-slate-500" /> My Wallet
                          </Link>

                          <Link href="/my-coupons" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-medium">
                            <Ticket size={16} className="text-slate-500" /> My Coupons
                          </Link>

                          <Link href="/goal-history" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-medium">
                            <History size={16} className="text-slate-500" /> Goal History
                          </Link>
                        </div>

                        <div className="border-t border-slate-100 mt-2 pt-2 px-2">
                          <button
                            onClick={() => signOut({ redirectUrl: '/' })}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                          >
                            <LogOut size={16} className="text-red-500" /> Sign Out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Mobile Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition shadow-sm hover:shadow-md ml-1"
              >
                {isMobileMenuOpen ? <X size={24} className="text-slate-600" /> : <Menu size={24} className="text-slate-600" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`lg:hidden bg-white border-t border-slate-200 shadow-md transition-all duration-300 overflow-hidden ${
            isMobileMenuOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="px-5 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-3 py-2 rounded-lg text-slate-700 hover:bg-green-50 hover:text-green-600 transition font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            <div className="pt-4 border-t border-slate-200">
              {!mounted ? (
                <div className="w-full h-12 bg-slate-200 rounded-xl animate-pulse"></div>
              ) : !user ? (
                <button
                  onClick={() => { openSignIn(); setIsMobileMenuOpen(false); }}
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold shadow-md hover:scale-105 transition"
                >
                  Sign In
                </button>
              ) : (
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center gap-3 px-3 py-3 mb-2 bg-slate-50 rounded-xl border border-slate-100">
                    <img src={user?.imageUrl} alt="User" className="w-10 h-10 rounded-full border border-slate-200" />
                    <div className="overflow-hidden">
                      <p className="text-sm font-semibold text-slate-800 truncate">{user?.fullName}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.primaryEmailAddress?.emailAddress}</p>
                    </div>
                  </div>

                  <button onClick={() => { openUserProfile(); setIsMobileMenuOpen(false); }} className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-medium">
                    <Settings size={18} className="text-slate-500" /> Manage Account
                  </button>

                  {showAdminBtn && (
                    <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-medium">
                      <ShieldCheck size={18} className="text-slate-500" /> Admin Dashboard
                    </Link>
                  )}

                  {showSellerBtn && (
                    <Link href="/store" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-medium">
                      <Store size={18} className="text-slate-500" /> Store Dashboard
                    </Link>
                  )}

                  {/* ✅ NEW: Rider Dashboard Link (Mobile) */}
                  {(showAdminBtn || showRiderBtn) && (
                    <Link href="/rider/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-medium">
                      <Truck size={18} className="text-slate-500" /> Rider Dashboard
                    </Link>
                  )}

                  <Link href="/wallet" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-medium">
                    <Wallet size={18} className="text-slate-500" /> My Wallet
                  </Link>

                  <Link href="/my-coupons" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-medium">
                    <Ticket size={18} className="text-slate-500" /> My Coupons
                  </Link>

                  <Link href="/goal-history" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-medium">
                    <History size={18} className="text-slate-500" /> Goal History
                  </Link>

                  <button onClick={() => signOut({ redirectUrl: '/' })} className="flex items-center gap-3 px-3 py-2.5 mt-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium">
                    <LogOut size={18} className="text-red-500" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ✅ NOTIFICATION VIEW MODAL */}
      {selectedNotif && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50 shrink-0">
              <div className="flex items-center gap-2 text-slate-800">
                  <Bell className="text-blue-600" size={20} />
                  <h3 className="font-bold text-lg">Notification</h3>
              </div>
              <button onClick={() => setSelectedNotif(null)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"><X size={20} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <h4 className="font-bold text-xl text-gray-900 mb-2">{selectedNotif.title}</h4>
              <p className="text-sm font-medium text-gray-400 mb-6 border-b border-gray-100 pb-4">
                  {new Date(selectedNotif.createdAt).toLocaleDateString('en-GB')} at {new Date(selectedNotif.createdAt).toLocaleTimeString()}
              </p>
              
              <div className="text-gray-700 leading-relaxed text-sm whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: selectedNotif.html || selectedNotif.message }}>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3 shrink-0">
              <button 
                onClick={() => { deleteNotification(selectedNotif.id, { stopPropagation: () => {} }); setSelectedNotif(null); }} 
                className="flex-1 py-3 bg-white border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition flex items-center justify-center gap-2"
              >
                <Trash2 size={18} /> Delete
              </button>
              <button 
                onClick={() => setSelectedNotif(null)} 
                className="flex-[2] py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;