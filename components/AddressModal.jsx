'use client'

import { XIcon, Crosshair, MapPin, Loader2 } from "lucide-react"
import { useState } from "react"
import { toast } from "react-hot-toast"
import { useDispatch } from "react-redux"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import { addAddress } from "@/lib/features/address/addressSlice" 
import dynamic from 'next/dynamic'

// Dynamically import the map to prevent Server-Side Rendering crashes
const LocationPicker = dynamic(() => import('@/components/LocationPicker'), { 
    ssr: false, 
    loading: () => <div className="h-56 bg-slate-100 rounded-xl animate-pulse mb-2 flex flex-col items-center justify-center text-slate-400 border-2 border-slate-200 border-dashed"><MapPin size={24} className="mb-2 opacity-50"/> Loading Map...</div> 
})

const AddressModal = ({ setShowAddressModal }) => {
    const { getToken } = useAuth()
    const dispatch = useDispatch()
    
    const [loadingLocation, setLoadingLocation] = useState(false)
    
    // NEW: State specifically for the Map Pin
    const [pinPosition, setPinPosition] = useState(null)

    const [address, setAddress] = useState({
        name: '', email: '', street: '', city: '', state: '', zip: '', country: '', phone: ''
    })

    const handleAddressChange = (e) => {
        setAddress({ ...address, [e.target.name]: e.target.value })
    }

    // Get Real GPS Location
    const handleUseGPS = () => {
        if (!navigator.geolocation) return toast.error("Geolocation not supported")
        
        setLoadingLocation(true)
        toast.loading("Getting your location...", { id: "geo" })
        
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords
                
                // Update the map pin instantly
                setPinPosition({ lat: latitude, lng: longitude })
                toast.success("Location found! You can drag the pin to refine it.", { id: "geo" })
                setLoadingLocation(false)

                try {
                    // Try to auto-fill the text inputs based on the GPS
                    const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
                    const data = res.data.address
                    
                    setAddress(prev => ({
                        ...prev,
                        street: data.road || data.suburb || prev.street,
                        city: data.city || data.town || prev.city,
                        state: data.state || prev.state,
                        zip: data.postcode || prev.zip,
                        country: data.country || prev.country
                    }))
                } catch (e) {
                    console.warn("Reverse geocoding failed, but coordinates saved.");
                }
            },
            () => {
                toast.error("Location permission denied", { id: "geo" })
                setLoadingLocation(false)
            }
        )
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            const token = await getToken()
            let finalAddress = { ...address }

            // 1. ALWAYS use the map pin position if the user clicked it
            if (pinPosition) {
                finalAddress.latitude = pinPosition.lat;
                finalAddress.longitude = pinPosition.lng;
            } 
            // 2. Fallback to text search ONLY if they ignored the map completely
            else {
                try {
                    const query = `${finalAddress.street}, ${finalAddress.city}, ${finalAddress.country}`
                    const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
                    
                    if (res.data && res.data.length > 0) {
                        finalAddress.latitude = parseFloat(res.data[0].lat)
                        finalAddress.longitude = parseFloat(res.data[0].lon)
                    } else {
                        // If everything fails, alert the user
                        toast.error("Could not find this address. Please click your location on the map.");
                        return; // Stop submission
                    }
                } catch (error) {
                    console.warn("Could not auto-geocode address")
                }
            }

            // Send to Backend
            const { data } = await axios.post(
                '/api/address',
                { address: finalAddress }, 
                { headers: { Authorization: `Bearer ${token}` } }
            )

            // Update Redux
            dispatch(addAddress(data.newAddress))
            toast.success(data.message || 'Address added successfully!')
            setShowAddressModal(false)

        } catch (error) {
            const errorMsg = error?.response?.data?.error || error?.response?.data?.message || error.message
            toast.error(errorMsg)
        }
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4 sm:px-0">
            <form
                onSubmit={(e) => toast.promise(handleSubmit(e), { loading: 'Saving Address...' })}
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 sm:p-8 animate-fadeIn max-h-[95vh] overflow-y-auto custom-scrollbar"
            >
                <button
                    type="button"
                    onClick={() => setShowAddressModal(false)}
                    className="absolute top-4 right-4 text-slate-500 hover:text-red-500 hover:rotate-90 transition-all z-10"
                >
                    <XIcon size={28} />
                </button>

                <h2 className="text-2xl sm:text-3xl font-bold text-center text-blue-700 mb-6">
                    Add New <span className="text-slate-800">Address</span>
                </h2>

                {/* --- NEW: Interactive Map Area --- */}
                <div className="mb-6 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                        <MapPin size={16} className="text-blue-600"/> Pinpoint your exact location
                    </p>
                    
                    <LocationPicker position={pinPosition} setPosition={setPinPosition} />

                    <button 
                        type="button"
                        onClick={handleUseGPS}
                        disabled={loadingLocation}
                        className="w-full mt-2 py-2.5 bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-70 text-sm"
                    >
                        {loadingLocation ? <Loader2 className="animate-spin" size={16}/> : <Crosshair size={16} />}
                        {loadingLocation ? "Locating..." : "Find my location automatically"}
                    </button>
                </div>

                {/* Text Inputs */}
                <div className="flex flex-col gap-4">
                    <input name="name" value={address.name} onChange={handleAddressChange} type="text" placeholder="Enter your full name" required className="p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" />
                    <input name="email" value={address.email} onChange={handleAddressChange} type="email" placeholder="Email address" required className="p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" />
                    <input name="street" value={address.street} onChange={handleAddressChange} type="text" placeholder="House / Apartment / Building No." required className="p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" />
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                        <input name="city" value={address.city} onChange={handleAddressChange} type="text" placeholder="City" required className="p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" />
                        <input name="state" value={address.state} onChange={handleAddressChange} type="text" placeholder="State / Province" required className="p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <input name="zip" value={address.zip} onChange={handleAddressChange} type="number" placeholder="Zip Code" required className="p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" />
                        <input name="country" value={address.country} onChange={handleAddressChange} type="text" placeholder="Country" required className="p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" />
                    </div>

                    <input name="phone" value={address.phone} onChange={handleAddressChange} type="text" placeholder="Phone Number" required className="p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" />
                </div>

                <button
                    type="submit"
                    className="mt-6 w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] shadow-lg transition-all"
                >
                    SAVE ADDRESS
                </button>
            </form>
        </div>
    )
}

export default AddressModal