"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, X, Gift, Loader2, Plus, ChevronLeft, Calendar, Crosshair, Trash2 } from "lucide-react";
import axios from "axios"; 
import toast from "react-hot-toast"; // ✅ Added for better UX
import dynamic from "next/dynamic"; // ✅ Added for dynamic map loading

// ✅ Dynamically import the map to prevent Server-Side Rendering crashes
const LocationPicker = dynamic(() => import('@/components/LocationPicker'), { 
    ssr: false, 
    loading: () => (
      <div className="h-48 sm:h-56 bg-slate-100 rounded-xl animate-pulse mb-2 flex flex-col items-center justify-center text-slate-400 border-2 border-slate-200 border-dashed">
        <MapPin size={24} className="mb-2 opacity-50"/> Loading Map...
      </div>
    ) 
});

export default function RedeemAction({ goal, addresses, setAddresses, onSuccess }) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(addresses?.[0]?.id || "");
  const [selectedDate, setSelectedDate] = useState(""); 
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null); 
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false); 
  
  // ✅ State for Map Pin
  const [pinPosition, setPinPosition] = useState(null);
  
  const [formData, setFormData] = useState({
    name: "", street: "", city: "", state: "", zip: "", country: "Pakistan", phone: "",
    latitude: null, longitude: null 
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const formatDateForDisplay = (isoDate) => {
    if (!isoDate) return "";
    const [year, month, day] = isoDate.split("-");
    return `${day}-${month}-${year}`;
  };

  // ✅ Auto-fill address details based on Map coordinates
  const fetchAddressFromCoordinates = async (lat, lng) => {
    try {
        const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`);
        const data = res.data.address;
        
        setFormData(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng,
            street: data?.road || data?.suburb || data?.neighbourhood || prev.street,
            city: data?.city || data?.town || data?.county || prev.city,
            state: data?.state || prev.state,
            zip: data?.postcode || prev.zip,
            country: data?.country || prev.country
        }));
    } catch (error) {
        console.warn("Auto-fill from map failed", error);
        setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
    }
  };

  // ✅ Handle manual map click
  const handleMapClick = (newPos) => {
      setPinPosition(newPos);
      fetchAddressFromCoordinates(newPos.lat, newPos.lng);
  };

  // ✅ 1. Get Current Location (GPS) & Auto-fill
  const handleUseGPS = () => {
    if (!navigator.geolocation) return toast.error("Geolocation not supported");
    setLoadingLocation(true);
    const toastId = toast.loading("Locating...");
    
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      
      setPinPosition({ lat: latitude, lng: longitude }); // Move Map Pin
      
      await fetchAddressFromCoordinates(latitude, longitude); // Auto-fill form
      
      toast.success("Location pinned and address auto-filled!", { id: toastId });
      setLoadingLocation(false);

    }, () => {
      toast.error("Location permission denied", { id: toastId });
      setLoadingLocation(false);
    });
  };
  
  // 2. Save Address
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setLoading(true);
    let finalData = { ...formData };

    if (!finalData.latitude) {
      try {
        const fullQuery = `${finalData.street}, ${finalData.city}, ${finalData.country}`;
        let res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullQuery)}&limit=1&addressdetails=1`);
        
        if (res.data && res.data.length > 0) {
          const result = res.data[0];
          finalData.latitude = parseFloat(result.lat);
          finalData.longitude = parseFloat(result.lon);
          
          if (!finalData.zip && result.address && result.address.postcode) {
             finalData.zip = result.address.postcode;
          }
        } else {
          // Attempt 2: Smart Retry
          const parts = finalData.street.split(",");
          let found = false;
          
          for (let part of parts) {
            if (found) break;
            const cleanPart = part.trim();
            if (cleanPart.length < 3) continue;

            try {
              const retryQuery = `${cleanPart}, ${finalData.city}, ${finalData.country}`;
              const retryRes = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(retryQuery)}&limit=1&addressdetails=1`);
              
              if (retryRes.data && retryRes.data.length > 0) {
                const result = retryRes.data[0];
                finalData.latitude = parseFloat(result.lat);
                finalData.longitude = parseFloat(result.lon);
                
                if (!finalData.zip && result.address && result.address.postcode) {
                    finalData.zip = result.address.postcode;
                }
                found = true;
              }
            } catch (err) { /* ignore */ }
          }

          if (!found) {
            res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(finalData.city + ", " + finalData.country)}&limit=1`);
            if (res.data && res.data.length > 0) {
              finalData.latitude = parseFloat(res.data[0].lat);
              finalData.longitude = parseFloat(res.data[0].lon);
            }
          }
        }
      } catch (error) {
        console.warn("Auto-geocode failed");
      }
    }

    if (!finalData.zip) finalData.zip = "75000";

    if (!finalData.latitude || !finalData.longitude) {
      toast.error("Could not locate address. Please check spelling or use the Map Picker.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: finalData })
      });
      const data = await res.json();
      
      if (data.success) {
        const newAddr = data.newAddress || data.address;
        const updatedList = [newAddr, ...(addresses || [])];
        setAddresses(updatedList);
        setSelectedAddress(newAddr.id);
        setIsAddingNew(false);
        setPinPosition(null); // Reset Pin
        setFormData({ name: "", street: "", city: "", state: "", zip: "", country: "Pakistan", phone: "", latitude: null, longitude: null });
        toast.success("Address Saved Successfully!");
      } else {
        toast.error(data.error || "Failed to save address");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to save address");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (e, id) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this address?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/address/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        const updatedList = addresses.filter(addr => addr.id !== id);
        setAddresses(updatedList);
        if (selectedAddress === id) setSelectedAddress(updatedList.length > 0 ? updatedList[0].id : "");
        toast.success("Address deleted");
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error deleting address");
    } finally {
      setDeletingId(null);
    }
  };

  const handleRedeem = async () => {
    if (!selectedAddress) return toast.error("Please select a shipping address");
    if (!selectedDate) return toast.error("Please select a preferred delivery date");

    setLoading(true);

    try {
      const res = await fetch(`/api/goals/${goal.id}/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addressId: selectedAddress, deliveryDate: selectedDate }),
      });

      const data = await res.json();
      
      if (data.success) {
        toast.success("Product successfully redeemed!");
        setIsModalOpen(false); 
        if (onSuccess) onSuccess(); 
        if (data.deliveryId) router.push(`/tracking/${data.deliveryId}`);
      } else {
        toast.error(data.error || "Redemption failed");
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      toast.error("Redemption failed due to a server error.");
      setLoading(false);
    }
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <>
      <button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto px-6 py-3 rounded-lg font-bold text-white shadow-md bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center gap-2 text-sm sm:text-base transition-colors">
        <Gift className="w-5 h-5 shrink-0" /> Redeem Product
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-[95%] sm:w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
             <div className="p-4 sm:p-5 border-b flex justify-between items-center bg-gray-50 shrink-0">
              {isAddingNew ? (
                 <button onClick={() => { setIsAddingNew(false); setPinPosition(null); }} className="flex items-center text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"><ChevronLeft size={16} /> Back</button>
              ) : (
                 <h3 className="font-bold text-base sm:text-lg text-gray-800">Confirm Redemption</h3>
              )}
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-gray-200 rounded-full transition-colors"><X size={20} className="text-gray-400 hover:text-red-500" /></button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto custom-scrollbar">
              {isAddingNew ? (
                <form id="address-form" onSubmit={handleSaveAddress} className="space-y-3 sm:space-y-4">
                  
                  {/* ✅ MAP AREA */}
                  <div className="mb-5 bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-100">
                      <p className="text-xs sm:text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                          <MapPin size={16} className="text-indigo-600 shrink-0"/> Pinpoint your exact location
                      </p>
                      
                      <LocationPicker position={pinPosition} setPosition={handleMapClick} />

                      <button type="button" onClick={handleUseGPS} disabled={loadingLocation} className="w-full mt-2 py-2.5 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center gap-2 text-sm font-bold hover:bg-indigo-200 transition-colors disabled:opacity-70">
                        {loadingLocation ? <Loader2 className="animate-spin w-4 h-4 shrink-0"/> : <Crosshair className="w-4 h-4 shrink-0" />} {loadingLocation ? "Locating..." : "Find my location automatically"}
                      </button>
                  </div>

                  <input required name="name" value={formData.name} onChange={handleInputChange} className="w-full p-2.5 sm:p-3 border border-gray-200 rounded-lg text-sm focus:border-indigo-500 outline-none transition-colors" placeholder="Full Name" />
                  <input required name="street" value={formData.street} onChange={handleInputChange} className="w-full p-2.5 sm:p-3 border border-gray-200 rounded-lg text-sm focus:border-indigo-500 outline-none transition-colors" placeholder="Street Address" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <input required name="city" value={formData.city} onChange={handleInputChange} className="w-full p-2.5 sm:p-3 border border-gray-200 rounded-lg text-sm focus:border-indigo-500 outline-none transition-colors" placeholder="City" />
                    <input required name="state" value={formData.state} onChange={handleInputChange} className="w-full p-2.5 sm:p-3 border border-gray-200 rounded-lg text-sm focus:border-indigo-500 outline-none transition-colors" placeholder="State" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <input required name="zip" value={formData.zip} onChange={handleInputChange} className="w-full p-2.5 sm:p-3 border border-gray-200 rounded-lg text-sm focus:border-indigo-500 outline-none transition-colors" placeholder="Zip Code" />
                    <input required name="phone" value={formData.phone} onChange={handleInputChange} className="w-full p-2.5 sm:p-3 border border-gray-200 rounded-lg text-sm focus:border-indigo-500 outline-none transition-colors" placeholder="Phone" />
                  </div>
                </form>
              ) : (
                <div className="space-y-5 sm:space-y-6">
                  <div>
                    <h4 className="font-bold text-gray-700 text-sm sm:text-base mb-2 flex items-center gap-2"><Calendar size={16} className="text-indigo-600 shrink-0"/> Preferred Delivery Date</h4>
                    
                    {/* The "Invisible Input" Trick */}
                    <div className="relative w-full">
                        <input 
                            type="text" 
                            readOnly 
                            placeholder="DD-MM-YYYY" 
                            value={formatDateForDisplay(selectedDate)} 
                            className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600 outline-none text-gray-700 font-medium text-sm sm:text-base transition-colors" 
                        />
                        <input 
                            type="date" 
                            min={minDate} 
                            value={selectedDate} 
                            onClick={(e) => {
                              try { e.target.showPicker(); } catch (err) {}
                            }}
                            onChange={(e) => setSelectedDate(e.target.value)} 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                        />
                        <div className="absolute right-3 top-3 sm:top-3.5 pointer-events-none text-gray-400">
                            <Calendar size={20} className="w-5 h-5" />
                        </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-bold text-gray-700 text-sm sm:text-base mb-2 flex items-center gap-2"><MapPin size={16} className="text-indigo-600 shrink-0"/> Shipping Address</h4>
                    <div className="space-y-2.5 sm:space-y-3 max-h-[250px] sm:max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                        {addresses?.length > 0 ? addresses.map((addr) => (
                        <div key={addr.id} onClick={() => setSelectedAddress(addr.id)} className={`group cursor-pointer border-2 rounded-lg p-3 flex gap-2.5 sm:gap-3 items-start transition-all ${selectedAddress === addr.id ? "border-indigo-600 bg-indigo-50" : "border-gray-200 hover:border-gray-300"}`}>
                            <div className={`mt-0.5 p-1 rounded-full shrink-0 ${selectedAddress === addr.id ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-500"}`}><MapPin size={14} className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></div>
                            <div className="flex-1">
                                <p className="font-bold text-gray-900 text-xs sm:text-sm">{addr.name}</p>
                                <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5 leading-relaxed">{addr.street}, {addr.city} - {addr.zip}</p>
                            </div>
                            <button onClick={(e) => handleDeleteAddress(e, addr.id)} disabled={deletingId === addr.id} className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity p-1.5 sm:p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full shrink-0">{deletingId === addr.id ? <Loader2 size={16} className="animate-spin text-red-600 w-4 h-4"/> : <Trash2 size={16} className="w-4 h-4" />}</button>
                        </div>
                        )) : <div className="text-center py-5 text-gray-400 text-sm border-2 border-dashed rounded-xl bg-gray-50">No addresses found</div>}
                    </div>
                    <button onClick={() => setIsAddingNew(true)} className="mt-3 w-full py-2.5 border-2 border-dashed border-indigo-300 text-indigo-600 rounded-lg text-sm font-bold hover:bg-indigo-50 flex items-center justify-center gap-2 transition-colors"><Plus size={16} className="shrink-0" /> Add New Address</button>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 sm:p-5 border-t bg-gray-50 flex gap-2 sm:gap-3 shrink-0">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 rounded-lg text-sm sm:text-base font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 transition-colors">Cancel</button>
              {isAddingNew ? (
                 <button 
                  type="submit" 
                  form="address-form" 
                  disabled={loading} 
                  className="flex-[2] py-2.5 rounded-lg text-sm sm:text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 flex justify-center items-center gap-2 disabled:opacity-75 transition-colors"
                 >
                   {loading ? <><Loader2 className="animate-spin w-4 h-4 shrink-0" /> Saving...</> : "Save Address"}
                 </button>
              ) : (
                 <button onClick={handleRedeem} disabled={loading || !addresses?.length || !selectedDate} className="flex-[2] py-2.5 rounded-lg text-sm sm:text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:bg-gray-400 flex justify-center items-center gap-2 transition-colors">{loading ? <Loader2 className="animate-spin w-4 h-4 shrink-0" /> : "Confirm Redemption"}</button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}