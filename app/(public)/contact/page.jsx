'use client'

import { Mail, Phone, MapPin } from 'lucide-react'

const Contact = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-slate-50/50">
      
      {/* CONTENT WRAPPER */}
      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        <h1 className="text-4xl font-extrabold text-slate-800 mb-12 text-center">
          Contact Us
        </h1>

        {/* RESPONSIVE GRID LAYOUT */}
        {/* - grid-cols-1: Mobile phones get a single vertical stack. */}
        {/* - md:grid-cols-3: Tablets and desktops see 3 side-by-side columns. */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* ================= CARD 1: EMAIL ================= */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center hover:shadow-md transition-all duration-300 group">
            
            {/* ICON CONTAINER */}
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6 group-hover:bg-blue-100 transition-colors">
              <Mail className="text-blue-600" size={32} />
            </div>
            
            <h3 className="text-lg font-bold text-slate-800 mb-2">Email Support</h3>
            <p className="text-slate-500 text-sm mb-1">Our friendly team is here to help.</p>
            <p className="text-blue-600 font-medium">contact@dreamsaver.com</p>
          </div>

          {/* ================= CARD 2: PHONE ================= */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center hover:shadow-md transition-all duration-300 group">
            {/* Emerald Theme */}
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-6 group-hover:bg-emerald-100 transition-colors">
              <Phone className="text-emerald-600" size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Phone</h3>
            <p className="text-slate-500 text-sm mb-1">Mon-Fri from 8am to 5pm.</p>
            <p className="text-emerald-600 font-medium">+92 301 4677899</p>
          </div>

          {/* ================= CARD 3: ADDRESS ================= */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center hover:shadow-md transition-all duration-300 group">
            {/* Purple Theme */}
            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-6 group-hover:bg-purple-100 transition-colors">
              <MapPin className="text-purple-600" size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Office</h3>
            <p className="text-slate-500 text-sm mb-1">Come say hello at our office HQ.</p>
            <p className="text-purple-600 font-medium">ABC Street, 94102, Karachi, Pakistan</p>
          </div>

        </div>
      </div>
    </div>
  )
}

export default Contact