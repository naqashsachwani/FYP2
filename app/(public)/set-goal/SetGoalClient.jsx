'use client';

import { useSearchParams, useRouter } from "next/navigation";
// useSearchParams → reads query parameters from URL 
// useRouter → used for navigation, redirect, and refresh
import { useEffect, useState } from "react";
// useState → manage component state
// useEffect → handle lifecycle events like data fetching
import Image from "next/image";
import { useUser } from "@clerk/nextjs";


/* ================= TERMS MODAL ================= */
function TermsModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full">
        <h2 className="text-xl font-semibold mb-3">Terms & Conditions</h2>

        <ul className="text-sm list-disc pl-5 space-y-1">
          <li>Deposits are tracked against your savings goal</li>
          <li>Products are reserved until goal completion</li>
          <li>Refunds require admin approval</li>
          <li>No hidden charges</li>
        </ul>

        <div className="mt-4 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            I Accept
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= MAIN PAGE ================= */
export default function SetGoalClient() {
  // Handles goal creation UI and logic

  const { user } = useUser();
  // Gets logged-in user details
  
  const searchParams = useSearchParams();
  const router = useRouter();

  const productId = searchParams.get("productId");
  // Reads productId from URL query parameters

  /* ================= STATE MANAGEMENT ================= */
  const [product, setProduct] = useState(null);
  // Stores fetched product details
  const [period, setPeriod] = useState("");
  // Stores selected goal duration (months)
  const [targetDate, setTargetDate] = useState("");
  // Stores calculated goal end date

  const [termsAccepted, setTermsAccepted] = useState(false);
  // Tracks whether user accepted terms
  const [showTerms, setShowTerms] = useState(false);
  // Controls visibility of Terms modal

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  // UI feedback messages
  const [loading, setLoading] = useState(false);
  // Prevents multiple submissions and shows loading state

  // function to calculate target date based on selected months
  const calcDate = (m) => {
    if (!m) return "";
    const d = new Date();
    d.setMonth(d.getMonth() + Number(m));
    // Adds selected months to current date

    return d.toISOString().split("T")[0];
  };

  /* ================= FETCH PRODUCT DATA ================= */
  useEffect(() => {
    // Runs when productId changes
    if (!productId) return;
    // Prevents unnecessary API call

    fetch(`/api/products/${productId}`)
      .then(r => r.json())
      .then(d => setProduct(d.product));
    // Fetches product details and stores in state
  }, [productId]);

  /* ================= START GOAL ================= */
  const startGoal = async () => {
    setError(null);
    // Reset previous error

    // Frontend validation to avoid bad requests
    if (!period) return setError("Please select a time period.");
    if (!targetDate) return setError("Target date is invalid. Please re-select period.");
    if (!termsAccepted) return setError("Accept terms first");

    setLoading(true);
    // Disable button and show loading text

    try {
      // API call to create a savings goal
      const res = await fetch("/api/set-goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store", // Prevents cached responses
        body: JSON.stringify({
          productId,
          targetAmount: product.price,
          targetDate, // Goal end date
          status: "ACTIVE", // Goal starts immediately
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create goal");
      }

      // Success handling
      setSuccess("Goal started! Redirecting...");
      router.refresh();
      // Refreshes server data
      router.push(`/goals/${data.goal.id}`);
      // Redirects user to newly created goal page

    } catch (err) {
      setLoading(false);
      setError(err.message);
      // Error handling for failed API call
    }
  };

  /* ================= UI RENDER ================= */
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow">
      {/* Centered container */}

      <h1 className="text-2xl font-semibold mb-4">Set Savings Goal</h1>

      {product && (
        // Conditional rendering to avoid null errors
        <div className="flex gap-4 mb-4 p-4 bg-gray-50 rounded">
          {product.images?.[0] && (
            <Image
              src={product.images[0]}
              width={80}
              height={80}
              alt=""
            />
          )}
          <div>
            <p className="font-semibold">{product.name}</p>
            <p>Price: {product.price}</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <select
          value={period}
          className="w-full border p-2 rounded"
          onChange={e => {
            const val = e.target.value;
            setPeriod(val);
            setTargetDate(calcDate(val));
            // Automatically updates target date
            if (error) setError(null);
          }}
        >
          <option value="">Select period</option>
          <option value="3">3 Months</option>
          <option value="6">6 Months</option>
          <option value="12">12 Months</option>
        </select>

        {/* Shows calculated goal end date */}
        {targetDate && (
          <p className="text-sm text-gray-500">
            Goal End Date: <span className="font-semibold">{targetDate}</span>
          </p>
        )}

        <label className="flex gap-2 text-sm">
          <input
            type="checkbox"
            onChange={e => setTermsAccepted(e.target.checked)}
          />
          Accept{" "}
          <span
            className="text-blue-600 cursor-pointer"
            onClick={() => setShowTerms(true)}
          >
            Terms
          </span>
        </label>

        {/* Error & success messages */}
        {error && <p className="text-red-600">{error}</p>}
        {success && <p className="text-green-600">{success}</p>}

        <button
          onClick={startGoal}
          disabled={loading}
          className="w-full bg-black text-white py-2 rounded"
        >
          {loading ? "Processing..." : "Start Goal"}
        </button>
      </div>

      <TermsModal
        open={showTerms}
        onClose={() => setShowTerms(false)}
      />
    </div>
  );
}
