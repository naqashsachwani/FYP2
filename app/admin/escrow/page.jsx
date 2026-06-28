"use client";

import { useEffect, useState } from "react";
import { 
  Loader2, DollarSign, ArrowDownLeft, AlertCircle, RefreshCcw, 
  Search, Copy, CheckCircle, ChevronLeft, ChevronRight, X, 
  Store, CreditCard, ShieldAlert, Download, Car, ListFilter, ArrowUpDown, Gift,
  User, Package, MapPin
} from "lucide-react";
import toast from "react-hot-toast";

// =====================================
// RIDER PAYOUT DETAILS MODAL
// =====================================
const RiderPayoutModal = ({ payout, onClose }) => {
  if (!payout) return null;
  const rider = payout.rider;
  const delivery = payout.delivery;
  const product = delivery?.goal?.product;
  const store = product?.store;
  const customer = delivery?.goal?.user;

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[70] flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-[95%] sm:w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20 max-h-[90dvh] flex flex-col">
         {/* Header */}
         <div className="flex justify-between items-center p-4 sm:p-6 border-b bg-slate-50 shrink-0">
           <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2"><Car className="text-slate-600 w-5 h-5 sm:w-6 sm:h-6"/> Rider Payout Details</h2>
           <button onClick={onClose} className="p-1.5 sm:p-2 hover:bg-slate-200 text-slate-500 rounded-full transition-colors"><X size={20}/></button>
         </div>

         {/* Body */}
         <div className="p-4 sm:p-6 space-y-6 overflow-y-auto custom-scrollbar">

            {/* Amount Banner */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 flex justify-between items-center shadow-sm">
               <div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Payout Amount</p>
                  <p className="text-2xl sm:text-3xl font-black font-mono text-slate-900">Rs {payout.amount?.toLocaleString()}</p>
               </div>
               <div className="text-right">
                  <span className={`px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold border ${payout.status === 'PENDING' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-green-50 text-green-700 border-green-200'}`}>{payout.status === 'TRANSFERRED' ? 'APPROVED' : payout.status}</span>
               </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Rider Info */}
                <div className="border border-slate-100 rounded-xl p-4 bg-slate-50">
                    <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2"><User size={16} className="text-slate-500"/> Rider Profile</h3>
                    <p className="text-xs text-slate-500 mb-1">Name: <span className="font-bold text-slate-800">{rider?.user?.name || "N/A"}</span></p>
                    <p className="text-xs text-slate-500 mb-1">Phone: <span className="font-bold text-slate-800">{rider?.phoneNumber || "N/A"}</span></p>
                    <p className="text-xs text-slate-500 mb-1">Vehicle: <span className="font-bold text-slate-800">{rider?.vehicleType || "N/A"}</span></p>
                    <p className="text-xs text-slate-500">Plate: <span className="font-bold text-slate-800">{rider?.vehiclePlate || "N/A"}</span></p>
                </div>

                {/* Delivery Info */}
                <div className="border border-slate-100 rounded-xl p-4 bg-slate-50">
                    <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2"><Package size={16} className="text-slate-500"/> Delivery Summary</h3>
                    <p className="text-xs text-slate-500 mb-1">Status: <span className={`font-bold ${delivery?.status === 'DELIVERED' ? 'text-green-600' : 'text-slate-800'}`}>{delivery?.status || "N/A"}</span></p>
                    <p className="text-xs text-slate-500 mb-1">Item: <span className="font-bold text-slate-800 truncate" title={product?.name}>{product?.name?.slice(0,25) || "N/A"}</span></p>
                    <p className="text-xs text-slate-500 mb-1">Delivered: <span className="font-bold text-slate-800">{delivery?.deliveryDate ? new Date(delivery.deliveryDate).toLocaleDateString() : "N/A"}</span></p>
                    <p className="text-xs text-slate-500">Tracking ID: <span className="font-mono font-bold text-slate-700">{delivery?.trackingNumber || "N/A"}</span></p>
                </div>
            </div>

            {/* Route */}
            <div className="border border-slate-100 rounded-xl p-4 bg-white shadow-sm">
                <h3 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-2"><MapPin size={16} className="text-slate-500"/> Route Details</h3>
                <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
                    <div className="relative">
                        <div className="absolute -left-[31px] bg-white p-1 rounded-full border border-slate-100"><Store size={14} className="text-slate-400" /></div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Pickup (Store)</p>
                        <p className="text-sm font-bold text-slate-800">{store?.name || "N/A"}</p>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{store?.address || "No address provided"}</p>
                    </div>
                    <div className="relative">
                        <div className="absolute -left-[31px] bg-white p-1 rounded-full border border-slate-100"><MapPin size={14} className="text-slate-600" /></div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Dropoff (Customer)</p>
                        <p className="text-sm font-bold text-slate-800">{customer?.name || "N/A"}</p>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{delivery?.shippingAddress || "No address provided"}</p>
                    </div>
                </div>
            </div>
         </div>

         <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-100 shrink-0 flex justify-end">
            <button onClick={onClose} className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition-colors shadow-md">Close</button>
         </div>
      </div>
    </div>
  );
};


