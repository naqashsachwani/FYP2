// Declares this as a Client Component in Next.js, allowing the use of React hooks and browser APIs.
"use client";

// --- Imports ---
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, AlertCircle } from "lucide-react";

export default function DepositPage() {
  // 1. URL PARAMETERS
  // Extracts the dynamic 'goalId' from the URL (e.g., /goals/123/deposit -> goalId = 123)
  const { goalId } = useParams();
  // Initializes the Next.js router for programmatic navigation (like going back)
  const router = useRouter();

  // 2. STATE MANAGEMENT
  // amount: Tracks the user's input for how much they want to deposit.
  const [amount, setAmount] = useState("");
  // goal: Stores the fetched goal data to calculate the maximum allowed deposit.
  const [goal, setGoal] = useState(null); 
  // loading: Controls the spinner state specifically when the user clicks "Proceed to Payment".
  const [loading, setLoading] = useState(false); 
  // fetching: Controls the initial full-page loading state while getting goal data from the API.
  const [fetching, setFetching] = useState(true); 
  // error: Stores and displays validation or network error messages.
  const [error, setError] = useState(null);

  // 3. FETCH GOAL DATA (To get Target & Saved amounts)
  // This effect runs once when the component mounts (or if goalId changes) to fetch goal details.
  useEffect(() => {
    const fetchGoal = async () => {
      try {
        // We reuse the existing GET endpoint to get details
        const res = await fetch(`/api/goals/${goalId}`);
        const data = await res.json();
        
        // If the backend successfully returns goal data, save it to state.
        if (data.goal) {
          setGoal(data.goal);
        } else {
          // If no goal is found, set an error to block the UI.
          setError("Goal not found");
        }
      } catch (err) {
        // Log network errors and show a user-friendly error message.
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
  // Math.max(0, ...) ensures the remaining amount never drops below 0 if somehow saved > target.
  const remaining = goal ? Math.max(0, goal.targetAmount - goal.saved) : 0;

  // 4. HANDLE INPUT CHANGE WITH VALIDATION
  // This function runs every time the user types a number in the input field.
  const handleAmountChange = (e) => {
    const val = e.target.value;
    setAmount(val); // Update the input state immediately.
    
    const numVal = Number(val);

    // Immediate validation feedback: checks if the amount exceeds the remaining target or is negative.
    if (numVal > remaining) {
      setError(`Amount cannot exceed Rs ${remaining.toLocaleString()}`);
    } else if (numVal < 0) {
      setError("Amount must be positive");
    } else {
      // Clear the error if the input is valid.
      setError(null);
    }
  };

  // 5. HANDLE SUBMISSION
  const handleDeposit = async () => {
    // Final safety checks before hitting the API.
    if (!amount || Number(amount) <= 0) return setError("Enter a valid amount");
    if (Number(amount) > remaining) return setError(`Maximum deposit allowed is ${remaining}`);

    setLoading(true); // Start the checkout loading spinner.
    try {
      // 5. API CALL (INITIATE CHECKOUT)
      // Send a POST request to your backend to generate a Stripe Checkout session.
      const res = await fetch(`/api/goals/${goalId}/deposit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount) }),
      });

      const data = await res.json();
      
      // Throw an error if the server returns a non-200 status.
      if (!res.ok) throw new Error(data.error || "Stripe checkout failed");

      // 6. EXTERNAL REDIRECT
      // Standard Next.js router.push doesn't work well for external URLs (like Stripe).
      // window.location.href forces the browser to navigate to the external Stripe checkout page.
      window.location.href = data.checkoutUrl;
      
    } catch (err) {
      // Catch and display any errors during the checkout initiation.
      setError(err.message);
      setLoading(false); // Unlock the button so the user can try again.
    }
  };

  // ================= RENDER LOGIC =================

  // Render Guard 1: Show full-page spinner while initially fetching goal data.
  if (fetching) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-green-600" /></div>;
  
  // Render Guard 2: Show error if the goal data could not be found.
  if (!goal) return <div className="min-h-screen flex items-center justify-center text-red-500">Goal not found</div>;

  return (
    // Main background container, centering the deposit card.
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        
        {/* Back Navigation Button */}
        <div className="flex items-center gap-2 mb-6 text-gray-500 hover:text-gray-800 cursor-pointer w-fit" onClick={() => router.back()}>
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Back</span>
        </div>

        {/* Page Header */}
        <h1 className="text-2xl font-bold mb-1 text-gray-900">Add Deposit</h1>
        <p className="text-sm text-gray-500 mb-6">Towards: {goal.product?.name}</p>

        {/* REMAINING LIMIT BADGE */}
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
          // Dynamic border coloring: red if there's an error, normal otherwise.
          className={`border-2 p-3 w-full rounded-lg mb-2 outline-none transition-all ${error ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-green-500'}`}
        />

        {/* ERROR MESSAGE DISPLAY */}
        {/* Conditionally renders the error alert box if the 'error' state is not null. */}
        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm mb-4 bg-red-50 p-2 rounded">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* MAIN ACTION BUTTON */}
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
          {/* Swaps the text out for a spinner if the API call is in progress. */}
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