"use client";

import { useEffect, useState } from "react";
import { 
  Loader2, DollarSign, ArrowDownLeft, AlertCircle, RefreshCw, 
  Search, Copy, CheckCircle, ChevronLeft, ChevronRight, X, 
  Store, CreditCard, ShieldAlert, Download, Car 
} from "lucide-react";
import toast from "react-hot-toast";

// GOAL DETAILS MODAL COMPONENT (Helper)
const GoalDetailsModal = ({ goalId, onClose }) => {
  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!goalId) return;
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/goals/${goalId}?_t=${Date.now()}`, { cache: 'no-store' });
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

  if (loading) return <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"><Loader2 className="animate-spin text-white w-10 h-10" /></div>;
  if (!goal) return null; 

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">Transaction Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="flex gap-4 items-start p-4 bg-gray-50 rounded-xl border border-gray-100">
                 <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden shrink-0 border">
                    <img src={goal.product?.images?.[0] || "/placeholder.png"} className="w-full h-full object-cover" />
                 </div>
                 <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900">{goal.product?.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <Store size={14} /> {goal.product?.store?.name || "Store Info N/A"}
                    </div>
                 </div>
                 <span className={`px-3 py-1 rounded-full text-xs font-bold border ${goal.status === 'COMPLETED' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                    {goal.status}
                 </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 border rounded-xl bg-white shadow-sm">
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Target</p>
                    <p className="text-2xl font-mono font-bold text-gray-900">Rs {goal.targetAmount?.toLocaleString()}</p>
                 </div>
                 <div className="p-4 border rounded-xl bg-green-50 border-green-100 shadow-sm">
                    <p className="text-xs text-green-600 uppercase font-bold tracking-wider mb-1">Saved So Far</p>
                    <p className="text-2xl font-mono font-bold text-green-700">Rs {goal.saved?.toLocaleString()}</p>
                 </div>
            </div>
            
            <div>
                 <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-3"><CreditCard size={16} /> Deposits</h4>
                 <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
                    <table className="w-full text-sm text-left">
                       <thead className="bg-gray-100 text-gray-600 font-medium"><tr><th className="p-3">Date</th><th className="p-3 text-right">Amount</th></tr></thead>
                       <tbody className="divide-y divide-gray-100">
                          {goal.deposits?.map(d => (
                             <tr key={d.id}><td className="p-3">{new Date(d.createdAt).toLocaleDateString()}</td><td className="p-3 text-right">Rs {d.amount.toLocaleString()}</td></tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default function AdminEscrowPage() {
  const [data, setData] = useState(null); 
  const [loading, setLoading] = useState(true); 
  const [processingId, setProcessingId] = useState(null); 

  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1); 
  const [filter, setFilter] = useState("ALL"); 
  
  const [selectedGoalId, setSelectedGoalId] = useState(null); 
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false); 

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/escrow?page=${page}&limit=10&filter=${filter}&_t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error("Failed");
      const jsonData = await res.json();
      setData(jsonData);
    } catch (error) { 
      toast.error("Failed to load data"); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, [page, filter]);

  const handleProcess = async (itemId, actionType, sourceTable) => {
    let confirmMsg = "";
    if (actionType === 'RELEASE') confirmMsg = "Release funds to Store (5% fee)?";
    else if (actionType === 'REFUND') confirmMsg = "Refund funds to User (20% penalty)?";
    else if (actionType === 'RELEASE_RIDER') confirmMsg = "Pay out Rider from company revenue?";

    if (!confirm(confirmMsg)) return;
    
    setProcessingId(itemId); 

    setData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        actionable: prev.actionable.filter(item => item.id !== itemId)
      };
    });

    try {
      await fetch(`/api/admin/escrow/${itemId}/process`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionType, sourceTable }),
      });
      toast.success("Processed Successfully");
      fetchData(); 
    } catch (error) { 
      toast.error("Failed to process transaction."); 
      fetchData(); 
    } finally { 
      setProcessingId(null); 
    }
  };

  const copyToClipboard = (text) => { navigator.clipboard.writeText(text); toast.success("Copied"); };

  const matchesSearch = (item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
        (item.goalId && item.goalId.toLowerCase().includes(term)) ||
        (item.customerName && item.customerName.toLowerCase().includes(term)) ||
        (item.productName && item.productName.toLowerCase().includes(term)) ||
        (item.storeName && item.storeName.toLowerCase().includes(term))
    );
  };

  const pendingReleases = data?.actionable?.filter(i => i.type === "RELEASE" && matchesSearch(i)) || [];
  const pendingRefunds = data?.actionable?.filter(i => i.type === "REFUND" && matchesSearch(i)) || [];
  const pendingRiderPayouts = data?.actionable?.filter(i => i.type === "RIDER_PAYOUT" && matchesSearch(i)) || [];
  const historyData = data?.history?.data?.filter(matchesSearch) || [];
  const totalPages = data?.history?.totalPages || 1;

  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    const toastId = toast.loading("Compiling full report...");

    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable')
      ]);

      const res = await fetch(`/api/admin/escrow?page=1&limit=10000&filter=${filter}&_t=${Date.now()}`, { cache: 'no-store' });
      const fullData = await res.json();
      
      const allHistoryData = fullData?.history?.data || [];
      const allPendingReleases = fullData?.actionable?.filter(i => i.type === "RELEASE") || [];
      const allPendingRefunds = fullData?.actionable?.filter(i => i.type === "REFUND") || [];

      const doc = new jsPDF();
      let currentY = 20; 

      doc.setFontSize(22);
      doc.setTextColor(31, 41, 55); 
      doc.text("DreamSaver - Escrow Management Report", 14, currentY);
      currentY += 8;

      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128); 
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, currentY);
      currentY += 15;

      doc.setFontSize(14);
      doc.setTextColor(31, 41, 55);
      doc.text("1. Financial Summary", 14, currentY);
      currentY += 8;

      doc.setFontSize(11);
      doc.setTextColor(75, 85, 99);
      doc.text(`Gross Escrow Fees: Rs ${fullData?.stats?.grossEarnings?.toLocaleString() || 0}`, 14, currentY);
      currentY += 6;
      doc.text(`Rider Payout Costs: - Rs ${fullData?.stats?.riderCosts?.toLocaleString() || 0}`, 14, currentY);
      currentY += 6;
      doc.setTextColor(22, 163, 74); 
      doc.text(`Net Platform Earnings: Rs ${fullData?.stats?.totalEarnings?.toLocaleString() || 0}`, 14, currentY);
      currentY += 6;
      doc.setTextColor(75, 85, 99);
      doc.text(`Total Funds in Escrow: Rs ${fullData?.stats?.totalHeld?.toLocaleString() || 0}`, 14, currentY);
      currentY += 15;

      doc.setFontSize(14);
      doc.setTextColor(31, 41, 55);
      doc.text(`2. Pending Payouts (Total: ${allPendingReleases.length})`, 14, currentY);
      currentY += 6;

      autoTable(doc, {
        startY: currentY,
        head: [['Goal ID', 'Product', 'Amount', 'Fee (5%)', 'Net Payout']],
        body: allPendingReleases.map(i => [
          i.goalId?.slice(0, 8) + '...', 
          i.productName, 
          `Rs ${i.amount?.toLocaleString()}`, 
          `- Rs ${(i.amount * 0.05).toLocaleString()}`, 
          `Rs ${(i.amount * 0.95).toLocaleString()}`
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [34, 197, 94] }, 
        emptyRecordMessage: "No pending payouts at this time."
      });
      currentY = doc.lastAutoTable.finalY + 15; 

      doc.setFontSize(14);
      doc.setTextColor(31, 41, 55);
      doc.text(`3. Pending Refunds (Total: ${allPendingRefunds.length})`, 14, currentY);
      currentY += 6;

      autoTable(doc, {
        startY: currentY,
        head: [['Goal ID', 'Product', 'Amount', 'Penalty (20%)', 'Refund User']],
        body: allPendingRefunds.map(i => [
          i.goalId?.slice(0, 8) + '...', 
          i.productName, 
          `Rs ${i.amount?.toLocaleString()}`, 
          `- Rs ${(i.amount * 0.20).toLocaleString()}`, 
          `Rs ${(i.amount * 0.80).toLocaleString()}`
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [239, 68, 68] }, 
        emptyRecordMessage: "No pending refunds at this time."
      });
      currentY = doc.lastAutoTable.finalY + 15;

      doc.setFontSize(14);
      doc.setTextColor(31, 41, 55);
      doc.text(`4. Transaction History (Filter: ${filter} | Total: ${allHistoryData.length})`, 14, currentY);
      currentY += 6;

      autoTable(doc, {
        startY: currentY,
        head: [['Date', 'Goal ID', 'Status', 'Product', 'Total Amount', 'Platform Fee', 'Net Exchanged']],
        body: allHistoryData.map(h => [
          new Date(h.date).toLocaleDateString(),
          h.goalId?.slice(0, 8) + '...',
          h.status,
          h.productName,
          `Rs ${h.amount?.toLocaleString()}`,
          h.status === 'HELD' ? 'Pending' : `+ Rs ${h.platformFee?.toLocaleString()}`,
          h.status === 'HELD' ? 'Pending' : `Rs ${h.netAmount?.toLocaleString()}`
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [99, 102, 241] }, 
        emptyRecordMessage: "No transaction history available."
      });

      doc.save(`Escrow_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("PDF Downloaded!", { id: toastId }); 

    } catch (error) {
      console.error(error);
      toast.error("Failed to generate report", { id: toastId }); 
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (loading && !data) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600 w-10 h-10" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {selectedGoalId && <GoalDetailsModal goalId={selectedGoalId} onClose={() => setSelectedGoalId(null)} />}

      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div><h1 className="text-2xl font-bold text-gray-900">Escrow Management</h1><p className="text-sm text-gray-500">Admin Panel</p></div>
          <div className="flex gap-2 w-full md:w-auto">
             <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input type="text" placeholder="Search ID, Product..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 pr-4 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500" />
             </div>
             <button onClick={fetchData} className="p-2 bg-white border rounded-lg hover:bg-gray-50" title="Refresh Data"><RefreshCw size={20} className={loading ? "animate-spin" : ""} /></button>
             
             <button 
                onClick={generatePDF} 
                disabled={isGeneratingPDF}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition shadow-sm disabled:opacity-70"
             >
                {isGeneratingPDF ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                <span className="hidden sm:inline">{isGeneratingPDF ? 'Compiling...' : 'Export Report'}</span>
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between">
             {/* ✅ REMOVED the red subtext below the Earnings */}
             <div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Net Platform Earnings</p>
                <h3 className="text-3xl font-bold text-green-600 mt-1">Rs {data?.stats?.totalEarnings?.toLocaleString()}</h3>
             </div>
             <div className="p-3 bg-green-50 rounded-lg text-green-600 h-fit"><DollarSign size={24} /></div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between">
             <div><p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Funds in Escrow</p><h3 className="text-3xl font-bold text-indigo-600 mt-1">Rs {data?.stats?.totalHeld?.toLocaleString()}</h3></div>
             <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600 h-fit"><ArrowDownLeft size={24} /></div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between">
             <div><p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Pending Actions</p><h3 className="text-3xl font-bold text-orange-600 mt-1">{data?.stats?.pendingActions}</h3></div>
             <div className="p-3 bg-orange-50 rounded-lg text-orange-600 h-fit"><AlertCircle size={24} /></div>
          </div>
        </div>

        <div className="space-y-6">
            
            {/* PENDING PAYOUTS SECTION (To Stores) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b bg-green-50/50"><h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><CheckCircle className="text-green-600 w-5 h-5" /> Ready for Payout (Store)</h2></div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 uppercase font-medium"><tr><th className="px-6 py-4">Goal ID</th><th className="px-6 py-4">Product</th><th className="px-6 py-4">Amount</th><th className="px-6 py-4">Fee (5%)</th><th className="px-6 py-4">Net</th><th className="px-6 py-4 text-right">Action</th></tr></thead>
                        <tbody>
                            {pendingReleases.length === 0 ? <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-400">No pending payouts.</td></tr> : pendingReleases.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 border-b">
                                    <td className="px-6 py-4 font-mono text-xs text-blue-600 cursor-pointer" onClick={() => setSelectedGoalId(item.goalId)}>{item.goalId.slice(0, 8)}...</td>
                                    <td className="px-6 py-4 font-bold">{item.productName}</td>
                                    <td className="px-6 py-4 font-mono">Rs {item.amount.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-red-500">- Rs {(item.amount * 0.05).toLocaleString()}</td>
                                    <td className="px-6 py-4 font-bold text-green-600">Rs {(item.amount * 0.95).toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right"><button onClick={() => handleProcess(item.id, "RELEASE", "ESCROW")} disabled={processingId === item.id} className="px-3 py-1 bg-green-600 text-white rounded text-xs font-bold hover:bg-green-700 disabled:opacity-50">Release</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* PENDING RIDER PAYOUTS SECTION */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b bg-blue-50/50"><h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Car className="text-blue-600 w-5 h-5" /> Rider Payouts</h2></div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 uppercase font-medium"><tr><th className="px-6 py-4">Delivery ID</th><th className="px-6 py-4">Rider Name</th><th className="px-6 py-4">Delivered Product</th><th className="px-6 py-4">Amount</th><th className="px-6 py-4 text-right">Action</th></tr></thead>
                        <tbody>
                            {pendingRiderPayouts.length === 0 ? <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-400">No pending rider payouts.</td></tr> : pendingRiderPayouts.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 border-b">
                                    <td className="px-6 py-4 font-mono text-xs text-gray-500">{item.deliveryId?.slice(0, 8)}...</td>
                                    <td className="px-6 py-4 font-bold text-blue-700">{item.customerName}</td>
                                    <td className="px-6 py-4 text-gray-600">{item.productName}</td>
                                    <td className="px-6 py-4 font-bold text-green-600">Rs {item.amount.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right"><button onClick={() => handleProcess(item.id, "RELEASE_RIDER", "RIDER_PAYOUT")} disabled={processingId === item.id} className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700 disabled:opacity-50">Pay Rider</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* PENDING REFUNDS SECTION (To Users) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b bg-red-50/50"><h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><AlertCircle className="text-red-600 w-5 h-5" /> Refund Requests</h2></div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 uppercase font-medium"><tr><th className="px-6 py-4">Goal ID</th><th className="px-6 py-4">Product</th><th className="px-6 py-4">Amount</th><th className="px-6 py-4">Penalty (20%)</th><th className="px-6 py-4">Refund User</th><th className="px-6 py-4 text-right">Action</th></tr></thead>
                        <tbody>
                            {pendingRefunds.length === 0 ? <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-400">No pending refunds.</td></tr> : pendingRefunds.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 border-b">
                                    <td className="px-6 py-4 font-mono text-xs text-blue-600 cursor-pointer" onClick={() => setSelectedGoalId(item.goalId)}>{item.goalId.slice(0, 8)}...</td>
                                    <td className="px-6 py-4 font-bold">{item.productName}</td>
                                    <td className="px-6 py-4 font-mono">Rs {item.amount.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-red-500">- Rs {(item.amount * 0.20).toLocaleString()}</td>
                                    <td className="px-6 py-4 font-bold text-gray-800">Rs {(item.amount * 0.80).toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right"><button onClick={() => handleProcess(item.id, "REFUND", "REFUND_REQUEST")} disabled={processingId === item.id} className="px-3 py-1 bg-red-600 text-white rounded text-xs font-bold hover:bg-red-700 disabled:opacity-50">Process</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* --- ALL TRANSACTIONS HISTORY TABLE --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          
          <div className="p-6 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
             <h2 className="text-lg font-bold text-gray-800">All Transactions</h2>
             <div className="flex bg-gray-100 p-1 rounded-lg">
                {['ALL', 'ACTIVE', 'HISTORY'].map(f => (
                    <button key={f} onClick={() => { setFilter(f); setPage(1); }} 
                        className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${filter === f ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>
                        {f === 'ACTIVE' ? 'Active' : f === 'HISTORY' ? 'History' : 'All Data'}
                    </button>
                ))}
             </div>
          </div>

          <div className="overflow-x-auto min-h-[300px]">
             {loading && !data ? <div className="flex h-full items-center justify-center p-10"><Loader2 className="animate-spin text-gray-300"/></div> : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 uppercase font-medium">
                    <tr>
                        <th className="px-6 py-4">Goal ID</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Type</th>
                        <th className="px-6 py-4">Product</th>
                        <th className="px-6 py-4">Total</th>
                        <th className="px-6 py-4">Admin Fee</th>
                        <th className="px-6 py-4">Net Payout</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {historyData.map((h) => (
                      <tr key={h.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedGoalId(h.goalId)}>
                        <td className="px-6 py-4 font-mono text-xs text-blue-600 group-hover:underline">
                            <div className="flex items-center gap-1">
                                {h.goalId ? h.goalId.slice(0, 8) : 'N/A'}...
                                <button onClick={(e) => { e.stopPropagation(); copyToClipboard(h.goalId); }} className="p-1 hover:bg-blue-100 rounded"><Copy size={12} /></button>
                            </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500">{new Date(h.date).toLocaleDateString()}</td>
                        
                        <td className="px-6 py-4">
                            {h.status === 'RELEASED' && <span className="px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-700 flex items-center gap-1 w-fit"><CheckCircle size={12}/> Delivered</span>}
                            {h.status === 'REFUNDED' && <span className="px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-700 flex items-center gap-1 w-fit"><ShieldAlert size={12}/> Cancelled</span>}
                            {h.status === 'HELD' && <span className="px-2 py-1 rounded text-xs font-bold bg-yellow-100 text-yellow-700">Pending</span>}
                        </td>

                        <td className="px-6 py-4 font-bold">{h.productName}</td>

                        <td className="px-6 py-4 font-mono">Rs {h.amount.toLocaleString()}</td>
                        
                        <td className="px-6 py-4 text-gray-600">
                            {h.status === 'HELD' ? '-' : <span className="font-bold text-green-600">+ Rs {h.platformFee.toLocaleString()}</span>}
                            {h.status === 'REFUNDED' && <span className="text-[10px] text-gray-400 block">(10% Fee)</span>}
                            {h.status === 'RELEASED' && <span className="text-[10px] text-gray-400 block">(5% Fee)</span>}
                        </td>

                        <td className="px-6 py-4 font-mono font-medium">
                            {h.status === 'HELD' ? <span className="text-yellow-600 italic">Pending</span> : `Rs ${h.netAmount.toLocaleString()}`}
                            {h.status === 'REFUNDED' && <span className="text-[10px] text-gray-400 block">(80% User Refund)</span>}
                            {h.status === 'RELEASED' && <span className="text-[10px] text-gray-400 block">(95% Store)</span>}
                        </td>
                      </tr>
                    ))}
                    {historyData.length === 0 && <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-400">No records found.</td></tr>}
                  </tbody>
                </table>
             )}
          </div>
          
          <div className="p-4 border-t flex justify-between items-center bg-gray-50 rounded-b-xl">
             <span className="text-xs text-gray-500">Page {page} of {totalPages} (Total: {data?.history?.totalRecords || 0})</span>
             <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 border rounded bg-white hover:bg-gray-100 disabled:opacity-50"><ChevronLeft size={16}/></button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 border rounded bg-white hover:bg-gray-100 disabled:opacity-50"><ChevronRight size={16}/></button>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}