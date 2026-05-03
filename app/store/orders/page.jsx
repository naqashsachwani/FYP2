'use client'

import { useEffect, useState, useMemo } from "react" 
import Loading from "@/components/Loading" 
import { useAuth } from "@clerk/nextjs" 
import axios from "axios" 
import toast from "react-hot-toast" 
import { Search, MapPin, Truck, CheckCircle, Calendar, Clock, Play, EyeOff, RefreshCw, ChevronLeft, ChevronRight, Filter, Upload, Send } from "lucide-react" 
import dynamic from 'next/dynamic' 

const DeliveryMap = dynamic(() => import('@/components/DeliveryMap'), { 
    ssr: false,
    loading: () => <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-400">Loading Map...</div>
});

export default function StoreOrders() {
    const [orders, setOrders] = useState([]) 
    const [availableRiders, setAvailableRiders] = useState([]) 
    const [loading, setLoading] = useState(true) 
    const [isRefreshing, setIsRefreshing] = useState(false) 
    const [selectedOrder, setSelectedOrder] = useState(null) 
    const [isModalOpen, setIsModalOpen] = useState(false) 
    
    // Assigning Rider State
    const [selectedRiderId, setSelectedRiderId] = useState("");
    const [assigning, setAssigning] = useState(false);

    const [searchTerm, setSearchTerm] = useState("") 
    const [statusFilter, setStatusFilter] = useState("ALL") 
    const [currentPage, setCurrentPage] = useState(1) 
    const ITEMS_PER_PAGE = 10; 

    const { getToken } = useAuth()

    const fetchOrders = async (isManualRefresh = false) => {
       try {
         if (isManualRefresh) setIsRefreshing(true); 
         const token = await getToken()
         const { data } = await axios.get('/api/store/orders', {
            headers: { Authorization: `Bearer ${token}` }
         })
         setOrders(data.orders || []) 
         setAvailableRiders(data.riders || []) 
       } catch (error) {
         toast.error("Failed to fetch orders")
       } finally {
         setLoading(false) 
         setIsRefreshing(false) 
       }
    }    

    const handleAssignRider = async (deliveryId) => {
        if (!selectedRiderId) return toast.error("Please select a rider first");
        setAssigning(true);
        try {
            const token = await getToken();
            await axios.post('/api/store/orders', { action: 'ASSIGN_RIDER', deliveryId, riderId: selectedRiderId }, { headers: { Authorization: `Bearer ${token}` }});
            toast.success("Request sent to Rider!");
            closeModal();
            fetchOrders();
        } catch (error) {
            toast.error("Failed to assign rider");
        } finally {
            setAssigning(false);
        }
    }

    const updateOrderStatus = async (orderId, status, type) => {
       try {
         const token = await getToken();
         if (type === "DELIVERY") {
             await axios.post(`/api/delivery/${orderId}`, { status }, { headers: { Authorization: `Bearer ${token}` }});
         } else {
             await axios.post(`/api/store/orders`, { orderId, status }, { headers: { Authorization: `Bearer ${token}` }});
         }
         const updatedOrders = orders.map(o => o.id === orderId ? { ...o, status } : o);
         setOrders(updatedOrders);
         if (selectedOrder && selectedOrder.id === orderId) setSelectedOrder({ ...selectedOrder, status });
         toast.success(`Order marked as ${status.replace('_', ' ')}`);
       } catch (error) {
         toast.error("Failed to update status");
       }
    }

    const closeModal = () => { 
        setSelectedOrder(null); 
        setSelectedRiderId(""); 
        setIsModalOpen(false); 
    }

    const stats = useMemo(() => {
        return {
            total: orders.length,
            pending: orders.filter(o => o.status === 'PENDING').length,
            transit: orders.filter(o => o.status === 'IN_TRANSIT').length,
            dispatched: orders.filter(o => o.status === 'DISPATCHED').length, 
            delivered: orders.filter(o => o.status === 'DELIVERED').length,
        }
    }, [orders])

    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            const matchesSearch = order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  order.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  order.productName.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === "ALL" || order.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [orders, searchTerm, statusFilter])

    useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter]);

    const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE) || 1;
    const currentOrders = filteredOrders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    
    const openModal = (order) => { setSelectedOrder(order); setIsModalOpen(true); }

    const getStatusStyles = (status) => {
        switch (status) {
            case 'DELIVERED': return 'bg-green-50 text-green-700 border-green-200'
            case 'DISPATCHED': return 'bg-orange-50 text-orange-700 border-orange-200'
            case 'IN_TRANSIT': return 'bg-blue-50 text-blue-700 border-blue-200'
            case 'PENDING': return 'bg-yellow-50 text-yellow-700 border-yellow-200'
            default: return 'bg-gray-50 text-gray-700 border-gray-200'
        }
    }

    const getStatusIcon = (status) => {
        if (status === 'DELIVERED') return <CheckCircle size={20} />
        if (status === 'PENDING') return <Clock size={20} />
        if (status === 'DISPATCHED') return <Upload size={20} />
        return <Truck size={20} />
    }

    useEffect(() => { fetchOrders() }, [])

    if (loading && orders.length === 0) return <Loading />

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">
                
                {/* Header & Toolbars */}
                <div className="mb-8 flex flex-col lg:flex-row justify-between gap-4 items-start lg:items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Order<span className="text-blue-600"> Management</span></h1>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-stretch sm:items-center">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                            <input type="text" placeholder="Search Order..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg outline-none text-sm" />
                        </div>
                        <div className="relative w-full sm:w-44">
                            <Filter className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg outline-none text-sm bg-white cursor-pointer">
                                <option value="ALL">All Statuses</option>
                                <option value="PENDING">Pending</option>
                                <option value="IN_TRANSIT">In Transit</option>
                                <option value="DISPATCHED">Dispatched</option>
                                <option value="DELIVERED">Delivered</option>
                            </select>
                        </div>
                        <button onClick={() => fetchOrders(true)} disabled={isRefreshing} className="p-2 border border-gray-300 rounded-lg bg-white text-gray-600"><RefreshCw size={20} className={isRefreshing ? "animate-spin text-blue-600" : ""} /></button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                    {[
                        { label: 'Total Orders', val: stats.total, icon: '📦', color: 'bg-slate-100' },
                        { label: 'Pending', val: stats.pending, icon: '⏳', color: 'bg-yellow-100' },
                        { label: 'In Transit', val: stats.transit, icon: '🚚', color: 'bg-blue-100' },
                        { label: 'Dispatched', val: stats.dispatched, icon: '📤', color: 'bg-orange-100' }, 
                        { label: 'Delivered', val: stats.delivered, icon: '✅', color: 'bg-green-100' }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center">
                            <div className={`p-3 rounded-lg ${stat.color} mr-3 shrink-0`}>{stat.icon}</div>
                            <div><p className="text-xs text-gray-500 uppercase font-semibold">{stat.label}</p><p className="text-2xl font-bold text-gray-800">{stat.val}</p></div>
                        </div>
                    ))}
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>{["Type", "Tracking #", "Customer", "Product", "Status", "Rider", "Actions"].map((h, i) => <th key={i} className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {currentOrders.length === 0 ? (
                                    <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-400">No orders match your filters.</td></tr>
                                ) : currentOrders.map((order) => (
                                    <tr key={order.id} onClick={() => openModal(order)} className="hover:bg-blue-50/50 cursor-pointer transition-colors">
                                        <td className="px-6 py-4 text-sm font-bold text-gray-500">{order.type === 'DELIVERY' ? <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-[10px]">LOGISTICS</span> : <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-[10px]">STANDARD</span>}</td>
                                        <td className="px-6 py-4 font-mono text-sm text-blue-600 font-medium">{order.trackingNumber}</td>
                                        <td className="px-6 py-4"><div className="text-sm font-semibold text-gray-900">{order.customerName}</div></td>
                                        <td className="px-6 py-4"><span className="text-sm text-gray-700 line-clamp-1 max-w-[200px]">{order.productName}</span></td>
                                        <td className="px-6 py-4">
                                            <select value={order.status} onClick={(e) => e.stopPropagation()} onChange={(e) => updateOrderStatus(order.id, e.target.value, order.type)} className={`text-xs font-bold px-3 py-1.5 rounded-full border-0 outline-none cursor-pointer hover:opacity-90 transition-opacity ${getStatusStyles(order.status)}`}>
                                                <option value="PENDING">Pending</option>
                                                <option value="IN_TRANSIT">In Transit</option>
                                                <option value="DISPATCHED">Dispatched</option>
                                                <option value="DELIVERED">Delivered</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-semibold text-gray-600">
                                            {order.riderName ? order.riderName : order.isWaitingForRider ? <span className="text-yellow-600 bg-yellow-50 px-2 py-1 rounded">Waiting for response</span> : <span className="italic font-normal opacity-50">Unassigned</span>}
                                        </td>
                                        <td className="px-6 py-4"><button className="text-blue-600 hover:text-blue-800 text-sm font-bold flex items-center gap-1">View</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* ✅ NEW: Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                            <span className="text-sm text-gray-500 font-medium">
                                Page <span className="font-bold text-gray-900">{currentPage}</span> of {totalPages}
                            </span>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                                    disabled={currentPage === 1}
                                    className="p-2 border border-gray-300 rounded-lg bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button 
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                                    disabled={currentPage === totalPages}
                                    className="p-2 border border-gray-300 rounded-lg bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* MODAL */}
                {isModalOpen && selectedOrder && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={closeModal}>
                        <div className={`bg-white rounded-2xl w-full ${selectedOrder.type === 'DELIVERY' ? 'max-w-5xl h-[85vh] flex flex-col md:flex-row' : 'max-w-lg h-auto flex flex-col'} shadow-2xl animate-in zoom-in-95 duration-200`} onClick={e => e.stopPropagation()}>
                            
                            <div className={`${selectedOrder.type === 'DELIVERY' ? 'w-full md:w-[400px] border-r' : 'w-full'} bg-white p-6 overflow-y-auto border-gray-100 flex flex-col`}>
                                <div className="flex justify-between items-start mb-1">
                                    <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
                                    {selectedOrder.type !== 'DELIVERY' && <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><EyeOff size={20}/></button>}
                                </div>
                                <p className="text-xs text-gray-400 font-mono mb-6">ID: {selectedOrder.trackingNumber}</p>
                                
                                <div className="space-y-6">
                                    <div className={`p-4 rounded-xl border ${getStatusStyles(selectedOrder.status)}`}>
                                        <div className="flex items-center gap-2 mb-1 font-bold uppercase tracking-wider text-sm">
                                            {getStatusIcon(selectedOrder.status)} {selectedOrder.status.replace('_', ' ')}
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <h3 className="font-bold text-xs text-gray-400 uppercase tracking-widest mb-3">Customer & Product</h3>
                                        <p className="font-bold text-gray-800 text-sm mb-1">{selectedOrder.customerName}</p>
                                        <p className="text-gray-600 text-sm mb-3">{selectedOrder.productName}</p>
                                        
                                        <h3 className="font-bold text-xs text-gray-400 uppercase tracking-widest mt-4 mb-2">Shipping Address</h3>
                                        <div className="flex gap-2 text-sm text-gray-600 bg-white p-3 border border-gray-100 rounded-lg">
                                            <MapPin size={16} className="shrink-0 mt-0.5 text-gray-400" />
                                            <span className="leading-relaxed font-medium">{selectedOrder.address}</span>
                                        </div>
                                    </div>
                                    
                                    {selectedOrder.type === 'DELIVERY' && selectedOrder.status === 'PENDING' && !selectedOrder.riderName && (
                                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                                            <h3 className="font-bold text-xs text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-2"><Truck size={14}/> Dispatch Logistics</h3>
                                            
                                            {selectedOrder.isWaitingForRider ? (
                                                <p className="text-sm font-bold text-blue-800 text-center py-2 bg-blue-100 rounded-lg">Request sent! Waiting for Rider.</p>
                                            ) : (
                                                <div className="space-y-3">
                                                    <select value={selectedRiderId} onChange={(e) => setSelectedRiderId(e.target.value)} className="w-full text-sm p-3 rounded-lg border border-blue-200 outline-none">
                                                        <option value="">-- Select an Available Rider --</option>
                                                        {availableRiders.map(rider => (
                                                            <option key={rider.id} value={rider.id}>{rider.user?.name} - {rider.vehicleType}</option>
                                                        ))}
                                                    </select>
                                                    <button onClick={() => handleAssignRider(selectedOrder.id)} disabled={assigning || !selectedRiderId} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg flex justify-center items-center gap-2 hover:bg-blue-700 disabled:opacity-50">
                                                        <Send size={16}/> Send Request
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {selectedOrder.riderName && (
                                       <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                                            <h3 className="font-bold text-xs text-green-600 uppercase tracking-widest mb-1">Assigned Rider</h3>
                                            <p className="font-bold text-green-800 text-sm flex items-center gap-2"><Truck size={16}/> {selectedOrder.riderName}</p>
                                       </div>
                                    )}
                                </div>
                            </div>

                            {selectedOrder.type === 'DELIVERY' && (
                                <div className="flex-1 bg-gray-100 relative min-h-[300px]">
                                    <DeliveryMap delivery={selectedOrder.raw} />
                                    <button onClick={closeModal} className="absolute top-4 right-4 bg-white hover:bg-gray-100 text-gray-500 p-2 rounded-full shadow-md z-[1000] transition-colors border border-gray-200 flex items-center justify-center w-10 h-10 font-bold">✕</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}