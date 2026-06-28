"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Loader2, AlertTriangle, CheckCircle, MessageSquareWarning, X, Clock, ShieldAlert, ChevronDown, Image as ImageIcon, Hash, ChevronLeft, ChevronRight, Check, RefreshCcw } from "lucide-react";
import toast from "react-hot-toast";

export default function RiderComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [deliveries, setDeliveries] = useState([]); 

  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOrderDropdownOpen, setIsOrderDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const [formData, setFormData] = useState({
    title: "",                 
    type: "USER_BEHAVIOR", 
    description: "",
    goalId: "",
    targetUserId: "",
    targetStoreId: "" 
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/rider/complaints");
      if (!res.ok) throw new Error("Failed to load data");
      const data = await res.json();
      setComplaints(data.complaints);
      setDeliveries(data.deliveries);
    } catch (error) { toast.error("Could not load complaints."); } 
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  
  const handleRefresh = () => {
    setFilterStatus("ALL");
    setCurrentPage(1);
    fetchData();
  };

  useEffect(() => { setCurrentPage(1); }, [filterStatus]);

  useEffect(() => {
    if (formData.goalId) {
        const selectedDel = deliveries.find(d => d.goalId === formData.goalId);
        if (formData.type === "USER_BEHAVIOR") {
            setFormData(prev => ({ ...prev, targetUserId: selectedDel?.goal?.userId, targetStoreId: "" }));
        } else if (formData.type === "STORE_BEHAVIOR") {
            setFormData(prev => ({ ...prev, targetStoreId: selectedDel?.goal?.product?.storeId, targetUserId: "" }));
        }
    } else {
        setFormData(prev => ({ ...prev, targetUserId: "", targetStoreId: "" }));
    }
  }, [formData.goalId, formData.type, deliveries]);

  const filteredItems = useMemo(() => {
    return complaints.filter((comp) => {
      if (filterStatus === "ALL") return true;
      if (filterStatus === "IN_PROGRESS") return comp.status === "OPEN" || comp.status === "IN_PROGRESS";
      return comp.status === filterStatus;
    });
  }, [complaints, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const currentItems = filteredItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setIsSubmitting(true); 
    const toastId = toast.loading("Submitting report...");

    try {
      const formPayload = new FormData();
      formPayload.append("title", formData.title);
      formPayload.append("type", formData.type);
      formPayload.append("description", formData.description);
      if (formData.goalId) formPayload.append("goalId", formData.goalId);
      if (formData.targetUserId) formPayload.append("targetUserId", formData.targetUserId);
      if (formData.targetStoreId) formPayload.append("targetStoreId", formData.targetStoreId);

      const res = await fetch("/api/rider/complaints", { method: "POST", body: formPayload });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(`Ticket ${data.complaint.complaintId || data.complaint.id.slice(-6)} filed.`, { id: toastId });
      setIsModalOpen(false);
      setFormData({ title: "", type: "USER_BEHAVIOR", description: "", goalId: "", targetUserId: "", targetStoreId: "" });
      fetchData(); 
    } catch (error) { toast.error(error.message, { id: toastId }); } 
    finally { setIsSubmitting(false); }
  };

  const getProgressSteps = (status) => [
      { label: "Submitted", active: true },
      { label: "Under Review", active: ["IN_PROGRESS", "RESOLVED", "REJECTED"].includes(status) },
      { label: status === "REJECTED" ? "Rejected" : "Resolved", active: ["RESOLVED", "REJECTED"].includes(status), isError: status === "REJECTED" }
  ];

  if (loading && complaints.length === 0) return <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600 w-10 h-10" /></div>;

  const selectedDelivery = deliveries.find(d => d.goalId === formData.goalId);

  return (
    <div className="min-h-[100dvh] bg-slate-50 p-4 sm:p-6 lg:p-12 text-slate-800">
      <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2 sm:gap-3">
              <MessageSquareWarning className="text-blue-600 w-6 h-6 sm:w-8 sm:h-8 shrink-0" /> Rider Support
            </h1>
            <p className="text-slate-500 mt-1 text-xs sm:text-sm">Report issues with stores, customers, or payments.</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto px-5 sm:px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition shadow-md flex items-center justify-center gap-2 text-sm sm:text-base">
            <AlertTriangle size={18} className="shrink-0" /> Open Ticket
          </button>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200">
          <div className="text-xs sm:text-sm font-medium text-slate-500 w-full sm:w-auto text-left">
            Showing <span className="font-bold text-slate-700">{filteredItems.length}</span> tickets
          </div>
          <div className="flex w-full sm:w-auto gap-2">
              <div className="relative w-full sm:w-48">
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full pl-3 sm:pl-4 pr-8 sm:pr-10 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold text-slate-700 appearance-none outline-none cursor-pointer transition-shadow focus:ring-2 focus:ring-blue-100">
                  <option value="ALL">All Statuses</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <button 
                  onClick={handleRefresh} 
                  disabled={loading}
                  className="p-2 sm:p-2.5 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl hover:bg-slate-100 shadow-sm transition-colors text-slate-600 shrink-0"
                  title="Reset filters and refresh"
              >
                  <RefreshCcw size={16} className={`sm:w-4 sm:h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 sm:py-16 px-4">
              <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-slate-200 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-lg sm:text-xl font-bold text-slate-700">No Tickets Found</h3>
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-100 flex-1">
                {currentItems.map((comp) => (
                  <div key={comp.id} className="p-4 sm:p-6 hover:bg-slate-50 transition flex flex-col lg:flex-row gap-5 sm:gap-6 justify-between">
                    <div className="flex-1 space-y-3 sm:space-y-4 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <span className="text-[10px] sm:text-xs font-bold text-slate-800 bg-slate-100 px-2 sm:px-3 py-1 rounded-md flex items-center gap-1 border border-slate-200">
                            <Hash className="text-slate-400 w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                            {comp.complaintId || comp.id.slice(-6).toUpperCase()}
                        </span>
                        <span className="text-[9px] sm:text-[10px] font-bold uppercase text-slate-500 tracking-widest bg-slate-100 px-2.5 sm:px-3 py-1 rounded-full whitespace-nowrap">{comp.type.replace('_', ' ')}</span>
                        <span className="text-[10px] sm:text-xs text-slate-400 flex items-center gap-1 whitespace-nowrap"><Clock size={12} className="sm:w-[14px] sm:h-[14px] shrink-0" /> {new Date(comp.createdAt).toLocaleDateString('en-GB')}</span>
                      </div>
                      <div>
                        <h4 className="text-base sm:text-lg font-bold text-slate-900 break-words">{comp.title}</h4>
                        <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed break-words">{comp.description}</p>
                      </div>
                    </div>

                    <div className="w-full lg:w-72 xl:w-80 shrink-0 flex flex-col gap-3 sm:gap-4 mt-2 lg:mt-0">
                      <div className="bg-white border border-slate-200 p-3 sm:p-4 rounded-xl shadow-sm">
                        <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase mb-3 sm:mb-4 text-center tracking-widest">Progress Tracking</p>
                        <div className="flex justify-between items-center relative px-2">
                          <div className="absolute top-2.5 sm:top-3 left-0 w-full h-0.5 bg-slate-100 -z-10 rounded-full"></div>
                          {getProgressSteps(comp.status).map((step, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-1 bg-white">
                              <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                                 step.isError && step.active ? "bg-red-50 border-red-500 text-red-600 shadow-sm shadow-red-100" 
                                 : step.active ? "bg-blue-50 border-blue-500 text-blue-600 shadow-sm shadow-blue-100" 
                                 : "bg-white border-slate-200 text-slate-300"
                              }`}>
                                {step.isError ? <ShieldAlert className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> : <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                              </div>
                              <span className={`text-[8px] sm:text-[10px] font-bold text-center leading-tight ${step.active ? (step.isError ? "text-red-600" : "text-blue-600") : "text-slate-400"}`}>{step.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {comp.adminNotes && (
                        <div className={`p-3 sm:p-4 rounded-xl border text-xs sm:text-sm ${comp.status === 'REJECTED' ? 'bg-red-50 border-red-100 text-red-900' : 'bg-blue-50 border-blue-100 text-blue-900'}`}>
                          <p className={`text-[9px] sm:text-[10px] font-bold uppercase mb-1 ${comp.status === 'REJECTED' ? 'text-red-700' : 'text-blue-700'}`}>Admin Feedback</p>
                          <p className="leading-relaxed break-words">{comp.adminNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-3 sm:p-4 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 shrink-0 rounded-b-2xl sm:rounded-b-3xl">
                  <span className="text-xs sm:text-sm text-slate-500 font-medium text-center sm:text-left">
                      Showing <span className="font-bold text-slate-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-bold text-slate-900">{Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length)}</span> of <span className="font-bold text-slate-900">{filteredItems.length}</span> entries
                  </span>
                  <div className="flex gap-2">
                      <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 text-slate-600 transition text-xs sm:text-sm font-bold shadow-sm">
                          <ChevronLeft size={16} className="w-4 h-4 sm:w-[18px] sm:h-[18px]" /> Prev
                      </button>
                      <div className="flex items-center justify-center px-3 sm:px-4 font-bold text-xs sm:text-sm text-slate-700 bg-slate-50 rounded-lg border border-slate-100">
                          {currentPage} / {totalPages}
                      </div>
                      <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 text-slate-600 transition text-xs sm:text-sm font-bold shadow-sm">
                          Next <ChevronRight size={16} className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                      </button>
                  </div>
              </div>
            </>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl sm:rounded-3xl w-[95%] sm:w-full max-w-[550px] max-h-[90dvh] shadow-2xl flex flex-col overflow-hidden my-4 sm:my-8 border border-white/20">
            <div className="flex justify-between items-center px-4 sm:px-5 py-4 sm:py-5 border-b border-slate-100 shrink-0 bg-slate-50/50">
              <h3 className="font-bold text-lg sm:text-xl text-slate-800 flex items-center gap-2">
                  <div className="p-1.5 bg-white shadow-sm border border-slate-200 rounded-lg text-slate-700 shrink-0">
                      <AlertTriangle className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                  </div> 
                  Open Ticket
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 bg-white shadow-sm border border-slate-200 p-1.5 rounded-full transition-colors"><X className="w-4 h-4 sm:w-5 sm:h-5" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto custom-scrollbar">
              <div>
                <label className="block text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase mb-1.5 tracking-wider">Title / Tracking Number</label>
                <input type="text" required maxLength={100} value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="E.g., Missing Payout for KHI-1234" className="w-full border border-slate-200 bg-slate-50 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl focus:border-blue-500 focus:bg-white outline-none text-slate-800 text-xs sm:text-sm transition-shadow"/>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase mb-1.5 tracking-wider">Category</label>
                  <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full border border-slate-200 bg-slate-50 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl focus:border-blue-500 focus:bg-white outline-none text-xs sm:text-sm appearance-none text-slate-800 font-medium transition-shadow cursor-pointer">
                    <option value="USER_BEHAVIOR">Report a Customer</option>
                    <option value="STORE_BEHAVIOR">Report a Store</option>
                    <option value="PAYMENT">Missing Delivery Payment</option>
                    <option value="OTHER">Other Platform Issue</option>
                  </select>
                </div>

                <div className="relative">
                  <label className="block text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase mb-1.5 tracking-wider">Related Delivery</label>
                  <button type="button" onClick={() => setIsOrderDropdownOpen(!isOrderDropdownOpen)} className="w-full border border-slate-200 bg-slate-50 px-3 py-2.5 sm:py-3 rounded-lg sm:rounded-xl flex justify-between items-center hover:border-slate-300 transition-all text-left text-xs sm:text-sm">
                    <span className="truncate text-slate-800 font-medium">{selectedDelivery ? selectedDelivery.trackingNumber : "-- Optional --"}</span>
                    <ChevronDown className={`text-slate-400 transition-transform shrink-0 ml-2 ${isOrderDropdownOpen ? 'rotate-180' : ''}`} size={16} />
                  </button>

                  {isOrderDropdownOpen && (
                    <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-lg sm:rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto p-1.5 animate-in zoom-in-95 custom-scrollbar">
                      <button type="button" onClick={() => { setFormData({...formData, goalId: "", targetUserId: "", targetStoreId: ""}); setIsOrderDropdownOpen(false); }} className="w-full p-2 rounded-md sm:rounded-lg text-left hover:bg-slate-50 text-[10px] sm:text-[11px] font-bold text-slate-400 mb-1 transition-colors">
                        -- Clear Selection --
                      </button>
                      
                      {deliveries.map(d => (
                        <button key={d.id} type="button" onClick={() => { setFormData({...formData, goalId: d.goalId}); setIsOrderDropdownOpen(false); }} className={`w-full flex items-center gap-2 p-2 rounded-md sm:rounded-lg transition-all mb-1 hover:bg-slate-50 group ${formData.goalId === d.goalId ? 'bg-slate-50' : ''}`}>
                          <div className="flex-1 min-w-0 text-left">
                            <p className="text-[11px] sm:text-xs font-bold text-slate-800 truncate">{d.trackingNumber}</p>
                            <p className="text-[9px] sm:text-[10px] text-slate-500 truncate mt-0.5">Store: {d.goal?.product?.store?.name}</p>
                          </div>
                          {formData.goalId === d.goalId && <Check className="text-slate-600 shrink-0" size={14} />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase mb-1.5 tracking-wider">Detailed Description</label>
                <textarea required rows={4} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Explain the issue clearly so Admin can assist..." className="w-full border border-slate-200 bg-slate-50 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl focus:border-blue-500 focus:bg-white outline-none resize-y min-h-[100px] text-xs sm:text-sm text-slate-800 transition-shadow custom-scrollbar"/>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2 sm:gap-3 shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="w-full sm:flex-1 py-2.5 sm:py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg sm:rounded-xl hover:bg-slate-50 transition-all text-xs sm:text-sm shadow-sm">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="w-full sm:flex-[1.5] py-2.5 sm:py-3 bg-slate-900 text-white font-bold rounded-lg sm:rounded-xl hover:bg-black transition-all flex justify-center items-center gap-2 disabled:opacity-50 text-xs sm:text-sm shadow-md active:scale-[0.98] disabled:active:scale-100">
                  {isSubmitting ? <Loader2 size={16} className="animate-spin shrink-0" /> : "Submit Ticket"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}