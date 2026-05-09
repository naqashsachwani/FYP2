"use client";

import { useEffect, useState } from "react";
import GoalCard from "@/components/GoalCard";
import ProgressChart from "@/components/ProgressChart";
import { Loader2, Target } from "lucide-react";

/**
 * responsible for fetching raw data, normalizing it (calculating totals/percentages),
 * and distributing it to presentation components (Cards and Charts).
 */
export default function GoalsPage() {
  // ================= STATE MANAGEMENT =================
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/goals")
      .then((res) => res.json())
      .then((data) => {
        const rawGoals = data.goals || [];

        const calculatedGoals = rawGoals.map((goal) => {
          
          // Financial Calculation: Sum up all deposit history for this goal
          const totalSaved = (goal.deposits || []).reduce(
            (sum, dep) => sum + Number(dep.amount),
            0
          );

          // 2Progress Logic: Avoid division by zero
          const target = Number(goal.targetAmount);
          const percent = target > 0 ? (totalSaved / target) * 100 : 0;

        
          const dateString = goal.endDate || goal.targetDate; 
          const validDate = dateString ? new Date(dateString) : null;

          // Return the enriched object
          return {
            ...goal,
            saved: totalSaved,
            targetAmount: target,
            progressPercent: percent,
            endDate: validDate,
          };
        });

        setGoals(calculatedGoals);
      })
      .catch((err) => console.error("Failed to fetch goals:", err))
      .finally(() => setLoading(false)); // Ensure loading state clears even on error
  }, []);

  return (
    <div className="min-h-[100dvh] bg-slate-50 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight flex items-center justify-center sm:justify-start gap-2.5 sm:gap-3">
             <Target className="text-emerald-600 w-6 h-6 sm:w-8 sm:h-8" /> My Savings Goals
          </h1>
          <p className="text-slate-500 mt-2 text-sm sm:text-base">Track and manage your ongoing product reservations.</p>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 sm:gap-4 text-slate-400">
             <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin text-emerald-600" />
             <p className="font-medium text-sm sm:text-base animate-pulse">Loading your goals...</p>
          </div>
        )}

        {!loading && goals.length === 0 && (
          <div className="py-16 sm:py-24 bg-white rounded-2xl sm:rounded-3xl text-center border border-dashed border-slate-300 shadow-sm flex flex-col items-center justify-center">
               <Target className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mb-3 sm:mb-4" />
               <p className="text-slate-600 font-bold text-lg sm:text-xl">No active goals found.</p>
               <p className="text-slate-500 text-sm mt-1">Start a new goal from your cart to see it here!</p>
          </div>
        )}

        {/* VIEW: Grid Layout (Responsive: 1 col mobile, 2 cols desktop) */}
        {goals.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        )}

        {/* VIEW: Visualization Section */}
        {/* Only render the chart if we actually have data to visualize */}
        {goals.length > 0 && (
          <div className="mt-8 sm:mt-12 border-t border-slate-200 pt-8 sm:pt-10">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-slate-800">Visual Summary</h2>
            <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
               <ProgressChart goals={goals} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}