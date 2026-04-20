// Marks this as a Next.js Client Component, allowing the use of browser APIs and React hooks.
'use client';

// --- Imports ---
import { useSearchParams, useRouter } from "next/navigation"; // Hooks for routing and URL query parameters
import { useEffect, useState } from "react";
import Image from "next/image"; // Optimized image component
import { useUser } from "@clerk/nextjs"; // Authentication hook from Clerk
import { Loader2, Tag, CheckCircle2, XCircle } from "lucide-react"; // SVG Icons for UI

/* ================= TERMS MODAL ================= */
// A reusable modal component to display the application's terms and conditions.
function TermsModal({ open, onClose }) {
  // If the 'open' prop is false, render nothing.
  if (!open) return null;
  return (
    // Outer overlay: Fixed position, semi-transparent black background, backdrop blur, and fade-in animation.
    <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Modal Container: White background, rounded corners, shadow, and restricted max-height. */}
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl flex flex-col max-h-[85vh]">
        <h2 className="text-2xl font-bold mb-4 text-slate-800 border-b border-slate-100 pb-4">Terms & Conditions</h2>
        
        {/* Scrollable Content Area for the terms text. */}
        <div className="overflow-y-auto pr-2 space-y-4 text-sm text-slate-600">
          <p>By starting a savings goal on DreamSaver, you agree to the following terms:</p>
          <ul className="list-disc pl-5 space-y-3">
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

        {/* Modal Footer containing the accept/close button. */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-right shrink-0">
          <button onClick={onClose} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all w-full sm:w-auto shadow-md hover:shadow-lg active:scale-95">
            I Understand & Accept
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= MAIN PAGE ================= */
export default function SetGoalClient() {
  // Extract user info from Clerk and routing tools from Next.js.
  const { user } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Extract the specific 'productId' from the URL query string (e.g., ?productId=123).
  const productId = searchParams.get("productId");

  /* ================= STATE ================= */
  // Product data fetched from the API.
  const [product, setProduct] = useState(null);
  // User's selected saving duration (e.g., "3", "6", "12" months).
  const [period, setPeriod] = useState("");
  // Calculated target completion date based on the chosen period.
  const [targetDate, setTargetDate] = useState(""); 
  // Boolean tracking if the user checked the terms agreement box.
  const [termsAccepted, setTermsAccepted] = useState(false);
  // Controls the visibility of the TermsModal component.
  const [showTerms, setShowTerms] = useState(false);
  
  // Coupon State
  const [couponInput, setCouponInput] = useState(""); // The raw text typed by the user.
  const [appliedCoupon, setAppliedCoupon] = useState(null); // The successfully validated coupon object.
  const [couponLoading, setCouponLoading] = useState(false); // Spinner state for coupon validation.
  const [couponMessage, setCouponMessage] = useState({ type: '', text: '' }); // Feedback message (success/error).

  // Form submission state
  const [error, setError] = useState(null); // General form errors.
  const [loading, setLoading] = useState(false); // Spinner state during form submission.

  // --- Utility Functions ---
  // Calculates a future date in ISO format (YYYY-MM-DD) based on the selected months.
  const calcDate = (m) => {
    if (!m) return "";
    const d = new Date();
    d.setMonth(d.getMonth() + Number(m));
    return d.toISOString().split("T")[0]; 
  };

  // Reformats the ISO date string (YYYY-MM-DD) into a more readable format (DD-MM-YYYY).
  const formatDateForDisplay = (isoDate) => {
    if (!isoDate) return "";
    const [year, month, day] = isoDate.split("-");
    return `${day}-${month}-${year}`;
  };

  // --- Data Fetching ---
  // Fetches the product details from the backend based on the URL query parameter.
  useEffect(() => {
    if (!productId) return;
    fetch(`/api/products/${productId}`)
      .then(r => r.json())
      .then(d => setProduct(d.product))
      .catch(err => console.error("Failed to load product", err));
  }, [productId]); // Re-runs only if the productId changes.

  /* ================= COUPON HANDLER ================= */
  // Validates the user's coupon code against the backend API.
  const handleApplyCoupon = async () => {
    if (!couponInput) return; // Do nothing if input is empty.
    
    setCouponLoading(true);
    setCouponMessage({ type: '', text: '' }); // Clear previous messages.

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
      // On failure, clear any applied coupon and show the error message.
      setAppliedCoupon(null);
      setCouponMessage({ type: 'error', text: err.message });
    } finally {
      // Always turn off the loading spinner.
      setCouponLoading(false);
    }
  };

  // Removes an active coupon, clearing the state and resetting math.
  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponMessage({ type: '', text: '' });
  };

  /* ================= FINANCIAL MATH ================= */
  // Base price defaults to 0 if product data hasn't loaded yet.
  const basePrice = product?.price || 0;
  
  // Delivery Fee Logic: Hardcoded business rule. Free if > 5000 PKR, else 250 PKR.
  const deliveryFee = basePrice > 5000 ? 0 : 250;
  
  // Discount Math: Calculates the monetary discount based on the percentage returned by the coupon API.
  const discountAmount = appliedCoupon ? (basePrice * (appliedCoupon.discount / 100)) : 0;
  
  // Final Total: Base price minus the calculated discount, plus any applicable delivery fees.
  const finalTargetAmount = basePrice - discountAmount + deliveryFee;

  /* ================= START GOAL ================= */
  // Final submission handler.
  const startGoal = async () => {
    setError(null); // Clear previous errors.
    
    // Front-end Validation checks.
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
      // Catch specific backend errors.
      if (!res.ok) throw new Error(data.error || "Failed to create goal");

      // On success, refresh the router context and redirect to the newly created goal's detail page.
      router.refresh();
      router.push(`/goals/${data.goal.id}`);
    } catch (err) {
      // Handle network or logic errors during submission.
      setLoading(false);
      setError(err.message);
    }
  };

  // Render Guard: Show a full-page spinner until the product data has been fetched.
  if (!product) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    // Main container layout.
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 mt-6 mb-12">
      <h1 className="text-3xl font-extrabold mb-8 text-slate-900">Set Savings Goal</h1>

      {/* Two-column grid layout for desktop, single column for mobile. */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* === LEFT COLUMN: Product Overview & Mathematical Breakdown === */}
        <div className="space-y-6">
          
          {/* Product Header Card */}
          <div className="flex gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm items-center">
            {product.images?.[0] && (
              <div className="relative w-24 h-24 shrink-0">
                 {/* Utilizes Next.js optimized Image component. */}
                 <Image src={product.images[0]} fill className="object-cover rounded-xl border border-slate-100" alt={product.name} />
              </div>
            )}
            <div>
              <p className="font-bold text-lg text-slate-800 leading-tight">{product.name}</p>
              <p className="text-sm text-slate-500 mt-1">Base Price: PKR {basePrice.toLocaleString()}</p>
            </div>
          </div>

          {/* MATH BREAKDOWN: Visually details how the final target amount is calculated. */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 text-sm">
             <div className="flex justify-between text-slate-600">
                <span>Product Value</span>
                <span>PKR {basePrice.toLocaleString()}</span>
             </div>
             
             <div className="flex justify-between text-slate-600">
                <span>Delivery Fee {deliveryFee === 0 && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full ml-1">Free</span>}</span>
                <span>+ PKR {deliveryFee}</span>
             </div>

             {/* Conditionally renders the discount line item ONLY if a valid coupon is applied. */}
             {appliedCoupon && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount ({appliedCoupon.discount}%)</span>
                  <span>- PKR {discountAmount.toLocaleString()}</span>
                </div>
             )}

             <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                <span className="font-bold text-slate-800">Final Goal Amount</span>
                <span className="text-xl font-extrabold text-green-600">PKR {finalTargetAmount.toLocaleString()}</span>
             </div>
          </div>
        </div>

        {/* === RIGHT COLUMN: Interactive Settings & Coupon Input === */}
        <div className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          
          {/* Coupon Input Section */}
          <div>
             <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5"><Tag size={16}/> Have a Coupon?</label>
             <div className="flex gap-2">
               <input 
                 type="text" 
                 disabled={appliedCoupon} // Locks the input field if a coupon is currently active.
                 placeholder="Enter code" 
                 className="w-full border border-slate-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase font-mono disabled:bg-slate-50"
                 value={couponInput}
                 onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
               />
               {/* Conditional Button: "Apply" (if no coupon is active) vs "Remove" (if a coupon is active) */}
               {!appliedCoupon ? (
                 <button onClick={handleApplyCoupon} disabled={!couponInput || couponLoading} className="px-4 bg-slate-900 text-white rounded-lg font-semibold hover:bg-black disabled:opacity-50 transition-colors">
                   {couponLoading ? <Loader2 size={18} className="animate-spin" /> : "Apply"}
                 </button>
               ) : (
                 <button onClick={removeCoupon} className="px-4 bg-red-100 text-red-600 rounded-lg font-semibold hover:bg-red-200 transition-colors">
                   Remove
                 </button>
               )}
             </div>
             
             {/* Displays the dynamic success or error message underneath the coupon input. */}
             {couponMessage.text && (
                <p className={`text-xs mt-2 flex items-center gap-1 font-medium ${couponMessage.type === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {couponMessage.type === 'success' ? <CheckCircle2 size={14}/> : <XCircle size={14}/>} {couponMessage.text}
                </p>
             )}
          </div>

          <hr className="border-slate-100"/>

          {/* Goal Duration Dropdown */}
          <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Select Goal Duration</label>
              <select
                value={period}
                className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                onChange={e => {
                  setPeriod(e.target.value);
                  // Automatically calculates the target date based on the chosen dropdown value.
                  setTargetDate(calcDate(e.target.value));
                  if (error) setError(null); // Clear errors upon valid interaction.
                }}
              >
                <option value="">Select timeline...</option>
                <option value="3">3 Months</option>
                <option value="6">6 Months</option>
                <option value="12">12 Months</option>
              </select>
          </div>

          {/* Visual confirmation of the calculated target date. */}
          {targetDate && (
            <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-sm border border-blue-100 font-medium">
                📅 Target Completion: {formatDateForDisplay(targetDate)}
            </div>
          )}

          {/* Terms & Conditions Checkbox */}
          <label className="flex gap-3 items-start text-sm cursor-pointer mt-4">
            <input type="checkbox" className="w-4 h-4 text-blue-600 rounded mt-0.5" onChange={e => setTermsAccepted(e.target.checked)} />
            <span className="text-slate-600 leading-tight">
              I accept the 
              {/* Clickable text that opens the TermsModal component. */}
              <span className="text-blue-600 font-bold hover:underline ml-1" onClick={(e) => { e.preventDefault(); setShowTerms(true); }}>Terms & Conditions</span>
            </span>
          </label>

          {/* General form error display. */}
          {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 font-medium">{error}</div>}

          {/* Main Submit Button */}
          <button
            onClick={startGoal}
            disabled={loading || !product} // Disabled during network requests.
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:scale-100 active:scale-95 text-lg flex justify-center items-center gap-2"
          >
            {loading && <Loader2 size={20} className="animate-spin"/>}
            {loading ? "Creating Goal..." : "Start Goal Now"}
          </button>

        </div>
      </div>

      {/* Conditionally renders the TermsModal over the page based on the 'showTerms' boolean state. */}
      <TermsModal open={showTerms} onClose={() => setShowTerms(false)} />
    </div>
  );
}