'use client'; 

import { Search, ShoppingCart, Menu, X, History, ShieldCheck, Store } from "lucide-react"; 
import Link from "next/link"; 
import { useRouter } from "next/navigation"; 
import { useState, useEffect } from "react"; 
// --- NEW: Added SignedIn and SignedOut components ---
import { useUser, useClerk, UserButton, SignedIn, SignedOut } from "@clerk/nextjs"; 

const Navbar = () => {
  const { user } = useUser(); 
  const { openSignIn } = useClerk(); 
  const router = useRouter(); 
  const [search, setSearch] = useState(""); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 

  // State for role-based dashboard buttons
  const [showAdminBtn, setShowAdminBtn] = useState(false);
  const [showSellerBtn, setShowSellerBtn] = useState(false);

  // Fetch roles from custom API routes
  useEffect(() => {
    const checkRoles = async () => {
      if (user) {
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
      }
    };

    checkRoles();
  }, [user]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/shop?search=${encodeURIComponent(search)}`); 
      setSearch(""); 
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
          <div className="flex items-center gap-3 lg:gap-6">
            <Link
              href="/cart"
              className="relative flex items-center gap-2 text-slate-600 hover:text-green-600 transition p-2 rounded-xl hover:bg-green-50 shadow-sm hover:shadow-md"
            >
              <ShoppingCart size={20} />
              <span className="hidden sm:block text-sm font-medium">My Goals</span>
            </Link>

            {/* --- FIXED: Clerk handles the Hydration perfectly here --- */}
            <SignedOut>
              <button
                onClick={openSignIn}
                className="hidden sm:flex items-center px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl shadow-md hover:scale-105 transition-all duration-200 active:scale-95"
              >
                Sign In
              </button>
            </SignedOut>

            <SignedIn>
              <div className="hidden sm:block">
                <UserButton>
                  <UserButton.MenuItems>
                    {showAdminBtn && (
                      <UserButton.Link
                        label="Admin Dashboard"
                        labelIcon={<ShieldCheck size={15} />}
                        href="/admin"
                      />
                    )}
                    {showSellerBtn && (
                      <UserButton.Link
                        label="Store Dashboard"
                        labelIcon={<Store size={15} />}
                        href="/store"
                      />
                    )}
                    <UserButton.Link
                      label="Goal History"
                      labelIcon={<History size={15} />}
                      href="/goal-history"
                    />
                  </UserButton.MenuItems>
                </UserButton>
              </div>
            </SignedIn>

            {/* Mobile Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition shadow-sm hover:shadow-md"
            >
              {isMobileMenuOpen ? <X size={24} className="text-slate-600" /> : <Menu size={24} className="text-slate-600" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden bg-white border-t border-slate-200 shadow-md transition-all duration-300 overflow-hidden ${
          isMobileMenuOpen ? "max-h-[450px] opacity-100" : "max-h-0 opacity-0"
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
            {/* Mobile Actions Using Clerk Components */}
            <SignedOut>
              <button
                onClick={() => {
                  openSignIn();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold shadow-md hover:scale-105 transition"
              >
                Sign In
              </button>
            </SignedOut>

            <SignedIn>
              <div className="flex items-center justify-between py-3 px-2">
                <span className="text-slate-700 font-medium">Account Settings</span>
                <UserButton>
                  <UserButton.MenuItems>
                    {showAdminBtn && (
                      <UserButton.Link
                        label="Admin Dashboard"
                        labelIcon={<ShieldCheck size={15} />}
                        href="/admin"
                      />
                    )}
                    {showSellerBtn && (
                      <UserButton.Link
                        label="Store Dashboard"
                        labelIcon={<Store size={15} />}
                        href="/store"
                      />
                    )}
                    <UserButton.Link
                      label="Goal History"
                      labelIcon={<History size={15} />}
                      href="/goal-history"
                    />
                  </UserButton.MenuItems>
                </UserButton>
              </div>
            </SignedIn>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;