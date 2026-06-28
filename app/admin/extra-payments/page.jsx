"use client";

import { useEffect, useState } from "react";
import { Loader2, Gift, Send, Search, ChevronLeft, ChevronRight, Store, Truck, History, CircleDollarSign, X, Users, User, RefreshCcw } from "lucide-react";
import toast from "react-hot-toast";

// BONUS DETAILS MODAL
const BonusDetailsModal = ({ bonus, onClose }) => {
  if (!bonus) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-[95%] sm:w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20 max-h-[90dvh] flex flex-col">
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-indigo-100 bg-indigo-50/50 shrink-0">
          <h2 className="text-lg sm:text-xl font-bold text-indigo-900 flex items-center gap-2"><Gift className="text-indigo-600 w-5 h-5 sm:w-6 sm:h-6"/> Payment Details</h2>
          <button onClick={onClose} className="p-1.5 sm:p-2 hover:bg-indigo-200 text-indigo-500 rounded-full transition-colors"><X size={18} className="w-4 h-4 sm:w-[18px] sm:h-[18px]" /></button>
        </div>
        <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 overflow-y-auto custom-scrollbar">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2 sm:pb-3">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Reference ID</span>
            <span className="text-xs sm:text-sm font-mono font-bold text-slate-800 bg-slate-100 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded shadow-sm border border-slate-200">{bonus.id.slice(-8).toUpperCase()}</span>
          </div>
          <div className="flex justify-between items-center border-b border-slate-100 pb-2 sm:pb-3">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Date Issued</span>
            <span className="text-xs sm:text-sm font-bold text-slate-800">{new Date(bonus.createdAt).toLocaleString('en-GB')}</span>
          </div>
          <div className="flex justify-between items-center border-b border-slate-100 pb-2 sm:pb-3">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Recipient</span>
            <span className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5 sm:gap-2 text-right">
              <span className="truncate max-w-[120px] sm:max-w-[160px]">{bonus.recipientName}</span>
              <span className="text-[8px] sm:text-[10px] bg-indigo-100 text-indigo-700 px-1.5 sm:px-2 py-0.5 rounded-full border border-indigo-200 shrink-0">{bonus.recipientType}</span>
            </span>
          </div>
          <div className="flex justify-between items-center border-b border-slate-100 pb-2 sm:pb-3">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Total Amount</span>
            <span className="text-xs sm:text-sm font-mono font-bold text-green-700 bg-green-50 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded border border-green-200 shadow-sm">Rs {bonus.amount.toLocaleString()}</span>
          </div>
          <div className="pt-1 sm:pt-2">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5 sm:mb-2">Description / Reason</span>
            <p className="text-xs sm:text-sm text-slate-700 bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200 leading-relaxed font-medium shadow-inner break-words">
              {bonus.reason || "Administrative Bonus / Adjustment"}
            </p>
          </div>
        </div>
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 shrink-0">
           <button onClick={onClose} className="w-full py-3 sm:py-3.5 text-sm sm:text-base bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition-colors shadow-md shadow-slate-900/20 active:scale-[0.98]">Close Receipt</button>
        </div>
      </div>
    </div>
  );
};

