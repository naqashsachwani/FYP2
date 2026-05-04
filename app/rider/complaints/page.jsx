"use client";

import { useEffect, useState, useMemo } from "react";
import { Loader2, AlertTriangle, CheckCircle, MessageSquareWarning, X, Clock, ShieldAlert, ChevronDown, Image as ImageIcon, Hash, ChevronLeft, ChevronRight, Check } from "lucide-react";
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

  const fetchData = async () => {
    try {
      const res = await fetch("/api/rider/complaints");
      if (!res.ok) throw new Error("Failed to load data");
      const data = await res.json();
      setComplaints(data.complaints);
      setDeliveries(data.deliveries);
    } catch (error) { toast.error("Could not load complaints."); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);
  
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

      // ✅ SUCCESS TOAST NOW SHOWS THE PROPER CMP- ID
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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-green-600 w-10 h-10" /></div>;

  const selectedDelivery = deliveries.find(d => d.goalId === formData.goalId);

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-12 text-slate-800">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3"><MessageSquareWarning className="text-green-600 w-8 h-8" /> Rider Support</h1>
            <p className="text-slate-500 mt-1">Report issues with stores, customers, or payments.</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition shadow-md flex items-center gap-2">
            <AlertTriangle size={18} /> Open Ticket
          </button>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <div className="text-sm font-medium text-slate-500 w-full sm:w-auto text-center sm:text-left">
            Showing <span className="font-bold text-slate-700">{filteredItems.length}</span> tickets
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

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col">
          {filteredItems.length === 0 ? (
            <div className="text-center py-16 px-4">
              <CheckCircle className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-700">No Tickets Found</h3>
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-100 flex-1">
                {currentItems.map((comp) => (
                  <div key={comp.id} className="p-6 hover:bg-slate-50 transition flex flex-col md:flex-row gap-6 justify-between">
                    <div className="flex-1 space-y-4">
                      <div className="flex flex-wrap items-center gap-3">
                        {/* ✅ PROPERLY RENDERS THE CMP- ID */}
                        <span className="text-xs font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-md flex items-center gap-1 border border-slate-200">
                            <Hash size={14} className="text-slate-400" />
                            {comp.complaintId || comp.id.slice(-6).toUpperCase()}
                        </span>
                        <span className="text-[10px] font-bold uppercase text-slate-500 tracking-widest bg-slate-100 px-3 py-1 rounded-full">{comp.type.replace('_', ' ')}</span>
                        <span className="text-xs text-slate-400 flex items-center gap-1"><Clock size={14} /> {new Date(comp.createdAt).toLocaleDateString('en-GB')}</span>
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-slate-900">{comp.title}</h4>
                        <p className="text-sm text-slate-600 mt-1">{comp.description}</p>
                      </div>
                    </div>

                    <div className="w-full md:w-80 shrink-0 flex flex-col gap-4">
                      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-4 text-center tracking-widest">Progress Tracking</p>
                        <div className="flex justify-between items-center relative px-2">
                          <div className="absolute top-3 left-0 w-full h-0.5 bg-slate-100 -z-10 rounded-full"></div>
                          {getProgressSteps(comp.status).map((step, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-1 bg-white">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                                 step.isError && step.active ? "bg-red-50 border-red-500 text-red-600 shadow-sm shadow-red-100" 
                                 : step.active ? "bg-green-50 border-green-500 text-green-600 shadow-sm shadow-green-100" 
                                 : "bg-white border-slate-200 text-slate-300"
                              }`}>
                                {step.isError ? <ShieldAlert size={12} /> : <CheckCircle size={12} />}
                              </div>
                              <span className={`text-[10px] font-bold ${step.active ? (step.isError ? "text-red-600" : "text-green-600") : "text-slate-400"}`}>{step.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {comp.adminNotes && (
                        <div className={`p-4 rounded-xl border text-sm ${comp.status === 'REJECTED' ? 'bg-red-50 border-red-100 text-red-900' : 'bg-green-50 border-green-100 text-green-900'}`}>
                          <p className={`text-[10px] font-bold uppercase mb-1 ${comp.status === 'REJECTED' ? 'text-red-700' : 'text-green-700'}`}>Admin Feedback</p>
                          <p className="leading-relaxed">{comp.adminNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-4 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 rounded-b-3xl">
                  <span className="text-sm text-slate-500 font-medium">
                      Showing <span className="font-bold text-slate-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-bold text-slate-900">{Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length)}</span> of <span className="font-bold text-slate-900">{filteredItems.length}</span> entries
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
            </>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-[550px] max-h-[90vh] shadow-2xl flex flex-col overflow-hidden my-8 border border-white/20">
            <div className="flex justify-between items-center px-5 py-5 border-b border-slate-100 shrink-0">
              <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2"><div className="p-1.5 bg-slate-100 rounded-lg text-slate-700"><AlertTriangle size={18} /></div> Open Support Ticket</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-1.5 rounded-full"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5 tracking-wider">Title / Tracking Number</label>
                <input type="text" required maxLength={100} value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="E.g., Missing Payout for KHI-1234" className="w-full border border-slate-200 bg-slate-50 px-4 py-3 rounded-xl focus:border-green-500 focus:bg-white outline-none text-slate-800 text-sm"/>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5 tracking-wider">Category</label>
                  <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full border border-slate-200 bg-slate-50 px-4 py-3 rounded-xl focus:border-green-500 focus:bg-white outline-none text-sm appearance-none text-slate-800 font-medium">
                    <option value="USER_BEHAVIOR">Report a Customer</option>
                    <option value="STORE_BEHAVIOR">Report a Store</option>
                    <option value="PAYMENT">Missing Delivery Payment</option>
                    <option value="OTHER">Other Platform Issue</option>
                  </select>
                </div>

                <div className="relative">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5 tracking-wider">Related Delivery</label>
                  <button type="button" onClick={() => setIsOrderDropdownOpen(!isOrderDropdownOpen)} className="w-full border border-slate-200 bg-slate-50 px-3 py-3 rounded-xl flex justify-between items-center hover:border-slate-300 transition-all text-left text-sm">
                    <span className="truncate text-slate-800 font-medium">{selectedDelivery ? selectedDelivery.trackingNumber : "-- Optional --"}</span>
                    <ChevronDown className={`text-slate-400 transition-transform shrink-0 ml-2 ${isOrderDropdownOpen ? 'rotate-180' : ''}`} size={16} />
                  </button>

                  {isOrderDropdownOpen && (
                    <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto p-1.5 animate-in zoom-in-95">
                      <button type="button" onClick={() => { setFormData({...formData, goalId: "", targetUserId: "", targetStoreId: ""}); setIsOrderDropdownOpen(false); }} className="w-full p-2 rounded-lg text-left hover:bg-slate-50 text-[11px] font-bold text-slate-400 mb-1">
                        -- Clear Selection --
                      </button>
                      
                      {deliveries.map(d => (
                        <button key={d.id} type="button" onClick={() => { setFormData({...formData, goalId: d.goalId}); setIsOrderDropdownOpen(false); }} className={`w-full flex items-center gap-2 p-2 rounded-lg transition-all mb-1 hover:bg-slate-50 group ${formData.goalId === d.goalId ? 'bg-slate-50' : ''}`}>
                          <div className="flex-1 min-w-0 text-left">
                            <p className="text-xs font-bold text-slate-800 truncate">{d.trackingNumber}</p>
                            <p className="text-[10px] text-slate-500 truncate">Store: {d.goal?.product?.store?.name}</p>
                          </div>
                          {formData.goalId === d.goalId && <Check className="text-slate-600 shrink-0" size={14} />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5 tracking-wider">Detailed Description</label>
                <textarea required rows={4} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Explain the issue clearly so Admin can assist..." className="w-full border border-slate-200 bg-slate-50 px-4 py-3 rounded-xl focus:border-green-500 focus:bg-white outline-none resize-none text-sm text-slate-800"/>
              </div>

              <div className="pt-2 flex gap-3 shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition-all flex justify-center items-center gap-2 disabled:opacity-50">
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : "Submit Ticket"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}