'use client'

import { Mail, Phone, MapPin } from 'lucide-react'

const Contact = () => {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50/50 py-10 sm:py-16">
      
      {/* CONTENT WRAPPER */}
      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 mb-8 sm:mb-12 text-center tracking-tight">
          Contact Us
        </h1>

        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
          
          {/* ================= CARD 1: EMAIL ================= */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center hover:shadow-md transition-all duration-300 group">
            
            {/* ICON CONTAINER */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-50 rounded-full flex items-center justify-center mb-5 sm:mb-6 group-hover:bg-blue-100 transition-colors shadow-sm">
              <Mail className="text-blue-600 w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            
            <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-1.5 sm:mb-2">Email Support</h3>
            <p className="text-slate-500 text-xs sm:text-sm mb-1.5 sm:mb-2 px-2">Our friendly team is here to help.</p>
            <p className="text-blue-600 font-bold text-sm sm:text-base break-words w-full">contact@dreamsaver.com</p>
          </div>

          {/* ================= CARD 2: PHONE ================= */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center hover:shadow-md transition-all duration-300 group">
            {/* Emerald Theme */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-5 sm:mb-6 group-hover:bg-emerald-100 transition-colors shadow-sm">
              <Phone className="text-emerald-600 w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-1.5 sm:mb-2">Phone</h3>
            <p className="text-slate-500 text-xs sm:text-sm mb-1.5 sm:mb-2 px-2">Mon-Fri from 8am to 5pm.</p>
            <p className="text-emerald-600 font-bold text-sm sm:text-base break-words w-full">+92 301 4677899</p>
          </div>

          {/* ================= CARD 3: ADDRESS ================= */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center text-center hover:shadow-md transition-all duration-300 group sm:col-span-2 md:col-span-1">
            {/* Purple Theme */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-purple-50 rounded-full flex items-center justify-center mb-5 sm:mb-6 group-hover:bg-purple-100 transition-colors shadow-sm">
              <MapPin className="text-purple-600 w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-1.5 sm:mb-2">Office</h3>
            <p className="text-slate-500 text-xs sm:text-sm mb-1.5 sm:mb-2 px-2">Come say hello at our office HQ.</p>
            <p className="text-purple-600 font-bold text-sm sm:text-base break-words w-full px-2">ABC Street, 94102, Karachi, Pakistan</p>
          </div>

        </div>
      </div>
    </div>
  )
}

export default Contact