export default function ExtraPaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [stores, setStores] = useState([]);
  const [riders, setRiders] = useState([]);
  const [history, setHistory] = useState([]);
  const [netRevenue, setNetRevenue] = useState(0); 
  
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBonus, setSelectedBonus] = useState(null); 
  const ITEMS_PER_PAGE = 8;

  // ✅ UI State for Form Modes
  const [paymentMode, setPaymentMode] = useState("INDIVIDUAL"); // INDIVIDUAL | BULK
  
  const [formData, setFormData] = useState({ 
    recipientType: "STORE", // Used for both Single & Bulk targets
    recipientId: "", 
    amount: "", 
    reason: "" 
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/manual-payouts");
      const data = await res.json();
      setStores(data.stores || []); setRiders(data.riders || []); setHistory(data.history || []); setNetRevenue(data.netRevenue || 0); 
    } catch (e) { toast.error("Failed to load data"); } 
    finally { setLoading(false); }
  };

  const handleRefresh = () => {
    setSearchTerm("");
    setCurrentPage(1);
    fetchData();
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  // Derived state for bulk preview
  const payAmount = Number(formData.amount) || 0;
  const bulkRecipientCount = formData.recipientType === "STORE" ? stores.length : riders.length;
  const bulkTotalCost = payAmount * bulkRecipientCount;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (paymentMode === "INDIVIDUAL") {
      if (!formData.recipientId) return toast.error("Please select a recipient.");
      if (payAmount > netRevenue) return toast.error("Insufficient Platform Revenue!");

      const isStore = formData.recipientType === "STORE";
      const recipientObj = isStore ? stores.find(s => s.id === formData.recipientId) : riders.find(r => r.id === formData.recipientId);

      if (!confirm(`Confirm payment of Rs ${payAmount.toLocaleString()} to ${recipientObj.name}?`)) return;

      setSubmitting(true);
      const toastId = toast.loading("Processing payment and notifying recipient...");

      try {
        const res = await fetch("/api/admin/manual-payouts", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, isBulk: false, amount: payAmount, recipientName: recipientObj.name, recipientUserId: recipientObj.userId, recipientEmail: recipientObj.email })
        });
        if (!res.ok) throw new Error((await res.json()).error);
        
        toast.success("Payment sent successfully!", { id: toastId });
        setFormData({ ...formData, recipientId: "", amount: "", reason: "" });
        fetchData(); 
      } catch (error) { toast.error(error.message, { id: toastId }); } 
      finally { setSubmitting(false); }

    } 
    else if (paymentMode === "BULK") {
      if (bulkTotalCost > netRevenue) return toast.error("Insufficient Platform Revenue for this bulk operation!");
      if (bulkRecipientCount === 0) return toast.error("No recipients found in this category.");

      if (!confirm(`⚠️ Confirm bulk bonus of Rs ${payAmount.toLocaleString()} per person to ALL ${bulkRecipientCount} ${formData.recipientType}s?\n\nTotal Cost: Rs ${bulkTotalCost.toLocaleString()}`)) return;

      setSubmitting(true);
      const toastId = toast.loading(`Processing ${bulkRecipientCount} payouts & sending emails...`);

      try {
        const res = await fetch("/api/admin/manual-payouts", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isBulk: true, targetGroup: formData.recipientType, amount: payAmount, reason: formData.reason })
        });
        if (!res.ok) throw new Error((await res.json()).error);
        
        toast.success(`Successfully deposited funds to ${bulkRecipientCount} accounts!`, { id: toastId });
        setFormData({ ...formData, amount: "", reason: "" });
        fetchData(); 
      } catch (error) { toast.error(error.message, { id: toastId }); } 
      finally { setSubmitting(false); }
    }
  };

  const filteredHistory = history.filter(h => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return h.recipientName.toLowerCase().includes(term) || h.reason.toLowerCase().includes(term) || h.recipientType.toLowerCase().includes(term) || h.id.toLowerCase().includes(term); 
  });

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / ITEMS_PER_PAGE));
  const currentHistory = filteredHistory.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  if (loading && history.length === 0) return <div className="min-h-[100dvh] flex items-center justify-center"><Loader2 className="animate-spin text-blue-600 w-10 h-10" /></div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-[100dvh] relative">
      <BonusDetailsModal bonus={selectedBonus} onClose={() => setSelectedBonus(null)} />

      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6 border-b border-slate-200 pb-5 sm:pb-0 sm:border-none">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Extra Payments</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Issue manual compensations, bulk bonuses, or adjustments.</p>
          </div>
          <div className="bg-white border border-indigo-100 p-3 sm:p-4 rounded-xl sm:rounded-2xl flex items-center gap-3 sm:gap-4 shadow-sm w-full md:w-auto">
            <div className="p-2.5 sm:p-3 bg-indigo-50 text-indigo-600 rounded-lg sm:rounded-xl shrink-0"><CircleDollarSign className="w-6 h-6 sm:w-[28px] sm:h-[28px]"/></div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Platform Net Revenue</p>
              <p className="text-xl sm:text-2xl font-black text-slate-900 truncate">Rs {netRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* PAYMENT FORM */}
          <div className="lg:col-span-1 bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 h-fit overflow-hidden">
            
            {/* Mode Switcher */}
            <div className="flex bg-slate-50 border-b border-slate-200">
              <button 
                onClick={() => setPaymentMode("INDIVIDUAL")} 
                className={`flex-1 py-2.5 sm:py-3 text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-colors flex justify-center items-center gap-1.5 sm:gap-2 ${paymentMode === "INDIVIDUAL" ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                <User size={16} className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0"/> Individual
              </button>
              <button 
                onClick={() => setPaymentMode("BULK")} 
                className={`flex-1 py-2.5 sm:py-3 text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-colors flex justify-center items-center gap-1.5 sm:gap-2 ${paymentMode === "BULK" ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                <Users size={16} className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0"/> Bulk Bonus
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              <div>
                <label className="block text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 sm:mb-2">
                  {paymentMode === "BULK" ? "Target Group" : "Recipient Type"}
                </label>
                <div className="flex bg-slate-100 p-1 sm:p-1.5 rounded-lg sm:rounded-xl">
                  <button type="button" onClick={() => setFormData({...formData, recipientType: 'STORE', recipientId: ''})} className={`flex-1 py-1.5 sm:py-2 text-xs sm:text-sm font-bold rounded-md sm:rounded-lg flex items-center justify-center gap-1.5 sm:gap-2 transition-all ${formData.recipientType === 'STORE' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}><Store size={14} className="sm:w-4 sm:h-4 shrink-0"/> {paymentMode === "BULK" ? "All Stores" : "Store"}</button>
                  <button type="button" onClick={() => setFormData({...formData, recipientType: 'RIDER', recipientId: ''})} className={`flex-1 py-1.5 sm:py-2 text-xs sm:text-sm font-bold rounded-md sm:rounded-lg flex items-center justify-center gap-1.5 sm:gap-2 transition-all ${formData.recipientType === 'RIDER' ? 'bg-white shadow-sm text-green-600' : 'text-slate-500 hover:text-slate-700'}`}><Truck size={14} className="sm:w-4 sm:h-4 shrink-0"/> {paymentMode === "BULK" ? "All Riders" : "Rider"}</button>
                </div>
              </div>

              {paymentMode === "INDIVIDUAL" && (
                <div>
                  <label className="block text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1 sm:mb-1.5">Select {formData.recipientType === 'STORE' ? 'Store' : 'Rider'}</label>
                  <select required value={formData.recipientId} onChange={(e) => setFormData({...formData, recipientId: e.target.value})} className="w-full p-2.5 sm:p-3 border border-slate-200 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 bg-slate-50 transition-shadow">
                    <option value="" disabled>-- Choose Recipient --</option>
                    {formData.recipientType === 'STORE' ? stores.map(s => <option key={s.id} value={s.id}>{s.name} ({s.email})</option>) : riders.map(r => <option key={r.id} value={r.id}>{r.name} ({r.email})</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1 sm:mb-1.5">
                  {paymentMode === "BULK" ? "Amount Per Person (PKR)" : "Amount (PKR)"}
                </label>
                <input type="number" required min="1" max={paymentMode === "INDIVIDUAL" ? netRevenue : Math.floor(netRevenue / (bulkRecipientCount || 1))} value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} placeholder="e.g. 1000" className="w-full p-2.5 sm:p-3 border border-slate-200 bg-slate-50 rounded-lg sm:rounded-xl text-xs sm:text-sm font-mono font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 transition-shadow" />
              </div>

              <div>
                <label className="block text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1 sm:mb-1.5">Reason / Description</label>
                <textarea required rows="2" value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} placeholder={paymentMode === "BULK" ? "e.g. Eid Bonus 2026" : "e.g. Compensation for damaged order"} className="w-full p-2.5 sm:p-3 border border-slate-200 bg-slate-50 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none resize-y min-h-[60px] text-slate-700 transition-shadow custom-scrollbar" />
              </div>

              {/* Dynamic Submit Button */}
              {paymentMode === "BULK" ? (
                <div className="pt-1 sm:pt-2">
                  <div className={`p-3 sm:p-4 rounded-xl border mb-3 sm:mb-4 text-center ${bulkTotalCost > netRevenue ? 'bg-red-50 border-red-200' : 'bg-indigo-50 border-indigo-100'}`}>
                    <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase mb-1">Total Platform Deduction</p>
                    <p className={`text-xl sm:text-2xl font-black font-mono truncate px-1 ${bulkTotalCost > netRevenue ? 'text-red-600' : 'text-indigo-700'}`}>Rs {bulkTotalCost.toLocaleString()}</p>
                    <p className="text-[9px] sm:text-[10px] text-slate-400 mt-1">({payAmount} × {bulkRecipientCount} {formData.recipientType.toLowerCase()}s)</p>
                  </div>
                  <button type="submit" disabled={submitting || bulkTotalCost > netRevenue || bulkRecipientCount === 0 || payAmount <= 0} className="w-full py-3 sm:py-3.5 bg-indigo-600 text-white text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl hover:bg-indigo-700 transition flex items-center justify-center gap-1.5 sm:gap-2 disabled:opacity-50 shadow-md shadow-indigo-500/20 active:scale-[0.98] disabled:active:scale-100">
                    {submitting ? <Loader2 size={16} className="animate-spin sm:w-[18px] sm:h-[18px]" /> : <Send size={16} className="sm:w-[18px] sm:h-[18px] shrink-0" />} Issue Bulk Bonus
                  </button>
                </div>
              ) : (
                <button type="submit" disabled={submitting || payAmount > netRevenue || payAmount <= 0} className="w-full py-3 sm:py-3.5 bg-indigo-600 text-white text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl hover:bg-indigo-700 transition flex items-center justify-center gap-1.5 sm:gap-2 disabled:opacity-50 shadow-md shadow-indigo-500/20 mt-1 sm:mt-2 active:scale-[0.98] disabled:active:scale-100">
                  {submitting ? <Loader2 size={16} className="animate-spin sm:w-[18px] sm:h-[18px]" /> : <Send size={16} className="sm:w-[18px] sm:h-[18px] shrink-0" />} Issue Funds
                </button>
              )}
            </form>
          </div>

          {/* HISTORY TABLE WITH CLICKABLE ROWS */}
          <div className="lg:col-span-2 bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full min-h-[400px]">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 bg-slate-50/50 shrink-0">
              <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2"><History className="text-indigo-500 w-5 h-5 sm:w-6 sm:h-6 shrink-0"/> Payout History</h2>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input type="text" placeholder="Search ID or Recipient..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 border border-slate-200 rounded-lg text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none bg-white transition-shadow" />
                </div>
                <button 
                  onClick={handleRefresh} 
                  disabled={loading}
                  className="p-2 sm:p-2.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm transition-colors text-slate-600 shrink-0"
                  title="Reset search and refresh"
                >
                  <RefreshCcw size={18} className={`sm:w-4 sm:h-4 ${loading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto flex-1 custom-scrollbar">
              <table className="w-full text-sm text-left min-w-[600px]">
                <thead className="bg-slate-50 text-slate-400 uppercase text-[9px] sm:text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 sm:py-4">Ref ID</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4">Date</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4">Recipient</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4">Reason</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentHistory.length === 0 ? (
                    <tr><td colSpan="5" className="px-4 sm:px-6 py-12 text-center text-slate-400 text-xs sm:text-sm">No payout records found.</td></tr>
                  ) : currentHistory.map((h) => (
                    <tr key={h.id} className="hover:bg-indigo-50/50 transition-colors cursor-pointer group" onClick={() => setSelectedBonus(h)}>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 font-mono text-[10px] sm:text-xs text-blue-600 group-hover:underline whitespace-nowrap">
                        {h.id.slice(-8).toUpperCase()}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-slate-500 text-[10px] sm:text-xs whitespace-nowrap">
                        {new Date(h.createdAt).toLocaleDateString('en-GB')}<br/><span className="text-[9px] sm:text-[10px]">{new Date(h.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 font-bold text-slate-800 text-xs sm:text-sm">
                        <div className="flex items-center gap-1.5 sm:gap-2 mt-1 sm:mt-2">
                           {h.recipientType === 'STORE' ? <Store className="text-blue-500 w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0"/> : <Truck className="text-green-500 w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0"/>}
                           <span className="truncate max-w-[120px]">{h.recipientName}</span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-slate-600 font-medium text-[10px] sm:text-xs max-w-[150px] truncate" title={h.reason}>{h.reason}</td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 font-mono font-bold text-xs sm:text-sm text-indigo-600 text-right whitespace-nowrap">Rs {h.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredHistory.length > 0 && (
              <div className="p-3 sm:p-4 border-t border-slate-100 bg-white flex justify-between items-center shrink-0">
                 <span className="text-[10px] sm:text-xs font-medium text-slate-500 uppercase tracking-wider">Page {currentPage} of {totalPages}</span>
                 <div className="flex gap-1.5 sm:gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 sm:p-2 bg-white border border-slate-200 rounded-md sm:rounded-lg hover:bg-slate-50 disabled:opacity-50 text-slate-600 transition-colors shadow-sm"><ChevronLeft size={16} className="w-3.5 h-3.5 sm:w-4 sm:h-4"/></button>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 sm:p-2 bg-white border border-slate-200 rounded-md sm:rounded-lg hover:bg-slate-50 disabled:opacity-50 text-slate-600 transition-colors shadow-sm"><ChevronRight size={16} className="w-3.5 h-3.5 sm:w-4 sm:h-4"/></button>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}