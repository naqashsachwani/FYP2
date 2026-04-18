'use client'
import { useEffect, useState, useMemo } from "react"
import Loading from "@/components/Loading"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import toast from "react-hot-toast"
import { Search, MapPin, Truck, CheckCircle, Calendar, Clock, Store, Play, EyeOff, RefreshCw, ChevronLeft, ChevronRight, Filter } from "lucide-react" 
import dynamic from 'next/dynamic'

const DeliveryMap = dynamic(() => import('@/components/DeliveryMap'), { 
    ssr: false,
    loading: () => <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-400">Loading Map...</div>
});

export default function StoreOrders() {
    const [orders, setOrders] = useState([]) 
    const [loading, setLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    
    // Filtering & Pagination State
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("ALL")
    const [currentPage, setCurrentPage] = useState(1)
    const ITEMS_PER_PAGE = 10;

    const { getToken } = useAuth()

    const fetchOrders = async (isManualRefresh = false) => {
       try {
         if (isManualRefresh) setIsRefreshing(true);
         const token = await getToken()
         const { data } = await axios.get('/api/store/deliveries', {
            headers: { Authorization: `Bearer ${token}` }
         })
         setOrders(data.deliveries || [])
       } catch (error) {
         toast.error("Failed to fetch orders")
       } finally {
         setLoading(false)
         setIsRefreshing(false)
       }
    }    

    const updateOrderStatus = async (deliveryId, status) => {
       try {
         const token = await getToken()
         await axios.post(`/api/delivery/${deliveryId}`, { status }, {
            headers: { Authorization: `Bearer ${token}` }
         })
         
         const updatedOrders = orders.map(o => o.id === deliveryId ? { ...o, status } : o);
         setOrders(updatedOrders);
         
         if (selectedOrder && selectedOrder.id === deliveryId) {
             setSelectedOrder({ ...selectedOrder, status });
         }
         toast.success(`Order marked as ${status}`)
       } catch (error) {
         toast.error("Failed to update status")
       }
    }

    // --- SIMULATION LOGIC ---
    const handleManualUpdate = async (deliveryId) => {
        const lat = 24.8607 + (Math.random() * 0.04 - 0.02); 
        const lng = 67.0011 + (Math.random() * 0.04 - 0.02);
        
        await updateLocation(deliveryId, lat, lng, "Simulated Driver");
        toast.success("Driver Location Updated 📍");
    };

    const handleHideStatus = async (deliveryId) => {
        await updateLocation(deliveryId, null, null, null);
        toast.success("Driver Hidden 🙈");
    };

    const closeModal = () => { 
        setSelectedOrder(null); 
        setIsModalOpen(false); 
    }

    const updateLocation = async (id, lat, lng, source) => {
        const token = await getToken();
        
        await axios.post(`/api/delivery/${id}`, {
            latitude: lat,
            longitude: lng,
            location: source
        }, { headers: { Authorization: `Bearer ${token}` } });

        setSelectedOrder(prev => {
            if (!prev) return null;
            return {
                ...prev,
                latitude: lat, 
                longitude: lng  
            }
        });
    }
 
    // Stats calculation
    const stats = useMemo(() => {
        return {
            total: orders.length,
            delivered: orders.filter(o => o.status === 'DELIVERED').length,
            transit: orders.filter(o => o.status === 'IN_TRANSIT').length,
            dispatched: orders.filter(o => o.status === 'DISPATCHED').length, 
            pending: orders.filter(o => o.status === 'PENDING').length,
        }
    }, [orders])

    // 1. Filter Orders (Search + Status)
    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            const matchesSearch = order.goal?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  order.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === "ALL" || order.status === statusFilter;
            
            return matchesSearch && matchesStatus;
        });
    }, [orders, searchTerm, statusFilter])

    // Reset to page 1 whenever filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter]);

    // 2. Paginate Orders
    const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE) || 1;
    const currentOrders = filteredOrders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const openModal = (order) => { setSelectedOrder(order); setIsModalOpen(true); }

    const getStatusStyles = (status) => {
        switch (status) {
            case 'DELIVERED': return 'bg-green-50 text-green-700 border-green-200'
            case 'IN_TRANSIT': return 'bg-blue-50 text-blue-700 border-blue-200'
            case 'DISPATCHED': return 'bg-orange-50 text-orange-700 border-orange-200'
            case 'PENDING': return 'bg-yellow-50 text-yellow-700 border-yellow-200'
            default: return 'bg-gray-50 text-gray-700 border-gray-200'
        }
    }

    const getStatusIcon = (status) => {
        if (status === 'DELIVERED') return <CheckCircle size={20} />
        if (status === 'PENDING') return <Clock size={20} />
        return <Truck size={20} />
    }

    useEffect(() => { fetchOrders() }, [])

    if (loading && orders.length === 0) return <Loading />

    const isDelivered = selectedOrder?.status === 'DELIVERED';

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
                {/* HEADER & CONTROLS */}
                <div className="mb-8 flex flex-col lg:flex-row justify-between gap-4 items-start lg:items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Order<span className="text-blue-600"> Management</span></h1>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-stretch sm:items-center">
                        
                        {/* Search Bar */}
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                            <input 
                                type="text" 
                                placeholder="Search Name or Tracking #..." 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)} 
                                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="relative w-full sm:w-44">
                            <Filter className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                            <select 
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm appearance-none bg-white text-gray-700 cursor-pointer"
                            >
                                <option value="ALL">All Statuses</option>
                                <option value="PENDING">Pending</option>
                                <option value="DISPATCHED">Dispatched</option>
                                <option value="IN_TRANSIT">In Transit</option>
                                <option value="DELIVERED">Delivered</option>
                            </select>
                        </div>

                        {/* Refresh Button */}
                        <button 
                            onClick={() => fetchOrders(true)} 
                            disabled={isRefreshing}
                            className="p-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-gray-600 transition-colors flex items-center justify-center disabled:opacity-50"
                            title="Refresh Orders"
                        >
                            <RefreshCw size={20} className={isRefreshing ? "animate-spin text-blue-600" : ""} />
                        </button>
                    </div>
                </div>

                {/* STATS */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                    {[
                        { label: 'Total Orders', val: stats.total, icon: '📦', color: 'bg-blue-100' },
                        { label: 'Delivered', val: stats.delivered, icon: '✅', color: 'bg-green-100' },
                        { label: 'In Transit', val: stats.transit, icon: '🚚', color: 'bg-purple-100' },
                        { label: 'Dispatched', val: stats.dispatched, icon: '📤', color: 'bg-orange-100' }, 
                        { label: 'Pending', val: stats.pending, icon: '⏳', color: 'bg-yellow-100' }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center">
                            <div className={`p-3 rounded-lg ${stat.color} mr-3 shrink-0`}>{stat.icon}</div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold">{stat.label}</p>
                                <p className="text-2xl font-bold text-gray-800">{stat.val}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* TABLE */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>{["Tracking #", "Customer", "Product", "Scheduled", "Status", "Actions"].map((h, i) => <th key={i} className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {currentOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                                            No orders match your filters.
                                        </td>
                                    </tr>
                                ) : currentOrders.map((order) => (
                                    <tr key={order.id} onClick={() => openModal(order)} className="hover:bg-blue-50/50 cursor-pointer transition-colors">
                                        <td className="px-6 py-4 font-mono text-sm text-blue-600 font-medium">{order.trackingNumber}</td>
                                        <td className="px-6 py-4"><div className="text-sm font-semibold text-gray-900">{order.goal?.user?.name}</div></td>
                                        <td className="px-6 py-4"><span className="text-sm text-gray-700">{order.goal?.product?.name}</span></td>
                                        <td className="px-6 py-4 text-sm text-gray-600 font-medium">{new Date(order.estimatedDate).toLocaleDateString('en-GB')}</td>
                                        <td className="px-6 py-4">
                                            <select 
                                                value={order.status} 
                                                onClick={(e) => e.stopPropagation()} 
                                                onChange={(e) => updateOrderStatus(order.id, e.target.value)} 
                                                className={`text-xs font-bold px-3 py-1.5 rounded-full border-0 outline-none cursor-pointer hover:opacity-90 transition-opacity ${getStatusStyles(order.status)}`}
                                            >
                                                <option value="PENDING">Pending</option>
                                                <option value="DISPATCHED">Dispatched</option>
                                                <option value="IN_TRANSIT">In Transit</option>
                                                <option value="DELIVERED">Delivered</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4"><button className="text-blue-600 hover:text-blue-800 text-sm font-bold flex items-center gap-1">View</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINATION CONTROLS */}
                    {totalPages > 1 && (
                        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between shrink-0">
                            <span className="text-sm text-gray-500 font-medium">
                                Showing <span className="font-bold text-gray-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-bold text-gray-900">{Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders.length)}</span> of <span className="font-bold text-gray-900">{filteredOrders.length}</span> orders
                            </span>
                            
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                                    disabled={currentPage === 1}
                                    className="p-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-100 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <span className="flex items-center px-4 text-sm font-semibold text-gray-700">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button 
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                                    disabled={currentPage === totalPages}
                                    className="p-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-100 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* MODAL */}
                {isModalOpen && selectedOrder && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={closeModal}>
                        <div className="bg-white rounded-2xl w-full max-w-5xl h-[85vh] overflow-hidden flex flex-col md:flex-row shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                            
                            <div className="w-full md:w-[400px] bg-white p-6 overflow-y-auto border-r border-gray-100 flex flex-col">
                                <h2 className="text-xl font-bold mb-1 text-gray-900">Order Details</h2>
                                <p className="text-xs text-gray-400 font-mono mb-6">ID: {selectedOrder.trackingNumber}</p>
                                
                                <div className="space-y-6">
                                    <div className={`p-4 rounded-xl border ${getStatusStyles(selectedOrder.status)}`}>
                                        <div className="flex items-center gap-2 mb-1 font-bold uppercase">
                                            {getStatusIcon(selectedOrder.status)} {selectedOrder.status.replace('_', ' ')}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs opacity-80 mt-2">
                                            <Calendar size={12} />
                                            {isDelivered 
                                                ? `Delivered on ${new Date(selectedOrder.updatedAt).toLocaleDateString('en-GB')}`
                                                : `Est. Delivery: ${new Date(selectedOrder.estimatedDate).toDateString()}` 
                                            }
                                        </div>
                                    </div>

                                    {/* SIMULATION BUTTONS: Only show if status is EXACTLY 'DISPATCHED' */}
                                    {selectedOrder.status === 'DISPATCHED' && (
                                        <div className="border-t border-gray-100 pt-5">
                                            <h3 className="font-bold text-sm text-gray-700 mb-3 flex items-center gap-2"><Truck size={16}/> Driver Positioning</h3>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button 
                                                    onClick={() => handleManualUpdate(selectedOrder.id)} 
                                                    className="w-full py-3 rounded-lg text-sm font-bold flex justify-center items-center gap-2 transition-all bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 shadow-sm"
                                                >
                                                    <Play size={16}/> Update Map
                                                </button>
                                                <button 
                                                    onClick={() => handleHideStatus(selectedOrder.id)} 
                                                    className="w-full py-3 rounded-lg text-sm font-bold flex justify-center items-center gap-2 transition-all bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 shadow-sm"
                                                >
                                                    <EyeOff size={16}/> Hide Driver
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <h3 className="font-bold text-sm text-gray-700 mb-2">Shipping Address</h3>
                                        <div className="flex gap-2 text-sm text-gray-600">
                                            <MapPin size={16} className="shrink-0 mt-0.5 text-gray-400" />
                                            <span className="leading-relaxed font-medium">{selectedOrder.shippingAddress}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 bg-gray-100 relative min-h-[300px]">
                                <DeliveryMap delivery={selectedOrder} />
                                <button onClick={closeModal} className="absolute top-4 right-4 bg-white hover:bg-gray-100 text-gray-500 p-2 rounded-full shadow-md z-[1000] transition-colors border border-gray-200">
                                    <EyeOff className="hidden"/> ✕
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}