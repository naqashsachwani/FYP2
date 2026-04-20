// Enforces client-side hydration for this module, enabling the utilization of react's standard Hooks API and DOM event listeners within the Next.js App Router paradigm.
"use client";

// --- DEPENDENCY INJECTIONS ---
// React core hooks for managing component lifecycle (useEffect), local state (useState), and performance optimization via memoization (useMemo).
import { useEffect, useState, useMemo } from "react";
// Lucide React library for scalable vector graphics (SVG). Utilized to enhance UX without significant bundle size overhead.
import { Loader2, AlertTriangle, CheckCircle, MessageSquareWarning, X, Package, Clock, ShieldAlert, ChevronDown, Check, Filter } from "lucide-react";
// react-hot-toast library for implementing non-blocking, asynchronous UI notifications.
import toast from "react-hot-toast";
// Clerk authentication context providers. useAuth hook extracts JWT-based session data to verify user authorization state prior to rendering secure components.
import { useAuth, SignInButton } from "@clerk/nextjs";

export default function UserComplaintsPage() {
  
  // Destructures the authentication payload. 
  const { isLoaded, userId } = useAuth();
  
  // Initializes state for the core datasets using empty array defaults to prevent 
  // undefined reference errors during the initial render cycle.
  const [complaints, setComplaints] = useState([]);
  const [goals, setGoals] = useState([]);
  
  // Boolean state to manage the UI skeleton/loader during asynchronous network requests.
  const [loading, setLoading] = useState(true);

  // State variables bound to the filtering UI, dictating the criteria for data projection.
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL");

  // Boolean flags managing the conditional rendering of the modal and custom dropdown DOM elements.
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOrderDropdownOpen, setIsOrderDropdownOpen] = useState(false);
  
  // State to manage form submission lifecycle, utilized to disable rapid sequential HTTP requests.
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Implements a controlled component architecture. This object holds the mutable state for the form inputs, ensuring single-source-of-truth data binding.
  const [formData, setFormData] = useState({
    title: "",                 
    type: "PRODUCT_ISSUE",     
    goalId: "",                
    description: ""            
  });

  // --- DERIVED STATE ---
  // Executes a search through the goals array to locate the object matching the currently selected goalId. Used to dynamically update the custom UI.
  const selectedGoal = goals.find(g => g.id === formData.goalId);

  // ================= DATA FETCHING & API CONSUMPTION =================
  // wrapper for executing HTTP GET requests to the internal API endpoint.
  const fetchData = async () => {
    try {
      // Initiates a network request to the backend service.
      const res = await fetch("/api/complaints/user");
      
      // Validates the HTTP response status code.
      if (!res.ok) throw new Error("Failed to load data");
      
      // Parses the incoming JSON payload into native JavaScript objects.
      const data = await res.json();
      
      // Mutates component state with the fetched datasets, triggering a reconciliation cycle.
      setComplaints(data.complaints);
      setGoals(data.goals);
    } catch (error) {
      // Catch block to handle network timeouts.
      toast.error("Could not load complaints.");
    } finally {
      // Ensures the loading state is strictly resolved to false, mitigating infinite loading UX issues.
      setLoading(false);
    }
  };

  // ================= LIFECYCLE HOOKS =================
  // Executes side-effects post-render. The dependency array ensures this effect only fires when the authentication context resolves and a valid user session is detected.
  useEffect(() => {
    if (isLoaded && userId) {
      fetchData();
    }
  }, [isLoaded, userId]);

  // ================= MEMOIZED DATA TRANSFORMATION =================
  // Implements useMemo to memoize the filtered dataset.
  const filteredComplaints = useMemo(() => {
    return complaints.filter((comp) => {
      // Evaluates status filter: Bypasses check if set to global "ALL", otherwise strictly compares.
      const matchesStatus = filterStatus === "ALL" || comp.status === filterStatus;
      // Evaluates type filter logic.
      const matchesType = filterType === "ALL" || comp.type === filterType;
      
      // Returns boolean AND to ensure intersection of both filter criteria.
      return matchesStatus && matchesType;
    });
  }, [complaints, filterStatus, filterType]);

  // Utility function to reset mutable filter states to their base configurations.
  const clearFilters = () => {
    setFilterStatus("ALL");
    setFilterType("ALL");
  };

  // ================= HTTP POST CONTROLLER (FORM SUBMIT) =================
  // Asynchronous event handler for the complaint submission payload.
  const handleSubmit = async (e) => {
    // Intercepts and prevents the default DOM submission event to handle data transmission manually.
    e.preventDefault(); 
    setIsSubmitting(true); 
    
    // Initializes an asynchronous UI notification reference.
    const toastId = toast.loading("Submitting complaint...");

    try {
      // Constructs and executes a RESTful POST request.
      const res = await fetch("/api/complaints/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" }, // Declares MIME backend parsing.
        body: JSON.stringify(formData) 
      });
      
      const data = await res.json();
      // Error handling routine: throws exception if the backend rejects the payload.
      if (!res.ok) throw new Error(data.error);

      // Updates the existing notification reference with a success state.
      toast.success("Complaint filed successfully.", { id: toastId });
      
      // UI Cleanup: Dismisses the modal and resets the form payload state object to default configurations.
      setIsModalOpen(false);
      setFormData({ title: "", type: "PRODUCT_ISSUE", goalId: "", description: "" });
      
      // Executes a re-fetch to synchronize the client-side state with the updated backend database state.
      fetchData(); 
    } catch (error) {
      // Updates the notification reference with the specific error trace caught during execution.
      toast.error(error.message, { id: toastId });
    } finally {
      // Restores the submit button state to prevent UI locking.
      setIsSubmitting(false);
    }
  };

  // ================= UTILITY FUNCTIONS =================
  // Maps a localized status string to a structural array to dynamically render progress tracking UI nodes.
  const getProgressSteps = (status) => {
    return [
      { label: "Submitted", active: true },
      { label: "Under Review", active: ["IN_PROGRESS", "RESOLVED", "REJECTED"].includes(status) },
      { label: status === "REJECTED" ? "Rejected" : "Resolved", active: ["RESOLVED", "REJECTED"].includes(status), isError: status === "REJECTED" }
    ];
  };

  // ================= COMPONENT RENDER TREE =================
  
  // Render Guard 1: Awaits the resolution of the Clerk authentication provider context.
  if (!isLoaded) {
    return <div className="min-h-[80vh] flex items-center justify-center"><Loader2 className="animate-spin text-green-600 w-10 h-10" /></div>;
  }

  // Render Guard 2: Unauthenticated state fallback. Forces authorization flow before rendering protected UI.
  if (isLoaded && !userId) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-[#f4f4f9]">
        <h2 className="text-3xl sm:text-4xl font-bold text-slate-700 tracking-tight">
          Please{" "}
          <SignInButton mode="modal" fallbackRedirectUrl="/complaints">
            <button className="text-indigo-600 hover:text-indigo-700 hover:underline decoration-2 underline-offset-4 transition-all">
              Sign In
            </button>
          </SignInButton>{" "}
          to continue
        </h2>
      </div>
    );
  }

  // Render Guard 3: Awaits the resolution of the internal data fetching promise.
  if (loading) {
    return <div className="min-h-[80vh] flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-green-600 w-10 h-10" /></div>;
  }

  // Primary Render Output for Authenticated & Hydrated State
  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12 text-gray-800">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* --- PAGE HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
              <MessageSquareWarning className="text-green-600 w-8 h-8" /> 
              Support & Complaints
            </h1>
            <p className="text-gray-500 mt-1">Track issues or open a new dispute with a store.</p>
          </div>
          {/* Invokes state mutation to render the modal portal */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition shadow-md flex items-center gap-2 shrink-0"
          >
            <AlertTriangle size={18} />
            File a Complaint
          </button>
        </div>

        {/* --- FILTER CONTROL PANEL --- */}
        {/* Conditionally renders only if the base dataset size is greater than zero. */}
        {complaints.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            
            {/* Dynamic Node: Binds to the length property of the memoized filtered dataset. */}
            <div className="text-sm font-medium text-slate-500 w-full sm:w-auto text-center sm:text-left">
              Showing <span className="font-bold text-slate-700">{filteredComplaints.length}</span> complaint{filteredComplaints.length !== 1 ? 's' : ''}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              
              {/* Controlled Select Component: Two-way binding with filterStatus state. */}
              <div className="relative w-full sm:w-48">
                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)} 
                  className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-slate-700 appearance-none focus:border-green-500 focus:bg-white outline-none cursor-pointer transition-all"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              </div>

              {/* Controlled Select Component: Two-way binding with filterType state. */}
              <div className="relative w-full sm:w-48">
                <select 
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-slate-700 appearance-none focus:border-green-500 focus:bg-white outline-none cursor-pointer transition-all"
                >
                  <option value="ALL">All Categories</option>
                  <option value="PRODUCT_ISSUE">Product Issue</option>
                  <option value="DELIVERY">Delivery Problem</option>
                  <option value="REFUND">Refund Issue</option>
                  <option value="PAYMENT">Payment Problem</option>
                  <option value="STORE_BEHAVIOR">Seller Behavior</option>
                  <option value="OTHER">Other</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              </div>
            </div>
          </div>
        )}

        {/* --- DATA PROJECTION VIEW --- */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          
          {/* Render Logic Fork: Empty state for unpopulated database. */}
          {complaints.length === 0 ? (
            <div className="text-center py-16 px-4">
              <CheckCircle className="w-16 h-16 text-green-200 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800">No Complaints Found</h3>
              <p className="text-gray-500 mt-2">You don't have any active or past disputes.</p>
            </div>
          ) 
          
          // Render Logic Fork: Empty state due to highly restrictive filter parameters.
          : filteredComplaints.length === 0 ? (
            <div className="text-center py-16 px-4 bg-gray-50/50">
              <Filter className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-800">No Matches Found</h3>
              <p className="text-sm text-gray-500 mt-1 mb-4">We couldn't find any complaints matching your current filters.</p>
              {/* Executes utility function to reset filter states and re-render the view. */}
              <button onClick={clearFilters} className="text-sm font-bold text-green-600 hover:text-green-700 hover:underline">
                Clear Filters
              </button>
            </div>
          ) 
          
          // Render Logic Fork: Populated state. Maps the memoized array to React nodes.
          : (
            <div className="divide-y divide-gray-100">
              {filteredComplaints.map((comp) => (
                <div key={comp.id} className="p-6 hover:bg-slate-50 transition flex flex-col md:flex-row gap-6 justify-between">
                  
                  {/* Complaint Metadata Node */}
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
                    
                    {/* Conditionally renders associative foreign key data (Goal/Order relation) */}
                    {comp.goal && (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-medium text-gray-600 border border-gray-200">
                        <Package size={14} className="text-blue-500" />
                        Order: <span className="font-bold text-gray-800">{comp.goal.product?.name}</span>
                        {comp.targetStore && <span className="text-gray-400 pl-1">• Store: {comp.targetStore.name}</span>}
                      </div>
                    )}
                  </div>

                  {/* Structural Progress Timeline Node */}
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
                    
                    {/* Conditionally renders admin evaluation notes if present in the schema. */}
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

      {/* ================= MODAL PORTAL (DATA INGESTION UI) ================= */}
      {/* Conditionally rendered based on isModalOpen boolean state. */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-[500px] shadow-2xl overflow-hidden my-8 border border-white/20">
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100">
              <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                <div className="p-1.5 bg-green-100 rounded-lg text-green-600"><AlertTriangle size={18} /></div>
                File Complaint
              </h3>
              {/* Unmounts the modal component from the DOM tree. */}
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition"><X size={20} /></button>
            </div>
            
            {/* Form controller: binds to the handleSubmit asynchronous function. */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              
              {/* --- CONTROLLED INPUT: TITLE --- */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Complaint Title</label>
                <input 
                  type="text" required maxLength={100}
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})} 
                  placeholder="E.g., Item arrived broken or late"
                  className="w-full border border-slate-200 bg-white px-4 py-2.5 rounded-xl focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all outline-none text-slate-800 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                
                {/* --- CONTROLLED SELECT: TYPE ENUM --- */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Category</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full border border-slate-200 bg-white px-4 py-2.5 rounded-xl focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all outline-none text-sm appearance-none text-slate-800"
                  >
                    <option value="PRODUCT_ISSUE">Product Issue</option>
                    <option value="DELIVERY">Delivery Problem</option>
                    <option value="REFUND">Refund Issue</option>
                    <option value="PAYMENT">Payment Problem</option>
                    <option value="STORE_BEHAVIOR">Seller Behavior</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                {/* --- CUSTOM RELATIONAL DROPDOWN UI --- */}
                {/* Utilized to bypass native HTML <select> restrictions, allowing dynamic asset rendering (images). */}
                <div className="relative">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Related Product</label>
                  <button
                    type="button" 
                    onClick={() => setIsOrderDropdownOpen(!isOrderDropdownOpen)} 
                    className="w-full border border-slate-200 bg-white px-4 py-2.5 rounded-xl flex justify-between items-center hover:border-slate-300 transition-all text-left text-sm"
                  >
                    <span className="truncate text-slate-800">
                      {selectedGoal ? selectedGoal.product?.name : "Select Product..."}
                    </span>
                    <ChevronDown className={`text-slate-400 transition-transform shrink-0 ml-2 ${isOrderDropdownOpen ? 'rotate-180' : ''}`} size={16} />
                  </button>

                  {/* Conditionally renders the absolutely positioned floating menu portal. */}
                  {isOrderDropdownOpen && (
                    <div className="absolute top-full left-0 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto p-1.5 animate-in zoom-in-95">
                      <button 
                        type="button"
                        onClick={() => { setFormData({...formData, goalId: ""}); setIsOrderDropdownOpen(false); }}
                        className="w-full p-2 rounded-lg text-left hover:bg-slate-50 text-[11px] font-bold text-slate-400 mb-1"
                      >
                        -- None / General Complaint --
                      </button>
                      
                      {/* Maps relational data to interactive UI nodes. */}
                      {goals.map(g => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => {
                            setFormData({...formData, goalId: g.id}); 
                            setIsOrderDropdownOpen(false); 
                          }}
                          className={`w-full flex items-center gap-2 p-2 rounded-lg transition-all mb-1 hover:bg-green-50 group ${formData.goalId === g.id ? 'bg-green-50' : ''}`}
                        >
                          <div className="w-8 h-8 bg-slate-100 rounded overflow-hidden shrink-0 border border-slate-200">
                            <img src={g.product?.images?.[0] || "/placeholder.png"} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <p className="text-xs font-medium text-slate-800 truncate">{g.product?.name}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase">{new Date(g.createdAt).toLocaleDateString()}</p>
                          </div>
                          {/* Visual indicator for currently active relational state. */}
                          {formData.goalId === g.id && <Check className="text-green-600 shrink-0" size={14} />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* --- CONDITIONAL UI METADATA --- */}
              {/* Injects policy warnings based on dynamically selected complaint typings. */}
              {["PRODUCT_ISSUE", "DELIVERY"].includes(formData.type) && (
                <div className="bg-orange-50 p-3 rounded-xl text-xs font-medium text-orange-700 border border-orange-100 flex gap-2">
                  <ShieldAlert className="shrink-0 mt-0.5" size={14} />
                  <p>Delivered product claims must be filed within 7 days.</p>
                </div>
              )}

              {/* --- CONTROLLED INPUT: DESCRIPTION --- */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">Issue Description</label>
                <textarea 
                  required rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Explain what happened in detail..."
                  className="w-full border border-slate-200 bg-white px-4 py-3 rounded-xl focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all outline-none resize-none text-sm text-slate-800"
                />
              </div>

              {/* --- FORM ACTION CONTROLLERS --- */}
              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-200 transition-all">Cancel</button>
                
                {/* Submit button bounds to isSubmitting state to mitigate rapid sequential dispatching (double-clicking). */}
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