"use client";

import { useEffect, useState } from "react";
import { 
  Loader2, TrendingUp, DollarSign, Clock, AlertCircle, PackageCheck, 
  Search, Copy, X, CreditCard, Calendar, CheckCircle, ShieldAlert,
  ChevronLeft, ChevronRight, RefreshCw, TrendingDown, Building, Wallet, Banknote
} from "lucide-react";
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
      } catch (e) { toast.error("Failed to load details"); } 
      finally { setLoading(false); }
    };
    fetchDetails();
  }, [goalId]);

  if (!goalId) return null; 

  if (loading) return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-12 flex justify-center"><Loader2 className="animate-spin text-indigo-600 w-10 h-10" /></div>
    </div>
  );

  if (!goal) return null; 
  const isRefunded = goal.status === 'REFUNDED' || goal.status === 'CANCELLED';
  const netShare = isRefunded ? goal.saved * 0.10 : goal.saved * 0.95;
  const shareLabel = isRefunded ? "*10% Cancellation Share" : "*After 5% Platform Fee";

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">Transaction Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="flex gap-4 items-start p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden shrink-0 border"><img src={goal.product?.images?.[0] || "/placeholder.png"} className="w-full h-full object-cover" /></div>
                <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-900">{goal.product?.name}</h3>
                <div className="flex items-center gap-2 mt-1"><span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">{goal.id}</span></div>
                </div>
                <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${goal.status === 'COMPLETED' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>{goal.status}</span>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-xl bg-white shadow-sm">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Total Goal Amount</p>
                <p className="text-2xl font-mono font-bold text-gray-900">Rs {goal.targetAmount?.toLocaleString()}</p>
                </div>
                <div className="p-4 border rounded-xl bg-green-50 border-green-100 shadow-sm">
                <p className="text-xs text-green-600 uppercase font-bold tracking-wider mb-1">Your Net Revenue</p>
                <p className="text-2xl font-mono font-bold text-green-700">Rs {netShare.toLocaleString()}</p>
                <p className="text-[10px] text-green-600 mt-1">{shareLabel}</p>
                </div>
            </div>
            <div className="p-4 border rounded-xl bg-gray-50/50">
                <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-3"><CreditCard size={16} /> Deposit History</h4>
                <div className="flex justify-between items-center mb-4 px-1"><span className="text-sm text-gray-600 font-medium">Total Deposits Made</span><span className="text-lg font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">{goal.deposits?.length || 0}</span></div>
                <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
                <table className="w-full text-sm text-left"><thead className="bg-gray-100 text-gray-600 font-medium"><tr><th className="p-3">Date</th><th className="p-3">Method</th><th className="p-3 text-right">Amount</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">
                        {goal.deposits?.map(d => (
                            <tr key={d.id}><td className="p-3 text-gray-600 flex items-center gap-2"><Calendar size={12} className="text-gray-400" />{new Date(d.createdAt).toLocaleDateString()}</td><td className="p-3 text-gray-600 text-xs uppercase">{d.paymentMethod}</td><td className="p-3 text-right font-mono font-bold text-gray-900">Rs {d.amount.toLocaleString()}</td></tr>
                        ))}
                        {(!goal.deposits || goal.deposits.length === 0) && <tr><td colSpan="3" className="p-3 text-center text-gray-400 italic">No deposits recorded</td></tr>}
                    </tbody>
                </table>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default function StoreRevenuePage() {
  const [data, setData] = useState(null); 
  const [loading, setLoading] = useState(true); 
  
  const [searchTerm, setSearchTerm] = useState(""); 
  const [selectedGoalId, setSelectedGoalId] = useState(null); 
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [withdrawPage, setWithdrawPage] = useState(1);
  const withdrawItemsPerPage = 5;

  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchRevenue = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/store/revenue");
      if (!res.ok) throw new Error("Failed");
      const jsonData = await res.json();
      setData(jsonData);
    } catch (error) {
      console.error(error);
      toast.error("Could not load revenue data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRevenue(); }, []);
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const copyToClipboard = (e, text) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    toast.success("ID Copied");
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    const amountNum = Number(withdrawAmount);
    if (amountNum > Number(data?.stats?.availableBalance)) return toast.error("Amount exceeds available balance!");
    if (amountNum < 500) return toast.error("Minimum withdrawal is Rs 500");

    setIsProcessing(true);
    const toastId = toast.loading("Processing direct withdrawal...");

    try {
      const res = await fetch("/api/store/revenue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amountNum, accountName, accountNumber })
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error);

      // ✅ Changed messaging to match direct, instant withdrawal
      toast.success("Funds withdrawn successfully!", { id: toastId });
      setIsWithdrawModalOpen(false);
      setWithdrawAmount(""); setAccountName(""); setAccountNumber("");
      fetchRevenue(); 
    } catch (error) {
      toast.error(error.message || "Withdrawal failed", { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredTransactions = data?.transactions?.filter((item) => {
    if (!searchTerm) return true; 
    const term = searchTerm.toLowerCase();
    const dateStr = new Date(item.date).toLocaleDateString().toLowerCase();
    let searchableText = `${item.goalId} ${item.productName} ${item.customerName} ${item.status} ${dateStr} ${item.totalAmount} ${item.netPayout}`.toLowerCase();
    return searchableText.includes(term);
  }) || [];

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const currentItems = filteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const withdrawals = data?.withdrawals || [];
  const totalWithdrawPages = Math.ceil(withdrawals.length / withdrawItemsPerPage);
  const currentWithdrawals = withdrawals.slice((withdrawPage - 1) * withdrawItemsPerPage, withdrawPage * withdrawItemsPerPage);

  if (loading && !data) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600 w-10 h-10" /></div>;

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8">
      {selectedGoalId && <GoalDetailsModal goalId={selectedGoalId} onClose={() => setSelectedGoalId(null)} />}

      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Revenue Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">Track your earnings and payouts for {data?.storeName}.</p>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input type="text" placeholder="Search Ledger..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 pr-4 py-2 border rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-sm" />
            </div>
            <button onClick={fetchRevenue} className="p-2 bg-white border rounded-xl hover:bg-slate-50 shadow-sm transition-colors text-slate-600" title="Refresh Data">
                <RefreshCw size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
          
          {/* ✅ UPDATED TO LIGHT BLUE THEME */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 relative overflow-hidden flex flex-col justify-between group">
            <div className="relative z-10 flex justify-between items-start">
              <div>
                 <p className="text-xs font-bold uppercase tracking-wider text-blue-500">Available Balance</p>
                 <h3 className="text-3xl font-bold text-slate-900 mt-1">Rs {data?.stats?.availableBalance?.toLocaleString()}</h3>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><Wallet size={24} /></div>
            </div>
            <button 
              onClick={() => setIsWithdrawModalOpen(true)}
              disabled={Number(data?.stats?.availableBalance) <= 0}
              className="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 relative z-10"
            >
               Withdraw Funds
            </button>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400 to-indigo-500 opacity-5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500"></div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
            <div className="flex justify-between items-start relative z-10">
              <div><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Withdrawn</p><h3 className="text-3xl font-bold text-slate-900 mt-1">Rs {data?.stats?.totalWithdrawn?.toLocaleString()}</h3></div>
              <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600"><CreditCard size={24} /></div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-400 to-violet-500 opacity-5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500"></div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
            <div className="flex justify-between items-start relative z-10">
              <div><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending (Est.)</p><h3 className="text-3xl font-bold text-slate-900 mt-1">Rs {data?.stats?.pendingPayouts?.toLocaleString()}</h3></div>
              <div className="p-3 bg-orange-50 rounded-xl text-orange-600"><Clock size={24} /></div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-400 to-red-500 opacity-5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500"></div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
            <div className="flex justify-between items-start relative z-10">
              <div><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Dispute Penalties</p><h3 className="text-3xl font-bold text-slate-900 mt-1">Rs {data?.stats?.totalDeductions?.toLocaleString()}</h3></div>
              <div className="p-3 bg-red-50 rounded-xl text-red-600"><TrendingDown size={24} /></div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-400 to-rose-500 opacity-5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500"></div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
            <div className="flex justify-between items-start relative z-10">
              <div><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Lifetime Earnings</p><h3 className="text-3xl font-bold text-slate-900 mt-1">Rs {data?.stats?.totalRevenue?.toLocaleString()}</h3></div>
              <div className="p-3 bg-green-50 rounded-xl text-green-600"><TrendingUp size={24} /></div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400 to-green-500 opacity-5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500"></div>
          </div>

        </div>

        {/* ✅ DEDICATED WITHDRAWAL HISTORY TABLE */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-blue-50/50">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Banknote size={20} className="text-blue-500"/> Withdrawal History</h2>
            <span className="text-xs font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-full">{withdrawals.length} Records</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="px-6 py-4">Ref ID</th>
                  <th className="px-6 py-4">Date Requested</th>
                  <th className="px-6 py-4">Details</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentWithdrawals.length === 0 ? (
                    <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-400">No withdrawals made yet.</td></tr>
                ) : (
                    currentWithdrawals.map((w) => (
                      <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-slate-500">{w.id.slice(-8).toUpperCase()}</td>
                        <td className="px-6 py-4 text-slate-600">
                          {new Date(w.date).toLocaleDateString()} <span className="text-slate-400 ml-1 text-xs">{new Date(w.date).toLocaleTimeString()}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-700 font-medium">{w.description}</td>
                        <td className="px-6 py-4 font-mono font-bold text-base text-blue-600 text-right">Rs {w.amount.toLocaleString()}</td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>

          {withdrawals.length > 0 && (
            <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-white rounded-b-2xl">
               <span className="text-xs font-medium text-slate-500">Page {withdrawPage} of {totalWithdrawPages}</span>
               <div className="flex gap-2">
                  <button onClick={() => setWithdrawPage(p => Math.max(1, p - 1))} disabled={withdrawPage === 1} className="p-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors text-slate-600"><ChevronLeft size={16}/></button>
                  <button onClick={() => setWithdrawPage(p => Math.min(totalWithdrawPages, p + 1))} disabled={withdrawPage === totalWithdrawPages} className="p-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors text-slate-600"><ChevronRight size={16}/></button>
               </div>
            </div>
          )}
        </div>

        {/* LEDGER HISTORY TABLE (Earnings & Penalties) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          
          <div className="p-5 sm:p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">Earnings & Penalties Ledger</h2>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{filteredTransactions.length} Records</span>
          </div>
          
          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="px-6 py-4">Goal ID</th>
                  <th className="px-6 py-4">Date Logged</th>
                  <th className="px-6 py-4">Product / Reason</th>
                  <th className="px-6 py-4">Base Amount</th>
                  <th className="px-6 py-4">Fee / Adjustment</th>
                  <th className="px-6 py-4">Net Impact</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentItems.length === 0 ? (
                    <tr><td colSpan="7" className="px-6 py-16 text-center text-slate-400 flex flex-col items-center gap-3"><AlertCircle size={32} className="text-slate-300" /><span>No records found in ledger.</span></td></tr>
                ) : (
                    currentItems.map((item) => {
                      const isCompensated = item.status === "COMPENSATED";
                      const isPenalty = item.status === "PENALTY"; 
                      const displayNet = isCompensated ? (item.totalAmount * 0.10) : item.netPayout;
                      
                      return (
                        <tr key={item.id} onClick={() => setSelectedGoalId(item.goalId)} className={`cursor-pointer transition-colors group ${isPenalty ? 'bg-red-50/50 hover:bg-red-50' : 'hover:bg-slate-50'}`}>
                          <td className="px-6 py-4 font-mono text-xs text-blue-600 group-hover:underline">
                              <div className="flex items-center gap-1">
                                  {item.goalId.slice(0, 8)}...
                                  <button onClick={(e) => copyToClipboard(e, item.goalId)} className="p-1 hover:bg-blue-100 rounded text-blue-600"><Copy size={12} /></button>
                              </div>
                          </td>
                          <td className="px-6 py-4 text-slate-500">
                              {new Date(item.date).toLocaleDateString()}
                              <p className="text-[10px] text-slate-400 mt-0.5">{new Date(item.date).toLocaleTimeString()}</p>
                          </td>
                          <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded overflow-hidden flex-shrink-0 border ${isPenalty ? 'border-red-300 shadow-sm' : 'border-slate-200'}`}>
                                      <img src={item.productImage} alt="Product" className="w-full h-full object-cover" />
                                  </div>
                                  <div>
                                      <p className="font-bold text-slate-900 line-clamp-1">{item.productName}</p>
                                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{isPenalty ? item.reason : `Customer: ${item.customerName}`}</p>
                                  </div>
                              </div>
                          </td>
                          <td className="px-6 py-4 font-mono text-slate-600">Rs {Math.abs(item.totalAmount).toLocaleString()}</td>
                          <td className={`px-6 py-4 font-mono ${isPenalty ? 'text-slate-400 italic text-xs' : 'text-red-500'}`}>
                              {isPenalty ? "N/A" : isCompensated ? "Refund Split" : `- Rs ${item.platformFee.toLocaleString()}`}
                          </td>
                          <td className={`px-6 py-4 font-mono font-bold text-base ${displayNet < 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {displayNet < 0 ? '-' : ''}Rs {Math.abs(displayNet).toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                              {isPenalty ? (
                                  <span className="px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold bg-red-100 text-red-700 border border-red-200 inline-flex items-center gap-1"><ShieldAlert size={12} /> Penalty</span>
                              ) : isCompensated ? (
                                  <span className="px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold bg-orange-100 text-orange-700 border border-orange-200 inline-flex items-center gap-1"><AlertCircle size={12} /> Compensated</span>
                              ) : (
                                  <span className="px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold bg-green-100 text-green-700 border border-green-200 inline-flex items-center gap-1"><CheckCircle size={12} /> Paid</span>
                              )}
                          </td>
                        </tr>
                      )
                    })
                )}
              </tbody>
            </table>
          </div>

          {filteredTransactions.length > 0 && (
            <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-white rounded-b-2xl">
               <span className="text-xs font-medium text-slate-500">Page {currentPage} of {totalPages}</span>
               <div className="flex gap-2">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors text-slate-600"><ChevronLeft size={16}/></button>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors text-slate-600"><ChevronRight size={16}/></button>
               </div>
            </div>
          )}
        </div>

      </div>

      {/* ✅ WITHDRAWAL MODAL */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden max-h-[95vh] flex flex-col border border-white/20">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 shrink-0 bg-blue-50/50">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2"><Building className="text-blue-600 w-5 h-5" /> Store Withdrawal</h3>
              <button onClick={() => setIsWithdrawModalOpen(false)} className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-full transition"><X size={18} /></button>
            </div>
            
            <div className="overflow-y-auto p-5 shrink">
              <form onSubmit={handleWithdraw} className="space-y-5">
                <div className="bg-blue-50 text-blue-900 p-4 rounded-xl text-sm border border-blue-200 flex items-center justify-between shadow-inner">
                  <span className="font-bold">Available Balance:</span>
                  <span className="font-mono font-black text-lg">Rs {Number(data?.stats?.availableBalance).toLocaleString()}</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Amount to Withdraw (Rs)</label>
                  <input type="number" required min="500" max={Number(data?.stats?.availableBalance)} value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="e.g. 1500" className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm shadow-sm" />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Transfer Method</label>
                  <div className="w-full border border-slate-200 bg-slate-50 text-slate-500 p-3 rounded-xl text-sm font-bold cursor-not-allowed">Bank Transfer</div>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Account Title / Name</label>
                  <input type="text" required value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="e.g. John Doe" className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm shadow-sm" />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Account Number / IBAN</label>
                  <input type="text" required value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="e.g. PK32 HABB 0000 1234 5678 90" className="w-full border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm shadow-sm" />
                </div>
                
                <div className="pt-2 flex gap-3">
                  <button type="button" onClick={() => setIsWithdrawModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-200 transition shadow-sm">Cancel</button>
                  <button type="submit" disabled={isProcessing} className="flex-1 py-3 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition flex justify-center items-center gap-2 disabled:opacity-50 shadow-md shadow-blue-500/20">
                    {isProcessing ? <Loader2 size={16} className="animate-spin" /> : "Withdraw Funds"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}