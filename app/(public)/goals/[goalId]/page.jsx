"use client"; 

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Line } from "react-chartjs-2";
import "chart.js/auto"; 
import { FileText, X, Download, FileBarChart, Loader2, Truck, CheckCircle, Gift, Wallet, ChevronLeft, ChevronRight } from "lucide-react"; 
import toast from "react-hot-toast";
import GoalCard from "@/components/GoalCard";
import RedeemAction from "@/components/RedeemAction";
import { useUser } from "@clerk/nextjs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Utility function to generate a single transaction invoice PDF
const generateInvoicePDF = (transaction, product, userName) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a5" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const rightEdge = pageWidth - margin;

  // Header Section
  doc.setTextColor(5, 150, 105);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", margin, 20);

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("DreamSaver Payment Receipt", margin, 26);

  // Separator Line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin, 32, rightEdge, 32);

  const startY = 45;
  const lineHeight = 6;

  // Billed To Section
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.setFont("helvetica", "bold");
  doc.text("BILLED TO", margin, startY);

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.text(userName || "Valued User", margin, startY + lineHeight);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`User ID: ${transaction.userId.slice(0, 12)}...`, margin, startY + (lineHeight * 2));

  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.setFont("helvetica", "bold");
  doc.text("RECEIPT #", rightEdge, startY, { align: "right" });

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.text(transaction.receiptNumber?.slice(0, 8) || "N/A", rightEdge, startY + lineHeight, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Date: ${new Date(transaction.createdAt).toLocaleDateString('en-GB')}`, rightEdge, startY + (lineHeight * 2), { align: "right" });
  doc.text(`Time: ${new Date(transaction.createdAt).toLocaleTimeString()}`, rightEdge, startY + (lineHeight * 3) - 1, { align: "right" });

  // Generate Table using autoTable plugin
  autoTable(doc, {
    startY: startY + 25,
    head: [['Description', 'Payment Method', 'Amount']],
    body: [
      [
        { content: product?.name || "Savings Deposit", styles: { fontStyle: 'bold', textColor: [30, 41, 59] } },
        { content: transaction.paymentMethod, styles: { textColor: [100, 116, 139] } },
        { content: `Rs ${transaction.amount.toLocaleString()}`, styles: { halign: 'right', fontStyle: 'bold', textColor: [30, 41, 59] } }
      ]
    ],
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 4, lineColor: [226, 232, 240], lineWidth: 0.1 },
    headStyles: { fillColor: [248, 250, 252], textColor: [71, 85, 105], fontStyle: 'bold', halign: 'left' },
    columnStyles: { 0: { cellWidth: 'auto' }, 1: { cellWidth: 40 }, 2: { cellWidth: 35, halign: 'right' } },
    margin: { left: margin, right: margin }
  });

  // Footer Totals
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("Total Paid:", rightEdge - 40, finalY, { align: "right" });

  doc.setTextColor(5, 150, 105);
  doc.setFontSize(14);
  doc.text(`Rs ${transaction.amount.toLocaleString()}`, rightEdge, finalY, { align: "right" });

  // Footer Branding
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, pageHeight - 20, rightEdge, pageHeight - 20);
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.setFont("helvetica", "normal");
  doc.text("Thank you for using DreamSaver to achieve your goals.", pageWidth / 2, pageHeight - 14, { align: "center" });
  doc.text("This is a computer-generated receipt.", pageWidth / 2, pageHeight - 10, { align: "center" });

  doc.save(`Invoice_${transaction.receiptNumber?.slice(0, 8)}.pdf`);
};

// Utility function to generate a full monthly/goal history report
const generateReportPDF = (deposits, goalName) => {
  const doc = new jsPDF();
  doc.setTextColor(5, 150, 105);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Detailed Savings Report", 14, 20);

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Goal: ${goalName}`, 14, 27);
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-GB')}`, 14, 32);

  // Map over deposits to construct table rows
  const tableData = deposits.map(d => [
    new Date(d.createdAt).toLocaleDateString('en-GB'),
    new Date(d.createdAt).toLocaleTimeString(),
    d.receiptNumber?.slice(0, 8) || "N/A",
    `Rs ${d.amount.toLocaleString()}`
  ]);

  autoTable(doc, {
    startY: 40,
    head: [['Date', 'Time', 'Receipt #', 'Amount']],
    body: tableData,
    headStyles: { fillColor: [5, 150, 105], textColor: 255, fontStyle: 'bold' },
    bodyStyles: { textColor: [51, 65, 85] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 40 }, 2: { cellWidth: 50 }, 3: { halign: 'right', fontStyle: 'bold', textColor: [5, 150, 105] } },
    margin: { top: 40 }
  });

  doc.save("DreamSaver_Detailed_Report.pdf");
};

