"use client";

import { useState, useEffect } from "react";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2, Car, CreditCard, ShieldCheck, Upload, Clock, ShieldAlert, Ban } from "lucide-react";

export default function RiderSignupPage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();

  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [existingProfile, setExistingProfile] = useState(null);
  const [isReapplying, setIsReapplying] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const [formData, setFormData] = useState({
    phoneNumber: "", 
    vehicleType: "BIKE",
    vehiclePlate: "",
    cnicNumber: "",
    licenseNumber: "",
  });

  useEffect(() => {
    const checkProfile = async () => {
        if (!userId) {
            setIsCheckingStatus(false);
            return;
        }
        try {
            const res = await fetch("/api/rider/register");
            const data = await res.json();
            
            if (data.profile) {
                setExistingProfile(data.profile);
                
                // If approved, wait 3 full seconds before redirecting
                if (data.profile.status === "APPROVED") {
                    setTimeout(() => {
                        router.push("/rider/dashboard");
                    }, 3000); 
                }
            }
        } catch (error) {
            console.error("Status check failed", error);
        } finally {
            setIsCheckingStatus(false);
        }
    };

    if (isLoaded) checkProfile();
  }, [isLoaded, userId, router]);

  if (!isLoaded || isCheckingStatus) return <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-green-600 w-10 h-10" /></div>;

  if (isLoaded && !userId) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <ShieldCheck className="w-16 h-16 sm:w-20 sm:h-20 text-green-500 mb-4 sm:mb-6" />
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-6 max-w-md">Please login to continue.</h2>
        <SignInButton mode="modal" fallbackRedirectUrl="/rider/rider-signup">
          <button className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition shadow-md active:scale-95 text-sm sm:text-base">
            Sign In / Register
          </button>
        </SignInButton>
      </div>
    );
  }

  // Handle existing profiles (Approved, Pending, Suspended, Rejected)
  if (existingProfile && !isReapplying) {
      const isRejected = existingProfile.status === 'REJECTED';
      const hasUsedRetry = isRejected && existingProfile.idImageUrl?.includes("RETRY");

      return (
          <div className="min-h-[100dvh] bg-[#f4f3ff] flex items-center justify-center p-4">
              <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-slate-100 py-10 px-6 sm:px-8 text-center">
                  {existingProfile.status === 'APPROVED' && (
                      <div className="animate-in zoom-in duration-300">
                          <h2 className="text-2xl sm:text-[22px] font-bold text-slate-900 mb-6">Application Status</h2>
                          <h3 className="text-lg font-bold text-indigo-600 tracking-widest uppercase mb-4">Approved</h3>
                          <p className="text-sm sm:text-base text-slate-500">Your rider account has been approved! Redirecting...</p>
                      </div>
                  )}
                  {existingProfile.status === 'PENDING_APPROVAL' && (
                      <div className="py-2">
                          <Clock className="w-12 h-12 sm:w-16 sm:h-16 text-blue-500 mx-auto mb-3 sm:mb-4" />
                          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-1.5 sm:mb-2">Application Under Review</h2>
                          <p className="text-xs sm:text-sm text-slate-500">Your application is currently being reviewed by our Admin team. We will notify you once a decision is made.</p>
                      </div>
                  )}
                  {existingProfile.status === 'SUSPENDED' && (
                      <div className="py-2">
                          <Ban className="w-12 h-12 sm:w-16 sm:h-16 text-orange-500 mx-auto mb-3 sm:mb-4" />
                          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-1.5 sm:mb-2">Account Suspended</h2>
                          <p className="text-xs sm:text-sm text-slate-500">Your rider account has been temporarily suspended. Please contact support for more details.</p>
                      </div>
                  )}
                  {isRejected && (
                      <div className="py-2">
                          <ShieldAlert className="w-12 h-12 sm:w-16 sm:h-16 text-red-500 mx-auto mb-3 sm:mb-4" />
                          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-1.5 sm:mb-2">
                             {hasUsedRetry ? "Application Permanently Rejected" : "Application Rejected"}
                          </h2>
                          <p className="text-xs sm:text-sm text-slate-500 mb-5 sm:mb-6 leading-relaxed px-2">
                             {hasUsedRetry 
                               ? "Unfortunately, your application has been rejected again. You have exhausted your allowed attempts and cannot re-apply." 
                               : "Unfortunately, your application to become a rider was not approved. You have one final chance to re-submit your documents."}
                          </p>
                          {!hasUsedRetry && (
                             <button 
                               onClick={() => setIsReapplying(true)}
                               className="w-full py-3.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition shadow-md active:scale-95 text-sm"
                             >
                               Re-Apply (1 Chance Remaining)
                             </button>
                          )}
                      </div>
                  )}
              </div>
          </div>
      );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Strict Length Validations
    if (formData.phoneNumber.length !== 11) {
        return toast.error("Phone number must be exactly 11 digits.");
    }
    if (formData.cnicNumber.length !== 13) {
        return toast.error("CNIC number must be exactly 13 digits.");
    }
    
    if (selectedFiles.length === 0) return toast.error("Please upload at least one image of your ID/License.");

    setIsSubmitting(true);
    const toastId = toast.loading("Submitting application...");

    try {
      const payload = new FormData();
      payload.append("phoneNumber", formData.phoneNumber); 
      payload.append("vehicleType", formData.vehicleType);
      payload.append("vehiclePlate", formData.vehiclePlate.toUpperCase());
      payload.append("cnicNumber", formData.cnicNumber);
      payload.append("licenseNumber", formData.licenseNumber);
      
      selectedFiles.forEach((file) => payload.append("idImages", file));

      const res = await fetch("/api/rider/register", { method: "POST", body: payload });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit application");

      toast.success("Application submitted successfully!", { id: toastId });
      
      setExistingProfile(data.rider); 
      setIsReapplying(false);
    } catch (error) {
      toast.error(error.message, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50 py-8 sm:py-12 px-3 sm:px-6">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        
        <div className="bg-green-600 p-6 sm:p-8 text-center text-white">
          <Car className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 opacity-90" />
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-1.5 sm:mb-2">Drive with DreamSaver</h1>
          <p className="opacity-90 text-sm sm:text-base px-2">Join our fleet, earn money, and help deliver dreams.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-10 space-y-5 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 sm:mb-2">Phone Number</label>
              <input 
                type="tel" 
                required 
                maxLength={11}
                placeholder="03001234567"
                value={formData.phoneNumber}
                onChange={(e) => {
                  // Only allow numeric input
                  const val = e.target.value.replace(/\D/g, '');
                  setFormData({...formData, phoneNumber: val});
                }}
                className="w-full border border-slate-200 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all outline-none text-sm sm:text-base"
              />
            </div>
            <div>
              <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 sm:mb-2">Vehicle Type</label>
              <select 
                value={formData.vehicleType}
                onChange={(e) => setFormData({...formData, vehicleType: e.target.value})}
                className="w-full border border-slate-200 bg-slate-50 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all outline-none text-sm sm:text-base cursor-pointer"
              >
                <option value="BIKE">Motorcycle / Bike</option>
                <option value="CAR">Car</option>
                <option value="VAN">Van / Truck</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 sm:mb-2">License Plate Number</label>
              <input 
                type="text" required placeholder="e.g. KHI-1234"
                value={formData.vehiclePlate}
                onChange={(e) => setFormData({...formData, vehiclePlate: e.target.value})}
                className="w-full border border-slate-200 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all outline-none uppercase text-sm sm:text-base"
              />
            </div>
            <div>
              <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 sm:mb-2">CNIC Number</label>
              <input 
                type="text" 
                required 
                maxLength={13}
                placeholder="13 digit CNIC without dashes"
                value={formData.cnicNumber}
                onChange={(e) => {
                  // Only allow numeric input
                  const val = e.target.value.replace(/\D/g, '');
                  setFormData({...formData, cnicNumber: val});
                }}
                className="w-full border border-slate-200 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all outline-none text-sm sm:text-base"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 sm:mb-2">Driver's License No.</label>
            <input 
              type="text" required
              value={formData.licenseNumber}
              onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
              className="w-full border border-slate-200 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all outline-none text-sm sm:text-base"
            />
          </div>

          <div>
            <label className="block text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 sm:mb-2">Upload CNIC / License Images</label>
            <div className={`border-2 border-dashed rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center transition-colors ${selectedFiles.length > 0 ? 'border-green-300 bg-green-50' : 'border-slate-200 hover:bg-slate-50'}`}>
              <input 
                type="file" id="idUpload" accept="image/*" multiple 
                onChange={(e) => setSelectedFiles(Array.from(e.target.files))} 
                className="hidden" 
              />
              <label htmlFor="idUpload" className="cursor-pointer flex flex-col items-center justify-center">
                {selectedFiles.length > 0 ? (
                  <>
                    <CreditCard className="text-green-500 mb-2 w-8 h-8 sm:w-10 sm:h-10 shrink-0" />
                    <span className="font-bold text-green-700 text-sm sm:text-base">{selectedFiles.length} photos selected</span>
                    <span className="text-[10px] sm:text-xs text-green-600 mt-1 uppercase tracking-wide">Click to change selection</span>
                  </>
                ) : (
                  <>
                    <Upload className="text-slate-400 mb-2 w-8 h-8 sm:w-10 sm:h-10 shrink-0" />
                    <span className="font-bold text-green-600 hover:text-green-700 text-sm sm:text-base">Click to Upload Photos</span>
                    <span className="text-[10px] sm:text-xs text-slate-400 mt-1">Select multiple: CNIC (Front/Back) & License</span>
                  </>
                )}
              </label>
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full py-3.5 sm:py-4 bg-slate-900 text-white font-bold text-sm sm:text-base rounded-xl hover:bg-black transition-all active:scale-[0.98] disabled:active:scale-100 flex justify-center items-center gap-2 disabled:opacity-50">
            {isSubmitting ? <Loader2 size={18} className="animate-spin shrink-0 sm:w-5 sm:h-5" /> : "Submit Application"}
          </button>
        </form>

      </div>
    </div>
  );
}