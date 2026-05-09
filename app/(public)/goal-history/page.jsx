'use client'

import { useEffect, useState } from "react";
import Image from "next/image"; 
import Link from "next/link";   
import { TruckIcon, XCircleIcon, History, Search, ChevronLeft, ChevronRight, PackageX } from "lucide-react"; 

export default function GoalHistoryPage() {
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "Rs";

  const [historySections, setHistorySections] = useState({
    delivered: [], 
    cancelled: []
  });
  
  const [loading, setLoading] = useState(true);

  // Search & Pagination States
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPageDelivered, setCurrentPageDelivered] = useState(1);
  const [currentPageCancelled, setCurrentPageCancelled] = useState(1);
  const ITEMS_PER_PAGE = 8; 

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

  useEffect(() => {
    setCurrentPageDelivered(1);
    setCurrentPageCancelled(1);
  }, [searchTerm]);

  // Deep Search Function (Now includes exact and partial ID matches)
  const matchesSearch = (goal) => {
    if (!searchTerm) return true;
    
    const term = searchTerm.toLowerCase();
    const productName = (goal.product?.name || "").toLowerCase();
    const status = (goal.status || "").toLowerCase();
    const targetAmount = String(goal.targetAmount || "");
    const savedAmount = String(goal.saved || "");
    const date = new Date(goal.updatedAt).toLocaleDateString('en-GB').toLowerCase();
    const fullId = (goal.id || "").toLowerCase(); // Matches full ID
    const shortId = (goal.shortId || "").toLowerCase(); // Matches short ID

    return (
      productName.includes(term) ||
      status.includes(term) ||
      targetAmount.includes(term) ||
      savedAmount.includes(term) ||
      date.includes(term) ||
      fullId.includes(term) ||
      shortId.includes(term)
    );
  };

  const filteredDelivered = historySections.delivered.filter(matchesSearch);
  const filteredCancelled = historySections.cancelled.filter(matchesSearch);

  const totalPagesDelivered = Math.max(1, Math.ceil(filteredDelivered.length / ITEMS_PER_PAGE));
  const currentDelivered = filteredDelivered.slice(
    (currentPageDelivered - 1) * ITEMS_PER_PAGE, 
    currentPageDelivered * ITEMS_PER_PAGE
  );

  const totalPagesCancelled = Math.max(1, Math.ceil(filteredCancelled.length / ITEMS_PER_PAGE));
  const currentCancelled = filteredCancelled.slice(
    (currentPageCancelled - 1) * ITEMS_PER_PAGE, 
    currentPageCancelled * ITEMS_PER_PAGE
  );

  const HistoryCard = ({ goal, type }) => {
    let statusColor = "bg-white border-slate-200";
    let icon = null;

    if (type === 'delivered') { 
        statusColor = "bg-blue-50/50 border-blue-200 hover:border-blue-300"; 
        icon = <TruckIcon size={16} className="text-blue-600 sm:w-5 sm:h-5"/>; 
    }
    if (type === 'cancelled') { 
        statusColor = "bg-red-50/50 border-red-200 opacity-90 sm:opacity-75 hover:opacity-100 hover:border-red-300"; 
        icon = <XCircleIcon size={16} className="text-red-500 sm:w-5 sm:h-5"/>; 
    }

    const targetLink = type === 'delivered' && goal.delivery?.id 
      ? `/tracking/${goal.delivery.id}` 
      : "#";

    return (
      <div className={`group relative p-4 sm:p-5 border rounded-xl sm:rounded-2xl transition-all duration-300 hover:shadow-md ${statusColor}`}>
        
        {targetLink !== "#" && (
            <Link href={targetLink} className="absolute inset-0 z-0" />
        )}

        <div className="flex gap-3 sm:gap-4 items-start relative pointer-events-none"> 
          
          <div className="h-16 w-16 sm:h-20 sm:w-20 bg-white rounded-lg overflow-hidden shrink-0 border border-slate-200 relative mt-1">
            {(() => {
              const rawImages = goal.product?.images;
              let imageSrc = '';

              if (typeof rawImages === 'string') {
                try {
                  const parsed = JSON.parse(rawImages);
                  if (Array.isArray(parsed) && parsed.length > 0) imageSrc = parsed[0];
                  else imageSrc = rawImages;
                } catch (e) {
                  imageSrc = rawImages; 
                }
              } else if (Array.isArray(rawImages) && rawImages.length > 0) {
                imageSrc = rawImages[0]; 
              }

              if (imageSrc && typeof imageSrc === 'string' && imageSrc.trim() !== '') {
                return (
                  <Image src={imageSrc} alt={goal.product?.name || 'Product'} fill className="object-cover" />
                );
              } else {
                return (
                  <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">No Img</div>
                );
              }
            })()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-1 gap-2">
              <div className="min-w-0">
                {/* Visual ID Badge */}
                <span className="inline-block text-[9px] sm:text-[10px] font-mono font-bold bg-white text-slate-500 px-1.5 sm:px-2 py-0.5 rounded shadow-sm border border-slate-200 mb-1.5 tracking-wider">
                  #{goal.shortId}
                </span>
                <h3 className="font-bold text-slate-800 text-sm sm:text-lg truncate leading-tight w-full">{goal.product?.name}</h3>
              </div>
              <div className="shrink-0 mt-0.5 sm:mt-1 bg-white p-1 sm:p-1.5 rounded-md sm:rounded-lg shadow-sm border border-slate-100">{icon}</div>
            </div>
            
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1 font-medium">Target: {currency}{Number(goal.targetAmount).toLocaleString()}</p>
            
            {type === 'delivered' && <p className="text-[10px] sm:text-sm text-blue-600 mt-1 sm:mt-1.5 font-bold uppercase tracking-wide">Successfully Delivered</p>}
            {type === 'cancelled' && <p className="text-[10px] sm:text-sm text-red-500 mt-1 sm:mt-1.5 font-bold uppercase tracking-wide">Cancelled / Refunded</p>}
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-slate-200/60 relative pointer-events-none">
            <div className="text-sm sm:text-base font-medium text-slate-600 flex items-center gap-1.5 sm:gap-2">
              <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-widest bg-white px-2 py-0.5 rounded border border-slate-100">Saved</span> 
              <span className="text-slate-800 font-black font-mono">
                {currency}{Number(goal.saved).toLocaleString()}
              </span>
            </div>
            <div className="text-[10px] sm:text-xs text-slate-400 font-bold">
              {new Date(goal.updatedAt).toLocaleDateString('en-GB')}
            </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-800 pb-16 sm:pb-20">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-14">
        
        {/* Header */}
        <div className="flex flex-col items-center justify-center gap-2.5 sm:gap-4 mb-6 sm:mb-10 text-center">
            <div className="flex items-center gap-2 sm:gap-3">
              <History className="text-emerald-600 w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10" />
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
                  Goal <span className="text-emerald-600">History</span>
              </h1>
            </div>
            <p className="text-slate-500 text-xs sm:text-sm font-medium px-2">Track your delivered goals and past refunds.</p>
        </div>

        {/* Global Search Bar - Updated Placeholder to mention ID */}
        <div className="relative w-full max-w-3xl mx-auto mb-8 sm:mb-10">
            <Search className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input 
              type="text" 
              placeholder="Search by ID, product, status, amount, or date..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 bg-white border border-slate-200 rounded-xl sm:rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow text-xs sm:text-sm font-medium" 
            />
        </div>

        <div className="flex flex-col gap-6 sm:gap-10">
          {loading ? (
             <div className="animate-pulse space-y-4 sm:space-y-6 w-full max-w-5xl mx-auto">
               <div className="h-32 sm:h-48 bg-slate-200 rounded-2xl"></div>
               <div className="h-32 sm:h-48 bg-slate-200 rounded-2xl"></div>
             </div>
          ) : (
            <>
              {/* DELIVERED SECTION */}
              <section className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm max-w-6xl mx-auto w-full">
                <h2 className="text-lg sm:text-2xl font-bold text-slate-800 mb-4 sm:mb-6 flex items-center gap-2">
                  <TruckIcon className="text-blue-600 w-5 h-5 sm:w-6 sm:h-6" /> Delivered Orders
                  <span className="ml-1.5 sm:ml-2 text-[10px] sm:text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {filteredDelivered.length}
                  </span>
                </h2>
                
                {filteredDelivered.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                      {currentDelivered.map(goal => <HistoryCard key={goal.id} goal={goal} type="delivered" />)}
                    </div>
                    
                    {totalPagesDelivered > 1 && (
                      <div className="flex items-center justify-between mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-100">
                        <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Page {currentPageDelivered} of {totalPagesDelivered}
                        </span>
                        <div className="flex gap-1.5 sm:gap-2">
                          <button onClick={() => setCurrentPageDelivered(p => Math.max(1, p - 1))} disabled={currentPageDelivered === 1} className="p-1.5 sm:p-2 border border-slate-200 rounded-lg sm:rounded-xl bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors text-slate-600 shadow-sm"><ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5"/></button>
                          <button onClick={() => setCurrentPageDelivered(p => Math.min(totalPagesDelivered, p + 1))} disabled={currentPageDelivered === totalPagesDelivered} className="p-1.5 sm:p-2 border border-slate-200 rounded-lg sm:rounded-xl bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors text-slate-600 shadow-sm"><ChevronRight className="w-4 h-4 sm:w-5 sm:h-5"/></button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-10 sm:py-12 bg-slate-50 rounded-xl sm:rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs sm:text-sm font-medium flex flex-col items-center justify-center">
                    <PackageX className="w-8 h-8 sm:w-10 sm:h-10 text-slate-300 mb-2 sm:mb-3" />
                    {searchTerm ? `No delivered goals match "${searchTerm}"` : "No delivered goals yet."}
                  </div>
                )}
              </section>

              {/* CANCELLED & REFUNDED SECTION */}
              <section className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm max-w-6xl mx-auto w-full">
                <h2 className="text-lg sm:text-2xl font-bold text-slate-800 mb-4 sm:mb-6 flex items-center gap-2">
                  <XCircleIcon className="text-red-500 w-5 h-5 sm:w-6 sm:h-6" /> Cancelled & Refunded
                  <span className="ml-1.5 sm:ml-2 text-[10px] sm:text-xs font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                    {filteredCancelled.length}
                  </span>
                </h2>
                
                {filteredCancelled.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                      {currentCancelled.map(goal => <HistoryCard key={goal.id} goal={goal} type="cancelled" />)}
                    </div>

                    {totalPagesCancelled > 1 && (
                      <div className="flex items-center justify-between mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-100">
                        <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Page {currentPageCancelled} of {totalPagesCancelled}
                        </span>
                        <div className="flex gap-1.5 sm:gap-2">
                          <button onClick={() => setCurrentPageCancelled(p => Math.max(1, p - 1))} disabled={currentPageCancelled === 1} className="p-1.5 sm:p-2 border border-slate-200 rounded-lg sm:rounded-xl bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors text-slate-600 shadow-sm"><ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5"/></button>
                          <button onClick={() => setCurrentPageCancelled(p => Math.min(totalPagesCancelled, p + 1))} disabled={currentPageCancelled === totalPagesCancelled} className="p-1.5 sm:p-2 border border-slate-200 rounded-lg sm:rounded-xl bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors text-slate-600 shadow-sm"><ChevronRight className="w-4 h-4 sm:w-5 sm:h-5"/></button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-10 sm:py-12 bg-slate-50 rounded-xl sm:rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs sm:text-sm font-medium flex flex-col items-center justify-center">
                    <History className="w-8 h-8 sm:w-10 sm:h-10 text-slate-300 mb-2 sm:mb-3" />
                    {searchTerm ? `No cancelled goals match "${searchTerm}"` : "No cancelled goals."}
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