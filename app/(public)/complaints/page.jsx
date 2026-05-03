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
  
  if (!isLoaded) return <div className="min-h-[80vh] flex items-center justify-center"><Loader2 className="animate-spin text-green-600 w-10 h-10" /></div>;

  if (isLoaded && !userId) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-[#f4f4f9]">
        <h2 className="text-3xl sm:text-4xl font-bold text-slate-700 tracking-tight">
          Please <SignInButton mode="modal" fallbackRedirectUrl="/complaints"><button className="text-indigo-600 hover:underline">Sign In</button></SignInButton> to continue
        </h2>
      </div>
    );
  }

  if (loading) return <div className="min-h-[80vh] flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-green-600 w-10 h-10" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12 text-gray-800">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3"><MessageSquareWarning className="text-green-600 w-8 h-8" /> Support & Complaints</h1>
            <p className="text-gray-500 mt-1">Track issues or open a new dispute.</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="px-6 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition shadow-md flex items-center gap-2 shrink-0">
            <AlertTriangle size={18} /> File a Complaint
          </button>
        </div>

        {complaints.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="text-sm font-medium text-slate-500 w-full sm:w-auto text-center sm:text-left">
              Showing <span className="font-bold text-slate-700">{filteredComplaints.length}</span> complaint{filteredComplaints.length !== 1 ? 's' : ''}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-48">
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-slate-700 appearance-none focus:border-green-500 focus:bg-white outline-none cursor-pointer transition-all">
                  <option value="ALL">All Statuses</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          {complaints.length === 0 ? (
            <div className="text-center py-16 px-4">
              <CheckCircle className="w-16 h-16 text-green-200 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800">No Complaints Found</h3>
              <p className="text-gray-500 mt-2">You don't have any active or past disputes.</p>
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div className="text-center py-16 px-4 bg-gray-50/50">
              <Filter className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-800">No Matches Found</h3>
              <p className="text-sm text-gray-500 mt-1 mb-4">We couldn't find any complaints matching your current filters.</p>
              <button onClick={clearFilters} className="text-sm font-bold text-green-600 hover:underline">Clear Filters</button>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-100">
                {/* ✅ MAP OVER CURRENT_COMPLAINTS FOR PAGINATION */}
                {currentComplaints.map((comp) => (
                  <div key={comp.id} className="p-6 hover:bg-slate-50 transition flex flex-col md:flex-row gap-6 justify-between">
                    <div className="flex-1 space-y-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-xs font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-md flex items-center gap-1 border border-slate-200"><Hash size={14} className="text-slate-400" />{comp.complaintId}</span>
                        <span className="text-[10px] font-bold uppercase text-gray-500 tracking-widest bg-gray-100 px-3 py-1 rounded-full">{comp.type.replace('_', ' ')}</span>
                        <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={14} /> {new Date(comp.createdAt).toLocaleDateString('en-GB')}</span>
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">{comp.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{comp.description}</p>
                      </div>
                      
                      <div className="flex flex-wrap gap-3 mt-4">
                          {comp.goal && (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-medium text-gray-600 border border-gray-200">
                              <Package size={14} className="text-blue-500" />
                              Order: <span className="font-bold text-gray-800">{comp.goal.product?.name}</span>
                              {comp.targetStore && <span className="text-gray-400 pl-1">• Target: {comp.targetStore.name}</span>}
                              {comp.targetUser && <span className="text-gray-400 pl-1">• Target: {comp.targetUser.name} (Rider)</span>}
                          </div>
                          )}

                          {(() => {
                              let images = [];
                              if (comp.imageUrl) {
                                  try { images = JSON.parse(comp.imageUrl); if (!Array.isArray(images)) images = [comp.imageUrl]; }
                                  catch(e) { images = [comp.imageUrl]; }
                              }
                              return images.map((img, idx) => (
                                  <a key={idx} href={img} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-lg text-xs font-medium text-indigo-600 border border-indigo-100 hover:bg-indigo-100 transition">
                                      <ImageIcon size={14} /> Evidence {images.length > 1 ? idx + 1 : ''}
                                  </a>
                              ));
                          })()}
                      </div>
                    </div>

                    <div className="w-full md:w-80 shrink-0 flex flex-col gap-4">
                      <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-4 text-center tracking-widest">Progress Tracking</p>
                        <div className="flex justify-between items-center relative px-2">
                          <div className="absolute top-3 left-0 w-full h-0.5 bg-gray-100 -z-10 rounded-full"></div>
                          {getProgressSteps(comp.status).map((step, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-1 bg-white">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                                 step.isError && step.active ? "bg-red-50 border-red-500 text-red-600 shadow-sm shadow-red-100" 
                                 : step.active ? "bg-green-50 border-green-500 text-green-600 shadow-sm shadow-green-100" 
                                 : "bg-white border-gray-200 text-gray-300"
                              }`}>
                                {step.isError ? <ShieldAlert size={12} /> : <CheckCircle size={12} />}
                              </div>
                              <span className={`text-[10px] font-bold ${step.active ? (step.isError ? "text-red-600" : "text-green-600") : "text-gray-400"}`}>{step.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {comp.adminNotes && (
                        <div className={`p-4 rounded-xl border text-sm animate-in slide-in-from-right-2 ${comp.status === 'REJECTED' ? 'bg-red-50 border-red-100 text-red-900' : 'bg-green-50 border-green-100 text-green-900'}`}>
                          <p className={`text-[10px] font-bold uppercase mb-1 ${comp.status === 'REJECTED' ? 'text-red-700' : 'text-green-700'}`}>Admin Feedback</p>
                          <p className="leading-relaxed">{comp.adminNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* ✅ PROPER PAGINATION RENDER */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between shrink-0">
                  <span className="text-sm text-gray-500 font-medium">
                    Showing <span className="font-bold text-gray-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-bold text-gray-900">{Math.min(currentPage * ITEMS_PER_PAGE, filteredComplaints.length)}</span> of <span className="font-bold text-gray-900">{filteredComplaints.length}</span>
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                      disabled={currentPage === 1} 
                      className="p-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-100 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <span className="flex items-center px-4 text-sm font-semibold text-gray-700">Page {currentPage} of {totalPages}</span>
                    <button 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                      disabled={currentPage === totalPages} 
                      className="p-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-100 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-[550px] max-h-[90vh] shadow-2xl flex flex-col overflow-hidden my-8 border border-white/20">
            <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 shrink-0">
              <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2"><div className="p-1.5 bg-green-100 rounded-lg text-green-600"><AlertTriangle size={18} /></div> File Complaint</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Complaint Title</label>
                <input type="text" required maxLength={100} value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="E.g., Item arrived broken or late" className="w-full border border-slate-200 bg-white px-3 py-2 rounded-xl focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all outline-none text-slate-800 text-sm"/>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Category</label>
                  <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full border border-slate-200 bg-white px-3 py-2 rounded-xl focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all outline-none text-sm appearance-none text-slate-800">
                    <option value="PRODUCT_ISSUE">Product Issue</option>
                    <option value="DELIVERY">Delivery Problem</option>
                    <option value="REFUND">Refund Issue</option>
                    <option value="PAYMENT">Payment Problem</option>
                    <option value="STORE_BEHAVIOR">Seller Behavior</option>
                    <option value="RIDER_ISSUE">Rider Issue / Behavior</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className="relative">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Related Product</label>
                  <button type="button" onClick={() => setIsOrderDropdownOpen(!isOrderDropdownOpen)} className="w-full border border-slate-200 bg-white px-3 py-2 rounded-xl flex justify-between items-center hover:border-slate-300 transition-all text-left text-sm">
                    <span className="truncate text-slate-800">{selectedGoal ? selectedGoal.product?.name : "Select Product..."}</span>
                    <ChevronDown className={`text-slate-400 transition-transform shrink-0 ml-2 ${isOrderDropdownOpen ? 'rotate-180' : ''}`} size={16} />
                  </button>

                  {isOrderDropdownOpen && (
                    <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto p-1.5 animate-in zoom-in-95">
                      <button type="button" onClick={() => { setFormData({...formData, goalId: ""}); setIsOrderDropdownOpen(false); }} className="w-full p-2 rounded-lg text-left hover:bg-slate-50 text-[11px] font-bold text-slate-400 mb-1">
                        -- None / General Complaint --
                      </button>
                      
                      {goals.map(g => (
                        <button key={g.id} type="button" onClick={() => { setFormData({...formData, goalId: g.id}); setIsOrderDropdownOpen(false); }} className={`w-full flex items-center gap-2 p-2 rounded-lg transition-all mb-1 hover:bg-green-50 group ${formData.goalId === g.id ? 'bg-green-50' : ''}`}>
                          <div className="w-8 h-8 bg-slate-100 rounded overflow-hidden shrink-0 border border-slate-200"><img src={g.product?.images?.[0] || "/placeholder.png"} className="w-full h-full object-cover" alt="Product" /></div>
                          <div className="flex-1 min-w-0 text-left">
                            <p className="text-xs font-medium text-slate-800 truncate">{g.product?.name}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase">{new Date(g.createdAt).toLocaleDateString('en-GB')}</p>
                          </div>
                          {formData.goalId === g.id && <Check className="text-green-600 shrink-0" size={14} />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {["PRODUCT_ISSUE", "DELIVERY"].includes(formData.type) && (
                <div className="bg-orange-50 p-2.5 rounded-xl text-xs font-medium text-orange-700 border border-orange-100 flex gap-2">
                  <ShieldAlert className="shrink-0 mt-0.5" size={14} />
                  <p>Delivered product claims must be filed within 7 days.</p>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Issue Description</label>
                <textarea required rows={3} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Explain what happened in detail..." className="w-full border border-slate-200 bg-white px-3 py-2 rounded-xl focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all outline-none resize-none text-sm text-slate-800"/>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Evidence Images (Optional)</label>
                <div className={`border-2 border-dashed rounded-xl p-3 text-center transition-colors ${selectedFiles.length > 0 ? 'border-green-300 bg-green-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <input type="file" id="imageUpload" accept="image/*" multiple onChange={(e) => setSelectedFiles(Array.from(e.target.files))} className="hidden" />
                  <label htmlFor="imageUpload" className="cursor-pointer flex flex-col items-center justify-center w-full h-full">
                    {selectedFiles.length > 0 ? (
                      <>
                        <ImageIcon className="text-green-500 mb-1" size={20} />
                        <span className="text-sm font-bold text-green-700 truncate w-full px-4">{selectedFiles.length} file(s) selected</span>
                        <span className="text-[10px] font-medium text-green-600/70 mt-1 uppercase tracking-wide bg-green-100 px-2 py-0.5 rounded">Click to change</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="text-slate-400 mb-1" size={20} />
                        <span className="text-sm font-bold text-green-600 hover:text-green-700 transition">Click to Upload Images</span>
                        <span className="text-[10px] text-slate-400 mt-1 font-medium">PNG, JPG up to 5MB</span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div className="pt-2 flex gap-3 shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-200 transition-all">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 transition-all flex justify-center items-center gap-2 disabled:opacity-50">
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "Submit Ticket"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}