"use client";

import { useEffect, useState } from "react";
import { Loader2, Package, MapPin, Store, Check, X, Search, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

export default function RiderRequestsPage() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/rider/jobs?type=pending");
      if (!res.ok) throw new Error("Failed to load requests");
      setAssignments(await res.json());
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const handleAction = async (assignmentId, deliveryId, action) => {
    setProcessingId(assignmentId);
    try {
      const res = await fetch("/api/rider/dashboard", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId, deliveryId, action })
      });
      if (!res.ok) throw new Error("Failed to process");
      toast.success(action === 'ACCEPT' ? "Delivery Accepted!" : "Delivery Rejected");
      fetchRequests(); 
    } catch (error) { toast.error(error.message); } 
    finally { setProcessingId(null); }
  };

  const filtered = assignments.filter(task => {
      const term = searchTerm.toLowerCase();
      return (task.delivery?.goal?.product?.name || "").toLowerCase().includes(term) ||
             (task.delivery?.goal?.product?.store?.name || "").toLowerCase().includes(term) ||
             (task.delivery?.shippingAddress || "").toLowerCase().includes(term);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentItems = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-green-600 w-10 h-10" /></div>;

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Delivery Requests</h1>
          <p className="text-slate-500 mt-1">Accept or reject incoming delivery assignments.</p>
        </div>
        <div className="relative w-full md:w-72">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
           <input type="text" placeholder="Search product, store, area..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentItems.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed">
            <Package size={48} className="text-slate-300 mx-auto mb-4" />
            <h3 className="font-bold text-lg text-slate-700">No Pending Requests</h3>
          </div>
        ) : (
          currentItems.map((task) => (
            <div key={task.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full hover:shadow-md transition">
              <div className="p-5 border-b border-slate-100 bg-orange-50/50 shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-widest text-orange-600 bg-orange-100 px-2 py-1 rounded mb-2 inline-block">New Request</span>
                <h3 className="font-bold text-slate-800 text-lg truncate">{task.delivery.goal.product?.name}</h3>
              </div>
              <div className="p-5 space-y-5 flex-1">
                <div className="flex gap-4">
                  <div className="mt-1 flex flex-col items-center"><Store size={20} className="text-blue-500" /><div className="w-0.5 h-8 bg-slate-200 my-1.5"></div></div>
                  <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pickup</p><p className="text-sm font-semibold text-slate-800 mt-0.5">{task.delivery.goal.product?.store?.name}</p><p className="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">{task.delivery.goal.product?.store?.address}</p></div>
                </div>
                <div className="flex gap-4">
                  <div className="mt-1"><MapPin size={20} className="text-green-500" /></div>
                  <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dropoff</p><p className="text-sm font-semibold text-slate-800 mt-0.5">{task.delivery.goal.user?.name}</p><p className="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">{task.delivery.shippingAddress}</p></div>
                </div>
              </div>
              <div className="p-4 bg-slate-50 flex gap-3 border-t border-slate-100 shrink-0">
                <button onClick={() => handleAction(task.id, task.deliveryId, 'REJECT')} disabled={processingId === task.id} className="flex-1 py-2.5 bg-white border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 flex justify-center items-center gap-2 shadow-sm">{processingId === task.id ? <Loader2 size={18} className="animate-spin" /> : <X size={18} />} Reject</button>
                <button onClick={() => handleAction(task.id, task.deliveryId, 'ACCEPT')} disabled={processingId === task.id} className="flex-1 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-md shadow-green-200 flex justify-center items-center gap-2">{processingId === task.id ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />} Accept</button>
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="p-4 border border-slate-200 bg-white rounded-xl flex items-center justify-between mt-6">
           <span className="text-sm text-slate-500 font-medium">Page {currentPage} of {totalPages}</span>
           <div className="flex gap-2">
             <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 border rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"><ChevronLeft size={18} /></button>
             <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 border rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"><ChevronRight size={18} /></button>
           </div>
        </div>
      )}
    </div>
  );
}