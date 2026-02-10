'use client'

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link"; 
import { Trash2Icon, CheckCircleIcon, TruckIcon, XCircleIcon, ClockIcon, Package } from "lucide-react"; 

export default function CartPage() {
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "Rs";

  const [goalSections, setGoalSections] = useState({
    active: [],
    completed: [], 
    inTransit: [], 
    delivered: [], 
    cancelled: []
  });
  const [loading, setLoading] = useState(true);

  // ================= GOAL LOGIC =================
  const fetchGoals = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/goals", { cache: "no-store" });
      const data = await res.json();
      
      const sections = {
        active: [],
        completed: [],
        inTransit: [],
        delivered: [],
        cancelled: []
      };

      for (const goal of (data.goals || [])) {
          const totalSaved = (goal.deposits || []).reduce((sum, dep) => sum + Number(dep.amount), 0);
          const processedGoal = { ...goal, saved: totalSaved };
          
          const hasDelivery = !!goal.delivery;
          const deliveryStatus = goal.delivery?.status; 

          if (goal.status === 'CANCELLED' || goal.status === 'REFUNDED') {
              sections.cancelled.push(processedGoal);
          }
          else if (goal.status === 'DELIVERED' || deliveryStatus === 'DELIVERED') {
              sections.delivered.push(processedGoal);
          }
          else if (hasDelivery) {
              sections.inTransit.push(processedGoal);
          }
          else if (goal.status === 'COMPLETED') {
              sections.completed.push(processedGoal);
          }
          else {
              sections.active.push(processedGoal);
          }
      }

      setGoalSections(sections);

    } catch (err) {
      console.error("Error fetching goals:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGoal = async (e, goal) => {
    // No need for e.preventDefault() here because button is outside the link now
    const hasFunds = Number(goal.saved) > 0;
    let message = "";

    if (hasFunds) {
      const deductionAmount = (Number(goal.saved) * 0.20).toFixed(0);
      message = `⚠️ CANCELLATION WARNING ⚠️\n\nA 20% cancellation fee (${currency} ${deductionAmount}) will be deducted.\n\nAre you sure?`;
    } else {
      message = "Delete this goal? This cannot be undone.";
    }

    if (!confirm(message)) return;

    try {
      const res = await fetch(`/api/goals/${goal.id}`, { method: "DELETE" });
      if (res.ok) {
        fetchGoals(); 
        if (hasFunds) alert("Goal cancelled. Refund processed.");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete goal");
      }
    } catch (err) {
      console.error("Error deleting goal:", err);
      alert("Something went wrong");
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  // ================= REUSABLE COMPONENT: GOAL CARD =================
  const GoalCard = ({ goal, type }) => {
    const percent = goal.targetAmount > 0 
      ? Math.min(Math.round((goal.saved / goal.targetAmount) * 100), 100)
      : 0;

    let statusColor = "bg-white border-slate-200";
    let icon = null;
    let badge = null;

    if (type === 'active') icon = <ClockIcon size={16} className="text-slate-400"/>;
    if (type === 'completed') { 
        statusColor = "bg-green-50/50 border-green-200"; 
        icon = <CheckCircleIcon size={16} className="text-green-600"/>; 
    }
    if (type === 'inTransit') { 
        statusColor = "bg-indigo-50/50 border-indigo-200"; 
        icon = <Package size={16} className="text-indigo-600"/>; 
        badge = <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-bold">{goal.delivery?.status}</span>;
    }
    if (type === 'delivered') { 
        statusColor = "bg-blue-50/50 border-blue-200"; 
        icon = <TruckIcon size={16} className="text-blue-600"/>; 
    }
    if (type === 'cancelled') { 
        statusColor = "bg-red-50/50 border-red-200 opacity-75"; 
        icon = <XCircleIcon size={16} className="text-red-500"/>; 
    }

    // Determine target URL
    let targetLink = "#";
    if (goal.delivery?.id) {
        targetLink = `/tracking/${goal.delivery.id}`;
    } else if (type !== 'cancelled') {
        targetLink = `/goals/${goal.id}`;
    }

    return (
      <div 
        className={`group relative p-4 border rounded-xl transition-all duration-300 hover:shadow-md ${statusColor}`}
      >
        {/* ✅ STRETCHED LINK: This makes the whole card clickable & supports Right Click */}
        {targetLink !== "#" && (
            <Link href={targetLink} className="absolute inset-0 z-0" />
        )}

        <div className="flex gap-4 items-start relative pointer-events-none"> 
          {/* pointer-events-none allows clicks to pass through to the Link layer behind */}
          
          <div className="h-16 w-16 bg-white rounded-lg overflow-hidden flex-shrink-0 border border-slate-200 relative">
             {goal.product?.images?.[0] ? (
                <Image src={goal.product.images[0]} alt={goal.product.name} fill className="object-cover" />
             ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">No Img</div>
             )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-slate-800 truncate pr-2">{goal.product?.name}</h3>
              {type === 'active' && (
                <span className="text-xs font-bold px-2 py-1 rounded-md bg-slate-100 text-slate-600">
                  {percent}%
                </span>
              )}
              {type !== 'active' && icon}
            </div>
            
            <p className="text-xs text-slate-500 mt-1">Target: {currency}{Number(goal.targetAmount).toLocaleString()}</p>

            {(type === 'active' || type === 'completed') && (
              <div className="mt-3 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${type === 'completed' ? "bg-green-500" : "bg-emerald-500"}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            )}
            
            {type === 'inTransit' && <p className="text-xs text-indigo-600 mt-2 font-medium">Tracking ID: {goal.delivery?.trackingNumber}</p>}
            {type === 'delivered' && <p className="text-xs text-blue-600 mt-2 font-medium">Successfully Delivered</p>}
            {type === 'cancelled' && <p className="text-xs text-red-500 mt-2 font-medium">Cancelled / Refunded</p>}
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100/60 relative">
            <div className="text-sm font-medium text-slate-600 pointer-events-none">
              <span className="text-xs text-slate-400 mr-1">SAVED:</span> 
              <span className={type === 'completed' ? "text-green-700" : "text-slate-700"}>
                {currency}{Number(goal.saved).toLocaleString()}
              </span>
            </div>

            {/* ✅ DELETE BUTTON: Elevated (z-10) to sit ABOVE the link so it catches the click */}
            {type === 'active' && (
              <button
                onClick={(e) => handleDeleteGoal(e, goal)}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors relative z-10 cursor-pointer"
                title="Cancel Goal"
              >
                <Trash2Icon size={18} />
              </button>
            )}
            
            {badge && <div className="pointer-events-none">{badge}</div>}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-200 text-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <h1 className="text-4xl sm:text-5xl font-bold text-center mb-6">
          My <span className="text-emerald-600">DreamSaver</span> Dashboard
        </h1>

        <div className="flex flex-col gap-8">
          
          {loading ? (
             <div className="animate-pulse space-y-4 max-w-2xl mx-auto w-full">
               <div className="h-32 bg-slate-200 rounded-xl"></div>
               <div className="h-32 bg-slate-200 rounded-xl"></div>
             </div>
          ) : (
            <>
              {/* 1. ACTIVE GOALS */}
              <section>
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <ClockIcon className="text-emerald-600" /> Active Goals
                </h2>
                {goalSections.active.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {goalSections.active.map(goal => <GoalCard key={goal.id} goal={goal} type="active" />)}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-sm">
                    No active savings goals.
                  </div>
                )}
              </section>

              {/* 2. COMPLETED GOALS */}
              {goalSections.completed.length > 0 && (
                <section>
                  <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <CheckCircleIcon className="text-green-600" /> Ready to Redeem
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {goalSections.completed.map(goal => <GoalCard key={goal.id} goal={goal} type="completed" />)}
                  </div>
                </section>
              )}

              {/* 3. IN TRANSIT */}
              {goalSections.inTransit.length > 0 && (
                <section>
                  <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Package className="text-indigo-600" /> Orders In Transit
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {goalSections.inTransit.map(goal => <GoalCard key={goal.id} goal={goal} type="inTransit" />)}
                  </div>
                </section>
              )}

              {/* 4. DELIVERED HISTORY */}
              {goalSections.delivered.length > 0 && (
                <section>
                  <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <TruckIcon className="text-blue-600" /> Delivered History
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {goalSections.delivered.map(goal => <GoalCard key={goal.id} goal={goal} type="delivered" />)}
                  </div>
                </section>
              )}

              {/* 5. CANCELLED GOALS */}
              {goalSections.cancelled.length > 0 && (
                <section>
                  <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <XCircleIcon className="text-red-500" /> Cancelled / Refunded
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-80 hover:opacity-100 transition-opacity">
                    {goalSections.cancelled.map(goal => <GoalCard key={goal.id} goal={goal} type="cancelled" />)}
                  </div>
                </section>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}