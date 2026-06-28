'use client'

import StoreInfo from "@/components/admin/StoreInfo" 
import Loading from "@/components/Loading" 
import { useEffect, useState } from "react"
import toast from "react-hot-toast" 
import { useUser, useAuth } from "@clerk/nextjs" 
import axios from "axios" 
import { 
  Store, 
  Activity, 
  Search, 
  Users, 
  Eye, 
  Edit, 
  X, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  Trash2,
  RefreshCw 
} from "lucide-react"

export default function AdminStores() {
    
    // Auth Hooks: 'useUser' gets client-side user data, 'getToken' fetches a JWT for secure API requests.
    const { user } = useUser()
    const { getToken } = useAuth()
    // --- Core State ---
    const [stores, setStores] = useState([]) // Holds the master list of stores fetched from the database
    const [loading, setLoading] = useState(true) // Controls the full-page loading spinner
    
    // --- Search & Filtering State ---
    const [searchTerm, setSearchTerm] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("") 
    const [statusFilter, setStatusFilter] = useState("all")

    // --- MODAL STATES ---
    const [isEditModalOpen, setIsEditModalOpen] = useState(false) 
    const [isViewModalOpen, setIsViewModalOpen] = useState(false) 
    const [selectedStore, setSelectedStore] = useState(null) 
    const [editFormData, setEditFormData] = useState({ name: "", isActive: false }) 

   
    const fetchStores = async () => {
        try {
            const token = await getToken()
            const { data } = await axios.get('/api/admin/stores', {
                headers: { Authorization: `Bearer ${token}` }
            })
            setStores(data.stores) // Populate the state with the returned array
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        }
        setLoading(false) // Turn off the spinner regardless of success or failure
    }

    // --- REFRESH HANDLER ---
    const handleRefresh = () => {
        setSearchTerm("")
        setDebouncedSearch("")
        setStatusFilter("all")
        setLoading(true)
        fetchStores()
    }

    // Opens the Edit Modal and pre-fills the form state with the existing store data.
    const handleEditClick = (store) => {
        setSelectedStore(store)
        setEditFormData({ name: store.name, isActive: store.isActive })
        setIsEditModalOpen(true)
    }

    // Opens the View Details modal for a specific store.
    const handleViewClick = (store) => {
        setSelectedStore(store)
        setIsViewModalOpen(true)
    }

    // Deletes a store from the platform
    const handleDeleteStore = async (storeId) => {
        // Safety Check: Native browser confirm dialog to prevent accidental deletions
        if(!confirm("Are you sure you want to delete this store? This action cannot be undone.")) return;

        const previousStores = [...stores];

        // Optimistic UI Update: Remove the store from the screen immediately so the app feels instant
        setStores(prev => prev.filter(s => s.id !== storeId));

        try {
            const token = await getToken();
            // API Call: Send a DELETE request with the storeId as a query parameter (Fixed to plural /stores)
            await axios.delete(`/api/admin/stores?id=${storeId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Store deleted successfully");
        } catch (error) {
            // If the API failed, put the data back so the user isn't lied to
            setStores(previousStores); 
            toast.error(error?.response?.data?.error || "Failed to delete store");
        }
    }

    const handleUpdateStore = async (e) => {
        e.preventDefault() // Stop the HTML form from refreshing the page
        
        const previousStores = [...stores] 
    
        // Merge the existing store data with the new changes from the form
        const updatedStore = { ...selectedStore, ...editFormData }
        
        // Map over the state array: replace the edited store with the new object, leave others alone.
        setStores(prev => prev.map(s => s.id === selectedStore.id ? updatedStore : s))
        
        setIsEditModalOpen(false) // Close the modal immediately
        toast.success("Store details updated successfully")

        try {
            const token = await getToken()
            
            // Background API Call to save the changes permanently in the database
            await axios.post('/api/admin/toggle-store', { 
                storeId: selectedStore.id,
                name: editFormData.name,
                isActive: editFormData.isActive
            }, { 
                headers: { Authorization: `Bearer ${token}` } 
            });

        } catch (error) {
            // Rollback the UI if the background network request fails
            setStores(previousStores)
            toast.error("Failed to update store on server")
        }
    }

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 500);

        return () => clearTimeout(handler);
    }, [searchTerm]);

    // Initial Data Fetch: Runs once when Clerk verifies the user session is active.
    useEffect(() => {
        if(user){
            fetchStores()
        }
    }, [user])

    const filteredStores = stores.filter(store => {
        // Search Name OR Username (case-insensitive)
        const matchesSearch = store.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                              store.username.toLowerCase().includes(debouncedSearch.toLowerCase())
        
        // Evaluate the Status dropdown (All, Active, or Inactive)
        const matchesStatus = statusFilter === "all" || 
                              (statusFilter === "active" && store.isActive) ||
                              (statusFilter === "inactive" && !store.isActive)
        
        // Store must pass both checks to remain visible
        return matchesSearch && matchesStatus
    })

    // Calculated Statistics for the top dashboard cards
    const totalStores = stores.length
    const activeStores = stores.filter(store => store.isActive).length
    const inactiveStores = stores.filter(store => !store.isActive).length

    // Full-page spinner while fetching initial data
    if (loading) return (
        <div className="flex items-center justify-center min-h-[100dvh]">
            <Loading />
        </div>
    )

    return (
        <div className="space-y-6 sm:space-y-8 mb-24 sm:mb-28 relative px-4 sm:px-0">
            
            {/* ================= Header Section ================= */}
            <div className="flex flex-col md:flex-row md:items-start lg:items-center justify-between gap-4 sm:gap-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-800 tracking-tight">
                        Store Management
                    </h1>
                    <p className="text-slate-500 mt-1 sm:mt-2 text-sm sm:text-base lg:text-lg">
                        Monitor and manage your platform's store ecosystem.
                    </p>
                </div>
                {/* Live System Pulse Badge */}
                <div className="flex items-center gap-2.5 sm:gap-3 bg-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-full shadow-sm border border-slate-200 self-start md:self-auto shrink-0">
                    <span className="relative flex h-2.5 w-2.5 sm:h-3 sm:w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-green-500"></span>
                    </span>
                    <span className="text-xs sm:text-sm text-slate-700 font-semibold tracking-wide">Live System</span>
                </div>
            </div>

            {/* ================= Stats Cards ================= */}
            {/* Uses the reusable StatCard component defined at the bottom of the file */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <StatCard label="Total Stores" value={totalStores} icon={Store} color="blue" bg="bg-blue-50" text="text-blue-600" />
                <StatCard label="Active Stores" value={activeStores} icon={Activity} color="green" bg="bg-green-50" text="text-green-600" />
                <StatCard label="Inactive Stores" value={inactiveStores} icon={Users} color="orange" bg="bg-orange-50" text="text-orange-600" />
            </div>

            {/* ================= Filters Toolbar ================= */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row gap-3 sm:gap-4 items-center justify-between">
                    
                    {/* Search Bar Input */}
                    <div className="relative w-full md:max-w-md">
                        <Search className="absolute left-3.5 sm:left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />
            
                        <input
                            type="text"
                            placeholder="Search stores..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 sm:pl-12 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50/50 focus:bg-white"
                        />
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4 w-full md:w-auto">
                        {/* Status Filter Dropdown */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full md:w-auto px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50 focus:bg-white cursor-pointer appearance-none text-center sm:text-left"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        {/* Dynamic Count of filtered results */}
                        <span className="hidden md:block text-sm font-medium text-slate-500 whitespace-nowrap">
                            {filteredStores.length} Result{filteredStores.length !== 1 && 's'}
                        </span>
                        {/* REFRESH BUTTON */}
                        <button 
                            onClick={handleRefresh} 
                            className="px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 shadow-sm transition-all flex items-center justify-center" 
                            title="Refresh & Reset Filters"
                        >
                            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* ================= Stores List Feed ================= */}
            <div className="space-y-4 sm:space-y-5">
                {/* Check if the filtered array has data */}
                {filteredStores.length > 0 ? (
                    // Map over the filtered array to render store cards
                    filteredStores.map((store) => (
                        <div key={store.id} className="group bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 hover:shadow-lg hover:border-blue-200 transition-all duration-300">
                            <div className="flex flex-col lg:flex-row lg:items-start gap-4 sm:gap-6">
                                
                                <div className="flex-1 min-w-0">
                                    {/* Reusable component handling the heavy lifting of displaying owner/legal info */}
                                    <StoreInfo store={store} />
                                </div>

                                {/* Actions Container */}
                                <div className="flex flex-col sm:flex-row lg:flex-col items-stretch justify-center gap-2 sm:gap-3 lg:border-l lg:border-slate-100 lg:pl-6 min-w-[140px] pt-4 lg:pt-0 border-t border-slate-100 lg:border-t-0 mt-2 lg:mt-0">
                                    
                                    <div className={`self-center sm:self-start lg:self-center px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2 lg:mb-4 w-fit ${store.isActive ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                                        {store.isActive ? 'Active' : 'Inactive'}
                                    </div>

                                    {/* Action Buttons */}
                                    <button 
                                        onClick={() => handleViewClick(store)}
                                        className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 shadow-sm"
                                    >
                                        <Eye size={16} className="shrink-0" /> View
                                    </button>
                                    
                                    <button 
                                        onClick={() => handleEditClick(store)}
                                        className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors border border-blue-200 shadow-sm"
                                    >
                                        <Edit size={16} className="shrink-0" /> Edit
                                    </button>
                                    
                                    <button 
                                        onClick={() => handleDeleteStore(store.id)}
                                        className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors border border-red-200 shadow-sm"
                                    >
                                        <Trash2 size={16} className="shrink-0" /> Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    // Fallback UI if the array is empty 
                    <EmptyState searchTerm={searchTerm} />
                )}
            </div>
            
            {/* ================= EDIT MODAL OVERLAY ================= */}
            {isEditModalOpen && selectedStore && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl sm:rounded-3xl w-[95%] sm:w-full max-w-md shadow-2xl p-5 sm:p-6 animate-in fade-in zoom-in duration-200 max-h-[90dvh] overflow-y-auto custom-scrollbar">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center mb-5 sm:mb-6">
                            <h2 className="text-lg sm:text-xl font-bold text-slate-800">Edit Store</h2>
                            <button 
                                onClick={() => setIsEditModalOpen(false)} 
                                className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X size={20} className="text-slate-500 w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                        </div>

                        {/* Edit Form */}
                        <form onSubmit={handleUpdateStore} className="space-y-4 sm:space-y-5">
                            {/* Store Name Input */}
                            <div>
                                <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">Store Name</label>
                                <input 
                                    type="text" 
                                    value={editFormData.name}
                                    onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-shadow"
                                />
                            </div>

                            {/* Status Dropdown */}
                            <div>
                                <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">Status</label>
                                <div className="relative">
                                    <select 
                                        value={editFormData.isActive ? "active" : "inactive"}
                                        onChange={(e) => setEditFormData({...editFormData, isActive: e.target.value === "active"})}
                                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white appearance-none cursor-pointer transition-shadow"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                    <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Form Action Buttons */}
                            <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setIsEditModalOpen(false)} 
                                    className="w-full sm:flex-1 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors shadow-sm order-2 sm:order-1"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="w-full sm:flex-1 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-500/30 flex justify-center items-center gap-2 active:scale-[0.98] order-1 sm:order-2"
                                >
                                    <Save size={18} className="shrink-0" /> 
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ================= VIEW MODAL OVERLAY ================= */}
            {isViewModalOpen && selectedStore && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl sm:rounded-3xl w-[95%] sm:w-full max-w-lg shadow-2xl p-0 overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90dvh]">
                        {/* Modal Header */}
                        <div className="bg-slate-50 p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
                            <h2 className="text-lg sm:text-xl font-bold text-slate-800">Store Details</h2>
                            <button onClick={() => setIsViewModalOpen(false)} className="p-1.5 sm:p-2 hover:bg-white bg-slate-100 border border-slate-200 rounded-full transition-colors shadow-sm">
                                <X className="text-slate-500 w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                        </div>
                        {/* Modal Body */}
                        <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 overflow-y-auto custom-scrollbar">
                            {/* Store Identity Area */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-50 rounded-xl sm:rounded-2xl flex items-center justify-center text-blue-600 font-bold text-xl sm:text-2xl uppercase border border-blue-100 shrink-0 shadow-sm">
                                    {selectedStore.name.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-lg sm:text-xl font-bold text-slate-800 truncate" title={selectedStore.name}>{selectedStore.name}</h3>
                                    <p className="text-xs sm:text-sm text-slate-500 truncate mt-0.5">@{selectedStore.username}</p>
                                </div>
                            </div>
                            {/* Grid of Key-Value Metadata using the DetailItem helper component */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <DetailItem label="Store ID" value={selectedStore.id} />
                                <DetailItem label="Created At" value={new Date(selectedStore.createdAt).toLocaleDateString()} />
                                <DetailItem label="Status" value={
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold border shadow-sm ${selectedStore.isActive ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                        {selectedStore.isActive ? <CheckCircle2 size={12} className="w-3 h-3 sm:w-[14px] sm:h-[14px]"/> : <AlertCircle size={12} className="w-3 h-3 sm:w-[14px] sm:h-[14px]"/>}
                                        {selectedStore.isActive ? "Active" : "Inactive"}
                                    </span>
                                } />
                                <DetailItem label="Owner" value="N/A" />
                            </div>
                        </div>
                        {/* Modal Footer */}
                        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
                             <button onClick={() => setIsViewModalOpen(false)} className="w-full sm:w-auto px-6 py-2.5 bg-white border border-slate-200 shadow-sm rounded-xl font-bold text-sm sm:text-base text-slate-600 hover:bg-slate-100 transition-colors">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// Standardized component to render a statistic box (used at the top of the page)
const StatCard = ({ label, value, icon: Icon, color, bg, text }) => (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
        <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
                <p className="text-slate-500 text-xs sm:text-sm font-bold uppercase tracking-wider truncate mb-1">{label}</p>
                <p className={`text-2xl sm:text-3xl font-extrabold text-slate-800 truncate`}>{value}</p>
            </div>
            {/* Icon container with a subtle rotation animation on group hover */}
            <div className={`w-12 h-12 sm:w-14 sm:h-14 ${bg} rounded-xl sm:rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-transform shrink-0 shadow-sm border border-${color}-100`}>
                <Icon className={`w-6 h-6 sm:w-7 sm:h-7 ${text}`} />
            </div>
        </div>
    </div>
)

// Standardized component to render a metadata field (used inside the View Modal)
const DetailItem = ({ label, value }) => (
    <div className="bg-slate-50 border border-slate-100 p-3 sm:p-4 rounded-xl">
        <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider mb-1.5">{label}</p>
        <div className="text-xs sm:text-sm font-semibold text-slate-700 break-words">{value}</div>
    </div>
)

// Adjusts its text based on whether the user is actively searching or if the DB is truly empty.
const EmptyState = ({ searchTerm }) => (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-8 sm:p-12 text-center shadow-sm">
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm">
            <Search className="w-8 h-8 sm:w-10 sm:h-10 text-slate-300" />
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-2">
            {searchTerm ? "No matches found" : "No stores yet"}
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            {searchTerm 
                ? "We couldn't find any store matching your search. Try checking for typos."
                : "Stores will appear here once they register on the DreamSaver platform."
            }
        </p>
    </div>
)