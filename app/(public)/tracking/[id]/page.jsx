'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic'; 
import { Loader2, Truck, Calendar, Store, MapPin, ArrowLeft, CheckCircle, ShieldCheck, X } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';

// Dynamically import the map to prevent Next.js SSR errors
const DeliveryMap = dynamic(() => import('@/components/DeliveryMap'), { 
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-slate-100 text-slate-400 font-medium animate-pulse rounded-2xl sm:rounded-3xl">Loading Map...</div>
});

export default function TrackingPage() {
  const params = useParams();
  const id = params?.id; 
  const router = useRouter();

  const [delivery, setDelivery] = useState(null); 
  const [loading, setLoading] = useState(true);   
  const [updating, setUpdating] = useState(false);
  
  // OTP State
  const [otp, setOtp] = useState(""); 
  const [showOtpModal, setShowOtpModal] = useState(false);

  const fetchData = async () => {
    if (!id) return; 
    try {
      const res = await fetch(`/api/delivery/${id}`);
      const data = await res.json();
      if (!data.error) setDelivery(data); 
    } catch (e) { 
      console.error("Fetch Error:", e); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    if (!id) return;
    fetchData(); 
    const interval = setInterval(() => fetchData(), 4000); 
    return () => clearInterval(interval);
  }, [id]);

  const handleConfirmDelivery = async () => {
    // STRICT CHECK: Validate against the permanent database OTP
    if (otp !== delivery?.deliveryCode) {
        return toast.error("Invalid Security OTP. Please check the code on your screen and try again.");
    }
    
    setUpdating(true); 
    try {
      // Send the status update to the backend
      const res = await fetch(`/api/delivery/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DELIVERED' }) 
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      toast.success("Delivery Confirmed Successfully!");
      setShowOtpModal(false); 
      await fetchData(); 
    } catch (error) { 
      toast.error(error.message || "Failed to confirm delivery"); 
    } finally { 
      setUpdating(false); 
    }
  };

  if (loading) return <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-green-600 w-10 h-10" /></div>;
  if (!delivery) return <div className="p-10 text-center font-bold text-slate-500">Tracking information not found.</div>;

  const product = delivery.goal?.product;
  const isDelivered = delivery.status === 'DELIVERED';
  const isReadyForCustomer = delivery.status === 'IN_TRANSIT'; 
  const statusColor = isDelivered ? 'bg-green-50 border-green-200 text-green-700' : 'bg-blue-50 border-blue-200 text-blue-700';

  // The permanent code securely fetched from the database
  const displayOtp = delivery.deliveryCode || "------";

  return (
    <div className="min-h-[100dvh] bg-slate-50 p-3 sm:p-4 md:p-8 flex flex-col">
      <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col">
        
        {/* Top Navigation Bar */}
        <div className="flex justify-between items-center mb-4 sm:mb-6 shrink-0">
          <button onClick={() => router.back()} className="flex items-center text-slate-500 hover:text-slate-900 text-xs sm:text-sm font-bold transition-colors bg-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-slate-200 shadow-sm">
            <ArrowLeft size={16} className="mr-1.5 w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> Back
          </button>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-6 flex-1 min-h-0">
          
          {/* LEFT PANEL: Details & Actions */}
          <div className="lg:col-span-1 bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 p-5 sm:p-6 flex flex-col h-auto lg:h-[calc(100vh-140px)] overflow-y-auto relative z-10 custom-scrollbar">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-1">Track Delivery</h1>
            <p className="text-slate-400 text-[10px] sm:text-xs font-mono font-bold tracking-wider mb-4 sm:mb-6 truncate">ID: {delivery.trackingNumber}</p>
            
            {/* OTP BANNER: Always shows when NOT delivered */}
            {!isDelivered && (
              <div className="bg-slate-900 p-4 sm:p-5 rounded-xl sm:rounded-2xl mb-5 sm:mb-6 shadow-md border border-slate-700 flex justify-between items-center">
                <div className="min-w-0">
                  <p className="text-[9px] sm:text-[10px] text-green-400 font-bold uppercase tracking-widest mb-1 truncate pr-2">Your Security OTP</p>
                  <p className="text-white font-mono text-xl sm:text-2xl font-black tracking-[0.2em]">{displayOtp}</p>
                </div>
                <ShieldCheck className="text-slate-700 w-6 h-6 sm:w-8 sm:h-8 shrink-0" />
              </div>
            )}

            {/* Status Banner */}
            <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border mb-5 sm:mb-6 ${statusColor}`}>
              <div className="flex items-center gap-2 mb-1 sm:mb-1.5 font-bold uppercase tracking-wide text-xs sm:text-sm">
                {isDelivered ? <CheckCircle size={18} className="w-4 h-4 sm:w-[18px] sm:h-[18px] shrink-0" /> : <Truck size={18} className="w-4 h-4 sm:w-[18px] sm:h-[18px] shrink-0" />} 
                {delivery.status.replace('_', ' ')}
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-medium opacity-80 mt-1 sm:mt-2">
                <Calendar size={14} className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                {isDelivered 
                  ? `Delivered on ${new Date(delivery.updatedAt).toLocaleDateString('en-GB')}`
                  : `Estimated: ${new Date(delivery.estimatedDate).toDateString()}` 
                }
              </div>
            </div>

            {/* Rider Details */}
            {delivery.rider && (
              <div className="bg-blue-50 border border-blue-100 p-3 sm:p-4 rounded-xl sm:rounded-2xl flex items-center gap-3 sm:gap-4 mb-5 sm:mb-6">
                <img src={delivery.rider.user?.image || "/default-avatar.png"} alt="Rider" className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white shadow-sm shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] sm:text-[10px] uppercase font-bold text-blue-500 tracking-wider mb-0.5">Assigned Rider</p>
                  <p className="font-bold text-blue-900 text-xs sm:text-sm leading-tight truncate">{delivery.rider.user?.name}</p>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center mt-1 sm:mt-1.5">
                     <p className="text-[10px] sm:text-xs font-mono text-blue-700 font-bold bg-white px-1.5 sm:px-2 py-0.5 rounded shadow-sm border border-blue-200/50 truncate max-w-full">{delivery.rider.vehiclePlate}</p>
                     
                     {delivery.status === 'IN_TRANSIT' && delivery.rider.phoneNumber && (
                        <p className="text-[10px] sm:text-xs font-mono text-blue-700 font-bold bg-white px-1.5 sm:px-2 py-0.5 rounded border border-blue-200 shadow-sm flex items-center gap-1 truncate max-w-full">
                            📞 {delivery.rider.phoneNumber}
                        </p>
                     )}
                  </div>
                </div>
              </div>
            )}

            {/* Product Info */}
            <div className="flex gap-3 sm:gap-4 items-start border-t border-slate-100 pt-5 sm:pt-6 mb-5 sm:mb-6">
               {product?.images?.[0] ? (
                   <img src={product.images[0]} alt="Product" className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-slate-100 object-cover border border-slate-200 shrink-0" />
               ) : (
                   <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                       <Store className="text-slate-300 w-5 h-5 sm:w-6 sm:h-6" />
                   </div>
               )}
               <div className="min-w-0">
                 <h3 className="font-bold text-slate-800 text-sm sm:text-base leading-tight line-clamp-2">{product?.name}</h3>
                 <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-medium text-slate-500 mt-1.5 sm:mt-2 truncate">
                    <Store size={14} className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" /> <span className="truncate">Sold by {product?.store?.name}</span>
                 </div>
               </div>
            </div>

            {/* Destination Info */}
            <div className="border-t border-slate-100 pt-5 sm:pt-6 mb-5 sm:mb-6">
               <h4 className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase mb-2 sm:mb-3 tracking-widest">Destination</h4>
               <div className="flex gap-2.5 sm:gap-3 text-xs sm:text-sm font-medium text-slate-600 bg-slate-50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100">
                 <MapPin size={18} className="mt-0.5 text-slate-400 w-4 h-4 sm:w-[18px] sm:h-[18px] shrink-0" /> 
                 <span className="leading-relaxed break-words">{delivery.shippingAddress}</span>
               </div>
            </div>

            {/* ACTION AREA */}
            {!isDelivered && (
              <div className="mt-auto pt-4 sm:pt-6 border-t border-slate-100">
                {!isReadyForCustomer ? (
                  <div className="text-center space-y-2.5 sm:space-y-3">
                    <p className="text-[10px] sm:text-xs text-slate-500 font-medium bg-slate-50 p-2.5 sm:p-3 rounded-lg border border-slate-200 italic">
                      Waiting for order to be marked as In Transit...
                    </p>
                    <button disabled className="w-full py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-white bg-slate-300 cursor-not-allowed flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                      Confirm Received
                    </button>
                  </div>
                ) : (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <button 
                      onClick={() => setShowOtpModal(true)}
                      className="w-full py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-white bg-green-600 hover:bg-green-700 shadow-md shadow-green-200 transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base"
                    >
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                      Confirm Received
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT PANEL: Live Map */}
          <div className="lg:col-span-2 bg-slate-200 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 overflow-hidden relative h-[400px] lg:h-[calc(100vh-140px)] w-full shrink-0 z-0">
            <DeliveryMap delivery={delivery} />
          </div>

        </div>
      </div>

      {/* OTP MODAL POPUP */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[9999] flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-sm p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 border border-white/20">
            
            <div className="flex justify-between items-start mb-2 sm:mb-3">
              <div className="flex items-center gap-1.5 sm:gap-2 text-green-600">
                <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 shrink-0" />
                <h3 className="font-extrabold text-lg sm:text-xl text-slate-900">Verify Delivery</h3>
              </div>
              <button onClick={() => setShowOtpModal(false)} className="text-slate-400 hover:text-red-500 bg-slate-100 hover:bg-red-50 border border-slate-200 p-1.5 rounded-full transition-colors shadow-sm">
                <X className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
              </button>
            </div>
            
            <p className="text-xs sm:text-sm font-medium text-slate-500 mb-5 sm:mb-6 mt-1 sm:mt-2 leading-relaxed">
              Please enter the <strong className="text-slate-800">6-digit Security OTP</strong> displayed on your tracking screen to confirm you received the package.
            </p>
            
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••"
              autoFocus
              className="w-full px-3 sm:px-4 py-3 sm:py-4 bg-slate-50 border-2 border-slate-200 rounded-xl sm:rounded-2xl text-center tracking-[0.3em] sm:tracking-[0.5em] font-mono font-black text-2xl sm:text-3xl text-slate-800 focus:border-green-500 focus:ring-4 focus:ring-green-500/20 outline-none transition-all mb-6 sm:mb-8 shadow-inner"
            />
            
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
              <button 
                onClick={() => setShowOtpModal(false)} 
                className="w-full sm:flex-1 py-3 sm:py-3.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors font-bold rounded-xl text-sm shadow-sm order-2 sm:order-1"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmDelivery} 
                disabled={updating || otp.length < 6} 
                className="w-full sm:flex-[2] py-3 sm:py-3.5 bg-green-600 text-white hover:bg-green-700 transition-all active:scale-[0.98] disabled:active:scale-100 font-bold rounded-xl text-sm disabled:opacity-50 flex justify-center items-center gap-1.5 sm:gap-2 shadow-md shadow-green-600/20 order-1 sm:order-2"
              >
                {updating ? <Loader2 size={18} className="animate-spin shrink-0" /> : "Verify & Confirm"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}