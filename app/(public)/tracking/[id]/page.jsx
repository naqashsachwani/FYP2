'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic'; 
import { Loader2, Truck, Calendar, Store, MapPin, ArrowLeft, CheckCircle, ShieldCheck, X } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';

// Dynamically import the map to prevent Next.js SSR errors
const DeliveryMap = dynamic(() => import('@/components/DeliveryMap'), { 
  ssr: false,
  loading: () => <div className="h-full flex items-center justify-center bg-slate-100 text-slate-400 font-medium animate-pulse">Loading Map...</div>
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
    // Auto-refresh data every 4 seconds for live tracking
    const interval = setInterval(() => fetchData(), 4000); 
    return () => clearInterval(interval);
  }, [id]);

  const handleConfirmDelivery = async () => {
    // Validate OTP if the backend generated one for this delivery
    if (delivery?.deliveryCode && otp.length !== 6) {
        return toast.error("Please enter the full 6-digit OTP.");
    }
    
    setUpdating(true); 
    try {
      const res = await fetch(`/api/delivery/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DELIVERED', otp }) 
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      toast.success("Delivery Confirmed Successfully!");
      setShowOtpModal(false); // Close the popup
      await fetchData(); // Refresh UI to show "DELIVERED"
    } catch (error) { 
      toast.error(error.message || "Failed to confirm delivery"); 
    } finally { 
      setUpdating(false); 
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-green-600 w-10 h-10" /></div>;
  if (!delivery) return <div className="p-10 text-center font-bold text-slate-500">Tracking information not found.</div>;

  const product = delivery.goal?.product;
  const isDelivered = delivery.status === 'DELIVERED';
  
  // ✅ STRICT PIPELINE CHECK: Button is ONLY unlocked when IN_TRANSIT
  const isReadyForCustomer = delivery.status === 'IN_TRANSIT'; 

  const statusColor = isDelivered ? 'bg-green-50 border-green-200 text-green-700' : 'bg-blue-50 border-blue-200 text-blue-700';

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Top Navigation Bar */}
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => router.back()} className="flex items-center text-slate-500 hover:text-slate-900 text-sm font-bold transition-colors">
            <ArrowLeft size={16} className="mr-1" /> Back
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-auto md:h-[80vh]">
          
          {/* LEFT PANEL: Details & Actions */}
          <div className="md:col-span-1 bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col h-full overflow-y-auto relative z-10">
            <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Track Delivery</h1>
            <p className="text-slate-400 text-xs font-mono font-bold tracking-wider mb-4">ID: {delivery.trackingNumber}</p>
            
            {/* OTP Displayed directly under Tracking ID (Only visible if not delivered yet) */}
            {!isDelivered && delivery.deliveryCode && (
              <div className="bg-slate-900 p-4 rounded-xl mb-6 shadow-md border border-slate-700 flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest mb-1">Your Security OTP</p>
                  <p className="text-white font-mono text-2xl font-black tracking-[0.2em]">{delivery.deliveryCode}</p>
                </div>
                <ShieldCheck size={28} className="text-slate-700" />
              </div>
            )}

            {/* Status Banner */}
            <div className={`p-4 rounded-2xl border mb-6 ${statusColor}`}>
              <div className="flex items-center gap-2 mb-1 font-bold uppercase tracking-wide">
                {isDelivered ? <CheckCircle size={18} /> : <Truck size={18} />} 
                {delivery.status.replace('_', ' ')}
              </div>
              <div className="flex items-center gap-2 text-xs font-medium opacity-80 mt-2">
                <Calendar size={14} />
                {isDelivered 
                  ? `Delivered on ${new Date(delivery.updatedAt).toLocaleDateString('en-GB')}`
                  : `Estimated: ${new Date(delivery.estimatedDate).toDateString()}` 
                }
              </div>
            </div>

            {/* Rider Details */}
            {delivery.rider && (
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-center gap-4 mb-6">
                <img src={delivery.rider.user?.image || "/default-avatar.png"} alt="Rider" className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
                <div className="flex-1">
                  <p className="text-[10px] uppercase font-bold text-blue-500 tracking-wider mb-0.5">Assigned Rider</p>
                  <p className="font-bold text-blue-900 text-sm leading-tight">{delivery.rider.user?.name}</p>
                  <div className="flex flex-wrap gap-2 items-center mt-1">
                     <p className="text-xs font-mono text-blue-700 font-bold bg-white px-1.5 py-0.5 rounded shadow-sm border border-blue-200/50">{delivery.rider.vehiclePlate}</p>
                     
                     {/* ✅ STRICT: Only show phone number if IN_TRANSIT */}
                     {delivery.status === 'IN_TRANSIT' && delivery.rider.phoneNumber && (
                        <p className="text-xs font-mono text-blue-700 font-bold bg-white px-1.5 py-0.5 rounded border border-blue-200 shadow-sm flex items-center gap-1">
                           📞 {delivery.rider.phoneNumber}
                        </p>
                     )}
                  </div>
                </div>
              </div>
            )}

            {/* Product Info */}
            <div className="flex gap-4 items-start border-t border-slate-100 pt-6 mb-6">
               {product?.images?.[0] ? (
                   <img src={product.images[0]} alt="Product" className="w-16 h-16 rounded-xl bg-slate-100 object-cover border border-slate-200" />
               ) : (
                   <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
                       <Store className="text-slate-300" size={24} />
                   </div>
               )}
               <div>
                 <h3 className="font-bold text-slate-800 line-clamp-2">{product?.name}</h3>
                 <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mt-2">
                    <Store size={14} /> {product?.store?.name}
                 </div>
               </div>
            </div>

            {/* Destination Info */}
            <div className="border-t border-slate-100 pt-6 mb-6">
               <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-3 tracking-widest">Destination</h4>
               <div className="flex gap-3 text-sm font-medium text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                 <MapPin size={18} className="mt-0.5 text-slate-400 shrink-0" /> 
                 <span className="leading-relaxed">{delivery.shippingAddress}</span>
               </div>
            </div>

            {/* ACTION AREA - STRICTLY LOCKED BY STATUS */}
            {!isDelivered && (
              <div className="mt-auto pt-6 border-t border-slate-100">
                
                {/* 🔒 IF NOT 'IN_TRANSIT' -> BUTTON IS FROZEN */}
                {!isReadyForCustomer ? (
                  <div className="text-center space-y-3">
                    <p className="text-xs text-slate-500 font-medium bg-slate-50 p-3 rounded-lg border border-slate-200 italic">
                      Waiting for order to be marked as In Transit...
                    </p>
                    <button disabled className="w-full py-4 rounded-2xl font-bold text-white bg-slate-300 cursor-not-allowed flex items-center justify-center gap-2">
                      <CheckCircle size={20} />
                      Confirm Received
                    </button>
                  </div>
                ) : (
                  
                  /* 🔓 IF 'IN_TRANSIT' -> BUTTON IS UNLOCKED */
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <button 
                      onClick={() => setShowOtpModal(true)}
                      className="w-full py-4 rounded-2xl font-bold text-white bg-green-600 hover:bg-green-700 shadow-md shadow-green-200 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={20} />
                      Confirm Received
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT PANEL: Live Map */}
          <div className="md:col-span-2 bg-slate-200 rounded-3xl shadow-sm border border-slate-200 overflow-hidden relative min-h-[400px] z-0">
            <DeliveryMap delivery={delivery} />
          </div>

        </div>
      </div>

      {/* ============================================================== */}
      {/* 🟢 THE OTP MODAL POPUP (Shows when Confirm button is clicked) */}
      {/* ============================================================== */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2 text-green-600">
                <ShieldCheck size={28} />
                <h3 className="font-extrabold text-xl text-slate-900">Verify Delivery</h3>
              </div>
              <button onClick={() => setShowOtpModal(false)} className="text-slate-400 hover:text-slate-800 bg-slate-100 p-1.5 rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>
            
            {/* Instructions */}
            <p className="text-sm font-medium text-slate-500 mb-6 mt-2 leading-relaxed">
              Please enter the <strong className="text-slate-800">6-digit Security OTP</strong> displayed on your tracking screen to confirm you received the package.
            </p>
            
            {/* Input Field */}
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} // Only allow numbers
              placeholder="••••••"
              autoFocus
              className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-center tracking-[0.5em] font-mono font-black text-3xl text-slate-800 focus:border-green-500 focus:ring-4 focus:ring-green-500/20 outline-none transition-all mb-8"
            />
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <button 
                onClick={() => setShowOtpModal(false)} 
                className="flex-1 py-4 bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors font-bold rounded-xl text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmDelivery} 
                disabled={updating || (delivery.deliveryCode && otp.length < 6)} 
                className="flex-[2] py-4 bg-green-600 text-white hover:bg-green-700 transition-colors font-bold rounded-xl text-sm disabled:opacity-50 flex justify-center items-center gap-2 shadow-md shadow-green-200"
              >
                {updating ? <Loader2 size={18} className="animate-spin" /> : "Verify & Confirm"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}