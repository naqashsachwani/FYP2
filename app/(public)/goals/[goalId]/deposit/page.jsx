"use client";

// --- Imports ---
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, AlertCircle, CreditCard } from "lucide-react";

export default function DepositPage() {
  // Extracts the dynamic 'goalId' from the URL 
  const { goalId } = useParams();
  const router = useRouter();
  
  const [amount, setAmount] = useState("");
  // goal: Stores the fetched goal data to calculate the maximum allowed deposit.
  const [goal, setGoal] = useState(null); 
  const [loading, setLoading] = useState(false); 
  // fetching: Controls the initial full-page loading state while getting goal data from the API.
  const [fetching, setFetching] = useState(true); 
  const [error, setError] = useState(null);

  // FETCH GOAL DATA (To get Target & Saved amounts)
  useEffect(() => {
    const fetchGoal = async () => {
      try {
        // reuse the existing GET endpoint to get details
        const res = await fetch(`/api/goals/${goalId}`);
        const data = await res.json();
        
        if (data.goal) {
          setGoal(data.goal);
        } else {
          setError("Goal not found");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load goal details");
      } finally {
        // Always turn off the initial fetching skeleton/spinner regardless of success or failure.
        setFetching(false);
      }
    };

    // Ensure goalId exists before attempting to fetch.
    if (goalId) fetchGoal();
  }, [goalId]);

  // Calculate Remaining Amount
  const remaining = goal ? Math.max(0, goal.targetAmount - goal.saved) : 0;

  // This function runs every time the user types a number in the input field.
  const handleAmountChange = (e) => {
    const val = e.target.value;
    setAmount(val); 
    
    const numVal = Number(val);

    if (numVal > remaining) {
      setError(`Amount cannot exceed Rs ${remaining.toLocaleString()}`);
    } else if (numVal < 0) {
      setError("Amount must be positive");
    } else {
      setError(null);
    }
  };

  
  const handleDeposit = async () => {
    if (!amount || Number(amount) <= 0) return setError("Enter a valid amount");
    if (Number(amount) > remaining) return setError(`Maximum deposit allowed is ${remaining}`);

    setLoading(true); 
    try {
      // Send a POST request to your backend to generate a Stripe Checkout session.
      const res = await fetch(`/api/goals/${goalId}/deposit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount) }),
      });

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Stripe checkout failed");

      //  EXTERNAL REDIRECT
      window.location.href = data.checkoutUrl;
      
    } catch (err) {
      setError(err.message);
      setLoading(false); // Unlock the button so the user can try again.
    }
  };


  // Show full-page spinner while initially fetching goal data.
  if (fetching) return <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-green-600 w-10 h-10" /></div>;
  
  // Show error if the goal data could not be found.
  if (!goal) return <div className="min-h-[100dvh] flex items-center justify-center text-red-500 font-bold bg-slate-50">Goal not found</div>;

  return (
    // Main background container, centering the deposit card.
    <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="bg-white p-6 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-200/50 w-full max-w-md border border-slate-100">
        
        <button className="flex items-center gap-1.5 mb-5 sm:mb-6 text-slate-500 hover:text-slate-800 transition-colors w-fit border border-slate-200 bg-white px-3 py-1.5 rounded-lg shadow-sm font-bold text-xs sm:text-sm" onClick={() => router.back()}>
            <ArrowLeft size={16} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Back</span>
        </button>

        <div className="mb-6 sm:mb-8 text-center sm:text-left">
           <h1 className="text-2xl sm:text-3xl font-extrabold mb-1.5 text-slate-900 flex items-center justify-center sm:justify-start gap-2.5">
             <CreditCard className="text-emerald-600 w-6 h-6 sm:w-7 sm:h-7" /> Add Deposit
           </h1>
           <p className="text-xs sm:text-sm text-slate-500 truncate font-medium">Towards: <span className="font-bold text-slate-700">{goal.product?.name}</span></p>
        </div>

        {/* Displays the calculated remaining amount to guide the user's input. */}
        <div className="bg-blue-50 border border-blue-200 p-4 sm:p-5 rounded-xl sm:rounded-2xl mb-5 sm:mb-6 flex flex-col items-center sm:items-start justify-center text-center sm:text-left shadow-inner">
            <p className="text-[10px] sm:text-xs text-blue-600 font-bold uppercase tracking-widest mb-0.5">Remaining Target</p>
            <p className="text-2xl sm:text-3xl font-black font-mono text-blue-900 tracking-tighter">Rs {remaining.toLocaleString()}</p>
        </div>

        {/* Amount Input Field */}
        <div className="mb-5 sm:mb-6">
           <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Amount (PKR)</label>
           <input
             type="number"
             placeholder={`Max: ${remaining}`}
             value={amount}
             onChange={handleAmountChange}
             className={`border-2 p-3 sm:p-3.5 w-full rounded-xl outline-none font-mono text-sm sm:text-base transition-shadow bg-slate-50 focus:bg-white ${error ? 'border-red-500 focus:ring-4 focus:ring-red-500/20' : 'border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20'}`}
           />
        </div>

        {/* Conditionally renders the error alert box if the 'error' state is not null. */}
        {error && (
          <div className="flex items-center gap-2 text-red-600 text-xs sm:text-sm mb-5 bg-red-50 p-3 sm:p-3.5 rounded-xl border border-red-200 font-bold animate-in fade-in slide-in-from-bottom-2">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        <div className="flex flex-col gap-2.5 sm:gap-3">
           <button
             onClick={handleDeposit}
             // The button is strictly disabled if loading, if an error exists, if amount is empty, or if amount exceeds the limit.
             disabled={loading || !!error || !amount || Number(amount) > remaining} 
             // Dynamic styling based on the disabled state.
             className={`w-full py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-white transition-all flex justify-center items-center gap-2 text-sm sm:text-base active:scale-[0.98] disabled:active:scale-100 ${
               loading || !!error || !amount
                 ? "bg-slate-300 text-slate-500 cursor-not-allowed" 
                 : "bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
             }`}
           >
             {loading ? <Loader2 className="animate-spin w-5 h-5"/> : "Proceed to Payment"}
           </button>

           <button
             onClick={() => router.back()}
             className="w-full py-3.5 sm:py-4 rounded-xl sm:rounded-2xl text-sm sm:text-base text-slate-600 font-bold bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
           >
             Cancel
           </button>
        </div>
      </div>
    </div>
  );
}