export default function GoalCard({ goal }) {
  // Calculate progress percentage
  // If progressPercent is undefined/null, default to 0
  const rawPercent = Math.round(goal.progressPercent || 0);

  // Ensure percentage never exceeds 100%
  const percent = Math.min(rawPercent, 100);

  return (
    <div className="border border-slate-200 p-4 rounded-xl shadow-sm bg-white flex flex-col h-full hover:shadow-md transition-shadow">
      
      {/* ================= Product Image ================= */}
      <div className="relative w-full h-48 bg-slate-50 rounded-lg mb-4 overflow-hidden flex items-center justify-center border border-slate-100 p-2">
        <img
          // Use product image if available, otherwise fallback to placeholder
          src={goal.product?.images?.[0] || "/placeholder.png"}
          alt={goal.product?.name}
          className="w-full h-full object-contain mix-blend-multiply" 
          // object-contain keeps image aspect ratio without cropping
        />
      </div>

      {/* ================= Product Name ================= */}
      <h2 className="font-bold text-lg text-slate-800 line-clamp-1">
        {goal.product?.name || "No Product"}
      </h2>

      {/* ================= Savings Info ================= */}
      <p className="text-sm text-slate-600 mt-1 font-medium">
        Saved: {goal.saved} / {goal.targetAmount}
      </p>

      {/* ================= Progress Bar ================= */}
      <div className="bg-slate-200 rounded-full h-3 mt-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            // Darker green when goal is fully completed
            percent >= 100 ? "bg-green-600" : "bg-green-500"
          }`}
          // Width dynamically reflects progress percentage
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* ================= Progress Footer ================= */}
      <div className="flex justify-between items-center mt-2 pt-1">
        
        {/* Display capped progress percentage */}
        <span className="text-sm font-bold text-green-700">
          {percent}%
        </span>

        {/* Goal end date (formatted) */}
        {/* Safely accepts formattedEndDate from parent, or natively enforces DD/MM/YYYY using 'en-GB' */}
        <span className="text-xs font-medium text-slate-500">
          Ends: {goal.formattedEndDate || (goal.endDate ? new Date(goal.endDate).toLocaleDateString('en-GB') : "--")}
        </span>
      </div>
    </div>
  );
}