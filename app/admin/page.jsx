'use client'

import { useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
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
  TrendingUp // Added icon
} from "lucide-react"
import {
  LineChart, // Changed from AreaChart
  Line,      // Changed from Area
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export default function AdminDashboard() {
  const { getToken } = useAuth()
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || 'Rs'

  const [loading, setLoading] = useState(true)
  
  const [dashboardData, setDashboardData] = useState({
    products: 0,
    revenue: 0,
    orders: 0,
    stores: 0,
    refundPending: 0,
    orderCancelled: 0,
    refundApproved: 0,
    allOrders: [],
  })
  
  const [chartData, setChartData] = useState([])

  const formatCurrency = (amount) => {
    return `${currency} ${amount.toLocaleString()}`;
  };

  // --- CHART LOGIC: Last 7 Days Revenue ---
  const processChartData = (orders) => {
    const data = [];
    const today = new Date();
    
    // Loop backwards 7 days
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        
        const comparisonDate = d.toLocaleDateString();
        const label = d.toLocaleDateString('en-US', { weekday: 'short' }); 
        
        // Filter transactions for this day
        const daysTransactions = orders.filter(o => {
            if (!o.createdAt) return false;
            return new Date(o.createdAt).toLocaleDateString() === comparisonDate;
        });

        // Sum Platform Fees
        const dailyRevenue = daysTransactions.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
        
        data.push({
            name: label,
            revenue: dailyRevenue
        });
    }
    return data;
  }

  // --- API: Fetch Data ---
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const token = await getToken()
      const { data } = await axios.get('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      })
      
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

      setDashboardData(safeData)
      setChartData(processChartData(safeData.allOrders))
      
    } catch (error) {
      console.error(error)
      toast.error("Failed to load dashboard data.")
    } finally {
      setLoading(false)
    }
  }

  // --- REPORT GENERATION ---
  const GenerateReport = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const today = new Date();
    const brandColor = [15, 23, 42]; 
    
    // Header
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
    doc.text(`Date: ${today.toLocaleDateString()}`, pageWidth - 14, 24, { align: 'right' });

    // Stats
    let yPos = 55;
    doc.setFontSize(14);
    doc.setTextColor(...brandColor);
    doc.text("1. Performance Overview", 14, yPos);
    
    const stats = [
        { label: "Total Revenue", value: formatCurrency(dashboardData.revenue) },
        { label: "Active Stores", value: dashboardData.stores.toString() },
        { label: "Total Orders", value: dashboardData.orders.toString() },
        { label: "Products", value: dashboardData.products.toString() }
    ];

    const cardWidth = 45;
    const startX = 14;
    yPos += 10;

    stats.forEach((stat, index) => {
        const x = startX + (index * (cardWidth + 5));
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(x, yPos, cardWidth, 25, 3, 3, 'F');
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(stat.label, x + 5, yPos + 8);
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text(stat.value, x + 5, yPos + 18);
    });

    // Table
    yPos += 45;
    doc.setFontSize(14);
    doc.setTextColor(...brandColor);
    doc.text("2. Recent Transactions", 14, yPos);

    const auditRows = dashboardData.allOrders.slice(0, 15).map(order => [
        order.id ? order.id.substring(0, 8) : 'ERR',
        new Date(order.createdAt).toLocaleDateString(),
        order.customer || 'Guest',
        formatCurrency(order.total || 0), // This shows Fee for Admin
        order.status
    ]);

    autoTable(doc, {
        startY: yPos + 5,
        head: [['Ref ID', 'Date', 'User', 'Platform Fee', 'Status']],
        body: auditRows,
        theme: 'grid',
        headStyles: { fillColor: brandColor },
    });

    doc.save(`DreamSaver_Audit_${today.toISOString().split('T')[0]}.pdf`);
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

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

  const orderStatusStats = [
    { title: 'Refund Pending', value: dashboardData.refundPending, icon: RefreshCcw, gradient: 'from-amber-400 to-orange-500', bgLight: 'bg-amber-50/50', textColor: 'text-amber-600' },
    { title: 'Goal Cancelled', value: dashboardData.orderCancelled, icon: XCircle, gradient: 'from-red-500 to-rose-600', bgLight: 'bg-red-50/50', textColor: 'text-red-600' },
    { title: 'Refund Approved', value: dashboardData.refundApproved, icon: CheckCircle, gradient: 'from-lime-500 to-green-600', bgLight: 'bg-lime-50/50', textColor: 'text-lime-600' },
  ]

  if (loading && dashboardData.revenue === 0) return <div className="flex items-center justify-center min-h-[70vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="relative min-h-[85vh] w-full bg-slate-50/50">
      <div className="max-w-7xl mx-auto space-y-8 mb-24 px-4 sm:px-6 lg:px-8 py-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Admin <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">Dashboard</span>
            </h1>
            <p className="text-slate-500 text-sm sm:text-base">System overview and financial performance.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button onClick={fetchDashboardData} disabled={loading} className={`p-2 rounded-full border shadow-sm transition-all ${loading ? "bg-gray-100" : "bg-white hover:bg-gray-50"}`}>
                <RotateCcw size={20} className={`text-slate-600 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button onClick={GenerateReport} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-full shadow-lg hover:bg-slate-800 transition-all">
                <Download size={16} /> <span className="text-sm font-medium">Download Report</span>
            </button>
          </div>
        </div>

        {/* MAIN STATS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

        {/* STATUS GRID */}
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

        {/* CHART SECTION (LINE CHART) */}
        <div className="w-full bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><TrendingUp className="text-blue-600" size={24} /> Platform Revenue Analytics</h2>
                    <p className="text-sm text-slate-500">Earnings from fees (Last 7 Days)</p>
                </div>
            </div>
            <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(value) => `${currency}${value}`} />
                        <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} itemStyle={{ color: '#1e293b', fontWeight: 600 }} formatter={(value) => [`${currency}${value}`, "Revenue"]} />
                        <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: "#4f46e5", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6, strokeWidth: 0, fill: "#4f46e5" }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>

      </div>
    </div>
  )
}