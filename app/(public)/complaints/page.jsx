"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertTriangle, CheckCircle, MessageSquareWarning, X, Package, Clock, ShieldAlert, ChevronDown, Check } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@clerk/nextjs";

export default function UserComplaintsPage() {
  const { isLoaded, userId } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal & Dropdown States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOrderDropdownOpen, setIsOrderDropdownOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    type: "PRODUCT_ISSUE",
    goalId: "",
    description: ""
  });

  // Find the selected goal for the UI display
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

  useEffect(() => {
    if (isLoaded && userId) fetchData();
  }, [isLoaded, userId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const toastId = toast.loading("Submitting complaint...");

    try {
      const res = await fetch("/api/complaints/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Complaint filed successfully.", { id: toastId });
      setIsModalOpen(false);
      setFormData({ title: "", type: "PRODUCT_ISSUE", goalId: "", description: "" });
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

  if (loading || !isLoaded) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-green-600 w-10 h-10" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12 text-gray-800">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
              <MessageSquareWarning className="text-green-600 w-8 h-8" /> 
              Support & Complaints
            </h1>
            <p className="text-gray-500 mt-1">Track issues or open a new dispute with a store.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition shadow-md flex items-center gap-2"
          >
            <AlertTriangle size={18} />
            File a Complaint
          </button>
        </div>

        {/* Complaints List */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {complaints.length === 0 ? (
            <div className="text-center py-16 px-4">
              <CheckCircle className="w-16 h-16 text-green-200 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800">No Complaints Found</h3>
              <p className="text-gray-500 mt-2">You don't have any active or past disputes.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {complaints.map((comp) => (
                <div key={comp.id} className="p-6 hover:bg-slate-50 transition flex flex-col md:flex-row gap-6 justify-between">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold uppercase text-gray-500 tracking-widest bg-gray-100 px-3 py-1 rounded-full">
                        {comp.type.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock size={14} /> {new Date(comp.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">{comp.title}</h4>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{comp.description}</p>
                    </div>
                    {comp.goal && (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-medium text-gray-600 border border-gray-200">
                        <Package size={14} className="text-blue-500" />
                        Order: <span className="font-bold text-gray-800">{comp.goal.product?.name}</span>
                        {comp.targetStore && <span className="text-gray-400 pl-1">• Store: {comp.targetStore.name}</span>}
                      </div>
                    )}
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
                            <span className={`text-[10px] font-bold ${step.active ? (step.isError ? "text-red-600" : "text-green-600") : "text-gray-400"}`}>
                              {step.label}
                            </span>
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
          )}
        </div>
      </div>

      {/* NEW & IMPROVED MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden my-8 border border-white/20">
            <div className="flex justify-between items-center p-8 pb-4">
              <h3 className="font-extrabold text-2xl text-slate-900 flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-xl text-green-600"><AlertTriangle size={24} /></div>
                File Complaint
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 hover:bg-slate-100 p-2 rounded-full transition"><X size={22} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-6">
              
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1 tracking-wider">Complaint Title</label>
                <input 
                  type="text" required maxLength={100}
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="E.g., Item arrived broken or late"
                  className="w-full border-2 border-slate-100 bg-slate-50 p-4 rounded-2xl focus:border-green-500 focus:bg-white transition-all outline-none text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1 tracking-wider">Category</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full border-2 border-slate-100 bg-slate-50 p-4 rounded-2xl focus:border-green-500 focus:bg-white transition-all outline-none font-medium appearance-none"
                  >
                    <option value="PRODUCT_ISSUE">Product Issue</option>
                    <option value="DELIVERY">Delivery Problem</option>
                    <option value="REFUND">Refund Issue</option>
                    <option value="PAYMENT">Payment Problem</option>
                    <option value="STORE_BEHAVIOR">Seller Behavior</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                {/* ✅ PROFESSIONAL ORDER SELECTOR */}
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1 tracking-wider">Related Product</label>
                  <button
                    type="button"
                    onClick={() => setIsOrderDropdownOpen(!isOrderDropdownOpen)}
                    className="w-full border-2 border-slate-100 bg-slate-50 p-4 rounded-2xl flex justify-between items-center hover:border-slate-200 transition-all text-left"
                  >
                    <span className="truncate font-medium text-slate-700">
                      {selectedGoal ? selectedGoal.product?.name : "Select Product..."}
                    </span>
                    <ChevronDown className={`text-slate-400 transition-transform ${isOrderDropdownOpen ? 'rotate-180' : ''}`} size={18} />
                  </button>

                  {isOrderDropdownOpen && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl z-20 max-h-60 overflow-y-auto p-2 animate-in zoom-in-95">
                      <button 
                        type="button"
                        onClick={() => { setFormData({...formData, goalId: ""}); setIsOrderDropdownOpen(false); }}
                        className="w-full p-3 rounded-xl text-left hover:bg-slate-50 text-xs font-bold text-slate-400 mb-1"
                      >
                        -- None / General Complaint --
                      </button>
                      {goals.map(g => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => {
                            setFormData({...formData, goalId: g.id});
                            setIsOrderDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all mb-1 hover:bg-green-50 group ${formData.goalId === g.id ? 'bg-green-50' : ''}`}
                        >
                          <div className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                            <img src={g.product?.images?.[0] || "/placeholder.png"} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">{g.product?.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(g.createdAt).toLocaleDateString()}</p>
                          </div>
                          {formData.goalId === g.id && <Check className="text-green-600 shrink-0" size={16} />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {["PRODUCT_ISSUE", "DELIVERY"].includes(formData.type) && (
                <div className="bg-orange-50/50 p-4 rounded-2xl text-xs font-bold text-orange-700 border border-orange-100 flex gap-3">
                  <ShieldAlert className="shrink-0" size={16} />
                  <p>Delivered product claims must be filed within 7 days.</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1 tracking-wider">Issue Description</label>
                <textarea 
                  required rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Explain what happened in detail..."
                  className="w-full border-2 border-slate-100 bg-slate-50 p-4 rounded-2xl focus:border-green-500 focus:bg-white transition-all outline-none resize-none font-medium"
                />
              </div>

              <div className="pt-2 flex gap-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-[2] py-4 bg-green-600 text-white font-extrabold rounded-2xl hover:bg-green-700 transition-all flex justify-center items-center gap-2 disabled:opacity-50 shadow-lg shadow-green-100">
                  {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : "Submit Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}