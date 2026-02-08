"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, AlertCircle } from "lucide-react";

export default function DepositPage() {
  // 1. URL PARAMETERS
  const { goalId } = useParams();
  const router = useRouter();

  // 2. STATE MANAGEMENT
  const [amount, setAmount] = useState("");
  const [goal, setGoal] = useState(null); // Store goal data to calculate limits
  const [loading, setLoading] = useState(false); // For checkout process
  const [fetching, setFetching] = useState(true); // For initial data load
  const [error, setError] = useState(null);

  // 3. FETCH GOAL DATA (To get Target & Saved amounts)
  useEffect(() => {
    const fetchGoal = async () => {
      try {
        // We reuse the existing GET endpoint to get details
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
        setFetching(false);
      }
    };

    if (goalId) fetchGoal();
  }, [goalId]);

  // Calculate Remaining Amount
  const remaining = goal ? Math.max(0, goal.targetAmount - goal.saved) : 0;

  // 4. HANDLE INPUT CHANGE WITH VALIDATION
  const handleAmountChange = (e) => {
    const val = e.target.value;
    setAmount(val);
    
    const numVal = Number(val);

    // Immediate validation feedback
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
      // 5. API CALL (INITIATE CHECKOUT)
      const res = await fetch(`/api/goals/${goalId}/deposit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount) }),
      });

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Stripe checkout failed");

      // 6. EXTERNAL REDIRECT
      window.location.href = data.checkoutUrl;
      
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (fetching) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-green-600" /></div>;
  if (!goal) return <div className="min-h-screen flex items-center justify-center text-red-500">Goal not found</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        
        <div className="flex items-center gap-2 mb-6 text-gray-500 hover:text-gray-800 cursor-pointer w-fit" onClick={() => router.back()}>
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Back</span>
        </div>

        <h1 className="text-2xl font-bold mb-1 text-gray-900">Add Deposit</h1>
        <p className="text-sm text-gray-500 mb-6">Towards: {goal.product?.name}</p>

        {/* REMAINING LIMIT BADGE */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
            <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">Remaining Target</p>
            <p className="text-2xl font-bold text-blue-900">Rs {remaining.toLocaleString()}</p>
        </div>

        <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
        <input
          type="number"
          placeholder={`Max: ${remaining}`}
          value={amount}
          onChange={handleAmountChange}
          className={`border-2 p-3 w-full rounded-lg mb-2 outline-none transition-all ${error ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-green-500'}`}
        />

        {/* ERROR MESSAGE DISPLAY */}
        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm mb-4 bg-red-50 p-2 rounded">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* MAIN ACTION BUTTON */}
        <button
          onClick={handleDeposit}
          disabled={loading || !!error || !amount || Number(amount) > remaining} 
          className={`w-full py-3 rounded-lg font-bold text-white transition-all flex justify-center items-center gap-2 ${
            loading || !!error || !amount
              ? "bg-gray-400 cursor-not-allowed" 
              : "bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg"
          }`}
        >
          {loading ? <Loader2 className="animate-spin w-5 h-5"/> : "Proceed to Payment"}
        </button>

        {/* CANCEL BUTTON */}
        <button
          onClick={() => router.back()}
          className="w-full mt-3 py-3 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}