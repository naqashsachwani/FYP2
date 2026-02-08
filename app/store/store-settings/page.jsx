'use client'
import { useState, useEffect } from "react"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import toast from "react-hot-toast"
import { MapPin, Save, Crosshair, Store, Search } from "lucide-react" // Added Search icon
import Loading from "@/components/Loading"

export default function StoreSettings() {
    const { getToken } = useAuth()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [geocoding, setGeocoding] = useState(false) // New state for geocoding loader
    
    const [formData, setFormData] = useState({
        address: "",
        city: "Karachi",
        zip: "",
        latitude: "",
        longitude: ""
    })

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
            } finally {
                setLoading(false)
            }
        }
        fetchSettings()
    }, [])

    // ✅ NEW: Helper to fetch coords from text address
    const fetchCoordsFromAddress = async (currentData) => {
        const query = `${currentData.address}, ${currentData.city}, ${currentData.zip}, Pakistan`
        try {
            const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
            if (res.data && res.data.length > 0) {
                return {
                    lat: parseFloat(res.data[0].lat),
                    lon: parseFloat(res.data[0].lon)
                }
            }
        } catch (error) {
            console.warn("Geocoding failed", error)
        }
        return null
    }

    // ✅ NEW: Manual Button Handler
    const handleManualGeocode = async () => {
        if (!formData.address) return toast.error("Please enter an address first")
        
        setGeocoding(true)
        const coords = await fetchCoordsFromAddress(formData)
        setGeocoding(false)

        if (coords) {
            setFormData(prev => ({ ...prev, latitude: coords.lat, longitude: coords.lon }))
            toast.success("Coordinates found from address!")
        } else {
            toast.error("Could not find coordinates for this address")
        }
    }

    const handleSave = async (e) => {
        e.preventDefault()
        setSaving(true)

        let finalData = { ...formData }

        // ✅ AUTO-GEOCODE ON SAVE: If coords are missing, try to find them
        if (!finalData.latitude || finalData.latitude === "") {
            toast.loading("Auto-detecting location...", { id: "geo-save" })
            const coords = await fetchCoordsFromAddress(finalData)
            if (coords) {
                finalData.latitude = coords.lat
                finalData.longitude = coords.lon
                setFormData(prev => ({ ...prev, latitude: coords.lat, longitude: coords.lon })) // Update UI too
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
            toast.success("Store location saved!")
        } catch (error) {
            toast.error("Failed to save")
        } finally {
            setSaving(false)
        }
    }

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
                toast.success("Coordinates found!", { id: "gps" })
            },
            () => toast.error("Location access denied", { id: "gps" })
        )
    }

    if (loading) return <Loading />

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Store Settings</h1>
                    <p className="text-gray-500">Set your pickup location for the delivery map.</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <form onSubmit={handleSave} className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Address</label>
                                <input 
                                    type="text" 
                                    required
                                    value={formData.address}
                                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g. Shop #12, Zamzama Blvd"
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
                                <label className="block text-sm font-bold text-gray-700 mb-2">Zip</label>
                                <input 
                                    type="text" 
                                    value={formData.zip}
                                    onChange={(e) => setFormData({...formData, zip: e.target.value})}
                                    className="w-full px-4 py-3 border rounded-xl outline-none"
                                />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-100">
                            <div className="flex flex-wrap justify-between items-end mb-4 gap-2">
                                <label className="block text-sm font-bold text-gray-700">GPS Coordinates</label>
                                <div className="flex gap-3">
                                    {/* ✅ NEW: Button to fetch from address */}
                                    <button 
                                        type="button"
                                        onClick={handleManualGeocode}
                                        disabled={geocoding}
                                        className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 disabled:opacity-50"
                                    >
                                        <Search size={16} /> {geocoding ? "Searching..." : "Get from Address"}
                                    </button>
                                    
                                    <button 
                                        type="button"
                                        onClick={handleUseGPS}
                                        className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                    >
                                        <Crosshair size={16} /> Use My GPS
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-xs text-gray-500 mb-1 block">Latitude</span>
                                    <input 
                                        type="number" 
                                        step="any"
                                        value={formData.latitude}
                                        onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl outline-none focus:border-blue-500"
                                        placeholder="24.8607"
                                    />
                                </div>
                                <div>
                                    <span className="text-xs text-gray-500 mb-1 block">Longitude</span>
                                    <input 
                                        type="number" 
                                        step="any"
                                        value={formData.longitude}
                                        onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl outline-none focus:border-blue-500"
                                        placeholder="67.0011"
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-gray-400 mt-2">
                                * Enter manually, use the GPS button, or click "Get from Address" to auto-fill.
                            </p>
                        </div>

                        <button type="submit" disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2">
                            {saving ? "Saving..." : <><Save size={20} /> Save Settings</>}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}