// this component on the client side, allowing us to use React hooks like useState and useEffect.
'use client'

import { useEffect, useState } from "react";
import Image from "next/image"; // image component for better performance
import Link from "next/link";   // routing component for client-side navigation
// lightweight, scalable SVG icons
import { TruckIcon, XCircleIcon, History } from "lucide-react"; 

export default function GoalHistoryPage() {
  // Pull the currency symbol from environment variables.If it's not set in the .env file, it safely defaults to "Rs".
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "Rs";

  // ================= STATE MANAGEMENT =================
  // historySections holds our data. We initialize it as an object with two empty arrays so we can separate our data into 'delivered' and 'cancelled' categories immediately.
  const [historySections, setHistorySections] = useState({
    delivered: [], 
    cancelled: []
  });
  
  // loading state controls the UI. It starts as true because we need to fetch data as soon as the component mounts.
  const [loading, setLoading] = useState(true);

  // ================= DATA FETCHING =================
  // An function to grab the user's history from our backend API.
  const fetchHistory = async () => {
    try {
      setLoading(true); // Ensure loading is true when a fetch starts
      
      // Fetch data. 'cache: "no-store"' tells Next.js NOT to cache this response, ensuring the user always sees their most up-to-date, real-time history.
      const res = await fetch("/api/goals/history", { cache: "no-store" });
      const data = await res.json();
      
      // Create a temporary object to hold our sorted data before updating state. This prevents multiple re-renders.
      const sections = {
        delivered: [],
        cancelled: []
      };

      // Loop through the fetched goals (defaulting to an empty array if data.goals is undefined)
      for (const goal of (data.goals || [])) {
          // Categorization Logic 1: Cancelled or Refunded goals
          if (goal.status === 'CANCELLED' || goal.status === 'REFUNDED') {
              sections.cancelled.push(goal);
          }
          // Categorization Logic 2: Goals that have a nested delivery object marked as DELIVERED
          else if (goal.delivery?.status === 'DELIVERED') {
              sections.delivered.push(goal);
          }
      }

      // Update the React state with our newly sorted data object.
      setHistorySections(sections);

    } catch (err) {
      // Log errors to the console for debugging if the fetch fails
      console.error("Error fetching history:", err);
    } finally {
      // The finally block executes regardless of whether the try block succeeded or caught an error.
      // This guarantees the loading spinner/skeleton will always turn off.
      setLoading(false);
    }
  };

  // The useEffect hook runs side effects.The empty dependency array [] means this will ONLY run once when the component first mounts.
  useEffect(() => {
    fetchHistory();
  }, []);

  // ================= HELPER COMPONENT: HistoryCard =================
  // Instead of writing the same HTML twice for delivered and cancelled items, a reusable mini-component that accepts the 'goal' data and a 'type' string.
  const HistoryCard = ({ goal, type }) => {
    // Default styling and icon
    let statusColor = "bg-white border-slate-200";
    let icon = null;

    // Dynamically adjust colors and icons based on the 'type' prop
    if (type === 'delivered') { 
        statusColor = "bg-blue-50/50 border-blue-200"; 
        icon = <TruckIcon size={16} className="text-blue-600"/>; 
    }
    if (type === 'cancelled') { 
        statusColor = "bg-red-50/50 border-red-200 opacity-75"; 
        icon = <XCircleIcon size={16} className="text-red-500"/>; 
    }

    // Determine target URL for clicking the card. We only want a clickable link if the item is 'delivered' AND has a valid delivery ID.
    // Otherwise, we set it to "#" (a dead link).
    const targetLink = type === 'delivered' && goal.delivery?.id 
      ? `/tracking/${goal.delivery.id}` 
      : "#";

    return (
      // The outer container. 'group' allows child elements to react to hover on this parent. 'relative' is required so the absolute positioned <Link> covers it properly.
      <div className={`group relative p-4 border rounded-xl transition-all duration-300 hover:shadow-md ${statusColor}`}>
        
        {/* If targetLink is valid, create an invisible clickable layer over the entire card */}
        {targetLink !== "#" && (
            <Link href={targetLink} className="absolute inset-0 z-0" />
        )}

        {/* 'pointer-events-none' ensures clicking text doesn't interfere with the absolute Link layer above */}
        <div className="flex gap-4 items-start relative pointer-events-none"> 
          
          {/* Image Container */}
          <div className="h-16 w-16 bg-white rounded-lg overflow-hidden flex-shrink-0 border border-slate-200 relative">
            
            {/*IMAGE EXTRACTION LOGIC: Databases can be messy. Images might be stored as a single string, or an array of strings.
               This block safely figures out what format the image is in before trying to render it.
            */}
            {(() => {
              const rawImages = goal.product?.images;
              let imageSrc = '';

              // Check if it's a single string URL
              if (typeof rawImages === 'string') {
                imageSrc = rawImages; 
              } 
              // Check if it's an array, and grab the first item if it exists
              else if (Array.isArray(rawImages) && rawImages.length > 0) {
                imageSrc = rawImages[0]; 
              }

              // If we successfully found a valid, non-empty string, render the Next.js Image
              if (imageSrc && typeof imageSrc === 'string' && imageSrc.trim() !== '') {
                return (
                  <Image
                    src={imageSrc}
                    alt={goal.product?.name || 'Product image'}
                    fill // Fills the parent 16x16 div
                    className="object-cover" // Ensures the image isn't squished
                  />
                );
              } 
              // Fallback UI if no image exists in the database
              else {
                return (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                    No Img
                  </div>
                );
              }
            })()}
          </div>

          {/* Text Content Container */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              {/* Product Name. 'truncate' adds "..." if the title is too long for the card */}
              <h3 className="font-semibold text-slate-800 truncate pr-2">{goal.product?.name}</h3>
              {icon}
            </div>
            
            {/* Format the target amount with commas (e.g., 1000 -> 1,000) */}
            <p className="text-xs text-slate-500 mt-1">Target: {currency}{Number(goal.targetAmount).toLocaleString()}</p>
            
            {/* Conditional Status Messages */}
            {type === 'delivered' && <p className="text-xs text-blue-600 mt-2 font-medium">Successfully Delivered</p>}
            {type === 'cancelled' && <p className="text-xs text-red-500 mt-2 font-medium">Cancelled / Refunded</p>}
          </div>
        </div>

        {/* Footer of the Card: Shows amount saved and the date */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100/60 relative pointer-events-none">
            <div className="text-sm font-medium text-slate-600">
              <span className="text-xs text-slate-400 mr-1">SAVED:</span> 
              <span className="text-slate-700">
                {currency}{Number(goal.saved).toLocaleString()}
              </span>
            </div>
            <div className="text-xs text-slate-400">
              {/* Converts the ISO timestamp from the database into a readable local date (MM/DD/YYYY) */}
              {new Date(goal.updatedAt).toLocaleDateString()}
            </div>
        </div>
      </div>
    );
  };

  // ================= MAIN COMPONENT RENDER =================
  return (
    // Global page wrapper with a subtle background gradient
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-200 text-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        
        {/* Page Header */}
        <div className="flex items-center justify-center gap-3 mb-10">
            <History className="text-emerald-600 w-10 h-10" />
            <h1 className="text-4xl sm:text-5xl font-bold text-center">
                Goal <span className="text-emerald-600">History</span>
            </h1>
        </div>

        <div className="flex flex-col gap-8">
          {/* Conditional Rendering: Show loading skeleton or actual data */}
          {loading ? (
             // LOADING SKELETON: Pulses to indicate background activity
             <div className="animate-pulse space-y-4 max-w-2xl mx-auto w-full">
               <div className="h-32 bg-slate-200 rounded-xl"></div>
               <div className="h-32 bg-slate-200 rounded-xl"></div>
             </div>
          ) : (
            // FRAGMENT (<></>): Used to wrap multiple siblings without adding an extra DOM node
            <>
              {/* --- 1. DELIVERED HISTORY SECTION --- */}
              <section>
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <TruckIcon className="text-blue-600" /> Delivered Orders
                </h2>
                
                {/* Check if we have delivered goals. If yes, map them to cards. If no, show empty state. */}
                {historySections.delivered.length > 0 ? (
                  // CSS Grid: 1 column on mobile, 2 columns on medium screens and larger
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* map() loops through the array and creates a HistoryCard for each item */}
                    {historySections.delivered.map(goal => <HistoryCard key={goal.id} goal={goal} type="delivered" />)}
                  </div>
                ) : (
                  // Empty State Fallback
                  <div className="text-center py-6 bg-white rounded-xl border border-dashed border-slate-200 text-slate-500 text-sm">
                    No delivered goals yet.
                  </div>
                )}
              </section>

              {/* --- 2. CANCELLED GOALS SECTION --- */}
              <section className="mt-6">
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <XCircleIcon className="text-red-500" /> Cancelled & Refunded
                </h2>
                
                {/* Check if we have cancelled goals. */}
                {historySections.cancelled.length > 0 ? (
                  // We add a slight opacity drop here to visually distinguish 'failed' goals from successful ones
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-80 hover:opacity-100 transition-opacity">
                    {historySections.cancelled.map(goal => <HistoryCard key={goal.id} goal={goal} type="cancelled" />)}
                  </div>
                ) : (
                  // Empty State Fallback
                  <div className="text-center py-6 bg-white rounded-xl border border-dashed border-slate-200 text-slate-500 text-sm">
                    No cancelled goals.
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}