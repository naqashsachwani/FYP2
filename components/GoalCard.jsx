export default function GoalCard({ goal }) {
  // Calculate progress percentage
  // If progressPercent is undefined/null, default to 0
  const rawPercent = Math.round(goal.progressPercent || 0);

  // Ensure percentage never exceeds 100%
  const percent = Math.min(rawPercent, 100);

  return (
    <div className="border p-4 rounded shadow bg-white flex flex-col h-full">
      
      {/* ================= Product Image ================= */}
      <div className="relative w-full h-48 bg-gray-50 rounded mb-3 overflow-hidden flex items-center justify-center">
        <img
          // Use product image if available, otherwise fallback to placeholder
          src={goal.product?.images?.[0] || "/placeholder.png"}
          alt={goal.product?.name}
          className="w-full h-full object-contain" 
          // object-contain keeps image aspect ratio without cropping
        />
      </div>

      {/* ================= Product Name ================= */}
      <h2 className="font-semibold text-lg line-clamp-1">
        {goal.product?.name || "No Product"}
      </h2>

      {/* ================= Savings Info ================= */}
      <p className="text-sm text-gray-600 mt-1">
        Saved: {goal.saved} / {goal.targetAmount}
      </p>

      {/* ================= Progress Bar ================= */}
      <div className="bg-gray-200 rounded-full h-4 mt-3 overflow-hidden">
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
      <div className="flex justify-between items-center mt-2">
        
        {/* Display capped progress percentage */}
        <span className="text-sm font-bold text-green-700">
          {percent}%
        </span>

        {/* Goal end date (formatted), fallback if missing */}
        <span className="text-xs text-gray-500">
          Ends:{" "}
          {goal.endDate
            ? new Date(goal.endDate).toLocaleDateString()
            : "--"}
        </span>
      </div>
    </div>
  );
}
