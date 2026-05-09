'use client'

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link"; 
import { Trash2Icon, CheckCircleIcon, ClockIcon, Package, ChevronLeft, ChevronRight, LayoutDashboard, Loader2, ArrowRight } from "lucide-react"; 

export default function CartPage() {
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "Rs";

  // State hook to manage and categorize goals into three distinct arrays
  const [goalSections, setGoalSections] = useState({
    active: [],
    completed: [], 
    inTransit: [], 
  });
  
  // State hook to track the loading status
  const [loading, setLoading] = useState(true);

  // ================= PAGINATION STATES =================
  const [pageActive, setPageActive] = useState(1);
  const [pageCompleted, setPageCompleted] = useState(1);
  const [pageInTransit, setPageInTransit] = useState(1);
  const ITEMS_PER_PAGE = 4; // Adjust the number of items per page here

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
      };

      for (const goal of (data.goals || [])) {
          const totalSaved = (goal.deposits || []).reduce((sum, dep) => sum + Number(dep.amount), 0);
          const processedGoal = { ...goal, saved: totalSaved };
          
          const hasDelivery = !!goal.delivery;
          const deliveryStatus = goal.delivery?.status; 

          if (goal.status === 'CANCELLED' || goal.status === 'REFUNDED' || goal.status === 'DELIVERED' || deliveryStatus === 'DELIVERED') {
              continue; 
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

      // Reset pagination when fresh data is fetched
      setPageActive(1);
      setPageCompleted(1);
      setPageInTransit(1);

    } catch (err) {
      console.error("Error fetching goals:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGoal = async (e, goal) => {
    const hasFunds = Number(goal.saved) > 0;
    let message = ""; 

    if (hasFunds) {
      const deductionAmount = (Number(goal.saved) * 0.20).toFixed(0);
      message = `CANCELLATION WARNING \n\nA 20% cancellation fee (${currency} ${deductionAmount}) will be deducted.\n\nAre you sure?`;
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

  // ================= PAGINATION CALCULATIONS =================
  const totalActivePages = Math.max(1, Math.ceil(goalSections.active.length / ITEMS_PER_PAGE));
  const paginatedActive = goalSections.active.slice((pageActive - 1) * ITEMS_PER_PAGE, pageActive * ITEMS_PER_PAGE);

  const totalCompletedPages = Math.max(1, Math.ceil(goalSections.completed.length / ITEMS_PER_PAGE));
  const paginatedCompleted = goalSections.completed.slice((pageCompleted - 1) * ITEMS_PER_PAGE, pageCompleted * ITEMS_PER_PAGE);

  const totalInTransitPages = Math.max(1, Math.ceil(goalSections.inTransit.length / ITEMS_PER_PAGE));
  const paginatedInTransit = goalSections.inTransit.slice((pageInTransit - 1) * ITEMS_PER_PAGE, pageInTransit * ITEMS_PER_PAGE);

  // ================= REUSABLE PAGINATION COMPONENT =================
  const PaginationControls = ({ currentPage, totalPages, setPage }) => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-between mt-5 sm:mt-6 pt-4 border-t border-slate-100">
        <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
          Page {currentPage} of {totalPages}
        </span>
        <div className="flex gap-1.5 sm:gap-2">
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))} 
            disabled={currentPage === 1} 
            className="p-1.5 sm:p-2 border border-slate-200 rounded-lg sm:rounded-xl bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors text-slate-600 shadow-sm"
          >
            <ChevronLeft size={16} className="w-4 h-4 sm:w-[20px] sm:h-[20px]"/>
          </button>
          <button 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
            disabled={currentPage === totalPages} 
            className="p-1.5 sm:p-2 border border-slate-200 rounded-lg sm:rounded-xl bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors text-slate-600 shadow-sm"
          >
            <ChevronRight size={16} className="w-4 h-4 sm:w-[20px] sm:h-[20px]"/>
          </button>
        </div>
      </div>
    );
  };

  const GoalCard = ({ goal, type }) => {
    const percent = goal.targetAmount > 0 
      ? Math.min(Math.round((goal.saved / goal.targetAmount) * 100), 100)
      : 0;

    let statusColor = "bg-white border-slate-200";
    let icon = null;
    let badge = null;

    if (type === 'active') icon = <ClockIcon className="text-slate-400 w-4 h-4 sm:w-5 sm:h-5"/>;
    if (type === 'completed') { 
        statusColor = "bg-green-50/50 border-green-200"; 
        icon = <CheckCircleIcon className="text-green-600 w-4 h-4 sm:w-5 sm:h-5"/>; 
    }
    if (type === 'inTransit') { 
        statusColor = "bg-indigo-50/50 border-indigo-200"; 
        icon = <Package className="text-indigo-600 w-4 h-4 sm:w-5 sm:h-5"/>; 
        badge = <span className="text-[10px] sm:text-xs bg-indigo-100 text-indigo-700 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded font-bold uppercase tracking-wider shadow-sm border border-indigo-200">{goal.delivery?.status.replace('_', ' ')}</span>;
    }

    let targetLink = goal.delivery?.id ? `/tracking/${goal.delivery.id}` : `/goals/${goal.id}`;

    return (
      <div className={`group relative p-4 sm:p-5 border rounded-xl sm:rounded-2xl transition-all duration-300 hover:shadow-md ${statusColor}`}>
        <Link href={targetLink} className="absolute inset-0 z-0" />

        <div className="flex gap-3 sm:gap-4 items-start relative pointer-events-none"> 
          <div className="h-16 w-16 sm:h-20 sm:w-20 bg-white rounded-lg sm:rounded-xl overflow-hidden flex-shrink-0 border border-slate-200 relative shadow-sm">
            {(() => {
              const rawImages = goal.product?.images;
              let imageSrc = ''; 

              if (typeof rawImages === 'string') {
                imageSrc = rawImages; 
              } 
              else if (Array.isArray(rawImages) && rawImages.length > 0) {
                imageSrc = rawImages[0]; 
              }

              if (imageSrc && typeof imageSrc === 'string' && imageSrc.trim() !== '') {
                return (
                  <Image
                    src={imageSrc}
                    alt={goal.product?.name || 'Product image'}
                    fill
                    className="object-cover" 
                  />
                );
              } else {
                return (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-slate-50">
                    No Img
                  </div>
                );
              }
            })()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start gap-2">
              <h3 className="font-bold text-slate-800 text-sm sm:text-base leading-snug truncate w-full" title={goal.product?.name}>{goal.product?.name}</h3>
              <div className="shrink-0 bg-white p-1 sm:p-1.5 rounded-lg border border-slate-100 shadow-sm">{icon}</div>
            </div>
            
            <p className="text-[10px] sm:text-xs text-slate-500 mt-1 font-medium">Target: {currency}{Number(goal.targetAmount).toLocaleString()}</p>

            {(type === 'active' || type === 'completed') && (
              <div className="flex items-center gap-2 mt-2.5 sm:mt-3">
                  <div className="flex-1 h-2 sm:h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-200/60">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${type === 'completed' ? "bg-green-500" : "bg-gradient-to-r from-emerald-400 to-emerald-600"}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  {type === 'active' && (
                    <span className="text-[10px] sm:text-xs font-black text-emerald-600 shrink-0">
                      {percent}%
                    </span>
                  )}
              </div>
            )}
            
            {type === 'inTransit' && <p className="text-[10px] sm:text-xs text-indigo-600 mt-2 font-mono font-bold">TRK: {goal.delivery?.trackingNumber}</p>}
          </div>
        </div>

        <div className="flex flex-row items-center justify-between mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-slate-200/60 relative gap-3">
            <div className="text-xs sm:text-sm font-medium text-slate-600 pointer-events-none flex items-center gap-1.5">
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-white border border-slate-100 px-1.5 py-0.5 rounded shadow-sm">SAVED</span> 
              <span className={type === 'completed' ? "text-green-700 font-black font-mono" : "text-slate-800 font-black font-mono"}>
                {currency}{Number(goal.saved).toLocaleString()}
              </span>
            </div>

            {type === 'active' && (
              <button
                onClick={(e) => handleDeleteGoal(e, goal)}
                className="p-1.5 sm:p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-lg transition-colors relative z-10 cursor-pointer shadow-sm bg-white"
                title="Cancel Goal"
              >
                <Trash2Icon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
              </button>
            )}
            
            {badge && <div className="pointer-events-none self-end">{badge}</div>}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-800 pb-16 sm:pb-24">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
        
        <div className="flex flex-col items-center justify-center gap-2 sm:gap-3 mb-8 sm:mb-12 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-1 sm:mb-2 shadow-sm border border-emerald-100">
               <LayoutDashboard className="text-emerald-600 w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
              My <span className="text-emerald-600">DreamSaver</span> Dashboard
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm md:text-base font-medium mt-1 sm:mt-2 px-4 max-w-md mx-auto">Manage your savings, track deliveries, and redeem your completed goals.</p>
        </div>

        <div className="flex flex-col gap-6 sm:gap-8">
          {loading ? (
             <div className="animate-pulse space-y-4 sm:space-y-6 max-w-4xl mx-auto w-full">
               <div className="h-40 sm:h-48 bg-slate-200 rounded-2xl sm:rounded-3xl"></div>
               <div className="h-40 sm:h-48 bg-slate-200 rounded-2xl sm:rounded-3xl"></div>
             </div>
          ) : (
            <>
              {/* 1. ACTIVE GOALS SECTION */}
              <section className="bg-white p-5 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 w-full max-w-5xl mx-auto">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-2.5">
                  <ClockIcon className="text-emerald-600 w-5 h-5 sm:w-6 sm:h-6" /> Active Goals
                  {goalSections.active.length > 0 && (
                    <span className="ml-1 sm:ml-1.5 text-[10px] sm:text-xs font-bold bg-slate-100 text-slate-600 px-2 sm:px-2.5 py-0.5 rounded-full border border-slate-200">
                      {goalSections.active.length}
                    </span>
                  )}
                </h2>
                
                {goalSections.active.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      {paginatedActive.map(goal => <GoalCard key={goal.id} goal={goal} type="active" />)}
                    </div>
                    <PaginationControls 
                      currentPage={pageActive} 
                      totalPages={totalActivePages} 
                      setPage={setPageActive} 
                    />
                  </>
                ) : (
                  <div className="text-center py-10 sm:py-12 bg-slate-50 rounded-xl sm:rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs sm:text-sm font-medium flex flex-col items-center justify-center">
                    <Package className="w-8 h-8 sm:w-10 sm:h-10 text-slate-300 mb-3 sm:mb-4"/>
                    <p className="text-slate-600 font-bold text-sm sm:text-base mb-1">No active savings goals.</p>
                    <p>Start a new goal from the products page.</p>
                    <Link href="/shop" className="mt-4 sm:mt-5 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-md flex items-center gap-2 active:scale-95">
                        Browse Products <ArrowRight size={16} />
                    </Link>
                  </div>
                )}
              </section>

              {/* 2. COMPLETED GOALS SECTION */}
              {goalSections.completed.length > 0 && (
                <section className="bg-white p-5 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 w-full max-w-5xl mx-auto">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-2.5">
                    <CheckCircleIcon className="text-green-600 w-5 h-5 sm:w-6 sm:h-6" /> Ready to Redeem
                    <span className="ml-1 sm:ml-1.5 text-[10px] sm:text-xs font-bold bg-green-100 text-green-700 px-2 sm:px-2.5 py-0.5 rounded-full border border-green-200 shadow-sm">
                      {goalSections.completed.length}
                    </span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {paginatedCompleted.map(goal => <GoalCard key={goal.id} goal={goal} type="completed" />)}
                  </div>
                  <PaginationControls 
                    currentPage={pageCompleted} 
                    totalPages={totalCompletedPages} 
                    setPage={setPageCompleted} 
                  />
                </section>
              )}

              {/* 3. IN TRANSIT SECTION */}
              {goalSections.inTransit.length > 0 && (
                <section className="bg-white p-5 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 w-full max-w-5xl mx-auto">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-2.5">
                    <Package className="text-indigo-600 w-5 h-5 sm:w-6 sm:h-6" /> Orders In Transit
                    <span className="ml-1 sm:ml-1.5 text-[10px] sm:text-xs font-bold bg-indigo-100 text-indigo-700 px-2 sm:px-2.5 py-0.5 rounded-full border border-indigo-200 shadow-sm">
                      {goalSections.inTransit.length}
                    </span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {paginatedInTransit.map(goal => <GoalCard key={goal.id} goal={goal} type="inTransit" />)}
                  </div>
                  <PaginationControls 
                    currentPage={pageInTransit} 
                    totalPages={totalInTransitPages} 
                    setPage={setPageInTransit} 
                  />
                </section>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}