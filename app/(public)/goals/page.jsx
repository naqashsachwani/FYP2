"use client";

import { useEffect, useState } from "react";
import GoalCard from "@/components/GoalCard";
import ProgressChart from "@/components/ProgressChart";

/**
 * It is responsible for fetching raw data, normalizing it (calculating totals/percentages),
 * and distributing it to presentation components (Cards and Charts).
 */
export default function GoalsPage() {
  // ================= STATE MANAGEMENT =================
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  // ================= DATA FETCHING & TRANSFORMATION =================
  useEffect(() => {
    fetch("/api/goals")
      .then((res) => res.json())
      .then((data) => {
        const rawGoals = data.goals || [];

        /**
         * DATA NORMALIZATION LOGIC:
         * Instead of forcing child components to calculate totals, we process
         * the raw data here. This ensures the UI is "dumb" and simply renders values.
         */
        const calculatedGoals = rawGoals.map((goal) => {
          
          // 1. Financial Calculation: Sum up all deposit history for this goal
          const totalSaved = (goal.deposits || []).reduce(
            (sum, dep) => sum + Number(dep.amount),
            0
          );

          // 2. Progress Logic: Avoid division by zero
          const target = Number(goal.targetAmount);
          const percent = target > 0 ? (totalSaved / target) * 100 : 0;

          // APIs often return dates as strings. We convert them to Date objects here
          // so the DateFormatter in the UI doesn't crash or show "Invalid Date".
          const dateString = goal.endDate || goal.targetDate; // Fallback support for legacy field names
          const validDate = dateString ? new Date(dateString) : null;

          // 4. Return the enriched object
          return {
            ...goal,
            saved: totalSaved,
            targetAmount: target,
            progressPercent: percent,
            endDate: validDate, // Now guarantees a valid Date object or null
          };
        });

        setGoals(calculatedGoals);
      })
      .catch((err) => console.error("Failed to fetch goals:", err))
      .finally(() => setLoading(false)); // Ensure loading state clears even on error
  }, []);

  // ================= RENDER LOGIC =================
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">My Savings Goals</h1>

      {/* UX: Show Loading Feedback */}
      {loading && <p className="text-gray-500 animate-pulse">Loading goals...</p>}

      {/* UX: Empty State Handling */}
      {!loading && goals.length === 0 && (
        <div className="p-6 bg-gray-50 rounded-lg text-center border border-dashed border-gray-300">
             <p className="text-gray-600">No goals found. Start a new goal from your cart!</p>
        </div>
      )}

      {/* VIEW: Grid Layout (Responsive: 1 col mobile, 2 cols desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {goals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} />
        ))}
      </div>

      {/* VIEW: Visualization Section */}
      {/* Only render the chart if we actually have data to visualize */}
      {goals.length > 0 && (
        <div className="mt-8 border-t pt-8">
          <h2 className="text-xl font-semibold mb-4">Visual Summary</h2>
          <ProgressChart goals={goals} />
        </div>
      )}
    </div>
  );
}