'use client'

import { XIcon, Crosshair, MapPin, Loader2 } from "lucide-react"
import { useState } from "react"
import { toast } from "react-hot-toast"
import { useDispatch } from "react-redux"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import { addAddress } from "@/lib/features/address/addressSlice" 

const AddressModal = ({ setShowAddressModal }) => {

    const { getToken } = useAuth()
    const dispatch = useDispatch()
    
    // Loading state for the GPS button
    const [loadingLocation, setLoadingLocation] = useState(false)

    const [address, setAddress] = useState({
        name: '',
        email: '',
        street: '',
        city: '',
        state: '',
        zip: '',
        country: '',
        phone: '',
        latitude: null,
        longitude: null
    })

    const handleAddressChange = (e) => {
        setAddress({ ...address, [e.target.name]: e.target.value })
    }

    // ✅ FEATURE 1: Get Real GPS Location
    const handleUseGPS = () => {
        if (!navigator.geolocation) return toast.error("Geolocation not supported")
        
        setLoadingLocation(true)
        toast.loading("Getting your location...", { id: "geo" })
        
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords
                
                try {
                    // Optional: Reverse Geocode (Fill text from Coords)
                    const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
                    const data = res.data.address
                    
                    setAddress(prev => ({
                        ...prev,
                        latitude,
                        longitude,
                        street: data.road || data.suburb || prev.street,
                        city: data.city || data.town || prev.city,
                        state: data.state || prev.state,
                        zip: data.postcode || prev.zip,
                        country: data.country || prev.country
                    }))
                    toast.success("Location found!", { id: "geo" })
                } catch (e) {
                    // If lookup fails, still save coords
                    setAddress(prev => ({ ...prev, latitude, longitude }))
                    toast.success("Coordinates captured!", { id: "geo" })
                } finally {
                    setLoadingLocation(false)
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

            // ✅ FEATURE 2: Auto-Geocode if GPS wasn't used
            if (!finalAddress.latitude) {
                try {
                    const query = `${finalAddress.street}, ${finalAddress.city}, ${finalAddress.state}, ${finalAddress.country}`
                    const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
                    
                    if (res.data && res.data.length > 0) {
                        finalAddress.latitude = parseFloat(res.data[0].lat)
                        finalAddress.longitude = parseFloat(res.data[0].lon)
                    }
                } catch (error) {
                    console.warn("Could not auto-geocode address")
                }
            }

            // Send to Backend
            const { data } = await axios.post(
                '/api/address',
                { address: finalAddress }, // Nested structure matches your API
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            )

            // Update Redux
            dispatch(addAddress(data.newAddress))
            
            toast.success(data.message || 'Address added successfully!')
            setShowAddressModal(false)

        } catch (error) {
            console.error(error)
            // ✅ FIX: Check for 'error' key from API response, then 'message', then default
            const errorMsg = error?.response?.data?.error || error?.response?.data?.message || error.message
            toast.error(errorMsg)
        }
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4 sm:px-0">
            <form
                onSubmit={(e) => toast.promise(handleSubmit(e), { loading: 'Saving Address...' })}
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 sm:p-8 animate-fadeIn max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
                <button
                    type="button"
                    onClick={() => setShowAddressModal(false)}
                    className="absolute top-4 right-4 text-slate-500 hover:text-slate-700 transition"
                >
                    <XIcon size={28} />
                </button>

                <h2 className="text-2xl sm:text-3xl font-bold text-center text-blue-700 mb-6">
                    Add New <span className="text-slate-800">Address</span>
                </h2>

                {/* GPS Section */}
                <div className="mb-6">
                    <button 
                        type="button"
                        onClick={handleUseGPS}
                        disabled={loadingLocation}
                        className="w-full py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-xl flex items-center justify-center gap-2 border border-blue-200 transition-colors disabled:opacity-70"
                    >
                        {loadingLocation ? <Loader2 className="animate-spin" size={18}/> : <Crosshair size={18} />}
                        {loadingLocation ? "Locating..." : "Use Current Location (Recommended)"}
                    </button>
                    
                    <div className="relative text-center mt-4 mb-2">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <span className="relative bg-white px-2 text-xs text-gray-400 uppercase">Or fill manually</span>
                    </div>
                </div>

                {/* Inputs */}
                <div className="flex flex-col gap-4">
                    <input name="name" value={address.name} onChange={handleAddressChange} type="text" placeholder="Enter your full name" required className="p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" />
                    <input name="email" value={address.email} onChange={handleAddressChange} type="email" placeholder="Email address" required className="p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" />
                    <input name="street" value={address.street} onChange={handleAddressChange} type="text" placeholder="Street / Apartment / Building" required className="p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" />
                    
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

                {/* Coords Indicator */}
                <div className="mt-3 flex items-center gap-1.5 text-xs">
                    <MapPin size={14} className={address.latitude ? "text-green-600" : "text-gray-400"} />
                    {address.latitude ? (
                        <span className="text-green-600 font-medium">GPS Coordinates Captured</span>
                    ) : (
                        <span className="text-gray-400">Coordinates will be auto-detected on save</span>
                    )}
                </div>

                <button
                    type="submit"
                    className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 active:scale-95 shadow-md transition-all"
                >
                    SAVE ADDRESS
                </button>

                <p className="text-center text-xs sm:text-sm text-slate-400 mt-4">
                    Powered by <span className="font-semibold text-blue-700">DreamSaver</span>
                </p>
            </form>
        </div>
    )
}

export default AddressModal