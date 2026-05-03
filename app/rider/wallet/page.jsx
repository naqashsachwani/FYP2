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
      const res = await fetch("/api/rider/wallet"); // ✅ Calling Rider specific API
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
      // ✅ Posts to Rider specific API
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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-green-600 w-10 h-10" /></div>;

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <Wallet className="text-green-600 w-8 h-8" /> My Earnings Wallet
          </h1>
          <p className="text-slate-500 mt-1">Manage your delivery payouts and withdraw to your bank.</p>
        </div>

        <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10"><Wallet size={120} /></div>
          <div className="relative z-10">
            <p className="text-slate-400 font-medium uppercase tracking-wider text-sm mb-2">Available Balance</p>
            <h2 className="text-5xl md:text-6xl font-black font-mono tracking-tight">Rs {Number(walletData.balance).toLocaleString()}</h2>
            <div className="mt-8 flex gap-3">
              <button 
                onClick={() => setIsWithdrawModalOpen(true)}
                disabled={Number(walletData.balance) <= 0}
                className="bg-green-500 text-white hover:bg-green-400 transition px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Building size={18} /> Withdraw Funds
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
          <h3 className="text-xl font-bold flex items-center gap-2 mb-6 text-slate-800">
            <History className="text-slate-400" /> Ledger History
          </h3>

          {walletData.transactions.length === 0 ? (
            <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
              <p>No transactions yet.</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {currentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition border border-transparent hover:border-slate-100">
                    <div className="flex items-center gap-4">
                      {/* ✅ Checks specifically for EARNING vs WITHDRAWAL */}
                      <div className={`p-3 rounded-xl ${tx.type === 'EARNING' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                        {tx.type === 'EARNING' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{tx.description || "Wallet Update"}</p>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">{new Date(tx.createdAt).toLocaleDateString()} - {new Date(tx.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      </div>
                    </div>
                    <div className={`text-lg font-black font-mono ${tx.type === 'EARNING' ? 'text-green-600' : 'text-slate-900'}`}>
                      {tx.type === 'EARNING' ? '+' : '-'}Rs {Number(tx.amount).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-100">
                  <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="flex items-center gap-1 px-4 py-2 text-sm font-bold text-slate-600 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all disabled:opacity-50"><ChevronLeft size={16} /> Prev</button>
                  <span className="text-sm text-slate-500 font-medium">Page {currentPage} of {totalPages}</span>
                  <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="flex items-center gap-1 px-4 py-2 text-sm font-bold text-slate-600 bg-slate-50 rounded-xl hover:bg-slate-100 transition-all disabled:opacity-50">Next <ChevronRight size={16} /></button>
                </div>
              )}
            </>
          )}
        </div>

      {isWithdrawModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 shrink-0">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2"><Building className="text-green-600 w-5 h-5" /> Withdrawal</h3>
              <button onClick={() => setIsWithdrawModalOpen(false)} className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-full transition"><X size={18} /></button>
            </div>
            
            <div className="overflow-y-auto p-5 shrink">
              <form onSubmit={handleWithdraw} className="space-y-4">
                <div className="bg-green-50 text-green-800 p-3 rounded-xl text-sm border border-green-100 flex items-center justify-between font-medium">
                  <span>Available Balance:</span><span className="font-mono font-bold">Rs {Number(walletData.balance).toLocaleString()}</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Amount to Withdraw (Rs)</label>
                  <input type="number" required min="500" max={Number(walletData.balance)} value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="e.g. 1500" className="w-full border border-slate-300 p-2.5 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-mono text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Transfer Method</label>
                  <div className="w-full border border-slate-200 bg-slate-50 text-slate-500 p-2.5 rounded-xl text-sm font-medium cursor-not-allowed">Bank Transfer</div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Account Title / Name</label>
                  <input type="text" required value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="e.g. John Doe" className="w-full border border-slate-300 p-2.5 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Account Number / IBAN</label>
                  <input type="text" required value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="e.g. PK32 HABB 0000 1234 5678 90" className="w-full border border-slate-300 p-2.5 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-mono text-sm" />
                </div>
                <div className="pt-2 flex gap-3">
                  <button type="button" onClick={() => setIsWithdrawModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-200 transition">Cancel</button>
                  <button type="submit" disabled={isProcessing} className="flex-1 py-2.5 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 transition flex justify-center items-center gap-2 disabled:opacity-50">
                    {isProcessing ? <Loader2 size={16} className="animate-spin" /> : "Withdraw"}
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