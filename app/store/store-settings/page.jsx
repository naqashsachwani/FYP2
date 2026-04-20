// Designates this as a Next.js Client Component, allowing the use of React hooks and interactive state.
'use client'

// --- Imports ---
import { useState, useEffect } from "react" // React hooks for state and lifecycle
import { useAuth } from "@clerk/nextjs" // Clerk hook to get authentication tokens
import axios from "axios" // HTTP client for API requests
import toast from "react-hot-toast" // Toast notifications for UI feedback
import { MapPin, Save, Crosshair, Store, Search, Loader2 } from "lucide-react" // UI Icons
import Loading from "@/components/Loading" // Custom loading spinner component
import dynamic from 'next/dynamic' // Next.js utility for lazy-loading components

// --- NEW: Reuse our interactive map for the Store Owner! ---
// Dynamically import the LocationPicker component. 
// ssr: false is crucial because map libraries (like Leaflet) require the browser's 'window' object, 
// which causes errors if Next.js attempts to render it on the server during the build.
const LocationPicker = dynamic(() => import('@/components/LocationPicker'), { 
    ssr: false,
    // Provide a skeleton UI placeholder while the heavy map library downloads
    loading: () => <div className="h-56 bg-slate-100 rounded-xl animate-pulse mb-2 flex items-center justify-center text-slate-400 border-2 border-slate-200 border-dashed">Loading Map...</div> 
})

