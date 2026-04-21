'use client'

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link"; 
import { Trash2Icon, CheckCircleIcon, ClockIcon, Package } from "lucide-react"; 

export default function CartPage() {
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "Rs";

  // State hook to manage and categorize goals into three distinct arrays: active, completed, and inTransit
  const [goalSections, setGoalSections] = useState({
    active: [],
    completed: [], 
    inTransit: [], 
  });
  
  // State hook to track the loading status while data is being fetched from the API
  const [loading, setLoading] = useState(true);

  // ================= GOAL LOGIC =================
  // function to fetch user goals from the backend API
  const fetchGoals = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/goals", { cache: "no-store" });
      const data = await res.json();
      
      // Temporary object to hold the categorized goals before updating the state
      const sections = {
        active: [],
        completed: [],
        inTransit: [],
      };

      // Loop through the fetched goals array (defaulting to an empty array if undefined to prevent crashes)
      for (const goal of (data.goals || [])) {
          // Calculate the total saved amount by reducing the deposits array, converting each string amount to a Number
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

    } catch (err) {
      console.error("Error fetching goals:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGoal = async (e, goal) => {
    const hasFunds = Number(goal.saved) > 0;
    let message = ""; // Variable to hold the confirmation prompt message

    // If the user has funds, apply the business logic: 20% cancellation fee penalty
    if (hasFunds) {
      const deductionAmount = (Number(goal.saved) * 0.20).toFixed(0);
      message = `CANCELLATION WARNING \n\nA 20% cancellation fee (${currency} ${deductionAmount}) will be deducted.\n\nAre you sure?`;
    } else {
      message = "Delete this goal? This cannot be undone.";
    }

    // Trigger the browser's native confirmation dialog. If the user clicks "Cancel", stop execution here
    if (!confirm(message)) return;

    try {
      const res = await fetch(`/api/goals/${goal.id}`, { method: "DELETE" });
      
      if (res.ok) {
        fetchGoals(); 
        if (hasFunds) alert("Goal cancelled. Refund processed.");
      } else {
        // If the server returns an error, parse it and alert the user
        const data = await res.json();
        alert(data.error || "Failed to delete goal");
      }
    } catch (err) {
      // Catch network-level errors during the DELETE request
      console.error("Error deleting goal:", err);
      alert("Something went wrong");
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const GoalCard = ({ goal, type }) => {
    // Calculate the percentage of completion. 
    const percent = goal.targetAmount > 0 
      ? Math.min(Math.round((goal.saved / goal.targetAmount) * 100), 100)
      : 0;

    let statusColor = "bg-white border-slate-200";
    let icon = null;
    let badge = null;

    if (type === 'active') icon = <ClockIcon size={16} className="text-slate-400"/>;
    if (type === 'completed') { 
        statusColor = "bg-green-50/50 border-green-200"; // Light green background for completed items
        icon = <CheckCircleIcon size={16} className="text-green-600"/>; 
    }
    if (type === 'inTransit') { 
        statusColor = "bg-indigo-50/50 border-indigo-200"; 
        icon = <Package size={16} className="text-indigo-600"/>; 
        // Generates a visual badge showing the current shipping status text
        badge = <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-bold">{goal.delivery?.status}</span>;
    }

    // Logic to determine where the user should go when they click the card
    let targetLink = "#"; 
    if (goal.delivery?.id) {
        targetLink = `/tracking/${goal.delivery.id}`;
    } else {
        targetLink = `/goals/${goal.id}`;
    }

    return (
      // Main container with hover effects and dynamic background colors based on the statusColor variable
      <div className={`group relative p-4 border rounded-xl transition-all duration-300 hover:shadow-md ${statusColor}`}>
        <Link href={targetLink} className="absolute inset-0 z-0" />

        <div className="flex gap-4 items-start relative pointer-events-none"> 
          
          <div className="h-16 w-16 bg-white rounded-lg overflow-hidden flex-shrink-0 border border-slate-200 relative">
            {(() => {
              // Extract the raw image data from the nested product object
              const rawImages = goal.product?.images;
              let imageSrc = ''; 

              // Check if the database stored the image as a plain string URL
              if (typeof rawImages === 'string') {
                imageSrc = rawImages; 
              } 
              // Check if the database stored the images as an array of URLs
              else if (Array.isArray(rawImages) && rawImages.length > 0) {
                imageSrc = rawImages[0]; 
              }

              // Final validation: Ensure the resolved source is actually a non-empty string
              if (imageSrc && typeof imageSrc === 'string' && imageSrc.trim() !== '') {
                return (
                  <Image
                    src={imageSrc}
                    alt={goal.product?.name || 'Product image'}
                    fill
                    className="object-cover" // Ensures the image isn't stretched weirdly
                  />
                );
              } else {
                // Fallback UI if the product has no image attached
                return (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                    No Img
                  </div>
                );
              }
            })()}
          </div>

          {/* Container for the text details next to the image */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-slate-800 truncate pr-2">{goal.product?.name}</h3>
              {type === 'active' && (
                <span className="text-xs font-bold px-2 py-1 rounded-md bg-slate-100 text-slate-600">
                  {percent}%
                </span>
              )}
              {/* Render the context-specific icon if it is NOT an active goal */}
              {type !== 'active' && icon}
            </div>
            
            <p className="text-xs text-slate-500 mt-1">Target: {currency}{Number(goal.targetAmount).toLocaleString()}</p>

            {(type === 'active' || type === 'completed') && (
              <div className="mt-3 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${type === 'completed' ? "bg-green-500" : "bg-emerald-500"}`}
                  style={{ width: `${percent}%` }} // Inline style to physically set the width
                />
              </div>
            )}
            
            {type === 'inTransit' && <p className="text-xs text-indigo-600 mt-2 font-medium">Tracking ID: {goal.delivery?.trackingNumber}</p>}
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100/60 relative">
            <div className="text-sm font-medium text-slate-600 pointer-events-none">
              <span className="text-xs text-slate-400 mr-1">SAVED:</span> 
              <span className={type === 'completed' ? "text-green-700" : "text-slate-700"}>
                {currency}{Number(goal.saved).toLocaleString()}
              </span>
            </div>

            {/* Delete button: Only available on 'active' goals. Needs relative z-10 to sit above the absolute Link overlay */}
            {type === 'active' && (
              <button
                onClick={(e) => handleDeleteGoal(e, goal)} // Pass the specific goal to the delete handler
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors relative z-10 cursor-pointer"
                title="Cancel Goal"
              >
                <Trash2Icon size={18} />
              </button>
            )}
            
            {/* If a status badge exists (for inTransit), render it on the right side */}
            {badge && <div className="pointer-events-none">{badge}</div>}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-200 text-slate-800">
      {/* Container to restrict max width on large screens and add padding */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        
        <h1 className="text-4xl sm:text-5xl font-bold text-center mb-6">
          My <span className="text-emerald-600">DreamSaver</span> Dashboard
        </h1>

        <div className="flex flex-col gap-8">
          
          {/* Conditional rendering based on whether data is currently being fetched */}
          {loading ? (
             <div className="animate-pulse space-y-4 max-w-2xl mx-auto w-full">
               <div className="h-32 bg-slate-200 rounded-xl"></div>
               <div className="h-32 bg-slate-200 rounded-xl"></div>
             </div>
          ) : (
            <>
              <section>
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <ClockIcon className="text-emerald-600" /> Active Goals
                </h2>
                {/* Check if there are any active goals to map over */}
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

              {/* 2. COMPLETED GOALS SECTION */}
              {goalSections.completed.length > 0 && (
                <section>
                  <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <CheckCircleIcon className="text-green-600" /> Ready to Redeem
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Render a GoalCard for each completed goal */}
                    {goalSections.completed.map(goal => <GoalCard key={goal.id} goal={goal} type="completed" />)}
                  </div>
                </section>
              )}

              {/* 3. IN TRANSIT SECTION */}
              {goalSections.inTransit.length > 0 && (
                <section>
                  <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Package className="text-indigo-600" /> Orders In Transit
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Render a GoalCard for each in-transit goal */}
                    {goalSections.inTransit.map(goal => <GoalCard key={goal.id} goal={goal} type="inTransit" />)}
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