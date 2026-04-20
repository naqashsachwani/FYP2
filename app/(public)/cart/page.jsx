// Marks this Next.js component as a Client Component, allowing the use of React hooks (useState, useEffect) and DOM events
'use client'

// Importing necessary React hooks for managing state and side effects
import { useEffect, useState } from "react";
// Importing Next.js optimized Image component for handling pictures efficiently
import Image from "next/image";
// Importing Next.js Link component for client-side navigation between routes
import Link from "next/link"; 
// Importing specific SVG icons from the lucide-react library for UI enhancement
import { Trash2Icon, CheckCircleIcon, ClockIcon, Package } from "lucide-react"; 

// Main functional component for the Cart/Dashboard page
export default function CartPage() {
  // Retrieves the currency symbol from environment variables, defaulting to "Rs" if not found
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
  // Asynchronous function to fetch user goals from the backend API
  const fetchGoals = async () => {
    try {
      // Set loading to true right before starting the fetch request
      setLoading(true);
      // Fetch goals data from the custom API route, bypassing the cache to always get fresh data
      const res = await fetch("/api/goals", { cache: "no-store" });
      // Parse the JSON response returned by the API
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
          // Create a new object that copies the existing goal data and adds the newly calculated 'saved' total
          const processedGoal = { ...goal, saved: totalSaved };
          
          // Check if a delivery object exists for this specific goal (returns a boolean)
          const hasDelivery = !!goal.delivery;
          // Extract the delivery status safely using optional chaining (?.)
          const deliveryStatus = goal.delivery?.status; 

          // Skip processing for goals that are cancelled, refunded, or already delivered 
          // (As noted, these belong on a separate Goal History page)
          if (goal.status === 'CANCELLED' || goal.status === 'REFUNDED' || goal.status === 'DELIVERED' || deliveryStatus === 'DELIVERED') {
              continue; // Move to the next iteration of the loop
          }
          // If the goal hasn't been delivered but has a delivery object attached, it's currently in transit
          else if (hasDelivery) {
              sections.inTransit.push(processedGoal);
          }
          // If the goal's main status is marked as COMPLETED, push it to the completed section
          else if (goal.status === 'COMPLETED') {
              sections.completed.push(processedGoal);
          }
          // If it doesn't match any of the above, it means the user is still actively saving for it
          else {
              sections.active.push(processedGoal);
          }
      }

      // Update the React state with our newly populated and categorized sections
      setGoalSections(sections);

    } catch (err) {
      // If the fetch fails (network error, API down, etc.), log the error to the browser console
      console.error("Error fetching goals:", err);
    } finally {
      // Regardless of success or failure, turn off the loading skeleton/spinner
      setLoading(false);
    }
  };

  // Asynchronous handler function triggered when a user clicks the trash icon to delete/cancel a goal
  const handleDeleteGoal = async (e, goal) => {
    // Determine if the user has actually deposited money into this goal yet
    const hasFunds = Number(goal.saved) > 0;
    let message = ""; // Variable to hold the confirmation prompt message

    // If the user has funds, apply the business logic: 20% cancellation fee penalty
    if (hasFunds) {
      // Calculate 20% of the total saved amount and round it to 0 decimal places
      const deductionAmount = (Number(goal.saved) * 0.20).toFixed(0);
      // Construct the warning message showing the exact deduction amount dynamically
      message = `⚠️ CANCELLATION WARNING ⚠️\n\nA 20% cancellation fee (${currency} ${deductionAmount}) will be deducted.\n\nAre you sure?`;
    } else {
      // Standard deletion message if no money is involved
      message = "Delete this goal? This cannot be undone.";
    }

    // Trigger the browser's native confirmation dialog. If the user clicks "Cancel", stop execution here
    if (!confirm(message)) return;

    try {
      // Send a DELETE request to the specific goal's API endpoint using its ID
      const res = await fetch(`/api/goals/${goal.id}`, { method: "DELETE" });
      
      // If the server responds with a success status (200-299)
      if (res.ok) {
        // Re-fetch the goals to update the UI and remove the deleted goal from the list
        fetchGoals(); 
        // Alert the user that a refund was processed if they had funds in it
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

  // React useEffect hook to run side effects. 
  // The empty dependency array [] means this runs EXACTLY ONCE when the component first mounts
  useEffect(() => {
    fetchGoals();
  }, []);

  // ================= REUSABLE COMPONENT: GOAL CARD =================
  // Internal component that takes a 'goal' object and a 'type' string ('active', 'completed', 'inTransit') as props
  const GoalCard = ({ goal, type }) => {
    // Calculate the percentage of completion. 
    // Uses Math.min to ensure it never exceeds 100% and Math.round for a clean whole number.
    // Handles divide-by-zero risks by checking if targetAmount > 0.
    const percent = goal.targetAmount > 0 
      ? Math.min(Math.round((goal.saved / goal.targetAmount) * 100), 100)
      : 0;

    // Define default styles, icons, and badges before overriding them based on 'type'
    let statusColor = "bg-white border-slate-200";
    let icon = null;
    let badge = null;

    // Conditional styling and icon assignment based on the category of the goal
    if (type === 'active') icon = <ClockIcon size={16} className="text-slate-400"/>;
    if (type === 'completed') { 
        statusColor = "bg-green-50/50 border-green-200"; // Light green background for completed items
        icon = <CheckCircleIcon size={16} className="text-green-600"/>; 
    }
    if (type === 'inTransit') { 
        statusColor = "bg-indigo-50/50 border-indigo-200"; // Light indigo background for shipped items
        icon = <Package size={16} className="text-indigo-600"/>; 
        // Generates a visual badge showing the current shipping status text
        badge = <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-bold">{goal.delivery?.status}</span>;
    }

    // Logic to determine where the user should go when they click the card
    let targetLink = "#"; // Default fallback
    if (goal.delivery?.id) {
        // If it's already in transit/has delivery ID, take them to the tracking page
        targetLink = `/tracking/${goal.delivery.id}`;
    } else {
        // Otherwise, take them to the specific goal details page
        targetLink = `/goals/${goal.id}`;
    }

    // Render the actual card UI
    return (
      // Main container with hover effects and dynamic background colors based on the statusColor variable
      <div className={`group relative p-4 border rounded-xl transition-all duration-300 hover:shadow-md ${statusColor}`}>
        {/* Invisible Link overlay that makes the entire card clickable and routes to the targetLink */}
        <Link href={targetLink} className="absolute inset-0 z-0" />

        {/* Content wrapper. pointer-events-none ensures clicks pass through to the Link component underneath */}
        <div className="flex gap-4 items-start relative pointer-events-none"> 
          
          {/* Container for the product image, forcing a square aspect ratio (h-16 w-16) */}
          <div className="h-16 w-16 bg-white rounded-lg overflow-hidden flex-shrink-0 border border-slate-200 relative">
            {/* FIXED IMAGE LOGIC: Using an Immediately Invoked Function Expression (IIFE) to handle complex image parsing */}
            {(() => {
              // Extract the raw image data from the nested product object
              const rawImages = goal.product?.images;
              let imageSrc = ''; // Initialize an empty string for the final resolved source

              // Check if the database stored the image as a plain string URL
              if (typeof rawImages === 'string') {
                imageSrc = rawImages; 
              } 
              // Check if the database stored the images as an array of URLs
              else if (Array.isArray(rawImages) && rawImages.length > 0) {
                imageSrc = rawImages[0]; // Pick the first image from the array
              }

              // Final validation: Ensure the resolved source is actually a non-empty string
              if (imageSrc && typeof imageSrc === 'string' && imageSrc.trim() !== '') {
                // Return Next.js Image component, using 'fill' to cover the parent div
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
            {/* Top row: Product Name and either the percentage badge (active) or an Icon (completed/transit) */}
            <div className="flex justify-between items-start">
              {/* Product name, truncating with ellipses if it gets too long */}
              <h3 className="font-semibold text-slate-800 truncate pr-2">{goal.product?.name}</h3>
              {/* Only render the percentage pill badge if the goal is currently active */}
              {type === 'active' && (
                <span className="text-xs font-bold px-2 py-1 rounded-md bg-slate-100 text-slate-600">
                  {percent}%
                </span>
              )}
              {/* Render the context-specific icon if it is NOT an active goal */}
              {type !== 'active' && icon}
            </div>
            
            {/* Display the total financial target formatted with commas (e.g., Rs 5,000) */}
            <p className="text-xs text-slate-500 mt-1">Target: {currency}{Number(goal.targetAmount).toLocaleString()}</p>

            {/* Render a visual progress bar ONLY for active or completed goals (omitted for in-transit) */}
            {(type === 'active' || type === 'completed') && (
              <div className="mt-3 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                {/* The inner bar that fills up based on the calculated percentage */}
                <div 
                  // Dynamically change the bar color: bright green for completed, emerald for active
                  className={`h-full rounded-full transition-all duration-500 ${type === 'completed' ? "bg-green-500" : "bg-emerald-500"}`}
                  style={{ width: `${percent}%` }} // Inline style to physically set the width
                />
              </div>
            )}
            
            {/* If the item is in transit, display the courier tracking ID right below the target */}
            {type === 'inTransit' && <p className="text-xs text-indigo-600 mt-2 font-medium">Tracking ID: {goal.delivery?.trackingNumber}</p>}
          </div>
        </div>

        {/* Bottom row of the card showing the currently saved amount and action buttons */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100/60 relative">
            <div className="text-sm font-medium text-slate-600 pointer-events-none">
              <span className="text-xs text-slate-400 mr-1">SAVED:</span> 
              {/* Changes text color to darker green if completed, otherwise standard slate */}
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

  // Main Page Render
  return (
    // Outer wrapper establishing the page background gradient and minimum full screen height
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-200 text-slate-800">
      {/* Container to restrict max width on large screens and add padding */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        
        {/* Main page title */}
        <h1 className="text-4xl sm:text-5xl font-bold text-center mb-6">
          My <span className="text-emerald-600">DreamSaver</span> Dashboard
        </h1>

        <div className="flex flex-col gap-8">
          
          {/* Conditional rendering based on whether data is currently being fetched */}
          {loading ? (
             // LOADING STATE: Displays pulsing skeleton loaders to indicate data is on the way
             <div className="animate-pulse space-y-4 max-w-2xl mx-auto w-full">
               <div className="h-32 bg-slate-200 rounded-xl"></div>
               <div className="h-32 bg-slate-200 rounded-xl"></div>
             </div>
          ) : (
            // LOADED STATE: Data has arrived, render the actual sections
            <>
              {/* 1. ACTIVE GOALS SECTION */}
              <section>
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <ClockIcon className="text-emerald-600" /> Active Goals
                </h2>
                {/* Check if there are any active goals to map over */}
                {goalSections.active.length > 0 ? (
                  // Grid layout: 1 column on mobile, 2 columns on medium+ screens
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Render a GoalCard for each active goal */}
                    {goalSections.active.map(goal => <GoalCard key={goal.id} goal={goal} type="active" />)}
                  </div>
                ) : (
                  // Empty state UI if the user has no active savings goals
                  <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-sm">
                    No active savings goals.
                  </div>
                )}
              </section>

              {/* 2. COMPLETED GOALS SECTION */}
              {/* Only render this entire section if the user actually has completed goals */}
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
              {/* Only render this entire section if the user has orders currently being shipped */}
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