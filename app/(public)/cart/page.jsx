'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Trash2Icon, CheckCircleIcon } from "lucide-react"; 

export default function CartPage() {
  // CONFIG: Fallback to "Rs" if env variable is missing
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "Rs";
  const router = useRouter();

  // STATE MANAGEMENT
  const [activeGoals, setActiveGoals] = useState([]);
  const [loadingGoals, setLoadingGoals] = useState(true);

  // ================= GOAL LOGIC =================
  
  /**
   * Fetch Goals
   * Fetches all goals but filters the list client-side to show only 
   * "Active" or "Completed" goals.
   */
  const fetchGoals = async () => {
    try {
      setLoadingGoals(true);
      // CACHE: 'no-store' ensures we always get the latest balance/status from the server
      const res = await fetch("/api/goals", { cache: "no-store" });
      const data = await res.json();
      
      const validActive = [];

      // DATA TRANSFORMATION LOOP
      for (const goal of (data.goals || [])) {
          
          // FILTER: Exclude Refunded, Cancelled, or Drafts (Saved)
          // We only want to show goals that are currently in progress or finished.
          if (goal.status === 'REFUNDED' || goal.status === 'CANCELLED' || goal.status === 'SAVED') {
            continue; 
          }

          // CALCULATION: Sum up all deposit amounts to get the total saved
          const totalSaved = (goal.deposits || []).reduce((sum, dep) => sum + Number(dep.amount), 0);
          
          // Merge calculation into the goal object
          const processedGoal = { ...goal, saved: totalSaved };

          validActive.push(processedGoal);
      }

      setActiveGoals(validActive);

    } catch (err) {
      console.error("Error fetching goals:", err);
    } finally {
      setLoadingGoals(false);
    }
  };

  /**
   * Delete Goal Logic
   * Handles the cancellation of a goal. Includes business logic for 
   * deducting a fee if funds have already been deposited.
   */
  const handleDeleteGoal = async (goal) => {
    const hasFunds = Number(goal.saved) > 0;
    let message = "";

    // If the user has saved money, warn them about the 20% penalty.
    if (hasFunds) {
      const deductionAmount = (Number(goal.saved) * 0.20).toFixed(0);
      message = `⚠️ CANCELLATION WARNING ⚠️\n\nA 20% cancellation fee (${currency} ${deductionAmount}) will be deducted from your total saved amount.\n\nAre you sure you want to proceed?`;
    } else {
      // Simple deletion confirmation for empty goals
      message = "Are you sure you want to delete this goal? This cannot be undone.";
    }

    // Abort if user cancels the prompt
    if (!confirm(message)) return;

    try {
      const res = await fetch(`/api/goals/${goal.id}`, { method: "DELETE" });
      
      if (res.ok) {
        // Remove from UI immediately without waiting for a re-fetch
        setActiveGoals(prev => prev.filter(g => g.id !== goal.id));
        
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

  // 3. Navigation
  const handleGoalClick = (goal) => {
      router.push(`/goals/${goal.id}`);
  };

  // INITIALIZATION
  useEffect(() => {
    fetchGoals();
  }, []);

  // ================= RENDER =================
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-200 text-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <h1 className="text-4xl sm:text-5xl font-bold text-center mb-6">
          My <span className="text-emerald-600">DreamSaver</span> Dashboard
        </h1>

        <div className="flex flex-col gap-8">
          
          {/* ================= SECTION: ACTIVE GOALS  ================= */}
          <div className="bg-white/80 backdrop-blur-md shadow-lg border border-slate-200 rounded-2xl p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-800">Active Goals</h2>
            </div>

            {loadingGoals ? (
              <div className="animate-pulse space-y-4">
                {[1, 2].map((i) => <div key={i} className="h-24 bg-slate-100 rounded-xl"></div>)}
              </div>
            ) : activeGoals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeGoals.map((goal) => {
                  // PROGRESS CALCULATION
                  const percent = goal.targetAmount > 0 
                    ? Math.min(Math.round((goal.saved / goal.targetAmount) * 100), 100)
                    : 0;
                  
                  // Check if goal is fully funded or marked complete by API
                  const isCompleted = goal.status === "COMPLETED" || percent >= 100;

                  return (
                    <div
                      key={goal.id}
                      onClick={() => handleGoalClick(goal)}
                      // Changes based on completion status
                      className={`group relative p-4 border rounded-xl transition-all duration-300 cursor-pointer hover:shadow-md ${
                        isCompleted ? "bg-green-50/50 border-green-200" : "bg-white border-slate-200 hover:border-emerald-300"
                      }`}
                    >
                      {/* Goal Content */}
                      <div className="flex gap-4 items-start">
                        {/* IMAGE HANDLING: Check for image array, fallback to text if empty */}
                        <div className="h-16 w-16 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 border border-slate-200">
                           {goal.product?.images?.[0] ? (
                              <Image 
                                src={goal.product.images[0]} alt={goal.product.name} 
                                width={64} height={64} className="object-cover w-full h-full"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400"><span className="text-xs">No Img</span></div>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h3 className="font-semibold text-slate-800 truncate pr-2">{goal.product?.name}</h3>
                            <span className={`text-xs font-bold px-2 py-1 rounded-md ${isCompleted ? "bg-green-200 text-green-800" : "bg-slate-100 text-slate-600"}`}>
                                {percent}%
                            </span>
                          </div>
                          
                          <p className="text-xs text-slate-500 mt-1">Target: {currency}{Number(goal.targetAmount).toLocaleString()}</p>

                          {/* PROGRESS BAR VISUAL */}
                          <div className="mt-3 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${isCompleted ? "bg-green-500" : "bg-emerald-500"}`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100/60">
                          <div className="text-sm font-medium text-slate-600">
                            CURRENT DEPOSIT: <span className={isCompleted ? "text-green-700" : "text-emerald-700"}>{currency}{Number(goal.saved).toLocaleString()}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {isCompleted ? (
                                <div className="flex items-center gap-1.5 text-green-700 text-sm font-bold bg-green-100 px-3 py-1.5 rounded-lg">
                                  <CheckCircleIcon size={16} /> <span>Completed</span>
                                </div>
                            ) : (
                               <button
                                 onClick={(e) => { 
                                     // EVENT PROPAGATION: Stop the click from bubbling up to the parent div
                                     // This prevents the router.push() from firing when clicking Delete
                                     e.stopPropagation(); 
                                     handleDeleteGoal(goal); 
                                 }}
                                 className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                 title="Delete Goal"
                               >
                                 <Trash2Icon size={18} />
                               </button>
                            )}
                          </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // EMPTY STATE
              <div className="text-center py-10 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <p className="text-slate-500">You have no active goals yet.</p>
                <p className="text-xs text-slate-400 mt-1">Browse our shop to start your first goal!</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}