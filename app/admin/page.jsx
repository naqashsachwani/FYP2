// Designates this as a Next.js Client Component, allowing the use of React hooks and browser APIs.
'use client'

// --- Imports ---
import { useEffect, useState } from "react"
// Clerk authentication hook for secure API requests
import { useAuth } from "@clerk/nextjs"
// Axios for making HTTP requests
import axios from "axios"
// Libraries for generating PDF reports on the client side
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
// Toast notifications
import { toast } from "react-hot-toast"
// Scalable SVG icons for the UI
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
  TrendingUp 
} from "lucide-react"
// Recharts library for rendering the dynamic line chart
import {
  LineChart, 
  Line,    
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export default function AdminDashboard() {
  // Extract the getToken function from Clerk to securely authenticate API calls
  const { getToken } = useAuth()
  // Pull currency symbol from environment variables, defaulting to 'Rs'
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || 'Rs'

  // --- State Management ---
  // Controls the main page loading spinner
  const [loading, setLoading] = useState(true)
  
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
  
  // Stores the processed data formatted specifically for the Recharts library
  const [chartData, setChartData] = useState([])

  // Helper function to format numbers as currency strings (e.g., Rs 1,000)
  const formatCurrency = (amount) => {
    return `${currency} ${amount.toLocaleString()}`;
  };

  // --- CHART LOGIC: Last 7 Days Revenue ---
  // Takes the raw orders array and groups them by day for the line chart
  const processChartData = (orders) => {
    const data = [];
    const today = new Date();
    
    // Loop backwards 7 days, starting from 6 days ago up to today (0)
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        
        // Format dates using 'en-GB' for strict DD/MM/YYYY comparison
        const comparisonDate = d.toLocaleDateString('en-GB');
        // Create a short label for the X-axis (e.g., "Mon", "Tue")
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

  // --- API: Fetch Data ---
  // Asynchronous function to retrieve dashboard statistics from the backend
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const token = await getToken()
      
      // ✅ Cache-busting: Appending Date.now() ensures Next.js/Browser doesn't serve a stale cached response
      const { data } = await axios.get(`/api/admin/dashboard?_t=${Date.now()}`, {
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

  // Trigger the fetch function exactly once when the component mounts
  useEffect(() => {
    fetchDashboardData()
  }, [])

  // --- REPORT GENERATION ---
  // Function to generate and download a PDF executive report using jsPDF
  const GenerateReport = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const today = new Date();
    const brandColor = [15, 23, 42]; // Slate-900 color for headers
    
    // PDF Header Formatting
    doc.setFillColor(...brandColor);
    doc.rect(0, 0, pageWidth, 40, 'F'); // Draw a solid rectangle across the top
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255); // White text
    doc.setFont("helvetica", "bold");
    doc.text("DREAMSAVER", 14, 20);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Executive Performance Report", 14, 28);
    doc.setFontSize(10);
    // Updated to use 'en-GB' for DD/MM/YYYY formatting
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
        doc.roundedRect(x, yPos, cardWidth, 25, 3, 3, 'F'); // Draw card background
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(stat.label, x + 5, yPos + 8); // Draw label
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text(stat.value, x + 5, yPos + 18); // Draw value
    });

    // Section 2: Data Table using autoTable plugin
    yPos += 45;
    doc.setFontSize(14);
    doc.setTextColor(...brandColor);
    doc.text("2. Recent Transactions", 14, yPos);

    // Map the first 15 raw orders into a 2D array required by autoTable
    const auditRows = dashboardData.allOrders.slice(0, 15).map(order => [
        order.id ? order.id.substring(0, 8) : 'ERR',
        // Updated to use 'en-GB' for DD/MM/YYYY formatting
        new Date(order.createdAt).toLocaleDateString('en-GB'),
        order.customer || 'Guest',
        formatCurrency(order.total || 0), // This shows Platform Fee for Admin
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

    // Prompt the user to save the generated PDF file
    doc.save(`DreamSaver_Audit_${today.toISOString().split('T')[0]}.pdf`);
  }

  // --- Configuration Arrays for UI Mapping ---
  // Array of top-level metrics mapped to CSS classes for easy rendering
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

  // Render Guard: Display a full-page spinner if data is loading and revenue hasn't been set yet
  if (loading && dashboardData.revenue === 0) return <div className="flex items-center justify-center min-h-[70vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  // --- Main Render ---
  return (
    <div className="relative min-h-[85vh] w-full bg-slate-50/50">
      <div className="max-w-7xl mx-auto space-y-8 mb-24 px-4 sm:px-6 lg:px-8 py-8">
        
        {/* ================= HEADER ================= */}
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
            {/* Generate PDF Report Button */}
            <button onClick={GenerateReport} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-full shadow-lg hover:bg-slate-800 transition-all">
                <Download size={16} /> <span className="text-sm font-medium">Download Report</span>
            </button>
          </div>
        </div>

        {/* ================= MAIN STATS CARDS ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Map over the mainStats configuration array to generate 4 identical cards */}
          {mainStats.map((card, index) => (
            <div key={index} className="group relative bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
              {/* Decorative background hover effect */}
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${card.gradient} opacity-10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-150 duration-500`} />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  {/* Dynamic Icon */}
                  <div className={`p-3 rounded-2xl ${card.bgLight} ${card.textColor}`}><card.icon size={24} /></div>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-500 text-sm font-medium uppercase">{card.title}</p>
                  {/* Dynamic Value */}
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
            {/* Map over the orderStatusStats array to generate 3 secondary cards */}
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
        <div className="w-full bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><TrendingUp className="text-blue-600" size={24} /> Platform Revenue Analytics</h2>
                    <p className="text-sm text-slate-500">Earnings from fees (Last 7 Days)</p>
                </div>
            </div>
            {/* Height constraint required for ResponsiveContainer to work */}
            <div className="h-[350px] w-full">
                {/* Recharts Wrapper: Adapts chart to screen width */}
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        {/* X-Axis maps to the 'name' key (e.g. "Mon", "Tue") */}
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                        {/* Y-Axis automatically scales and applies currency formatting */}
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(value) => `${currency}${value}`} />
                        {/* Custom Tooltip styling when hovering over data points */}
                        <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} itemStyle={{ color: '#1e293b', fontWeight: 600 }} formatter={(value) => [`${currency}${value}`, "Revenue"]} />
                        {/* The actual line plotting the 'revenue' dataKey */}
                        <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: "#4f46e5", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6, strokeWidth: 0, fill: "#4f46e5" }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>

      </div>
    </div>
  )
}