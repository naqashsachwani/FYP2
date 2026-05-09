'use client'

import { useEffect, useState } from "react"
import Image from "next/image"
import toast from "react-hot-toast"
import Loading from "@/components/Loading"
import { useAuth, useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import axios from "axios"
import { Upload, AlertCircle, RefreshCw } from "lucide-react"

export default function CreateStore() {
  // Authentication hooks from Clerk
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const { getToken } = useAuth()

  // ================= STATE MANAGEMENT =================
  
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)

  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(true)
  
  const [message, setMessage] = useState("")
  
  const [rejectionReason, setRejectionReason] = useState("")

  // Form Data State
  const [storeInfo, setStoreInfo] = useState({
    name: "",
    username: "",
    description: "",
    email: "",
    contact: "",
    address: "",
    image: null,      
    taxId: "",
    cnic: "",
    bankName: "",
    accountNumber: ""
  })

  // Generic handler for text input changes
  const onChangeHandler = (e) => {
    setStoreInfo({ ...storeInfo, [e.target.name]: e.target.value })
  }

  // ================= DATA FETCHING =================

  const fetchSellerStatus = async () => {
    const token = await getToken()
    try {
      const { data } = await axios.get("/api/store/check-status", {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      // If the backend returns that a store/application exists
      if (data.exists) {
        setStatus(data.store.status)
        setAlreadySubmitted(true) 
        
        // PRE-FILL FORM DATA: Populate the form state with existing data. T
        setStoreInfo(prev => ({
            ...prev,
            name: data.store.name,
            username: data.store.username,
            description: data.store.description,
            email: data.store.email,
            contact: data.store.contact,
            address: data.store.address,
        }))

        if (data.store.status === "approved") {
            setMessage("Your store has been approved! Redirecting...")
            setTimeout(() => router.push("/store"), 2000)
        } else if (data.store.status === "rejected") {
            setMessage("Your application was rejected.")
            if(data.store.storeApplication?.reviewNotes) {
                setRejectionReason(data.store.storeApplication.reviewNotes)
            }
        } else {
            setMessage("Your application is under review.")
        }
      }
    } catch (error) {
      console.error(error)
    }
    setLoading(false)
  }

  /**
   * Resubmit Handler
   * Triggered when a rejected user clicks "Fix & Resubmit".
   * It flips the view back to the Form so they can edit their pre-filled data.
   */
  const handleResubmit = () => {
    setAlreadySubmitted(false) 
    toast("You can now edit and resubmit your application.")
  }

  // ================= FORM SUBMISSION =================

  const onSubmitHandler = async (e) => {
    e.preventDefault()
    if (!user) return toast("Please login to continue")

    try {
      const token = await getToken()
      
      // Use FormData to handle file uploads (image) + text data
      const formData = new FormData()
      
      formData.append("name", storeInfo.name)
      formData.append("username", storeInfo.username)
      formData.append("description", storeInfo.description)
      formData.append("email", storeInfo.email)
      formData.append("contact", storeInfo.contact)
      formData.append("address", storeInfo.address)
      if(storeInfo.image) formData.append("image", storeInfo.image) 

      formData.append("taxId", storeInfo.taxId)
      formData.append("cnic", storeInfo.cnic)
      formData.append("bankName", storeInfo.bankName)
      formData.append("accountNumber", storeInfo.accountNumber)

      // POST request to create or update the store application
      const { data } = await axios.post("/api/store/create", formData, {
        headers: { Authorization: `Bearer ${token}` },
      })

      toast.success(data.message)
      setAlreadySubmitted(true) 
      setStatus("pending")      
      setMessage("Your application is under review.")
      setRejectionReason("")    // Clear old errors
    } catch (error) {
      toast.error(error?.response?.data?.error || error.message)
    }
  }

  // Effect to check status on component mount (once user is authenticated)
  useEffect(() => {
    if (isLoaded && user) {
        fetchSellerStatus()
    } else if (isLoaded && !user) {
        setLoading(false)
    }
  }, [isLoaded, user])

  // ================= RENDER LOGIC =================

  if (!isLoaded || loading) return <div className="min-h-[100dvh] flex flex-col justify-center items-center"><Loading /></div>

  if (!user) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center text-slate-600 bg-gradient-to-br from-indigo-50 to-purple-100 text-center px-4 sm:px-6">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold">
          Please <span className="text-indigo-600">Sign In</span> to continue
        </h1>
      </div>
    )
  }

  return (
    <>
      {/* CONDITIONAL RENDERING: 
          If !alreadySubmitted -> Show Form 
          If alreadySubmitted  -> Show Status Card 
      */}
      {!alreadySubmitted ? (
        // ================= VIEW 1: APPLICATION FORM =================
        <div className="relative min-h-[100dvh] bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl p-5 sm:p-8 md:p-12 border border-slate-200">
            
            <div className="text-center mb-8 sm:mb-10">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight leading-tight">
                {status === 'rejected' ? 'Resubmit Your' : 'Create Your'} <span className="text-indigo-600 block sm:inline mt-1 sm:mt-0">DreamSaver Store</span>
              </h1>
              <p className="text-slate-500 mt-2 sm:mt-3 text-sm sm:text-base">
                {status === 'rejected' ? 'Update your details and try again.' : 'Submit your business details for verification.'}
              </p>
            </div>

            {/* Image Upload Area */}
            <div className="flex flex-col items-center gap-3 mb-8">
              <label className="cursor-pointer flex flex-col items-center">
                <div className="border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-2xl p-4 bg-white w-32 h-32 sm:w-40 sm:h-40 flex flex-col items-center justify-center overflow-hidden relative transition-colors">
                  {storeInfo.image ? (
                    <Image
                      src={URL.createObjectURL(storeInfo.image)}
                      className="object-contain"
                      alt="Store logo"
                      fill
                    />
                  ) : (
                    <div className="flex flex-col items-center text-slate-400">
                        <Upload className="w-8 h-8 sm:w-10 sm:h-10" />
                        <span className="text-[10px] sm:text-xs mt-2 font-bold uppercase tracking-wider">Select Image</span>
                    </div>
                  )}
                </div>
                <p className="mt-2 text-xs sm:text-sm text-slate-500 font-medium">Upload Logo</p>
                <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                            setStoreInfo({ ...storeInfo, image: e.target.files[0] })
                        }
                    }} 
                    hidden 
                />
              </label>
            </div>

            <form onSubmit={(e) => toast.promise(onSubmitHandler(e), { loading: "Submitting..." })} className="space-y-6 sm:space-y-8">
              
              {/* Section 1: Basic Store Details */}
              <div className="bg-slate-50 p-5 sm:p-6 rounded-2xl border border-slate-100">
                <h3 className="text-base sm:text-lg font-bold text-slate-700 mb-4 uppercase tracking-wider">Store Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-slate-700 text-xs sm:text-sm font-bold mb-1.5">Store Name</label>
                    <input name="name" onChange={onChangeHandler} value={storeInfo.name} type="text" placeholder="e.g. Tech World" className="w-full border border-slate-300 rounded-xl p-2.5 sm:p-3 text-sm sm:text-base focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" required />
                  </div>
                  <div>
                    <label className="block text-slate-700 text-xs sm:text-sm font-bold mb-1.5">Username</label>
                    <input name="username" onChange={onChangeHandler} value={storeInfo.username} type="text" placeholder="e.g. tech_world" className="w-full border border-slate-300 rounded-xl p-2.5 sm:p-3 text-sm sm:text-base focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" required />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 text-xs sm:text-sm font-bold mb-1.5">Description</label>
                    <textarea name="description" onChange={onChangeHandler} value={storeInfo.description} rows={3} placeholder="Tell us about your business..." className="w-full border border-slate-300 rounded-xl p-2.5 sm:p-3 text-sm sm:text-base focus:ring-2 focus:ring-indigo-500 outline-none resize-y min-h-[80px] transition-shadow custom-scrollbar" required />
                  </div>
                </div>
              </div>

              {/* Section 2: Contact Info */}
              <div className="bg-slate-50 p-5 sm:p-6 rounded-2xl border border-slate-100">
                <h3 className="text-base sm:text-lg font-bold text-slate-700 mb-4 uppercase tracking-wider">Contact Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-slate-700 text-xs sm:text-sm font-bold mb-1.5">Email</label>
                    <input name="email" onChange={onChangeHandler} value={storeInfo.email} type="email" className="w-full border border-slate-300 rounded-xl p-2.5 sm:p-3 text-sm sm:text-base focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" required />
                  </div>
                  <div>
                    <label className="block text-slate-700 text-xs sm:text-sm font-bold mb-1.5">Phone</label>
                    <input name="contact" onChange={onChangeHandler} value={storeInfo.contact} type="text" className="w-full border border-slate-300 rounded-xl p-2.5 sm:p-3 text-sm sm:text-base focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" required />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 text-xs sm:text-sm font-bold mb-1.5">Address</label>
                    <input name="address" onChange={onChangeHandler} value={storeInfo.address} type="text" className="w-full border border-slate-300 rounded-xl p-2.5 sm:p-3 text-sm sm:text-base focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" required />
                  </div>
                </div>
              </div>

              {/* Section 3: Legal & Banking */}
              <div className="bg-slate-50 p-5 sm:p-6 rounded-2xl border border-slate-100">
                <h3 className="text-base sm:text-lg font-bold text-slate-700 mb-4 uppercase tracking-wider">Legal & Banking</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-slate-700 text-xs sm:text-sm font-bold mb-1.5">CNIC / Gov ID</label>
                    <input name="cnic" onChange={onChangeHandler} value={storeInfo.cnic} type="text" placeholder="XXXXX-XXXXXXX-X" className="w-full border border-slate-300 rounded-xl p-2.5 sm:p-3 text-sm sm:text-base focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" required />
                  </div>
                  <div>
                    <label className="block text-slate-700 text-xs sm:text-sm font-bold mb-1.5">Tax ID (NTN) <span className="text-[10px] sm:text-xs text-slate-400 font-normal ml-1">(Optional)</span></label>
                    <input name="taxId" onChange={onChangeHandler} value={storeInfo.taxId} type="text" className="w-full border border-slate-300 rounded-xl p-2.5 sm:p-3 text-sm sm:text-base focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" />
                  </div>
                  <div>
                    <label className="block text-slate-700 text-xs sm:text-sm font-bold mb-1.5">Bank Name</label>
                    <input name="bankName" onChange={onChangeHandler} value={storeInfo.bankName} type="text" className="w-full border border-slate-300 rounded-xl p-2.5 sm:p-3 text-sm sm:text-base focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" required />
                  </div>
                  <div>
                    <label className="block text-slate-700 text-xs sm:text-sm font-bold mb-1.5">Account Number (IBAN)</label>
                    <input name="accountNumber" onChange={onChangeHandler} value={storeInfo.accountNumber} type="text" className="w-full border border-slate-300 rounded-xl p-2.5 sm:p-3 text-sm sm:text-base focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" required />
                  </div>
                </div>
              </div>

              <div className="flex justify-center mt-6 sm:mt-8 pt-4 border-t border-slate-100">
                <button className="bg-indigo-600 text-white px-8 sm:px-12 py-3.5 sm:py-4 rounded-xl sm:rounded-full text-sm sm:text-lg font-bold shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 w-full sm:w-auto">
                  {status === 'rejected' ? 'Update & Resubmit' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        // Displays when user has already submitted an application
        <div className="min-h-[100dvh] flex flex-col items-center justify-center text-center px-4 sm:px-6 bg-gradient-to-br from-indigo-50 to-purple-100 py-12">
          <div className="bg-white p-6 sm:p-8 md:p-10 rounded-3xl shadow-xl w-[95%] sm:w-full max-w-lg border border-slate-100">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-3 sm:mb-4">Application Status</h2>
            
            {/* Dynamic Styling based on Status (Red for Rejected, Indigo for others) */}
            <div className={`text-base sm:text-lg font-bold uppercase tracking-widest mb-1.5 sm:mb-2 ${
                status === 'rejected' ? 'text-red-600' : 'text-indigo-600'
            }`}>
                {status}
            </div>
            <p className="text-slate-500 text-sm sm:text-base mb-6 sm:mb-8">{message}</p>

            {/* REJECTION LOGIC:
                If status is rejected, we show the admin's notes and a button to re-open the form. 
            */}
            {status === 'rejected' && (
                <div className="space-y-5 sm:space-y-6 border-t border-slate-100 pt-5 sm:pt-6 mt-4">
                    {rejectionReason && (
                        <div className="bg-red-50 border border-red-100 p-4 rounded-xl sm:rounded-2xl text-left shadow-sm">
                            <p className="text-xs sm:text-sm font-bold text-red-800 flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 uppercase tracking-wider">
                                <AlertCircle size={16} className="w-4 h-4 sm:w-5 sm:h-5 shrink-0"/> Admin Note
                            </p>
                            <p className="text-xs sm:text-sm text-red-700 leading-relaxed font-medium">{rejectionReason}</p>
                        </div>
                    )}
                    
                    <button 
                        onClick={handleResubmit}
                        className="flex items-center justify-center gap-2 w-full bg-slate-900 text-white px-5 sm:px-6 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl hover:bg-slate-800 transition-all font-bold text-sm sm:text-base active:scale-95 shadow-md"
                    >
                        <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" /> Fix & Resubmit Application
                    </button>
                </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}