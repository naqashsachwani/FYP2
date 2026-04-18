'use client' // Client component (required for interactivity)

import Link from "next/link"
import { MapPin, Phone, Mail, ArrowRight, Heart, ShieldCheck } from "lucide-react"

// Footer Component
const Footer = () => {

  /* ===================== SOCIAL ICON SVGs ===================== */
  /* Custom SVG icons are used instead of lucide icons
     to allow fine control over hover animations and styling */

  const FacebookIcon = () => (
    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"
      className="group-hover:scale-110 transition-transform duration-200">
      <path d="M22 12a10 10 0 1 0-11.5 9.9v-7H8v-3h2.5V9.5a3.5 3.5 0 0 1 3.8-3.9h2.7v3h-1.8a1.1 1.1 0 0 0-1.2 1.2V12H17l-.5 3h-2.7v7A10 10 0 0 0 22 12z" />
    </svg>
  )

  const InstagramIcon = () => (
    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"
      className="group-hover:scale-110 transition-transform duration-200">
      <path d="M7 2C4.2 2 2 4.2 2 7v10c0 2.8 2.2 5 5 5h10c2.8 0 5-2.2 5-5V7c0-2.8-2.2-5-5-5H7zm10 2a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h10zm-5 3.5A4.5 4.5 0 1 0 16.5 12 4.5 4.5 0 0 0 12 7.5z" />
    </svg>
  )

  // ✅ FIXED: Updated with standard 24x24 Twitter/X bird path so it renders correctly
  const TwitterIcon = () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"
      className="group-hover:scale-110 transition-transform duration-200 fill-current border-none">
      <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
    </svg>
  )

  const LinkedinIcon = () => (
    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"
      className="group-hover:scale-110 transition-transform duration-200">
      <path d="M19 3A2 2 0 0 1 21 5v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14z" />
    </svg>
  )

  /* ===================== FOOTER LINK SECTIONS ===================== */
  const linkSections = [
    {
      title: "WEBSITE",
      links: [
        { text: "Home", path: "/" },
        { text: "Support & Complaints", path: "/complaints" }, 
      ],
    },
    {
      title: "CONTACT",
      links: [
        { text: "+92-301-467-7899", path: "/", icon: Phone },
        { text: "contact@dreamsaver.com", path: "/", icon: Mail },
        { text: "ABC Street, Karachi", path: "/", icon: MapPin },
      ],
    },
  ]

  /* ===================== SOCIAL MEDIA ICONS ===================== */
  const socialIcons = [
    { icon: FacebookIcon, link: "https://www.facebook.com", name: "Facebook" },
    { icon: InstagramIcon, link: "https://www.instagram.com", name: "Instagram" },
    { icon: TwitterIcon, link: "https://twitter.com", name: "Twitter" },
    { icon: LinkedinIcon, link: "https://www.linkedin.com", name: "LinkedIn" },
  ]

  return (
    <footer className="bg-gradient-to-b from-slate-50 to-white border-t border-slate-200 mt-20">

      {/* Decorative top gradient line */}
      <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-green-500 w-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ===================== MAIN FOOTER CONTENT ===================== */}
        <div className="py-12 lg:py-16 flex flex-col lg:flex-row gap-10 lg:gap-16">

          {/* ================= BRAND + TRUST BADGE ================= */}
          <div className="flex-1 max-w-md">

            {/* Brand Logo */}
            <Link href="/" className="inline-flex text-3xl lg:text-4xl font-bold text-slate-800 hover:scale-105 transition">
              <span className="text-green-600">Dream</span>Saver
              <span className="text-green-600 text-4xl lg:text-5xl">.</span>
            </Link>

            {/* Brand Description */}
            <p className="mt-4 text-slate-600 text-sm lg:text-base">
              Welcome to DreamSaver, where your goals become reality.
            </p>

            {/* ✅ REPLACED: Trust & Security Badge instead of Newsletter */}
            <div className="mt-6 p-4 bg-green-50 rounded-2xl border border-green-100 flex items-start gap-3 transition-all hover:shadow-md">
              <div className="p-2 bg-green-100 rounded-lg shrink-0">
                <ShieldCheck className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Secure Layaway Guarantee</p>
                <p className="text-xs text-slate-600 mt-1">
                  Your payments are safely held in escrow and only released to the store once your item is delivered.
                </p>
              </div>
            </div>

            {/* Social Media Links */}
            <div className="flex gap-3 mt-6">
              {socialIcons.map((item, i) => (
                <Link key={i} href={item.link} target="_blank" aria-label={item.name} className="group w-10 h-10 flex items-center justify-center rounded-xl shadow-md border hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-colors">
                  <item.icon />
                </Link>
              ))}
            </div>
          </div>

          {/* ================= FOOTER NAV LINKS ================= */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {linkSections.map((section, index) => (
              <div key={index}>
                <h3 className="font-bold mb-4 border-b-2 border-green-500/30 inline-block text-slate-800">
                  {section.title}
                </h3>
                <ul className="space-y-3">
                  {section.links.map((link, i) => (
                    <li key={i}>
                      <Link href={link.path} className="flex items-center gap-2 text-slate-600 hover:text-green-600 hover:translate-x-1 transition font-medium text-sm group">
                        {link.icon && <link.icon size={16} className="text-green-500" />}
                        {link.text}
                        <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-green-500" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* ================= FOOTER BOTTOM BAR ================= */}
        <div className="border-t py-6 flex flex-col sm:flex-row justify-between gap-4 text-sm text-slate-600">
          <span>© {new Date().getFullYear()} DreamSaver. All rights reserved.</span>
          <span className="flex items-center gap-1">
            Made with <Heart size={14} className="text-red-500 fill-red-500" /> for amazing shoppers
          </span>
        </div>

      </div>
    </footer>
  )
}

export default Footer