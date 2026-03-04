'use client';

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { Loader2, Tag, CheckCircle2, XCircle } from "lucide-react";

/* ================= TERMS MODAL ================= */
function TermsModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl">
        <h2 className="text-xl font-bold mb-4 text-slate-800">Terms & Conditions</h2>
        <ul className="text-sm list-disc pl-5 space-y-2 text-slate-600">
          <li>Deposits are tracked against your savings goal.</li>
          <li>Products are reserved (price locked) until goal completion.</li>
          <li>Refunds require admin approval.</li>
          <li>No hidden charges or interest fees.</li>
          <li>Delivery charges apply to orders under 5,000 PKR.</li>
        </ul>
        <div className="mt-8 text-right">
          <button onClick={onClose} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all w-full sm:w-auto">
            I Accept
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= MAIN PAGE ================= */
export default function SetGoalClient() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const productId = searchParams.get("productId");

  /* ================= STATE ================= */
  const [product, setProduct] = useState(null);
  const [period, setPeriod] = useState("");
  const [targetDate, setTargetDate] = useState(""); 
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  
  // Coupon State
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMessage, setCouponMessage] = useState({ type: '', text: '' });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const calcDate = (m) => {
    if (!m) return "";
    const d = new Date();
    d.setMonth(d.getMonth() + Number(m));
    return d.toISOString().split("T")[0]; 
  };

  const formatDateForDisplay = (isoDate) => {
    if (!isoDate) return "";
    const [year, month, day] = isoDate.split("-");
    return `${day}-${month}-${year}`;
  };

  useEffect(() => {
    if (!productId) return;
    fetch(`/api/products/${productId}`)
      .then(r => r.json())
      .then(d => setProduct(d.product))
      .catch(err => console.error("Failed to load product", err));
  }, [productId]);

  /* ================= COUPON HANDLER ================= */
  const handleApplyCoupon = async () => {
    if (!couponInput) return;
    setCouponLoading(true);
    setCouponMessage({ type: '', text: '' });

    try {
      // ✅ CHANGED: Now hitting the unified /api/coupon route with POST
      const res = await fetch('/api/coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setAppliedCoupon({ code: couponInput.toUpperCase(), discount: data.discount });
      setCouponMessage({ type: 'success', text: `Coupon applied! ${data.discount}% off.` });
    } catch (err) {
      setAppliedCoupon(null);
      setCouponMessage({ type: 'error', text: err.message });
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponMessage({ type: '', text: '' });
  };

  /* ================= FINANCIAL MATH ================= */
  const basePrice = product?.price || 0;
  // Delivery Fee Logic: Free if > 5000, else 250
  const deliveryFee = basePrice > 5000 ? 0 : 250;
  // Discount Math
  const discountAmount = appliedCoupon ? (basePrice * (appliedCoupon.discount / 100)) : 0;
  // Final Total
  const finalTargetAmount = basePrice - discountAmount + deliveryFee;

  /* ================= START GOAL ================= */
  const startGoal = async () => {
    setError(null);
    if (!period) return setError("Please select a time period.");
    if (!targetDate) return setError("Target date is invalid.");
    if (!termsAccepted) return setError("You must accept the terms first.");

    setLoading(true);
    try {
      const res = await fetch("/api/set-goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          targetDate,
          couponCode: appliedCoupon?.code || null, // Pass coupon to backend
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create goal");

      router.refresh();
      router.push(`/goals/${data.goal.id}`);
    } catch (err) {
      setLoading(false);
      setError(err.message);
    }
  };

  if (!product) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 mt-6 mb-12">
      <h1 className="text-3xl font-extrabold mb-8 text-slate-900">Set Savings Goal</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN: Product & Math */}
        <div className="space-y-6">
          <div className="flex gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm items-center">
            {product.images?.[0] && (
              <div className="relative w-24 h-24 shrink-0">
                 <Image src={product.images[0]} fill className="object-cover rounded-xl border border-slate-100" alt={product.name} />
              </div>
            )}
            <div>
              <p className="font-bold text-lg text-slate-800 leading-tight">{product.name}</p>
              <p className="text-sm text-slate-500 mt-1">Base Price: PKR {basePrice.toLocaleString()}</p>
            </div>
          </div>

          {/* MATH BREAKDOWN */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 text-sm">
             <div className="flex justify-between text-slate-600">
                <span>Product Value</span>
                <span>PKR {basePrice.toLocaleString()}</span>
             </div>
             
             <div className="flex justify-between text-slate-600">
                <span>Delivery Fee {deliveryFee === 0 && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full ml-1">Free</span>}</span>
                <span>+ PKR {deliveryFee}</span>
             </div>

             {appliedCoupon && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount ({appliedCoupon.discount}%)</span>
                  <span>- PKR {discountAmount.toLocaleString()}</span>
                </div>
             )}

             <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                <span className="font-bold text-slate-800">Final Goal Amount</span>
                <span className="text-xl font-extrabold text-blue-600">PKR {finalTargetAmount.toLocaleString()}</span>
             </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Settings & Coupon */}
        <div className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          
          {/* Coupon Section */}
          <div>
             <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5"><Tag size={16}/> Have a Coupon?</label>
             <div className="flex gap-2">
               <input 
                 type="text" 
                 disabled={appliedCoupon}
                 placeholder="Enter code" 
                 className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase font-mono disabled:bg-slate-50"
                 value={couponInput}
                 onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
               />
               {!appliedCoupon ? (
                 <button onClick={handleApplyCoupon} disabled={!couponInput || couponLoading} className="px-4 bg-slate-900 text-white rounded-lg font-semibold hover:bg-black disabled:opacity-50">
                   {couponLoading ? <Loader2 size={18} className="animate-spin" /> : "Apply"}
                 </button>
               ) : (
                 <button onClick={removeCoupon} className="px-4 bg-red-100 text-red-600 rounded-lg font-semibold hover:bg-red-200">
                   Remove
                 </button>
               )}
             </div>
             {couponMessage.text && (
                <p className={`text-xs mt-2 flex items-center gap-1 font-medium ${couponMessage.type === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {couponMessage.type === 'success' ? <CheckCircle2 size={14}/> : <XCircle size={14}/>} {couponMessage.text}
                </p>
             )}
          </div>

          <hr className="border-slate-100"/>

          {/* Duration */}
          <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Select Goal Duration</label>
              <select
                value={period}
                className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                onChange={e => {
                  setPeriod(e.target.value);
                  setTargetDate(calcDate(e.target.value));
                  if (error) setError(null);
                }}
              >
                <option value="">Select timeline...</option>
                <option value="3">3 Months</option>
                <option value="6">6 Months</option>
                <option value="12">12 Months</option>
              </select>
          </div>

          {targetDate && (
            <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-sm border border-blue-100 font-medium">
                📅 Target Completion: {formatDateForDisplay(targetDate)}
            </div>
          )}

          {/* Terms & Submit */}
          <label className="flex gap-3 items-start text-sm cursor-pointer mt-4">
            <input type="checkbox" className="w-4 h-4 text-blue-600 rounded mt-0.5" onChange={e => setTermsAccepted(e.target.checked)} />
            <span className="text-slate-600 leading-tight">
              I accept the <span className="text-blue-600 font-bold hover:underline" onClick={(e) => { e.preventDefault(); setShowTerms(true); }}>Terms & Conditions</span>
            </span>
          </label>

          {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 font-medium">{error}</div>}

          <button
            onClick={startGoal}
            disabled={loading || !product}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:scale-100 active:scale-95 text-lg flex justify-center items-center gap-2"
          >
            {loading && <Loader2 size={20} className="animate-spin"/>}
            {loading ? "Creating Goal..." : "Start Goal Now"}
          </button>

        </div>
      </div>

      <TermsModal open={showTerms} onClose={() => setShowTerms(false)} />
    </div>
  );
}