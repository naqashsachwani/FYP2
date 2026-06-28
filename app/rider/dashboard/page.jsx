"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Wallet, PackageCheck, Clock, Truck, RefreshCcw, Download } from "lucide-react";
import toast from "react-hot-toast";
import dynamic from "next/dynamic";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const RevenueLineChart = dynamic(() => import("@/components/charts/RevenueLineChart"), {
  ssr: false,
  loading: () => (
      <div className="w-full h-[250px] sm:h-[300px] lg:h-[350px] animate-pulse rounded-2xl bg-slate-100 mt-4 sm:mt-6" />
  ),
});

export default function RiderDashboard() {
  const router = useRouter();
  const currency = "Rs";

  const [profile, setProfile] = useState(null); 
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [payouts, setPayouts] = useState([]); 
  const [loading, setLoading] = useState(true);

  // Helper function to format date as D/M/YYYY (e.g., 29/6/2026)
  const formatDate = (dateInput) => {
    const d = new Date(dateInput);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  const processChartData = (payouts = []) => {
      const data = [];
      const today = new Date();
      
      for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(today.getDate() - i);
          
          const comparisonDate = d.toLocaleDateString();
          const label = d.toLocaleDateString('en-US', { weekday: 'short' }); 
          
          const dailyPayouts = payouts.filter(p => {
              if (p.type !== 'EARNING' || !p.createdAt) return false;
              const pDate = new Date(p.createdAt).toLocaleDateString();
              return pDate === comparisonDate;
          });

          const dailyRevenue = dailyPayouts.reduce((acc, curr) => acc + curr.amount, 0);
          
          data.push({
              name: label,
              revenue: dailyRevenue
          });
      }
      return data;
  }

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/rider/dashboard");
      if (res.status === 403) return router.push("/rider/rider-signup"); 
      const data = await res.json();
      
      setProfile(data.profile); 
      setStats(data.stats);
      setPayouts(data.payouts || []);
      setChartData(processChartData(data.payouts || []));
    } catch (error) {
      toast.error("Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  const handleRefresh = () => {
      fetchDashboardData();
  }

  // --- PDF GENERATION LOGIC ---
  const handleDownloadPDF = () => {
    if (!profile || payouts.length === 0) {
      return toast.error("Not enough data to generate report.");
    }

    const doc = new jsPDF();
    
    // Use the custom date formatter
    const generatedDate = formatDate(new Date());

    // 1. Header
    doc.setFontSize(22);
    doc.setTextColor(37, 99, 235); // Blue-600
    doc.text("DreamSaver", 14, 22);
    
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42); // Slate-900
    doc.text("Rider Financial Report", 14, 30);

    // 2. Report Details
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Date Generated: ${generatedDate}`, 14, 40);

    // 3. Financial Summary
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("Account Summary", 14, 52); 
    
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`Total Lifetime Earnings: Rs ${profile?.totalEarnings?.toLocaleString() || 0}`, 14, 60);
    doc.text(`Available Wallet Balance: Rs ${profile?.walletBalance?.toLocaleString() || 0}`, 14, 66);
    doc.text(`Total Completed Deliveries: ${stats?.completedDeliveries || 0}`, 14, 72);

    // 4. Ledger Table
    const tableColumn = ["Date", "Description", "Transaction", "Status", "Amount (Rs)"];
    const tableRows = [];

    const sortedPayouts = [...payouts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    sortedPayouts.forEach(tx => {
      const txData = [
        formatDate(tx.createdAt), // Use the custom date formatter here too
        tx.description || (tx.type === 'EARNING' ? 'Delivery Payout' : 'Bank Withdrawal'),
        tx.type === 'EARNING' ? 'Credit (+)' : 'Debit (-)',
        tx.status,
        tx.amount.toLocaleString()
      ];
      tableRows.push(txData);
    });

    autoTable(doc, {
      startY: 82, 
      head: [tableColumn],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    // 5. Save PDF
    doc.save(`Rider_Financial_Report_${generatedDate.replace(/\//g, '-')}.pdf`);
    toast.success("Report downloaded successfully!");
  };

  if (loading && !profile) return <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600 w-10 h-10" /></div>;

  return (
    <div className="bg-white rounded-t-2xl sm:rounded-tl-3xl shadow-sm border-l border-t border-slate-200 min-h-[100dvh] lg:min-h-[calc(100vh-80px)] p-4 sm:p-6 lg:p-10 w-full overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 lg:space-y-10">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 sm:border-none pb-4 sm:pb-0">
            <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
                    Rider <span className="text-blue-600">Dashboard</span>
                </h1>
                <p className="text-slate-500 mt-1 sm:mt-2 text-xs sm:text-sm lg:text-base">
                    Track your earnings, active deliveries, and performance.
                </p>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0 mt-2 sm:mt-0">
                <button 
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-blue-600 text-white rounded-lg sm:rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-sm shadow-blue-500/20 text-xs sm:text-sm font-semibold"
                >
                    <Download size={16} className="sm:w-[18px] sm:h-[18px]" />
                    <span>Download Report</span>
                </button>
                <button 
                    onClick={handleRefresh} 
                    disabled={loading}
                    className="p-2 sm:p-2.5 border border-slate-200 bg-white rounded-lg sm:rounded-xl hover:bg-slate-50 shadow-sm transition-colors text-slate-600 shrink-0"
                    title="Refresh Dashboard"
                >
                    <RefreshCcw size={16} className={`sm:w-[18px] sm:h-[18px] ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 w-full">
            
            <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:border-blue-300 transition-colors h-full flex flex-col justify-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3 sm:mb-4">
                    <Wallet className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Earning</p>
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 truncate">Rs {profile?.walletBalance?.toLocaleString() || 0}</h3>
                <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-500 to-indigo-600 opacity-[0.08] rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
            </div>

            <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:border-blue-300 transition-colors h-full flex flex-col justify-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3 sm:mb-4">
                    <PackageCheck className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Completed</p>
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">{stats?.completedDeliveries || 0}</h3>
                <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-500 to-indigo-600 opacity-[0.08] rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
            </div>

            <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:border-purple-300 transition-colors h-full flex flex-col justify-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mb-3 sm:mb-4">
                    <Truck className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Active Jobs</p>
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">{stats?.activeDeliveriesCount || 0}</h3>
                <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-purple-500 to-fuchsia-600 opacity-[0.08] rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
            </div>

            <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:border-orange-300 transition-colors h-full flex flex-col justify-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center mb-3 sm:mb-4">
                    <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">New Requests</p>
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">{stats?.pendingDeliveries || 0}</h3>
                <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-orange-400 to-red-500 opacity-[0.08] rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
            </div>

        </div>

        <div className="mt-6 sm:mt-8 pt-2 sm:pt-4 w-full overflow-hidden">
            <RevenueLineChart
                chartData={chartData}
                currency={currency}
                title="Daily Earnings"
                subtitle="Your delivery payouts over the last 7 days"
            />
        </div>

      </div>
    </div>
  );
}