// =====================================
// BONUS DETAILS MODAL
// =====================================
const BonusDetailsModal = ({ bonus, onClose }) => {
  if (!bonus) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
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
            <span className="text-xs sm:text-sm font-bold text-slate-800">{new Date(bonus.date || bonus.createdAt).toLocaleString('en-GB')}</span>
          </div>
          <div className="flex justify-between items-center border-b border-slate-100 pb-2 sm:pb-3">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Recipient</span>
            <span className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5 sm:gap-2 text-right">
              <span className="truncate max-w-[120px] sm:max-w-[160px]">{bonus.storeName || bonus.recipientName || "Store"}</span> 
              {bonus.recipientType && <span className="text-[8px] sm:text-[10px] bg-indigo-100 text-indigo-700 px-1.5 sm:px-2 py-0.5 rounded-full border border-indigo-200 shrink-0">{bonus.recipientType}</span>}
            </span>
          </div>
          <div className="flex justify-between items-center border-b border-slate-100 pb-2 sm:pb-3">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Total Amount</span>
            <span className="text-xs sm:text-sm font-mono font-bold text-green-700 bg-green-50 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded border border-green-200 shadow-sm">Rs {bonus.amount?.toLocaleString() || bonus.netPayout?.toLocaleString()}</span>
          </div>
          <div className="pt-1 sm:pt-2">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5 sm:mb-2">Description / Reason</span>
            <p className="text-xs sm:text-sm text-slate-700 bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200 leading-relaxed font-medium shadow-inner break-words">
              {bonus.reason || bonus.productName || bonus.description || "Administrative Bonus / Adjustment"}
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

// =====================================
// GOAL DETAILS MODAL
// =====================================
const GoalDetailsModal = ({ goalId, onClose }) => {
  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!goalId || goalId === "BONUS" || goalId.length < 15) return; // Prevent rider payout IDs from calling Goal API
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/goals/${goalId}?_t=${Date.now()}`, { cache: 'no-store' });
        const data = await res.json();
        if (data.goal) setGoal(data.goal);
      } catch (e) { toast.error("Failed to load details"); } 
      finally { setLoading(false); }
    };
    fetchDetails();
  }, [goalId]);

  if (!goalId || goalId === "BONUS" || goalId.length < 15) return null; 
  if (loading) return <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"><Loader2 className="animate-spin text-white w-10 h-10" /></div>;
  if (!goal) return null; 

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl sm:rounded-xl shadow-2xl w-[95%] sm:w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90dvh]">
        <div className="flex justify-between items-center p-4 sm:p-6 border-b bg-gray-50 shrink-0">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">Transaction Details</h2>
          <button onClick={onClose} className="p-1.5 sm:p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={20} className="w-4 h-4 sm:w-5 sm:h-5" /></button>
        </div>
        
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto custom-scrollbar shrink">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-100">
                 <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-lg overflow-hidden shrink-0 border"><img src={goal.product?.images?.[0] || "/placeholder.png"} className="w-full h-full object-cover" /></div>
                 <div className="flex-1 min-w-0 w-full sm:w-auto">
                    <h3 className="font-bold text-base sm:text-lg text-gray-900 truncate">{goal.product?.name}</h3>
                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600 mt-1 truncate"><Store size={14} className="shrink-0" /> <span className="truncate">{goal.product?.store?.name || "Store Info N/A"}</span></div>
                 </div>
                 <span className={`px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold border whitespace-nowrap self-start mt-1 sm:mt-0 ${goal.status === 'COMPLETED' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>{goal.status}</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                 <div className="p-3 sm:p-4 border rounded-xl bg-white shadow-sm flex flex-col justify-center">
                    <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Target</p>
                    <p className="text-xl sm:text-2xl font-mono font-bold text-gray-900 truncate">Rs {goal.targetAmount?.toLocaleString()}</p>
                 </div>
                 <div className="p-3 sm:p-4 border rounded-xl bg-green-50 border-green-100 shadow-sm flex flex-col justify-center">
                    <p className="text-[10px] sm:text-xs text-green-600 uppercase font-bold tracking-wider mb-1">Saved So Far</p>
                    <p className="text-xl sm:text-2xl font-mono font-bold text-green-700 truncate">Rs {goal.saved?.toLocaleString()}</p>
                 </div>
            </div>
            
            <div>
                 <h4 className="font-bold text-gray-900 text-sm sm:text-base flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3"><CreditCard size={16} className="w-4 h-4 sm:w-[18px] sm:h-[18px]"/> Deposits</h4>
                 <div className="border rounded-xl overflow-hidden bg-white shadow-sm overflow-x-auto custom-scrollbar">
                    <table className="w-full text-xs sm:text-sm text-left min-w-[250px]">
                       <thead className="bg-gray-100 text-gray-600 font-medium text-[10px] sm:text-xs uppercase tracking-wider">
                          <tr><th className="p-2 sm:p-3 whitespace-nowrap">Date</th><th className="p-2 sm:p-3 text-right whitespace-nowrap">Amount</th></tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100">
                          {goal.deposits?.map(d => (
                            <tr key={d.id}>
                                <td className="p-2 sm:p-3 whitespace-nowrap">{new Date(d.createdAt).toLocaleDateString()}</td>
                                <td className="p-2 sm:p-3 text-right font-mono font-bold whitespace-nowrap">Rs {d.amount.toLocaleString()}</td>
                            </tr>
                          ))}
                          {(!goal.deposits || goal.deposits.length === 0) && <tr><td colSpan="2" className="p-4 sm:p-6 text-center text-gray-400 italic text-[11px] sm:text-xs">No deposits recorded</td></tr>}
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
  const [sortOrder, setSortOrder] = useState("NEWEST"); 
  
  const [selectedGoalId, setSelectedGoalId] = useState(null); 
  const [selectedBonus, setSelectedBonus] = useState(null); 
  const [selectedRiderPayout, setSelectedRiderPayout] = useState(null); 
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false); 

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/escrow?page=${page}&limit=10&filter=${filter}&_t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error("Failed");
      const jsonData = await res.json();
      setData(jsonData);
    } catch (error) { toast.error("Failed to load data"); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [page, filter]);

  const handleRefresh = () => {
    setSearchTerm("");
    setFilter("ALL");
    setSortOrder("NEWEST");
    setPage(1);
    fetchData();
  };

  const handleProcess = async (itemId, actionType, sourceTable) => {
    let confirmMsg = "";
    if (actionType === 'RELEASE') confirmMsg = "Release funds to Store (5% fee)?";
    else if (actionType === 'REFUND') confirmMsg = "Refund funds to User (20% penalty)?";
    else if (actionType === 'RELEASE_RIDER') confirmMsg = "Approve Earnings for Rider Wallet?";

    if (!confirm(confirmMsg)) return;
    
    setProcessingId(itemId); 
    setData(prev => { if (!prev) return prev; return { ...prev, actionable: prev.actionable.filter(item => item.id !== itemId) }; });

    try {
      await fetch(`/api/admin/escrow/${itemId}/process`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: actionType, sourceTable }) });
      toast.success("Processed Successfully");
      fetchData(); 
    } catch (error) { toast.error("Failed to process transaction."); fetchData(); } 
    finally { setProcessingId(null); }
  };

  const copyToClipboard = (text) => { navigator.clipboard.writeText(text); toast.success("Copied"); };

  const matchesSearch = (item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    
    const safeString = (val) => (val ? String(val).toLowerCase() : "");

    const idMatch = safeString(item.goalId).includes(term) || safeString(item.id).includes(term) || safeString(item.deliveryId).includes(term);
    const nameMatch = safeString(item.customerName).includes(term) || safeString(item.storeName).includes(term) || safeString(item.productName).includes(term);
    const statusMatch = safeString(item.status).includes(term) || safeString(item.type).includes(term);
    const amountMatch = safeString(item.amount).includes(term) || safeString(item.platformFee).includes(term) || safeString(item.netAmount).includes(term);
    
    let dateMatch = false;
    if (item.date || item.createdAt) { dateMatch = new Date(item.date || item.createdAt).toLocaleDateString().toLowerCase().includes(term); }

    return idMatch || nameMatch || statusMatch || amountMatch || dateMatch;
  };

  const pendingReleases = data?.actionable?.filter(i => i.type === "RELEASE" && matchesSearch(i)) || [];
  const pendingRefunds = data?.actionable?.filter(i => i.type === "REFUND" && matchesSearch(i)) || [];
  const pendingRiderPayouts = data?.actionable?.filter(i => i.type === "RIDER_PAYOUT" && matchesSearch(i)) || [];
  
  let historyData = data?.history?.data?.filter(matchesSearch) || [];
  if (sortOrder === "NEWEST") { historyData.sort((a, b) => new Date(b.date) - new Date(a.date)); } 
  else if (sortOrder === "OLDEST") { historyData.sort((a, b) => new Date(a.date) - new Date(b.date)); } 
  else if (sortOrder === "HIGH_AMOUNT") { historyData.sort((a, b) => b.amount - a.amount); } 
  else if (sortOrder === "LOW_AMOUNT") { historyData.sort((a, b) => a.amount - b.amount); }

  const totalPages = data?.history?.totalPages || 1;

  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    const toastId = toast.loading("Compiling full report...");

    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'), import('jspdf-autotable')
      ]);

      const res = await fetch(`/api/admin/escrow?page=1&limit=10000&filter=${filter}&_t=${Date.now()}`, { cache: 'no-store' });
      const fullData = await res.json();
      
      const allHistoryData = fullData?.history?.data || [];
      const allPendingReleases = fullData?.actionable?.filter(i => i.type === "RELEASE") || [];
      const allPendingRefunds = fullData?.actionable?.filter(i => i.type === "REFUND") || [];

      const doc = new jsPDF();
      let currentY = 20; 

      doc.setFontSize(22); doc.setTextColor(31, 41, 55); 
      doc.text("DreamSaver - Escrow Management Report", 14, currentY); currentY += 8;
      doc.setFontSize(10); doc.setTextColor(107, 114, 128); 
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, currentY); currentY += 15;
      doc.setFontSize(14); doc.setTextColor(31, 41, 55);
      doc.text("1. Financial Summary", 14, currentY); currentY += 8;
      doc.setFontSize(11); doc.setTextColor(75, 85, 99);
      doc.text(`Gross Escrow Fees: Rs ${fullData?.stats?.grossEarnings?.toLocaleString() || 0}`, 14, currentY); currentY += 6;
      doc.text(`Rider Payout Costs: - Rs ${fullData?.stats?.riderCosts?.toLocaleString() || 0}`, 14, currentY); currentY += 6;
      doc.setTextColor(22, 163, 74); 
      doc.text(`Net Platform Earnings: Rs ${fullData?.stats?.totalEarnings?.toLocaleString() || 0}`, 14, currentY); currentY += 6;
      doc.setTextColor(75, 85, 99);
      doc.text(`Total Funds in Escrow: Rs ${fullData?.stats?.totalHeld?.toLocaleString() || 0}`, 14, currentY); currentY += 15;
      doc.setFontSize(14); doc.setTextColor(31, 41, 55);
      doc.text(`2. Pending Payouts (Total: ${allPendingReleases.length})`, 14, currentY); currentY += 6;

      autoTable(doc, {
        startY: currentY,
        head: [['Goal ID', 'Product', 'Amount', 'Fee (5%)', 'Net Payout']],
        body: allPendingReleases.map(i => [i.goalId?.slice(0, 8) + '...', i.productName, `Rs ${i.amount?.toLocaleString()}`, `- Rs ${(i.amount * 0.05).toLocaleString()}`, `Rs ${(i.amount * 0.95).toLocaleString()}`]),
        styles: { fontSize: 9 }, headStyles: { fillColor: [34, 197, 94] }, emptyRecordMessage: "No pending payouts at this time."
      });
      currentY = doc.lastAutoTable.finalY + 15; 

      doc.setFontSize(14); doc.setTextColor(31, 41, 55);
      doc.text(`3. Pending Refunds (Total: ${allPendingRefunds.length})`, 14, currentY); currentY += 6;

      autoTable(doc, {
        startY: currentY,
        head: [['Goal ID', 'Product', 'Amount', 'Penalty (20%)', 'Refund User']],
        body: allPendingRefunds.map(i => [i.goalId?.slice(0, 8) + '...', i.productName, `Rs ${i.amount?.toLocaleString()}`, `- Rs ${(i.amount * 0.20).toLocaleString()}`, `Rs ${(i.amount * 0.80).toLocaleString()}`]),
        styles: { fontSize: 9 }, headStyles: { fillColor: [239, 68, 68] }, emptyRecordMessage: "No pending refunds at this time."
      });
      currentY = doc.lastAutoTable.finalY + 15;

      doc.setFontSize(14); doc.setTextColor(31, 41, 55);
      doc.text(`4. Transaction History (Filter: ${filter} | Total: ${allHistoryData.length})`, 14, currentY); currentY += 6;

      autoTable(doc, {
        startY: currentY,
        head: [['Date', 'Goal ID', 'Status', 'Product', 'Total Amount', 'Platform Fee', 'Net Exchanged']],
        body: allHistoryData.map(h => [new Date(h.date).toLocaleDateString(), h.goalId?.slice(0, 8) + '...', h.status, h.productName, `Rs ${h.amount?.toLocaleString()}`, h.status === 'HELD' ? 'Pending' : `+ Rs ${h.platformFee?.toLocaleString()}`, h.status === 'HELD' ? 'Pending' : `Rs ${h.netAmount?.toLocaleString()}`]),
        styles: { fontSize: 9 }, headStyles: { fillColor: [99, 102, 241] }, emptyRecordMessage: "No transaction history available."
      });

      doc.save(`Escrow_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("PDF Downloaded!", { id: toastId }); 

    } catch (error) { toast.error("Failed to generate report", { id: toastId }); } 
    finally { setIsGeneratingPDF(false); }
  };

  if (loading && !data) return <div className="min-h-[100dvh] flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600 w-10 h-10" /></div>;

  return (
    <div className="min-h-[100dvh] bg-gray-50 p-4 sm:p-6 lg:p-8">
      
      {/* RENDER MODALS */}
      {selectedGoalId && selectedGoalId !== "BONUS" && <GoalDetailsModal goalId={selectedGoalId} onClose={() => setSelectedGoalId(null)} />}
      <BonusDetailsModal bonus={selectedBonus} onClose={() => setSelectedBonus(null)} />
      <RiderPayoutModal payout={selectedRiderPayout} onClose={() => setSelectedRiderPayout(null)} />

      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 sm:border-none pb-4 sm:pb-0">
          <div><h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Escrow Management</h1><p className="text-xs sm:text-sm text-gray-500 mt-1">Admin Panel</p></div>
          <div className="flex gap-2 w-full md:w-auto">
             <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input type="text" placeholder="Search ID, Amount, Status..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg sm:rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm text-sm transition-shadow" />
             </div>
             <button 
               onClick={handleRefresh} 
               disabled={loading}
               className="p-2 sm:p-2.5 bg-white border border-gray-300 rounded-lg sm:rounded-xl hover:bg-gray-50 shadow-sm transition-colors text-gray-600 shrink-0"
               title="Reset search and refresh"
             >
               <RefreshCcw size={18} className={`sm:w-5 sm:h-5 ${loading ? "animate-spin" : ""}`} />
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 flex justify-between h-full">
            <div className="min-w-0 pr-2">
                <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Net Platform Earnings</p>
                <h3 className="text-xl lg:text-2xl xl:text-3xl font-black text-green-600 tracking-tighter whitespace-nowrap overflow-hidden text-ellipsis">Rs {data?.stats?.totalEarnings?.toLocaleString()}</h3>
            </div>
            <div className="p-2.5 sm:p-3 bg-green-50 rounded-xl sm:rounded-2xl text-green-600 h-fit shrink-0"><DollarSign size={20} className="sm:w-6 sm:h-6" /></div>
          </div>
          <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 flex justify-between h-full">
            <div className="min-w-0 pr-2">
                <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Funds in Escrow</p>
                <h3 className="text-xl lg:text-2xl xl:text-3xl font-black text-indigo-600 tracking-tighter whitespace-nowrap overflow-hidden text-ellipsis">Rs {data?.stats?.totalHeld?.toLocaleString()}</h3>
            </div>
            <div className="p-2.5 sm:p-3 bg-indigo-50 rounded-xl sm:rounded-2xl text-indigo-600 h-fit shrink-0"><ArrowDownLeft size={20} className="sm:w-6 sm:h-6" /></div>
          </div>
          <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 flex justify-between h-full sm:col-span-2 md:col-span-1">
            <div className="min-w-0 pr-2">
                <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Pending Actions</p>
                <h3 className="text-xl lg:text-2xl xl:text-3xl font-black text-orange-600 tracking-tighter">{data?.stats?.pendingActions}</h3>
            </div>
            <div className="p-2.5 sm:p-3 bg-orange-50 rounded-xl sm:rounded-2xl text-orange-600 h-fit shrink-0"><AlertCircle size={20} className="sm:w-6 sm:h-6" /></div>
          </div>
        </div>

        <div className="space-y-6 sm:space-y-8">
            
            {/* PENDING PAYOUTS SECTION (To Stores) */}
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 sm:p-6 border-b bg-green-50/50"><h2 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2"><CheckCircle className="text-green-600 w-4 h-4 sm:w-5 sm:h-5 shrink-0" /> Ready for Payout (Store)</h2></div>
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-sm text-left min-w-[700px]">
                        <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-[9px] sm:text-[10px] tracking-wider">
                            <tr><th className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">Goal ID</th><th className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">Product</th><th className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">Amount</th><th className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">Fee (5%)</th><th className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">Net</th><th className="px-4 sm:px-6 py-3 sm:py-4 text-right whitespace-nowrap">Action</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {pendingReleases.length === 0 ? <tr><td colSpan="6" className="px-4 sm:px-6 py-10 sm:py-12 text-center text-gray-400 text-xs sm:text-sm">No pending payouts matching search.</td></tr> : pendingReleases.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 sm:px-6 py-3 sm:py-4 font-mono text-[10px] sm:text-xs text-blue-600 cursor-pointer hover:underline whitespace-nowrap" onClick={() => setSelectedGoalId(item.goalId)}>{item.goalId.slice(0, 8)}...</td>
                                    <td className="px-4 sm:px-6 py-3 sm:py-4 font-bold text-xs sm:text-sm text-slate-800 max-w-[150px] sm:max-w-[200px] truncate" title={item.productName}>{item.productName}</td>
                                    <td className="px-4 sm:px-6 py-3 sm:py-4 font-mono text-xs sm:text-sm whitespace-nowrap">Rs {item.amount.toLocaleString()}</td>
                                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-red-500 font-mono text-xs sm:text-sm whitespace-nowrap">- Rs {(item.amount * 0.05).toLocaleString()}</td>
                                    <td className="px-4 sm:px-6 py-3 sm:py-4 font-bold text-green-600 font-mono text-sm sm:text-base whitespace-nowrap">Rs {(item.amount * 0.95).toLocaleString()}</td>
                                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-right whitespace-nowrap">
                                        <button onClick={() => handleProcess(item.id, "RELEASE", "ESCROW")} disabled={processingId === item.id} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-all disabled:opacity-50 shadow-sm active:scale-[0.98]">
                                            {processingId === item.id ? <Loader2 size={14} className="animate-spin inline mr-1" /> : null} Release
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* PENDING RIDER PAYOUTS SECTION */}
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 sm:p-6 border-b bg-blue-50/50"><h2 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2"><Car className="text-blue-600 w-4 h-4 sm:w-5 sm:h-5 shrink-0" /> Pending Rider Payouts</h2></div>
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-sm text-left min-w-[600px]">
                        <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-[9px] sm:text-[10px] tracking-wider">
                            <tr><th className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">Ref ID</th><th className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">Rider Name</th><th className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">Details</th><th className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">Amount</th><th className="px-4 sm:px-6 py-3 sm:py-4 text-right whitespace-nowrap">Action</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {pendingRiderPayouts.length === 0 ? <tr><td colSpan="5" className="px-4 sm:px-6 py-10 sm:py-12 text-center text-gray-400 text-xs sm:text-sm">No pending rider payouts matching search.</td></tr> : pendingRiderPayouts.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 sm:px-6 py-3 sm:py-4 font-mono text-[10px] sm:text-xs text-blue-600 cursor-pointer hover:underline whitespace-nowrap" onClick={() => setSelectedRiderPayout(item.raw)}>{item.id.slice(-8).toUpperCase()}</td>
                                    <td className="px-4 sm:px-6 py-3 sm:py-4 font-bold text-xs sm:text-sm text-blue-700 whitespace-nowrap">{item.customerName}</td>
                                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-gray-600 text-xs sm:text-sm max-w-[150px] sm:max-w-[200px] truncate" title={item.productName}>{item.productName}</td>
                                    <td className="px-4 sm:px-6 py-3 sm:py-4 font-bold text-green-600 font-mono text-sm sm:text-base whitespace-nowrap">Rs {item.amount.toLocaleString()}</td>
                                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-right whitespace-nowrap">
                                        <button onClick={() => handleProcess(item.id, "RELEASE_RIDER", "RIDER_PAYOUT")} disabled={processingId === item.id} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all disabled:opacity-50 shadow-sm active:scale-[0.98]">
                                            {processingId === item.id ? <Loader2 size={14} className="animate-spin inline mr-1" /> : null} Approve
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* PENDING REFUNDS SECTION (To Users) */}
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 sm:p-6 border-b bg-red-50/50"><h2 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2"><AlertCircle className="text-red-600 w-4 h-4 sm:w-5 sm:h-5 shrink-0" /> Refund Requests</h2></div>
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-sm text-left min-w-[700px]">
                        <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-[9px] sm:text-[10px] tracking-wider">
                            <tr><th className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">Goal ID</th><th className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">Product</th><th className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">Amount</th><th className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">Penalty (20%)</th><th className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">Refund User</th><th className="px-4 sm:px-6 py-3 sm:py-4 text-right whitespace-nowrap">Action</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {pendingRefunds.length === 0 ? <tr><td colSpan="6" className="px-4 sm:px-6 py-10 sm:py-12 text-center text-gray-400 text-xs sm:text-sm">No pending refunds matching search.</td></tr> : pendingRefunds.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 sm:px-6 py-3 sm:py-4 font-mono text-[10px] sm:text-xs text-blue-600 cursor-pointer hover:underline whitespace-nowrap" onClick={() => setSelectedGoalId(item.goalId)}>{item.goalId.slice(0, 8)}...</td>
                                    <td className="px-4 sm:px-6 py-3 sm:py-4 font-bold text-xs sm:text-sm text-slate-800 max-w-[150px] sm:max-w-[200px] truncate" title={item.productName}>{item.productName}</td>
                                    <td className="px-4 sm:px-6 py-3 sm:py-4 font-mono text-xs sm:text-sm whitespace-nowrap">Rs {item.amount.toLocaleString()}</td>
                                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-red-500 font-mono text-xs sm:text-sm whitespace-nowrap">- Rs {(item.amount * 0.20).toLocaleString()}</td>
                                    <td className="px-4 sm:px-6 py-3 sm:py-4 font-bold text-gray-800 font-mono text-sm sm:text-base whitespace-nowrap">Rs {(item.amount * 0.80).toLocaleString()}</td>
                                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-right whitespace-nowrap">
                                        <button onClick={() => handleProcess(item.id, "REFUND", "REFUND_REQUEST")} disabled={processingId === item.id} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-all disabled:opacity-50 shadow-sm active:scale-[0.98]">
                                            {processingId === item.id ? <Loader2 size={14} className="animate-spin inline mr-1" /> : null} Process
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* --- ALL TRANSACTIONS HISTORY TABLE --- */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          
          <div className="p-4 sm:p-5 lg:p-6 border-b flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-gray-50/50 shrink-0">
             <h2 className="text-base sm:text-lg font-bold text-gray-800 whitespace-nowrap">All Transactions</h2>
             <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                 <div className="relative w-full sm:w-48">
                     <ListFilter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none w-4 h-4 sm:w-[18px] sm:h-[18px]"/>
                     <select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }} className="w-full pl-9 sm:pl-10 pr-8 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-gray-700 cursor-pointer shadow-sm transition-shadow appearance-none">
                        <option value="ALL">All Statuses</option>
                        <option value="ACTIVE">Pending (Escrow)</option>
                        <option value="HISTORY">Completed / Refunded</option>
                        <option value="EXTRA_PAYMENTS">Extra Payments</option> 
                     </select>
                 </div>
                 <div className="relative w-full sm:w-52">
                     <ArrowUpDown className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none w-4 h-4 sm:w-[18px] sm:h-[18px]"/>
                     <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="w-full pl-9 sm:pl-10 pr-8 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-gray-700 cursor-pointer shadow-sm transition-shadow appearance-none">
                        <option value="NEWEST">Date: Newest</option><option value="OLDEST">Date: Oldest</option><option value="HIGH_AMOUNT">Amount: High</option><option value="LOW_AMOUNT">Amount: Low</option>
                     </select>
                 </div>
                 
                 <button onClick={generatePDF} disabled={isGeneratingPDF || historyData.length === 0} className="w-full sm:w-auto px-4 sm:px-5 py-2.5 sm:py-3 bg-slate-900 text-white font-bold rounded-lg sm:rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm shadow-md active:scale-[0.98] disabled:active:scale-100 shrink-0">
                    {isGeneratingPDF ? <Loader2 size={16} className="animate-spin shrink-0"/> : <Download size={16} className="shrink-0"/>}
                    <span className="whitespace-nowrap">Export PDF</span>
                 </button>
             </div>
          </div>

          <div className="overflow-x-auto min-h-[300px] flex-1 custom-scrollbar">
             {loading && !data ? <div className="flex h-full items-center justify-center p-10"><Loader2 className="animate-spin text-gray-300 w-8 h-8"/></div> : (
                <table className="w-full text-sm text-left min-w-[900px]">
                  <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-[9px] sm:text-[10px] tracking-wider border-b border-gray-100">
                    <tr><th className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">Ref / Goal ID</th><th className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">Date</th><th className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">Type</th><th className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">Product / Detail</th><th className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">Total</th><th className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">Admin Fee</th><th className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">Net Payout</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {historyData.map((h) => (
                      <tr key={h.id} className="hover:bg-gray-50 cursor-pointer group transition-colors" onClick={() => {
                          if (h.type === 'EXTRA_PAYMENT') setSelectedBonus(h);
                          else if (h.type === 'RIDER_PAYOUT') setSelectedRiderPayout(h.raw);
                          else setSelectedGoalId(h.goalId);
                      }}>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 font-mono text-[10px] sm:text-xs text-blue-600 group-hover:underline whitespace-nowrap">
                            <div className="flex items-center gap-1">
                                {h.goalId === "BONUS" ? h.id.slice(-8).toUpperCase() : h.type === "RIDER_PAYOUT" ? h.id.slice(-8).toUpperCase() : h.goalId ? h.goalId.slice(0, 8) + '...' : 'N/A'}
                                {h.goalId !== "BONUS" && h.type !== "RIDER_PAYOUT" && <button onClick={(e) => { e.stopPropagation(); copyToClipboard(h.goalId); }} className="p-1 hover:bg-blue-100 rounded transition-colors"><Copy size={12} /></button>}
                            </div>
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-gray-500 font-medium text-[10px] sm:text-xs whitespace-nowrap">{new Date(h.date).toLocaleDateString('en-GB')}</td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            {h.status === 'RELEASED' && <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] uppercase font-bold bg-green-100 text-green-700 flex items-center gap-1 w-fit border border-green-200 shadow-sm"><CheckCircle size={10} className="sm:w-3 sm:h-3"/> Delivered</span>}
                            {h.status === 'REFUNDED' && <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] uppercase font-bold bg-red-100 text-red-700 flex items-center gap-1 w-fit border border-red-200 shadow-sm"><ShieldAlert size={10} className="sm:w-3 sm:h-3"/> Cancelled</span>}
                            {h.status === 'HELD' && <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] uppercase font-bold bg-yellow-100 text-yellow-700 border border-yellow-200 shadow-sm w-fit">Pending</span>}
                            {h.status === 'EXTRA_PAYMENT' && <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] uppercase font-bold bg-indigo-100 text-indigo-700 flex items-center gap-1 w-fit border border-indigo-200 shadow-sm"><Gift size={10} className="sm:w-3 sm:h-3"/> Bonus</span>}
                            {h.type === 'RIDER_PAYOUT' && <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] uppercase font-bold bg-blue-100 text-blue-700 flex items-center gap-1 w-fit border border-blue-200 shadow-sm"><Car size={10} className="sm:w-3 sm:h-3"/> Rider Paid</span>}
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 font-bold text-xs sm:text-sm text-slate-800 max-w-[150px] sm:max-w-[200px] truncate" title={h.productName}>{h.productName}</td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 font-mono font-bold text-xs sm:text-sm text-gray-800 whitespace-nowrap">Rs {h.amount.toLocaleString()}</td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-gray-600 font-mono text-[10px] sm:text-xs whitespace-nowrap">
                            {h.status === 'HELD' || h.status === 'EXTRA_PAYMENT' || h.type === 'RIDER_PAYOUT' ? '-' : <span className="font-bold text-green-600">+ Rs {h.platformFee.toLocaleString()}</span>}
                            {h.status === 'REFUNDED' && <span className="text-[9px] sm:text-[10px] text-gray-400 block font-sans">(10% Fee)</span>}
                            {h.status === 'RELEASED' && <span className="text-[9px] sm:text-[10px] text-gray-400 block font-sans">(5% Fee)</span>}
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 font-mono font-medium text-xs sm:text-sm whitespace-nowrap">
                            {h.status === 'HELD' ? <span className="text-yellow-600 italic font-sans text-[10px] sm:text-xs">Pending</span> : <span className="font-bold">Rs {h.netAmount.toLocaleString()}</span>}
                            {h.status === 'REFUNDED' && <span className="text-[9px] sm:text-[10px] text-gray-400 block font-sans">(80% User Refund)</span>}
                            {h.status === 'RELEASED' && <span className="text-[9px] sm:text-[10px] text-gray-400 block font-sans">(95% Store)</span>}
                            {h.status === 'EXTRA_PAYMENT' && <span className="text-[9px] sm:text-[10px] text-gray-400 block font-sans">To {h.storeName}</span>}
                            {h.type === 'RIDER_PAYOUT' && <span className="text-[9px] sm:text-[10px] text-gray-400 block font-sans">To Rider</span>}
                        </td>
                      </tr>
                    ))}
                    {historyData.length === 0 && <tr><td colSpan="7" className="px-4 sm:px-6 py-12 text-center text-gray-400 text-xs sm:text-sm">No records found matching your criteria.</td></tr>}
                  </tbody>
                </table>
             )}
          </div>
          {historyData.length > 0 && (
             <div className="p-3 sm:p-4 border-t flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0 bg-gray-50 rounded-b-xl sm:rounded-b-3xl shrink-0">
               <span className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-wider">Page {page} of {totalPages} (Total: {data?.history?.totalRecords || 0})</span>
               <div className="flex gap-1.5 sm:gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 sm:p-2 border rounded-lg sm:rounded-xl bg-white hover:bg-gray-100 disabled:opacity-50 shadow-sm transition-colors text-slate-600"><ChevronLeft size={16} className="w-4 h-4 sm:w-[18px] sm:h-[18px]"/></button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 sm:p-2 border rounded-lg sm:rounded-xl bg-white hover:bg-gray-100 disabled:opacity-50 shadow-sm transition-colors text-slate-600"><ChevronRight size={16} className="w-4 h-4 sm:w-[18px] sm:h-[18px]"/></button>
               </div>
             </div>
          )}
        </div>

      </div>
    </div>
  );
}