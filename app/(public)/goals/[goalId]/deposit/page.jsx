"use client";

// --- Imports ---
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, AlertCircle } from "lucide-react";

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
  if (fetching) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-green-600" /></div>;
  
  // Show error if the goal data could not be found.
  if (!goal) return <div className="min-h-screen flex items-center justify-center text-red-500">Goal not found</div>;

  return (
    // Main background container, centering the deposit card.
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        
        <div className="flex items-center gap-2 mb-6 text-gray-500 hover:text-gray-800 cursor-pointer w-fit" onClick={() => router.back()}>
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Back</span>
        </div>

        <h1 className="text-2xl font-bold mb-1 text-gray-900">Add Deposit</h1>
        <p className="text-sm text-gray-500 mb-6">Towards: {goal.product?.name}</p>

        {/* Displays the calculated remaining amount to guide the user's input. */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
            <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">Remaining Target</p>
            <p className="text-2xl font-bold text-blue-900">Rs {remaining.toLocaleString()}</p>
        </div>

        {/* Amount Input Field */}
        <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
        <input
          type="number"
          placeholder={`Max: ${remaining}`}
          value={amount}
          onChange={handleAmountChange}
          className={`border-2 p-3 w-full rounded-lg mb-2 outline-none transition-all ${error ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-green-500'}`}
        />

        {/* Conditionally renders the error alert box if the 'error' state is not null. */}
        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm mb-4 bg-red-50 p-2 rounded">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <button
          onClick={handleDeposit}
          // The button is strictly disabled if loading, if an error exists, if amount is empty, or if amount exceeds the limit.
          disabled={loading || !!error || !amount || Number(amount) > remaining} 
          // Dynamic styling based on the disabled state.
          className={`w-full py-3 rounded-lg font-bold text-white transition-all flex justify-center items-center gap-2 ${
            loading || !!error || !amount
              ? "bg-gray-400 cursor-not-allowed" 
              : "bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg"
          }`}
        >
          
          {loading ? <Loader2 className="animate-spin w-5 h-5"/> : "Proceed to Payment"}
        </button>

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