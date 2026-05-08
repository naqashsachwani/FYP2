"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2, ArrowLeft, Store, MapPin, Phone, ShieldCheck, Upload, AlertTriangle, CheckCircle } from "lucide-react";

export default function ActiveDeliveryPage() {
  const params = useParams();
  const router = useRouter();
  const deliveryId = params?.id;

  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  const [proofFile, setProofFile] = useState(null);
  const [showFailModal, setShowFailModal] = useState(false);
  const [failReason, setFailReason] = useState("");

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/rider/delivery/${deliveryId}`);
      if (!res.ok) throw new Error("Failed to load delivery");
      const data = await res.json();
      setDelivery(data);
    } catch (error) {
      toast.error(error.message);
      router.push("/rider/dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (deliveryId) fetchData();
  }, [deliveryId]);

  const handleSubmit = async (action) => {
    if (action === "FAIL" && !failReason.trim()) return toast.error("Please provide a reason for failure");

    setProcessing(true);
    const payload = new FormData();
    payload.append("action", action);
    
    if (proofFile) payload.append("proofImage", proofFile);
    if (action === "FAIL") payload.append("reason", failReason);

    try {
      const res = await fetch(`/api/rider/delivery/${deliveryId}`, {
        method: "POST",
        body: payload
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      toast.success(action === "PICKUP" ? "Item Picked Up!" : action === "FAIL" ? "Delivery Marked as Failed." : "Delivery Completed Successfully!");
      setProofFile(null);
      setShowFailModal(false);
      setFailReason("");
      fetchData(); 
    } catch (error) {
      toast.error(error.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600 w-10 h-10" /></div>;
  if (!delivery) return null;

  const isDelivered = delivery.status === "DELIVERED";
  const isFailed = delivery.status === "FAILED";
  
  const payoutAmount = parseFloat(delivery.goal?.targetAmount || delivery.goal?.product?.price || 0) >= 5000 ? "400" : "200";

  return (
    <div className="min-h-[100dvh] bg-slate-50 pb-24 pt-6 sm:pt-10 lg:pt-12">
      
      <div className="max-w-xl mx-auto px-4 space-y-5 sm:space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col items-start gap-2.5 sm:gap-3 pb-2">
            <button 
                onClick={() => router.push("/rider/dashboard")} 
                className="flex items-center gap-1.5 mb-1 sm:mb-2 text-xs sm:text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors w-fit"
            >
                <ArrowLeft size={16} className="w-4 h-4" /> Back to Dashboard
            </button>
            
            <h1 className={`text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight ${isDelivered ? 'text-emerald-600' : isFailed ? 'text-red-600' : 'text-slate-900'}`}>
                {isDelivered ? "Delivery Complete 🎉" : isFailed ? "Delivery Failed" : "Active Delivery"}
            </h1>
            
            <span className={`px-2.5 py-1 sm:py-1.5 rounded-md bg-white text-[10px] sm:text-xs font-bold font-mono shadow-sm border ${
                isDelivered ? 'text-emerald-700 border-emerald-200' : 
                isFailed ? 'text-red-700 border-red-200' : 
                'text-slate-600 border-slate-200'
            }`}>
                {delivery.trackingNumber}
            </span>
        </div>

        {/* PACKAGE PAYOUT CARD */}
        <div className="bg-white p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200">
           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
              <div className="flex-1 min-w-0 pr-0 sm:pr-4">
                 <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 sm:mb-1.5">Package Contents</p>
                 <h2 className="font-bold text-base sm:text-lg md:text-xl text-slate-800 truncate">{delivery.goal.product?.name}</h2>
              </div>
              <div className="text-left sm:text-right shrink-0 border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-4 md:pl-6 w-full sm:w-auto">
                 <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Est. Payout</span>
                 <span className="font-black text-blue-600 text-xl sm:text-2xl md:text-3xl">Rs. {payoutAmount}</span>
              </div>
           </div>
          
          {isFailed && delivery.failureReason && (
            <div className="mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-red-100 bg-red-50 p-3 sm:p-4 rounded-xl sm:rounded-2xl flex items-start gap-2.5 sm:gap-3">
              <div className="bg-red-100 p-1.5 rounded-xl shrink-0">
                <AlertTriangle className="text-red-600 w-4 h-4 sm:w-[18px] sm:h-[18px]" />
              </div>
              <div>
                <p className="text-[9px] sm:text-[10px] font-bold text-red-800 uppercase tracking-widest mb-0.5">Failure Reason</p>
                <p className="text-xs sm:text-sm text-red-700 font-medium">{delivery.failureReason}</p>
              </div>
            </div>
          )}
        </div>

        {/* ROUTE TIMELINE */}
        <div className="bg-white p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200">
           
           {/* Step 1: Store */}
           <div className={`flex gap-4 sm:gap-5 min-h-[100px] sm:min-h-[120px] ${delivery.status !== 'ACCEPTED' && 'opacity-60'}`}>
              
              <div className="flex flex-col items-center w-10 sm:w-12 shrink-0">
                 <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm border-2 sm:border-[3px] z-10 ${delivery.status === 'ACCEPTED' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-200 text-slate-400'}`}>
                    <Store className="w-4 h-4 sm:w-5 sm:h-5" />
                 </div>
                 {/* Center Line */}
                 <div className="w-0.5 sm:w-[3px] flex-grow bg-slate-200 my-1.5 sm:my-2 rounded-full"></div>
              </div>
              
              <div className="pb-6 sm:pb-8 pt-0.5 sm:pt-1">
                 <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 sm:mb-1.5">1. Pickup From Store</p>
                 <p className="font-bold text-slate-800 text-base sm:text-lg">{delivery.goal.product?.store?.name}</p>
                 <p className="text-xs sm:text-sm text-slate-500 mt-1 sm:mt-1.5 leading-relaxed max-w-sm">{delivery.goal.product?.store?.address}</p>
                 <a href={`tel:${delivery.goal.product?.store?.contact}`} className="inline-flex items-center gap-1.5 sm:gap-2 mt-3 sm:mt-4 text-[10px] sm:text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-slate-200 transition-colors shadow-sm">
                    <Phone size={14} className="text-blue-500 w-3 h-3 sm:w-3.5 sm:h-3.5" /> {delivery.goal.product?.store?.contact}
                 </a>
              </div>
           </div>

           {/* Step 2: Customer */}
           <div className="flex gap-4 sm:gap-5">
              <div className="flex flex-col items-center w-10 sm:w-12 shrink-0">
                 <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm border-2 sm:border-[3px] z-10 ${(delivery.status === 'PICKED_UP' || delivery.status === 'IN_TRANSIT') ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-200 text-slate-400'}`}>
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                 </div>
              </div>
              
              <div className="pt-0.5 sm:pt-1">
                 <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 sm:mb-1.5">2. Deliver To Customer</p>
                 <p className="font-bold text-slate-800 text-base sm:text-lg">{delivery.goal.user?.name}</p>
                 <p className="text-xs sm:text-sm text-slate-500 mt-1 sm:mt-1.5 leading-relaxed max-w-sm">{delivery.shippingAddress}</p>
              </div>
           </div>
        </div>

        {/* ACTION CONTROLS */}
        {!isDelivered && !isFailed && (
          <div className="bg-white p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <ShieldCheck className="text-blue-600 w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
              <h3 className="font-bold text-lg sm:text-xl text-slate-800">Action Required</h3>
            </div>

            {delivery.status === 'ACCEPTED' && (
              <div className="space-y-4 sm:space-y-5">
                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">Head to the store location. Once you have received the package, click the button below to mark it as picked up.</p>
                <button 
                  onClick={() => handleSubmit('PICKUP')} disabled={processing}
                  className="w-full py-3.5 sm:py-4 bg-blue-600 text-white text-sm sm:text-base font-bold rounded-xl sm:rounded-2xl hover:bg-blue-700 transition flex justify-center items-center gap-2 disabled:opacity-50 shadow-md shadow-blue-600/20 active:scale-[0.98] disabled:active:scale-100"
                >
                  {processing ? <Loader2 className="animate-spin w-4 h-4 sm:w-5 sm:h-5" /> : "I have picked up the package"}
                </button>
              </div>
            )}

            {(delivery.status === 'PICKED_UP' || delivery.status === 'IN_TRANSIT') && (
              <div className="space-y-5 sm:space-y-6">
                
                <div className={`border-2 border-dashed rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center transition-colors cursor-pointer group ${proofFile ? 'border-blue-400 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50/50'}`}>
                  <input 
                    type="file" id="proofUpload" accept="image/*" capture="environment"
                    onChange={(e) => setProofFile(e.target.files[0])} className="hidden" 
                  />
                  <label htmlFor="proofUpload" className="cursor-pointer flex flex-col items-center justify-center w-full h-full">
                    {proofFile ? (
                      <>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2.5 sm:mb-3">
                            <CheckCircle className="text-blue-600 w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <span className="font-bold text-blue-800 text-sm sm:text-base">Photo Attached</span>
                        <span className="text-[10px] sm:text-xs text-blue-600 mt-1 font-medium">Click to retake</span>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-100 group-hover:bg-blue-100 rounded-full flex items-center justify-center mb-2.5 sm:mb-3 transition-colors">
                            <Upload className="text-slate-500 group-hover:text-blue-600 transition-colors w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <span className="font-bold text-slate-700 group-hover:text-blue-800 transition-colors text-sm sm:text-base">Take Delivery Photo</span>
                        <span className="text-[10px] sm:text-xs text-slate-400 mt-1 font-medium">Optional but recommended</span>
                      </>
                    )}
                  </label>
                </div>

                <button 
                  onClick={() => handleSubmit('DELIVER')} disabled={processing}
                  className="w-full py-3.5 sm:py-4 bg-slate-900 text-white text-sm sm:text-base font-bold rounded-xl sm:rounded-2xl hover:bg-black transition flex justify-center items-center gap-2 disabled:opacity-50 shadow-xl shadow-slate-900/20 active:scale-[0.98] disabled:active:scale-100"
                >
                  {processing ? <Loader2 className="animate-spin w-4 h-4 sm:w-5 sm:h-5" /> : "Complete Delivery"}
                </button>
              </div>
            )}
          </div>
        )}

        {!isDelivered && !isFailed && (
          <div className="pt-2 pb-6 sm:pb-8 text-center">
            <button 
              onClick={() => setShowFailModal(true)}
              className="text-red-500 hover:text-red-700 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2 mx-auto transition-colors bg-red-50 hover:bg-red-100 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full"
            >
              <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Report an Issue
            </button>
          </div>
        )}

      </div>

      {/* FAILURE REPORT MODAL */}
      {showFailModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-sm p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 border border-slate-200">
            <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-5">
              <div className="p-2 sm:p-2.5 bg-red-100 text-red-600 rounded-xl sm:rounded-2xl">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="font-bold text-lg sm:text-xl text-slate-900">Report Issue</h3>
            </div>
            
            <p className="text-xs sm:text-sm text-slate-600 mb-4 sm:mb-5 font-medium leading-relaxed">Why are you unable to complete this delivery? This will immediately notify the customer and admin.</p>
            
            <textarea 
              rows={3} 
              value={failReason}
              onChange={(e) => setFailReason(e.target.value)}
              placeholder="E.g., Customer not at home, Item damaged at store..."
              className="w-full border border-slate-200 bg-slate-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-xs sm:text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:bg-white outline-none mb-5 sm:mb-6 resize-none shadow-inner transition-all custom-scrollbar"
            />
            
            <div className="flex gap-2 sm:gap-3">
              <button 
                onClick={() => { setShowFailModal(false); setFailReason(""); }} 
                className="flex-1 py-3 sm:py-3.5 bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors font-bold rounded-xl text-xs sm:text-sm shadow-sm"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleSubmit('FAIL')} 
                disabled={processing || !failReason.trim()} 
                className="flex-[1.5] py-3 sm:py-3.5 bg-red-600 text-white hover:bg-red-700 transition-colors font-bold rounded-xl text-xs sm:text-sm disabled:opacity-50 flex justify-center items-center gap-1.5 sm:gap-2 shadow-md shadow-red-600/20 active:scale-[0.98] disabled:active:scale-100"
              >
                {processing ? <Loader2 className="animate-spin w-4 h-4 sm:w-[18px] sm:h-[18px]" /> : "Confirm Failure"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}