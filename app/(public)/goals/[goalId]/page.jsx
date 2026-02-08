"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Line } from "react-chartjs-2";
import "chart.js/auto";
import { FileText, X, Download, FileBarChart, Loader2, Truck, CheckCircle, Gift } from "lucide-react";
import GoalCard from "@/components/GoalCard";
import RedeemAction from "@/components/RedeemAction";
import { useUser } from "@clerk/nextjs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ================= JSPDF GENERATORS ================= */
const generateInvoicePDF = (transaction, product, userName) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a5" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const rightEdge = pageWidth - margin;

  doc.setTextColor(5, 150, 105);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", margin, 20);

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("DreamSaver Payment Receipt", margin, 26);

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin, 32, rightEdge, 32);

  const startY = 45;
  const lineHeight = 6;

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
  doc.text(`Date: ${new Date(transaction.createdAt).toLocaleDateString()}`, rightEdge, startY + (lineHeight * 2), { align: "right" });
  doc.text(`Time: ${new Date(transaction.createdAt).toLocaleTimeString()}`, rightEdge, startY + (lineHeight * 3) - 1, { align: "right" });

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

  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("Total Paid:", rightEdge - 40, finalY, { align: "right" });

  doc.setTextColor(5, 150, 105);
  doc.setFontSize(14);
  doc.text(`Rs ${transaction.amount.toLocaleString()}`, rightEdge, finalY, { align: "right" });

  doc.setDrawColor(226, 232, 240);
  doc.line(margin, pageHeight - 20, rightEdge, pageHeight - 20);
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.setFont("helvetica", "normal");
  doc.text("Thank you for using DreamSaver to achieve your goals.", pageWidth / 2, pageHeight - 14, { align: "center" });
  doc.text("This is a computer-generated receipt.", pageWidth / 2, pageHeight - 10, { align: "center" });

  doc.save(`Invoice_${transaction.receiptNumber?.slice(0, 8)}.pdf`);
};

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
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 32);

  const tableData = deposits.map(d => [
    new Date(d.createdAt).toLocaleDateString(),
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

/* ================= MODAL COMPONENT ================= */
const InvoiceModal = ({ transaction, product, onClose, userName }) => {
  if (!transaction) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition-colors z-10">
          <X className="w-5 h-5 text-slate-400" />
        </button>
        <div className="p-8 bg-white text-slate-800">
          <div className="text-center border-b border-slate-200 pb-6 mb-6">
            <h2 className="text-2xl font-bold uppercase tracking-widest text-emerald-700">INVOICE</h2>
            <p className="text-sm text-slate-500 mt-1">DreamSaver Payment Receipt</p>
          </div>
          <div className="flex justify-between items-start mb-8">
            <div className="text-sm">
              <p className="text-slate-500 font-medium mb-1">Billed To</p>
              <h4 className="font-bold text-slate-800 text-base">{userName}</h4>
              <p className="text-slate-500 font-medium mt-1">User ID:</p>
              <p className="text-slate-400 text-xs break-all max-w-[150px]">{transaction.userId}</p>
            </div>
            <div className="text-right text-sm">
              <p className="text-slate-500 font-medium mb-1">Receipt #</p>
              <p className="font-mono font-bold text-slate-800">{transaction.receiptNumber?.slice(0, 8) || "N/A"}</p>
              <div className="mt-4 text-slate-500">
                <p>{new Date(transaction.createdAt).toLocaleDateString()}</p>
                <p>{new Date(transaction.createdAt).toLocaleTimeString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-50 flex justify-between px-4 py-2 text-xs font-bold text-slate-500 uppercase mb-4 rounded-sm">
            <span>Description</span>
            <span>Amount</span>
          </div>
          <div className="flex justify-between items-start border-b border-slate-200 pb-4 mb-4 px-2">
            <div>
              <p className="font-bold text-base text-slate-900">{product?.name || "Deposit"}</p>
              <p className="text-xs text-slate-500 mt-1">Method: {transaction.paymentMethod}</p>
              <p className="text-xs text-slate-400 font-mono">ID: {transaction.id.slice(-8)}...</p>
            </div>
            <p className="font-bold text-base text-slate-900">Rs {transaction.amount.toLocaleString()}</p>
          </div>
          <div className="flex justify-between items-center px-2 pt-2">
            <span className="font-bold text-lg text-slate-900">Total Paid:</span>
            <span className="font-bold text-lg text-emerald-600">Rs {transaction.amount.toLocaleString()}</span>
          </div>
          <div className="text-center text-xs text-slate-400 mt-10 leading-relaxed">
            <p>Thank you for using DreamSaver.</p>
            <p>This is a computer-generated receipt.</p>
          </div>
        </div>
        <div className="p-4 bg-slate-50 border-t flex justify-end">
          <button onClick={() => generateInvoicePDF(transaction, product, userName)} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 font-medium transition-colors shadow-sm">
            <Download className="w-4 h-4" /> Download PDF
          </button>
        </div>
      </div>
    </div>
  );
};

/* ================= MAIN COMPONENT ================= */

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

  const normalizeAndSetGoal = (goalData) => {
    const deposits = (goalData.deposits || []).map((d) => ({
      ...d,
      amount: Number(d.amount),
      createdAt: new Date(d.createdAt),
    }));
    const calculatedSaved = deposits.reduce((sum, dep) => sum + dep.amount, 0);
    const dateString = goalData.endDate || goalData.targetDate;
    const validEndDate = dateString ? new Date(dateString) : null;

    const normalizedGoal = {
      ...goalData,
      targetAmount: Number(goalData.targetAmount),
      deposits: deposits,
      saved: calculatedSaved,
      endDate: validEndDate,
      // ✅ delivery will now be present thanks to the API fix
      delivery: goalData.delivery, 
      status: goalData.status
    };
    
    normalizedGoal.progressPercent = normalizedGoal.targetAmount > 0 ? (normalizedGoal.saved / normalizedGoal.targetAmount) * 100 : 0;
    setGoal(normalizedGoal);
  };

  useEffect(() => {
    fetchGoal();
    if (user) fetchAddresses();
  }, [goalId, user]);

  // Handle Stripe Success
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

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-emerald-600" /></div>;
  if (!goal) return <p className="p-4 text-red-500">Goal not found</p>;

  const sortedDeposits = [...goal.deposits].sort((a, b) => b.createdAt - a.createdAt);
  const chartPoints = [{ date: new Date(goal.createdAt).toLocaleDateString(), amount: 0 }, ...sortedDeposits.map((d) => ({ date: d.createdAt.toLocaleDateString(), amount: d.amount })).reverse()];
  const cumulativeData = chartPoints.map((p, i, arr) => arr.slice(0, i + 1).reduce((sum, c) => sum + c.amount, 0));
  const chartData = { labels: chartPoints.map((p) => p.date), datasets: [{ label: "Total Saved", data: cumulativeData, fill: true, backgroundColor: "rgba(16,185,129,0.1)", borderColor: "rgba(5,150,105,1)", tension: 0.3 }] };
  const userName = user ? (user.fullName || user.firstName) : "Valued User";
  
  // ✅ LOGIC
  const isGoalCompleted = goal.status === "COMPLETED" || goal.status === "REDEEMED";
  // ✅ Redemeed if status matches OR if delivery object exists
  const isRedeemed = goal.status === "REDEEMED" || !!goal.delivery;

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {selectedInvoice && <InvoiceModal transaction={selectedInvoice} product={goal.product} onClose={() => setSelectedInvoice(null)} userName={userName} />}
      {successMessage && <div className="mb-4 bg-green-50 text-green-700 p-3 rounded border border-green-200">{successMessage}</div>}

      {isGoalCompleted && !isRedeemed && (
        <div className="mb-4 bg-green-100 text-green-800 p-3 rounded font-semibold border border-green-200 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" /> 🎉 Goal completed! Please redeem your product.
        </div>
      )}
      {isRedeemed && (
         <div className="mb-4 bg-blue-50 text-blue-800 p-3 rounded font-semibold border border-blue-200 flex items-center gap-2">
            <Truck className="w-5 h-5" /> Product Redeemed! Shipment ID: {goal.delivery?.trackingNumber || "Pending"}
         </div>
      )}

      <h1 className="text-2xl font-bold mb-4">{goal.product?.name || "Savings Goal"}</h1>
      <GoalCard goal={goal} />

      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Progress</h2>
        <div className="w-full bg-slate-200 rounded-full h-6 overflow-hidden relative">
          <div className="h-6 flex items-center justify-center text-white text-xs font-bold bg-emerald-600 transition-all duration-700" style={{ width: `${Math.min(goal.progressPercent, 100)}%` }}>
            {goal.progressPercent > 10 && `${Math.min(Math.round(goal.progressPercent), 100)}%`}
          </div>
        </div>
        <div className="flex justify-between mt-2 text-sm text-slate-600 font-medium">
          <span>Saved: {goal.currency || "Rs"} {goal.saved.toLocaleString()}</span>
          <span>Target: {goal.currency || "Rs"} {goal.targetAmount.toLocaleString()}</span>
        </div>
      </div>

      <div className="mt-8 p-4 bg-white rounded-xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-semibold mb-4">Savings Growth</h2>
        <div className="h-64 sm:h-80"><Line data={chartData} options={{ maintainAspectRatio: false }} /></div>
      </div>

      {/* ✅✅✅ ACTION BUTTONS ✅✅✅ */}
      <div className="mt-6 flex flex-col sm:flex-row gap-4 flex-wrap">
        
        {/* 1. Deposit Button */}
        <button
          disabled={savingDeposit || isGoalCompleted}
          onClick={() => router.push(`/goals/${goalId}/deposit`)}
          className={`flex-1 sm:flex-none px-6 py-3 rounded-lg font-bold text-white shadow-md transition-all ${savingDeposit || isGoalCompleted ? "bg-slate-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}`}
        >
          {savingDeposit ? "Processing..." : isGoalCompleted ? "Goal Completed" : "Add Deposit via Stripe"}
        </button>

        {/* 2. Redeem Button (Active) or Disabled "Redeemed" Button */}
        {!isRedeemed && isGoalCompleted ? (
            <div className="flex-1 sm:flex-none">
                <RedeemAction 
                    goal={goal} 
                    addresses={addresses}
                    setAddresses={setAddresses}
                    onSuccess={fetchGoal} 
                />
            </div>
        ) : isRedeemed ? (
            <button disabled className="flex-1 sm:flex-none px-6 py-3 rounded-lg font-bold text-white bg-indigo-300 cursor-not-allowed flex items-center justify-center gap-2">
                <Gift className="w-5 h-5" /> Product Redeemed
            </button>
        ) : null}

        {/* 3. Track Button (Side-by-side with Disabled Redeem) */}
        {isRedeemed && goal.delivery && (
            <button
                onClick={() => router.push(`/tracking/${goal.delivery.id}`)}
                className="flex-1 sm:flex-none px-6 py-3 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all flex items-center justify-center gap-2 animate-in fade-in"
            >
                <Truck className="w-5 h-5" />
                Track Delivery
            </button>
        )}

        {/* 4. Report */}
        <button onClick={() => generateReportPDF(sortedDeposits, goal.product?.name)} className="flex-1 sm:flex-none px-6 py-3 rounded-lg font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 flex items-center justify-center gap-2">
          <FileBarChart className="w-5 h-5" /> Monthly Report
        </button>
      </div>

      {/* Transactions */}
      {goal.deposits.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4 text-slate-900">Recent Transactions</h2>
          <ul className="space-y-3">
            {sortedDeposits.map((d) => (
              <li key={d.id} className="p-5 border border-slate-200 rounded-xl flex items-center justify-between bg-white shadow-sm">
                <div>
                  <span className="text-slate-900 font-bold block">Deposit</span>
                  <span className="text-slate-500 text-sm">{d.createdAt.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-emerald-600 text-xl">+ {d.amount.toLocaleString()}</span>
                  <button onClick={() => setSelectedInvoice(d)} className="px-4 py-2 border rounded-lg hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 text-sm flex items-center gap-2 transition-all">
                    <FileText className="w-4 h-4" /> Invoice
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}