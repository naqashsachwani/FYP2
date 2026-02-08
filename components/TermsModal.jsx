'use client'; // Marks this component as a client-side React component in Next.js

// TermsModal component receives `open` (boolean) and `onClose` (function) props
export default function TermsModal({ open, onClose }) {
  // If modal is not open, render nothing
  if (!open) return null;

  return (
    // Overlay: full-screen semi-transparent background
    <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50">
      
      {/* Modal container */}
      <div className="bg-white p-6 rounded-lg max-w-lg w-full relative">
        
        {/* Modal title */}
        <h2 className="text-xl font-semibold mb-4">Terms & Conditions</h2>
        
        {/* Modal content: scrollable if content is long */}
        <div className="text-sm max-h-80 overflow-y-auto mb-4">
          <p>By starting a savings goal, you agree to the following terms:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>You will deposit funds according to the selected payment method.</li>
            <li>The product will be reserved for you until full payment is completed.</li>
            <li>Deposits will be tracked and reflected in your progress dashboard.</li>
            <li>No interest or hidden fees are applied. Refunds require admin approval.</li>
            <li>You are responsible for maintaining accurate payment information.</li>
          </ul>
        </div>

        {/* Close button (top-right corner) */}
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
          onClick={onClose} // Calls the onClose function when clicked
        >
          ✕
        </button>

        {/* Accept button at the bottom */}
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mt-2"
          onClick={onClose} // Also closes the modal when accepted
        >
          I Accept
        </button>
      </div>
    </div>
  );
}
