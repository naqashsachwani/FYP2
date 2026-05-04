"use client"; 

import { useEffect, useState } from "react";
import { Loader2, User, Store as StoreIcon, CheckCircle, XCircle, ExternalLink, DollarSign, Wallet, ShieldAlert, FileText, X, CreditCard, Search, Filter, Ticket, CalendarClock, Image as ImageIcon, ChevronLeft, ChevronRight, Banknote, Truck, Hash } from "lucide-react";
import toast from "react-hot-toast"; 

const GoalDetailsModal = ({ goalId, onClose }) => {
  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!goalId) return;
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/goals/${goalId}`);
        const data = await res.json();
        if (data.goal) setGoal(data.goal);
      } catch (e) { 
        toast.error("Failed to load details"); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchDetails();
  }, [goalId]);

  if (!goalId) return null; 

  if (loading) return <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"><Loader2 className="animate-spin text-white w-10 h-10" /></div>;
  if (!goal) return null; 

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex justify-between items-center p-4 border-b bg-slate-50 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900">Goal Details</h2>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {goalId}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-full transition-colors text-slate-500"><X size={18} /></button>
        </div>
        
        <div className="p-4 space-y-4 overflow-y-auto">
            <div className="flex gap-3 items-center p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                 <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                    <img src={goal.product?.images?.[0] || "/placeholder.png"} className="w-full h-full object-cover" alt="Product" />
                 </div>
                 <div className="flex-1">
                    <h3 className="font-bold text-sm text-slate-900 leading-tight">{goal.product?.name}</h3>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider">
                        <StoreIcon size={12} /> {goal.product?.store?.name || "Store Info N/A"}
                    </div>
                 </div>
                 <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                   goal.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-200' : 
                   goal.status === 'REFUNDED' ? 'bg-red-50 text-red-700 border-red-200' : 
                   'bg-blue-50 text-blue-700 border-blue-200'
                 }`}>
                    {goal.status}
                 </span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                 <div className="p-3 border border-slate-200 rounded-xl bg-white shadow-sm">
                    <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mb-1">Target Amount</p>
                    <p className="text-lg font-mono font-bold text-slate-900">Rs {Number(goal.targetAmount).toLocaleString()}</p>
                 </div>
                 <div className="p-3 border rounded-xl bg-emerald-50 border-emerald-100 shadow-sm">
                    <p className="text-[9px] text-emerald-600 uppercase font-bold tracking-wider mb-1">Saved So Far</p>
                    <p className="text-lg font-mono font-bold text-emerald-700">Rs {Number(goal.saved).toLocaleString()}</p>
                 </div>
            </div>
            
            <div>
                 <h4 className="font-bold text-slate-800 flex items-center gap-1.5 mb-2 text-xs uppercase tracking-wider">
                    <CreditCard size={14} className="text-slate-400"/> Deposit History
                 </h4>
                 <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    <table className="w-full text-xs text-left">
                       <thead className="bg-slate-50 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                         <tr>
                            <th className="p-2.5">Date</th>
                            <th className="p-2.5">Method</th>
                            <th className="p-2.5 text-right">Amount</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                          {goal.deposits?.length === 0 ? (
                            <tr><td colSpan="3" className="p-3 text-center text-slate-400 text-xs">No deposits yet.</td></tr>
                          ) : (
                            goal.deposits?.map(d => (
                              <tr key={d.id} className="hover:bg-slate-50">
                                <td className="p-2.5 text-slate-600">{new Date(d.createdAt).toLocaleDateString()}</td>
                                <td className="p-2.5 text-[10px] font-bold text-slate-500">{d.paymentMethod}</td>
                                <td className="p-2.5 text-right font-mono font-bold text-emerald-600">+ Rs {Number(d.amount).toLocaleString()}</td>
                              </tr>
                            ))
                          )}
                       </tbody>
                    </table>
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null); 

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [filerFilter, setFilerFilter] = useState("ALL");

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const [viewingGoalId, setViewingGoalId] = useState(null);

  const [resolvingId, setResolvingId] = useState(null); 
  const [adminNotes, setAdminNotes] = useState("");
  const [newPrice, setNewPrice] = useState(""); 
  
  const [processRefund, setProcessRefund] = useState(false); 
  const [issueCoupon, setIssueCoupon] = useState(false);
  const [couponValue, setCouponValue] = useState("");
  const [expiryDays, setExpiryDays] = useState("30"); 

  const [creditWallet, setCreditWallet] = useState(false);
  const [creditAmount, setCreditAmount] = useState("");

  const fetchComplaints = async () => {
    try {
      const res = await fetch("/api/admin/complaints");
      const data = await res.json();
      setComplaints(data.complaints);
    } catch (e) { toast.error("Failed to load complaints"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchComplaints(); }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter, filerFilter]);

  const handleAction = async (id, status) => {
    if (status === "RESOLVED" && issueCoupon && (!couponValue || Number(couponValue) <= 0)) {
       return toast.error("Please enter a valid coupon discount value.");
    }
    if (status === "RESOLVED" && creditWallet && (!creditAmount || Number(creditAmount) <= 0)) {
       return toast.error("Please enter a valid amount to credit to the wallet.");
    }

    setProcessingId(id);
    try {
      const res = await fetch("/api/admin/complaints", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          complaintId: id, 
          status, 
          adminNotes, 
          newPrice, 
          processRefund,
          issueCoupon,
          couponValue,
          expiryDays,
          creditWallet,
          creditAmount 
        })
      });
      
      if (!res.ok) throw new Error();
      
      toast.success(status === "RESOLVED" ? "Complaint resolved successfully!" : "Complaint rejected.");
      
      setResolvingId(null);
      setAdminNotes("");
      setNewPrice("");
      setProcessRefund(false);
      setIssueCoupon(false);
      setCouponValue("");
      setExpiryDays("30");
      setCreditWallet(false); 
      setCreditAmount("");    
      
      fetchComplaints(); 
    } catch (e) { toast.error("Failed to update"); }
    finally { setProcessingId(null); }
  };

  const filteredComplaints = complaints.filter(c => {
    let matchStatus = true;
    if (statusFilter !== "ALL") {
      if (statusFilter === "IN_PROGRESS") {
        matchStatus = c.status === "OPEN" || c.status === "IN_PROGRESS";
      } else {
        matchStatus = c.status === statusFilter;
      }
    }
    
    const matchType = typeFilter === "ALL" || c.type === typeFilter;
    
    let matchFiler = true;
    if (filerFilter === "USER") {
        matchFiler = !!c.filerUserId && !c.filerRiderId; 
    }
    if (filerFilter === "STORE") {
        matchFiler = !!c.filerStoreId;
    }
    if (filerFilter === "RIDER") {
        matchFiler = !!c.filerRiderId; 
    }
    
    // ✅ SEARCH LOGIC NOW SUPPORTS COMPLAINT ID SEARCH
    const term = searchTerm.toLowerCase();
    const matchSearch = term === "" || 
      (c.complaintId || "").toLowerCase().includes(term) ||
      (c.id || "").toLowerCase().includes(term) ||
      c.title.toLowerCase().includes(term) ||
      c.description.toLowerCase().includes(term) ||
      (c.filerUser?.name || "").toLowerCase().includes(term) ||
      (c.filerStore?.name || "").toLowerCase().includes(term) ||
      (c.targetUser?.name || "").toLowerCase().includes(term) || 
      (c.targetStore?.name || "").toLowerCase().includes(term) ||
      (c.goal?.product?.name || "").toLowerCase().includes(term);

    return matchStatus && matchType && matchFiler && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredComplaints.length / ITEMS_PER_PAGE));
  const currentComplaints = filteredComplaints.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="p-4 sm:p-8 bg-slate-50 min-h-screen relative">
      
      {viewingGoalId && <GoalDetailsModal goalId={viewingGoalId} onClose={() => setViewingGoalId(null)} />}

      <div className="max-w-6xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dispute Management</h1>
            <p className="text-slate-500">Resolve issues between stores, customers, and riders</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 text-sm">
             <span className="font-bold text-slate-700 mr-2">Total: {filteredComplaints.length}</span> | 
             <span className="font-bold text-blue-600 ml-2">
                {filteredComplaints.filter(c => c.status === 'OPEN' || c.status === 'IN_PROGRESS').length} In Progress
             </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search by ID, issue, user, store, rider, or product..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            
            <div className="flex flex-wrap sm:flex-nowrap gap-3">
              <div className="relative flex-1 sm:w-40">
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none font-medium text-slate-700">
                  <option value="ALL">All Statuses</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
              </div>
              <div className="relative flex-1 sm:w-40">
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none font-medium text-slate-700">
                  <option value="ALL">All Types</option>
                  <option value="PRICE_LOCK">Price Lock</option>
                  <option value="PRODUCT_ISSUE">Product Issue</option>
                  <option value="DELIVERY">Delivery</option>
                  <option value="REFUND">Refund</option>
                  <option value="PAYMENT">Payment</option>
                  <option value="USER_BEHAVIOR">User Behavior</option>
                  <option value="STORE_BEHAVIOR">Store Behavior</option>
                  <option value="RIDER_ISSUE">Rider Issue</option>
                  <option value="OTHER">Other</option>
                </select>
                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
              </div>
              <div className="relative flex-1 sm:w-40">
                <select value={filerFilter} onChange={(e) => setFilerFilter(e.target.value)} className="w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none font-medium text-slate-700">
                  <option value="ALL">Filed By (All)</option>
                  <option value="USER">Buyers (Users)</option>
                  <option value="STORE">Sellers (Stores)</option>
                  <option value="RIDER">Logistics (Riders)</option>
                </select>
                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
              </div>
            </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          {filteredComplaints.length === 0 ? (
             <div className="p-12 text-center">
                <CheckCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-700">No Complaints Found</h3>
                <p className="text-slate-500 text-sm mt-1">Try adjusting your filters or search term.</p>
                {(searchTerm || statusFilter !== "ALL" || typeFilter !== "ALL" || filerFilter !== "ALL") && (
                  <button onClick={() => { setSearchTerm(""); setStatusFilter("ALL"); setTypeFilter("ALL"); setFilerFilter("ALL"); }} className="mt-4 text-blue-600 hover:underline text-sm font-medium">Clear all filters</button>
                )}
             </div>
          ) : (
             <>
               <div className="divide-y divide-gray-100">
                 {currentComplaints.map((c) => (
                   <div key={c.id} className="p-6 transition-all hover:bg-slate-50">
                     
                     <div className="flex justify-between items-start mb-4">
                       <div className="flex items-center gap-3">
                         <div className={`p-2 rounded-lg ${c.filerRiderId ? 'bg-orange-50 text-orange-600' : c.filerUserId ? 'bg-green-50 text-green-600' : 'bg-indigo-50 text-indigo-600'}`}>
                           {c.filerRiderId ? <Truck size={20}/> : c.filerUserId ? <User size={20} /> : <StoreIcon size={20} />}
                         </div>
                         <div>
                           {/* ✅ NEW: Displays the ID along with the Title */}
                           <div className="flex items-center gap-2 mb-1">
                               <h3 className="font-bold text-slate-900">{c.title}</h3>
                               <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded flex items-center border border-slate-200">
                                   <Hash size={10} className="mr-0.5 text-slate-400" />
                                   {c.complaintId || c.id.slice(-6).toUpperCase()}
                               </span>
                           </div>
                           <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                             From: {c.filerRiderId ? c.filerRider?.user?.name : c.filerUserId ? c.filerUser?.name : c.filerStore?.name} • Type: {c.type.replace('_', ' ')}
                           </p>
                         </div>
                       </div>
                       <span className={`px-3 py-1 rounded-full text-xs font-bold border ${c.status === 'OPEN' || c.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                         {c.status.replace('_', ' ')}
                       </span>
                     </div>

                     <p className="text-slate-600 text-sm mb-4 leading-relaxed">{c.description}</p>

                     {c.imageUrl && (
                         <div className="flex flex-wrap gap-2 mb-4">
                             {(() => {
                                 let images = [];
                                 try { images = JSON.parse(c.imageUrl); if (!Array.isArray(images)) images = [c.imageUrl]; }
                                 catch(e) { images = [c.imageUrl]; }
                                 
                                 return images.map((img, idx) => (
                                     <a key={idx} href={img} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 rounded-lg text-xs font-medium text-indigo-600 border border-indigo-100 hover:bg-indigo-100 transition">
                                         <ImageIcon size={14} /> View Evidence {images.length > 1 ? idx + 1 : ''}
                                     </a>
                                 ));
                             })()}
                         </div>
                     )}

                     {c.goal && (
                       <div className="bg-white p-4 rounded-xl border border-slate-200 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                         <div className="space-y-1">
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Linked Goal</p>
                            <p className="text-slate-700 font-bold">{c.goal.product?.name}</p>
                            <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-600">
                               <span>Target: Rs {Number(c.goal.targetAmount).toLocaleString()}</span>
                               <span>Saved: Rs {Number(c.goal.saved).toLocaleString()}</span>
                               
                               {c.targetUser && <span className="px-2 py-0.5 rounded border font-bold bg-orange-50 text-orange-700 border-orange-200">Target Rider: {c.targetUser.name}</span>}
                               {c.targetStore && !c.targetUser && <span className="px-2 py-0.5 rounded border font-bold bg-gray-100 text-gray-700 border-gray-200">Target Store: {c.targetStore.name}</span>}

                               {c.goal.escrow && (
                                 <span className={`px-2 py-0.5 rounded border font-bold ${
                                   c.goal.escrow.status === 'HELD' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                   c.goal.escrow.status === 'REFUNDED' ? 'bg-red-50 text-red-700 border-red-200' :
                                   'bg-green-50 text-green-700 border-green-200'
                                 }`}>
                                   Escrow: {c.goal.escrow.status}
                                 </span>
                               )}
                            </div>
                         </div>
                         <button onClick={() => setViewingGoalId(c.goal.id)} className="text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm">
                           View Details <ExternalLink size={14} />
                         </button>
                       </div>
                     )}

                     {(c.status === 'OPEN' || c.status === 'IN_PROGRESS') && resolvingId !== c.id && (
                        <div className="flex gap-2">
                           <button onClick={() => { setResolvingId(c.id); setProcessRefund(false); setCreditWallet(false); setCreditAmount(""); setIssueCoupon(false); setCouponValue(""); setExpiryDays("30"); }} className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors">
                             Take Action
                           </button>
                        </div>
                     )}

                     {resolvingId === c.id && (
                       <div className="mt-4 p-5 bg-slate-50 rounded-xl border border-blue-200 space-y-5 shadow-inner">
                         
                         {c.type === "PRICE_LOCK" && (
                            <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">New Target Price (PKR)</label>
                              <div className="relative">
                                 <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                 <input type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} placeholder="Enter approved price..." className="pl-9 w-full p-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                              </div>
                            </div>
                         )}

                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                           
                           {c.filerUserId && c.goal && ["PRODUCT_ISSUE", "REFUND", "DELIVERY"].includes(c.type) && (
                             <div className={`bg-white p-4 border rounded-lg shadow-sm transition-all ${processRefund ? 'border-blue-400 ring-1 ring-blue-400' : 'border-blue-200 hover:border-blue-300'}`}>
                               <label className="flex items-start gap-3 cursor-pointer">
                                 <input type="checkbox" checked={processRefund} onChange={(e) => setProcessRefund(e.target.checked)} className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300" />
                                 <div>
                                   <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                                     <Wallet size={16} className="text-blue-600" /> Full Goal Refund
                                   </p>
                                   <p className="text-xs text-slate-500 mt-1">
                                      Refunds Rs {Number(c.goal.saved).toLocaleString()} to User and penalizes the store ledger.
                                   </p>
                                 </div>
                               </label>
                             </div>
                           )}

                           {(c.filerUserId || c.filerRiderId) && (
                             <div className={`bg-white p-4 border rounded-lg shadow-sm transition-all ${creditWallet ? 'border-purple-400 ring-1 ring-purple-400' : 'border-purple-200 hover:border-purple-300'}`}>
                               <label className="flex items-start gap-3 cursor-pointer mb-3">
                                 <input type="checkbox" checked={creditWallet} onChange={(e) => setCreditWallet(e.target.checked)} className="mt-1 w-4 h-4 text-purple-600 rounded focus:ring-purple-500 border-gray-300" />
                                 <div>
                                   <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                                     <Banknote size={16} className="text-purple-600" /> Custom Wallet Credit
                                   </p>
                                   <p className="text-xs text-slate-500 mt-1">Send a specific amount to the filer (e.g. Rider Payout).</p>
                                 </div>
                               </label>

                               {creditWallet && (
                                 <div className="animate-in fade-in slide-in-from-top-1 pl-7">
                                   <div className="relative">
                                     <DollarSign size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                                     <input type="number" placeholder="Amount (PKR)" value={creditAmount} onChange={(e) => setCreditAmount(e.target.value)} className="w-full pl-6 p-2 text-xs border rounded-lg outline-none focus:ring-2 focus:ring-purple-500" />
                                   </div>
                                 </div>
                               )}
                             </div>
                           )}

                           {c.filerUserId && !c.filerRiderId && (
                             <div className={`bg-white p-4 border rounded-lg shadow-sm transition-all ${issueCoupon ? 'border-emerald-400 ring-1 ring-emerald-400' : 'border-emerald-200 hover:border-emerald-300'}`}>
                               <label className="flex items-start gap-3 cursor-pointer mb-3">
                                 <input type="checkbox" checked={issueCoupon} onChange={(e) => setIssueCoupon(e.target.checked)} className="mt-1 w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-gray-300" />
                                 <div>
                                   <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                                     <Ticket size={16} className="text-emerald-600" /> Apology Coupon
                                   </p>
                                   <p className="text-xs text-slate-500 mt-1">Generate a unique promo code.</p>
                                 </div>
                               </label>

                               {issueCoupon && (
                                 <div className="flex gap-2 animate-in fade-in slide-in-from-top-1 pl-7">
                                   <input type="number" placeholder="Discount Value" value={couponValue} onChange={(e) => setCouponValue(e.target.value)} className="w-1/2 p-2 text-xs border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
                                   <div className="relative w-1/2">
                                     <CalendarClock size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                                     <input type="number" title="Valid for (Days)" placeholder="Days" value={expiryDays} onChange={(e) => setExpiryDays(e.target.value)} className="w-full pl-6 p-2 text-xs border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
                                   </div>
                                 </div>
                               )}
                             </div>
                           )}
                         </div>

                         {["USER_BEHAVIOR", "STORE_BEHAVIOR", "OTHER", "PAYMENT", "RIDER_ISSUE"].includes(c.type) && (
                           <div className="bg-orange-50 p-4 border border-orange-200 rounded-lg shadow-sm flex gap-3 items-start">
                             <ShieldAlert className="text-orange-600 mt-0.5 shrink-0" size={18} />
                             <div>
                               <p className="text-sm font-bold text-orange-900">Administrative Warning</p>
                               <p className="text-xs text-orange-800 mt-1">Approving this ticket sends an official system warning containing your notes to the reported party (Store or Rider). Funds are not moved.</p>
                             </div>
                           </div>
                         )}

                         <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Admin Response Note</label>
                           <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Explain your decision. This will be sent to the parties involved..." className="w-full p-3 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none" />
                         </div>
                         
                         <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-200">
                           <button onClick={() => handleAction(c.id, "RESOLVED")} disabled={processingId === c.id} className="flex-1 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm transition-colors">
                             {processingId === c.id ? <Loader2 size={14} className="animate-spin"/> : <><CheckCircle size={14} /> Approve / Resolve</>}
                           </button>
                           <button onClick={() => handleAction(c.id, "REJECTED")} disabled={processingId === c.id} className="flex-1 py-2.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm transition-colors">
                             <XCircle size={14} /> Reject Ticket
                           </button>
                           <button onClick={() => {setResolvingId(null); setCreditWallet(false); setCreditAmount("");}} className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors text-xs font-bold rounded-lg">Cancel</button>
                         </div>
                       </div>
                     )}

                     {c.adminNotes && (c.status === 'RESOLVED' || c.status === 'REJECTED') && (
                        <div className="mt-5 p-4 bg-slate-50 rounded-xl border border-slate-200 flex gap-3 items-start">
                           <FileText size={18} className="text-slate-400 mt-0.5 shrink-0" />
                           <div>
                             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Resolution Note</p>
                             <p className="text-sm text-slate-700 leading-relaxed">{c.adminNotes}</p>
                           </div>
                        </div>
                     )}
                   </div>
                 ))}
               </div>

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
                     <span className="flex items-center px-4 text-sm font-semibold text-gray-700">
                       Page {currentPage} of {totalPages}
                     </span>
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
    </div>
  );
}