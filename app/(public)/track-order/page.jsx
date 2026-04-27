'use client';

import { useState } from 'react';
import { Search, Loader2, Package, Truck, CheckCircle, Calendar, MapPin, Store, AlertCircle } from 'lucide-react';

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

      if (!res.ok) {
        throw new Error(data.error || "Failed to find tracking information.");
      }

      setDelivery(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusDetails = (status) => {
    switch (status) {
      case 'DELIVERED':
        return { color: 'bg-green-50 border-green-200 text-green-700', icon: <CheckCircle size={24} /> };
      case 'IN_TRANSIT':
      case 'DISPATCHED':
        return { color: 'bg-blue-50 border-blue-200 text-blue-700', icon: <Truck size={24} /> };
      default:
        return { color: 'bg-gray-50 border-gray-200 text-gray-700', icon: <Package size={24} /> };
    }
  };

  return (
    <div className="min-h-[85vh] bg-gray-50 py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* Header & Search Bar */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Track Your Order</h1>
          <p className="text-gray-500">Enter your tracking number below to see the current status of your delivery.</p>
          
          <form onSubmit={handleSearch} className="mt-8 relative max-w-lg mx-auto">
            <div className="relative flex items-center">
              <Search className="absolute left-4 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="e.g., TRK-123456"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
                className="w-full pl-12 pr-32 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-gray-900 font-medium uppercase transition-all"
              />
              <button
                type="submit"
                disabled={loading || !trackingId.trim()}
                className="absolute right-2 px-6 py-2 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition disabled:opacity-50"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : "Track"}
              </button>
            </div>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-700 animate-in fade-in">
            <AlertCircle size={20} />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Tracking Results Card */}
        {delivery && !loading && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 animate-in slide-in-from-bottom-4">
            <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-6">
              <div>
                <p className="text-sm font-bold text-gray-400 tracking-wider uppercase mb-1">Tracking Number</p>
                <p className="text-xl font-mono font-bold text-gray-900">{delivery.trackingNumber}</p>
              </div>
            </div>

            {/* Status Banner */}
            <div className={`p-5 rounded-2xl border mb-8 flex items-center gap-4 ${getStatusDetails(delivery.status).color}`}>
              <div className="p-2 bg-white/50 rounded-xl shrink-0">
                {getStatusDetails(delivery.status).icon}
              </div>
              <div>
                <h3 className="font-bold text-lg uppercase tracking-wide">{delivery.status.replace('_', ' ')}</h3>
                <div className="flex items-center gap-1.5 text-sm opacity-90 mt-1 font-medium">
                  <Calendar size={14} />
                  {delivery.status === 'DELIVERED' 
                    ? `Delivered on ${new Date(delivery.updatedAt).toLocaleDateString('en-GB')}`
                    : `Est. Delivery: ${new Date(delivery.estimatedDate).toDateString()}` 
                  }
                </div>
              </div>
            </div>

            {/* Product & Store Info */}
            <div className="flex items-start gap-5 mb-8">
               {delivery.goal?.product?.images?.[0] ? (
                 <img src={delivery.goal.product.images[0]} alt="Product" className="w-20 h-20 rounded-xl bg-gray-50 object-cover border border-gray-100 shrink-0" />
               ) : (
                 <div className="w-20 h-20 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                   <Package className="text-gray-300" size={24}/>
                 </div>
               )}
               <div>
                 <h3 className="text-lg font-bold text-gray-800 leading-tight">{delivery.goal?.product?.name}</h3>
                 <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-2 font-medium">
                    <Store size={14} /> Sold by {delivery.goal?.product?.store?.name}
                 </div>
               </div>
            </div>

            {/* Destination */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
               <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">Shipping Destination</h4>
               <div className="flex gap-3 text-sm text-gray-700 font-medium">
                 <MapPin size={16} className="mt-0.5 text-gray-400 shrink-0" /> 
                 <span className="leading-relaxed">{delivery.shippingAddress}</span>
               </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}