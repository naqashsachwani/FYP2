'use client'

import { useState, useEffect, useCallback } from "react" 
import { useAuth } from "@clerk/nextjs" 
import axios from "axios" 
import toast from "react-hot-toast" 
import { MapPin, Save, Crosshair, Store, Search, Loader2, RefreshCcw } from "lucide-react" 
import Loading from "@/components/Loading" 
import dynamic from 'next/dynamic' 

const LocationPicker = dynamic(() => import('@/components/LocationPicker'), { 
    ssr: false,
    loading: () => <div className="h-48 sm:h-56 bg-slate-100 rounded-xl animate-pulse mb-2 flex items-center justify-center text-slate-400 border-2 border-slate-200 border-dashed text-sm sm:text-base">Loading Map...</div> 
})

export default function StoreSettings() {
    const { getToken } = useAuth()
    const [loading, setLoading] = useState(true) 
    const [saving, setSaving] = useState(false) 
    const [geocoding, setGeocoding] = useState(false) 
    
    // Main form state object holding the store's physical and geographical data
    const [formData, setFormData] = useState({
        address: "",
        city: "Karachi",
        zip: "",
        latitude: "",
        longitude: ""
    })

    // 1. Fetch Existing Settings
    const fetchSettings = useCallback(async () => {
        setLoading(true)
        try {
            const token = await getToken()
            const { data } = await axios.get('/api/store/settings', {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (data.store) {
                setFormData({
                    address: data.store.address || "",
                    city: data.store.city || "Karachi",
                    zip: data.store.zip || "",
                    latitude: data.store.latitude !== null ? data.store.latitude : "",
                    longitude: data.store.longitude !== null ? data.store.longitude : ""
                })
            }
        } catch (error) {
            console.error(error)
            toast.error("Could not load settings")
        } finally {
            setLoading(false)
        }
    }, [getToken])

    useEffect(() => {
        fetchSettings()
    }, [fetchSettings]) 

    const handleRefresh = () => {
        fetchSettings()
    }
    
    // Convert formData strings back into the object format {lat, lng} required by the LocationPicker component
    const mapPosition = formData.latitude && formData.longitude 
        ? { lat: parseFloat(formData.latitude), lng: parseFloat(formData.longitude) } 
        : null;

    // Callback fired by the LocationPicker when the user drags the pin or clicks the map.
    const handleMapClick = (pos) => {
        setFormData(prev => ({ ...prev, latitude: pos.lat, longitude: pos.lng }))
    }

    // --- Smart Geocoding Helper ---
    // Takes a text address and attempts to convert it into GPS coordinates using the free Nominatim API.
    const fetchCoordsFromAddress = async (currentData) => {
        const query = `${currentData.address}, ${currentData.city}, Pakistan`
        try {
            // Search using the full exact address string
            let res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`)
            if (res.data && res.data.length > 0) {
                return { lat: parseFloat(res.data[0].lat), lon: parseFloat(res.data[0].lon) }
            }
            
            // Fallback strategy: If the full address fails, split it by commas and try searching the smaller parts.
            const parts = currentData.address.split(",");
            for (let part of parts) {
                const cleanPart = part.trim();
                if (cleanPart.length < 3) continue; 
                
                const retryQuery = `${cleanPart}, ${currentData.city}, Pakistan`;
                const retryRes = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(retryQuery)}&limit=1`);
                
                if (retryRes.data && retryRes.data.length > 0) {
                    toast("Found location using: " + cleanPart, { icon: '📍' });
                    return { lat: parseFloat(retryRes.data[0].lat), lon: parseFloat(retryRes.data[0].lon) }
                }
            }
        } catch (error) {
            console.warn("Geocoding failed", error)
        }
        return null 
    }

    // Manual "Search Address" Button Handler
    const handleManualGeocode = async () => {
        // Prevent API call if the user hasn't typed an address yet
        if (!formData.address) return toast.error("Please enter an address first")
        
        setGeocoding(true) 
        const coords = await fetchCoordsFromAddress(formData)
        setGeocoding(false) 

        if (coords) {
            // If coordinates were found, update the state, which automatically moves the map pin
            setFormData(prev => ({ ...prev, latitude: coords.lat, longitude: coords.lon }))
            toast.success("Coordinates found! You can adjust the pin on the map.")
        } else {
            toast.error("Could not find coordinates. Please click the map.")
        }
    }

    // "Use My GPS" Button Handler
    // Utilizes the browser's native Geolocation API to find the user's current physical location
    const handleUseGPS = () => {
        if (!navigator.geolocation) return toast.error("Geolocation not supported")
        
        toast.loading("Getting location...", { id: "gps" }) // Sticky loading toast
        
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                // Success callback: update state with browser coordinates
                setFormData(prev => ({
                    ...prev,
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude
                }))
                toast.success("GPS Location Found! Adjust pin if needed.", { id: "gps" })
            },
            () => toast.error("Location access denied.", { id: "gps" }), // Error callback (user denied permission)
            { enableHighAccuracy: true } // Request the most precise location data available from the device
        )
    }

    const handleSave = async (e) => {
        e.preventDefault()
        setSaving(true)

        let finalData = { ...formData }

        // Client-side validation: Ensure the store owner has set a physical map location
        // because delivery routing relies entirely on these coordinates.
        if (!finalData.latitude || finalData.latitude === "") {
            toast.error("Please set a map location before saving.")
            setSaving(false)
            return;
        }

        try {
            const token = await getToken()
            // Send the complete form data object to the backend to update the store settings
            await axios.post('/api/store/settings', finalData, {
                headers: { Authorization: `Bearer ${token}` }
            })
            toast.success("Store Settings Saved!")
        } catch (error) {
            toast.error("Failed to save")
        } finally {
            setSaving(false)
        }
    }

    // Render Guard: Show full-page spinner while initial database fetch is running
    if (loading) return <Loading />

    // --- Main Render ---
    return (
        <div className="min-h-[100dvh] bg-gray-50 p-3 sm:p-6">
            <div className="max-w-3xl mx-auto">
                
                {/* Header Section */}
                <div className="mb-6 sm:mb-8 flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                            <Store className="text-blue-600 shrink-0 w-6 h-6 sm:w-8 sm:h-8"/> Store Settings
                        </h1>
                        <p className="text-slate-500 mt-1.5 sm:mt-2 text-sm sm:text-base">
                            Set your store's pickup location. This is where the delivery line will start on the map.
                        </p>
                    </div>
                    <button 
                        onClick={handleRefresh}
                        disabled={loading}
                        className="p-2 sm:p-2.5 bg-white border border-slate-200 rounded-lg sm:rounded-xl hover:bg-slate-50 shadow-sm transition-colors text-slate-600 mt-1 shrink-0"
                        title="Reset settings form"
                    >
                        <RefreshCcw size={18} className="sm:w-5 sm:h-5" />
                    </button>
                </div>

                {/* Main Settings Form Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <form onSubmit={handleSave} className="p-4 sm:p-8 space-y-5 sm:space-y-6">
                        
                        {/* --- NEW: Interactive Map Area --- */}
                        <div className="w-full bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-100">
                            
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-3 gap-3">
                                <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                                    <MapPin size={16} className="text-blue-600 shrink-0"/> Pinpoint Store Location
                                </p>
                                
                                {/* Map Action Buttons */}
                                <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto">
                                    {/* Trigger Geocoding (Address to Coordinates) */}
                                    <button 
                                        type="button" onClick={handleManualGeocode} disabled={geocoding}
                                        className="flex-1 sm:flex-none px-3 py-2 sm:py-1.5 bg-white border border-indigo-200 text-indigo-600 rounded-lg text-xs sm:text-sm font-bold hover:bg-indigo-50 flex items-center justify-center gap-1.5 transition-colors"
                                    >
                                        {geocoding ? <Loader2 size={14} className="animate-spin shrink-0"/> : <Search size={14} className="shrink-0" />} 
                                        Search Address
                                    </button>
                                    
                                    {/* Trigger Native Browser GPS */}
                                    <button 
                                        type="button" onClick={handleUseGPS}
                                        className="flex-1 sm:flex-none px-3 py-2 sm:py-1.5 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-bold hover:bg-blue-700 flex items-center justify-center gap-1.5 transition-colors"
                                    >
                                        <Crosshair size={14} className="shrink-0" /> Use GPS
                                    </button>
                                </div>
                            </div>
                            
                            {/* Mount the dynamically loaded map component, passing the current position state */}
                            <LocationPicker position={mapPosition} setPosition={handleMapClick} />
                        </div>

                        {/* Standard Text Inputs Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                            
                            {/* Address Input (Spans full width) */}
                            <div className="sm:col-span-2">
                                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">Full Address</label>
                                <input 
                                    type="text" 
                                    required
                                    value={formData.address}
                                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm sm:text-base transition-shadow"
                                    placeholder="e.g. Shop #12, Zamzama Blvd, Phase 5"
                                />
                            </div>
                            
                            {/* City Input */}
                            <div>
                                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">City</label>
                                <input 
                                    type="text" 
                                    required
                                    value={formData.city}
                                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-slate-300 rounded-xl outline-none text-sm sm:text-base transition-shadow focus:border-blue-500"
                                />
                            </div>
                            
                            {/* Zip Code Input */}
                            <div>
                                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">Zip Code</label>
                                <input 
                                    type="text" 
                                    value={formData.zip}
                                    onChange={(e) => setFormData({...formData, zip: e.target.value})}
                                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-slate-300 rounded-xl outline-none text-sm sm:text-base transition-shadow focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {/* Read-Only Coordinate Display Area */}
                        {/* Provides transparency to the store owner about exactly what coordinates are being saved */}
                        <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3 sm:gap-4 opacity-70 bg-gray-50 p-3 sm:p-4 rounded-xl pointer-events-none border border-gray-100">
                            <div>
                                <span className="text-[10px] sm:text-xs text-gray-500 mb-1 block font-mono font-bold tracking-wider">LATITUDE</span>
                                <input type="number" value={formData.latitude} readOnly className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-transparent border-b border-gray-300 outline-none font-mono text-xs sm:text-sm" />
                            </div>
                            <div>
                                <span className="text-[10px] sm:text-xs text-gray-500 mb-1 block font-mono font-bold tracking-wider">LONGITUDE</span>
                                <input type="number" value={formData.longitude} readOnly className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-transparent border-b border-gray-300 outline-none font-mono text-xs sm:text-sm" />
                            </div>
                        </div>

                        {/* Final Submit Button */}
                        <button type="submit" disabled={saving} className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3.5 sm:py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-75 disabled:active:scale-100 mt-2 text-sm sm:text-base">
                            {saving ? <Loader2 className="animate-spin shrink-0" size={20} /> : <Save size={20} className="shrink-0" />} 
                            {saving ? "Saving Settings..." : "Save Store Settings"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}