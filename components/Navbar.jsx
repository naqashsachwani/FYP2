'use client'; // Client-side component for Next.js

import { PackageIcon, Search, ShoppingCart, Menu, X } from "lucide-react"; // Icons
import Link from "next/link"; // Next.js Link component for navigation
import { useRouter } from "next/navigation"; // Router for programmatic navigation
import { useState } from "react"; // React state hook
// REMOVED: import { useSelector } from "react-redux"; 
import { useUser, useClerk, UserButton, Protect } from "@clerk/nextjs"; // Clerk auth components

const Navbar = () => {
  const { user } = useUser(); // Get authenticated user
  const { openSignIn } = useClerk(); // Function to open SignIn modal
  const router = useRouter(); // Next.js router
  const [search, setSearch] = useState(""); // Search input state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Mobile menu state
  
  // REMOVED: const cartCount = useSelector((state) => state.cart.total);

  // Handle search submission
  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/shop?search=${encodeURIComponent(search)}`); // Navigate to search page
      setSearch(""); // Clear input
    }
  };

  // Navbar links
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

          {/* ---------------- Logo ---------------- */}
          <Link href="/" className="flex items-center gap-1 relative group">
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-800 group-hover:text-green-600 transition-colors">
              <span className="text-green-600">Dream</span>Saver
            </h1>
            <span className="text-green-600 text-4xl lg:text-5xl absolute -top-1 -right-3">.</span>
          </Link>

          {/* ---------------- Desktop Navigation ---------------- */}
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

          {/* ---------------- Desktop Search ---------------- */}
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

          {/* ---------------- Actions ---------------- */}
          <div className="flex items-center gap-3 lg:gap-6">

            {/* Cart / My Goals */}
            <Link
              href="/cart"
              className="relative flex items-center gap-2 text-slate-600 hover:text-green-600 transition p-2 rounded-xl hover:bg-green-50 shadow-sm hover:shadow-md"
            >
              <ShoppingCart size={20} />
              <span className="hidden sm:block text-sm font-medium">My Goals</span>
              
              {/* REMOVED: Cart count badge code block was here */}
              
            </Link>

            {/* Sign In / User Button */}
            {!user ? (
              <button
                onClick={openSignIn}
                className="hidden sm:flex items-center px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl shadow-md hover:scale-105 transition-all duration-200 active:scale-95"
              >
                Sign In
              </button>
            ) : (
              <div className="hidden sm:block">
                <UserButton />
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition shadow-sm hover:shadow-md"
            >
              {isMobileMenuOpen ? (
                <X size={24} className="text-slate-600" />
              ) : (
                <Menu size={24} className="text-slate-600" />
              )}
            </button>
          </div>
        </div>

        {/* ---------------- Mobile Search ---------------- */}
        <div className="lg:hidden pb-3">
          <form
            onSubmit={handleSearch}
            className="flex items-center gap-3 bg-slate-100 px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-green-400"
          >
            <Search size={18} className="text-slate-500" />
            <input
              className="w-full bg-transparent outline-none placeholder-slate-500 text-slate-700"
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
        </div>
      </div>

      {/* ---------------- Mobile Menu ---------------- */}
      <div
        className={`lg:hidden bg-white border-t border-slate-200 shadow-md transition-all duration-300 overflow-hidden ${
          isMobileMenuOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-5 py-4 space-y-3">
          {/* Mobile nav links */}
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

          {/* Auth Section (Mobile) */}
          <div className="pt-4 border-t border-slate-200">
            {!user ? (
              <button
                onClick={() => {
                  openSignIn();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold shadow-md hover:scale-105 transition"
              >
                Sign In
              </button>
            ) : (
              <div className="flex items-center justify-between py-3 px-2">
                <span className="text-slate-700 font-medium">Account</span>
                <UserButton />
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;