"use client";

import { useEffect, useState, useMemo } from "react";
import { Loader2, AlertCircle, PlusCircle, CheckCircle, MessageSquareWarning, X, Package, ShieldAlert, Lock, Clock, User, Truck, ChevronDown, Check, Hash, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@clerk/nextjs";

export default function StoreRequestsPage() {
  const { isLoaded, userId } = useAuth();
  
  const [requests, setRequests] = useState([]); 
  const [activeGoals, setActiveGoals] = useState([]); 
  const [loading, setLoading] = useState(true); 

  const [filterStatus, setFilterStatus] = useState("ALL"); // ✅ NEW: Filter State
  const [currentPage, setCurrentPage] = useState(1);       // ✅ NEW: Pagination State
  const ITEMS_PER_PAGE = 5;

  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [isOrderDropdownOpen, setIsOrderDropdownOpen] = useState(false); 
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [formData, setFormData] = useState({
    title: "",
    type: "PRICE_LOCK", 
    goalId: "",
    targetUserId: "",
    description: ""
  });

  const fetchData = async () => {
    try {
      const res = await fetch("/api/store/request");
      if (!res.ok) throw new Error("Failed to load data");
      const data = await res.json();
      setRequests(data.requests); 
      setActiveGoals(data.activeGoals); 
    } catch (error) {
      toast.error("Could not load requests.");
    } finally {
      setLoading(false); 
    }
  };

  useEffect(() => {
    if (isLoaded && userId) fetchData();
  }, [isLoaded, userId]);

  // Reset pagination when filter changes
  useEffect(() => { setCurrentPage(1); }, [filterStatus]);

  useEffect(() => {
      if (formData.goalId) {
          const selectedGoal = activeGoals.find(g => g.id === formData.goalId);
          let newTargetId = "";

          if (formData.type === "USER_BEHAVIOR" && selectedGoal?.user?.id) {
              newTargetId = selectedGoal.user.id;
          } else if (formData.type === "RIDER_ISSUE" && selectedGoal?.delivery?.rider?.user?.id) {
              newTargetId = selectedGoal.delivery.rider.user.id;
          } else if (formData.type === "PRICE_LOCK" && selectedGoal?.user?.id) {
              newTargetId = selectedGoal.user.id;
          }

          setFormData(prev => ({ ...prev, targetUserId: newTargetId }));
      } else {
          setFormData(prev => ({ ...prev, targetUserId: "" }));
      }
  }, [formData.goalId, formData.type, activeGoals]);

  // ✅ FILTER LOGIC
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      if (filterStatus === "ALL") return true;
      if (filterStatus === "IN_PROGRESS") return req.status === "OPEN" || req.status === "IN_PROGRESS";
      return req.status === filterStatus;
    });
  }, [requests, filterStatus]);

  // ✅ PAGINATION LOGIC
  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / ITEMS_PER_PAGE));
  const currentRequests = filteredRequests.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    
    if (formData.type === "RIDER_ISSUE" && formData.goalId && !formData.targetUserId) {
        return toast.error("No rider is assigned to this order yet.");
    }

    setIsSubmitting(true); 
    const toastId = toast.loading("Submitting request..."); 

    try {
      const res = await fetch("/api/store/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error);
      }

      const responseData = await res.json();
      
      toast.success(`Ticket ${responseData.request?.complaintId || responseData.request?.id.slice(-6).toUpperCase()} filed.`, { id: toastId });
      
      setIsModalOpen(false);
      setFormData({ title: "", type: "PRICE_LOCK", goalId: "", targetUserId: "", description: "" });
      fetchData(); 

    } catch (error) {
      toast.error(error.message || "Failed to submit request", { id: toastId });
    } finally {
      setIsSubmitting(false); 
    }
  };

  const getProgressSteps = (status) => {
    return [
      { label: "Submitted", active: true }, 
      { label: "Under Review", active: ["IN_PROGRESS", "RESOLVED", "REJECTED"].includes(status) },
      { label: status === "REJECTED" ? "Rejected" : "Resolved", active: ["RESOLVED", "REJECTED"].includes(status), isError: status === "REJECTED" }
    ];
  };

  if (loading || !isLoaded) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-indigo-600 w-10 h-10" /></div>;
  }

  const selectedGoal = activeGoals.find(g => g.id === formData.goalId); 

  return (
    <div className="p-6 md:p-8 text-slate-800 w-full">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <MessageSquareWarning className="text-indigo-600 w-7 h-7" /> 
              Store Requests & Support
            </h1>
            <p className="text-slate-500 mt-1 text-sm">Manage price lock requests or report buyer/rider issues to Admin.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-sm flex items-center gap-2 text-sm"
          >
            <PlusCircle size={18} /> New Request
          </button>
        </div>

        {/* ✅ NEW: DROPDOWN FILTER BAR */}
        {requests.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
            <div className="text-sm font-medium text-slate-500 w-full sm:w-auto text-center sm:text-left">
              Showing <span className="font-bold text-slate-700">{filteredRequests.length}</span> requests
            </div>
            <div className="relative w-full sm:w-48">
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 appearance-none outline-none cursor-pointer">
                <option value="ALL">All Statuses</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="REJECTED">Rejected</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          {requests.length === 0 ? (
            <div className="text-center py-16 px-4">
              <CheckCircle className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-700">No Requests Found</h3>
              <p className="text-slate-500 mt-1 text-sm">You haven't made any requests or complaints yet.</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-16 px-4 bg-slate-50/50">
              <Filter className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-800">No Matches Found</h3>
              <p className="text-sm text-slate-500 mt-1 mb-4">We couldn't find any requests matching your current filters.</p>
              <button onClick={() => setFilterStatus("ALL")} className="text-sm font-bold text-indigo-600 hover:underline">Clear Filters</button>
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-100 flex-1">
                {currentRequests.map((req) => (
                  <div key={req.id} className="p-6 hover:bg-slate-50 transition flex flex-col xl:flex-row gap-8 justify-between">
                    
                    <div className="flex-1 space-y-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-xs font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-md flex items-center gap-1 border border-slate-200">
                            <Hash size={14} className="text-slate-400" />
                            {req.complaintId || req.id.slice(-6).toUpperCase()}
                        </span>
                        <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider bg-slate-100 px-3 py-1 rounded-full flex items-center gap-1">
                          {req.type === "PRICE_LOCK" ? <Lock size={12} /> : req.type === "RIDER_ISSUE" ? <Truck size={12} /> : <AlertCircle size={12} />}
                          {req.type.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock size={14} /> {new Date(req.createdAt).toLocaleDateString('en-GB')}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-lg font-bold text-slate-900">{req.title}</h4>
                        <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{req.description}</p>
                      </div>
                      
                      {req.goal && (
                        <div className="inline-flex flex-wrap items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg text-xs font-medium text-slate-600 border border-slate-200">
                          <Package size={14} className="text-indigo-500" />
                          <span>Product: <span className="font-bold text-slate-800">{req.goal.product?.name}</span></span>
                          <span className="text-slate-300">|</span>
                          <span>Target: <span className="font-mono text-indigo-600 font-bold">Rs {Number(req.goal.targetAmount).toLocaleString()}</span></span>
                          
                          {req.targetUser && (
                            <>
                              <span className="text-slate-300">|</span>
                              <span>Target: <span className="font-bold text-slate-800">{req.targetUser.name}</span></span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="w-full xl:w-80 shrink-0 flex flex-col gap-4">
                      
                      <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase mb-4 text-center tracking-wider">Request Status</p>
                        <div className="flex justify-between items-center relative px-2">
                          
                          <div className="absolute top-1/2 left-4 right-4 h-1 bg-slate-100 -z-10 -translate-y-1/2 rounded-full"></div>
                          
                          {getProgressSteps(req.status).map((step, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-1.5 bg-white px-1 relative z-10">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${
                                 step.isError && step.active ? "bg-red-50 border-red-500 text-red-600"  
                                 : step.active ? "bg-indigo-50 border-indigo-500 text-indigo-600"  
                                 : "bg-slate-50 border-slate-200 text-slate-300" 
                              }`}>
                                {step.isError ? <ShieldAlert size={14} /> : <CheckCircle size={14} />}
                              </div>
                              <span className={`text-[10px] font-bold uppercase tracking-wide ${step.active ? (step.isError ? "text-red-600" : "text-indigo-600") : "text-slate-400"}`}>
                                {step.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {req.adminNotes && (
                        <div className={`p-4 rounded-xl border text-sm ${req.status === 'REJECTED' ? 'bg-red-50 border-red-100 text-red-900' : 'bg-indigo-50 border-indigo-100 text-indigo-900'}`}>
                          <p className={`text-[10px] tracking-wider font-bold uppercase mb-1.5 ${req.status === 'REJECTED' ? 'text-red-700' : 'text-indigo-700'}`}>
                            Admin Decision
                          </p>
                          <p className="leading-relaxed">{req.adminNotes}</p>
                        </div>
                      )}
                    </div>

                  </div>
                ))}
              </div>

              {/* ✅ NEW: PAGINATION FOOTER */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 rounded-b-2xl">
                    <span className="text-sm text-slate-500 font-medium">
                        Showing <span className="font-bold text-slate-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-bold text-slate-900">{Math.min(currentPage * ITEMS_PER_PAGE, filteredRequests.length)}</span> of <span className="font-bold text-slate-900">{filteredRequests.length}</span> requests
                    </span>
                    <div className="flex gap-2">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="flex items-center gap-1 px-3 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 text-slate-600 transition text-sm font-bold">
                            <ChevronLeft size={16} /> Prev
                        </button>
                        <div className="flex items-center justify-center px-4 font-bold text-sm text-slate-700 bg-slate-50 rounded-lg border border-slate-100">
                            {currentPage} / {totalPages}
                        </div>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="flex items-center gap-1 px-3 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 text-slate-600 transition text-sm font-bold">
                            Next <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden my-8">
            
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="font-bold text-xl text-slate-900 flex items-center gap-2">
                <ShieldAlert className="text-indigo-600" /> Admin Support Request
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-full transition"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Request Type</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm"
                  >
                    <option value="PRICE_LOCK">Price Lock Adjustment</option>
                    <option value="USER_BEHAVIOR">Report Buyer (Customer)</option>
                    <option value="RIDER_ISSUE">Report Rider (Logistics)</option>
                    <option value="OTHER">Other Platform Issue</option>
                  </select>
                </div>

                <div className="relative">
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Related Active Goal</label>
                  <button 
                    type="button" 
                    onClick={() => setIsOrderDropdownOpen(!isOrderDropdownOpen)} 
                    className="w-full border border-slate-300 p-3 rounded-xl flex justify-between items-center hover:border-slate-400 transition-all text-left text-sm bg-white"
                  >
                    <span className="truncate text-slate-800">{selectedGoal ? selectedGoal.product?.name : "-- Select Goal --"}</span>
                    <ChevronDown className={`text-slate-400 transition-transform shrink-0 ml-2 ${isOrderDropdownOpen ? 'rotate-180' : ''}`} size={16} />
                  </button>

                  {isOrderDropdownOpen && (
                    <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 max-h-60 overflow-y-auto p-1.5 animate-in zoom-in-95">
                      <button type="button" onClick={() => { setFormData({...formData, goalId: ""}); setIsOrderDropdownOpen(false); }} className="w-full p-2 rounded-lg text-left hover:bg-slate-50 text-[11px] font-bold text-slate-400 mb-1">
                        -- Clear Selection --
                      </button>
                      
                      {activeGoals.map(g => {
                         let tag = "";
                         if (formData.type === "RIDER_ISSUE") {
                             tag = g.delivery?.rider?.user?.name ? `Rider: ${g.delivery.rider.user.name}` : `No Rider`;
                         } else {
                             tag = `Buyer: ${g.user?.name}`;
                         }
                         
                         const delDate = g.delivery?.deliveryDate ? new Date(g.delivery.deliveryDate).toLocaleDateString('en-GB') : 'Not Delivered';
                         
                         return (
                           <button 
                             key={g.id} 
                             type="button" 
                             onClick={() => { setFormData({...formData, goalId: g.id}); setIsOrderDropdownOpen(false); }} 
                             className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all mb-1 hover:bg-indigo-50 group ${formData.goalId === g.id ? 'bg-indigo-50' : ''}`}
                           >
                             <div className="w-10 h-10 bg-slate-100 rounded overflow-hidden shrink-0 border border-slate-200">
                               <img src={g.product?.images?.[0] || "/placeholder.png"} className="w-full h-full object-cover" alt="Product" />
                             </div>
                             <div className="flex-1 min-w-0 text-left space-y-0.5">
                               <p className="text-xs font-bold text-slate-800 truncate">{g.product?.name}</p>
                               <p className="text-[10px] text-slate-500 font-medium truncate">{tag}</p>
                               <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Delivery: {delDate}</p>
                             </div>
                             {formData.goalId === g.id && <Check className="text-indigo-600 shrink-0" size={16} />}
                           </button>
                         );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {formData.type === "PRICE_LOCK" && (
                <div className="bg-indigo-50 text-indigo-800 p-3 rounded-lg text-xs font-medium border border-indigo-200 leading-relaxed">
                  <span className="font-bold uppercase tracking-wider">Note:</span> Requesting a price lock change requires Admin approval. Please state the new required price clearly in the description.
                </div>
              )}
              {formData.type === "RIDER_ISSUE" && (
                <div className="bg-orange-50 text-orange-800 p-3 rounded-lg text-xs font-medium border border-orange-200 leading-relaxed">
                  <span className="font-bold uppercase tracking-wider">Warning:</span> Filing a complaint against a rider may result in their account being penalized or suspended.
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Subject</label>
                <input 
                  type="text" required maxLength={100}
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder={formData.type === "PRICE_LOCK" ? "Inflation Price Adjustment to Rs 5500" : "Brief title of the issue"}
                  className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Detailed Explanation</label>
                <textarea 
                  required rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder={formData.type === "RIDER_ISSUE" ? "Explain what happened with the rider (e.g., damaged goods, bad behavior)..." : "Explain the details of the issue..."}
                  className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition text-sm">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition flex justify-center items-center gap-2 disabled:opacity-50 text-sm">
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : "Submit to Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}