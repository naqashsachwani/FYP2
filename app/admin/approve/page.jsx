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
  // --- Authentication ---
  const { user } = useUser()
  const { getToken } = useAuth()
  
  // --- Main State ---
  // Stores the raw array of all store applications fetched from the backend.
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  
  // --- Filtering State ---
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("pending")
  const [processingId, setProcessingId] = useState(null)

  // --- Data Fetching ---
  // function to retrieve the list of store applications from the admin API.
  const fetchStores = async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get('/api/admin/approve-store', {
        headers: { Authorization: `Bearer ${token}` }
      })
      // Update state with the fetched array of stores
      setStores(data.stores)
    } catch (error) {
      toast.error(error?.response?.data?.error || error.message)
    } finally {
      setLoading(false)
    }
  }

  // --- Action Handler: Approving or Rejecting a store ---
  // Accepts an object containing the storeId to modify and the string status ('approved' or 'rejected').
  const handleApprove = async ({ storeId, status }) => {
    // Lock the buttons for this specific store card
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
      setProcessingId(null)
    }
  }

  useEffect(() => {
    if (user) fetchStores()
  }, [user])

  // ================= PERFORMANCE OPTIMIZATION =================
  const filteredStores = useMemo(() => {
    return stores.filter(store => {
      const term = searchTerm.toLowerCase()
      const matchesSearch =
        store.name.toLowerCase().includes(term) ||
        store.username.toLowerCase().includes(term) ||
        store.user.name.toLowerCase().includes(term)
      
      // Check if the store's status matches the dropdown filter (or if "all" is selected)
      const matchesStatus = statusFilter === "all" || store.status === statusFilter
      
      return matchesSearch && matchesStatus
    })
  }, [stores, searchTerm, statusFilter])


  // useMemo caches these counts so we aren't iterating over the array unnecessarily
  const pendingCount = useMemo(() => stores.filter(s => s.status === 'pending').length, [stores])
  const approvedCount = useMemo(() => stores.filter(s => s.status === 'approved').length, [stores])
  const rejectedCount = useMemo(() => stores.filter(s => s.status === 'rejected').length, [stores])

  // If still waiting for the initial API fetch, display a centered loading component
  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[100dvh]">
        <Loading />
      </div>
    )

  return (
    <div className="space-y-6 sm:space-y-8 mb-24 sm:mb-28 px-4 sm:px-6 lg:px-8 w-full max-w-7xl mx-auto py-6 sm:py-8">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-800 tracking-tight">
            Store Approvals
          </h1>
          <p className="text-slate-500 text-sm sm:text-base mt-1 sm:mt-2">
            Review and approve store registration requests for DreamSaver
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-blue-50 to-purple-50 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-blue-100 shadow-sm self-start md:self-auto shrink-0">
          <Shield className="text-blue-600 w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
          <span className="text-xs sm:text-sm text-blue-800 font-bold uppercase tracking-wider">
            Admin Approval Panel
          </span>
        </div>
      </div>

      {/* ================= KPI Stats Cards ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {[ 
          { label: "Pending Review", count: pendingCount, color: "yellow", icon: Clock },
          { label: "Approved Stores", count: approvedCount, color: "green", icon: CheckCircle },
          { label: "Rejected Stores", count: rejectedCount, color: "red", icon: XCircle }
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 lg:p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex justify-between items-center group">
            <div className="min-w-0 pr-2">
              <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 truncate">{stat.label}</p>
              <p className={`text-2xl sm:text-3xl font-black text-${stat.color}-600 tracking-tighter truncate`}>
                {stat.count}
              </p>
            </div>
            {/* Dynamic Icon Rendering based on stat type */}
            <div className={`w-12 h-12 sm:w-14 sm:h-14 bg-${stat.color}-50 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 border border-${stat.color}-100 group-hover:scale-110 transition-transform`}>
              <stat.icon className={`text-${stat.color}-600 w-6 h-6 sm:w-7 sm:h-7`} />
            </div>
          </div>
        ))}
      </div>

      {/* ================= Filters & Search Toolbar ================= */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 lg:p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row gap-3 sm:gap-4 items-center justify-between">
        
        {/* Search Input */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-[18px] sm:h-[18px]" />
          <input
            type="text"
            placeholder="Search stores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 text-sm border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 focus:bg-white transition-shadow"
          />
        </div>

        {/* Status Dropdown Filter & Counter */}
        <div className="flex flex-row items-center gap-3 sm:gap-4 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 md:flex-none w-full md:w-40 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold border border-slate-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 focus:bg-white cursor-pointer appearance-none text-slate-700 transition-shadow text-center md:text-left"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          
          {/* Dynamic counter showing how many results match the current filters */}
          <div className="hidden sm:flex text-xs font-bold text-slate-500 bg-slate-100 px-3 py-2 rounded-lg items-center justify-center whitespace-nowrap border border-slate-200 shadow-sm shrink-0 h-full">
            {filteredStores.length} Result{filteredStores.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* ================= Store List Grid ================= */}
      {filteredStores.length ? (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 xl:grid-cols-2">
          {/* Map through the filtered array to render individual store cards */}
          {filteredStores.map((store) => (
            <div key={store.id} className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col h-full">
              
              {/* Card Header: Dynamic Status Badge and Creation Date */}
              <div className={`px-4 sm:px-5 lg:px-6 py-3 border-b shrink-0 ${store.status === "pending" ? "bg-yellow-50 border-yellow-100" : store.status === "approved" ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"}`}>
                <div className="flex flex-row items-center justify-between gap-2">
                  <div className={`px-2.5 sm:px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border shadow-sm bg-white ${store.status === "pending" ? "text-yellow-700 border-yellow-200" : store.status === "approved" ? "text-green-700 border-green-200" : "text-red-700 border-red-200"}`}>
                    <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${store.status === "pending" ? "bg-yellow-500" : store.status === "approved" ? "bg-green-500" : "bg-red-500"}`}></div>
                    {store.status}
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500">
                    Applied {new Date(store.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="p-4 sm:p-5 lg:p-6 flex-1 flex flex-col">
                <StoreInfo store={store} />
                
                {/* CONDITIONAL ACTION BUTTONS */}
                {/* If the store is currently pending, show the Approve/Reject buttons */}
                {store.status === "pending" ? (
                  <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 mt-auto pt-5 sm:pt-6 border-t border-slate-100">
                    
                    {/* Approve Button */}
                    <button
                      onClick={() =>
                        // Wraps the handleApprove call in a toast promise to show loading/success states
                        toast.promise(handleApprove({ storeId: store.id, status: "approved" }), {
                          loading: "Approving...",
                          success: "Store approved!",
                          error: "Approval failed",
                        })
                      }
                      // Disables the button ONLY if this specific card is the one currently being processed
                      disabled={processingId !== null} 
                      className="w-full sm:flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm font-bold transition-all shadow-md shadow-green-600/20 active:scale-[0.98] disabled:active:scale-100"
                    >
                      {processingId === store.id ? <Loader2 className="animate-spin w-4 h-4 sm:w-[18px] sm:h-[18px]" /> : <CheckCircle className="w-4 h-4 sm:w-[18px] sm:h-[18px] shrink-0" />} 
                      Approve
                    </button>

                    {/* Reject Button */}
                    <button
                      onClick={() => {
                        // Browser confirm dialog prevents accidental irreversible deletions
                        if (confirm("Are you sure you want to REJECT this store? This cannot be undone.")) {
                            toast.promise(handleApprove({ storeId: store.id, status: "rejected" }), {
                                loading: "Rejecting...",
                                success: "Store rejected!",
                                error: "Rejection failed",
                            })
                        }
                      }}
                      disabled={processingId !== null}
                      className="w-full sm:flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm font-bold transition-all shadow-md shadow-red-600/20 active:scale-[0.98] disabled:active:scale-100"
                    >
                      {processingId === store.id ? <Loader2 className="animate-spin w-4 h-4 sm:w-[18px] sm:h-[18px]" /> : <XCircle className="w-4 h-4 sm:w-[18px] sm:h-[18px] shrink-0" />}
                      Reject
                    </button>
                    
                  </div>
                ) : (
                  // If the store is NOT pending (already approved or rejected), show a static status label instead of buttons
                  <div className={`mt-auto pt-5 sm:pt-6 border-t border-slate-100 flex items-center justify-center`}>
                     <div className={`w-full p-3 sm:p-4 rounded-xl border text-xs sm:text-sm font-bold flex justify-center items-center gap-2 ${store.status === "approved" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
                        {store.status === "approved" ? (
                          <>
                            <CheckCircle size={18} className="shrink-0" /> Store approved
                          </>
                        ) : (
                          <>
                            <XCircle size={18} className="shrink-0" /> Store rejected
                          </>
                        )}
                     </div>
                  </div>
                )}
              </div>

              {/* Card Footer: Metadata (Application ID) */}
              <div className="bg-slate-50 px-4 sm:px-5 py-2.5 sm:py-3 border-t border-slate-100 text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center shrink-0">
                <div className="flex items-center gap-1.5">
                  <Store size={14} className="shrink-0" />
                  <span>App ID</span>
                </div>
                <div className="font-mono text-slate-500">
                  {store.id}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ================= Empty State / Fallback UI ================= */
        // Renders if the 'filteredStores' array has a length of 0
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 md:p-16 text-center shadow-sm">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full bg-slate-50 border border-slate-100 shadow-sm flex items-center justify-center">
            <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-slate-300" />
          </div>
          {/* Dynamically adjust the message based on whether filters are active or the DB is actually empty */}
          <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-2">
            {searchTerm || statusFilter !== "all" ? "No matching stores" : "No applications pending"}
          </h3>
          <p className="text-slate-500 text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
            {searchTerm || statusFilter !== "all"
              ? "Try changing your filters or search keywords."
              : "All applications are reviewed. New ones will appear here."}
          </p>
          {/* Provide a quick-action button to clear filters if that's why the array is empty */}
          {(searchTerm || statusFilter !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("")
                setStatusFilter("all")
              }}
              className="mt-5 sm:mt-6 px-5 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-xs sm:text-sm font-bold shadow-md transition-colors active:scale-95"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}
    </div>
  )
}