'use client';

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs"; 
import { Ticket, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react"; 
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
        return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;
    }

    return (
        <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 min-h-screen bg-slate-50">
            
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                    <Ticket className="text-blue-600" size={32} /> My Coupons
                </h1>
                <p className="text-slate-500 mt-2 text-lg">View your available discounts and past usage history.</p>
            </div>

            <div className="mb-12">
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <CheckCircle2 className="text-emerald-500" /> Available to Use
                </h2>
                
                {validCoupons.length === 0 ? (
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500 shadow-sm">
                        No active coupons available right now. Keep shopping to unlock more!
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Iterate over valid coupons and render a card for each */}
                        {validCoupons.map(coupon => (
                            <div key={coupon.code} className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 z-0"></div>
                                
                                <div className="relative z-10 flex justify-between items-start mb-4">
                                    <div>
                                        {/* Discount Badge */}
                                        <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
                                            {coupon.discount}% OFF
                                        </span>
                                        {/* Coupon Code Text */}
                                        <h3 className="font-mono text-2xl font-bold text-slate-900 mt-3 tracking-widest">{coupon.code}</h3>
                                    </div>
                                    {/* Interactive Copy Button */}
                                    <button onClick={() => copyToClipboard(coupon.code)} className="text-sm font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                                        Copy Code
                                    </button>
                                </div>
                                
                                <div className="relative z-10">
                                    <p className="text-slate-600 text-sm mb-3">{coupon.description}</p>
                                    <div className="flex items-center gap-4 text-xs font-medium text-slate-500 border-t border-slate-100 pt-3">
                                        <span className="flex items-center gap-1"><Clock size={14}/> Expires: {new Date(coupon.expiresAt).toLocaleDateString('en-GB')}</span>
                                        <span>Uses Left: {coupon.usageLimit - coupon.timesUsed}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div>
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <XCircle className="text-slate-400" /> Expired or Used
                </h2>
                
                {/* Conditional Rendering: Only show grid if invalid coupons exist */}
                {invalidCoupons.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Iterate over invalid coupons, rendering them with a muted, grayscale aesthetic */}
                        {invalidCoupons.map(coupon => (
                            <div key={coupon.code} className="bg-slate-100 p-5 rounded-2xl border border-slate-200 opacity-75 grayscale-[0.5]">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-mono text-lg font-bold text-slate-500 line-through">{coupon.code}</h3>
                                    {/* Reason for invalidity (e.g., "Expired" or "Max Uses Reached") */}
                                    <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded border border-red-100">
                                        {coupon.reason}
                                    </span>
                                </div>
                                <p className="text-slate-500 text-xs">{coupon.description}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-slate-500 italic">No expired coupons.</p>
                )}
            </div>
        </div>
    );
}