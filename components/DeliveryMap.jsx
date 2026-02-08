'use client';

import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// --- 1. Map Controller ---
// Handles camera movement *after* the map is loaded
function MapController({ center }) {
  const map = useMap();

  useEffect(() => {
    if (center && Array.isArray(center) && !isNaN(center[0]) && !isNaN(center[1])) {
      map.flyTo(center, 13, { animate: true, duration: 1.5 });
    }
  }, [center, map]);

  return null;
}

// --- 2. Custom Icons ---
const createCustomIcon = (iconHtml, color) => {
  return L.divIcon({
    html: `<div class="flex items-center justify-center w-10 h-10 bg-${color}-600 text-white rounded-full border-2 border-white shadow-md relative">
             ${iconHtml}
             <div class="absolute -bottom-1 w-2 h-2 bg-${color}-600 transform rotate-45"></div>
           </div>`,
    className: 'custom-map-icon', 
    iconSize: [40, 40],
    iconAnchor: [20, 45],
    popupAnchor: [0, -45]
  });
};

export default function DeliveryMap({ delivery }) {
  const [routePath, setRoutePath] = useState([]);

  // --- DATA PREPARATION ---

  // 1. Driver Location (Live or Null)
  // We prioritize the root delivery fields.
  const rawDriverLat = delivery?.latitude;
  const rawDriverLng = delivery?.longitude;

  const driverLat = rawDriverLat ? Number(rawDriverLat) : null;
  const driverLng = rawDriverLng ? Number(rawDriverLng) : null;

  // Driver is visible only if lat/lng are valid numbers
  const isDriverVisible = driverLat !== null && driverLng !== null && !isNaN(driverLat) && !isNaN(driverLng);

  // 2. Store Location
  const storeLocation = useMemo(() => {
    const store = delivery?.goal?.product?.store;
    return (store?.latitude && store?.longitude) 
      ? { lat: Number(store.latitude), lng: Number(store.longitude), name: store.name } 
      : null;
  }, [delivery?.goal?.product?.store]);

  // 3. Customer Location
  const customerLocation = useMemo(() => {
    return (delivery?.destinationLat && delivery?.destinationLng)
      ? { lat: Number(delivery.destinationLat), lng: Number(delivery.destinationLng), address: delivery.shippingAddress }
      : null;
  }, [delivery?.destinationLat, delivery?.destinationLng, delivery?.shippingAddress]);

  // --- ROUTING LOGIC ---
  useEffect(() => {
    let isMounted = true;

    const fetchRoute = async () => {
      let start = isDriverVisible ? { lat: driverLat, lng: driverLng } : storeLocation;
      let end = customerLocation;

      if (!start || !end) {
        if (isMounted) setRoutePath([]);
        return;
      }

      // Default: Straight line
      if (isMounted) setRoutePath([[start.lat, start.lng], [end.lat, end.lng]]);

      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
        const response = await fetch(url);
        if (!response.ok) return;
        
        const data = await response.json();
        if (data.code === "Ok" && data.routes?.length > 0) {
            const coordinates = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
            if (isMounted) setRoutePath(coordinates);
        }
      } catch (e) { /* Ignore */ }
    };

    fetchRoute();
    return () => { isMounted = false; };
  }, [isDriverVisible, driverLat, driverLng, storeLocation, customerLocation]);

  // --- ICONS ---
  const StoreIcon = useMemo(() => createCustomIcon('<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-5"/><path d="M9 22v-5"/><path d="M2 7h20"/><path d="M12 7v5"/></svg>', "indigo"), []);
  const TruckIcon = useMemo(() => createCustomIcon('<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="8" x="2" y="10" rx="2"/><path d="M10 10h4C19.33 10 22 12.67 22 18V18"/><path d="M14 18H2"/><path d="M14 10V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v4"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>', "blue"), []);
  const HomeIcon = useMemo(() => createCustomIcon('<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>', "green"), []);

  // --- MAP CENTER ---
  const initialCenter = isDriverVisible ? [driverLat, driverLng] : (storeLocation ? [storeLocation.lat, storeLocation.lng] : [30.3753, 69.3451]);

  if (!initialCenter || isNaN(initialCenter[0])) return <div className="h-full w-full bg-gray-100 flex items-center justify-center text-gray-400">Map Loading...</div>;

  // ✅ UNIQUE KEY GENERATION
  // This forces React to trash the old map DOM and build a new one if the base ID changes.
  // It stops Leaflet from trying to attach to a dead element.
  const mapKey = `map-${delivery.id}`; 

  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-gray-100 relative z-0">
      <style jsx global>{` .custom-map-icon { background: transparent; border: none; } `}</style>
      
      <MapContainer 
        key={mapKey} // 👈 THIS IS THE FIX FOR "appendChild" ERRORS
        center={initialCenter} 
        zoom={13} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
        
        <MapController center={initialCenter} />

        {storeLocation && <Marker position={[storeLocation.lat, storeLocation.lng]} icon={StoreIcon}><Popup>Store</Popup></Marker>}
        {isDriverVisible && <Marker position={[driverLat, driverLng]} icon={TruckIcon}><Popup>Driver</Popup></Marker>}
        {customerLocation && <Marker position={[customerLocation.lat, customerLocation.lng]} icon={HomeIcon}><Popup>Customer</Popup></Marker>}
        
        {routePath.length > 1 && <Polyline positions={routePath} color="#6366f1" weight={5} opacity={0.8} />}
      </MapContainer>
    </div>
  );
}