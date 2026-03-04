'use client'

import { useEffect, useState } from "react"
import { format } from "date-fns"
import toast from "react-hot-toast"
import { Loader2, Trash2 } from "lucide-react" 
import { useAuth } from "@clerk/nextjs"
import axios from "axios"

export default function AdminCoupons() {
  const { getToken } = useAuth()
  const [coupons, setCoupons] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [newCoupon, setNewCoupon] = useState({
    code: '',
    description: '',
    discount: '',
    usageLimit: 1, // NEW: Added Usage Limit state
    forNewUser: false,
    forMember: false,
    isPublic: false,
    expiresAt: new Date()
  })

  const fetchCoupons = async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get('/api/admin/coupon', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setCoupons(data.coupons)
    } catch (error) {
      toast.error(error?.response?.data?.error || error.message)
    }
  }

  const handleAddCoupon = async (e) => {
    e.preventDefault()
    if (isSubmitting) return;
    setIsSubmitting(true)

    try {
      const token = await getToken()
      
      const couponToSend = { 
        ...newCoupon, 
        discount: Number(newCoupon.discount), 
        usageLimit: Number(newCoupon.usageLimit), // NEW: Parse limit to number
        expiresAt: new Date(newCoupon.expiresAt) 
      }

      const { data } = await axios.post('/api/admin/coupon', { coupon: couponToSend }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      toast.success(data.message)
      setNewCoupon({ code: '', description: '', discount: '', usageLimit: 1, forNewUser: false, forMember: false, isPublic: false, expiresAt: new Date() })
      await fetchCoupons()
    } catch (error) {
      toast.error(error?.response?.data?.error || error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'code') {
        setNewCoupon({ ...newCoupon, [name]: value.toUpperCase() })
    } else {
        setNewCoupon({ ...newCoupon, [name]: value })
    }
  }

  const deleteCoupon = async (code) => {
    if (!window.confirm("Are you sure you want to delete this coupon?")) return
    const previousCoupons = [...coupons]
    setCoupons(coupons.filter(c => c.code !== code))

    try {
      const token = await getToken()
      await axios.delete(`/api/admin/coupon?code=${code}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success("Coupon deleted successfully")
    } catch (error) {
      setCoupons(previousCoupons)
      toast.error(error?.response?.data?.error || error.message)
    }
  }

  useEffect(() => {
    fetchCoupons()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12 text-gray-700">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">DreamSaver <span className="text-indigo-600">Admin Panel</span></h1>

        {/* Add Coupon Form */}
        <form onSubmit={handleAddCoupon} className="bg-white shadow-md rounded-xl p-6 md:p-8 mb-10 border border-gray-100">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Add <span className="text-indigo-600">Coupon</span></h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input type="text" placeholder="Coupon Code" 
              className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none uppercase"
              name="code" value={newCoupon.code} onChange={handleChange} required />

            <input type="number" placeholder="Discount (%)" min={1} max={100} 
              className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              name="discount" value={newCoupon.discount} onChange={handleChange} required />
              
            {/* NEW: Usage Limit Input */}
            <input type="number" placeholder="Usage Limit (Per User)" min={1} 
              className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              name="usageLimit" value={newCoupon.usageLimit} onChange={handleChange} required />
          </div>

          <input type="text" placeholder="Description" 
            className="w-full mt-4 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            name="description" value={newCoupon.description} onChange={handleChange} required />

          <label className="block mt-4">
            <span className="text-gray-700 font-medium">Expiry Date</span>
            <input type="date" className="w-full mt-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              name="expiresAt" value={format(newCoupon.expiresAt, 'yyyy-MM-dd')} onChange={(e) => setNewCoupon({...newCoupon, expiresAt: new Date(e.target.value)})} />
          </label>

          <div className="flex flex-col md:flex-row md:gap-6 mt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="forNewUser" checked={newCoupon.forNewUser} 
                onChange={(e) => setNewCoupon({ ...newCoupon, forNewUser: e.target.checked })}
                className="w-4 h-4 accent-indigo-600" />
              For New User Only
            </label>
            <label className="flex items-center gap-2 mt-2 md:mt-0 cursor-pointer">
              <input type="checkbox" name="isPublic" checked={newCoupon.isPublic} 
                onChange={(e) => setNewCoupon({ ...newCoupon, isPublic: e.target.checked })}
                className="w-4 h-4 accent-indigo-600" />
              Make Public
            </label>
          </div>

          <button 
            type="submit" disabled={isSubmitting}
            className={`mt-6 w-full md:w-auto px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold shadow-md transition-all flex items-center justify-center gap-2
              ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-indigo-700 active:scale-95'}
            `}
          >
            {isSubmitting ? <><Loader2 className="animate-spin" size={20} /> Adding...</> : "Add Coupon"}
          </button>
        </form>

        {/* List Coupons Table */}
        <div className="bg-white shadow-md rounded-xl p-6 md:p-8 overflow-x-auto border border-gray-100">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">List <span className="text-indigo-600">Coupons</span></h2>
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 rounded-t-xl">
              <tr>
                <th className="py-3 px-4 text-left font-medium text-gray-600">Code</th>
                <th className="py-3 px-4 text-left font-medium text-gray-600">Discount</th>
                <th className="py-3 px-4 text-left font-medium text-gray-600">Limit</th>
                <th className="py-3 px-4 text-left font-medium text-gray-600">Expires</th>
                <th className="py-3 px-4 text-left font-medium text-gray-600">Type</th>
                <th className="py-3 px-4 text-left font-medium text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon.code} className="border-b hover:bg-gray-50 transition group">
                  <td className="py-3 px-4 font-mono font-medium text-indigo-600">{coupon.code}</td>
                  <td className="py-3 px-4 font-bold">{coupon.discount}%</td>
                  <td className="py-3 px-4">{coupon.usageLimit}x</td>
                  <td className="py-3 px-4 text-gray-500">{format(new Date(coupon.expiresAt), 'MMM dd, yyyy')}</td>
                  <td className="py-3 px-4">
                    {coupon.forNewUser ? <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">New User</span> : <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">Standard</span>}
                  </td>
                  <td className="py-3 px-4">
                    <button 
                        onClick={() => deleteCoupon(coupon.code)} 
                        className="p-2 hover:bg-red-50 rounded-full transition-colors" title="Delete Coupon"
                    >
                        <Trash2 className="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}