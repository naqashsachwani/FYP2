'use client'
import { useState, useEffect } from "react"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import toast from "react-hot-toast"
import { MapPin, Save, Crosshair, Store, Search, Loader2 } from "lucide-react" 
import Loading from "@/components/Loading"

export default function StoreSettings() {
    const { getToken } = useAuth()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [geocoding, setGeocoding] = useState(false) 
    
    const [formData, setFormData] = useState({
        address: "",
        city: "Karachi",
        zip: "",
        latitude: "",
        longitude: ""
    })

    // 1. Fetch Existing Settings
    useEffect(() => {
        const fetchSettings = async () => {
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
        }
        fetchSettings()
    }, [getToken])

    // ✅ FIXED: Smart Geocoding Helper
    const fetchCoordsFromAddress = async (currentData) => {
        // Attempt 1: Full Address Search
        // We encodeURIComponent to handle spaces and special chars safely
        const query = `${currentData.address}, ${currentData.city}, Pakistan`
        console.log("Geocoding Attempt 1:", query);
        
        try {
            let res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`)
            if (res.data && res.data.length > 0) {
                return { lat: parseFloat(res.data[0].lat), lon: parseFloat(res.data[0].lon) }
            }

            // Attempt 2: Smart Retry (Split by commas)
            // Example: "Shop 12, Zamzama Blvd, Phase 5" -> fails
            // Retry: "Zamzama Blvd, Karachi" -> Success
            const parts = currentData.address.split(",");
            for (let part of parts) {
                const cleanPart = part.trim();
                if (cleanPart.length < 3) continue; // Skip short words like "No" or "St"

                const retryQuery = `${cleanPart}, ${currentData.city}, Pakistan`;
                console.log("Geocoding Attempt 2 (Part):", retryQuery);
                
                const retryRes = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(retryQuery)}&limit=1`);
                
                if (retryRes.data && retryRes.data.length > 0) {
                    toast("Found location using: " + cleanPart, { icon: '📍' });
                    return { lat: parseFloat(retryRes.data[0].lat), lon: parseFloat(retryRes.data[0].lon) }
                }
            }
            
            // Attempt 3: City Fallback (Last Resort)
            // Ensures we never return null if the city is known
            console.log("Geocoding Attempt 3 (City Fallback)");
            const cityRes = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(currentData.city + ", Pakistan")}&limit=1`)
            if (cityRes.data && cityRes.data.length > 0) {
                 toast("Address specific not found, defaulting to City Center.", { icon: '⚠️' });
                 return { lat: parseFloat(cityRes.data[0].lat), lon: parseFloat(cityRes.data[0].lon) }
            }

        } catch (error) {
            console.warn("Geocoding failed", error)
        }
        return null
    }

    // 3. Manual "Get from Address" Button
    const handleManualGeocode = async () => {
        if (!formData.address) return toast.error("Please enter an address first")
        
        setGeocoding(true)
        const coords = await fetchCoordsFromAddress(formData)
        setGeocoding(false)

        if (coords) {
            setFormData(prev => ({ ...prev, latitude: coords.lat, longitude: coords.lon }))
            toast.success("Coordinates found!")
        } else {
            toast.error("Could not find coordinates. Please try GPS or enter manually.")
        }
    }

    // 4. "Use My GPS" Button
    const handleUseGPS = () => {
        if (!navigator.geolocation) return toast.error("Geolocation not supported")
        toast.loading("Getting location...", { id: "gps" })
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setFormData(prev => ({
                    ...prev,
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude
                }))
                toast.success("GPS Location Found!", { id: "gps" })
            },
            () => toast.error("Location access denied. Please allow location access in your browser.", { id: "gps" }),
            { enableHighAccuracy: true }
        )
    }

    // 5. Save Logic
    const handleSave = async (e) => {
        e.preventDefault()
        setSaving(true)

        let finalData = { ...formData }

        // Auto-detect if coordinates are missing on save
        if (!finalData.latitude || finalData.latitude === "") {
            toast.loading("Auto-detecting location...", { id: "geo-save" })
            const coords = await fetchCoordsFromAddress(finalData)
            if (coords) {
                finalData.latitude = coords.lat
                finalData.longitude = coords.lon
                setFormData(prev => ({ ...prev, latitude: coords.lat, longitude: coords.lon }))
                toast.success("Location auto-detected!", { id: "geo-save" })
            } else {
                toast.dismiss("geo-save")
            }
        }

        try {
            const token = await getToken()
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

    if (loading) return <Loading />

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <Store className="text-blue-600"/> Store Settings
                    </h1>
                    <p className="text-gray-500 mt-2">Set your store's pickup location. This is where the delivery line will start on the map.</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <form onSubmit={handleSave} className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                        {/* COORDINATES SECTION */}
                        <div className="pt-6 border-t border-gray-100 bg-blue-50/50 p-4 rounded-xl">
                            <div className="flex flex-wrap justify-between items-end mb-4 gap-2">
                                <div>
                                    <label className="block text-sm font-bold text-gray-800">Map Coordinates 

[Image of Latitude Longitude]
</label>
                                    <p className="text-xs text-gray-500">Required for the delivery tracking map.</p>
                                </div>
                                <div className="flex gap-3">
                                    <button 
                                        type="button"
                                        onClick={handleManualGeocode}
                                        disabled={geocoding}
                                        className="px-3 py-1.5 bg-white border border-indigo-200 text-indigo-600 rounded-lg text-sm font-bold hover:bg-indigo-50 flex items-center gap-1 shadow-sm transition-all"
                                    >
                                        {geocoding ? <Loader2 size={14} className="animate-spin"/> : <Search size={14} />} 
                                        {geocoding ? "Searching..." : "Find from Address"}
                                    </button>
                                    
                                    <button 
                                        type="button"
                                        onClick={handleUseGPS}
                                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center gap-1 shadow-sm transition-all"
                                    >
                                        <Crosshair size={14} /> Use My GPS
                                    </button>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-xs text-gray-500 mb-1 block font-mono">LATITUDE</span>
                                    <input 
                                        type="number" 
                                        step="any"
                                        value={formData.latitude}
                                        onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg outline-none focus:border-blue-500 font-mono text-sm"
                                        placeholder="24.8607"
                                    />
                                </div>
                                <div>
                                    <span className="text-xs text-gray-500 mb-1 block font-mono">LONGITUDE</span>
                                    <input 
                                        type="number" 
                                        step="any"
                                        value={formData.longitude}
                                        onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg outline-none focus:border-blue-500 font-mono text-sm"
                                        placeholder="67.0011"
                                    />
                                </div>
                            </div>
                        </div>

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