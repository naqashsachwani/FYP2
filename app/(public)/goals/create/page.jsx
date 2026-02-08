"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TermsModal from "@/components/TermsModal";

export default function CreateGoal() {
  const router = useRouter();

  // ================= STATE MANAGEMENT =================
  // We initialize 'showTerms' to true to ensure the user cannot access the form
  // until they have explicitly accepted the agreements in the modal.
  const [showTerms, setShowTerms] = useState(true);

  // Form State: Stores inputs for the POST request
  const [form, setForm] = useState({ 
    productId: "", 
    targetAmount: "", 
    targetDate: "" 
  });

  // ================= HANDLERS =================

  const handleSubmit = async () => {
    // 1. CLIENT-SIDE VALIDATION
    // Prevent unnecessary API calls if required fields are missing.
    if (!form.productId || !form.targetAmount) {
        return alert("Fill all required fields");
    }

    try {
        // 2. API INTEGRATION
        const res = await fetch("/api/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
    
        const data = await res.json();
    
        // 3. ERROR HANDLING
        if (!res.ok) {
            return alert(data.error || "Something went wrong");
        }
    
        // 4. SUCCESS FEEDBACK & NAVIGATION
        alert("Goal created successfully!");
        router.push("/goals"); // Redirect user to the goals dashboard

    } catch (error) {
        console.error("Submission error:", error);
        alert("Network error, please try again.");
    }
  };

  // ================= RENDER LOGIC =================

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-xl font-bold mb-3">Start a New Goal</h1>

      {showTerms ? (
        <TermsModal 
            onAccept={(accepted) => {
                // Hide the modal if the user explicitly clicked "Accept" (true)
                if (accepted) setShowTerms(false);
            }} 
        />
      ) : (
        // FORM UI
        <div className="space-y-3">
          
          <input
            type="text"
            placeholder="Product ID"
            value={form.productId}
            onChange={(e) => setForm({ ...form, productId: e.target.value })}
            className="border p-2 w-full rounded"
          />

          <input
            type="number"
            placeholder="Target Amount"
            value={form.targetAmount}
            onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
            className="border p-2 w-full rounded"
          />

          <input
            type="date"
            value={form.targetDate}
            onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
            className="border p-2 w-full rounded"
          />

          <button
            onClick={handleSubmit}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
          >
            Create Goal
          </button>
        </div>
      )}
    </div>
  );
}