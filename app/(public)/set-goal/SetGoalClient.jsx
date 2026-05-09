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
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 w-[95%] sm:w-full max-w-lg shadow-2xl flex flex-col max-h-[90dvh]">
        <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-slate-800 border-b border-slate-100 pb-3 sm:pb-4 shrink-0">Terms & Conditions</h2>
        
        <div className="overflow-y-auto custom-scrollbar pr-1 sm:pr-2 space-y-3 sm:space-y-4 text-xs sm:text-sm text-slate-600 shrink">
          <p>By starting a savings goal on DreamSaver, you agree to the following terms:</p>
          <ul className="list-disc pl-4 sm:pl-5 space-y-2.5 sm:space-y-3">
            <li>
              <strong className="text-slate-800">Price Lock Guarantee:</strong> The product price is secured and locked the moment you create this goal. Future price increases by the store will not affect your target amount.
            </li>
            <li>
              <strong className="text-slate-800">Flexible Deposits:</strong> You can fund your goal using Stripe or your DreamSaver Wallet at your own pace. There are no hidden interest charges or late fees.
            </li>
            <li>
              <strong className="text-slate-800">Secure Escrow:</strong> Your funds are held securely in an escrow account. The seller only receives payment after you have fully funded the goal, redeemed the item, and it is processed for delivery.
            </li>
            <li>
              <strong className="text-slate-800">Cancellations & Refunds:</strong> If you choose to cancel your goal before completion, a <strong>20% platform penalty fee</strong> will be deducted from your saved amount. The remaining 80% will be credited back to your DreamSaver Wallet. All refunds are subject to admin review.
            </li>
            <li>
              <strong className="text-slate-800">Delivery Fees:</strong> A standard shipping fee of 250 PKR applies to all orders below 5,000 PKR. Orders of 5,000 PKR or more qualify for free delivery.
            </li>
            <li>
              <strong className="text-slate-800">Redemption Process:</strong> Once your goal reaches 100%, the item is not shipped automatically. You must log into your dashboard, click "Redeem Product," and confirm your preferred delivery address and date.
            </li>
            <li>
              <strong className="text-slate-800">Goal Expiration:</strong> Goals that are abandoned or remain unfunded significantly past their selected target timeline may be subject to automatic cancellation and standard refund policies.
            </li>
          </ul>
        </div>

        <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-100 text-right shrink-0">
          <button onClick={onClose} className="px-5 sm:px-6 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all w-full shadow-md hover:shadow-lg active:scale-95 text-sm sm:text-base">
            I Understand & Accept
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SetGoalClient() {
  // Extract user info from Clerk and routing tools from Next.js.
  const { user } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Extract the specific 'productId' from the URL query string.
  const productId = searchParams.get("productId");


  // Product data fetched from the API.
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

  // Form submission state
  const [error, setError] = useState(null); 
  const [loading, setLoading] = useState(false); 

  // Calculates a future date in based on the selected months.
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

  // Fetches the product details from the backend based on the URL query parameter.
  useEffect(() => {
    if (!productId) return;
    fetch(`/api/products/${productId}`)
      .then(r => r.json())
      .then(d => setProduct(d.product))
      .catch(err => console.error("Failed to load product", err));
  }, [productId]); 

  // Validates the user's coupon code against the backend API.
  const handleApplyCoupon = async () => {
    if (!couponInput) return; 
    
    setCouponLoading(true);
    setCouponMessage({ type: '', text: '' }); 

    try {
      // Send a POST request to validate the coupon.
      const res = await fetch('/api/coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput })
      });
      const data = await res.json();

      // If backend returns an error (e.g., invalid or expired), throw it to the catch block.
      if (!res.ok) throw new Error(data.error);

      // On success, save the coupon details and show a success message.
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

  const basePrice = product?.price || 0;
  const deliveryFee = basePrice > 5000 ? 0 : 250;
  const discountAmount = appliedCoupon ? (basePrice * (appliedCoupon.discount / 100)) : 0;
  const finalTargetAmount = basePrice - discountAmount + deliveryFee;

  const startGoal = async () => {
    setError(null); 
    
    if (!period) return setError("Please select a time period.");
    if (!targetDate) return setError("Target date is invalid.");
    if (!termsAccepted) return setError("You must accept the terms first.");

    setLoading(true);
    try {
      // POST the fully constructed goal data to the backend.
      const res = await fetch("/api/set-goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          targetDate,
          couponCode: appliedCoupon?.code || null, // Include coupon code if one was successfully applied.
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

  //Show a full-page spinner until the product data has been fetched.
  if (!product) return <div className="h-[70vh] flex items-center justify-center"><Loader2 className="animate-spin text-blue-600 w-10 h-10" /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-6 sm:mb-8 text-slate-900 tracking-tight text-center md:text-left">Set Savings Goal</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        
        <div className="space-y-5 sm:space-y-6">
          
          {/* Product Header Card */}
          <div className="flex gap-3 sm:gap-4 p-3 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-sm items-center">
            {product.images?.[0] && (
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0">
                 {/* Utilizes Next.js optimized Image component. */}
                 <Image src={product.images[0]} fill className="object-cover rounded-xl border border-slate-100" alt={product.name} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-bold text-base sm:text-lg text-slate-800 leading-tight line-clamp-2" title={product.name}>{product.name}</p>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">Base Price: PKR {basePrice.toLocaleString()}</p>
            </div>
          </div>

          {/*  Visually details how the final target amount is calculated. */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-2.5 sm:space-y-3 text-xs sm:text-sm font-medium">
             <div className="flex justify-between text-slate-600">
                <span>Product Value</span>
                <span>PKR {basePrice.toLocaleString()}</span>
             </div>
             
             <div className="flex justify-between text-slate-600 items-center">
                <span>Delivery Fee {deliveryFee === 0 && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md ml-1.5 uppercase font-bold tracking-wider">Free</span>}</span>
                <span>+ PKR {deliveryFee}</span>
             </div>

             {/* Conditionally renders the discount line item ONLY if a valid coupon is applied. */}
             {appliedCoupon && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Discount ({appliedCoupon.discount}%)</span>
                  <span>- PKR {discountAmount.toLocaleString()}</span>
                </div>
             )}

             <div className="pt-3 sm:pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-0 mt-2 sm:mt-3">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] sm:text-xs">Final Goal Amount</span>
                <span className="text-xl sm:text-2xl font-black text-green-600 tracking-tighter">PKR {finalTargetAmount.toLocaleString()}</span>
             </div>
          </div>
        </div>

    
        <div className="space-y-5 sm:space-y-6 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
          
          {/* Coupon Input Section */}
          <div>
             <label className="text-xs sm:text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5 uppercase tracking-wider"><Tag size={16} className="text-slate-400"/> Have a Coupon?</label>
             <div className="flex gap-2">
               <input 
                 type="text" 
                 disabled={appliedCoupon} // Locks the input field if a coupon is currently active.
                 placeholder="Enter code" 
                 className="w-full border border-slate-300 p-2.5 sm:p-3 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 outline-none uppercase font-mono disabled:bg-slate-50 text-sm sm:text-base transition-shadow"
                 value={couponInput}
                 onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
               />
               {/* Conditional Button: "Apply" (if no coupon is active) vs "Remove" (if a coupon is active) */}
               {!appliedCoupon ? (
                 <button onClick={handleApplyCoupon} disabled={!couponInput || couponLoading} className="px-4 sm:px-5 bg-slate-900 text-white rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm hover:bg-black disabled:opacity-50 transition-colors shrink-0 shadow-sm">
                   {couponLoading ? <Loader2 size={18} className="animate-spin" /> : "Apply"}
                 </button>
               ) : (
                 <button onClick={removeCoupon} className="px-4 sm:px-5 bg-red-50 text-red-600 border border-red-200 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm hover:bg-red-100 transition-colors shrink-0 shadow-sm">
                   Remove
                 </button>
               )}
             </div>
             
             {/* Displays the dynamic success or error message underneath the coupon input. */}
             {couponMessage.text && (
                <p className={`text-[10px] sm:text-xs mt-2 flex items-center gap-1 font-bold tracking-wide ${couponMessage.type === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {couponMessage.type === 'success' ? <CheckCircle2 size={14}/> : <XCircle size={14}/>} {couponMessage.text}
                </p>
             )}
          </div>

          <hr className="border-slate-100"/>

          {/* Goal Duration Dropdown */}
          <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Select Goal Duration</label>
              <select
                value={period}
                className="w-full border border-slate-300 p-2.5 sm:p-3 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow bg-white text-sm sm:text-base font-medium text-slate-700 cursor-pointer"
                onChange={e => {
                  setPeriod(e.target.value);
                  setTargetDate(calcDate(e.target.value));
                  if (error) setError(null); 
                }}
              >
                <option value="" disabled>Select timeline...</option>
                <option value="3">3 Months</option>
                <option value="6">6 Months</option>
                <option value="12">12 Months</option>
              </select>
          </div>

          {/* Visual confirmation of the calculated target date. */}
          {targetDate && (
            <div className="p-3 sm:p-3.5 bg-blue-50 text-blue-700 rounded-xl text-xs sm:text-sm border border-blue-100 font-bold flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-top-2">
                📅 Target Completion: {formatDateForDisplay(targetDate)}
            </div>
          )}

          {/* Terms & Conditions Checkbox */}
          <label className="flex gap-2.5 sm:gap-3 items-start text-xs sm:text-sm cursor-pointer mt-2 sm:mt-4 p-2 -mx-2 hover:bg-slate-50 rounded-lg transition-colors">
            <input type="checkbox" className="w-4 h-4 sm:w-4 sm:h-4 text-blue-600 rounded mt-0.5 shrink-0 cursor-pointer" onChange={e => setTermsAccepted(e.target.checked)} />
            <span className="text-slate-600 leading-tight font-medium">
              I accept the 
              <span className="text-blue-600 font-bold hover:underline ml-1 cursor-pointer" onClick={(e) => { e.preventDefault(); setShowTerms(true); }}>Terms & Conditions</span>
            </span>
          </label>

          {/* General form error display. */}
          {error && <div className="p-3 bg-red-50 text-red-600 text-xs sm:text-sm rounded-xl border border-red-100 font-bold shadow-sm flex items-center gap-1.5 animate-in fade-in"><XCircle size={16} className="shrink-0"/> {error}</div>}

          
          <button
            onClick={startGoal}
            disabled={loading || !product} // Disabled during network requests.
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3.5 sm:py-4 rounded-xl sm:rounded-2xl shadow-md shadow-green-500/20 transition-all disabled:opacity-50 disabled:scale-100 active:scale-[0.98] text-sm sm:text-base flex justify-center items-center gap-2 mt-2"
          >
            {loading && <Loader2 size={18} className="animate-spin sm:w-5 sm:h-5"/>}
            {loading ? "Creating Goal..." : "Start Goal Now"}
          </button>

        </div>
      </div>

      {/* Conditionally renders the TermsModal over the page based on the 'showTerms' boolean state. */}
      <TermsModal open={showTerms} onClose={() => setShowTerms(false)} />
    </div>
  );
}