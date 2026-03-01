'use client'

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link"; 
import { TruckIcon, XCircleIcon, History } from "lucide-react"; 

export default function GoalHistoryPage() {
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "Rs";

  const [historySections, setHistorySections] = useState({
    delivered: [], 
    cancelled: []
  });
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/goals/history", { cache: "no-store" });
      const data = await res.json();
      
      const sections = {
        delivered: [],
        cancelled: []
      };

      for (const goal of (data.goals || [])) {
          if (goal.status === 'CANCELLED' || goal.status === 'REFUNDED') {
              sections.cancelled.push(goal);
          }
          else if (goal.delivery?.status === 'DELIVERED') {
              sections.delivered.push(goal);
          }
      }

      setHistorySections(sections);

    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Reusable Component tailored for history
  const HistoryCard = ({ goal, type }) => {
    let statusColor = "bg-white border-slate-200";
    let icon = null;

    if (type === 'delivered') { 
        statusColor = "bg-blue-50/50 border-blue-200"; 
        icon = <TruckIcon size={16} className="text-blue-600"/>; 
    }
    if (type === 'cancelled') { 
        statusColor = "bg-red-50/50 border-red-200 opacity-75"; 
        icon = <XCircleIcon size={16} className="text-red-500"/>; 
    }

    // Determine target URL (Only map to tracking if it was delivered)
    const targetLink = type === 'delivered' && goal.delivery?.id 
      ? `/tracking/${goal.delivery.id}` 
      : "#";

    return (
      <div className={`group relative p-4 border rounded-xl transition-all duration-300 hover:shadow-md ${statusColor}`}>
        {targetLink !== "#" && (
            <Link href={targetLink} className="absolute inset-0 z-0" />
        )}

        <div className="flex gap-4 items-start relative pointer-events-none"> 
          <div className="h-16 w-16 bg-white rounded-lg overflow-hidden flex-shrink-0 border border-slate-200 relative">
            {/* FIXED IMAGE LOGIC */}
            {(() => {
              // Determine the image source – could be a string or an array
              const rawImages = goal.product?.images;
              let imageSrc = '';

              if (typeof rawImages === 'string') {
                imageSrc = rawImages; // single image URL
              } else if (Array.isArray(rawImages) && rawImages.length > 0) {
                imageSrc = rawImages[0]; // first image from array
              }

              // Ensure we have a non‑empty string
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
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                    No Img
                  </div>
                );
              }
            })()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-slate-800 truncate pr-2">{goal.product?.name}</h3>
              {icon}
            </div>
            
            <p className="text-xs text-slate-500 mt-1">Target: {currency}{Number(goal.targetAmount).toLocaleString()}</p>
            
            {type === 'delivered' && <p className="text-xs text-blue-600 mt-2 font-medium">Successfully Delivered</p>}
            {type === 'cancelled' && <p className="text-xs text-red-500 mt-2 font-medium">Cancelled / Refunded</p>}
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100/60 relative pointer-events-none">
            <div className="text-sm font-medium text-slate-600">
              <span className="text-xs text-slate-400 mr-1">SAVED:</span> 
              <span className="text-slate-700">
                {currency}{Number(goal.saved).toLocaleString()}
              </span>
            </div>
            <div className="text-xs text-slate-400">
              {new Date(goal.updatedAt).toLocaleDateString()}
            </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-200 text-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        
        <div className="flex items-center justify-center gap-3 mb-10">
            <History className="text-emerald-600 w-10 h-10" />
            <h1 className="text-4xl sm:text-5xl font-bold text-center">
                Goal <span className="text-emerald-600">History</span>
            </h1>
        </div>

        <div className="flex flex-col gap-8">
          {loading ? (
             <div className="animate-pulse space-y-4 max-w-2xl mx-auto w-full">
               <div className="h-32 bg-slate-200 rounded-xl"></div>
               <div className="h-32 bg-slate-200 rounded-xl"></div>
             </div>
          ) : (
            <>
              {/* 1. DELIVERED HISTORY */}
              <section>
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <TruckIcon className="text-blue-600" /> Delivered Orders
                </h2>
                {historySections.delivered.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {historySections.delivered.map(goal => <HistoryCard key={goal.id} goal={goal} type="delivered" />)}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-white rounded-xl border border-dashed border-slate-200 text-slate-500 text-sm">
                    No delivered goals yet.
                  </div>
                )}
              </section>

              {/* 2. CANCELLED GOALS */}
              <section className="mt-6">
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <XCircleIcon className="text-red-500" /> Cancelled & Refunded
                </h2>
                {historySections.cancelled.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-80 hover:opacity-100 transition-opacity">
                    {historySections.cancelled.map(goal => <HistoryCard key={goal.id} goal={goal} type="cancelled" />)}
                  </div>
                ) : (
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