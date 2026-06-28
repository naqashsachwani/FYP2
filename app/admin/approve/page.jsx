'use client'

import { useEffect, useState, useMemo } from "react"
import { useAuth, useUser } from "@clerk/nextjs"
import axios from "axios"
import toast from "react-hot-toast"
import Loading from "@/components/Loading"
import StoreInfo from "@/components/admin/StoreInfo"
import { Shield, CheckCircle, XCircle, Clock, AlertCircle, Store, Search, Loader2, RefreshCcw } from "lucide-react"
import Image from "next/image"

export default function AdminApprove() {
  const { user } = useUser()
  const { getToken } = useAuth()
  
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("pending")
  const [processingId, setProcessingId] = useState(null)

  const fetchStores = async () => {
    setLoading(true)
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

  const handleRefresh = () => {
    setSearchTerm("")
    setStatusFilter("pending")
    fetchStores()
  }

  const handleApprove = async ({ storeId, status }) => {
    setProcessingId(storeId)
    try {
      const token = await getToken()
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

  if (loading && stores.length === 0)
    return (
      <div className="flex items-center justify-center min-h-[100dvh]">
        <Loading />
      </div>
    )

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col space-y-6 sm:space-y-8 min-h-screen">
      
      {/* HEADER SECTION */}
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

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
        {[ 
          { label: "Pending Review", count: pendingCount, color: "yellow", icon: Clock },
          { label: "Approved Stores", count: approvedCount, color: "green", icon: CheckCircle },
          { label: "Rejected Stores", count: rejectedCount, color: "red", icon: XCircle }
        ].map((stat, i) => (
          <div key={i} className={`bg-white rounded-2xl p-5 lg:p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex justify-between items-center group`}>
            <div className="min-w-0 pr-2">
              <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 truncate">{stat.label}</p>
              <p className={`text-2xl sm:text-3xl font-black text-${stat.color}-600 tracking-tighter truncate`}>
                {stat.count}
              </p>
            </div>
            <div className={`w-12 h-12 sm:w-14 sm:h-14 bg-${stat.color}-50 rounded-xl flex items-center justify-center shrink-0 border border-${stat.color}-100 group-hover:scale-110 transition-transform`}>
              <stat.icon className={`text-${stat.color}-600 w-6 h-6 sm:w-7 sm:h-7`} />
            </div>
          </div>
        ))}
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="relative w-full lg:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-[18px] sm:h-[18px]" />
          <input
            type="text"
            placeholder="Search stores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 focus:bg-white transition-shadow"
          />
        </div>

        <div className="flex flex-row items-center gap-3 sm:gap-4 w-full lg:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 md:flex-none w-full md:w-48 px-3 sm:px-4 py-2.5 sm:py-3 text-sm font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 focus:bg-white cursor-pointer appearance-none text-slate-700 transition-shadow text-center md:text-left"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <div className="hidden sm:flex text-xs font-bold text-slate-500 bg-slate-100 px-3 py-2 rounded-lg items-center justify-center whitespace-nowrap border border-slate-200 shadow-sm shrink-0 h-full">
            {filteredStores.length} Result{filteredStores.length !== 1 ? 's' : ''}
          </div>
          <button 
            onClick={handleRefresh} 
            disabled={loading}
            className="p-2.5 sm:p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 shadow-sm transition-colors text-slate-600 shrink-0"
            title="Reset filters and refresh"
          >
            <RefreshCcw size={18} className={`sm:w-5 sm:h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* STORE CARDS GRID */}
      {filteredStores.length ? (
        <div className="grid gap-6 grid-cols-1 pb-12 w-full">
          {filteredStores.map((store) => (
            <div key={store.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col w-full">
              
              {/* CARD HEADER */}
              <div className={`px-4 sm:px-5 py-3 border-b shrink-0 ${store.status === "pending" ? "bg-yellow-50 border-yellow-100" : store.status === "approved" ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"}`}>
                <div className="flex flex-row items-center justify-between gap-2">
                  <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border shadow-sm bg-white ${store.status === "pending" ? "text-yellow-700 border-yellow-200" : store.status === "approved" ? "text-green-700 border-green-200" : "text-red-700 border-red-200"}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${store.status === "pending" ? "bg-yellow-500" : store.status === "approved" ? "bg-green-500" : "bg-red-500"}`}></div>
                    {store.status}
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500">
                    Applied {new Date(store.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* CARD BODY */}
              <div className="p-4 sm:p-5 flex flex-col flex-grow">
                <StoreInfo store={store} />
                
                {/* IMAGE GALLERY */}
                {store.images && store.images.length > 0 && (
                  <div className="mt-4 mb-2 bg-slate-50 border border-slate-100 p-3 sm:p-4 rounded-xl">
                    <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Attached Images</p>
                    <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                      {store.images.map((imgUrl, idx) => (
                        <a key={idx} href={imgUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-slate-200 shadow-sm hover:ring-2 hover:ring-indigo-500 transition-all cursor-zoom-in">
                          <Image src={imgUrl} fill className="object-cover" alt={`Doc ${idx}`} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* ACTION BUTTONS */}
                {store.status === "pending" ? (
                  <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 mt-5 pt-5 border-t border-slate-100 w-full">
                    <button
                      onClick={() =>
                        toast.promise(handleApprove({ storeId: store.id, status: "approved" }), {
                          loading: "Approving...",
                          success: "Store approved!",
                          error: "Approval failed",
                        })
                      }
                      disabled={processingId !== null} 
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold transition-all shadow-md shadow-green-600/20 active:scale-[0.98] disabled:active:scale-100"
                    >
                      {processingId === store.id ? <Loader2 className="animate-spin w-4 h-4" /> : <CheckCircle className="w-4 h-4 shrink-0" />} 
                      Approve
                    </button>

                    <button
                      onClick={() => {
                        if (confirm("Are you sure you want to REJECT this store? This cannot be undone.")) {
                            toast.promise(handleApprove({ storeId: store.id, status: "rejected" }), {
                                loading: "Rejecting...",
                                success: "Store rejected!",
                                error: "Rejection failed",
                            })
                        }
                      }}
                      disabled={processingId !== null}
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold transition-all shadow-md shadow-red-600/20 active:scale-[0.98] disabled:active:scale-100"
                    >
                      {processingId === store.id ? <Loader2 className="animate-spin w-4 h-4" /> : <XCircle className="w-4 h-4 shrink-0" />}
                      Reject
                    </button>
                  </div>
                ) : (
                  <div className={`mt-5 pt-5 border-t border-slate-100 flex items-center justify-center w-full`}>
                     <div className={`w-full p-3 rounded-xl border text-sm font-bold flex justify-center items-center gap-2 ${store.status === "approved" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
                        {store.status === "approved" ? (
                          <><CheckCircle size={18} className="shrink-0" /> Store approved</>
                        ) : (
                          <><XCircle size={18} className="shrink-0" /> Store rejected</>
                        )}
                     </div>
                  </div>
                )}
              </div>

              {/* CARD FOOTER */}
              <div className="bg-slate-50 px-4 sm:px-5 py-2.5 border-t border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center shrink-0">
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
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center shadow-sm max-w-xl mx-auto mt-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-50 border border-slate-100 shadow-sm flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">
            {searchTerm || statusFilter !== "all" ? "No matching stores" : "No applications pending"}
          </h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
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
              className="mt-6 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-bold shadow-md transition-colors active:scale-95"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}
    </div>
  )
}