"use client";

import { useEffect, useState } from "react";
import { Loader2, Wallet, ArrowDownLeft, ArrowUpRight, History, X, Building, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@clerk/nextjs";

export default function UserWalletPage() {
  const { isLoaded, userId } = useAuth();
  
  const [walletData, setWalletData] = useState({ balance: 0, transactions: [] });
  const [loading, setLoading] = useState(true);

  // Tracks which page of the transaction history the user is currently viewing.
  const [currentPage, setCurrentPage] = useState(1);
  const TRANSACTIONS_PER_PAGE = 10;

  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Stores payout details for the withdrawal request.
  const [payoutMethod, setPayoutMethod] = useState("Bank Transfer");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  // function to retrieve the user's wallet balance and transaction history from the backend.
  const fetchWallet = async () => {
    try {
      const res = await fetch("/api/wallet");
      if (!res.ok) throw new Error("Failed to fetch wallet");
      const data = await res.json();
      setWalletData(data);
    } catch (error) {
      toast.error("Could not load wallet data");
    } finally {
      setLoading(false);
    }
  };

  // Triggers the fetchWallet function once Clerk has finished loading and confirmed a valid userId exists.
  useEffect(() => {
    if (isLoaded && userId) fetchWallet();
  }, [isLoaded, userId]);

  // Handles the logic when a user attempts to withdraw funds.
  const handleWithdraw = async (e) => {
    e.preventDefault(); 
    const amountNum = Number(withdrawAmount);
    
    if (amountNum > Number(walletData.balance)) {
      return toast.error("Amount exceeds your available balance!");
    }
    if (amountNum < 500) {
      return toast.error("Minimum withdrawal amount is Rs 500");
    }

    setIsProcessing(true); // Lock the submit button and show a spinner.
    // Create a toast notification that stays on screen while the request processes.
    const toastId = toast.loading("Submitting withdrawal request...");

    try {
      // Send a POST request to the backend with the withdrawal details.
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountNum,
          payoutMethod,
          accountName,
          accountNumber
        })
      });

      const data = await res.json();

      // If the backend rejects the request, throw an error to trigger the catch block.
      if (!res.ok) throw new Error(data.error);

      toast.success("Request submitted! Funds will be transferred shortly.", { id: toastId });
      
      setIsWithdrawModalOpen(false);
      setWithdrawAmount("");
      setAccountName("");
      setAccountNumber("");
      
      setCurrentPage(1); 
      fetchWallet(); 

    } catch (error) {
      toast.error(error.message || "Withdrawal failed", { id: toastId });
    } finally {
      setIsProcessing(false); 
    }
  };

  // --- Pagination Logic ---
  const totalPages = Math.ceil(walletData.transactions.length / TRANSACTIONS_PER_PAGE);
  const startIndex = (currentPage - 1) * TRANSACTIONS_PER_PAGE;
  const currentTransactions = walletData.transactions.slice(startIndex, startIndex + TRANSACTIONS_PER_PAGE);

  // Display a full-page spinner while waiting for Clerk to initialize or data to fetch.
  if (loading || !isLoaded) {
    return <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-green-600 w-10 h-10" /></div>;
  }

  return (
    <div className="min-h-[100dvh] bg-gray-50 p-4 sm:p-6 md:p-12 text-gray-800">
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
        
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-2 sm:gap-3">
            <Wallet className="text-green-600 w-6 h-6 sm:w-8 sm:h-8" /> 
            My Wallet
          </h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">Manage your refunds, store credits, and payouts.</p>
        </div>

        {/* === Balance Card === */}
        <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col justify-between">
          {/* Decorative watermark icon in the top right corner. */}
          <div className="absolute top-0 right-0 p-4 sm:p-8 opacity-10 pointer-events-none"><Wallet size={120} className="w-20 h-20 sm:w-28 sm:h-28 lg:w-[120px] lg:h-[120px]" /></div>
          
          <div className="relative z-10">
            <p className="text-green-100 font-medium uppercase tracking-wider text-xs sm:text-sm mb-1.5 sm:mb-2">Available Balance</p>
            {/* Formats the balance string with commas (e.g., 10000 -> 10,000) */}
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black font-mono tracking-tight break-words pr-1">
              Rs {Number(walletData.balance).toLocaleString()}
            </h2>
            
            <div className="mt-6 sm:mt-8 flex gap-3">
              {/* Withdraw Button: Disabled automatically if the balance is 0 or less. */}
              <button 
                onClick={() => setIsWithdrawModalOpen(true)}
                disabled={Number(walletData.balance) <= 0}
                className="w-full sm:w-auto bg-white text-green-700 hover:bg-gray-50 transition-all active:scale-95 px-5 sm:px-6 py-3 rounded-xl font-bold text-sm flex justify-center items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                <Building size={18} className="shrink-0" />
                Withdraw Funds
              </button>
            </div>
          </div>
        </div>

        {/* === Transaction Ledger === */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 shadow-sm border border-gray-100">
          <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2 mb-4 sm:mb-6 text-gray-800">
            <History className="text-gray-400 shrink-0" size={20} /> Transaction History
          </h3>

          {/* Conditional Rendering: Empty State vs Populated List */}
          {walletData.transactions.length === 0 ? (
            <div className="text-center py-10 sm:py-12 text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl">
              <p className="text-sm sm:text-base font-medium">No transactions yet.</p>
              <p className="text-xs sm:text-sm mt-1">Refunds and withdrawals will appear here.</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 sm:space-y-4">
                {currentTransactions.map((tx) => (
                  <div key={tx.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 hover:bg-gray-50 rounded-xl sm:rounded-2xl transition border border-transparent hover:border-gray-100 gap-3 sm:gap-0">
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                      <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl shrink-0 ${tx.type === 'REFUND_CREDIT' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {tx.type === 'REFUND_CREDIT' ? <ArrowDownLeft className="w-4 h-4 sm:w-5 sm:h-5" /> : <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" />}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm sm:text-base leading-snug">{tx.description || "Wallet Update"}</p>
                        <p className="text-[10px] sm:text-xs text-gray-500 font-medium mt-1">
                          {/* Formats the database ISO date string into a human-readable format. */}
                          {new Date(tx.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className={`text-base sm:text-lg md:text-xl font-black font-mono self-end sm:self-auto shrink-0 ${tx.type === 'REFUND_CREDIT' ? 'text-green-600' : 'text-gray-900'}`}>
                      {tx.type === 'REFUND_CREDIT' ? '+' : '-'}Rs {Number(tx.amount).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Only render pagination controls if there is more than 1 page of data. */}
              {totalPages > 1 && (
                <div className="flex flex-row items-center justify-between mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-gray-100 gap-2">
                  {/* Previous Button */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold text-gray-600 bg-gray-50 rounded-lg sm:rounded-xl hover:bg-gray-100 hover:text-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-gray-200 shadow-sm"
                  >
                    <ChevronLeft size={16} className="w-4 h-4 sm:w-[16px] sm:h-[16px]" /> <span className="hidden sm:inline">Previous</span>
                  </button>
                  <span className="text-xs sm:text-sm text-gray-500 font-medium">
                    Page {currentPage} of {totalPages}
                  </span>
                  {/* Next Button */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold text-gray-600 bg-gray-50 rounded-lg sm:rounded-xl hover:bg-gray-100 hover:text-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-gray-200 shadow-sm"
                  >
                    <span className="hidden sm:inline">Next</span> <ChevronRight size={16} className="w-4 h-4 sm:w-[16px] sm:h-[16px]" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Conditionally renders the modal overlay if isWithdrawModalOpen is true. */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl sm:rounded-3xl w-[95%] sm:w-full max-w-md shadow-2xl overflow-hidden max-h-[90dvh] flex flex-col border border-white/20">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 sm:p-5 border-b border-gray-100 shrink-0 bg-green-50/50">
              <h3 className="font-bold text-base sm:text-lg text-gray-900 flex items-center gap-2">
                <Building className="text-green-600 w-4 h-4 sm:w-5 sm:h-5" /> Withdrawal
              </h3>
              <button onClick={() => setIsWithdrawModalOpen(false)} className="text-gray-400 hover:text-red-500 bg-white border border-gray-200 p-1.5 sm:p-2 rounded-full transition shadow-sm">
                <X size={16} className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
              </button>
            </div>
            
            {/* Modal Body & Form */}
            <div className="overflow-y-auto p-4 sm:p-5 shrink custom-scrollbar">
              <form onSubmit={handleWithdraw} className="space-y-4">
                
                {/* Helpful reminder of available balance */}
                <div className="bg-green-50 text-green-800 p-3 sm:p-4 rounded-xl text-xs sm:text-sm border border-green-200 flex flex-col sm:flex-row items-start sm:items-center justify-between font-medium shadow-inner gap-1 sm:gap-0">
                  <span className="font-bold">Available Balance:</span>
                  <span className="font-mono font-black text-base sm:text-lg break-words w-full sm:w-auto text-left sm:text-right">Rs {Number(walletData.balance).toLocaleString()}</span>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="block text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 sm:mb-1.5">Amount to Withdraw (Rs)</label>
                  <input 
                    type="number" 
                    required
                    min="500" 
                    max={Number(walletData.balance)} 
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="e.g. 1500"
                    className="w-full border border-gray-300 p-2.5 sm:p-3 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-mono text-sm shadow-sm transition-shadow"
                  />
                </div>

                {/* Transfer Method (Currently locked to Bank Transfer) */}
                <div>
                  <label className="block text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 sm:mb-1.5">Transfer Method</label>
                  <div className="w-full border border-gray-200 bg-gray-50 text-gray-500 p-2.5 sm:p-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold cursor-not-allowed">
                    Bank Transfer
                  </div>
                </div>

                {/* Account Name Input */}
                <div>
                  <label className="block text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 sm:mb-1.5">Account Title / Name</label>
                  <input 
                    type="text" 
                    required
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full border border-gray-300 p-2.5 sm:p-3 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-xs sm:text-sm shadow-sm transition-shadow"
                  />
                </div>

                {/* Account Number Input */}
                <div>
                  <label className="block text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 sm:mb-1.5">Account Number / IBAN</label>
                  <input 
                    type="text" 
                    required
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="e.g. PK32 HABB 0000 1234 5678 90"
                    className="w-full border border-gray-300 p-2.5 sm:p-3 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-mono text-xs sm:text-sm shadow-sm transition-shadow"
                  />
                </div>

                {/* Modal Action Buttons */}
                <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button type="button" onClick={() => setIsWithdrawModalOpen(false)} className="w-full sm:flex-1 py-2.5 sm:py-3 bg-white border border-gray-200 text-gray-700 text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl hover:bg-gray-100 transition shadow-sm">Cancel</button>
                  <button type="submit" disabled={isProcessing} className="w-full sm:flex-1 py-2.5 sm:py-3 bg-green-600 text-white text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl hover:bg-green-700 transition flex justify-center items-center gap-2 disabled:opacity-50 shadow-md shadow-green-600/20 active:scale-[0.98] disabled:active:scale-100">
                    {isProcessing ? <Loader2 size={16} className="animate-spin shrink-0 w-4 h-4 sm:w-[16px] sm:h-[16px]" /> : "Withdraw"}
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