const InvoiceModal = ({ transaction, product, onClose, userName }) => {
  if (!transaction) return null; 
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-[95%] sm:w-full max-w-md overflow-hidden relative flex flex-col max-h-[90dvh]">
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-slate-100 shrink-0">
          <h2 className="text-lg sm:text-xl font-bold uppercase tracking-widest text-emerald-700">INVOICE</h2>
          <button onClick={onClose} className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-full transition-colors z-10">
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
          </button>
        </div>
        
        <div className="p-5 sm:p-8 bg-white text-slate-800 overflow-y-auto custom-scrollbar shrink">
          <div className="flex flex-col sm:flex-row sm:justify-between items-start mb-6 sm:mb-8 gap-4 sm:gap-0">
            <div className="text-xs sm:text-sm">
              <p className="text-slate-500 font-medium mb-1 uppercase tracking-wider text-[10px] sm:text-xs">Billed To</p>
              <h4 className="font-bold text-slate-800 text-sm sm:text-base leading-tight">{userName}</h4>
              <p className="text-slate-500 font-medium mt-1">User ID:</p>
              <p className="text-slate-400 text-[10px] sm:text-xs break-all max-w-[200px] sm:max-w-[150px]">{transaction.userId}</p>
            </div>
            <div className="text-left sm:text-right text-xs sm:text-sm">
              <p className="text-slate-500 font-medium mb-1 uppercase tracking-wider text-[10px] sm:text-xs">Receipt #</p>
              <p className="font-mono font-bold text-slate-800">{transaction.receiptNumber?.slice(0, 8) || "N/A"}</p>
              <div className="mt-3 sm:mt-4 text-slate-500">
                <p>{new Date(transaction.createdAt).toLocaleDateString('en-GB')}</p>
                <p>{new Date(transaction.createdAt).toLocaleTimeString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-50 flex justify-between px-3 sm:px-4 py-2 text-[10px] sm:text-xs font-bold text-slate-500 uppercase mb-3 sm:mb-4 rounded-lg">
            <span>Description</span>
            <span>Amount</span>
          </div>
          <div className="flex justify-between items-start border-b border-slate-200 pb-4 mb-4 px-1 sm:px-2 gap-3 sm:gap-0">
            <div className="min-w-0 pr-2">
              <p className="font-bold text-sm sm:text-base text-slate-900 truncate">{product?.name || "Deposit"}</p>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-1 uppercase">Method: {transaction.paymentMethod}</p>
              <p className="text-[10px] sm:text-xs text-slate-400 font-mono mt-0.5">ID: {transaction.id.slice(-8)}...</p>
            </div>
            <p className="font-bold font-mono text-sm sm:text-base text-slate-900 whitespace-nowrap">Rs {transaction.amount.toLocaleString()}</p>
          </div>
          <div className="flex justify-between items-center px-1 sm:px-2 pt-2">
            <span className="font-bold text-base sm:text-lg text-slate-900">Total Paid:</span>
            <span className="font-black text-lg sm:text-xl font-mono text-emerald-600">Rs {transaction.amount.toLocaleString()}</span>
          </div>
          <div className="text-center text-[10px] sm:text-xs text-slate-400 mt-8 sm:mt-10 leading-relaxed border-t border-slate-100 pt-4 sm:pt-6">
            <p>Thank you for using DreamSaver.</p>
            <p>This is a computer-generated receipt.</p>
          </div>
        </div>
        
        <div className="p-4 sm:p-5 bg-slate-50 border-t flex justify-end shrink-0">
          <button onClick={() => generateInvoicePDF(transaction, product, userName)} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 sm:py-2.5 bg-emerald-600 text-white text-sm rounded-xl hover:bg-emerald-700 font-bold transition-colors shadow-sm active:scale-[0.98]">
            <Download className="w-4 h-4" /> Download PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default function GoalDetails() {
  const { goalId } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();

  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingDeposit, setSavingDeposit] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [addresses, setAddresses] = useState([]); 

  // ✅ Pagination State
  const [txPage, setTxPage] = useState(1);
  const TX_PER_PAGE = 5;

  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletAmount, setWalletAmount] = useState("");
  const [isProcessingWallet, setIsProcessingWallet] = useState(false);

  const handledRef = useRef(false);

  const fetchGoal = async () => {
    try {
      const res = await fetch(`/api/goals/${goalId}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      normalizeAndSetGoal(data.goal); 
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
        const res = await fetch(`/api/address`); 
        if(res.ok) {
            const data = await res.json();
            setAddresses(data.addresses || []);
        }
    } catch (error) { console.error(error); }
  };

  const fetchWalletBalance = async () => {
    try {
        const res = await fetch(`/api/wallet`); 
        if(res.ok) {
            const data = await res.json();
            setWalletBalance(Number(data.balance) || 0);
        }
    } catch (error) { console.error(error); }
  };

  const normalizeAndSetGoal = (goalData) => {
    setGoal((prevGoal) => {
      const deposits = (goalData.deposits || []).map((d) => ({
        ...d,
        amount: Number(d.amount),
        createdAt: new Date(d.createdAt),
      }));
      const calculatedSaved = deposits.reduce((sum, dep) => sum + dep.amount, 0);
      
      // ✅ STRONGER DATE FALLBACK: Ensures existing date is never overwritten by a null backend response
      const dateString = goalData.endDate || goalData.targetDate || prevGoal?.endDate || prevGoal?.targetDate || goalData.createdAt;
      let validEndDate = null;
      let formattedEndDate = "--";

      if (dateString) {
          const parsedDate = new Date(dateString);
          if (!isNaN(parsedDate)) {
              validEndDate = parsedDate;
              formattedEndDate = parsedDate.toLocaleDateString('en-GB'); 
          }
      }

      const normalizedGoal = {
        ...goalData,
        targetAmount: Number(goalData.targetAmount),
        deposits: deposits,
        saved: calculatedSaved,
        endDate: validEndDate,
        formattedEndDate: formattedEndDate !== "--" ? formattedEndDate : prevGoal?.formattedEndDate || "--", 
        delivery: goalData.delivery, 
        status: goalData.status
      };
      
      normalizedGoal.progressPercent = normalizedGoal.targetAmount > 0 ? (normalizedGoal.saved / normalizedGoal.targetAmount) * 100 : 0;
      return normalizedGoal;
    });
  };

  useEffect(() => {
    fetchGoal();
    if (user) {
      fetchAddresses();
      fetchWalletBalance();
    }
  }, [goalId, user]);

  useEffect(() => {
    const payment = searchParams.get("payment");
    const amount = searchParams.get("amount");
    if (payment === "success" && amount && !handledRef.current) {
      handledRef.current = true; 
      setSavingDeposit(true);
      fetch(`/api/goals/${goalId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount) }),
      }).then(async (res) => {
          const data = await res.json();
          if (data.success && data.goal) {
            normalizeAndSetGoal(data.goal); 
            setSuccessMessage(data.goalCompleted ? "🎉 Goal Completed!" : "✅ Deposit Added!");
            router.replace(`/goals/${goalId}`);
          }
        }).finally(() => setSavingDeposit(false));
    }
  }, [searchParams, goalId, router]);

  const handleWalletDepositSubmit = async (e) => {
    e.preventDefault();
    const amountNum = Number(walletAmount);
    const remaining = Math.max(0, goal.targetAmount - goal.saved);

    if (amountNum <= 0) return toast.error("Enter a valid amount");
    if (amountNum > walletBalance) return toast.error("Insufficient wallet balance");
    if (amountNum > remaining) return toast.error(`Maximum allowed is Rs ${remaining}`);

    setIsProcessingWallet(true);
    const toastId = toast.loading("Processing wallet deposit...");

    try {
      const res = await fetch(`/api/goals/${goalId}/deposit/wallet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amountNum })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(data.goalCompleted ? " Goal Completed!" : " Deposit Added via Wallet!", { id: toastId });
      normalizeAndSetGoal(data.goal); 
      setIsWalletModalOpen(false);    
      setWalletAmount("");            
      fetchWalletBalance();            
    } catch (error) {
      toast.error(error.message || "Failed to process deposit", { id: toastId });
    } finally {
      setIsProcessingWallet(false);
    }
  };

  if (loading) return <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-emerald-600 w-10 h-10" /></div>;
  if (!goal) return <p className="min-h-[100dvh] flex items-center justify-center font-bold text-red-500 bg-slate-50">Goal not found</p>;

  // Data processing for Chart.js
  const sortedDeposits = [...goal.deposits].sort((a, b) => b.createdAt - a.createdAt);
  
  // ✅ Pagination Logic for Transactions
  const totalTxPages = Math.max(1, Math.ceil(sortedDeposits.length / TX_PER_PAGE));
  const paginatedDeposits = sortedDeposits.slice((txPage - 1) * TX_PER_PAGE, txPage * TX_PER_PAGE);

  const chartPoints = [
      { date: new Date(goal.createdAt).toLocaleDateString('en-GB'), amount: 0 }, 
      ...sortedDeposits.map((d) => ({ date: d.createdAt.toLocaleDateString('en-GB'), amount: d.amount })).reverse()
  ];
  const cumulativeData = chartPoints.map((p, i, arr) => arr.slice(0, i + 1).reduce((sum, c) => sum + c.amount, 0));
  
  const chartData = { 
    labels: chartPoints.map((p) => p.date), 
    datasets: [{ 
      label: "Total Saved", 
      data: cumulativeData, 
      fill: true, 
      backgroundColor: "rgba(16,185,129,0.1)", 
      borderColor: "rgba(5,150,105,1)", 
      tension: 0.3 
    }] 
  };
  
  const userName = user ? (user.fullName || user.firstName) : "Valued User";
  
  const isGoalCompleted = goal.status === "COMPLETED" || goal.status === "REDEEMED";
  const isRedeemed = goal.status === "REDEEMED" || !!goal.delivery;
  const remainingTarget = Math.max(0, goal.targetAmount - goal.saved);

  return (
    <div className="min-h-[100dvh] bg-slate-50 py-8 sm:py-12">
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl relative">
        {selectedInvoice && <InvoiceModal transaction={selectedInvoice} product={goal.product} onClose={() => setSelectedInvoice(null)} userName={userName} />}
        {successMessage && <div className="mb-5 sm:mb-6 bg-green-50 text-green-700 p-3 sm:p-4 rounded-xl border border-green-200 text-sm sm:text-base font-medium shadow-sm flex items-center gap-2">{successMessage}</div>}

        {isGoalCompleted && !isRedeemed && (
          <div className="mb-5 sm:mb-6 bg-green-100 text-green-800 p-4 rounded-xl font-bold border border-green-200 flex items-center gap-2.5 shadow-sm text-sm sm:text-base">
            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" /> 🎉 Goal completed! Please redeem your product.
          </div>
        )}
        {isRedeemed && (
           <div className="mb-5 sm:mb-6 bg-blue-50 text-blue-800 p-4 rounded-xl font-bold border border-blue-200 flex items-center gap-2.5 shadow-sm text-sm sm:text-base">
              <Truck className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" /> <span className="truncate">Product Redeemed! ID: {goal.delivery?.trackingNumber || "Pending"}</span>
           </div>
        )}

        <h1 className="text-2xl sm:text-3xl font-extrabold mb-4 sm:mb-6 text-slate-900 leading-tight truncate px-1" title={goal.product?.name || "Savings Goal"}>{goal.product?.name || "Savings Goal"}</h1>
        <GoalCard goal={goal} />

        <div className="mt-6 sm:mt-8 bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200">
          <h2 className="text-lg sm:text-xl font-bold mb-3 text-slate-800">Progress Tracking</h2>
          <div className="w-full bg-slate-100 rounded-full h-6 sm:h-8 overflow-hidden relative shadow-inner border border-slate-200">
            <div className="h-full flex items-center justify-center text-white text-[10px] sm:text-xs font-bold bg-gradient-to-r from-emerald-500 to-green-600 transition-all duration-700 shadow-md" style={{ width: `${Math.min(goal.progressPercent, 100)}%` }}>
              {goal.progressPercent > 10 && `${Math.min(Math.round(goal.progressPercent), 100)}%`}
            </div>
          </div>
          <div className="flex justify-between mt-3 text-xs sm:text-sm text-slate-500 font-bold uppercase tracking-wider">
            <span>Saved: {goal.currency || "Rs"} {goal.saved.toLocaleString()}</span>
            <span>Target: {goal.currency || "Rs"} {goal.targetAmount.toLocaleString()}</span>
          </div>
        </div>

        <div className="mt-6 sm:mt-8 p-5 sm:p-6 bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <h2 className="text-lg sm:text-xl font-bold mb-4 text-slate-800">Savings Growth</h2>
          <div className="h-64 sm:h-80 w-full"><Line data={chartData} options={{ maintainAspectRatio: false, responsive: true }} /></div>
        </div>

        <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          
          <button
            disabled={savingDeposit || isGoalCompleted}
            onClick={() => router.push(`/goals/${goalId}/deposit`)}
            className={`w-full py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base transition-all flex justify-center items-center gap-2 active:scale-[0.98] disabled:active:scale-100 ${savingDeposit || isGoalCompleted ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none" : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20"}`}
          >
            {savingDeposit ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : isGoalCompleted ? "Goal Completed" : "Deposit via Stripe"}
          </button>

          <button
            disabled={savingDeposit || isGoalCompleted}
            onClick={() => setIsWalletModalOpen(true)}
            className={`w-full py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:active:scale-100 ${savingDeposit || isGoalCompleted ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200" : "bg-white text-emerald-700 border-2 border-emerald-600 hover:bg-emerald-50 shadow-sm"}`}
          >
            <Wallet className="w-5 h-5" />
            Pay with Wallet
          </button>

          {!isRedeemed && isGoalCompleted ? (
              <div className="w-full">
                  <RedeemAction 
                      goal={goal} 
                      addresses={addresses}
                      setAddresses={setAddresses}
                      onSuccess={fetchGoal} 
                  />
              </div>
          ) : isRedeemed ? (
              <button disabled className="w-full py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-white bg-indigo-300 cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base">
                  <Gift className="w-5 h-5" /> Product Redeemed
              </button>
          ) : null}

          {isRedeemed && goal.delivery && (
              <button
                  onClick={() => router.push(`/tracking/${goal.delivery.id}`)}
                  className="w-full py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 animate-in fade-in active:scale-[0.98] text-sm sm:text-base"
              >
                  <Truck className="w-5 h-5" />
                  Track Delivery
              </button>
          )}

          <button onClick={() => generateReportPDF(sortedDeposits, goal.product?.name)} className="w-full py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 flex items-center justify-center gap-2 transition-colors active:scale-[0.98] text-sm sm:text-base">
            <FileBarChart className="w-5 h-5" /> Monthly Report
          </button>
        </div>

        {goal.deposits.length > 0 && (
          <div className="mt-8 sm:mt-10 bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100">
            <h2 className="text-lg sm:text-2xl font-bold mb-4 sm:mb-6 text-slate-900 px-1">Recent Transactions</h2>
            
            <ul className="space-y-3 sm:space-y-4">
              {/* ✅ Mapping over paginatedDeposits instead of all deposits */}
              {paginatedDeposits.map((d) => (
                <li key={d.id} className="p-4 sm:p-5 border border-slate-200 rounded-xl sm:rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between bg-white hover:bg-slate-50 transition-colors shadow-sm gap-3 sm:gap-0">
                  <div className="min-w-0">
                    <span className="text-slate-900 font-bold text-sm sm:text-base block truncate">{d.paymentMethod === "WALLET" ? "Wallet Deposit" : "Deposit"}</span>
                    <span className="text-slate-500 text-xs sm:text-sm mt-1 block">{new Date(d.createdAt).toLocaleDateString('en-GB')} {new Date(d.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 border-t border-slate-100 pt-3 sm:pt-0 sm:border-t-0">
                    <span className="font-black font-mono text-emerald-600 text-lg sm:text-xl">+ {d.amount.toLocaleString()}</span>
                    <button onClick={() => setSelectedInvoice(d)} className="px-3 sm:px-4 py-2 border border-slate-200 rounded-lg sm:rounded-xl hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 hover:border-emerald-200 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all shadow-sm">
                      <FileText className="w-4 h-4" /> <span className="hidden sm:inline">Invoice</span>
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {/* ✅ Transaction Pagination Controls */}
            {totalTxPages > 1 && (
              <div className="flex items-center justify-between mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-slate-100">
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Page {txPage} of {totalTxPages}
                </span>
                <div className="flex gap-1.5 sm:gap-2">
                  <button 
                    onClick={() => setTxPage(p => Math.max(1, p - 1))} 
                    disabled={txPage === 1} 
                    className="p-1.5 sm:p-2 border border-slate-200 rounded-lg sm:rounded-xl bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors text-slate-600 shadow-sm"
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-[18px] sm:h-[18px]"/>
                  </button>
                  <button 
                    onClick={() => setTxPage(p => Math.min(totalTxPages, p + 1))} 
                    disabled={txPage === totalTxPages} 
                    className="p-1.5 sm:p-2 border border-slate-200 rounded-lg sm:rounded-xl bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors text-slate-600 shadow-sm"
                  >
                    <ChevronRight className="w-4 h-4 sm:w-[18px] sm:h-[18px]"/>
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* WALLET DEPOSIT MODAL */}
        {isWalletModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl sm:rounded-3xl w-[95%] sm:w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]">
              <div className="flex justify-between items-center p-4 sm:p-5 border-b border-gray-100 shrink-0 bg-emerald-50/50">
                <h3 className="font-bold text-lg sm:text-xl text-gray-900 flex items-center gap-2">
                  <Wallet className="text-emerald-600 w-5 h-5 sm:w-6 sm:h-6" /> Pay with Wallet
                </h3>
                <button onClick={() => setIsWalletModalOpen(false)} className="text-gray-400 hover:text-red-500 bg-white border border-gray-200 shadow-sm p-1.5 sm:p-2 rounded-full transition-colors"><X className="w-4 h-4 sm:w-[18px] sm:h-[18px]" /></button>
              </div>
              
              <div className="overflow-y-auto custom-scrollbar p-4 sm:p-6 shrink">
                <form onSubmit={handleWalletDepositSubmit} className="space-y-4 sm:space-y-5">
                  
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200 gap-1 sm:gap-0">
                    <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Remaining Target:</span>
                    <span className="font-black font-mono text-base sm:text-lg text-slate-900">Rs {remainingTarget.toLocaleString()}</span>
                  </div>

                  <div className={`p-3 sm:p-4 rounded-xl border flex flex-col sm:flex-row justify-between sm:items-center gap-1 sm:gap-0 ${walletBalance > 0 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Available Wallet Balance:</span>
                    <span className="font-black font-mono text-base sm:text-lg">Rs {walletBalance.toLocaleString()}</span>
                  </div>

                  <div>
                    <label className="block text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Amount to Deposit (Rs)</label>
                    <input 
                      type="number" 
                      required
                      min="1"
                      max={Math.min(walletBalance, remainingTarget)}
                      value={walletAmount}
                      onChange={(e) => setWalletAmount(e.target.value)}
                      placeholder={`Max: Rs ${Math.min(walletBalance, remainingTarget).toLocaleString()}`}
                      className="w-full border border-gray-300 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-sm sm:text-base transition-shadow bg-slate-50 focus:bg-white"
                    />
                  </div>

                  <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                    <button type="button" onClick={() => setIsWalletModalOpen(false)} className="w-full sm:flex-1 py-2.5 sm:py-3 bg-white border border-gray-200 text-gray-700 font-bold text-sm rounded-xl sm:rounded-2xl hover:bg-gray-50 transition-colors shadow-sm order-2 sm:order-1">Cancel</button>
                    <button 
                      type="submit" 
                      disabled={isProcessingWallet || walletBalance <= 0 || !walletAmount || Number(walletAmount) > remainingTarget || Number(walletAmount) > walletBalance} 
                      className="w-full sm:flex-[1.5] py-2.5 sm:py-3 bg-emerald-600 text-white font-bold text-sm rounded-xl sm:rounded-2xl hover:bg-emerald-700 transition-all flex justify-center items-center gap-2 disabled:opacity-50 shadow-md shadow-emerald-600/20 active:scale-[0.98] disabled:active:scale-100 order-1 sm:order-2"
                    >
                      {isProcessingWallet ? <Loader2 size={18} className="animate-spin shrink-0" /> : "Confirm Payment"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}