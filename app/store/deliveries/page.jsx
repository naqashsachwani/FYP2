"use client";

import { useEffect, useState } from "react";
import { Loader2, Package, MapPin, Truck, CheckCircle, User, Clock } from "lucide-react";
import toast from "react-hot-toast";

export default function StoreDeliveriesPage() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeliveries = async () => {
      try {
        // Change this to "/api/store/deliveries" if you also renamed the API folder!
        const res = await fetch("/api/seller/deliveries"); 
        if (!res.ok) throw new Error("Failed to load store deliveries");
        const data = await res.json();
        setDeliveries(data || []);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDeliveries();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-indigo-600 w-10 h-10" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <Package className="text-indigo-600" size={32} />
            Store Dispatch & Pickups
          </h1>
          <p className="text-slate-500 mt-2">Manage orders leaving your store and track their delivery status.</p>
        </div>

        {/* Deliveries Grid */}
        {deliveries.length === 0 ? (
          <div className="bg-white p-16 text-center text-slate-500 flex flex-col items-center rounded-3xl border border-slate-200">
            <Truck size={48} className="text-slate-300 mb-4" />
            <p className="font-bold text-lg text-slate-700">No Active Deliveries</p>
            <p className="text-sm">You have no orders currently in the logistics pipeline.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {deliveries.map((delivery) => (
              <div key={delivery.id} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                
                {/* Status Bar */}
                <div className={`p-4 border-b border-slate-100 flex justify-between items-center ${
                  delivery.status === 'ACCEPTED' ? 'bg-orange-50' : 
                  delivery.status === 'DELIVERED' ? 'bg-green-50' : 'bg-blue-50'
                }`}>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${
                    delivery.status === 'ACCEPTED' ? 'bg-orange-100 text-orange-700' : 
                    delivery.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {delivery.status.replace("_", " ")}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400">ID: {delivery.trackingNumber}</span>
                </div>

                <div className="p-6 flex-1">
                  <h3 className="font-bold text-xl text-slate-800 mb-4">{delivery.goal.product?.name}</h3>
                  
                  <div className="space-y-4">
                    {/* Customer Info */}
                    <div className="flex items-start gap-3">
                      <User size={18} className="text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase">Customer / Destination</p>
                        <p className="text-sm font-semibold text-slate-800">{delivery.goal.user?.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{delivery.shippingAddress}</p>
                      </div>
                    </div>

                    {/* Rider Info (If Assigned) */}
                    {delivery.rider ? (
                      <div className="flex items-start gap-3 pt-3 border-t border-slate-100">
                        <Truck size={18} className="text-blue-500 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-blue-500 uppercase">Assigned Rider</p>
                          <p className="text-sm font-semibold text-slate-800">{delivery.rider.user?.name}</p>
                          <p className="text-xs font-mono text-slate-500 mt-0.5">{delivery.rider.vehicleType} - {delivery.rider.vehiclePlate}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-3 border-t border-slate-100 text-sm text-slate-400 italic">
                        Waiting for Admin to assign a rider...
                      </div>
                    )}
                  </div>
                </div>

                {/* ✅ FIXED: Removed OTP Box, Replaced with Clean Status Indicators */}
                <div className="p-5 bg-slate-50 border-t border-slate-100 shrink-0">
                  {delivery.status === 'ACCEPTED' ? (
                    <div className="flex items-center justify-center gap-2 text-blue-700 font-bold p-3 bg-blue-100/50 rounded-xl border border-blue-200">
                      <Clock size={18} className="animate-pulse" /> Rider is on the way to collect
                    </div>
                  ) : delivery.status === 'PICKED_UP' || delivery.status === 'IN_TRANSIT' ? (
                    <div className="flex items-center justify-center gap-2 text-indigo-700 font-bold p-3 bg-indigo-100/50 rounded-xl border border-indigo-200">
                      <Truck size={18} /> Package is in transit to customer
                    </div>
                  ) : delivery.status === 'DELIVERED' ? (
                    <div className="flex items-center justify-center gap-2 text-green-700 font-bold p-3 bg-green-100/50 rounded-xl border border-green-200">
                      <CheckCircle size={18} /> Delivery Successfully Completed
                    </div>
                  ) : delivery.status === 'FAILED' ? (
                    <div className="text-center text-sm text-red-600 font-bold p-3 bg-red-50 rounded-xl border border-red-100">
                      Delivery Attempt Failed
                    </div>
                  ) : (
                    <div className="text-center text-sm text-slate-500 p-2">
                      Waiting for Rider Acceptance...
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}