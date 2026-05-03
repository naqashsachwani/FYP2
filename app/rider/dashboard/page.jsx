"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Loader2, MapPin, Package, Check, X, Navigation, Store, Wallet } from "lucide-react";
import toast from "react-hot-toast";

export default function RiderDashboard() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState(null); // ✅ NEW
  const [assignments, setAssignments] = useState([]);
  const [activeJobs, setActiveJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [activeTab, setActiveTab] = useState("REQUESTS"); 

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/rider/dashboard");
      if (res.status === 403) return router.push("/"); 
      const data = await res.json();
      
      setProfile(data.profile); // ✅ NEW
      setAssignments(data.pendingAssignments || []);
      setActiveJobs(data.activeDeliveries || []);
      
      if (data.pendingAssignments?.length === 0 && data.activeDeliveries?.length > 0) {
        setActiveTab("ACTIVE");
      }
    } catch (error) {
      toast.error("Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isLoaded && userId) fetchDashboardData(); }, [isLoaded, userId]);

  const handleAction = async (assignmentId, deliveryId, action) => {
    setProcessingId(assignmentId);
    try {
      const res = await fetch("/api/rider/dashboard", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId, deliveryId, action })
      });
      if (!res.ok) throw new Error("Failed to process request");
      toast.success(action === 'ACCEPT' ? "Delivery Accepted!" : "Delivery Rejected");
      fetchDashboardData(); 
      if (action === 'ACCEPT') setActiveTab("ACTIVE");
    } catch (error) { toast.error(error.message); } finally { setProcessingId(null); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-100"><Loader2 className="animate-spin text-green-600 w-10 h-10" /></div>;

  return (
    <div className="min-h-screen bg-slate-100 pb-20">
      
      <div className="bg-slate-900 text-white rounded-b-3xl shadow-md">
        <div className="max-w-7xl mx-auto p-6 lg:p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-extrabold mb-1">Rider Dashboard</h1>
            <p className="text-slate-400 text-sm lg:text-base">Stay safe on the roads!</p>
          </div>

          {/* ✅ NEW: EARNINGS WIDGET */}
          <div className="bg-slate-800 px-6 py-4 rounded-2xl flex items-center gap-4 border border-slate-700 shadow-inner">
             <div className="p-3 bg-green-500/20 text-green-400 rounded-full">
                 <Wallet size={24} />
             </div>
             <div>
                 <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Total Earnings</p>
                 <p className="text-2xl font-black text-white">Rs {profile?.totalEarnings?.toLocaleString() || 0}</p>
             </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 lg:px-10 pb-6">
          <div className="flex max-w-md bg-slate-800 p-1 rounded-xl">
            <button onClick={() => setActiveTab("REQUESTS")} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === "REQUESTS" ? "bg-green-600 text-white shadow-md" : "text-slate-400 hover:text-white"}`}>
              Requests {assignments.length > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{assignments.length}</span>}
            </button>
            <button onClick={() => setActiveTab("ACTIVE")} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === "ACTIVE" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"}`}>
              Active Jobs {activeJobs.length > 0 && <span className="bg-blue-400 text-white text-[10px] px-2 py-0.5 rounded-full">{activeJobs.length}</span>}
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto mt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* REQUESTS TAB */}
          {activeTab === "REQUESTS" && (
            <>
              {assignments.length === 0 ? (
                <div className="col-span-full text-center py-20 px-4 bg-white rounded-3xl border border-slate-200 border-dashed">
                  <Package size={56} className="text-slate-200 mx-auto mb-4" />
                  <h3 className="font-bold text-lg text-slate-700">No New Requests</h3>
                  <p className="text-sm text-slate-500 mt-1">Waiting for store assignments...</p>
                </div>
              ) : (
                assignments.map((task) => (
                  <div key={task.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
                    <div className="p-5 border-b border-slate-100 bg-orange-50/50 shrink-0">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-orange-600 bg-orange-100 px-2 py-1 rounded mb-2 inline-block">New Request</span>
                      <h3 className="font-bold text-slate-800 text-lg truncate">{task.delivery.goal.product?.name}</h3>
                    </div>
                    
                    <div className="p-5 space-y-5 flex-1">
                      <div className="flex gap-4">
                        <div className="mt-1 flex flex-col items-center"><Store size={20} className="text-blue-500" /><div className="w-0.5 h-8 bg-slate-200 my-1.5"></div></div>
                        <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pickup From</p><p className="text-sm font-semibold text-slate-800 mt-0.5">{task.delivery.goal.product?.store?.name}</p><p className="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">{task.delivery.goal.product?.store?.address}</p></div>
                      </div>
                      <div className="flex gap-4">
                        <div className="mt-1"><MapPin size={20} className="text-green-500" /></div>
                        <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dropoff At</p><p className="text-sm font-semibold text-slate-800 mt-0.5">{task.delivery.goal.user?.name}</p><p className="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">{task.delivery.shippingAddress}</p></div>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 flex gap-3 border-t border-slate-100 shrink-0">
                      <button onClick={() => handleAction(task.id, task.deliveryId, 'REJECT')} disabled={processingId === task.id} className="flex-1 py-3 bg-white border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 flex justify-center items-center gap-2 shadow-sm">{processingId === task.id ? <Loader2 size={18} className="animate-spin" /> : <X size={18} />} Reject</button>
                      <button onClick={() => handleAction(task.id, task.deliveryId, 'ACCEPT')} disabled={processingId === task.id} className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-md shadow-green-200 flex justify-center items-center gap-2">{processingId === task.id ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />} Accept</button>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {/* ACTIVE JOBS TAB */}
          {activeTab === "ACTIVE" && (
            <>
              {activeJobs.length === 0 ? (
                <div className="col-span-full text-center py-20 px-4 bg-white rounded-3xl border border-slate-200 border-dashed">
                  <Navigation size={56} className="text-slate-200 mx-auto mb-4" />
                  <h3 className="font-bold text-lg text-slate-700">No Active Deliveries</h3>
                  <p className="text-sm text-slate-500 mt-1">Accept requests to start delivering.</p>
                </div>
              ) : (
                activeJobs.map((job) => (
                  <div key={job.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden cursor-pointer hover:border-blue-400 hover:shadow-md transition-all flex flex-col h-full group" onClick={() => router.push(`/rider/delivery/${job.id}`)}>
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-blue-50/50 shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">{job.status.replace("_", " ")}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-400 bg-white px-2 py-1 rounded shadow-sm border border-slate-200">{job.trackingNumber}</span>
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-center">
                      <h3 className="font-bold text-slate-800 text-lg mb-5 line-clamp-1">{job.goal.product?.name}</h3>
                      <div className="space-y-4">
                        <div className="flex gap-3 items-start"><Store size={18} className="text-slate-400 mt-0.5 shrink-0" /><p className="text-sm font-medium text-slate-600 line-clamp-2 leading-relaxed">{job.goal.product?.store?.address}</p></div>
                        <div className="flex gap-3 items-start"><MapPin size={18} className="text-slate-400 mt-0.5 shrink-0" /><p className="text-sm font-medium text-slate-600 line-clamp-2 leading-relaxed">{job.shippingAddress}</p></div>
                      </div>
                    </div>
                    <div className="bg-blue-600 p-4 text-center text-white text-sm font-bold flex items-center justify-center gap-2 group-hover:bg-blue-700 transition shrink-0">
                      Open Job Details <Navigation size={18} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}