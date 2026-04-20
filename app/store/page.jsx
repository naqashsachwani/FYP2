// Designates this as a Next.js Client Component, allowing the use of React hooks and interactive state.
'use client'

// --- Imports ---
import Loading from "@/components/Loading" // Custom loading spinner component
import { useAuth } from "@clerk/nextjs" // Clerk authentication hook for secure API requests
import axios from "axios" // Library for making HTTP requests
import { 
    CircleDollarSignIcon, 
    ShoppingBasketIcon, 
    TruckIcon, 
    ClockIcon,
    DownloadIcon,
    TrendingUp,
    Package // Icon used to visually represent "Total Orders"
} from "lucide-react" // Scalable SVG icons for the UI
import { useRouter } from "next/navigation" // Next.js router for programmatic navigation
import { useEffect, useState } from "react" // Standard React hooks
import toast from "react-hot-toast" // Notification library for popup alerts
// Libraries for generating PDF reports on the client side
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
// Recharts library components for rendering the dynamic line chart
import {
  LineChart, 
  Line,      
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

export default function Dashboard() {

    // --- AUTHENTICATION & CONFIG ---
    // Extract the getToken function from Clerk to securely authorize API calls
    const { getToken } = useAuth()
    // Pull currency symbol from environment variables, defaulting to 'Rs'
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || 'Rs'
    const router = useRouter() 

    // --- STATE MANAGEMENT ---
    // Controls the main page loading spinner during initial data fetch
    const [loading, setLoading] = useState(true)
    
    // Object storing all the key metrics fetched from the backend for the store
    const [dashboardData, setDashboardData] = useState({
        totalProducts: 0,
        totalEarnings: 0,
        totalOrders: 0, 
        ordersDelivered: 0,
        pendingDeliveries: 0,
        allOrders: [] // Raw array of orders used for chart math and PDF generation
    })
    
    // Stores the processed array formatted specifically for the Recharts library
    const [chartData, setChartData] = useState([])

    /**
     * PROCESS CHART DATA
     * Takes the raw 'allOrders' array and groups the revenue by day for the last 7 days.
     */
    const processChartData = (orders = []) => {
        const data = [];
        const today = new Date();
        
        // Loop backwards 7 days, starting from 6 days ago up to today (0)
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            
            // Format dates for strict comparison (e.g., "4/20/2026")
            const comparisonDate = d.toLocaleDateString();
            // Create a short label for the X-axis (e.g., "Mon", "Tue")
            const label = d.toLocaleDateString('en-US', { weekday: 'short' }); 
            
            // Filter the raw orders array to find transactions matching this specific loop day
            const daysOrders = orders.filter(o => {
                if (!o.createdAt) return false;
                const orderDate = new Date(o.createdAt).toLocaleDateString();
                return orderDate === comparisonDate;
            });

            // Sum the 'total' field (representing store revenue) for all orders on this day
            const dailyRevenue = daysOrders.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
            
            // Push the formatted object into the chart data array
            data.push({
                name: label,
                revenue: dailyRevenue
            });
        }
        return data;
    }

    // --- API INTEGRATION ---
    // Asynchronous function to retrieve dashboard statistics from the backend
    const fetchDashboardData = async () => {
        try {
            const token = await getToken()
            
            // Fetch data from the store-specific dashboard endpoint
            const { data } = await axios.get('/api/store/dashboard', {
                headers: { Authorization: `Bearer ${token}` }
            })
            
            // Map the backend response to a safe object, casting values to Numbers 
            // and providing fallbacks (0 or []) if data is missing or undefined
            const safeData = {
                totalProducts: Number(data.dashboardData.totalProducts) || 0,
                totalEarnings: Number(data.dashboardData.totalEarnings) || 0,
                totalOrders: Number(data.dashboardData.totalOrders) || 0, 
                ordersDelivered: Number(data.dashboardData.ordersDelivered) || 0,
                pendingDeliveries: Number(data.dashboardData.pendingDeliveries) || 0,
                allOrders: data.dashboardData.allOrders || [] 
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

    // --- REPORT GENERATION ---
    // Function to generate and download a PDF executive report using jsPDF
    const GenerateReport = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const today = new Date();
        const brandColor = [30, 41, 59]; // Slate-800 color for headers

        // PDF Header Formatting
        doc.setFillColor(...brandColor);
        doc.rect(0, 0, pageWidth, 40, 'F'); // Draw a solid rectangle across the top

        doc.setFontSize(24);
        doc.setTextColor(255, 255, 255); // White text
        doc.setFont("helvetica", "bold");
        doc.text("DREAMSAVER", 14, 20);
        
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text("Store Performance Audit Report", 14, 28);

        // Header Metadata
        doc.setFontSize(10);
        doc.text(`Report ID: ${Date.now()}`, pageWidth - 14, 18, { align: 'right' });
        doc.text(`Date: ${today.toLocaleDateString()}`, pageWidth - 14, 24, { align: 'right' });
        doc.text(`Generated By: Store Manager`, pageWidth - 14, 30, { align: 'right' });

        // Section 1: Stats Overview
        let yPos = 55;
        
        doc.setFontSize(14);
        doc.setTextColor(...brandColor);
        doc.text("1. Performance Overview", 14, yPos);
        
        const cardWidth = 45;
        const cardHeight = 25;
        const gap = 5;
        const startX = 14;
        yPos += 5;

        // Array of key metrics to draw in the PDF
        const stats = [
            { label: "Total Earnings", value: `${currency}${dashboardData.totalEarnings.toLocaleString()}` },
            { label: "Products", value: dashboardData.totalProducts.toString() },
            { label: "Total Orders", value: dashboardData.totalOrders.toString() },
            { label: "Delivered", value: dashboardData.ordersDelivered.toString() }
        ];

        // Loop through the stats array to draw "cards" in the PDF
        stats.forEach((stat, index) => {
            const x = startX + (index * (cardWidth + gap)); // Calculate horizontal position
            doc.setFillColor(248, 250, 252); 
            doc.setDrawColor(226, 232, 240); 
            doc.roundedRect(x, yPos, cardWidth, cardHeight, 3, 3, 'FD'); // Draw card background with border

            doc.setFontSize(9);
            doc.setTextColor(100, 116, 139);
            doc.text(stat.label, x + 5, yPos + 8); // Draw label

            doc.setFontSize(14);
            doc.setTextColor(...brandColor);
            doc.setFont("helvetica", "bold");
            doc.text(stat.value, x + 5, yPos + 18); // Draw value
        });

        // Section 2: Operational Metrics
        yPos += cardHeight + 15;
        doc.setFontSize(14);
        doc.setTextColor(...brandColor);
        doc.text("2. Operational Metrics", 14, yPos);

        yPos += 5;
        doc.setFontSize(10);
        doc.setTextColor(50);
        // Calculate the Delivery Completion Rate dynamically, guarding against division by zero
        const healthText = `Pending Deliveries: ${dashboardData.pendingDeliveries} | Delivery Completion Rate: ${dashboardData.ordersDelivered > 0 ? ((dashboardData.ordersDelivered / (dashboardData.ordersDelivered + dashboardData.pendingDeliveries)) * 100).toFixed(1) + '%' : 'N/A'}`;
        doc.text(healthText, 14, yPos + 5);

        // Section 3: Data Table using autoTable plugin
        yPos += 15;
        doc.setFontSize(14);
        doc.setTextColor(...brandColor);
        doc.setFont("helvetica", "bold");
        doc.text("3. Daily Revenue Breakdown (Last 7 Days)", 14, yPos);

        // Map the generated chartData into a 2D array required by autoTable
        // If chartData is empty, provide a fallback row to prevent errors
        const auditRows = chartData.length > 0 ? chartData.map(day => [
            day.name,
            `${currency}${day.revenue.toLocaleString()}`,
            day.revenue > 0 ? 'Active' : 'No Sales'
        ]) : [['-', '-', '-']];

        // Generate the table
        autoTable(doc, {
            startY: yPos + 5,
            head: [['Day', 'Revenue', 'Status']],
            body: auditRows,
            theme: 'grid',
            headStyles: { 
                fillColor: brandColor, 
                textColor: 255, 
                fontSize: 10,
                fontStyle: 'bold'
            },
            bodyStyles: { 
                fontSize: 9, 
                cellPadding: 4,
                textColor: 50
            },
            alternateRowStyles: { 
                fillColor: [241, 245, 249] 
            },
            columnStyles: {
                0: { fontStyle: 'bold' },
                1: { halign: 'right' }
            },
            // Custom footer hook that prints the page number at the bottom of every page
            didDrawPage: function (data) {
                doc.setFontSize(8);
                doc.setTextColor(150);
                const footerText = `DreamSaver Store Audit Report - Page ${doc.internal.getNumberOfPages()}`;
                doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
            }
        });

        // Prompt the user to save the generated PDF file
        doc.save(`DreamSaver_Store_Report_${today.toISOString().split('T')[0]}.pdf`);
    }

    // Trigger the fetch function exactly once when the component mounts
    useEffect(() => {
        fetchDashboardData()
    }, [])

    // --- Configuration Array for UI Mapping ---
    // Array of top-level metrics mapped to CSS classes for easy rendering of the grid cards
    const dashboardCardsData = [
        { 
            title: 'Total Earnings', 
            value: currency + dashboardData.totalEarnings.toLocaleString(), 
            icon: CircleDollarSignIcon,
            gradient: 'from-emerald-500 to-green-600',
            bgLight: 'bg-emerald-50',
            textColor: 'text-emerald-600'
        },
        { 
            title: 'Total Products', 
            value: dashboardData.totalProducts, 
            icon: ShoppingBasketIcon,
            gradient: 'from-blue-500 to-indigo-600',
            bgLight: 'bg-blue-50',
            textColor: 'text-blue-600'
        },
        { 
            title: 'Total Orders', 
            value: dashboardData.totalOrders, 
            icon: Package, 
            gradient: 'from-violet-500 to-purple-600',
            bgLight: 'bg-violet-50',
            textColor: 'text-violet-600'
        },
        { 
            title: 'Orders Delivered', 
            value: dashboardData.ordersDelivered, 
            icon: TruckIcon,
            gradient: 'from-cyan-500 to-teal-600',
            bgLight: 'bg-cyan-50',
            textColor: 'text-cyan-600'
        },
        { 
            title: 'Pending Deliveries', 
            value: dashboardData.pendingDeliveries, 
            icon: ClockIcon,
            gradient: 'from-amber-400 to-orange-500',
            bgLight: 'bg-amber-50',
            textColor: 'text-amber-600'
        },
    ]

    // Render Guard: Display a full-page animated pulse loader if data is currently fetching
    if (loading) return (
        <div className="min-h-[70vh] flex items-center justify-center bg-slate-50/50">
            <div className="text-center space-y-3">
                <Loading />
                <p className="text-slate-500 animate-pulse">Syncing store data...</p>
            </div>
        </div>
    )

    // --- Main Render ---
    return (
        <div className="min-h-screen bg-slate-50/30 p-4 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* ================= Header Section ================= */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
                            Store <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">Overview</span>
                        </h1>
                        <p className="text-slate-500 mt-2 text-base lg:text-lg">
                            Track your performance, goals, and delivery status.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={GenerateReport}
                            className="group flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-full shadow-lg shadow-slate-900/20 hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all duration-200"
                        >
                            <DownloadIcon size={18} className="group-hover:-translate-y-0.5 transition-transform" />
                            <span className="font-medium text-sm">Download Report</span>
                        </button>
                    </div>
                </div>

                {/* ================= Stats Grid ================= */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {/* Map over the dashboardCardsData array to generate the metric cards */}
                    {dashboardCardsData.map((card, index) => (
                        <div 
                            key={index} 
                            className="relative overflow-hidden bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1 group"
                        >
                            {/* Decorative background hover effect */}
                            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.gradient} opacity-5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-500`}></div>

                            <div className="relative z-10 flex items-start justify-between">
                                <div className="space-y-4">
                                    {/* Dynamic Icon */}
                                    <div className={`w-12 h-12 rounded-2xl ${card.bgLight} ${card.textColor} flex items-center justify-center`}>
                                        <card.icon size={24} />
                                    </div>
                                    <div>
                                        <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider">{card.title}</p>
                                        {/* Dynamic Value */}
                                        <h3 className="text-3xl font-bold text-slate-900 mt-1">{card.value}</h3>
                                    </div>
                                </div>
                            </div>
                            {/* Decorative bottom border line */}
                            <div className={`absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r ${card.gradient} opacity-80`}></div>
                        </div>
                    ))}
                </div>

                {/* ================= Chart Section (Line Chart) ================= */}
                <div className="w-full bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <TrendingUp className="text-blue-600" size={24} />
                                Revenue Analytics
                            </h2>
                            <p className="text-sm text-slate-500 mt-1">Daily earnings for the last 7 days</p>
                        </div>
                    </div>

                    {/* Height constraint required for ResponsiveContainer to work */}
                    <div className="h-[350px] w-full">
                        {/* Recharts Wrapper: Adapts chart to screen width */}
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                {/* X-Axis maps to the 'name' key (e.g. "Mon", "Tue") */}
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: '#64748b', fontSize: 12}} 
                                    dy={10}
                                />
                                {/* Y-Axis automatically scales and applies currency formatting */}
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fill: '#64748b', fontSize: 12}} 
                                    tickFormatter={(value) => `${currency}${value}`}
                                />
                                {/* Custom Tooltip styling when hovering over data points */}
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ color: '#1e293b', fontWeight: 600 }}
                                    formatter={(value) => [`${currency}${value}`, "Revenue"]}
                                />
                                {/* The actual line plotting the 'revenue' dataKey */}
                                <Line 
                                    type="monotone" 
                                    dataKey="revenue" 
                                    stroke="#4f46e5" 
                                    strokeWidth={3} 
                                    dot={{ r: 4, fill: "#4f46e5", strokeWidth: 2, stroke: "#fff" }}
                                    activeDot={{ r: 6, strokeWidth: 0, fill: "#4f46e5" }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    )
}