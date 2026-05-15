'use client'

import { useState, useEffect } from "react"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import toast from "react-hot-toast"
import { Search, Loader2, Target, ChevronLeft, ChevronRight, Package, User, X, Calendar, Wallet } from "lucide-react"
import Image from "next/image"

export default function StoreGoalsPage() {
  const { getToken } = useAuth()
  
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Search, Filter & Pagination States
  const [searchInput, setSearchInput] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalGoals, setTotalGoals] = useState(0)

  // Modal State
  const [selectedGoal, setSelectedGoal] = useState(null)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput)
      setPage(1) 
    }, 500)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Reset page when filter changes
  useEffect(() => {
    setPage(1)
  }, [statusFilter])

  // Fetch Data
  useEffect(() => {
    const fetchGoals = async () => {
      setLoading(true)
      try {
        const token = await getToken()
        const { data } = await axios.get(`/api/store/goals?page=${page}&limit=10&search=${debouncedSearch}&status=${statusFilter}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setGoals(data.goals)
        setTotalPages(data.pagination.totalPages)
        setTotalGoals(data.pagination.total)
      } catch (error) {
        toast.error("Failed to load goals data")
      } finally {
        setLoading(false)
      }
    }

    fetchGoals()
  }, [page, debouncedSearch, statusFilter, getToken])

  // Helper function for status badges
  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE': return <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] sm:text-xs font-bold border border-blue-200">Active</span>;
      case 'COMPLETED': return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] sm:text-xs font-bold border border-emerald-200">Completed</span>;
      case 'CANCELLED': return <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-[10px] sm:text-xs font-bold border border-red-200">Cancelled</span>;
      case 'REFUNDED': return <span className="px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full text-[10px] sm:text-xs font-bold border border-orange-200">Refunded</span>;
      default: return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-[10px] sm:text-xs font-bold border border-slate-200">{status}</span>;
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 relative px-4 sm:px-6 lg:px-8">
      
      {/* Header */}
      <div className="pt-4 sm:pt-0">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 flex items-center gap-3">
          <Target className="text-indigo-600 w-7 h-7 sm:w-8 sm:h-8 shrink-0" />
          Customer Goal Progress
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">
          Monitor layaway plans and payment progress for your products. Click any row to view details.
        </p>
      </div>

      {/* Toolbar: Search & Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />
          <input
            type="text"
            placeholder="Search by ID, Product, or Customer..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs sm:text-sm bg-slate-50 focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-48 px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs sm:text-sm font-bold bg-slate-50 focus:bg-white text-slate-700 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Goals</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REFUNDED">Refunded</option>
          </select>

          <div className="text-xs sm:text-sm font-bold text-slate-500 bg-slate-100 px-4 py-2.5 rounded-xl whitespace-nowrap w-full sm:w-auto text-center border border-slate-200">
            Total Records: <span className="text-slate-800">{totalGoals}</span>
          </div>
        </div>
      </div>

      {/* Data Container (Responsive Hybrid) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px] relative">
        
        {loading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin text-indigo-600" />
          </div>
        )}

        {/* ==========================================
            VIEW 1: DESKTOP TABLE (Hidden on Mobile)
            ========================================== */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-bold">Goal ID / Date</th>
                <th className="p-4 font-bold">Customer</th>
                <th className="p-4 font-bold">Product</th>
                <th className="p-4 font-bold w-64">Payment Progress</th>
                <th className="p-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {goals.length === 0 && !loading ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 mb-3">
                        <Target className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-slate-500 font-medium">No goals found matching your criteria.</p>
                  </td>
                </tr>
              ) : (
                goals.map((goal) => {
                  const target = parseFloat(goal.targetAmount)
                  const saved = parseFloat(goal.saved)
                  const percentage = Math.min(100, Math.round((saved / target) * 100))

                  return (
                    <tr 
                      key={goal.id} 
                      onClick={() => setSelectedGoal(goal)}
                      className="hover:bg-indigo-50/50 transition-colors cursor-pointer group"
                    >
                      <td className="p-4 align-top">
                        <div className="font-mono text-xs font-medium text-slate-800 group-hover:text-indigo-600 transition-colors">{goal.id}</div>
                        <div className="text-xs text-slate-400 mt-1">
                          {new Date(goal.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="p-4 align-top">
                        <div className="flex items-center gap-3">
                          {goal.user?.image ? (
                            <Image src={goal.user.image} alt={goal.user.name} width={32} height={32} className="rounded-full bg-slate-100 shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0"><User size={14} className="text-slate-400"/></div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-800 truncate">{goal.user?.name || 'Unknown'}</p>
                            <p className="text-xs text-slate-500 truncate">{goal.user?.email || 'N/A'}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 align-top">
                        <div className="flex items-center gap-3">
                          {goal.product?.images?.[0] ? (
                            <Image src={goal.product.images[0]} alt={goal.product.name} width={40} height={40} className="rounded-lg object-cover border border-slate-200 shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0"><Package size={16} className="text-slate-400"/></div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-800 line-clamp-2">{goal.product?.name || 'Deleted Product'}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 align-top">
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="font-bold text-indigo-600">Rs {saved.toLocaleString()}</span>
                          <span className="text-slate-500 font-medium">of Rs {target.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div 
                            className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </td>

                      <td className="p-4 align-top">
                        {getStatusBadge(goal.status)}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ==========================================
            VIEW 2: MOBILE STACKED CARDS (Hidden on Desktop)
            ========================================== */}
        <div className="md:hidden divide-y divide-slate-100">
          {goals.length === 0 && !loading ? (
             <div className="p-8 text-center">
                <Target className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 text-sm font-medium">No goals found.</p>
             </div>
          ) : (
            goals.map((goal) => {
              const target = parseFloat(goal.targetAmount)
              const saved = parseFloat(goal.saved)
              const percentage = Math.min(100, Math.round((saved / target) * 100))

              return (
                <div 
                  key={goal.id} 
                  onClick={() => setSelectedGoal(goal)}
                  className="p-4 space-y-4 hover:bg-indigo-50/30 transition-colors cursor-pointer active:bg-indigo-50"
                >
                  {/* Row 1: ID & Status */}
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-xs font-bold text-slate-800">{goal.id}</span>
                      <p className="text-[10px] text-slate-400 mt-0.5">{new Date(goal.createdAt).toLocaleDateString()}</p>
                    </div>
                    {getStatusBadge(goal.status)}
                  </div>

                  {/* Row 2: Product & Customer */}
                  <div className="grid grid-cols-2 gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <div className="min-w-0">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Product</p>
                       <p className="text-xs font-bold text-slate-800 truncate">{goal.product?.name || 'Deleted Product'}</p>
                    </div>
                    <div className="min-w-0 border-l border-slate-200 pl-3">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Customer</p>
                       <p className="text-xs font-bold text-slate-800 truncate">{goal.user?.name || 'Unknown'}</p>
                    </div>
                  </div>

                  {/* Row 3: Progress */}
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-bold text-indigo-600">Rs {saved.toLocaleString()}</span>
                      <span className="text-slate-500 font-medium">of Rs {target.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 sm:gap-4 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
          >
            <ChevronLeft size={20} className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          
          <span className="text-xs sm:text-sm font-bold text-slate-700 bg-white px-4 py-2 sm:py-2.5 rounded-xl border border-slate-200 shadow-sm">
            Page {page} of {totalPages}
          </span>
          
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
          >
            <ChevronRight size={20} className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      )}


      {/* ==========================================
          DETAILS MODAL OVERLAY (Responsive)
          ========================================== */}
      {selectedGoal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          
          <div className="bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start sm:items-center p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-800">Goal Details</h2>
                  <p className="text-[10px] sm:text-xs text-slate-500 font-mono mt-0.5">ID: {selectedGoal.id}</p>
                </div>
                <div>{getStatusBadge(selectedGoal.status)}</div>
              </div>
              <button 
                onClick={() => setSelectedGoal(null)}
                className="p-1.5 sm:p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
              >
                <X size={20} className="w-5 h-5 sm:w-6 sm:h-6"/>
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar space-y-5 sm:space-y-6">
              
              {/* Product Info */}
              <div>
                <h3 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 sm:mb-3">Product Information</h3>
                <div className="flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100 bg-slate-50">
                  {selectedGoal.product?.images?.[0] ? (
                    <Image src={selectedGoal.product.images[0]} alt="Product" width={60} height={60} className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl border border-slate-200 shrink-0 object-cover" />
                  ) : (
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-slate-200 flex items-center justify-center shrink-0"><Package className="text-slate-400 w-5 h-5 sm:w-6 sm:h-6"/></div>
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-sm sm:text-base text-slate-800 line-clamp-2">{selectedGoal.product?.name || "Product no longer exists"}</p>
                    <p className="text-xs sm:text-sm font-bold text-indigo-600 mt-1">Locked Price: Rs {parseFloat(selectedGoal.lockedPrice).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Financial Progress */}
              <div>
                <h3 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
                   <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Financial Status
                </h3>
                {/* Collapse to 1 column on very small mobile screens, 2 cols otherwise */}
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
                  <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100 bg-slate-50">
                    <p className="text-[10px] sm:text-xs text-slate-500 font-medium mb-1">Target Amount</p>
                    <p className="text-base sm:text-lg font-bold text-slate-800">Rs {parseFloat(selectedGoal.targetAmount).toLocaleString()}</p>
                  </div>
                  <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-indigo-100 bg-indigo-50/50">
                    <p className="text-[10px] sm:text-xs text-indigo-600/70 font-medium mb-1">Total Saved</p>
                    <p className="text-base sm:text-lg font-bold text-indigo-700">Rs {parseFloat(selectedGoal.saved).toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="mt-3 sm:mt-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100">
                  <div className="flex justify-between text-xs sm:text-sm mb-1.5 sm:mb-2">
                    <span className="font-medium text-slate-600">Completion</span>
                    <span className="font-bold text-slate-800">
                      {Math.min(100, Math.round((parseFloat(selectedGoal.saved) / parseFloat(selectedGoal.targetAmount)) * 100))}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 sm:h-3 overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-2.5 sm:h-3 rounded-full"
                      style={{ width: `${Math.min(100, Math.round((parseFloat(selectedGoal.saved) / parseFloat(selectedGoal.targetAmount)) * 100))}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div>
                <h3 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Customer Profile
                </h3>
                <div className="flex flex-row items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100 bg-slate-50">
                   {selectedGoal.user?.image ? (
                      <Image src={selectedGoal.user.image} alt="User" width={48} height={48} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-200 border border-slate-200 shrink-0" />
                    ) : (
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-200 flex items-center justify-center shrink-0"><User className="text-slate-400 w-5 h-5 sm:w-6 sm:h-6"/></div>
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-sm sm:text-base text-slate-800 truncate">{selectedGoal.user?.name || "Unknown User"}</p>
                      <p className="text-xs sm:text-sm text-slate-500 truncate">{selectedGoal.user?.email || "No Email Provided"}</p>
                    </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button 
                onClick={() => setSelectedGoal(null)}
                className="w-full sm:w-auto px-6 py-3 sm:py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors active:scale-95 shadow-sm"
              >
                Close Details
              </button>
            </div>
            
          </div>
        </div>
      )}

    </div>
  )
}