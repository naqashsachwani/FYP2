"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Wallet, PackageCheck, Clock, Truck, RotateCw } from "lucide-react";
import toast from "react-hot-toast";
import dynamic from "next/dynamic";

// Dynamically import the line chart
const RevenueLineChart = dynamic(() => import("@/components/charts/RevenueLineChart"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-[350px] animate-pulse rounded-2xl bg-slate-100 mt-6" />
    ),
});

export default function RiderDashboard() {
  const router = useRouter();
  const currency = "Rs";

  const [profile, setProfile] = useState(null); 
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Processes raw payout data into a 7-day array for the chart
  const processChartData = (payouts = []) => {
      const data = [];
      const today = new Date();
      
      for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(today.getDate() - i);
          
          const comparisonDate = d.toLocaleDateString();
          const label = d.toLocaleDateString('en-US', { weekday: 'short' }); 
          
          // Match EARNING payouts to the specific date
          const dailyPayouts = payouts.filter(p => {
              if (p.type !== 'EARNING' || !p.createdAt) return false;
              const pDate = new Date(p.createdAt).toLocaleDateString();
              return pDate === comparisonDate;
          });

          // Sum up the daily earnings
          const dailyRevenue = dailyPayouts.reduce((acc, curr) => acc + curr.amount, 0);
          
          data.push({
              name: label,
              revenue: dailyRevenue
          });
      }
      return data;
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/rider/dashboard");
      if (res.status === 403) return router.push("/rider/rider-signup"); 
      const data = await res.json();
      
      setProfile(data.profile); 
      setStats(data.stats);
      
      // ✅ Feed the payouts array into the chart processor
      setChartData(processChartData(data.payouts || []));
    } catch (error) {
      toast.error("Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboardData(); }, []);

  if (loading && !profile) return <div className="min-h-[80vh] flex items-center justify-center"><Loader2 className="animate-spin text-green-600 w-10 h-10" /></div>;

  return (
    // ✅ Matches Admin White Background Layout
    <div className="bg-white rounded-tl-3xl shadow-sm border-l border-t border-slate-200 min-h-[calc(100vh-80px)] p-6 lg:p-10">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Page Header (Matches Admin exactly) */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
                    Rider <span className="text-green-600">Dashboard</span>
                </h1>
                <p className="text-slate-500 mt-2 text-sm lg:text-base">
                    Track your earnings, active deliveries, and performance.
                </p>
            </div>
            <button onClick={fetchDashboardData} className="p-2 border rounded-full hover:bg-slate-50 transition text-slate-500">
                <RotateCw size={20} className={loading ? "animate-spin" : ""} />
            </button>
        </div>

        {/* Summary Cards Grid (Matches Admin Cards exactly) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Balance Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:border-green-300 transition-colors">
                <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center mb-4">
                    <Wallet size={24} />
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Available Balance</p>
                <h3 className="text-3xl font-bold text-slate-900">Rs {profile?.walletBalance?.toLocaleString() || 0}</h3>
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 opacity-[0.08] rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
            </div>

            {/* Completed Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:border-blue-300 transition-colors">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                    <PackageCheck size={24} />
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Completed</p>
                <h3 className="text-3xl font-bold text-slate-900">{stats?.completedDeliveries || 0}</h3>
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 opacity-[0.08] rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
            </div>

            {/* Active Jobs Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:border-purple-300 transition-colors">
                <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                    <Truck size={24} />
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Active Jobs</p>
                <h3 className="text-3xl font-bold text-slate-900">{stats?.activeDeliveriesCount || 0}</h3>
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500 to-fuchsia-600 opacity-[0.08] rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
            </div>

            {/* New Requests Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:border-orange-300 transition-colors">
                <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center mb-4">
                    <Clock size={24} />
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">New Requests</p>
                <h3 className="text-3xl font-bold text-slate-900">{stats?.pendingDeliveries || 0}</h3>
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-400 to-red-500 opacity-[0.08] rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
            </div>

        </div>

        {/* ✅ Line Chart rendering Daily Earnings */}
        <div className="mt-8 pt-4">
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