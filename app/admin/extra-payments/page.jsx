"use client";

import { useEffect, useState } from "react";
import { Loader2, Gift, Send, Search, ChevronLeft, ChevronRight, Store, Truck, History, CircleDollarSign } from "lucide-react";
import toast from "react-hot-toast";

export default function ExtraPaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [stores, setStores] = useState([]);
  const [riders, setRiders] = useState([]);
  const [history, setHistory] = useState([]);
  const [netRevenue, setNetRevenue] = useState(0); 
  
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  const [formData, setFormData] = useState({ 
    recipientType: "STORE", 
    recipientId: "", 
    amount: "", 
    reason: "" 
  });

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/manual-payouts");
      const data = await res.json();
      
      setStores(data.stores || []);
      setRiders(data.riders || []);
      setHistory(data.history || []);
      setNetRevenue(data.netRevenue || 0); 
    } catch (e) { 
      toast.error("Failed to load data"); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, []);
  
  useEffect(() => { 
    setCurrentPage(1); 
  }, [searchTerm]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.recipientId) {
      return toast.error("Please select a recipient.");
    }

    const payAmount = Number(formData.amount);

    // SAFETY CHECK: Prevent Admin from over-spending Platform Funds
    if (payAmount > netRevenue) {
        return toast.error("Insufficient Platform Revenue! You cannot issue a bonus larger than the Net Revenue.");
    }

    const isStore = formData.recipientType === "STORE";
    const recipientObj = isStore 
      ? stores.find(s => s.id === formData.recipientId) 
      : riders.find(r => r.id === formData.recipientId);

    if (!confirm(`Confirm payment of Rs ${payAmount.toLocaleString()} to ${recipientObj.name}?`)) {
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading("Processing payment and notifying recipient...");

    try {
      const res = await fetch("/api/admin/manual-payouts", {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData, 
          amount: payAmount, 
          recipientName: recipientObj.name, 
          recipientUserId: recipientObj.userId, 
          recipientEmail: recipientObj.email
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to process");
      }
      
      toast.success("Payment sent successfully!", { id: toastId });
      setFormData({ recipientType: "STORE", recipientId: "", amount: "", reason: "" });
      fetchData(); 

    } catch (error) {
      toast.error(error.message, { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredHistory = history.filter(h => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return h.recipientName.toLowerCase().includes(term) || 
           h.reason.toLowerCase().includes(term) || 
           h.recipientType.toLowerCase().includes(term) ||
           h.id.toLowerCase().includes(term); // ✅ Added ID to search capabilities
  });

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / ITEMS_PER_PAGE));
  const currentHistory = filteredHistory.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  if (loading) {
    return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600 w-10 h-10" /></div>;
  }

  return (
    <div className="p-4 sm:p-8 bg-slate-50 min-h-screen relative">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER & REVENUE CARD */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Extra Payments & Bonuses</h1>
            <p className="text-slate-500 mt-1">Issue manual compensations, bonuses, or adjustments to Stores and Riders.</p>
          </div>

          <div className="bg-white border border-indigo-100 p-4 rounded-2xl flex items-center gap-4 shadow-sm w-full md:w-auto">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <CircleDollarSign size={28}/>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Platform Net Revenue</p>
              <p className="text-2xl font-black text-slate-900">Rs {netRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* PAYMENT FORM */}
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Gift className="text-indigo-500"/> Issue Payment
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Recipient Type</label>
                <div className="flex bg-slate-100 p-1.5 rounded-xl">
                  <button 
                    type="button" 
                    onClick={() => setFormData({...formData, recipientType: 'STORE', recipientId: ''})} 
                    className={`flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${formData.recipientType === 'STORE' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <Store size={16}/> Store
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setFormData({...formData, recipientType: 'RIDER', recipientId: ''})} 
                    className={`flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${formData.recipientType === 'RIDER' ? 'bg-white shadow-sm text-green-600' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <Truck size={16}/> Rider
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Select {formData.recipientType === 'STORE' ? 'Store' : 'Rider'}</label>
                <select required value={formData.recipientId} onChange={(e) => setFormData({...formData, recipientId: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 bg-slate-50">
                  <option value="" disabled>-- Choose Recipient --</option>
                  {formData.recipientType === 'STORE' 
                    ? stores.map(s => <option key={s.id} value={s.id}>{s.name} ({s.email})</option>) 
                    : riders.map(r => <option key={r.id} value={r.id}>{r.name} ({r.email})</option>)
                  }
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Amount (PKR)</label>
                <input 
                  type="number" required min="1" max={netRevenue} 
                  value={formData.amount} 
                  onChange={(e) => setFormData({...formData, amount: e.target.value})} 
                  placeholder={`Max: ${netRevenue}`} 
                  className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl text-sm font-mono font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800" 
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Reason / Description</label>
                <textarea 
                  required rows="2" 
                  value={formData.reason} 
                  onChange={(e) => setFormData({...formData, reason: e.target.value})} 
                  placeholder="e.g. Compensation for damaged order #1234" 
                  className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-slate-700" 
                />
              </div>

              <button 
                type="submit" disabled={submitting || Number(formData.amount) > netRevenue} 
                className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-indigo-500/20"
              >
                {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />} Issue Funds
              </button>
            </form>
          </div>

          {/* HISTORY TABLE */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <History className="text-indigo-500"/> Payout History
              </h2>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="text" placeholder="Search ID or Recipient..." 
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none bg-white" 
                />
              </div>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Ref ID</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Recipient</th>
                    <th className="px-6 py-4">Reason</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentHistory.length === 0 ? (
                    <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-400">No payout records found.</td></tr>
                  ) : currentHistory.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">
                        {h.id.slice(-8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(h.createdAt).toLocaleDateString('en-GB')}<br/>
                        <span className="text-[10px]">{new Date(h.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-2">
                        {h.recipientType === 'STORE' ? <Store size={16} className="text-blue-500"/> : <Truck size={16} className="text-green-500"/>}
                        {h.recipientName}
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium max-w-[180px] truncate" title={h.reason}>
                        {h.reason}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-indigo-600 text-right">
                        Rs {h.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredHistory.length > 0 && (
              <div className="p-4 border-t border-slate-100 bg-white flex justify-between items-center shrink-0">
                 <span className="text-xs font-medium text-slate-500">Page {currentPage} of {totalPages}</span>
                 <div className="flex gap-2">
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} 
                      className="p-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-600 transition-colors"
                    >
                      <ChevronLeft size={16}/>
                    </button>
                    <button 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} 
                      className="p-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-600 transition-colors"
                    >
                      <ChevronRight size={16}/>
                    </button>
                 </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}