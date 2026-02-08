"use client";

import { useEffect, useState } from "react";
import { 
  Loader2, TrendingUp, DollarSign, Clock, AlertCircle, PackageCheck, 
  Search, Copy, X, CreditCard, Calendar, CheckCircle, ShieldAlert,
  ChevronLeft, ChevronRight, RefreshCw 
} from "lucide-react";
import toast from "react-hot-toast";

// --- COMPONENT: TRANSACTION DETAILS MODAL ---
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

  if (loading) {
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-12 flex justify-center">
                <Loader2 className="animate-spin text-indigo-600 w-10 h-10" />
            </div>
        </div>
    );
  }

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
            {/* Product Info */}
            <div className="flex gap-4 items-start p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden shrink-0 border">
                <img src={goal.product?.images?.[0] || "/placeholder.png"} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-900">{goal.product?.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">{goal.id}</span>
                </div>
                </div>
                <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${goal.status === 'COMPLETED' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                    {goal.status}
                </span>
                </div>
            </div>

            {/* Financial Breakdown */}
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

            {/* Deposit History */}
            <div className="p-4 border rounded-xl bg-gray-50/50">
                <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-3"><CreditCard size={16} /> Deposit History</h4>
                <div className="flex justify-between items-center mb-4 px-1">
                <span className="text-sm text-gray-600 font-medium">Total Deposits Made</span>
                <span className="text-lg font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                    {goal.deposits?.length || 0}
                </span>
                </div>
                <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 text-gray-600 font-medium"><tr><th className="p-3">Date</th><th className="p-3">Method</th><th className="p-3 text-right">Amount</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">
                        {goal.deposits?.map(d => (
                            <tr key={d.id}>
                            <td className="p-3 text-gray-600 flex items-center gap-2">
                                <Calendar size={12} className="text-gray-400" />
                                {new Date(d.createdAt).toLocaleDateString()}
                            </td>
                            <td className="p-3 text-gray-600 text-xs uppercase">{d.paymentMethod}</td>
                            <td className="p-3 text-right font-mono font-bold text-gray-900">Rs {d.amount.toLocaleString()}</td>
                            </tr>
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

// --- MAIN PAGE ---
export default function StoreRevenuePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGoalId, setSelectedGoalId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  // ✅ UPDATED SEARCH LOGIC
  const filteredTransactions = data?.transactions?.filter((item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    
    const dateStr = new Date(item.date).toLocaleDateString().toLowerCase();
    const amountStr = item.totalAmount.toString();
    const netStr = item.netPayout.toString();
    
    // Combine all fields into one string for easier searching
    let searchableText = `
        ${item.goalId} 
        ${item.productName} 
        ${item.customerName} 
        ${item.status} 
        ${dateStr} 
        ${amountStr} 
        ${netStr}
    `.toLowerCase();

    // ✅ FIX: Manually add "refund" to the search string if status is COMPENSATED
    if (item.status === 'COMPENSATED') {
        searchableText += " refund split"; 
    }

    return searchableText.includes(term);
  }) || [];

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);

  const handleNextPage = () => { if (currentPage < totalPages) setCurrentPage(prev => prev + 1); };
  const handlePrevPage = () => { if (currentPage > 1) setCurrentPage(prev => prev - 1); };

  if (loading && !data) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600 w-10 h-10" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {selectedGoalId && <GoalDetailsModal goalId={selectedGoalId} onClose={() => setSelectedGoalId(null)} />}

      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER & SEARCH */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Revenue Dashboard</h1>
            <p className="text-sm text-gray-500">Track your earnings and payouts for {data?.storeName}.</p>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                type="text" 
                placeholder="Search ID, Product, Refund..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                />
            </div>
            <button 
                onClick={fetchRevenue} 
                className="p-2 bg-white border rounded-lg hover:bg-gray-50 shadow-sm transition-colors text-gray-600"
                title="Refresh Data"
            >
                <RefreshCw size={20} />
            </button>
          </div>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="flex justify-between items-start relative z-10">
              <div><p className="text-sm font-medium text-gray-500">Total Net Earnings</p><h3 className="text-3xl font-bold text-green-600 mt-2">Rs {data?.stats?.totalRevenue?.toLocaleString()}</h3></div>
              <div className="p-3 bg-green-50 rounded-lg text-green-600"><TrendingUp size={24} /></div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-green-50 rounded-full opacity-50 z-0"></div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="flex justify-between items-start relative z-10">
              <div><p className="text-sm font-medium text-gray-500">Pending Payout (Est.)</p><h3 className="text-3xl font-bold text-orange-600 mt-2">Rs {data?.stats?.pendingPayouts?.toLocaleString()}</h3></div>
              <div className="p-3 bg-orange-50 rounded-lg text-orange-600"><Clock size={24} /></div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="flex justify-between items-start relative z-10">
              <div><p className="text-sm font-medium text-gray-500">Platform Fees</p><h3 className="text-3xl font-bold text-gray-800 mt-2">Rs {data?.stats?.platformFees?.toLocaleString()}</h3></div>
              <div className="p-3 bg-gray-100 rounded-lg text-gray-600"><DollarSign size={24} /></div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="flex justify-between items-start relative z-10">
              <div><p className="text-sm font-medium text-gray-500">Total Payouts</p><h3 className="text-3xl font-bold text-indigo-600 mt-2">{data?.stats?.completedOrders}</h3></div>
              <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600"><PackageCheck size={24} /></div>
            </div>
          </div>
        </div>

        {/* REVENUE TABLE */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-lg font-bold text-gray-800">Payout History</h2>
            <span className="text-xs text-gray-500">{filteredTransactions.length} records found</span>
          </div>
          
          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 uppercase font-medium">
                <tr>
                  <th className="px-6 py-4">Goal ID</th>
                  <th className="px-6 py-4">Date Released</th>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Total Amount</th>
                  <th className="px-6 py-4">Fee / Cut</th>
                  <th className="px-6 py-4">Net Earning</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentItems.length === 0 ? (
                    <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-400 flex flex-col items-center gap-2"><AlertCircle size={24} /><span>No payouts found.</span></td></tr>
                ) : (
                    currentItems.map((item) => {
                      const isCompensated = item.status === "COMPENSATED";
                      const displayNet = isCompensated ? (item.totalAmount * 0.10) : item.netPayout;
                      
                      return (
                        <tr key={item.id} onClick={() => setSelectedGoalId(item.goalId)} className="hover:bg-gray-50 cursor-pointer transition-colors group">
                          <td className="px-6 py-4 font-mono text-xs text-blue-600 group-hover:underline">
                              <div className="flex items-center gap-1">
                                  {item.goalId.slice(0, 8)}...
                                  <button onClick={(e) => copyToClipboard(e, item.goalId)} className="p-1 hover:bg-blue-100 rounded"><Copy size={12} /></button>
                              </div>
                          </td>
                          <td className="px-6 py-4 text-gray-500">
                              {new Date(item.date).toLocaleDateString()}
                              <p className="text-xs text-gray-400">{new Date(item.date).toLocaleTimeString()}</p>
                          </td>
                          <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-gray-200 rounded overflow-hidden flex-shrink-0 border">
                                      <img src={item.productImage} alt="Product" className="w-full h-full object-cover" />
                                  </div>
                                  <div>
                                      <p className="font-bold text-gray-900">{item.productName}</p>
                                      <p className="text-xs text-gray-500">Customer: {item.customerName}</p>
                                  </div>
                              </div>
                          </td>
                          <td className="px-6 py-4 font-mono text-gray-600">Rs {item.totalAmount.toLocaleString()}</td>
                          <td className="px-6 py-4 font-mono text-red-500">
                              {isCompensated ? "Refund Split" : `- Rs ${item.platformFee.toLocaleString()}`}
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-green-600 text-base">Rs {displayNet.toLocaleString()}</td>
                          <td className="px-6 py-4">
                              {isCompensated ? (
                                  <span className="px-2 py-1 rounded text-xs font-bold bg-orange-100 text-orange-700 inline-flex items-center gap-1">
                                      <ShieldAlert size={12} /> Compensated
                                  </span>
                              ) : (
                                  <span className="px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-700 inline-flex items-center gap-1">
                                      <CheckCircle size={12} /> Paid
                                  </span>
                              )}
                          </td>
                        </tr>
                      )
                    })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filteredTransactions.length > 0 && (
            <div className="p-4 border-t flex justify-between items-center bg-gray-50 rounded-b-xl">
               <span className="text-xs text-gray-500">
                 Page {currentPage} of {totalPages}
               </span>
               <div className="flex gap-2">
                  <button 
                    onClick={handlePrevPage} 
                    disabled={currentPage === 1} 
                    className="p-2 border rounded bg-white hover:bg-gray-100 disabled:opacity-50 transition-colors"
                  >
                    <ChevronLeft size={16}/>
                  </button>
                  <button 
                    onClick={handleNextPage} 
                    disabled={currentPage === totalPages} 
                    className="p-2 border rounded bg-white hover:bg-gray-100 disabled:opacity-50 transition-colors"
                  >
                    <ChevronRight size={16}/>
                  </button>
               </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}