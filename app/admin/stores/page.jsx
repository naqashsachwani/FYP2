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
  Trash2 
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
            // API Call: Send a DELETE request with the storeId as a query parameter
            await axios.delete(`/api/admin/store?id=${storeId}`, {
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
        <div className="flex items-center justify-center min-h-[60vh]">
            <Loading />
        </div>
    )

    return (
        <div className="space-y-8 mb-28 relative">
            
            {/* ================= Header Section ================= */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-800 tracking-tight">
                        Store Management
                    </h1>
                    <p className="text-slate-500 mt-2 text-lg">
                        Monitor and manage your platform's store ecosystem.
                    </p>
                </div>
                {/* Live System Pulse Badge */}
                <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-full shadow-sm border border-slate-200">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <span className="text-sm text-slate-700 font-semibold">Live System</span>
                </div>
            </div>

            {/* ================= Stats Cards ================= */}
            {/* Uses the reusable StatCard component defined at the bottom of the file */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard label="Total Stores" value={totalStores} icon={Store} color="blue" bg="bg-blue-50" text="text-blue-600" />
                <StatCard label="Active Stores" value={activeStores} icon={Activity} color="green" bg="bg-green-50" text="text-green-600" />
                <StatCard label="Inactive Stores" value={inactiveStores} icon={Users} color="orange" bg="bg-orange-50" text="text-orange-600" />
            </div>

            {/* ================= Filters Toolbar ================= */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    
                    {/* Search Bar Input */}
                    <div className="relative w-full md:max-w-md">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            
                        <input
                            type="text"
                            placeholder="Search stores..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50/50 focus:bg-white"
                        />
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        {/* Status Filter Dropdown */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full md:w-auto px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50 focus:bg-white cursor-pointer"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        {/* Dynamic Count of filtered results */}
                        <span className="hidden md:block text-sm font-medium text-slate-500 whitespace-nowrap">
                            {filteredStores.length} Result{filteredStores.length !== 1 && 's'}
                        </span>
                    </div>
                </div>
            </div>

            {/* ================= Stores List Feed ================= */}
            <div className="space-y-4">
                {/* Check if the filtered array has data */}
                {filteredStores.length > 0 ? (
                    // Map over the filtered array to render store cards
                    filteredStores.map((store) => (
                        <div key={store.id} className="group bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-lg hover:border-blue-200 transition-all duration-300">
                            <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                                
                                <div className="flex-1 min-w-0">
                                    {/* Reusable component handling the heavy lifting of displaying owner/legal info */}
                                    <StoreInfo store={store} />
                                </div>

                                <div className="flex flex-col items-stretch sm:items-end gap-3 lg:border-l lg:border-slate-100 lg:pl-6 min-w-[140px] pt-4 lg:pt-0">
                                    
                                    <div className={`self-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${store.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {store.isActive ? 'Active' : 'Inactive'}
                                    </div>

                                    {/* Action Buttons */}
                                    {/* Trigger View Modal */}
                                    <button 
                                        onClick={() => handleViewClick(store)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors border border-slate-100"
                                    >
                                        <Eye size={16} />
                                        View
                                    </button>
                                    {/* Trigger Edit Modal */}
                                    <button 
                                        onClick={() => handleEditClick(store)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors border border-blue-100"
                                    >
                                        <Edit size={16} />
                                        Edit
                                    </button>
                                    
                                    {/* Trigger Delete Handler */}
                                    <button 
                                        onClick={() => handleDeleteStore(store.id)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors border border-red-100"
                                    >
                                        <Trash2 size={16} />
                                        Delete
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-800">Edit Store</h2>
                            <button 
                                onClick={() => setIsEditModalOpen(false)} 
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>

                        {/* Edit Form */}
                        <form onSubmit={handleUpdateStore} className="space-y-4">
                            {/* Store Name Input */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Store Name</label>
                                <input 
                                    type="text" 
                                    value={editFormData.name}
                                    onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>

                            {/* Status Dropdown */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                <div className="relative">
                                    <select 
                                        value={editFormData.isActive ? "active" : "inactive"}
                                        onChange={(e) => setEditFormData({...editFormData, isActive: e.target.value === "active"})}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white appearance-none cursor-pointer"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Form Action Buttons */}
                            <div className="pt-4 flex gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setIsEditModalOpen(false)} 
                                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 flex justify-center items-center gap-2"
                                >
                                    <Save size={18} /> 
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ================= VIEW MODAL OVERLAY ================= */}
            {isViewModalOpen && selectedStore && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-0 overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* Modal Header */}
                        <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-800">Store Details</h2>
                            <button onClick={() => setIsViewModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors">
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>
                        {/* Modal Body */}
                        <div className="p-6 space-y-6">
                            {/* Store Identity Area */}
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-bold text-2xl uppercase">
                                    {selectedStore.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">{selectedStore.name}</h3>
                                    <p className="text-slate-500">@{selectedStore.username}</p>
                                </div>
                            </div>
                            {/* Grid of Key-Value Metadata using the DetailItem helper component */}
                            <div className="grid grid-cols-2 gap-4">
                                <DetailItem label="Store ID" value={selectedStore.id} />
                                <DetailItem label="Created At" value={new Date(selectedStore.createdAt).toLocaleDateString()} />
                                <DetailItem label="Status" value={
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedStore.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {selectedStore.isActive ? <CheckCircle2 size={12}/> : <AlertCircle size={12}/>}
                                        {selectedStore.isActive ? "Active" : "Inactive"}
                                    </span>
                                } />
                                <DetailItem label="Owner" value="N/A" />
                            </div>
                        </div>
                        {/* Modal Footer */}
                        <div className="p-6 bg-slate-50 border-t border-slate-100 text-right">
                             <button onClick={() => setIsViewModalOpen(false)} className="px-6 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// Standardized component to render a statistic box (used at the top of the page)
const StatCard = ({ label, value, icon: Icon, color, bg, text }) => (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-slate-500 text-sm font-medium">{label}</p>
                <p className={`text-3xl font-extrabold mt-2 text-slate-800`}>{value}</p>
            </div>
            {/* Icon container with a subtle rotation animation on group hover */}
            <div className={`w-14 h-14 ${bg} rounded-2xl flex items-center justify-center transform rotate-3 group-hover:rotate-6 transition-transform`}>
                <Icon className={`w-7 h-7 ${text}`} />
            </div>
        </div>
    </div>
)

// Standardized component to render a metadata field (used inside the View Modal)
const DetailItem = ({ label, value }) => (
    <div className="bg-slate-50 p-3 rounded-xl">
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">{label}</p>
        <div className="text-sm font-semibold text-slate-700 break-words">{value}</div>
    </div>
)

// Adjusts its text based on whether the user is actively searching or if the DB is truly empty.
const EmptyState = ({ searchTerm }) => (
    <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-slate-50 flex items-center justify-center">
            <Search className="w-10 h-10 text-slate-300" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">
            {searchTerm ? "No matches found" : "No stores yet"}
        </h3>
        <p className="text-slate-500 max-w-sm mx-auto">
            {searchTerm 
                ? "We couldn't find any store matching your search. Try checking for typos."
                : "Stores will appear here once they register on the DreamSaver platform."
            }
        </p>
    </div>
)