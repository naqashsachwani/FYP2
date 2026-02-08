'use client' 
import Image from "next/image" 
import { 
  MapPin, 
  Mail, 
  Phone, 
  Calendar, 
  User, 
  Store as StoreIcon, 
  FileText, 
  CreditCard, 
  Hash
} from "lucide-react" 
const StoreInfo = ({ store }) => {
  //  DESTRUCTURING: We extract storeApplication immediately.
  // INTERVIEW TIP: This makes the code cleaner. Instead of typing 'store.storeApplication.cnic', we can just type 'storeApplication.cnic'.
  const { storeApplication } = store;

  // HELPER FUNCTION: Dynamic Styling
  // Instead of cluttering the JSX with complex ternary operators, extract logic into a function.
  // This adheres to the "Separation of Concerns" principle within the component.
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200'
      case 'approved': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-slate-100 text-slate-800 border-slate-200'
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-200">
      
      {/* --- Header Section (Logo, Name, Status) --- */}
      {/* Flexbox is used here to align the Logo next to the Text. 'flex-col sm:flex-row' makes it responsive (stack on mobile, row on desktop). */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-8">
        
        {/*  SHRINK-0: Prevents the image from getting squashed if the text content is too long. */}
        <div className="relative shrink-0">
          <Image
            width={120}
            height={120}
            // FALLBACK LOGIC: If store.logo is missing/null, we fall back to a placeholder to prevent broken UI.
            src={store.logo || "/placeholder-logo.png"} 
            alt={store.name}
            className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-2xl border-4 border-white shadow-md bg-slate-100"
          />
          {/* Badge Icon overlaying the image */}
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
            <StoreIcon size={12} className="text-white" />
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-2xl font-bold text-slate-800">{store.name}</h3>
            <span className="text-slate-500 text-sm bg-slate-100 px-3 py-1 rounded-full">@{store.username}</span>

            {/* DYNAMIC CLASS INJECTION: We call the helper function here to apply colors based on data. */}
            <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold border ${getStatusColor(store.status)}`}>
              {/* Conditional dot color */}
              <div className={`w-2 h-2 rounded-full mr-2 ${
                store.status === 'pending' ? 'bg-yellow-500' :
                store.status === 'rejected' ? 'bg-red-500' : 'bg-green-500'
              }`} />
              {/* Capitalize first letter of status */}
              {store.status.charAt(0).toUpperCase() + store.status.slice(1)}
            </span>
          </div>

          <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
            {store.description}
          </p>
        </div>
      </div>

      {/* --- Details Grid --- */}
      {/* CSS GRID: We use a 1-column grid on mobile and 2-column grid on desktop (md:grid-cols-2). */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8 mt-8">
        
        {/* Left Col: Contact & Legal Info */}
        <div className="space-y-6">
          {/* Contact Group */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <MapPin size={18} className="text-blue-500" />
              Contact Information
            </h4>
            
            <div className="space-y-3">
              {/* ARRAY MAPPING :
                  Instead of hardcoding 3 separate divs, we create an array of data and map over it.
                  This makes the code cleaner, easier to maintain, and scalable if we want to add more fields later. */}
              {[
                { icon: <MapPin size={16} className="text-slate-400" />, label: store.address },
                { icon: <Phone size={16} className="text-slate-400" />, label: store.contact },
                { icon: <Mail size={16} className="text-slate-400" />, label: store.email }
              ].map((item, i) => (
                // 'key' prop is essential for React's reconciliation algorithm to track list items efficiently.
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  {item.icon}
                  {/* 'break-all' ensures long emails don't overflow the container on small screens. */}
                  <span className="text-slate-700 text-sm sm:text-base break-all">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Legal & Financial Group */}
          {/* CONDITIONAL RENDERING:
              We check `storeApplication &&` before rendering. 
              If `storeApplication` is null/undefined, this entire block is skipped. 
              This prevents "Cannot read property of undefined" runtime errors. */}
          {storeApplication && (
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <h4 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <CreditCard size={18} className="text-emerald-500" />
                Legal & Financial
              </h4>
              
              <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
                 {/* CNIC Row */}
                 <div className="flex justify-between items-center p-3 border-b border-slate-100">
                    <span className="text-slate-500 text-sm flex items-center gap-2">
                        <FileText size={14}/> CNIC
                    </span>
                    {/* Fallback for missing data using logical OR (||) */}
                    <span className="font-mono text-slate-700 font-medium">{storeApplication.cnic || "N/A"}</span>
                 </div>
                 
                 {/* Tax ID Row */}
                 <div className="flex justify-between items-center p-3 border-b border-slate-100">
                    <span className="text-slate-500 text-sm flex items-center gap-2">
                        <Hash size={14}/> Tax ID (NTN)
                    </span>
                    <span className="font-mono text-slate-700 font-medium">{storeApplication.taxId || "N/A"}</span>
                 </div>

                 {/* Bank Details */}
                 <div className="p-3 bg-slate-100/50">
                    <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Bank Account</p>
                    <div className="flex justify-between items-end">
                        <span className="text-slate-800 font-medium">{storeApplication.bankName || "Unknown Bank"}</span>
                        <span className="text-slate-600 font-mono text-sm">{storeApplication.accountNumber || "No Account Info"}</span>
                    </div>
                 </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Application Metadata */}
        <div className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Calendar size={18} className="text-purple-500" />
              Application Details
            </h4>

            <div className="space-y-4">
              {/* Applied On */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-100">
                <p className="text-slate-600 text-sm mb-1">Applied On</p>
                <p className="text-slate-800 font-semibold">
                  {/* DATE FORMATTING:
                      convert the raw ISO string  into a  human-readable format using the native JavaScript Intl API (.toLocaleDateString). */}
                  {new Date(store.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              {/* Applied By */}
              <div className="p-4 bg-white border border-slate-200 rounded-2xl">
                <p className="text-slate-600 text-sm mb-3 flex items-center gap-2">
                  <User size={14} />
                  Applied By
                </p>
                <div className="flex items-center gap-3">
                  <Image
                    width={40}
                    height={40}
                    src={store.user.image}
                    alt={store.user.name}
                    className="w-10 h-10 rounded-xl border border-slate-200 shadow-sm"
                  />
                  <div>
                    <p className="text-slate-800 font-semibold">{store.user.name}</p>
                    <p className="text-slate-500 text-sm">{store.user.email}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StoreInfo