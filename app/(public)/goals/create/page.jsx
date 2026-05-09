"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TermsModal from "@/components/TermsModal";
import { Loader2, Target, CreditCard, CalendarClock } from "lucide-react";

export default function CreateGoal() {
  const router = useRouter();

  // ================= STATE MANAGEMENT =================
  // We initialize 'showTerms' to true to ensure the user cannot access the form
  // until they have explicitly accepted the agreements in the modal.
  const [showTerms, setShowTerms] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (!form.productId || !form.targetAmount || !form.targetDate) {
        return alert("Please fill all required fields.");
    }

    setIsSubmitting(true);

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
            alert(data.error || "Something went wrong");
            setIsSubmitting(false);
            return;
        }
    
        // 4. SUCCESS FEEDBACK & NAVIGATION
        alert("Goal created successfully!");
        router.push("/goals"); // Redirect user to the goals dashboard

    } catch (error) {
        console.error("Submission error:", error);
        alert("Network error, please try again.");
        setIsSubmitting(false);
    }
  };

  // ================= RENDER LOGIC =================

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="bg-white w-full max-w-lg p-6 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
        
        <div className="text-center mb-6 sm:mb-8">
           <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Target className="text-emerald-600 w-6 h-6 sm:w-7 sm:h-7" />
           </div>
           <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Start a New Goal</h1>
           <p className="text-slate-500 mt-2 text-sm sm:text-base">Manually create a savings target.</p>
        </div>

        {showTerms ? (
          <TermsModal 
              onAccept={(accepted) => {
                  // Hide the modal if the user explicitly clicked "Accept" (true)
                  if (accepted) setShowTerms(false);
              }} 
          />
        ) : (
          // FORM UI
          <div className="space-y-4 sm:space-y-5">
            
            <div>
               <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Product ID</label>
               <input
                 type="text"
                 placeholder="Enter Product ID"
                 value={form.productId}
                 onChange={(e) => setForm({ ...form, productId: e.target.value })}
                 className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm sm:text-base"
               />
            </div>

            <div>
               <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><CreditCard size={14}/> Target Amount (PKR)</label>
               <input
                 type="number"
                 placeholder="0.00"
                 value={form.targetAmount}
                 onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
                 className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm sm:text-base font-mono"
               />
            </div>

            <div>
               <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><CalendarClock size={14}/> Target Date</label>
               <input
                 type="date"
                 value={form.targetDate}
                 onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
                 className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm sm:text-base text-slate-700"
               />
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full mt-2 bg-emerald-600 text-white px-4 py-3.5 sm:py-4 rounded-xl hover:bg-emerald-700 font-bold shadow-md shadow-emerald-500/20 active:scale-[0.98] disabled:active:scale-100 transition-all text-sm sm:text-base flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : "Create Goal"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}