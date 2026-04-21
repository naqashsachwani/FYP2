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
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-green-600 w-10 h-10" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12 text-gray-800">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
            <Wallet className="text-green-600 w-8 h-8" /> 
            My Wallet
          </h1>
          <p className="text-gray-500 mt-1">Manage your refunds, store credits, and payouts.</p>
        </div>

        {/* === Balance Card === */}
        <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
          {/* Decorative watermark icon in the top right corner. */}
          <div className="absolute top-0 right-0 p-8 opacity-10"><Wallet size={120} /></div>
          
          <div className="relative z-10">
            <p className="text-green-100 font-medium uppercase tracking-wider text-sm mb-2">Available Balance</p>
            {/* Formats the balance string with commas (e.g., 10000 -> 10,000) */}
            <h2 className="text-5xl md:text-6xl font-black font-mono tracking-tight">
              Rs {Number(walletData.balance).toLocaleString()}
            </h2>
            
            <div className="mt-8 flex gap-3">
              {/* Withdraw Button: Disabled automatically if the balance is 0 or less. */}
              <button 
                onClick={() => setIsWithdrawModalOpen(true)}
                disabled={Number(walletData.balance) <= 0}
                className="bg-white text-green-700 hover:bg-gray-50 transition px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Building size={18} />
                Withdraw Funds
              </button>
            </div>
          </div>
        </div>

        {/* === Transaction Ledger === */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold flex items-center gap-2 mb-6 text-gray-800">
            <History className="text-gray-400" /> Transaction History
          </h3>

          {/* Conditional Rendering: Empty State vs Populated List */}
          {walletData.transactions.length === 0 ? (
            <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl">
              <p>No transactions yet.</p>
              <p className="text-sm mt-1">Refunds and withdrawals will appear here.</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {currentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition border border-transparent hover:border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${tx.type === 'REFUND_CREDIT' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {tx.type === 'REFUND_CREDIT' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{tx.description || "Wallet Update"}</p>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">
                          {/* Formats the database ISO date string into a human-readable format. */}
                          {new Date(tx.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className={`text-lg font-black font-mono ${tx.type === 'REFUND_CREDIT' ? 'text-green-600' : 'text-gray-900'}`}>
                      {tx.type === 'REFUND_CREDIT' ? '+' : '-'}Rs {Number(tx.amount).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Only render pagination controls if there is more than 1 page of data. */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100">
                  {/* Previous Button: Disabled if currently on Page 1. */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-4 py-2 text-sm font-bold text-gray-600 bg-gray-50 rounded-xl hover:bg-gray-100 hover:text-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft size={16} /> Previous
                  </button>
                  <span className="text-sm text-gray-500 font-medium">
                    Page {currentPage} of {totalPages}
                  </span>
                  {/* Next Button: Disabled if currently on the final page. */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-4 py-2 text-sm font-bold text-gray-600 bg-gray-50 rounded-xl hover:bg-gray-100 hover:text-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Conditionally renders the modal overlay if isWithdrawModalOpen is true. */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 border-b border-gray-100 shrink-0">
              <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                <Building className="text-green-600 w-5 h-5" /> Withdrawal
              </h3>
              <button onClick={() => setIsWithdrawModalOpen(false)} className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-full transition"><X size={18} /></button>
            </div>
            
            {/* Modal Body & Form */}
            <div className="overflow-y-auto p-5 shrink">
              <form onSubmit={handleWithdraw} className="space-y-4">
                
                {/* Helpful reminder of available balance */}
                <div className="bg-green-50 text-green-800 p-3 rounded-xl text-sm border border-green-100 flex items-center justify-between font-medium">
                  <span>Available Balance:</span>
                  <span className="font-mono font-bold">Rs {Number(walletData.balance).toLocaleString()}</span>
                </div>

                {/* Amount Input */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Amount to Withdraw (Rs)</label>
                  <input 
                    type="number" 
                    required
                    min="500" 
                    max={Number(walletData.balance)} 
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="e.g. 1500"
                    className="w-full border border-gray-300 p-2.5 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-mono text-sm"
                  />
                </div>

                {/* Transfer Method (Currently locked to Bank Transfer) */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Transfer Method</label>
                  <div className="w-full border border-gray-200 bg-gray-50 text-gray-500 p-2.5 rounded-xl text-sm font-medium cursor-not-allowed">
                    Bank Transfer
                  </div>
                </div>

                {/* Account Name Input */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Account Title / Name</label>
                  <input 
                    type="text" 
                    required
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full border border-gray-300 p-2.5 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm"
                  />
                </div>

                {/* Account Number Input */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Account Number / IBAN</label>
                  <input 
                    type="text" 
                    required
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="e.g. PK32 HABB 0000 1234 5678 90"
                    className="w-full border border-gray-300 p-2.5 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-mono text-sm"
                  />
                </div>

                {/* Modal Action Buttons */}
                <div className="pt-2 flex gap-3">
                  <button type="button" onClick={() => setIsWithdrawModalOpen(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-200 transition">Cancel</button>
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