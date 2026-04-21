"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertCircle, PlusCircle, CheckCircle, MessageSquareWarning, X, Package, ShieldAlert, Lock, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@clerk/nextjs";

export default function StoreRequestsPage() {
  const { isLoaded, userId } = useAuth();
  
  // --- Main State ---
  const [requests, setRequests] = useState([]); 
  const [activeGoals, setActiveGoals] = useState([]); 
  const [loading, setLoading] = useState(true); 

  // --- Modal & Form State ---
  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [isSubmitting, setIsSubmitting] = useState(false); 
  // Holds the data for the new request form
  const [formData, setFormData] = useState({
    title: "",
    type: "PRICE_LOCK", // Default request type
    goalId: "",
    targetUserId: "",
    description: ""
  });

  // Retrieves both past requests and active goals from the backend
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

  const handleGoalSelection = (goalId) => {
    // Find the full goal object from the activeGoals array based on the selected ID
    const selectedGoal = activeGoals.find(g => g.id === goalId);
    
    // Update the form data, automatically linking the target user associated with that goal
    setFormData({
      ...formData,
      goalId: goalId,
      targetUserId: selectedGoal ? selectedGoal.userId : "" 
    });
  };

  // Handles the submission of the "New Request" form
  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setIsSubmitting(true); 
    const toastId = toast.loading("Submitting request..."); 

    try {
      // Send the POST request to the backend
      const res = await fetch("/api/store/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error);
      }

      toast.success("Request submitted successfully to Admin.", { id: toastId });
      
      // Reset the UI upon success
      setIsModalOpen(false);
      setFormData({ title: "", type: "PRICE_LOCK", goalId: "", targetUserId: "", description: "" });
      fetchData(); 

    } catch (error) {
      toast.error(error.message || "Failed to submit request", { id: toastId });
    } finally {
      setIsSubmitting(false); 
    }
  };

  // Generates an array of step objects based on the current string status of the request
  const getProgressSteps = (status) => {
    return [
      { label: "Submitted", active: true }, 
      { label: "Under Review", active: ["IN_PROGRESS", "RESOLVED", "REJECTED"].includes(status) },
      { 
        label: status === "REJECTED" ? "Rejected" : "Resolved", 
        active: ["RESOLVED", "REJECTED"].includes(status),
        isError: status === "REJECTED" 
      }
    ];
  };

  if (loading || !isLoaded) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-indigo-600 w-10 h-10" /></div>;
  }

  // --- Main Render ---
  return (
    <div className="p-6 md:p-8 text-slate-800 w-full">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <MessageSquareWarning className="text-indigo-600 w-7 h-7" /> 
              Store Requests & Support
            </h1>
            <p className="text-slate-500 mt-1 text-sm">Manage price lock requests or report buyer issues to Admin.</p>
          </div>
          {/* Button to open the "New Request" modal */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-sm flex items-center gap-2 text-sm"
          >
            <PlusCircle size={18} />
            New Request
          </button>
        </div>

        {/* === Requests List === */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {requests.length === 0 ? (
            <div className="text-center py-16 px-4">
              <CheckCircle className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-700">No Requests Found</h3>
              <p className="text-slate-500 mt-1 text-sm">You haven't made any requests or complaints yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {requests.map((req) => (
                <div key={req.id} className="p-6 hover:bg-slate-50 transition flex flex-col xl:flex-row gap-8 justify-between">
                  
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider bg-slate-100 px-3 py-1 rounded-full flex items-center gap-1">
                        {req.type === "PRICE_LOCK" ? <Lock size={12} /> : <AlertCircle size={12} />}
                        {req.type.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock size={14} /> {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Title and Description */}
                    <div>
                      <h4 className="text-lg font-bold text-slate-900">{req.title}</h4>
                      <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{req.description}</p>
                    </div>
                    
                    {/* Linked Goal/Product Block (only renders if attached to a specific goal) */}
                    {req.goal && (
                      <div className="inline-flex flex-wrap items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg text-xs font-medium text-slate-600 border border-slate-200">
                        <Package size={14} className="text-indigo-500" />
                        <span>Product: <span className="font-bold text-slate-800">{req.goal.product?.name}</span></span>
                        <span className="text-slate-300">|</span>
                        <span>Target: <span className="font-mono text-indigo-600 font-bold">Rs {Number(req.goal.targetAmount).toLocaleString()}</span></span>
                        {/* Display target buyer if applicable */}
                        {req.targetUser && (
                          <>
                            <span className="text-slate-300">|</span>
                            <span>Buyer: <span className="font-bold text-slate-800">{req.targetUser.name}</span></span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="w-full xl:w-80 shrink-0 flex flex-col gap-4">
                    
                    <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
                      <p className="text-xs font-bold text-slate-400 uppercase mb-4 text-center tracking-wider">Request Status</p>
                      <div className="flex justify-between items-center relative px-2">
                        
                        {/* Background connecting line */}
                        <div className="absolute top-1/2 left-4 right-4 h-1 bg-slate-100 -z-10 -translate-y-1/2 rounded-full"></div>
                        
                        {/* Map over the dynamic steps generated by the getProgressSteps helper */}
                        {getProgressSteps(req.status).map((step, idx) => (
                          <div key={idx} className="flex flex-col items-center gap-1.5 bg-white px-1 relative z-10">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${
                               step.isError && step.active ? "bg-red-50 border-red-500 text-red-600"  // Rejected state (Red)
                               : step.active ? "bg-indigo-50 border-indigo-500 text-indigo-600"  // Active state (Indigo)
                               : "bg-slate-50 border-slate-200 text-slate-300" // Inactive state (Gray)
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

                    {/* Admin Response Block (Only shows if the admin has provided notes) */}
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
          )}
        </div>
      </div>

      {/* === FILE REQUEST MODAL === */}
      {/* Conditionally renders over the UI when isModalOpen is true */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden my-8">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="font-bold text-xl text-slate-900 flex items-center gap-2">
                <ShieldAlert className="text-indigo-600" /> Admin Support Request
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-full transition"><X size={20} /></button>
            </div>
            
            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Request Type Dropdown */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Request Type</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm"
                  >
                    <option value="PRICE_LOCK">Price Lock Adjustment</option>
                    <option value="USER_BEHAVIOR">Report Buyer / User</option>
                    <option value="OTHER">Other Platform Issue</option>
                  </select>
                </div>

                {/* Related Goal Dropdown */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Related Active Goal</label>
                  <select 
                    value={formData.goalId}
                    onChange={(e) => handleGoalSelection(e.target.value)}
                    // Goal is strictly required if the request is about a Price Lock
                    required={formData.type === "PRICE_LOCK"}
                    className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm"
                  >
                    <option value="">-- Select Goal --</option>
                    {/* Maps over the activeGoals array fetched earlier */}
                    {activeGoals.map(g => (
                      <option key={g.id} value={g.id}>
                        {g.product?.name?.slice(0, 20)}... (Buyer: {g.user?.name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Contextual Helper Text: Shows only if PRICE_LOCK is selected */}
              {formData.type === "PRICE_LOCK" && (
                <div className="bg-indigo-50 text-indigo-800 p-3 rounded-lg text-xs font-medium border border-indigo-200 leading-relaxed">
                  <span className="font-bold uppercase tracking-wider">Note:</span> Requesting a price lock change requires Admin approval. Please state the new required price clearly in the description.
                </div>
              )}

              {/* Subject Input */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Subject</label>
                <input 
                  type="text" required maxLength={100}
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  // Dynamic placeholder based on the selected type
                  placeholder={formData.type === "PRICE_LOCK" ? "Inflation Price Adjustment to Rs 5500" : "Brief title of the issue"}
                  className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
              </div>

              {/* Detailed Explanation Textarea */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Detailed Explanation</label>
                <textarea 
                  required rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Explain why the price needs to change, or details about the issue..."
                  className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm"
                />
              </div>

              {/* Form Action Buttons */}
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