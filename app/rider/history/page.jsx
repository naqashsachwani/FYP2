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

  if (loading) return <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600 w-10 h-10" /></div>;

  return (
    <div className="min-h-[100dvh] bg-slate-50 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-5 sm:pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Job History</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Review your past deliveries.</p>
        </div>
        <div className="relative w-full md:w-72">
           <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-[18px] sm:h-[18px]" />
           <input 
              type="text" 
              placeholder="Search tracking ID, product..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full pl-10 pr-4 py-2.5 sm:py-2 border border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-shadow shadow-sm bg-white" 
           />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden flex flex-col min-h-[300px]">
        {currentItems.length === 0 ? (
          <div className="p-12 sm:p-16 text-center flex-1 flex flex-col items-center justify-center">
            <HistoryIcon className="text-slate-300 mx-auto mb-3 sm:mb-4 w-10 h-10 sm:w-12 sm:h-12" />
            <h3 className="font-bold text-base sm:text-lg text-slate-700">No History Found</h3>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap min-w-[650px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[9px] sm:text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="px-4 sm:px-6 py-3 sm:py-4">Delivery Date</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4">Tracking Number</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4">Product</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4">Customer</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentItems.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-slate-500 text-[11px] sm:text-sm flex items-center gap-1.5 sm:gap-2">
                        <Calendar size={14} className="shrink-0 w-3.5 h-3.5 sm:w-4 sm:h-4" /> 
                        {job.deliveryDate ? new Date(job.deliveryDate).toLocaleDateString() : new Date(job.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 font-mono font-bold text-[11px] sm:text-sm text-slate-700">{job.trackingNumber}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 font-bold text-[11px] sm:text-sm text-slate-900 truncate max-w-[150px] sm:max-w-[200px]" title={job.goal?.product?.name}>{job.goal?.product?.name}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-[11px] sm:text-sm text-slate-600">{job.goal?.user?.name}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                       <span className={`px-2 sm:px-2.5 py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider rounded-full border inline-flex items-center gap-1 shadow-sm ${
                          job.status === 'DELIVERED' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-red-50 text-red-700 border-red-200'
                       }`}>
                          {job.status === 'DELIVERED' ? <CheckCircle size={10} className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" /> : <ShieldAlert size={10} className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />}
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
            <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0 rounded-b-2xl sm:rounded-b-3xl">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Page {currentPage} of {totalPages}</span>
                <div className="flex gap-1.5 sm:gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 sm:p-2 bg-white border border-slate-200 rounded-md sm:rounded-lg hover:bg-slate-50 disabled:opacity-50 text-slate-600 transition shadow-sm"><ChevronLeft size={16} className="w-4 h-4 sm:w-[18px] sm:h-[18px]" /></button>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 sm:p-2 bg-white border border-slate-200 rounded-md sm:rounded-lg hover:bg-slate-50 disabled:opacity-50 text-slate-600 transition shadow-sm"><ChevronRight size={16} className="w-4 h-4 sm:w-[18px] sm:h-[18px]" /></button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}