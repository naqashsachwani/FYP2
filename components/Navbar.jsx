'use client';

import { Search, ShoppingCart, Menu, X, History, ShieldCheck, Store, Settings, LogOut, Ticket, Wallet, Bell } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";

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
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch roles (once) and notifications (polling)
  useEffect(() => {
    let intervalId;

    const checkRoles = async () => {
      try {
        const adminRes = await fetch('/api/admin/is-admin');
        const adminData = await adminRes.json();
        setShowAdminBtn(adminData.isAdmin === true);

        const sellerRes = await fetch('/api/store/is-seller');
        const sellerData = await sellerRes.json();
        setShowSellerBtn(!!sellerData.isSeller);
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
      checkRoles(); // Only needs to be checked once when the component mounts
      fetchNotifications(); // Initial fetch immediately

      // ✅ AUTO-REFRESH: Poll every 30 seconds (30000ms)
      intervalId = setInterval(fetchNotifications, 30000);
    }

    // Cleanup interval when component unmounts or user logs out
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [mounted, user]);

  const markAsRead = async (id) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      // Update local state immediately for snappy UI
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
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
          <div className="flex items-center gap-2 lg:gap-4">
            
            <Link
              href="/cart"
              className="relative flex items-center gap-2 text-slate-600 hover:text-green-600 transition p-2 rounded-xl hover:bg-green-50 shadow-sm hover:shadow-md"
            >
              <ShoppingCart size={20} />
              <span className="hidden sm:block text-sm font-medium">My Goals</span>
            </Link>

            {/* ✅ NOTIFICATION BELL (DESKTOP & MOBILE) */}
            {mounted && user && (
              <div className="relative">
                <button
                  onClick={() => { setIsBellOpen(!isBellOpen); setIsProfileOpen(false); }}
                  className="relative p-2 text-slate-600 hover:text-green-600 transition rounded-xl hover:bg-green-50 shadow-sm hover:shadow-md"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {isBellOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsBellOpen(false)}></div>
                    <div className="absolute right-[-60px] sm:right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <p className="text-sm font-semibold text-slate-800">Notifications</p>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <p className="px-4 py-6 text-sm text-slate-500 text-center">You have no notifications.</p>
                        ) : (
                          notifications.map(notif => (
                            <div key={notif.id} className={`px-4 py-3 border-b border-slate-50 ${!notif.isRead ? 'bg-green-50/40' : ''}`}>
                              <div className="flex justify-between items-start mb-1">
                                <p className="text-sm font-semibold text-slate-800">{notif.title}</p>
                                {!notif.isRead && (
                                  <button onClick={() => markAsRead(notif.id)} className="text-[10px] text-green-600 font-medium hover:underline shrink-0 ml-2">
                                    Mark Read
                                  </button>
                                )}
                              </div>
                              <p className="text-xs text-slate-600 line-clamp-2">{notif.message}</p>
                              <span className="text-[10px] text-slate-400 block mt-1">
                                {new Date(notif.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
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
  );
};

export default Navbar;