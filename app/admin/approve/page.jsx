'use client'

import { useEffect, useState, useMemo } from "react"
import { useAuth, useUser } from "@clerk/nextjs"
import axios from "axios"
import toast from "react-hot-toast"
import Loading from "@/components/Loading"
import StoreInfo from "@/components/admin/StoreInfo"
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Store,
  Search,
  Loader2 
} from "lucide-react"

export default function AdminApprove() {
  //Clerk hooks to get the current user and their session token.
  const { user } = useUser()
  const { getToken } = useAuth()
  
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("pending")
  
  // Instead of a global 'isSubmitting' boolean, we store the specific ID of the store being modified.
  // This allows us to disable only the buttons for *that specific card* while leaving others active.
  const [processingId, setProcessingId] = useState(null)

  const fetchStores = async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get('/api/admin/approve-store', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setStores(data.stores)
    } catch (error) {
      toast.error(error?.response?.data?.error || error.message)
    } finally {
      setLoading(false)
    }
  }

  // Action Handler: Approving or Rejecting a store
  const handleApprove = async ({ storeId, status }) => {
    setProcessingId(storeId)
    
    try {
      const token = await getToken()
      
      // API Call: Send the decision to the backend
      const { data } = await axios.post('/api/admin/approve-store', { storeId, status }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      toast.success(data.message)
      await fetchStores()
    } catch (error) {
      toast.error(error?.response?.data?.error || error.message)
    } finally {
      // 4. Unlock UI: Always clean up state, even if error occurred
      setProcessingId(null)
    }
  }

  // Initial Data Fetch
  useEffect(() => {
    if (user) fetchStores()
  }, [user])

  // ================= PERFORMANCE OPTIMIZATION =================
  

  // Filtering is an expensive operation. useMemo ensures we only re-run this logic 
  // when 'stores', 'searchTerm', or 'statusFilter' actually changes, preventing lag 
  // on every single React render."
  const filteredStores = useMemo(() => {
    return stores.filter(store => {
      const term = searchTerm.toLowerCase()
      const matchesSearch =
        store.name.toLowerCase().includes(term) ||
        store.username.toLowerCase().includes(term) ||
        store.user.name.toLowerCase().includes(term)
      
      const matchesStatus = statusFilter === "all" || store.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [stores, searchTerm, statusFilter])

  const pendingCount = useMemo(() => stores.filter(s => s.status === 'pending').length, [stores])
  const approvedCount = useMemo(() => stores.filter(s => s.status === 'approved').length, [stores])
  const rejectedCount = useMemo(() => stores.filter(s => s.status === 'rejected').length, [stores])

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loading />
      </div>
    )

  return (
    <div className="space-y-6 mb-28 px-3 sm:px-6 lg:px-8 w-full max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
            Store Approvals
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-1 sm:mt-2">
            Review and approve store registration requests for DreamSaver
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-blue-50 to-purple-50 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-blue-100">
          <Shield size={18} className="text-blue-600 shrink-0" />
          <span className="text-xs sm:text-sm text-blue-700 font-medium">
            Admin Approval Panel
          </span>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[ 
          { label: "Pending Review", count: pendingCount, color: "yellow" },
          { label: "Approved Stores", count: approvedCount, color: "green" },
          { label: "Rejected Stores", count: rejectedCount, color: "red" }
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm flex justify-between items-center">
            <div>
              <p className="text-slate-600 text-sm">{stat.label}</p>
              <p className={`text-2xl sm:text-3xl font-bold text-${stat.color}-600 mt-2`}>
                {stat.count}
              </p>
            </div>
            {/* Dynamic Icon Rendering based on stat type */}
            <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-${stat.color}-100 rounded-xl flex items-center justify-center`}>
              {stat.color === "yellow" ? (
                <Clock className={`text-${stat.color}-600`} />
              ) : stat.color === "green" ? (
                <CheckCircle className={`text-${stat.color}-600`} />
              ) : (
                <XCircle className={`text-${stat.color}-600`} />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto flex-1">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search stores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50"
              />
            </div>

            {/* Status Dropdown */}
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-slate-700 text-sm font-medium">Filter:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 sm:px-4 py-2.5 sm:py-3 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-50"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="text-xs sm:text-sm text-slate-500 bg-slate-100 px-3 py-2 rounded-lg text-center">
            {filteredStores.length} store{filteredStores.length !== 1 ? 's' : ''} found
          </div>
        </div>
      </div>

      {/* Store List Grid */}
      {filteredStores.length ? (
        <div className="grid gap-5 sm:gap-6 grid-cols-1 md:grid-cols-2">
          {filteredStores.map((store) => (
            <div key={store.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden">
              
              {/* Card Header: Status Badge */}
              <div className={`px-4 sm:px-6 py-3 border-b text-sm ${store.status === "pending" ? "bg-yellow-50 border-yellow-200" : store.status === "approved" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${store.status === "pending" ? "bg-yellow-500" : store.status === "approved" ? "bg-green-500" : "bg-red-500"}`}></div>
                    <span className={`font-semibold capitalize ${store.status === "pending" ? "text-yellow-800" : store.status === "approved" ? "text-green-800" : "text-red-800"}`}>
                      {store.status}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">
                    Applied {new Date(store.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                {/* Store Details Component (reusable) */}
                <StoreInfo store={store} />
                
                {/* CONDITIONAL ACTION BUTTONS */}
                {store.status === "pending" ? (
                  <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-5 border-t border-slate-200">
                    
                    {/* Approve Button */}
                    <button
                      onClick={() =>
                        toast.promise(handleApprove({ storeId: store.id, status: "approved" }), {
                          loading: "Approving...",
                          success: "Store approved!",
                          error: "Approval failed",
                        })
                      }
                      disabled={processingId !== null} 
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-all"
                    >
                      {processingId === store.id ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />} 
                      Approve
                    </button>

                    <button
                      onClick={() => {
                        // confirm dialog prevents accidental deletions
                        if (confirm("Are you sure you want to REJECT this store? This cannot be undone.")) {
                            toast.promise(handleApprove({ storeId: store.id, status: "rejected" }), {
                                loading: "Rejecting...",
                                success: "Store rejected!",
                                error: "Rejection failed",
                            })
                        }
                      }}
                      disabled={processingId !== null}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-all"
                    >
                      {processingId === store.id ? <Loader2 className="animate-spin" size={16} /> : <XCircle size={16} />}
                      Reject
                    </button>
                    
                  </div>
                ) : (
                  <div className={`mt-6 p-4 rounded-lg border text-sm font-medium flex items-center gap-2 ${store.status === "approved" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
                    {store.status === "approved" ? (
                      <>
                        <CheckCircle size={16} /> Store approved
                      </>
                    ) : (
                      <>
                        <XCircle size={16} /> Store rejected
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Card Footer: Metadata */}
              <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 text-xs text-slate-500 flex flex-wrap justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Store size={12} />
                  <span>Application</span>
                </div>
                <div>
                  ID: <span className="font-mono">{store.id}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 sm:p-12 text-center shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-slate-700 mb-2">
            {searchTerm || statusFilter !== "all" ? "No matching stores" : "No applications pending"}
          </h3>
          <p className="text-slate-500 text-sm sm:text-base max-w-md mx-auto">
            {searchTerm || statusFilter !== "all"
              ? "Try changing your filters or search keywords."
              : "All applications are reviewed. New ones will appear here."}
          </p>
          {(searchTerm || statusFilter !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("")
                setStatusFilter("all")
              }}
              className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}
    </div>
  )
}