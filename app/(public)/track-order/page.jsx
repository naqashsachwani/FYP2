'use client';

import { useState } from 'react';
import { Search, Loader2, Package, Truck, CheckCircle, Calendar, MapPin, Store, AlertCircle, ShieldCheck } from 'lucide-react';

export default function PublicTrackingPage() {
  const [trackingId, setTrackingId] = useState("");
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!trackingId.trim()) return;

    setLoading(true);
    setError("");
    setDelivery(null);

    try {
      const res = await fetch(`/api/delivery/track/${trackingId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to find tracking information.");
      setDelivery(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusDetails = (status) => {
    switch (status) {
      case 'DELIVERED': return { color: 'bg-green-50 border-green-200 text-green-700', icon: <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" /> };
      case 'IN_TRANSIT':
      case 'PICKED_UP': return { color: 'bg-blue-50 border-blue-200 text-blue-700', icon: <Truck className="w-5 h-5 sm:w-6 sm:h-6" /> };
      case 'FAILED': return { color: 'bg-red-50 border-red-200 text-red-700', icon: <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" /> };
      default: return { color: 'bg-gray-50 border-gray-200 text-gray-700', icon: <Package className="w-5 h-5 sm:w-6 sm:h-6" /> };
    }
  };

  return (
    <div className="min-h-[100dvh] bg-gray-50 py-8 sm:py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6 sm:space-y-8">
        
        <div className="text-center space-y-3 sm:space-y-4">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">Track Your Order</h1>
          <p className="text-gray-500 text-xs sm:text-sm lg:text-base px-2">Enter your tracking number below to see the current status of your delivery.</p>
          
          <form onSubmit={handleSearch} className="mt-6 sm:mt-8 relative w-full max-w-lg mx-auto">
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 sm:left-4 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text" placeholder="e.g., TRK-123456" value={trackingId}
                onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
                className="w-full pl-9 sm:pl-12 pr-24 sm:pr-32 py-3 sm:py-4 bg-white border border-gray-200 rounded-xl sm:rounded-2xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-gray-900 text-sm sm:text-base font-medium uppercase transition-all"
              />
              <button type="submit" disabled={loading || !trackingId.trim()} className="absolute right-1.5 sm:right-2 px-4 sm:px-6 py-2 sm:py-2.5 bg-green-600 text-white text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 active:scale-95 disabled:active:scale-100 flex items-center justify-center">
                {loading ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin shrink-0" /> : "Track"}
              </button>
            </div>
          </form>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 p-3 sm:p-4 rounded-xl sm:rounded-2xl flex items-center gap-2.5 sm:gap-3 text-red-700 animate-in fade-in shadow-sm">
            <AlertCircle className="w-5 h-5 shrink-0" /> <p className="font-medium text-xs sm:text-sm break-words">{error}</p>
          </div>
        )}

        {delivery && !loading && (
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 p-5 sm:p-6 lg:p-8 animate-in slide-in-from-bottom-4 space-y-5 sm:space-y-6">
            
            <div className="border-b border-gray-100 pb-3 sm:pb-4 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2">
                <div>
                    <p className="text-[10px] sm:text-xs font-bold text-gray-400 tracking-wider uppercase mb-0.5 sm:mb-1">Tracking Number</p>
                    <p className="text-lg sm:text-xl font-mono font-bold text-gray-900 truncate">{delivery.trackingNumber}</p>
                </div>
            </div>

            {/* ✅ NEW: Customer Delivery OTP Box */}
            {(delivery.status === 'PICKED_UP' || delivery.status === 'IN_TRANSIT') && delivery.deliveryCode && (
              <div className="bg-slate-900 p-5 sm:p-6 rounded-xl sm:rounded-2xl text-center shadow-lg border border-slate-700">
                <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-green-400 mb-1.5 sm:mb-2">
                  <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" /> <span className="font-bold text-xs sm:text-sm uppercase tracking-widest">Security OTP</span>
                </div>
                <p className="text-slate-300 text-xs sm:text-sm mb-3 sm:mb-4 px-2">Give this code to your rider when they arrive.</p>
                <div className="text-3xl sm:text-4xl font-mono tracking-[0.2em] sm:tracking-[0.25em] font-extrabold text-white bg-slate-800 py-2.5 sm:py-3 rounded-xl border border-slate-700 shadow-inner break-all">
                  {delivery.deliveryCode}
                </div>
              </div>
            )}

            <div className={`p-4 sm:p-5 rounded-xl sm:rounded-2xl border flex items-center gap-3 sm:gap-4 shadow-sm ${getStatusDetails(delivery.status).color}`}>
              <div className="p-2 sm:p-2.5 bg-white/50 rounded-lg sm:rounded-xl shrink-0">
                {getStatusDetails(delivery.status).icon}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-base sm:text-lg uppercase tracking-wide truncate">{delivery.status.replace('_', ' ')}</h3>
                <div className="flex items-center gap-1.5 text-[10px] sm:text-xs opacity-90 mt-0.5 sm:mt-1 font-medium truncate">
                  <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                  {delivery.status === 'DELIVERED' 
                    ? `Delivered on ${new Date(delivery.updatedAt).toLocaleDateString('en-GB')}`
                    : `Estimated: ${new Date(delivery.estimatedDate).toDateString()}` 
                  }
                </div>
              </div>
            </div>

            {/* ✅ NEW: Rider Details */}
            {delivery.rider && (
              <div className="bg-blue-50 border border-blue-100 p-3 sm:p-4 rounded-xl flex items-center gap-3 sm:gap-4">
                <img src={delivery.rider.user?.image || "/default-avatar.png"} alt="Rider" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white shadow-sm shrink-0" />
                <div className="min-w-0">
                  <p className="text-[9px] sm:text-[10px] font-bold text-blue-500 uppercase tracking-wider">Assigned Rider</p>
                  <p className="font-bold text-blue-900 text-xs sm:text-sm truncate">{delivery.rider.user?.name}</p>
                  <p className="text-[10px] sm:text-xs font-mono text-blue-700 mt-0.5 truncate">{delivery.rider.vehicleType} - {delivery.rider.vehiclePlate}</p>
                </div>
              </div>
            )}

            <div className="flex gap-3 sm:gap-4 items-start border-t border-gray-100 pt-5 sm:pt-6">
               {delivery.goal?.product?.images?.[0] ? (
                 <img src={delivery.goal.product.images[0]} alt="Product" className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg sm:rounded-xl bg-gray-50 object-cover border border-gray-100 shrink-0" />
               ) : (
                 <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg sm:rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                   <Package className="text-gray-300 w-6 h-6 sm:w-8 sm:h-8"/>
                 </div>
               )}
               <div className="min-w-0">
                 <h3 className="text-sm sm:text-lg font-bold text-gray-800 leading-tight line-clamp-2">{delivery.goal?.product?.name}</h3>
                 <div className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2 font-medium truncate">
                    <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> <span className="truncate">Sold by {delivery.goal?.product?.store?.name}</span>
                 </div>
               </div>
            </div>

            <div className="border-t border-gray-100 pt-5 sm:pt-6">
               <h4 className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase mb-2 sm:mb-3 tracking-wider">Destination</h4>
               <div className="flex gap-2 sm:gap-3 text-xs sm:text-sm font-medium text-gray-700 bg-gray-50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-100">
                 <MapPin className="mt-0.5 text-gray-400 shrink-0 w-4 h-4 sm:w-[18px] sm:h-[18px]" /> 
                 <span className="leading-relaxed break-words">{delivery.shippingAddress}</span>
               </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}