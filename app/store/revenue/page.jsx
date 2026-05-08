"use client";

import { useEffect, useState } from "react";
import { 
  Loader2, TrendingUp, Clock, AlertCircle, Search, Copy, X, CreditCard, 
  Calendar, CheckCircle, ShieldAlert, ChevronLeft, ChevronRight, RefreshCw, 
  TrendingDown, Wallet, Banknote, Gift, Building 
} from "lucide-react";
import toast from "react-hot-toast";

// ==========================================
// 1. BONUS DETAILS MODAL
// ==========================================
const BonusDetailsModal = ({ bonus, onClose }) => {
  if (!bonus) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20">
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-indigo-100 bg-indigo-50/50">
          <h2 className="text-lg sm:text-xl font-bold text-indigo-900 flex items-center gap-2">
            <Gift className="text-indigo-600" size={20} /> Payment Details
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-indigo-200 text-indigo-500 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Reference ID</span>
            <span className="text-xs sm:text-sm font-mono font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded shadow-sm border border-slate-200">
              {bonus.id.slice(-8).toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Date Issued</span>
            <span className="text-xs sm:text-sm font-bold text-slate-800">
              {new Date(bonus.date || bonus.createdAt).toLocaleString('en-GB')}
            </span>
          </div>
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Recipient</span>
            <span className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-2">
              {bonus.storeName || bonus.recipientName || "Store"} 
              <span className="text-[9px] sm:text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">STORE</span>
            </span>
          </div>
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Total Amount</span>
            <span className="text-xs sm:text-sm font-mono font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded border border-green-200 shadow-sm">
              Rs {bonus.amount?.toLocaleString() || bonus.netPayout?.toLocaleString()}
            </span>
          </div>
          <div className="pt-2">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Description / Reason</span>
            <p className="text-xs sm:text-sm text-slate-700 bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200 leading-relaxed font-medium shadow-inner break-words">
              {bonus.reason || bonus.productName || bonus.description || "Administrative Bonus / Adjustment"}
            </p>
          </div>
        </div>
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100">
           <button onClick={onClose} className="w-full py-3 bg-slate-900 text-white text-sm sm:text-base font-bold rounded-xl hover:bg-black transition-colors shadow-md shadow-slate-900/20">Close Receipt</button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. GOAL DETAILS MODAL
// ==========================================
const GoalDetailsModal = ({ goalId, onClose }) => {
  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!goalId || goalId === "BONUS-PAYMENT") return;
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

  if (!goalId || goalId === "BONUS-PAYMENT") return null; 
  if (loading) return <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"><Loader2 className="animate-spin text-blue-600 w-10 h-10" /></div>;
  if (!goal) return null; 

  const isRefunded = goal.status === 'REFUNDED' || goal.status === 'CANCELLED';
  const netShare = isRefunded ? goal.saved * 0.10 : goal.saved * 0.95;
  const shareLabel = isRefunded ? "*10% Cancellation Share" : "*After 5% Platform Fee";

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-slate-100 bg-slate-50 shrink-0">
          <h2 className="text-lg sm:text-xl font-bold text-slate-800">Transaction Details</h2>
          <button onClick={onClose} className="p-1.5 sm:p-2 hover:bg-slate-200 text-slate-400 rounded-full transition-colors"><X size={20} /></button>
        </div>
        
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-200 rounded-xl overflow-hidden shrink-0 border"><img src={goal.product?.images?.[0] || "/placeholder.png"} className="w-full h-full object-cover" /></div>
                <div className="flex-1 min-w-0 w-full sm:w-auto">
                  <h3 className="font-bold text-sm sm:text-lg text-slate-900 truncate">{goal.product?.name}</h3>
                  <div className="flex items-center gap-2 mt-1"><span className="text-[10px] sm:text-xs bg-white text-slate-600 px-2 py-0.5 rounded font-mono shadow-sm">{goal.id}</span></div>
                </div>
                <div className="w-full sm:w-auto text-left sm:text-right shrink-0 mt-2 sm:mt-0">
                  <span className={`px-2 sm:px-3 py-1 rounded-full text-[9px] sm:text-[10px] uppercase tracking-wider font-bold border ${goal.status === 'COMPLETED' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>{goal.status}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="p-4 sm:p-5 border border-slate-100 rounded-2xl bg-white shadow-sm flex flex-col justify-center">
                  <p className="text-[10px] sm:text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Total Goal Amount</p>
                  <p className="text-xl sm:text-2xl font-mono font-bold text-slate-900 break-words">Rs {goal.targetAmount?.toLocaleString()}</p>
                </div>
                <div className="p-4 sm:p-5 border rounded-2xl bg-green-50 border-green-100 shadow-sm flex flex-col justify-center">
                  <p className="text-[10px] sm:text-xs text-green-600 uppercase font-bold tracking-wider mb-1">Your Net Revenue</p>
                  <p className="text-xl sm:text-2xl font-mono font-bold text-green-700 break-words">Rs {netShare.toLocaleString()}</p>
                  <p className="text-[9px] sm:text-[10px] text-green-600 mt-1">{shareLabel}</p>
                </div>
            </div>

            <div className="p-3 sm:p-5 border border-slate-100 rounded-2xl bg-slate-50/50">
                <h4 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2 mb-3 sm:mb-4"><CreditCard size={16} /> Deposit History</h4>
                <div className="flex justify-between items-center mb-3 sm:mb-4 px-1"><span className="text-xs sm:text-sm text-slate-600 font-medium">Total Deposits Made</span><span className="text-xs sm:text-sm font-bold text-blue-600 bg-blue-100 px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg">{goal.deposits?.length || 0}</span></div>
                
                <div className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-sm overflow-x-auto custom-scrollbar">
                  <table className="w-full text-xs sm:text-sm text-left min-w-[300px]">
                    <thead className="bg-slate-50 text-slate-500 font-medium text-[10px] sm:text-xs uppercase tracking-wider">
                      <tr><th className="p-2 sm:p-3 whitespace-nowrap">Date</th><th className="p-2 sm:p-3 whitespace-nowrap">Method</th><th className="p-2 sm:p-3 text-right whitespace-nowrap">Amount</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {goal.deposits?.map(d => (
                            <tr key={d.id} className="hover:bg-slate-50">
                                <td className="p-2 sm:p-3 text-slate-600 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap"><Calendar size={12} className="text-slate-400 shrink-0" />{new Date(d.createdAt).toLocaleDateString()}</td>
                                <td className="p-2 sm:p-3 text-slate-600 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">{d.paymentMethod}</td>
                                <td className="p-2 sm:p-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">Rs {d.amount.toLocaleString()}</td>
                            </tr>
                        ))}
                        {(!goal.deposits || goal.deposits.length === 0) && <tr><td colSpan="3" className="p-4 sm:p-6 text-center text-slate-400 italic text-xs">No deposits recorded</td></tr>}
                    </tbody>
                  </table>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. MAIN DASHBOARD COMPONENT
// ==========================================
export default function StoreRevenuePage() {
  const [data, setData] = useState(null); 
  const [loading, setLoading] = useState(true); 
  const [searchTerm, setSearchTerm] = useState(""); 
  
  const [selectedGoalId, setSelectedGoalId] = useState(null); 
  const [selectedBonus, setSelectedBonus] = useState(null); 

  const [ledgerPage, setLedgerPage] = useState(1);
  const [withdrawPage, setWithdrawPage] = useState(1);
  const [bonusPage, setBonusPage] = useState(1);
  
  const itemsPerPage = 8;
  const smallItemsPerPage = 5;

  const [ledgerFilter, setLedgerFilter] = useState("ALL");
  const [withdrawFilter, setWithdrawFilter] = useState("ALL");
  const [bonusFilter, setBonusFilter] = useState("ALL");

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
    } catch (error) { toast.error("Could not load revenue data"); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRevenue(); }, []);
  useEffect(() => { setLedgerPage(1); setWithdrawPage(1); setBonusPage(1); }, [searchTerm]);

  const copyToClipboard = (e, text) => {
    e.stopPropagation(); navigator.clipboard.writeText(text); toast.success("ID Copied");
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
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amountNum, accountName, accountNumber })
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error);

      toast.success("Funds withdrawn successfully!", { id: toastId });
      setIsWithdrawModalOpen(false); setWithdrawAmount(""); setAccountName(""); setAccountNumber("");
      fetchRevenue(); 
    } catch (error) { toast.error(error.message || "Withdrawal failed", { id: toastId }); } 
    finally { setIsProcessing(false); }
  };

  const isWithinDays = (dateString, days) => {
      if (!dateString) return false;
      const diffTime = Math.abs(new Date() - new Date(dateString));
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) <= days;
  };

  const rawLedger = data?.transactions?.filter(t => t.goalId !== "BONUS-PAYMENT") || [];
  const filteredLedger = rawLedger.filter((item) => {
    if (ledgerFilter !== "ALL" && item.status !== ledgerFilter) return false;
    if (searchTerm) { 
      const term = searchTerm.toLowerCase();
      const searchStr = `${item.goalId} ${item.productName} ${item.customerName} ${item.status} ${item.totalAmount}`.toLowerCase();
      if (!searchStr.includes(term)) return false;
    }
    return true;
  });
  const ledgerPagesTotal = Math.max(1, Math.ceil(filteredLedger.length / itemsPerPage));
  const currentLedger = filteredLedger.slice((ledgerPage - 1) * itemsPerPage, ledgerPage * itemsPerPage);

  const rawBonuses = data?.transactions?.filter(t => t.goalId === "BONUS-PAYMENT") || [];
  const filteredBonuses = rawBonuses.filter((item) => {
    if (bonusFilter === "LAST_7" && !isWithinDays(item.date, 7)) return false;
    if (bonusFilter === "LAST_30" && !isWithinDays(item.date, 30)) return false;
    if (searchTerm) { 
        const term = searchTerm.toLowerCase();
        const searchStr = `${item.id} ${item.reason} ${item.netPayout}`.toLowerCase();
        if (!searchStr.includes(term)) return false;
    }
    return true;
  });
  const bonusPagesTotal = Math.max(1, Math.ceil(filteredBonuses.length / smallItemsPerPage));
  const currentBonuses = filteredBonuses.slice((bonusPage - 1) * smallItemsPerPage, bonusPage * smallItemsPerPage);

  const rawWithdrawals = data?.withdrawals || [];
  const filteredWithdrawals = rawWithdrawals.filter((item) => {
    if (withdrawFilter === "LAST_7" && !isWithinDays(item.date, 7)) return false;
    if (withdrawFilter === "LAST_30" && !isWithinDays(item.date, 30)) return false;
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const searchStr = `${item.id} ${item.description} ${item.amount}`.toLowerCase();
        if (!searchStr.includes(term)) return false;
    }
    return true;
  });
  const withdrawPagesTotal = Math.max(1, Math.ceil(filteredWithdrawals.length / smallItemsPerPage));
  const currentWithdrawals = filteredWithdrawals.slice((withdrawPage - 1) * smallItemsPerPage, withdrawPage * smallItemsPerPage);

  if (loading && !data) {
    return <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600 w-10 h-10" /></div>;
  }

  return (
    <div className="min-h-[100dvh] bg-slate-50/50 p-3 sm:p-6 lg:p-8 overflow-x-hidden">
      
      {/* MODALS */}
      {selectedGoalId && selectedGoalId !== "BONUS-PAYMENT" && <GoalDetailsModal goalId={selectedGoalId} onClose={() => setSelectedGoalId(null)} />}
      <BonusDetailsModal bonus={selectedBonus} onClose={() => setSelectedBonus(null)} />

      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 w-full">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Revenue Dashboard</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Track your earnings and payouts for {data?.storeName}.</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
            <div className="relative flex-1 md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input type="text" placeholder="Search across all records..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 pr-4 py-2 sm:py-2.5 border border-slate-200 rounded-lg sm:rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-sm" />
            </div>
            <button onClick={fetchRevenue} className="p-2 sm:p-2.5 bg-white border border-slate-200 rounded-lg sm:rounded-xl hover:bg-slate-50 shadow-sm transition-colors text-slate-600 shrink-0"><RefreshCw size={20} className={loading ? "animate-spin w-4 h-4 sm:w-5 sm:h-5" : "w-4 h-4 sm:w-5 sm:h-5"} /></button>
          </div>
        </div>

        {/* TOP STATS CARDS */}
        {/* ✅ REMOVED break-words/truncate AND ADDED whitespace-nowrap with responsive text sizing to guarantee full single line amounts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 w-full">
           
           <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm border border-blue-100 relative overflow-hidden flex flex-col justify-between group h-full">
            <div className="relative z-10 flex justify-between items-start gap-2">
              <div className="flex-1">
                 <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-blue-500 mb-1">Available Balance</p>
                 <h3 className="text-lg xl:text-xl 2xl:text-2xl font-black text-slate-900 tracking-tighter whitespace-nowrap">
                   Rs {data?.stats?.availableBalance?.toLocaleString() || 0}
                 </h3>
              </div>
              <div className="p-2 sm:p-2.5 bg-blue-50 rounded-xl sm:rounded-2xl text-blue-600 shrink-0">
                <Wallet size={18} className="sm:w-[22px] sm:h-[22px]" />
              </div>
            </div>
            <button onClick={() => setIsWithdrawModalOpen(true)} disabled={Number(data?.stats?.availableBalance) <= 0} className="mt-4 sm:mt-5 w-full py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl transition-all shadow-md relative z-10">Withdraw Funds</button>
            <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-blue-400 to-indigo-500 opacity-5 rounded-bl-full -mr-6 -mt-6 sm:-mr-8 sm:-mt-8 transition-transform group-hover:scale-110 duration-500"></div>
          </div>

          {[
            { title: "Total Withdrawn", value: data?.stats?.totalWithdrawn, icon: CreditCard, colorClass: "text-indigo-600", bgClass: "bg-indigo-50" },
            { title: "Pending (Est.)", value: data?.stats?.pendingPayouts, icon: Clock, colorClass: "text-orange-600", bgClass: "bg-orange-50" },
            { title: "Dispute Penalties", value: data?.stats?.totalDeductions, icon: TrendingDown, colorClass: "text-red-600", bgClass: "bg-red-50" },
            { title: "Lifetime Earnings", value: data?.stats?.totalRevenue, icon: TrendingUp, colorClass: "text-green-600", bgClass: "bg-green-50" }
          ].map((stat, idx) => (
             <div key={idx} className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group h-full flex flex-col justify-center">
               <div className="flex justify-between items-start relative z-10 gap-2">
                 <div className="flex-1">
                   <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">{stat.title}</p>
                   <h3 className="text-lg xl:text-xl 2xl:text-2xl font-black text-slate-900 tracking-tighter whitespace-nowrap">
                     Rs {stat.value?.toLocaleString() || 0}
                   </h3>
                 </div>
                 <div className={`p-2 sm:p-2.5 rounded-xl sm:rounded-2xl shrink-0 ${stat.bgClass} ${stat.colorClass}`}>
                   <stat.icon size={18} className="sm:w-[22px] sm:h-[22px]" />
                 </div>
               </div>
             </div>
          ))}

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 w-full">
            
            {/* WITHDRAWALS TABLE */}
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full w-full">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-blue-50/30 shrink-0">
                <div className="flex items-center gap-2 sm:gap-3">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-1.5 sm:gap-2">
                    <Banknote size={18} className="text-blue-500 sm:w-5 sm:h-5"/> Withdrawals
                  </h2>
                </div>
                <select value={withdrawFilter} onChange={(e) => { setWithdrawFilter(e.target.value); setWithdrawPage(1); }} className="w-full sm:w-auto text-[10px] sm:text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-md sm:rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 outline-none cursor-pointer appearance-none text-center">
                  <option value="ALL">All Time</option><option value="LAST_7">Last 7 Days</option><option value="LAST_30">Last 30 Days</option>
                </select>
              </div>

              <div className="overflow-x-auto flex-1 custom-scrollbar">
                <table className="w-full text-sm text-left min-w-[350px]">
                  <thead className="bg-slate-50 text-slate-400 uppercase font-bold text-[9px] sm:text-[10px] tracking-wider">
                    <tr><th className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">Ref ID / Date</th><th className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">Details</th><th className="px-4 sm:px-6 py-3 sm:py-4 text-right whitespace-nowrap">Amount</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentWithdrawals.length === 0 ? (
                      <tr><td colSpan="3" className="px-4 sm:px-6 py-10 sm:py-12"><div className="flex flex-col items-center justify-center gap-2 text-slate-400"><AlertCircle size={24} className="text-slate-300 sm:w-7 sm:h-7" /><span className="text-xs sm:text-sm">No withdrawal records found.</span></div></td></tr>
                    ) : (
                      currentWithdrawals.map((w) => (
                        <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap"><p className="font-mono text-[10px] sm:text-xs text-slate-500">{w.id.slice(-8).toUpperCase()}</p><p className="text-[9px] sm:text-xs text-slate-400 mt-0.5">{new Date(w.date).toLocaleDateString('en-GB')}</p></td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 text-slate-700 font-medium text-[10px] sm:text-xs max-w-[120px] sm:max-w-[150px] truncate" title={w.description}>{w.description}</td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 font-mono font-bold text-sm sm:text-base text-blue-600 text-right whitespace-nowrap">Rs {w.amount.toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {filteredWithdrawals.length > 0 && (
                <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
                   <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Page {withdrawPage} of {withdrawPagesTotal}</span>
                   <div className="flex gap-1.5 sm:gap-2">
                     <button onClick={() => setWithdrawPage(p => Math.max(1, p - 1))} disabled={withdrawPage === 1} className="p-1 sm:p-1.5 border border-slate-200 rounded-md sm:rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50"><ChevronLeft size={16} className="w-3.5 h-3.5 sm:w-4 sm:h-4"/></button>
                     <button onClick={() => setWithdrawPage(p => Math.min(withdrawPagesTotal, p + 1))} disabled={withdrawPage === withdrawPagesTotal} className="p-1 sm:p-1.5 border border-slate-200 rounded-md sm:rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50"><ChevronRight size={16} className="w-3.5 h-3.5 sm:w-4 sm:h-4"/></button>
                   </div>
                </div>
              )}
            </div>

            {/* EXTRA PAYMENTS (BONUSES) TABLE */}
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full w-full">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-indigo-50/30 shrink-0">
                <div className="flex items-center gap-2 sm:gap-3">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-1.5 sm:gap-2">
                    <Gift size={18} className="text-indigo-500 sm:w-5 sm:h-5"/> Extra Payments
                  </h2>
                </div>
                <select value={bonusFilter} onChange={(e) => { setBonusFilter(e.target.value); setBonusPage(1); }} className="w-full sm:w-auto text-[10px] sm:text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-md sm:rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 outline-none cursor-pointer appearance-none text-center">
                  <option value="ALL">All Time</option><option value="LAST_7">Last 7 Days</option><option value="LAST_30">Last 30 Days</option>
                </select>
              </div>

              <div className="overflow-x-auto flex-1 custom-scrollbar">
                <table className="w-full text-sm text-left min-w-[350px]">
                  <thead className="bg-slate-50 text-slate-400 uppercase font-bold text-[9px] sm:text-[10px] tracking-wider">
                    <tr><th className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">Ref ID / Date</th><th className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">Reason</th><th className="px-4 sm:px-6 py-3 sm:py-4 text-right whitespace-nowrap">Amount</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentBonuses.length === 0 ? (
                      <tr><td colSpan="3" className="px-4 sm:px-6 py-10 sm:py-12"><div className="flex flex-col items-center justify-center gap-2 text-slate-400"><AlertCircle size={24} className="text-slate-300 sm:w-7 sm:h-7" /><span className="text-xs sm:text-sm">No extra payments received.</span></div></td></tr>
                    ) : (
                      currentBonuses.map((b) => (
                        <tr key={b.id} onClick={() => setSelectedBonus(b)} className="hover:bg-indigo-50/50 transition-colors cursor-pointer group">
                          <td className="px-4 sm:px-6 py-3 sm:py-4 group-hover:text-indigo-600 whitespace-nowrap"><p className="font-mono text-[10px] sm:text-xs text-slate-500 group-hover:underline">{b.id.slice(-8).toUpperCase()}</p><p className="text-[9px] sm:text-xs text-slate-400 mt-0.5">{new Date(b.date).toLocaleDateString('en-GB')}</p></td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 text-slate-700 font-medium text-[10px] sm:text-xs max-w-[120px] sm:max-w-[150px] truncate" title={b.reason}>{b.reason}</td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 font-mono font-bold text-sm sm:text-base text-indigo-600 text-right whitespace-nowrap">+ Rs {b.netPayout.toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {filteredBonuses.length > 0 && (
                <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
                   <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Page {bonusPage} of {bonusPagesTotal}</span>
                   <div className="flex gap-1.5 sm:gap-2">
                     <button onClick={() => setBonusPage(p => Math.max(1, p - 1))} disabled={bonusPage === 1} className="p-1 sm:p-1.5 border border-slate-200 rounded-md sm:rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50"><ChevronLeft size={16} className="w-3.5 h-3.5 sm:w-4 sm:h-4"/></button>
                     <button onClick={() => setBonusPage(p => Math.min(bonusPagesTotal, p + 1))} disabled={bonusPage === bonusPagesTotal} className="p-1 sm:p-1.5 border border-slate-200 rounded-md sm:rounded-lg bg-white hover:bg-slate-50 disabled:opacity-50"><ChevronRight size={16} className="w-3.5 h-3.5 sm:w-4 sm:h-4"/></button>
                   </div>
                </div>
              )}
            </div>
        </div>

        {/* LEDGER HISTORY TABLE */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 overflow-hidden w-full">
          
          <div className="p-4 sm:p-5 lg:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/30">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Earnings & Penalties Ledger</h2>
            <select value={ledgerFilter} onChange={(e) => { setLedgerFilter(e.target.value); setLedgerPage(1); }} className="w-full sm:w-auto text-[10px] sm:text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg px-2 sm:px-3 py-2 outline-none cursor-pointer appearance-none text-center">
               <option value="ALL">All Statuses</option><option value="PAID">Paid Orders</option><option value="COMPENSATED">Compensated</option><option value="PENALTY">Penalties</option>
            </select>
          </div>

          <div className="overflow-x-auto min-h-[250px] sm:min-h-[300px] custom-scrollbar">
            <table className="w-full text-sm text-left min-w-[700px]">
              <thead className="bg-slate-50 text-slate-400 uppercase font-bold text-[9px] sm:text-[10px] tracking-wider border-b border-slate-100">
                <tr><th className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">Goal ID</th><th className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">Date Logged</th><th className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">Product / Details</th><th className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">Base Amount</th><th className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">Adjustment</th><th className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">Net Impact</th><th className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentLedger.length === 0 ? (
                    <tr><td colSpan="7" className="px-4 sm:px-6 py-12 sm:py-16"><div className="flex flex-col items-center justify-center gap-2 sm:gap-3 text-slate-400 text-center"><AlertCircle size={28} className="text-slate-300 sm:w-8 sm:h-8" /><span className="text-xs sm:text-sm">No records match your filter.</span></div></td></tr>
                ) : (
                    currentLedger.map((item) => {
                      const isCompensated = item.status === "COMPENSATED";
                      const isPenalty = item.status === "PENALTY"; 
                      const displayNet = isCompensated ? (item.totalAmount * 0.10) : item.netPayout;

                      return (
                        <tr key={item.id} onClick={() => setSelectedGoalId(item.goalId)} className={`cursor-pointer transition-colors group ${isPenalty ? 'bg-red-50/50 hover:bg-red-50' : 'hover:bg-slate-50'}`}>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 font-mono text-[10px] sm:text-xs text-blue-600 group-hover:underline whitespace-nowrap"><div className="flex items-center gap-1">{item.goalId.slice(0, 8)}...<button onClick={(e) => copyToClipboard(e, item.goalId)} className="p-1 hover:bg-blue-100 rounded text-blue-600"><Copy size={12} className="sm:w-3.5 sm:h-3.5"/></button></div></td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 text-slate-500 text-[10px] sm:text-xs whitespace-nowrap">{new Date(item.date).toLocaleDateString('en-GB')}<p className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5">{new Date(item.date).toLocaleTimeString()}</p></td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap"><div className="flex items-center gap-2 sm:gap-3"><div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl overflow-hidden shrink-0 border ${isPenalty ? 'border-red-300 shadow-sm' : 'border-slate-200'}`}><img src={item.productImage} alt="Product" className="w-full h-full object-cover" /></div><div className="min-w-0 max-w-[150px] sm:max-w-[200px]"><p className="font-bold text-[10px] sm:text-xs text-slate-900 truncate">{item.productName}</p><p className="text-[9px] sm:text-xs text-slate-500 truncate mt-0.5">{isPenalty ? item.reason : `Customer: ${item.customerName}`}</p></div></div></td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 font-mono text-slate-600 text-[10px] sm:text-xs whitespace-nowrap">Rs {Math.abs(item.totalAmount).toLocaleString()}</td>
                          <td className={`px-4 sm:px-6 py-3 sm:py-4 font-mono whitespace-nowrap ${isPenalty ? 'text-slate-400 italic text-[9px] sm:text-[10px]' : 'text-red-500 text-[10px] sm:text-xs'}`}>{isPenalty ? "N/A" : isCompensated ? "Refund Split" : `- Rs ${item.platformFee.toLocaleString()}`}</td>
                          <td className={`px-4 sm:px-6 py-3 sm:py-4 font-mono font-bold text-xs sm:text-sm whitespace-nowrap ${displayNet < 0 ? 'text-red-600' : 'text-green-600'}`}>{displayNet < 0 ? '-' : ''}Rs {Math.abs(displayNet).toLocaleString()}</td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                              {isPenalty ? <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] uppercase tracking-wider font-bold bg-red-100 text-red-700 border border-red-200 inline-flex items-center gap-1 shadow-sm"><ShieldAlert size={10} className="sm:w-3 sm:h-3" /> Penalty</span>
                              : isCompensated ? <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] uppercase tracking-wider font-bold bg-orange-100 text-orange-700 border border-orange-200 inline-flex items-center gap-1 shadow-sm"><AlertCircle size={10} className="sm:w-3 sm:h-3" /> Compensated</span>
                              : <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] uppercase tracking-wider font-bold bg-green-100 text-green-700 border border-green-200 inline-flex items-center gap-1 shadow-sm"><CheckCircle size={10} className="sm:w-3 sm:h-3" /> Paid</span>}
                          </td>
                        </tr>
                      )
                    })
                )}
              </tbody>
            </table>
          </div>

          {filteredLedger.length > 0 && (
            <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center rounded-b-2xl sm:rounded-b-3xl shrink-0">
               <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Page {ledgerPage} of {ledgerPagesTotal}</span>
               <div className="flex gap-1.5 sm:gap-2">
                 <button onClick={() => setLedgerPage(p => Math.max(1, p - 1))} disabled={ledgerPage === 1} className="p-1.5 sm:p-2 border border-slate-200 rounded-lg sm:rounded-xl bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors text-slate-600 shadow-sm"><ChevronLeft size={16} className="sm:w-[18px] sm:h-[18px]"/></button>
                 <button onClick={() => setLedgerPage(p => Math.min(ledgerPagesTotal, p + 1))} disabled={ledgerPage === ledgerPagesTotal} className="p-1.5 sm:p-2 border border-slate-200 rounded-lg sm:rounded-xl bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors text-slate-600 shadow-sm"><ChevronRight size={16} className="sm:w-[18px] sm:h-[18px]"/></button>
               </div>
            </div>
          )}
        </div>

      </div>

      {/* ==========================================
          WITHDRAWAL MODAL
      ========================================== */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-md shadow-2xl overflow-hidden max-h-[95vh] flex flex-col border border-white/20">
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-slate-100 shrink-0 bg-blue-50/50">
              <h3 className="font-bold text-base sm:text-lg text-slate-900 flex items-center gap-2"><Building className="text-blue-600 w-4 h-4 sm:w-5 sm:h-5" /> Store Withdrawal</h3>
              <button onClick={() => setIsWithdrawModalOpen(false)} className="text-slate-400 hover:text-slate-700 hover:bg-white bg-slate-100 border border-slate-200 p-1.5 sm:p-2 rounded-full transition shadow-sm"><X size={16} className="sm:w-[18px] sm:h-[18px]"/></button>
            </div>
            <div className="overflow-y-auto p-4 sm:p-6 shrink custom-scrollbar">
              <form onSubmit={handleWithdraw} className="space-y-4 sm:space-y-5">
                <div className="bg-blue-50 text-blue-900 p-3 sm:p-4 rounded-xl text-xs sm:text-sm border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-inner gap-1 sm:gap-0">
                  <span className="font-bold">Available Balance:</span>
                  <span className="font-mono font-black text-base sm:text-lg break-words w-full sm:w-auto text-left sm:text-right">Rs {Number(data?.stats?.availableBalance).toLocaleString()}</span>
                </div>
                <div>
                  <label className="block text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1 sm:mb-1.5">Amount to Withdraw (Rs)</label>
                  <input type="number" required min="500" max={Number(data?.stats?.availableBalance)} value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="e.g. 1500" className="w-full border border-slate-300 p-2.5 sm:p-3.5 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-xs sm:text-sm shadow-sm transition-shadow" />
                </div>
                <div>
                  <label className="block text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1 sm:mb-1.5">Transfer Method</label>
                  <div className="w-full border border-slate-200 bg-slate-50 text-slate-500 p-2.5 sm:p-3.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold cursor-not-allowed">Bank Transfer</div>
                </div>
                <div>
                  <label className="block text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1 sm:mb-1.5">Account Title / Name</label>
                  <input type="text" required value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="e.g. John Doe" className="w-full border border-slate-300 p-2.5 sm:p-3.5 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs sm:text-sm shadow-sm transition-shadow" />
                </div>
                <div>
                  <label className="block text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1 sm:mb-1.5">Account Number / IBAN</label>
                  <input type="text" required value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="e.g. PK32 HABB 0000 1234 5678 90" className="w-full border border-slate-300 p-2.5 sm:p-3.5 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-xs sm:text-sm shadow-sm transition-shadow" />
                </div>
                <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button type="button" onClick={() => setIsWithdrawModalOpen(false)} className="w-full sm:flex-1 py-2.5 sm:py-3.5 bg-slate-100 text-slate-700 text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl hover:bg-slate-200 transition shadow-sm border border-slate-200">Cancel</button>
                  <button type="submit" disabled={isProcessing} className="w-full sm:flex-1 py-2.5 sm:py-3.5 bg-blue-600 text-white text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl hover:bg-blue-700 transition flex justify-center items-center gap-2 disabled:opacity-50 shadow-md shadow-blue-500/20">{isProcessing ? <Loader2 size={16} className="animate-spin" /> : "Withdraw Funds"}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}