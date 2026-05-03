"use client";

import { useState, useEffect } from "react";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Loader2, Car, CreditCard, ShieldCheck, Upload, Clock, CheckCircle, ShieldAlert, Ban } from "lucide-react";

export default function RiderSignupPage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();

  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [existingProfile, setExistingProfile] = useState(null);

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
                if (data.profile.status === "APPROVED") {
                    setTimeout(() => router.push("/rider/dashboard"), 2000);
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

  if (!isLoaded || isCheckingStatus) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-green-600 w-10 h-10" /></div>;

  // ✅ UPDATED: The locked-out state now perfectly asks them to login to continue
  if (isLoaded && !userId) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-slate-50 p-4">
        <ShieldCheck className="w-16 h-16 text-green-500 mb-4" />
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-6 text-center">Please login to continue.</h2>
        <SignInButton mode="modal" fallbackRedirectUrl="/rider/rider-signup">
          <button className="px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition shadow-md">
            Sign In / Register
          </button>
        </SignInButton>
      </div>
    );
  }

  if (existingProfile) {
      return (
          <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
              <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-slate-100 p-8 text-center">
                  {existingProfile.status === 'APPROVED' && (
                      <div className="animate-in zoom-in duration-300">
                          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                          <h2 className="text-2xl font-bold text-slate-800 mb-2">You are Approved!</h2>
                          <p className="text-slate-500 mb-6">Redirecting you to the Rider Dashboard...</p>
                          <Loader2 className="w-6 h-6 text-green-500 animate-spin mx-auto" />
                      </div>
                  )}
                  {existingProfile.status === 'PENDING_APPROVAL' && (
                      <div>
                          <Clock className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                          <h2 className="text-2xl font-bold text-slate-800 mb-2">Application Under Review</h2>
                          <p className="text-slate-500">Your application is currently being reviewed by our Admin team. We will notify you once a decision is made.</p>
                      </div>
                  )}
                  {existingProfile.status === 'SUSPENDED' && (
                      <div>
                          <Ban className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                          <h2 className="text-2xl font-bold text-slate-800 mb-2">Account Suspended</h2>
                          <p className="text-slate-500">Your rider account has been temporarily suspended. Please contact support for more details.</p>
                      </div>
                  )}
                  {existingProfile.status === 'REJECTED' && (
                      <div>
                          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
                          <h2 className="text-2xl font-bold text-slate-800 mb-2">Application Rejected</h2>
                          <p className="text-slate-500">Unfortunately, your application to become a rider was not approved at this time.</p>
                      </div>
                  )}
              </div>
          </div>
      );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    } catch (error) {
      toast.error(error.message, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-green-600 p-8 text-center text-white">
          <Car className="w-12 h-12 mx-auto mb-3 opacity-90" />
          <h1 className="text-3xl font-extrabold mb-2">Drive with DreamSaver</h1>
          <p className="opacity-90">Join our fleet, earn money, and help deliver dreams.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Phone Number</label>
              <input 
                type="tel" required placeholder="03001234567"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                className="w-full border border-slate-200 px-4 py-3 rounded-xl focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Vehicle Type</label>
              <select 
                value={formData.vehicleType}
                onChange={(e) => setFormData({...formData, vehicleType: e.target.value})}
                className="w-full border border-slate-200 bg-slate-50 px-4 py-3 rounded-xl focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all outline-none"
              >
                <option value="BIKE">Motorcycle / Bike</option>
                <option value="CAR">Car</option>
                <option value="VAN">Van / Truck</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">License Plate Number</label>
              <input 
                type="text" required placeholder="e.g. KHI-1234"
                value={formData.vehiclePlate}
                onChange={(e) => setFormData({...formData, vehiclePlate: e.target.value})}
                className="w-full border border-slate-200 px-4 py-3 rounded-xl focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all outline-none uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">CNIC Number</label>
              <input 
                type="text" required placeholder="13 digits"
                value={formData.cnicNumber}
                onChange={(e) => setFormData({...formData, cnicNumber: e.target.value})}
                className="w-full border border-slate-200 px-4 py-3 rounded-xl focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Driver's License No.</label>
            <input 
              type="text" required
              value={formData.licenseNumber}
              onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
              className="w-full border border-slate-200 px-4 py-3 rounded-xl focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Upload CNIC / License Images</label>
            <div className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors ${selectedFiles.length > 0 ? 'border-green-300 bg-green-50' : 'border-slate-200 hover:bg-slate-50'}`}>
              <input 
                type="file" id="idUpload" accept="image/*" multiple 
                onChange={(e) => setSelectedFiles(Array.from(e.target.files))} 
                className="hidden" 
              />
              <label htmlFor="idUpload" className="cursor-pointer flex flex-col items-center justify-center">
                {selectedFiles.length > 0 ? (
                  <>
                    <CreditCard className="text-green-500 mb-2" size={32} />
                    <span className="font-bold text-green-700">{selectedFiles.length} photos selected</span>
                    <span className="text-xs text-green-600 mt-1 uppercase tracking-wide">Click to change selection</span>
                  </>
                ) : (
                  <>
                    <Upload className="text-slate-400 mb-2" size={32} />
                    <span className="font-bold text-green-600 hover:text-green-700">Click to Upload Photos</span>
                    <span className="text-xs text-slate-400 mt-1">Select multiple: CNIC (Front/Back) & License</span>
                  </>
                )}
              </label>
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition-all flex justify-center items-center gap-2 disabled:opacity-50">
            {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : "Submit Application"}
          </button>
        </form>
      </div>
    </div>
  );
}