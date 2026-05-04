"use client";

import { useEffect, useState } from "react";
import { Loader2, History as HistoryIcon, Search, Calendar, CheckCircle, ShieldAlert, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

export default function RiderHistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/rider/jobs?type=history");
      if (!res.ok) throw new Error("Failed to load history");
      setHistory(await res.json());
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const filtered = history.filter(job => {
      const term = searchTerm.toLowerCase();
      return (job.goal?.product?.name || "").toLowerCase().includes(term) ||
             (job.trackingNumber || "").toLowerCase().includes(term);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentItems = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600 w-10 h-10" /></div>;

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Job History</h1>
          <p className="text-slate-500 mt-1">Review your past deliveries.</p>
        </div>
        <div className="relative w-full md:w-72">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
           <input type="text" placeholder="Search tracking ID, product..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        {currentItems.length === 0 ? (
          <div className="p-16 text-center">
            <HistoryIcon size={48} className="text-slate-300 mx-auto mb-4" />
            <h3 className="font-bold text-lg text-slate-700">No History Found</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-extrabold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Delivery Date</th>
                  <th className="px-6 py-4">Tracking Number</th>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentItems.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-500 flex items-center gap-2">
                        <Calendar size={14} /> 
                        {job.deliveryDate ? new Date(job.deliveryDate).toLocaleDateString() : new Date(job.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-700">{job.trackingNumber}</td>
                    <td className="px-6 py-4 font-bold text-slate-900 truncate max-w-[200px]">{job.goal?.product?.name}</td>
                    <td className="px-6 py-4 text-slate-600">{job.goal?.user?.name}</td>
                    <td className="px-6 py-4 text-right">
                       <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border inline-flex items-center gap-1 ${
                          job.status === 'DELIVERED' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-red-50 text-red-700 border-red-200'
                       }`}>
                          {job.status === 'DELIVERED' ? <CheckCircle size={10} /> : <ShieldAlert size={10} />}
                          {job.status}
                       </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
                <span className="text-sm text-slate-500 font-medium">Page {currentPage} of {totalPages}</span>
                <div className="flex gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 bg-white border rounded hover:bg-slate-100 disabled:opacity-50 text-slate-600 transition"><ChevronLeft size={16} /></button>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 bg-white border rounded hover:bg-slate-100 disabled:opacity-50 text-slate-600 transition"><ChevronRight size={16} /></button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}