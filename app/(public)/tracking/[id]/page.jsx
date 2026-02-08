'use client';

import { useEffect, useState, use } from 'react';
import dynamic from 'next/dynamic'; 
import { Loader2, Truck, Calendar, Store, MapPin, ArrowLeft, CheckCircle, PlayCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

const DeliveryMap = dynamic(() => import('@/components/DeliveryMap'), { 
  ssr: false,
  loading: () => <div className="h-full flex items-center justify-center bg-gray-100 text-gray-400">Loading Map...</div>
});

export default function TrackingPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Fetch Data
  const fetchData = async () => {
    try {
      const res = await fetch(`/api/delivery/${id}`);
      const data = await res.json();
      // Only update state if data is valid and different to prevent unnecessary re-renders
      if (!data.error) setDelivery(data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!id) return;
    
    // 1. Initial Load
    fetchData(); 
    
    // 2. ✅ AUTO-UPDATE: Poll every 4 seconds
    // This ensures that when the Store Admin changes status/location, 
    // the customer sees it immediately without refreshing.
    const interval = setInterval(fetchData, 4000); 

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [id]);

  // --- USER ACTION: Confirm Delivery ---
  const handleConfirmDelivery = async () => {
    if (!confirm("Are you sure you received the package?")) return;
    setUpdating(true);
    try {
      await fetch(`/api/delivery/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DELIVERED' })
      });
      await fetchData(); 
    } catch (error) { alert("Failed to confirm"); } 
    finally { setUpdating(false); }
  };

  // --- DEV TOOL: Simulate Driver Movement ---
  const simulateMovement = async () => {
    setUpdating(true);
    
    const storeLat = delivery?.goal?.product?.store?.latitude || 24.8607;
    const storeLng = delivery?.goal?.product?.store?.longitude || 67.0011;

    const randomLat = storeLat + (Math.random() * 0.01 - 0.005); 
    const randomLng = storeLng + (Math.random() * 0.01 - 0.005);
    
    await fetch(`/api/delivery/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        latitude: randomLat, 
        longitude: randomLng, 
        location: 'Driver En Route (Simulated)' 
      })
    });
    
    setUpdating(false);
    fetchData();
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;
  if (!delivery) return <div className="p-10 text-center">Tracking not found</div>;

  const product = delivery.goal?.product;
  const isDelivered = delivery.status === 'DELIVERED';
  const isDispatched = delivery.status === 'DISPATCHED'; 
  const statusColor = isDelivered ? 'bg-green-50 border-green-200 text-green-700' : 'bg-blue-50 border-blue-200 text-blue-700';

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => router.back()} className="flex items-center text-gray-500 hover:text-gray-900 text-sm font-medium">
            <ArrowLeft size={16} className="mr-1" /> Back
          </button>
          
          {/* Button ONLY shows if status is exactly 'DISPATCHED' */}
          {isDispatched && (
            <button onClick={simulateMovement} disabled={updating} className="text-xs text-gray-400 hover:text-indigo-600 flex items-center gap-1">
              <PlayCircle size={14} /> Driver Update
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[80vh]">
          
          {/* SIDEBAR */}
          <div className="md:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-full overflow-y-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Track Delivery</h1>
            <p className="text-gray-400 text-xs font-mono mb-6">ID: {delivery.trackingNumber}</p>
            
            <div className={`p-4 rounded-xl border mb-6 ${statusColor}`}>
              <div className="flex items-center gap-2 mb-1 font-bold uppercase">
                {isDelivered ? <CheckCircle size={18} /> : <Truck size={18} />} 
                {delivery.status.replace('_', ' ')}
              </div>
              <div className="flex items-center gap-2 text-xs opacity-80 mt-2">
                <Calendar size={12} />
                {isDelivered 
                  ? `Delivered on ${new Date(delivery.updatedAt).toLocaleDateString()}`
                  : `Scheduled Delivery: ${new Date(delivery.estimatedDate).toDateString()}` 
                }
              </div>
            </div>

            <div className="flex gap-4 items-start border-t border-gray-100 pt-6 mb-6">
               {product?.images?.[0] && <img src={product.images[0]} className="w-16 h-16 rounded-lg bg-gray-100 object-cover border" />}
               <div>
                 <h3 className="font-semibold text-gray-800 line-clamp-1">{product?.name}</h3>
                 <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                    <Store size={12} /> {product?.store?.name}
                 </div>
               </div>
            </div>

            <div className="border-t border-gray-100 pt-6 mb-auto">
               <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-wider">Destination</h4>
               <div className="flex gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                 <MapPin size={18} className="mt-0.5 text-gray-400 shrink-0" /> 
                 <span className="leading-relaxed">{delivery.shippingAddress}</span>
               </div>
            </div>

            {/* CONFIRM BUTTON: Only visible/enabled when DISPATCHED */}
            {!isDelivered && isDispatched && (
              <div className="mt-6 border-t border-gray-100 pt-6">
                <button 
                  onClick={handleConfirmDelivery}
                  disabled={updating}
                  className="w-full py-3.5 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? <Loader2 className="animate-spin" /> : <CheckCircle size={20} />}
                  Confirm Delivery Received
                </button>
                <p className="text-xs text-center text-gray-400 mt-3">
                  Only click this once you have physically received your package.
                </p>
              </div>
            )}
            
            {/* If Pending, show message instead of button */}
            {!isDelivered && !isDispatched && (
                <div className="mt-6 border-t border-gray-100 pt-6 text-center">
                    <p className="text-sm text-gray-500 italic">Waiting for dispatch...</p>
                </div>
            )}

          </div>

          {/* MAP */}
          <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
            <DeliveryMap delivery={delivery} />
          </div>

        </div>
      </div>
    </div>
  );
}