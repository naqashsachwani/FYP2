'use client'

import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import dynamic from "next/dynamic"
import { toast } from "react-hot-toast"
import {
  CircleDollarSignIcon,
  ShoppingBasketIcon,
  StoreIcon,
  TagsIcon,
  RefreshCcw,
  XCircle,
  CheckCircle,
  Download,
  RotateCcw,
} from "lucide-react"

const RevenueLineChart = dynamic(() => import("@/components/charts/RevenueLineChart"), {
  ssr: false,
  loading: () => (
    <div className="w-full bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
      <div className="h-[350px] w-full animate-pulse rounded-2xl bg-slate-100" />
    </div>
  ),
})

export default function AdminDashboard() {
  const { getToken } = useAuth()
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || 'Rs'

  const [loading, setLoading] = useState(true)
  const [reportLoading, setReportLoading] = useState(false)
  
  // Object storing all the key metrics fetched from the backend
  const [dashboardData, setDashboardData] = useState({
    products: 0,
    revenue: 0,
    orders: 0,
    stores: 0,
    refundPending: 0,
    orderCancelled: 0,
    refundApproved: 0,
    allOrders: [], // Raw array of orders used for charts and PDF generation
  })
  
  const [chartData, setChartData] = useState([])

  // Helper function to format numbers as currency strings (e.g., Rs 1,000)
  const formatCurrency = (amount) => {
    return `${currency} ${amount.toLocaleString()}`;
  };

  // --- CHART LOGIC: Last 7 Days Revenue ---
  const processChartData = (orders) => {
    const data = [];
    const today = new Date();
    
    // Loop backwards 7 days, starting from 6 days ago up to today (0)
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        
        const comparisonDate = d.toLocaleDateString('en-GB');
        const label = d.toLocaleDateString('en-US', { weekday: 'short' }); 
        
        // Filter the raw orders array to find transactions matching this specific loop day
        const daysTransactions = orders.filter(o => {
            if (!o.createdAt) return false;
            return new Date(o.createdAt).toLocaleDateString('en-GB') === comparisonDate;
        });

        // Sum the 'total' field (which represents Admin Platform Fees) for all transactions on this day
        const dailyRevenue = daysTransactions.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
        
        // Push the formatted object into the chart data array
        data.push({
            name: label,
            revenue: dailyRevenue
        });
    }
    return data;
  }

  // function to retrieve dashboard statistics from the backend
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = await getToken()
      
      const { data } = await axios.get('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      // Map the backend response to a safe object, providing fallbacks (0 or []) if data is missing
      const safeData = {
        products: data.dashboardData.products || 0,
        revenue: data.dashboardData.revenue || 0,
        orders: data.dashboardData.orders || 0,
        stores: data.dashboardData.stores || 0,
        refundPending: data.dashboardData.refundPending || 0,
        orderCancelled: data.dashboardData.orderCancelled || 0,
        refundApproved: data.dashboardData.refundApproved || 0,
        allOrders: data.dashboardData.allOrders || [],
      }

      // Update state with the safe data
      setDashboardData(safeData)
      // Process the raw orders immediately and update the chart state
      setChartData(processChartData(safeData.allOrders))
      
    } catch (error) {
      console.error(error)
      toast.error("Failed to load dashboard data.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // --- REPORT GENERATION ---
  // Function to generate and download a PDF executive report using jsPDF
  const GenerateReport = async () => {
    try {
      setReportLoading(true)
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
      ])

      const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const today = new Date();
    const brandColor = [15, 23, 42]; 
    
    // PDF Header Formatting
    doc.setFillColor(...brandColor);
    doc.rect(0, 0, pageWidth, 40, 'F'); 
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255); 
    doc.setFont("helvetica", "bold");
    doc.text("DREAMSAVER", 14, 20);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Executive Performance Report", 14, 28);
    doc.setFontSize(10);
    doc.text(`Date: ${today.toLocaleDateString('en-GB')}`, pageWidth - 14, 24, { align: 'right' });

    // Section 1: Stats Overview
    let yPos = 55;
    doc.setFontSize(14);
    doc.setTextColor(...brandColor);
    doc.text("1. Performance Overview", 14, yPos);
    
    // Array of key metrics to draw in the PDF
    const stats = [
        { label: "Total Revenue", value: formatCurrency(dashboardData.revenue) },
        { label: "Active Stores", value: dashboardData.stores.toString() },
        { label: "Total Orders", value: dashboardData.orders.toString() },
        { label: "Products", value: dashboardData.products.toString() }
    ];

    const cardWidth = 45;
    const startX = 14;
    yPos += 10;

    // Loop through the stats array to draw "cards" in the PDF
    stats.forEach((stat, index) => {
        const x = startX + (index * (cardWidth + 5)); // Calculate horizontal position
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(x, yPos, cardWidth, 25, 3, 3, 'F'); // card background
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(stat.label, x + 5, yPos + 8); 
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text(stat.value, x + 5, yPos + 18);
    });

    // Data Table using autoTable plugin
    yPos += 45;
    doc.setFontSize(14);
    doc.setTextColor(...brandColor);
    doc.text("2. Recent Transactions", 14, yPos);

    // Map the first 15 raw orders into a 2D array required by autoTable
    const auditRows = dashboardData.allOrders.slice(0, 15).map(order => [
        order.id ? order.id.substring(0, 8) : 'ERR',
        new Date(order.createdAt).toLocaleDateString('en-GB'),
        order.customer || 'Guest',
        formatCurrency(order.total || 0), 
        order.status
    ]);

    // Generate the table
    autoTable(doc, {
        startY: yPos + 5,
        head: [['Ref ID', 'Date', 'User', 'Platform Fee', 'Status']],
        body: auditRows,
        theme: 'grid',
        headStyles: { fillColor: brandColor },
    });

    doc.save(`DreamSaver_Audit_${today.toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error(error)
      toast.error("Failed to generate report.")
    } finally {
      setReportLoading(false)
    }
  }

  // --- Configuration Arrays for UI Mapping ---
  const mainStats = [
    {
      title: 'Total Revenue',
      value: formatCurrency(dashboardData.revenue),
      icon: CircleDollarSignIcon,
      gradient: 'from-emerald-500 to-teal-600',
      bgLight: 'bg-emerald-50/50',
      textColor: 'text-emerald-600',
    },
    {
      title: 'Total Stores',
      value: dashboardData.stores,
      icon: StoreIcon,
      gradient: 'from-blue-500 to-indigo-600',
      bgLight: 'bg-blue-50/50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Total Orders',
      value: dashboardData.orders,
      icon: TagsIcon,
      gradient: 'from-violet-500 to-purple-600',
      bgLight: 'bg-violet-50/50',
      textColor: 'text-violet-600',
    },
    {
      title: 'Products',
      value: dashboardData.products,
      icon: ShoppingBasketIcon,
      gradient: 'from-orange-500 to-amber-600',
      bgLight: 'bg-orange-50/50',
      textColor: 'text-orange-600',
    },
  ]

  // Array of secondary metrics focused on refunds and cancellations
  const orderStatusStats = [
    { title: 'Refund Pending', value: dashboardData.refundPending, icon: RefreshCcw, gradient: 'from-amber-400 to-orange-500', bgLight: 'bg-amber-50/50', textColor: 'text-amber-600' },
    { title: 'Goal Cancelled', value: dashboardData.orderCancelled, icon: XCircle, gradient: 'from-red-500 to-rose-600', bgLight: 'bg-red-50/50', textColor: 'text-red-600' },
    { title: 'Refund Approved', value: dashboardData.refundApproved, icon: CheckCircle, gradient: 'from-lime-500 to-green-600', bgLight: 'bg-lime-50/50', textColor: 'text-lime-600' },
  ]

  // Display a full-page spinner if data is loading and revenue hasn't been set yet
  if (loading && dashboardData.revenue === 0) return <div className="flex items-center justify-center min-h-[70vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="relative min-h-[85vh] w-full bg-slate-50/50">
      <div className="max-w-7xl mx-auto space-y-8 mb-24 px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Admin <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">Dashboard</span>
            </h1>
            <p className="text-slate-500 text-sm sm:text-base">System overview and financial performance.</p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Refresh Data Button */}
            <button onClick={fetchDashboardData} disabled={loading} className={`p-2 rounded-full border shadow-sm transition-all ${loading ? "bg-gray-100" : "bg-white hover:bg-gray-50"}`}>
                <RotateCcw size={20} className={`text-slate-600 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button onClick={GenerateReport} disabled={reportLoading} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-full shadow-lg hover:bg-slate-800 transition-all disabled:opacity-70">
                <Download size={16} /> <span className="text-sm font-medium">Download Report</span>
            </button>
          </div>
        </div>

        {/* ================= MAIN STATS CARDS ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Map over the mainStats configuration array to generate 4 identical cards */}
          {mainStats.map((card, index) => (
            <div key={index} className="group relative bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${card.gradient} opacity-10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-150 duration-500`} />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-2xl ${card.bgLight} ${card.textColor}`}><card.icon size={24} /></div>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-500 text-sm font-medium uppercase">{card.title}</p>
                  <h3 className="text-3xl font-bold text-slate-900">{card.value}</h3>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ================= STATUS GRID ================= */}
        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-4 px-1">Order Status Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {orderStatusStats.map((card, index) => (
              <div key={index} className="group relative bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${card.bgLight} ${card.textColor} group-hover:scale-110 transition-transform`}><card.icon size={24} /></div>
                  <div><p className="text-slate-500 text-sm font-medium">{card.title}</p><h3 className="text-2xl font-bold text-slate-900">{card.value}</h3></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ================= CHART SECTION (LINE CHART) ================= */}
        <RevenueLineChart
          chartData={chartData}
          currency={currency}
          title="Platform Revenue Analytics"
          subtitle="Earnings from fees (Last 7 Days)"
        />

      </div>
    </div>
  )
}
