"use client";

import { useEffect, useState, useMemo } from "react";
import { Loader2, AlertTriangle, CheckCircle, MessageSquareWarning, X, Package, Clock, ShieldAlert, ChevronDown, Check, Filter, Image as ImageIcon, Hash, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth, SignInButton } from "@clerk/nextjs";

export default function UserComplaintsPage() {
  
  const { isLoaded, userId } = useAuth();
  
  const [complaints, setComplaints] = useState([]);
  const [goals, setGoals] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOrderDropdownOpen, setIsOrderDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // ✅ Pagination State Setup
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const [selectedFiles, setSelectedFiles] = useState([]);

  const [formData, setFormData] = useState({
    title: "",                 
    type: "PRODUCT_ISSUE",     
    goalId: "",                
    description: ""            
  });

  const selectedGoal = goals.find(g => g.id === formData.goalId);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/complaints/user");
      if (!res.ok) throw new Error("Failed to load data");
      const data = await res.json();
      
      setComplaints(data.complaints);
      setGoals(data.goals);
    } catch (error) {
      toast.error("Could not load complaints.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isLoaded && userId) fetchData(); }, [isLoaded, userId]);
  
  // ✅ Reset pagination to Page 1 when changing filters
  useEffect(() => { setCurrentPage(1); }, [filterStatus]);

  const filteredComplaints = useMemo(() => {
    return complaints.filter((comp) => {
      if (filterStatus === "ALL") return true;
      if (filterStatus === "IN_PROGRESS") return comp.status === "OPEN" || comp.status === "IN_PROGRESS";
      return comp.status === filterStatus;
    });
  }, [complaints, filterStatus]);

  // ✅ Pagination Math
  const totalPages = Math.max(1, Math.ceil(filteredComplaints.length / ITEMS_PER_PAGE));
  const currentComplaints = filteredComplaints.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const clearFilters = () => setFilterStatus("ALL");

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setIsSubmitting(true); 
    const toastId = toast.loading("Submitting complaint...");

    try {
      const formPayload = new FormData();
      formPayload.append("title", formData.title);
      formPayload.append("type", formData.type);
      formPayload.append("description", formData.description);
      if (formData.goalId) formPayload.append("goalId", formData.goalId);
      
      selectedFiles.forEach(file => {
          formPayload.append("images", file);
      });

      const res = await fetch("/api/complaints/user", {
        method: "POST",
        body: formPayload 
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(`Complaint ${data.complaint.complaintId} filed successfully.`, { id: toastId });
      
      setIsModalOpen(false);
      setFormData({ title: "", type: "PRODUCT_ISSUE", goalId: "", description: "" });
      setSelectedFiles([]); 
      fetchData(); 
    } catch (error) {
      toast.error(error.message, { id: toastId });
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
  
  if (!isLoaded) return <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-green-600 w-10 h-10" /></div>;

  if (isLoaded && !userId) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50 px-4 text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-700 tracking-tight leading-snug">
          Please <SignInButton mode="modal" fallbackRedirectUrl="/complaints"><button className="text-indigo-600 hover:underline hover:text-indigo-700 transition-colors">Sign In</button></SignInButton> to continue
        </h2>
      </div>
    );
  }

  if (loading) return <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-green-600 w-10 h-10" /></div>;

  return (
    <div className="min-h-[100dvh] bg-slate-50 p-4 sm:p-6 lg:p-8 text-slate-800">
      <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6 border-b border-slate-200 pb-5 sm:pb-0 sm:border-none">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2.5 sm:gap-3 tracking-tight">
                <MessageSquareWarning className="text-green-600 w-6 h-6 sm:w-8 sm:h-8 shrink-0" /> Support & Complaints
            </h1>
            <p className="text-slate-500 mt-1.5 sm:mt-2 text-xs sm:text-sm lg:text-base">Track issues or open a new dispute.</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="w-full md:w-auto px-5 sm:px-6 py-3.5 sm:py-3 bg-green-600 text-white font-bold rounded-xl sm:rounded-2xl hover:bg-green-700 transition shadow-md flex items-center justify-center gap-2 shrink-0 text-sm sm:text-base active:scale-[0.98]">
            <AlertTriangle size={18} className="shrink-0" /> File a Complaint
          </button>
        </div>

        {complaints.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200">
            <div className="text-xs sm:text-sm font-medium text-slate-500 w-full sm:w-auto text-left pl-1">
              Showing <span className="font-bold text-slate-700">{filteredComplaints.length}</span> complaint{filteredComplaints.length !== 1 ? 's' : ''}
            </div>
            <div className="relative w-full sm:w-56 shrink-0">
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full pl-3 sm:pl-4 pr-10 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold text-slate-700 appearance-none focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:bg-white outline-none cursor-pointer transition-shadow">
                  <option value="ALL">All Statuses</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[400px]">
          {complaints.length === 0 ? (
            <div className="text-center py-16 sm:py-24 px-4 flex-1 flex flex-col items-center justify-center">
              <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-green-300 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-lg sm:text-xl font-bold text-slate-800">No Complaints Found</h3>
              <p className="text-slate-500 mt-1.5 sm:mt-2 text-xs sm:text-sm">You don't have any active or past disputes.</p>
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div className="text-center py-16 sm:py-24 px-4 bg-slate-50/50 flex-1 flex flex-col items-center justify-center">
              <Filter className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-bold text-slate-800">No Matches Found</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 sm:mt-1.5 mb-3 sm:mb-4 max-w-sm mx-auto">We couldn't find any complaints matching your current filters.</p>
              <button onClick={clearFilters} className="text-xs sm:text-sm font-bold text-green-600 hover:text-green-700 hover:underline transition-colors px-4 py-2 bg-green-50 rounded-lg">Clear Filters</button>
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-100 flex-1">
                {/* ✅ MAP OVER CURRENT_COMPLAINTS FOR PAGINATION */}
                {currentComplaints.map((comp) => (
                  <div key={comp.id} className="p-4 sm:p-5 lg:p-6 hover:bg-slate-50 transition-colors flex flex-col lg:flex-row gap-5 lg:gap-6 justify-between">
                    
                    <div className="flex-1 space-y-3 sm:space-y-4 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <span className="text-[10px] sm:text-xs font-bold text-slate-800 bg-slate-100 px-2 sm:px-3 py-1 rounded-md flex items-center gap-1 border border-slate-200 shadow-sm shrink-0">
                            <Hash className="text-slate-400 w-3 h-3 sm:w-[14px] sm:h-[14px]" />
                            {comp.complaintId}
                        </span>
                        <span className="text-[9px] sm:text-[10px] font-bold uppercase text-slate-500 tracking-widest bg-slate-100 px-2.5 sm:px-3 py-1 rounded-full shadow-sm whitespace-nowrap shrink-0">{comp.type.replace('_', ' ')}</span>
                        <span className="text-[10px] sm:text-xs text-slate-400 flex items-center gap-1 whitespace-nowrap shrink-0"><Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {new Date(comp.createdAt).toLocaleDateString('en-GB')}</span>
                      </div>
                      
                      <div className="min-w-0">
                        <h4 className="text-base sm:text-lg font-bold text-slate-900 leading-snug break-words">{comp.title}</h4>
                        <p className="text-xs sm:text-sm text-slate-600 mt-1 sm:mt-1.5 leading-relaxed break-words">{comp.description}</p>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 mt-3 sm:mt-4">
                          {comp.goal && (
                          <div className="inline-flex flex-wrap items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-slate-50 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-medium text-slate-600 border border-slate-200 shadow-sm">
                              <Package className="text-blue-500 w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                              <span className="truncate max-w-[150px] sm:max-w-[200px]">Order: <span className="font-bold text-slate-800">{comp.goal.product?.name}</span></span>
                              {comp.targetStore && <span className="text-slate-400 pl-1 shrink-0">• Target: {comp.targetStore.name}</span>}
                              {comp.targetUser && <span className="text-slate-400 pl-1 shrink-0">• Target: {comp.targetUser.name} (Rider)</span>}
                          </div>
                          )}

                          {(() => {
                              let images = [];
                              if (comp.imageUrl) {
                                  try { images = JSON.parse(comp.imageUrl); if (!Array.isArray(images)) images = [comp.imageUrl]; }
                                  catch(e) { images = [comp.imageUrl]; }
                              }
                              return images.map((img, idx) => (
                                  <a key={idx} href={img} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center sm:justify-start gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-indigo-50 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold text-indigo-600 border border-indigo-100 hover:bg-indigo-100 transition-colors shadow-sm w-full sm:w-auto">
                                      <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> 
                                      <span className="whitespace-nowrap">Evidence {images.length > 1 ? idx + 1 : ''}</span>
                                  </a>
                              ));
                          })()}
                      </div>
                    </div>

                    <div className="w-full lg:w-64 xl:w-80 shrink-0 flex flex-col gap-3 sm:gap-4 mt-2 lg:mt-0">
                      
                      <div className="bg-white border border-slate-200 p-3 sm:p-4 rounded-xl shadow-sm">
                        <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase mb-3 sm:mb-4 text-center tracking-widest">Progress Tracking</p>
                        <div className="flex justify-between items-center relative px-2">
                          <div className="absolute top-2.5 sm:top-3 left-0 w-full h-0.5 bg-slate-100 -z-10 rounded-full"></div>
                          {getProgressSteps(comp.status).map((step, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-1 bg-white">
                              <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                                 step.isError && step.active ? "bg-red-50 border-red-500 text-red-600 shadow-sm shadow-red-100" 
                                 : step.active ? "bg-green-50 border-green-500 text-green-600 shadow-sm shadow-green-100" 
                                 : "bg-white border-slate-200 text-slate-300"
                              }`}>
                                {step.isError ? <ShieldAlert className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> : <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                              </div>
                              <span className={`text-[8px] sm:text-[10px] font-bold text-center leading-tight ${step.active ? (step.isError ? "text-red-600" : "text-green-600") : "text-slate-400"}`}>{step.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {comp.adminNotes && (
                        <div className={`p-3 sm:p-4 rounded-xl border text-xs sm:text-sm shadow-sm animate-in slide-in-from-right-2 ${comp.status === 'REJECTED' ? 'bg-red-50 border-red-100 text-red-900' : 'bg-green-50 border-green-100 text-green-900'}`}>
                          <p className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mb-1 sm:mb-1.5 ${comp.status === 'REJECTED' ? 'text-red-700' : 'text-green-700'}`}>Admin Feedback</p>
                          <p className="leading-relaxed break-words">{comp.adminNotes}</p>
                        </div>
                      )}

                    </div>
                  </div>
                ))}
              </div>
              
              {/* ✅ PROPER PAGINATION RENDER */}
              {totalPages > 1 && (
                <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0 rounded-b-2xl sm:rounded-b-3xl">
                  <span className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider text-center sm:text-left leading-tight">
                    Showing <span className="font-black text-slate-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> - <span className="font-black text-slate-900">{Math.min(currentPage * ITEMS_PER_PAGE, filteredComplaints.length)}</span> of <span className="font-black text-slate-900">{filteredComplaints.length}</span>
                  </span>
                  <div className="flex gap-1.5 sm:gap-2">
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                      disabled={currentPage === 1} 
                      className="p-1.5 sm:p-2 border border-slate-200 rounded-md sm:rounded-lg bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                      <ChevronLeft className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                    </button>
                    <div className="flex items-center justify-center px-3 sm:px-4 font-bold text-xs sm:text-sm text-slate-700 bg-white rounded-md sm:rounded-lg border border-slate-200 shadow-sm">
                      {currentPage} / {totalPages}
                    </div>
                    <button 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                      disabled={currentPage === totalPages} 
                      className="p-1.5 sm:p-2 border border-slate-200 rounded-md sm:rounded-lg bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                      <ChevronRight className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl sm:rounded-3xl w-[95%] sm:w-full max-w-[550px] max-h-[90dvh] shadow-2xl flex flex-col overflow-hidden border border-white/20">
            
            <div className="flex justify-between items-center px-4 sm:px-5 py-4 sm:py-5 border-b border-slate-100 shrink-0 bg-slate-50/50">
              <h3 className="font-bold text-lg sm:text-xl text-slate-800 flex items-center gap-2">
                  <div className="p-1.5 bg-white shadow-sm border border-slate-200 rounded-lg text-green-600 shrink-0">
                      <AlertTriangle className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                  </div> 
                  File Complaint
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 bg-white border border-slate-200 p-1.5 rounded-full transition-colors shadow-sm"><X className="w-4 h-4 sm:w-5 sm:h-5" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto custom-scrollbar">
              
              <div>
                <label className="block text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase mb-1.5 tracking-wider">Complaint Title</label>
                <input type="text" required maxLength={100} value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="E.g., Item arrived broken or late" className="w-full border border-slate-200 bg-slate-50 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:bg-white transition-all outline-none text-slate-800 text-xs sm:text-sm"/>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase mb-1.5 tracking-wider">Category</label>
                  <div className="relative">
                      <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full border border-slate-200 bg-slate-50 pl-3 sm:pl-4 pr-8 sm:pr-10 py-2.5 sm:py-3 rounded-lg sm:rounded-xl focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:bg-white transition-all outline-none text-xs sm:text-sm appearance-none text-slate-800 font-medium cursor-pointer">
                        <option value="PRODUCT_ISSUE">Product Issue</option>
                        <option value="DELIVERY">Delivery Problem</option>
                        <option value="REFUND">Refund Issue</option>
                        <option value="PAYMENT">Payment Problem</option>
                        <option value="STORE_BEHAVIOR">Seller Behavior</option>
                        <option value="RIDER_ISSUE">Rider Issue / Behavior</option>
                        <option value="OTHER">Other</option>
                      </select>
                      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase mb-1.5 tracking-wider">Related Product</label>
                  <button type="button" onClick={() => setIsOrderDropdownOpen(!isOrderDropdownOpen)} className="w-full border border-slate-200 bg-slate-50 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl flex justify-between items-center hover:border-slate-300 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:bg-white transition-all text-left text-xs sm:text-sm font-medium text-slate-800">
                    <span className="truncate pr-2">{selectedGoal ? selectedGoal.product?.name : "Select Product..."}</span>
                    <ChevronDown className={`text-slate-400 transition-transform shrink-0 w-4 h-4 sm:w-[18px] sm:h-[18px] ${isOrderDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isOrderDropdownOpen && (
                    <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-[110] max-h-48 overflow-y-auto p-1.5 animate-in zoom-in-95 custom-scrollbar">
                      <button type="button" onClick={() => { setFormData({...formData, goalId: ""}); setIsOrderDropdownOpen(false); }} className="w-full p-2 rounded-md sm:rounded-lg text-left hover:bg-slate-50 text-[10px] sm:text-[11px] font-bold text-slate-400 mb-1 transition-colors">
                        -- None / General Complaint --
                      </button>
                      
                      {goals.map(g => (
                        <button key={g.id} type="button" onClick={() => { setFormData({...formData, goalId: g.id}); setIsOrderDropdownOpen(false); }} className={`w-full flex items-center gap-2.5 p-2 rounded-md sm:rounded-lg transition-all mb-1 hover:bg-green-50 group ${formData.goalId === g.id ? 'bg-green-50' : ''}`}>
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-100 rounded-md overflow-hidden shrink-0 border border-slate-200"><img src={g.product?.images?.[0] || "/placeholder.png"} className="w-full h-full object-cover" alt="Product" /></div>
                          <div className="flex-1 min-w-0 text-left">
                            <p className="text-[11px] sm:text-xs font-bold text-slate-800 truncate">{g.product?.name}</p>
                            <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{new Date(g.createdAt).toLocaleDateString('en-GB')}</p>
                          </div>
                          {formData.goalId === g.id && <Check className="text-green-600 shrink-0 w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {["PRODUCT_ISSUE", "DELIVERY"].includes(formData.type) && (
                <div className="bg-orange-50 p-3 sm:p-3.5 rounded-xl text-[10px] sm:text-xs font-bold text-orange-800 border border-orange-200 flex gap-2 sm:gap-2.5 items-start shadow-sm animate-in fade-in slide-in-from-top-1">
                  <ShieldAlert className="shrink-0 mt-0.5 w-4 h-4 sm:w-[18px] sm:h-[18px] text-orange-600" />
                  <p className="leading-snug pt-0.5">Delivered product claims must be filed within 7 days.</p>
                </div>
              )}

              <div>
                <label className="block text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase mb-1.5 tracking-wider">Issue Description</label>
                <textarea required rows={4} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Explain what happened in detail..." className="w-full border border-slate-200 bg-slate-50 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:bg-white transition-shadow outline-none resize-y min-h-[80px] text-xs sm:text-sm text-slate-800 custom-scrollbar"/>
              </div>

              <div>
                <label className="block text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase mb-1.5 tracking-wider">Evidence Images (Optional)</label>
                <div className={`border-2 border-dashed rounded-xl sm:rounded-2xl p-4 sm:p-5 text-center transition-colors ${selectedFiles.length > 0 ? 'border-green-300 bg-green-50' : 'border-slate-300 hover:border-green-300 hover:bg-green-50/30'}`}>
                  <input type="file" id="imageUpload" accept="image/*" multiple onChange={(e) => setSelectedFiles(Array.from(e.target.files))} className="hidden" />
                  <label htmlFor="imageUpload" className="cursor-pointer flex flex-col items-center justify-center w-full h-full">
                    {selectedFiles.length > 0 ? (
                      <>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center mb-2.5 sm:mb-3">
                            <ImageIcon className="text-green-600 w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-green-800 truncate w-full px-2 sm:px-4">{selectedFiles.length} file(s) selected</span>
                        <span className="text-[9px] sm:text-[10px] font-bold text-green-700 mt-1 sm:mt-1.5 uppercase tracking-wide bg-green-200/50 px-2.5 py-0.5 rounded-full">Click to change</span>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-100 rounded-full flex items-center justify-center mb-2.5 sm:mb-3 transition-colors">
                            <ImageIcon className="text-slate-400 w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-green-600 hover:text-green-700 transition-colors">Click to Upload Images</span>
                        <span className="text-[9px] sm:text-[10px] text-slate-400 mt-1 font-medium tracking-wide">PNG, JPG up to 5MB</span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row gap-2.5 sm:gap-3 shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="w-full sm:flex-1 py-2.5 sm:py-3 bg-white border border-slate-200 text-slate-700 text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl hover:bg-slate-50 transition-colors shadow-sm order-2 sm:order-1">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="w-full sm:flex-[1.5] py-2.5 sm:py-3 bg-green-600 text-white text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl hover:bg-green-700 transition-all flex justify-center items-center gap-1.5 sm:gap-2 disabled:opacity-50 shadow-md shadow-green-600/20 active:scale-[0.98] disabled:active:scale-100 order-1 sm:order-2">
                  {isSubmitting ? <Loader2 className="animate-spin w-4 h-4 sm:w-[18px] sm:h-[18px]" /> : "Submit Ticket"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}