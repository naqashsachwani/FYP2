'use client';

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs"; 
import { Ticket, Clock, CheckCircle2, XCircle, Loader2, Copy } from "lucide-react"; 
import toast from "react-hot-toast"; 

export default function MyCouponsPage() {
    // Extracts the getToken function from Clerk to securely authenticate API requests
    const { getToken } = useAuth();
    
    const [validCoupons, setValidCoupons] = useState([]);      
    const [invalidCoupons, setInvalidCoupons] = useState([]); 
    const [loading, setLoading] = useState(true);              

    useEffect(() => {
        const fetchCoupons = async () => {
            try {
                // Retrieves the current user's JWT token
                const token = await getToken();
                
                const res = await fetch('/api/coupon', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                
                // If the response is successful, update the respective state arrays
                if (res.ok) {
                    setValidCoupons(data.validCoupons);
                    setInvalidCoupons(data.invalidCoupons);
                } else {
                    toast.error(data.error);
                }
            } catch (error) {
                toast.error("Failed to load coupons");
            } finally {
                setLoading(false);
            }
        };

        fetchCoupons();
    }, [getToken]); // Dependency array ensures it only re-runs if the auth context changes

    
    // Copies the coupon code to the user's clipboard and triggers a success notification
    const copyToClipboard = (code) => {
        navigator.clipboard.writeText(code);
        toast.success(`${code} copied to clipboard!`);
    };

    // Displays a centered loading spinner while the API request is in progress
    if (loading) {
        return <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600 w-8 h-8 sm:w-10 sm:h-10" /></div>;
    }

    return (
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 min-h-[100dvh] bg-slate-50">
            
            <div className="mb-6 sm:mb-8 text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center justify-center sm:justify-start gap-2 sm:gap-3">
                    <Ticket className="text-blue-600 w-6 h-6 sm:w-8 sm:h-8" /> My Coupons
                </h1>
                <p className="text-slate-500 mt-1.5 sm:mt-2 text-sm sm:text-lg">View your available discounts and past usage history.</p>
            </div>

            <div className="mb-8 sm:mb-12">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-3 sm:mb-4 flex items-center gap-1.5 sm:gap-2">
                    <CheckCircle2 className="text-emerald-500 w-5 h-5 sm:w-6 sm:h-6" /> Available to Use
                </h2>
                
                {validCoupons.length === 0 ? (
                    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 text-center text-slate-500 shadow-sm text-sm sm:text-base">
                        No active coupons available right now. Keep shopping to unlock more!
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                        {/* Iterate over valid coupons and render a card for each */}
                        {validCoupons.map(coupon => (
                            <div key={coupon.code} className="bg-white p-4 sm:p-6 rounded-2xl border border-emerald-100 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 z-0 pointer-events-none"></div>
                                
                                <div className="relative z-10 flex justify-between items-start mb-3 sm:mb-4">
                                    <div className="min-w-0 pr-2">
                                        {/* Discount Badge */}
                                        <span className="bg-emerald-100 text-emerald-800 text-[10px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 rounded-full">
                                            {coupon.discount}% OFF
                                        </span>
                                        {/* Coupon Code Text */}
                                        <h3 className="font-mono text-xl sm:text-2xl font-bold text-slate-900 mt-2 sm:mt-3 tracking-widest truncate">{coupon.code}</h3>
                                    </div>
                                    {/* Interactive Copy Button */}
                                    <button 
                                        onClick={() => copyToClipboard(coupon.code)} 
                                        className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shrink-0"
                                    >
                                        <Copy size={14} className="sm:hidden" />
                                        <span className="hidden sm:inline">Copy Code</span>
                                    </button>
                                </div>
                                
                                <div className="relative z-10">
                                    <p className="text-slate-600 text-xs sm:text-sm mb-3">{coupon.description}</p>
                                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[10px] sm:text-xs font-medium text-slate-500 border-t border-slate-100 pt-3">
                                        <span className="flex items-center gap-1"><Clock size={12} className="sm:w-[14px] sm:h-[14px]"/> Expires: {new Date(coupon.expiresAt).toLocaleDateString('en-GB')}</span>
                                        <span>Uses Left: {coupon.usageLimit - coupon.timesUsed}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-3 sm:mb-4 flex items-center gap-1.5 sm:gap-2">
                    <XCircle className="text-slate-400 w-5 h-5 sm:w-6 sm:h-6" /> Expired or Used
                </h2>
                
                {/* Conditional Rendering: Only show grid if invalid coupons exist */}
                {invalidCoupons.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {/* Iterate over invalid coupons, rendering them with a muted, grayscale aesthetic */}
                        {invalidCoupons.map(coupon => (
                            <div key={coupon.code} className="bg-slate-100 p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 opacity-80 sm:opacity-75 grayscale-[0.3] sm:grayscale-[0.5]">
                                <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
                                    <h3 className="font-mono text-base sm:text-lg font-bold text-slate-500 line-through truncate max-w-[60%]">{coupon.code}</h3>
                                    {/* Reason for invalidity (e.g., "Expired" or "Max Uses Reached") */}
                                    <span className="text-[10px] sm:text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 sm:py-1 rounded border border-red-100 shrink-0">
                                        {coupon.reason}
                                    </span>
                                </div>
                                <p className="text-slate-500 text-[10px] sm:text-xs line-clamp-2">{coupon.description}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs sm:text-sm text-slate-500 italic bg-white p-4 rounded-xl border border-dashed border-slate-200 text-center">No expired coupons.</p>
                )}
            </div>
        </div>
    );
}