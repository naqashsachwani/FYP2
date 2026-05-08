"use client";

import { useEffect, useState } from "react";
import { Loader2, Wallet, ArrowDownLeft, ArrowUpRight, History, X, Building, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

export default function RiderWalletPage() {
  const [walletData, setWalletData] = useState({ balance: 0, transactions: [] });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const TRANSACTIONS_PER_PAGE = 10;

  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [payoutMethod, setPayoutMethod] = useState("Bank Transfer");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  const fetchWallet = async () => {
    try {
      const res = await fetch("/api/rider/wallet"); 
      if (!res.ok) throw new Error("Failed to fetch wallet");
      setWalletData(await res.json());
    } catch (error) { toast.error("Could not load wallet data"); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchWallet(); }, []);

  const handleWithdraw = async (e) => {
    e.preventDefault(); 
    const amountNum = Number(withdrawAmount);
    if (amountNum > Number(walletData.balance)) return toast.error("Amount exceeds balance!");
    if (amountNum < 500) return toast.error("Minimum withdrawal amount is Rs 500");

    setIsProcessing(true);
    const toastId = toast.loading("Submitting withdrawal request...");

    try {
      const res = await fetch("/api/rider/wallet", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amountNum, payoutMethod, accountName, accountNumber })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Request submitted! Funds will be transferred shortly.", { id: toastId });
      setIsWithdrawModalOpen(false);
      setWithdrawAmount(""); setAccountName(""); setAccountNumber("");
      setCurrentPage(1); fetchWallet(); 
    } catch (error) { toast.error(error.message || "Withdrawal failed", { id: toastId }); } 
    finally { setIsProcessing(false); }
  };

  const totalPages = Math.ceil(walletData.transactions.length / TRANSACTIONS_PER_PAGE);
  const currentTransactions = walletData.transactions.slice((currentPage - 1) * TRANSACTIONS_PER_PAGE, currentPage * TRANSACTIONS_PER_PAGE);

  if (loading) return <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600 w-10 h-10" /></div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 sm:space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2 sm:gap-3">
            <Wallet className="text-blue-600 w-6 h-6 sm:w-8 sm:h-8 shrink-0" /> My Earnings Wallet
          </h1>
          <p className="text-slate-500 mt-1.5 text-sm sm:text-base">Manage your delivery payouts and withdraw to your bank.</p>
        </div>

        {/* ✅ LIGHT BLUE WALLET THEME */}
        <div className="bg-blue-50 text-blue-900 p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-blue-200 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-4 sm:p-8 opacity-20 pointer-events-none"><Wallet size={120} className="text-blue-400 w-20 h-20 sm:w-28 sm:h-28 lg:w-[120px] lg:h-[120px]" /></div>
          <div className="relative z-10">
            <p className="text-blue-500 font-bold uppercase tracking-wider text-xs sm:text-sm mb-1.5 sm:mb-2">Available Balance</p>
            {/* ✅ Fixed Truncation: Kept on one line for better UI */}
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black font-mono tracking-tighter text-blue-900 whitespace-nowrap overflow-hidden text-ellipsis w-[85%] sm:w-full">
                Rs {Number(walletData.balance).toLocaleString()}
            </h2>
            <div className="mt-6 sm:mt-8 flex gap-3 w-full sm:w-auto">
              <button 
                onClick={() => setIsWithdrawModalOpen(true)}
                disabled={Number(walletData.balance) <= 0}
                className="w-full sm:w-auto bg-blue-600 text-white hover:bg-blue-700 transition-all active:scale-95 px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl font-bold text-sm flex justify-center items-center gap-2 shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                <Building size={18} className="shrink-0" /> Withdraw Funds
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 shadow-sm border border-slate-200">
          <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2 mb-5 sm:mb-6 text-slate-800">
            <History className="text-slate-400 shrink-0" size={20} /> Ledger History
          </h3>

          {walletData.transactions.length === 0 ? (
            <div className="text-center py-10 sm:py-12 text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
              <p className="text-sm sm:text-base font-medium">No transactions yet.</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 sm:space-y-4">
                {currentTransactions.map((tx) => (
                  <div key={tx.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 hover:bg-slate-50 rounded-xl sm:rounded-2xl transition border border-transparent hover:border-slate-100 gap-3 sm:gap-0">
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                      <div className={`p-2 sm:p-3 rounded-xl shrink-0 ${tx.type === 'EARNING' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                        {tx.type === 'EARNING' ? <ArrowDownLeft size={20} className="w-4 h-4 sm:w-5 sm:h-5"/> : <ArrowUpRight size={20} className="w-4 h-4 sm:w-5 sm:h-5"/>}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm sm:text-base leading-snug">{tx.description || "Wallet Update"}</p>
                        <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-1">{new Date(tx.createdAt).toLocaleDateString()} - {new Date(tx.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      </div>
                    </div>
                    <div className={`text-base sm:text-lg lg:text-xl font-black font-mono self-end sm:self-auto ${tx.type === 'EARNING' ? 'text-blue-600' : 'text-slate-900'}`}>
                      {tx.type === 'EARNING' ? '+' : '-'}Rs {Number(tx.amount).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
              
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-slate-100">
                  <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="flex items-center gap-1 px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold text-slate-600 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all disabled:opacity-50 border border-slate-200"><ChevronLeft size={16} className="w-4 h-4 sm:w-[18px] sm:h-[18px]"/> Prev</button>
                  <span className="text-xs sm:text-sm text-slate-500 font-medium">Page {currentPage} of {totalPages}</span>
                  <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="flex items-center gap-1 px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold text-slate-600 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all disabled:opacity-50 border border-slate-200">Next <ChevronRight size={16} className="w-4 h-4 sm:w-[18px] sm:h-[18px]"/></button>
                </div>
              )}
            </>
          )}
        </div>

      {/* WITHDRAWAL MODAL */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-md shadow-2xl overflow-hidden max-h-[95vh] flex flex-col border border-white/20">
            <div className="flex justify-between items-center p-4 sm:p-5 border-b border-slate-100 shrink-0 bg-blue-50/50">
              <h3 className="font-bold text-base sm:text-lg text-slate-900 flex items-center gap-2"><Building className="text-blue-600 w-4 h-4 sm:w-5 sm:h-5" /> Withdrawal</h3>
              <button onClick={() => setIsWithdrawModalOpen(false)} className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 sm:p-2 rounded-full transition shadow-sm"><X size={16} className="sm:w-[18px] sm:h-[18px]"/></button>
            </div>
            
            <div className="overflow-y-auto p-4 sm:p-5 shrink custom-scrollbar">
              <form onSubmit={handleWithdraw} className="space-y-4">
                <div className="bg-blue-50 text-blue-900 p-3 sm:p-4 rounded-xl text-xs sm:text-sm border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between font-medium shadow-inner gap-1 sm:gap-0">
                  <span className="font-bold uppercase tracking-wider text-[10px] sm:text-xs">Available Balance:</span>
                  <span className="font-mono font-black text-base sm:text-lg w-full sm:w-auto text-left sm:text-right break-words">Rs {Number(walletData.balance).toLocaleString()}</span>
                </div>
                <div>
                  <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 sm:mb-1.5">Amount to Withdraw (Rs)</label>
                  <input type="number" required min="500" max={Number(walletData.balance)} value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="e.g. 1500" className="w-full border border-slate-300 p-2.5 sm:p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm shadow-sm transition-shadow" />
                </div>
                <div>
                  <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 sm:mb-1.5">Transfer Method</label>
                  <div className="w-full border border-slate-200 bg-slate-50 text-slate-500 p-2.5 sm:p-3 rounded-xl text-sm font-bold cursor-not-allowed">Bank Transfer</div>
                </div>
                <div>
                  <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 sm:mb-1.5">Account Title / Name</label>
                  <input type="text" required value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="e.g. John Doe" className="w-full border border-slate-300 p-2.5 sm:p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm shadow-sm transition-shadow" />
                </div>
                <div>
                  <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 sm:mb-1.5">Account Number / IBAN</label>
                  <input type="text" required value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="e.g. PK32 HABB 0000 1234 5678 90" className="w-full border border-slate-300 p-2.5 sm:p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm shadow-sm transition-shadow" />
                </div>
                <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button type="button" onClick={() => setIsWithdrawModalOpen(false)} className="w-full sm:flex-1 py-3 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-200 transition shadow-sm border border-slate-200">Cancel</button>
                  <button type="submit" disabled={isProcessing} className="w-full sm:flex-1 py-3 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition active:scale-[0.98] flex justify-center items-center gap-2 disabled:opacity-50 disabled:active:scale-100 shadow-md shadow-blue-500/20">
                    {isProcessing ? <Loader2 size={16} className="animate-spin shrink-0" /> : "Withdraw Funds"}
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