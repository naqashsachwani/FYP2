'use client'

import { useEffect, useState } from "react"
import { format } from "date-fns" 
import toast from "react-hot-toast" 
import { Loader2, Trash2 } from "lucide-react" 
import { useAuth } from "@clerk/nextjs" 
import axios from "axios" 

export default function AdminCoupons() {
  // --- Authentication context ---
  const { getToken } = useAuth()
  
  // --- Local State Management ---
  const [coupons, setCoupons] = useState([]) // Stores the list of existing coupons
  const [isSubmitting, setIsSubmitting] = useState(false) // Tracks form submission status

  // Initial state for the creation form
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    description: '',
    discount: '',
    usageLimit: 1, // Default limit of 1 use per user
    forNewUser: false,
    forMember: false,
    isPublic: false,
    expiresAt: new Date()
  })

  // --- API: Fetching Data ---
  // Retrieves the current list of coupons from the backend
  const fetchCoupons = async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get('/api/admin/coupon', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setCoupons(data.coupons)
    } catch (error) {
      // Handles backend-specific errors or generic network failures
      toast.error(error?.response?.data?.error || error.message)
    }
  }

  // --- API: Adding Data ---
  // Handles the submission of the "Add Coupon" form
  const handleAddCoupon = async (e) => {
    e.preventDefault() // Prevents page reload
    if (isSubmitting) return; // Prevents double-submission
    setIsSubmitting(true)

    try {
      const token = await getToken()
      
      // Preparation: Sanitize and parse data types before sending to the server
      const couponToSend = { 
        ...newCoupon, 
        discount: Number(newCoupon.discount), 
        usageLimit: Number(newCoupon.usageLimit),
        expiresAt: new Date(newCoupon.expiresAt) 
      }

      const { data } = await axios.post('/api/admin/coupon', { coupon: couponToSend }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      toast.success(data.message)
      // Reset form to default values upon success
      setNewCoupon({ code: '', description: '', discount: '', usageLimit: 1, forNewUser: false, forMember: false, isPublic: false, expiresAt: new Date() })
      await fetchCoupons() // Refresh the table list
    } catch (error) {
      toast.error(error?.response?.data?.error || error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Synchronizes input field changes with the local 'newCoupon' state
  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'code') {
        // Enforce uppercase codes for consistency (standard e-commerce practice)
        setNewCoupon({ ...newCoupon, [name]: value.toUpperCase() })
    } else {
        setNewCoupon({ ...newCoupon, [name]: value })
    }
  }

  // --- API: Deleting Data ---
  // Removes a coupon using its unique code
  const deleteCoupon = async (code) => {
    if (!window.confirm("Are you sure you want to delete this coupon?")) return
    
    // Optimistic UI update: remove from view immediately
    const previousCoupons = [...coupons]
    setCoupons(coupons.filter(c => c.code !== code))

    try {
      const token = await getToken()
      await axios.delete(`/api/admin/coupon?code=${code}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success("Coupon deleted successfully")
    } catch (error) {
      // Rollback if the server request fails
      setCoupons(previousCoupons)
      toast.error(error?.response?.data?.error || error.message)
    }
  }

  // Initial load on component mount
  useEffect(() => {
    fetchCoupons()
  }, [])

  // --- Main Render Logic ---
  return (
    <div className="min-h-[100dvh] bg-gray-50 p-4 sm:p-6 md:p-12 text-gray-700">
      <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
        
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            DreamSaver <span className="text-indigo-600">Admin Panel</span>
          </h1>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm">Manage promotional and discount codes.</p>
        </div>

        {/* SECTION: Creation Form */}
        <form onSubmit={handleAddCoupon} className="bg-white shadow-sm rounded-2xl p-5 sm:p-6 md:p-8 border border-gray-100">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-800">Add <span className="text-indigo-600">Coupon</span></h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {/* Input: Coupon ID/Code */}
            <input type="text" placeholder="Coupon Code" 
              className="p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none uppercase text-sm sm:text-base transition-shadow"
              name="code" value={newCoupon.code} onChange={handleChange} required />

            {/* Input: Percentage Off */}
            <input type="number" placeholder="Discount (%)" min={1} max={100} 
              className="p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm sm:text-base transition-shadow"
              name="discount" value={newCoupon.discount} onChange={handleChange} required />
              
            {/* Input: Redemption cap per user */}
            <input type="number" placeholder="Usage Limit (Per User)" min={1} 
              className="p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm sm:text-base transition-shadow"
              name="usageLimit" value={newCoupon.usageLimit} onChange={handleChange} required />
          </div>

          <input type="text" placeholder="Description" 
            className="w-full mt-3 sm:mt-4 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm sm:text-base transition-shadow"
            name="description" value={newCoupon.description} onChange={handleChange} required />

          <label className="block mt-3 sm:mt-4">
            <span className="text-gray-700 font-bold text-xs sm:text-sm uppercase tracking-wider mb-1 block">Expiry Date</span>
            <input type="date" className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm sm:text-base transition-shadow bg-white"
              name="expiresAt" value={format(newCoupon.expiresAt, 'yyyy-MM-dd')} onChange={(e) => setNewCoupon({...newCoupon, expiresAt: new Date(e.target.value)})} />
          </label>

          {/* Targeted constraints */}
          <div className="flex flex-col sm:flex-row sm:gap-6 mt-4 sm:mt-5 space-y-2 sm:space-y-0">
            <label className="flex items-center gap-2.5 cursor-pointer text-sm font-medium text-slate-700">
              <input type="checkbox" name="forNewUser" checked={newCoupon.forNewUser} 
                onChange={(e) => setNewCoupon({ ...newCoupon, forNewUser: e.target.checked })}
                className="w-4 h-4 sm:w-5 sm:h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
              For New User Only
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer text-sm font-medium text-slate-700">
              <input type="checkbox" name="isPublic" checked={newCoupon.isPublic} 
                onChange={(e) => setNewCoupon({ ...newCoupon, isPublic: e.target.checked })}
                className="w-4 h-4 sm:w-5 sm:h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
              Make Public
            </label>
          </div>

          <button 
            type="submit" disabled={isSubmitting}
            className={`mt-6 w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2 text-sm sm:text-base
              ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-indigo-700 active:scale-95'}
            `}
          >
            {isSubmitting ? <><Loader2 className="animate-spin shrink-0" size={18} /> Adding...</> : "Add Coupon"}
          </button>
        </form>

        {/* SECTION: Ledger/Table View */}
        <div className="bg-white shadow-sm rounded-2xl border border-gray-100 flex flex-col overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Active <span className="text-indigo-600">Coupons</span></h2>
          </div>
          
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm text-left min-w-[600px]">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[9px] sm:text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 sm:py-4 px-4 sm:px-6 whitespace-nowrap">Code</th>
                  <th className="py-3 sm:py-4 px-4 sm:px-6 whitespace-nowrap">Discount</th>
                  <th className="py-3 sm:py-4 px-4 sm:px-6 whitespace-nowrap">Limit</th>
                  <th className="py-3 sm:py-4 px-4 sm:px-6 whitespace-nowrap">Expires</th>
                  <th className="py-3 sm:py-4 px-4 sm:px-6 whitespace-nowrap">Type</th>
                  <th className="py-3 sm:py-4 px-4 sm:px-6 whitespace-nowrap text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coupons.length === 0 ? (
                    <tr><td colSpan="6" className="px-4 sm:px-6 py-12 text-center text-slate-400 text-sm">No coupons created yet.</td></tr>
                ) : coupons.map((coupon) => (
                  <tr key={coupon.code} className="hover:bg-slate-50 transition-colors group">
                    <td className="py-3 sm:py-4 px-4 sm:px-6 font-mono font-bold text-indigo-600 whitespace-nowrap">{coupon.code}</td>
                    <td className="py-3 sm:py-4 px-4 sm:px-6 font-bold text-slate-800 whitespace-nowrap">{coupon.discount}%</td>
                    <td className="py-3 sm:py-4 px-4 sm:px-6 text-slate-600 whitespace-nowrap">{coupon.usageLimit}x</td>
                    <td className="py-3 sm:py-4 px-4 sm:px-6 text-slate-500 whitespace-nowrap text-xs sm:text-sm">{format(new Date(coupon.expiresAt), 'MMM dd, yyyy')}</td>
                    <td className="py-3 sm:py-4 px-4 sm:px-6 whitespace-nowrap">
                      {coupon.forNewUser ? 
                        <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-bold uppercase tracking-wide border border-blue-200">New User</span> : 
                        <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-bold uppercase tracking-wide border border-slate-200">Standard</span>
                      }
                    </td>
                    <td className="py-3 sm:py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                      <button 
                          onClick={() => deleteCoupon(coupon.code)} 
                          className="p-1.5 sm:p-2 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors" title="Delete Coupon"
                      >
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 transition-colors" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}