export default function StoreSettings() {
    // Extract the getToken function from Clerk to securely authorize API calls
    const { getToken } = useAuth()
    
    // --- State Management ---
    const [loading, setLoading] = useState(true) // Controls the full-page initial load spinner
    const [saving, setSaving] = useState(false)  // Controls the spinner on the save button
    const [geocoding, setGeocoding] = useState(false) // Controls the spinner on the "Search Address" button
    
    // Main form state object holding the store's physical and geographical data
    const [formData, setFormData] = useState({
        address: "",
        city: "Karachi",
        zip: "",
        latitude: "",
        longitude: ""
    })

    // 1. Fetch Existing Settings
    // Retrieves the store's currently saved data from the database when the page loads
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const token = await getToken()
                const { data } = await axios.get('/api/store/settings', {
                    headers: { Authorization: `Bearer ${token}` }
                })
                // If the store already has data saved, populate the formData state
                if (data.store) {
                    setFormData({
                        address: data.store.address || "",
                        city: data.store.city || "Karachi",
                        zip: data.store.zip || "",
                        // Check against null because a coordinate of '0' is technically a valid location on Earth
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
        }
        fetchSettings()
    }, [getToken]) // Runs once when the component mounts and the getToken function is available

    // --- Map Integration Logic ---
    
    // Convert formData strings back into the object format {lat, lng} required by the LocationPicker component
    const mapPosition = formData.latitude && formData.longitude 
        ? { lat: parseFloat(formData.latitude), lng: parseFloat(formData.longitude) } 
        : null;

    // Callback fired by the LocationPicker when the user drags the pin or clicks the map.
    // It receives the new coordinates and updates the main form state.
    const handleMapClick = (pos) => {
        setFormData(prev => ({ ...prev, latitude: pos.lat, longitude: pos.lng }))
    }

    // --- Smart Geocoding Helper ---
    // Takes a text address and attempts to convert it into GPS coordinates using the free Nominatim API.
    const fetchCoordsFromAddress = async (currentData) => {
        const query = `${currentData.address}, ${currentData.city}, Pakistan`
        try {
            // Attempt 1: Search using the full exact address string
            let res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`)
            if (res.data && res.data.length > 0) {
                return { lat: parseFloat(res.data[0].lat), lon: parseFloat(res.data[0].lon) }
            }
            
            // Fallback strategy: If the full address fails, split it by commas and try searching the smaller parts.
            // Example: "Shop 12, Main Street" fails -> Try searching just "Main Street"
            const parts = currentData.address.split(",");
            for (let part of parts) {
                const cleanPart = part.trim();
                if (cleanPart.length < 3) continue; // Skip very short, meaningless strings
                
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
        return null // Return null if all attempts fail
    }

    // Manual "Search Address" Button Handler
    const handleManualGeocode = async () => {
        // Prevent API call if the user hasn't typed an address yet
        if (!formData.address) return toast.error("Please enter an address first")
        
        setGeocoding(true) // Start the button spinner
        const coords = await fetchCoordsFromAddress(formData)
        setGeocoding(false) // Stop the button spinner

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

    // --- Save Logic ---
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
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
            <div className="max-w-3xl mx-auto">
                
                {/* Header Section */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <Store className="text-blue-600"/> Store Settings
                    </h1>
                    <p className="text-gray-500 mt-2">Set your store's pickup location. This is where the delivery line will start on the map.</p>
                </div>

                {/* Main Settings Form Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <form onSubmit={handleSave} className="p-8 space-y-6">
                        
                        {/* --- NEW: Interactive Map Area --- */}
                        <div className="col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            
                            <div className="flex justify-between items-end mb-3">
                                <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                                    <MapPin size={16} className="text-blue-600"/> Pinpoint Store Location
                                </p>
                                
                                {/* Map Action Buttons */}
                                <div className="flex gap-2">
                                    {/* Trigger Geocoding (Address to Coordinates) */}
                                    <button 
                                        type="button" onClick={handleManualGeocode} disabled={geocoding}
                                        className="px-3 py-1.5 bg-white border border-indigo-200 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-50 flex items-center gap-1"
                                    >
                                        {geocoding ? <Loader2 size={12} className="animate-spin"/> : <Search size={12} />} 
                                        Search Address
                                    </button>
                                    
                                    {/* Trigger Native Browser GPS */}
                                    <button 
                                        type="button" onClick={handleUseGPS}
                                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 flex items-center gap-1"
                                    >
                                        <Crosshair size={12} /> Use GPS
                                    </button>
                                </div>
                            </div>
                            
                            {/* Mount the dynamically loaded map component, passing the current position state */}
                            <LocationPicker position={mapPosition} setPosition={handleMapClick} />
                        </div>

                        {/* Standard Text Inputs Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {/* Address Input (Spans full width) */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Full Address</label>
                                <input 
                                    type="text" 
                                    required
                                    value={formData.address}
                                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g. Shop #12, Zamzama Blvd, Phase 5"
                                />
                            </div>
                            
                            {/* City Input */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">City</label>
                                <input 
                                    type="text" 
                                    required
                                    value={formData.city}
                                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                                    className="w-full px-4 py-3 border rounded-xl outline-none"
                                />
                            </div>
                            
                            {/* Zip Code Input */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Zip Code</label>
                                <input 
                                    type="text" 
                                    value={formData.zip}
                                    onChange={(e) => setFormData({...formData, zip: e.target.value})}
                                    className="w-full px-4 py-3 border rounded-xl outline-none"
                                />
                            </div>
                        </div>

                        {/* Read-Only Coordinate Display Area */}
                        {/* Provides transparency to the store owner about exactly what coordinates are being saved */}
                        <div className="grid grid-cols-2 gap-4 opacity-70 bg-gray-50 p-3 rounded-lg pointer-events-none">
                            <div>
                                <span className="text-xs text-gray-500 mb-1 block font-mono">LATITUDE</span>
                                <input type="number" value={formData.latitude} readOnly className="w-full px-3 py-2 bg-transparent border-b border-gray-300 outline-none font-mono text-sm" />
                            </div>
                            <div>
                                <span className="text-xs text-gray-500 mb-1 block font-mono">LONGITUDE</span>
                                <input type="number" value={formData.longitude} readOnly className="w-full px-3 py-2 bg-transparent border-b border-gray-300 outline-none font-mono text-sm" />
                            </div>
                        </div>

                        {/* Final Submit Button */}
                        <button type="submit" disabled={saving} className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all">
                            {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />} 
                            {saving ? "Saving Settings..." : "Save Store Settings"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}