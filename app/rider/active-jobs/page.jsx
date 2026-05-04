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

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600 w-10 h-10" /></div>;

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Active Jobs</h1>
          <p className="text-slate-500 mt-1">Deliveries currently in progress.</p>
        </div>
        <div className="relative w-full md:w-72">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
           <input type="text" placeholder="Search Tracking ID, Address..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentItems.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed">
            <Navigation size={48} className="text-slate-300 mx-auto mb-4" />
            <h3 className="font-bold text-lg text-slate-700">No Active Deliveries</h3>
          </div>
        ) : (
          currentItems.map((job) => (
            <div key={job.id} onClick={() => router.push(`/rider/delivery/${job.id}`)} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden cursor-pointer hover:border-blue-400 hover:shadow-md transition-all flex flex-col h-full group">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-blue-50/50 shrink-0">
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">{job.status.replace("_", " ")}</span>
                <span className="text-xs font-mono font-bold text-slate-400 bg-white px-2 py-1 rounded shadow-sm border border-slate-200">{job.trackingNumber}</span>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-center">
                <h3 className="font-bold text-slate-800 text-lg mb-5 line-clamp-1">{job.goal?.product?.name}</h3>
                <div className="space-y-4">
                  <div className="flex gap-3 items-start"><Store size={18} className="text-slate-400 mt-0.5 shrink-0" /><p className="text-sm font-medium text-slate-600 line-clamp-2 leading-relaxed">{job.goal?.product?.store?.address}</p></div>
                  <div className="flex gap-3 items-start"><MapPin size={18} className="text-slate-400 mt-0.5 shrink-0" /><p className="text-sm font-medium text-slate-600 line-clamp-2 leading-relaxed">{job.shippingAddress}</p></div>
                </div>
              </div>
              <div className="bg-slate-900 p-4 text-center text-white text-sm font-bold flex items-center justify-center gap-2 group-hover:bg-blue-600 transition shrink-0">
                Open Job Details <Navigation size={18} className="group-hover:translate-x-1 transition-transform" />
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