"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Navigation, MapPin, Store, Search, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

export default function RiderActiveJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/rider/jobs?type=active");
      if (!res.ok) throw new Error("Failed to load active jobs");
      setJobs(await res.json());
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJobs(); }, []);
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const filtered = jobs.filter(job => {
      const term = searchTerm.toLowerCase();
      return (job.goal?.product?.name || "").toLowerCase().includes(term) ||
             (job.trackingNumber || "").toLowerCase().includes(term) ||
             (job.shippingAddress || "").toLowerCase().includes(term);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentItems = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  if (loading) return <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600 w-10 h-10" /></div>;

  return (
    <div className="min-h-[100dvh] bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-5 sm:pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Active Jobs</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">Deliveries currently in progress.</p>
          </div>
          <div className="relative w-full md:w-80">
             <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-[18px] sm:h-[18px]" />
             <input 
                type="text" 
                placeholder="Search Tracking ID, Address..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full pl-10 pr-4 py-2.5 sm:py-2 border border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none shadow-sm transition-shadow bg-white" 
             />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {currentItems.length === 0 ? (
            <div className="col-span-full text-center py-16 sm:py-24 bg-white rounded-2xl sm:rounded-3xl border border-slate-200 border-dashed shadow-sm">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Navigation className="text-slate-400 w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <h3 className="font-bold text-base sm:text-lg text-slate-800">No Active Deliveries</h3>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">You don't have any jobs in progress right now.</p>
            </div>
          ) : (
            currentItems.map((job) => (
              <div key={job.id} onClick={() => router.push(`/rider/delivery/${job.id}`)} className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 overflow-hidden cursor-pointer hover:border-blue-300 hover:shadow-md transition-all flex flex-col h-full group">
                <div className="p-3 sm:p-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-indigo-50/50 shrink-0">
                  <span className="text-[9px] sm:text-[10px] font-bold text-blue-700 uppercase tracking-wider bg-blue-100/50 px-2 py-0.5 sm:py-1 rounded-md border border-blue-200/50 shadow-sm">{job.status.replace("_", " ")}</span>
                  <span className="text-[10px] sm:text-[11px] font-mono font-bold text-slate-500">{job.trackingNumber}</span>
                </div>
                
                <div className="p-4 sm:p-5 lg:p-6 flex-1 flex flex-col justify-center">
                  <h3 className="font-bold text-slate-800 text-base sm:text-lg mb-4 sm:mb-5 line-clamp-2" title={job.goal?.product?.name}>{job.goal?.product?.name}</h3>
                  
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex gap-2.5 sm:gap-3 items-start">
                      <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100 shrink-0">
                        <Store className="text-slate-400 w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <p className="text-xs sm:text-sm font-medium text-slate-600 line-clamp-2 leading-relaxed pt-0.5" title={job.goal?.product?.store?.address}>{job.goal?.product?.store?.address}</p>
                    </div>
                    <div className="flex gap-2.5 sm:gap-3 items-start">
                      <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100 shrink-0">
                        <MapPin className="text-slate-400 w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <p className="text-xs sm:text-sm font-medium text-slate-600 line-clamp-2 leading-relaxed pt-0.5" title={job.shippingAddress}>{job.shippingAddress}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50/50 border-t border-slate-100 p-3 sm:p-4 text-center text-blue-600 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                  Open Job Details <Navigation size={14} className="group-hover:translate-x-1 transition-transform sm:w-[16px] sm:h-[16px]" />
                </div>
              </div>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="p-3 sm:p-4 border border-slate-200 bg-white rounded-xl sm:rounded-2xl flex items-center justify-between mt-6 shadow-sm">
             <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Page {currentPage} of {totalPages}</span>
             <div className="flex gap-1.5 sm:gap-2">
               <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 sm:p-2 border border-slate-200 rounded-md sm:rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors text-slate-600 shadow-sm"><ChevronLeft size={16} className="w-4 h-4 sm:w-[18px] sm:h-[18px]"/></button>
               <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 sm:p-2 border border-slate-200 rounded-md sm:rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors text-slate-600 shadow-sm"><ChevronRight size={16} className="w-4 h-4 sm:w-[18px] sm:h-[18px]"/></button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}