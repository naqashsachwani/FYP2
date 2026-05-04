"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600 w-10 h-10" /></div>;
  if (!delivery) return null;

  const isDelivered = delivery.status === "DELIVERED";
  const isFailed = delivery.status === "FAILED";

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      
      <div className={`text-white p-6 pt-10 rounded-b-3xl shadow-md ${isDelivered ? 'bg-blue-600' : isFailed ? 'bg-red-600' : 'bg-slate-900'}`}>
        <button onClick={() => router.push("/rider/dashboard")} className="flex items-center gap-2 text-white/80 hover:text-white mb-4 text-sm font-bold transition">
          <ArrowLeft size={18} /> Back to Dashboard
        </button>
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-extrabold">{isDelivered ? "Delivery Complete" : isFailed ? "Delivery Failed" : "Active Job"}</h1>
            <p className="text-white/70 font-mono text-sm mt-1">{delivery.trackingNumber}</p>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto p-4 space-y-4 -mt-4">
        
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 relative z-10">
          <h2 className="font-bold text-lg text-slate-800 line-clamp-1">{delivery.goal.product?.name}</h2>
          <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estimated Payout</span>
            <span className="font-extrabold text-blue-600 text-lg">
              Rs. {parseFloat(delivery.goal?.targetAmount || delivery.goal?.product?.price || 0) >= 5000 ? "400" : "200"}
            </span>
          </div>
          
          {isFailed && delivery.failureReason && (
            <div className="mt-3 pt-3 border-t border-red-100 bg-red-50 p-3 rounded-xl flex items-start gap-2">
              <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold text-red-800 uppercase tracking-wider">Failure Reason</p>
                <p className="text-sm text-red-700 mt-0.5">{delivery.failureReason}</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-6">
          <div className={`flex gap-4 ${delivery.status !== 'ACCEPTED' && 'opacity-50'}`}>
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${delivery.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                <Store size={16} />
              </div>
              <div className="w-0.5 h-full bg-slate-200 my-2"></div>
            </div>
            <div className="pb-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">1. Pickup From Store</p>
              <p className="font-bold text-slate-800">{delivery.goal.product?.store?.name}</p>
              <p className="text-sm text-slate-500 mt-1">{delivery.goal.product?.store?.address}</p>
              <p className="text-sm text-slate-600 flex items-center gap-2 mt-2 font-medium bg-slate-50 p-2 rounded-lg border border-slate-100">
                <Phone size={14} /> {delivery.goal.product?.store?.contact}
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${(delivery.status === 'PICKED_UP' || delivery.status === 'IN_TRANSIT') ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                <MapPin size={16} />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">2. Deliver To Customer</p>
              <p className="font-bold text-slate-800">{delivery.goal.user?.name}</p>
              <p className="text-sm text-slate-500 mt-1">{delivery.shippingAddress}</p>
            </div>
          </div>
        </div>

        {!isDelivered && !isFailed && (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-blue-600" size={20} />
                <h3 className="font-bold text-slate-800">Delivery Status</h3>
              </div>
            </div>

            {delivery.status === 'ACCEPTED' && (
              <div className="space-y-4">
                <p className="text-sm text-slate-500">Go to the store location. Once you have the package, click the button below to start the delivery.</p>
                <button 
                  onClick={() => handleSubmit('PICKUP')} disabled={processing}
                  className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition flex justify-center items-center gap-2 disabled:opacity-50 shadow-md shadow-blue-200"
                >
                  {processing ? <Loader2 size={20} className="animate-spin" /> : "I have picked up the package"}
                </button>
              </div>
            )}

            {(delivery.status === 'PICKED_UP' || delivery.status === 'IN_TRANSIT') && (
              <div className="space-y-5">
                
                <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${proofFile ? 'border-blue-300 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <input 
                    type="file" id="proofUpload" accept="image/*" capture="environment"
                    onChange={(e) => setProofFile(e.target.files[0])} className="hidden" 
                  />
                  <label htmlFor="proofUpload" className="cursor-pointer flex flex-col items-center justify-center">
                    {proofFile ? (
                      <>
                        <CheckCircle className="text-blue-500 mb-1" size={24} />
                        <span className="font-bold text-sm text-blue-700">Photo Ready</span>
                      </>
                    ) : (
                      <>
                        <Upload className="text-slate-400 mb-1" size={24} />
                        <span className="font-bold text-sm text-blue-600">Take Delivery Photo (Optional)</span>
                      </>
                    )}
                  </label>
                </div>

                <button 
                  onClick={() => handleSubmit('DELIVER')} disabled={processing}
                  className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition flex justify-center items-center gap-2 disabled:opacity-50 shadow-md shadow-blue-200"
                >
                  {processing ? <Loader2 size={20} className="animate-spin" /> : "Complete Delivery"}
                </button>
              </div>
            )}
          </div>
        )}

        {!isDelivered && !isFailed && (
          <div className="pt-4 text-center">
            <button 
              onClick={() => setShowFailModal(true)}
              className="text-red-500 hover:text-red-600 text-sm font-bold flex items-center justify-center gap-1.5 mx-auto transition-colors"
            >
              <AlertTriangle size={16} /> Something went wrong? Report Issue
            </button>
          </div>
        )}

      </div>

      {showFailModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 text-red-600 rounded-xl">
                <AlertTriangle size={24} />
              </div>
              <h3 className="font-bold text-xl text-slate-800">Report Issue</h3>
            </div>
            
            <p className="text-sm text-slate-500 mb-5">Why are you unable to complete this delivery? This will immediately notify the customer and admin.</p>
            
            <textarea 
              rows={3} 
              value={failReason}
              onChange={(e) => setFailReason(e.target.value)}
              placeholder="E.g., Customer not at home, Item damaged at store..."
              className="w-full border border-slate-200 bg-slate-50 rounded-xl p-4 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none mb-6 resize-none"
            />
            
            <div className="flex gap-3">
              <button 
                onClick={() => { setShowFailModal(false); setFailReason(""); }} 
                className="flex-1 py-3 bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors font-bold rounded-xl text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleSubmit('FAIL')} 
                disabled={processing || !failReason.trim()} 
                className="flex-1 py-3 bg-red-600 text-white hover:bg-red-700 transition-colors font-bold rounded-xl text-sm disabled:opacity-50 flex justify-center items-center gap-2 shadow-sm shadow-red-200"
              >
                {processing ? <Loader2 size={16} className="animate-spin" /> : "Confirm Failure"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}