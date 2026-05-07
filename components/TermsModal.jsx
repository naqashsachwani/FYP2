'use client'; // Marks this component as a client-side React component in Next.js

// TermsModal component receives `open` (boolean) and `onClose` (function) props
export default function TermsModal({ open, onClose }) {
  // If modal is not open, render nothing
  if (!open) return null;

  return (
    // Overlay: full-screen semi-transparent background
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      
      {/* Modal container */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl max-w-lg w-[95%] sm:w-full relative shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Modal title */}
        <h2 className="text-lg sm:text-xl font-bold mb-4 text-slate-800 pr-6">Terms & Conditions</h2>
        
        {/* Modal content: scrollable if content is long */}
        <div className="text-xs sm:text-sm text-slate-600 max-h-[60vh] overflow-y-auto mb-5 custom-scrollbar pr-2 leading-relaxed">
          <p className="font-medium text-slate-700 mb-2">By starting a savings goal, you agree to the following terms:</p>
          <ul className="list-disc pl-5 mt-2 space-y-2">
            <li>You will deposit funds according to the selected payment method.</li>
            <li>The product will be reserved for you until full payment is completed.</li>
            <li>Deposits will be tracked and reflected in your progress dashboard.</li>
            <li>No interest or hidden fees are applied. Refunds require admin approval.</li>
            <li>You are responsible for maintaining accurate payment information.</li>
          </ul>
        </div>

        {/* Close button (top-right corner) */}
        <button
          className="absolute top-4 right-4 p-1 text-gray-400 hover:bg-gray-100 hover:text-red-500 rounded-full transition-colors"
          onClick={onClose} // Calls the onClose function when clicked
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        {/* Accept button at the bottom */}
        <button
          className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors active:scale-95"
          onClick={onClose} // Also closes the modal when accepted
        >
          I Accept
        </button>
      </div>
    </div>
  );
}