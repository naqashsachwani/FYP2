'use client';

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";

/* ================= TERMS MODAL ================= */
function TermsModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full shadow-xl">
        <h2 className="text-xl font-semibold mb-3">Terms & Conditions</h2>

        <ul className="text-sm list-disc pl-5 space-y-2 text-gray-700">
          <li>Deposits are tracked against your savings goal.</li>
          <li>Products are reserved (price locked) until goal completion.</li>
          <li>Refunds require admin approval.</li>
          <li>No hidden charges or interest fees.</li>
        </ul>

        <div className="mt-6 text-right">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
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
  const { user } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();

  const productId = searchParams.get("productId");

  /* ================= STATE MANAGEMENT ================= */
  const [product, setProduct] = useState(null);
  const [period, setPeriod] = useState("");
  const [targetDate, setTargetDate] = useState(""); // Kept as YYYY-MM-DD for API consistency
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  // Helper: Calculates YYYY-MM-DD for the backend
  const calcDate = (m) => {
    if (!m) return "";
    const d = new Date();
    d.setMonth(d.getMonth() + Number(m));
    return d.toISOString().split("T")[0]; // Returns YYYY-MM-DD
  };

  // ✅ Helper: Formats date to DD-MM-YYYY for Display
  const formatDateForDisplay = (isoDate) => {
    if (!isoDate) return "";
    const [year, month, day] = isoDate.split("-");
    return `${day}-${month}-${year}`;
  };

  /* ================= FETCH PRODUCT DATA ================= */
  useEffect(() => {
    if (!productId) return;
    fetch(`/api/products/${productId}`)
      .then(r => r.json())
      .then(d => setProduct(d.product))
      .catch(err => console.error("Failed to load product", err));
  }, [productId]);

  /* ================= START GOAL ================= */
  const startGoal = async () => {
    setError(null);

    // Validation
    if (!period) return setError("Please select a time period.");
    if (!targetDate) return setError("Target date is invalid. Please re-select period.");
    if (!termsAccepted) return setError("You must accept the terms first.");

    setLoading(true);

    try {
      // API call to create goal
      const res = await fetch("/api/set-goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          productId,
          targetAmount: product.price,
          targetDate, // Sends YYYY-MM-DD (Correct for DB)
          status: "ACTIVE",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create goal");
      }

      setSuccess("Goal started successfully! Redirecting...");
      router.refresh();
      // Redirect to the new goal dashboard
      router.push(`/goals/${data.goal.id}`);

    } catch (err) {
      setLoading(false);
      setError(err.message);
    }
  };

  /* ================= UI RENDER ================= */
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-md border border-gray-100 mt-10">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Set Your Savings Goal</h1>

      {product ? (
        <div className="flex gap-4 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100 items-center">
          {product.images?.[0] && (
            <div className="relative w-20 h-20 shrink-0">
               <Image
                 src={product.images[0]}
                 fill
                 className="object-cover rounded-lg"
                 alt={product.name}
               />
            </div>
          )}
          <div>
            <p className="font-bold text-lg text-gray-900">{product.name}</p>
            <p className="text-indigo-600 font-semibold">Price: PKR {product.price.toLocaleString()}</p>
          </div>
        </div>
      ) : (
        <div className="p-4 mb-6 text-gray-400 bg-gray-50 rounded animate-pulse">Loading Product...</div>
      )}

      <div className="space-y-6">
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Duration</label>
            <select
              value={period}
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              onChange={e => {
                const val = e.target.value;
                setPeriod(val);
                setTargetDate(calcDate(val));
                if (error) setError(null);
              }}
            >
              <option value="">Select period</option>
              <option value="3">3 Months</option>
              <option value="6">6 Months</option>
              <option value="12">12 Months</option>
            </select>
        </div>

        {/* ✅ UPDATED: Shows DD-MM-YYYY */}
        {targetDate && (
          <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-sm border border-blue-100 flex items-center gap-2">
             📅 Goal End Date: <span className="font-bold">{formatDateForDisplay(targetDate)}</span>
          </div>
        )}

        <label className="flex gap-3 items-center text-sm p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
          <input
            type="checkbox"
            className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
            onChange={e => setTermsAccepted(e.target.checked)}
          />
          <span className="text-gray-600">
            I accept the {" "}
            <span
              className="text-indigo-600 font-bold hover:underline"
              onClick={(e) => {
                e.preventDefault(); // Prevent checkbox toggle when clicking link
                setShowTerms(true);
              }}
            >
              Terms & Conditions
            </span>
          </span>
        </label>

        {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}
        {success && <div className="p-3 bg-green-50 text-green-600 text-sm rounded-lg border border-green-100">{success}</div>}

        <button
          onClick={startGoal}
          disabled={loading || !product}
          className="w-full bg-black hover:bg-gray-900 text-white font-bold py-3.5 rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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