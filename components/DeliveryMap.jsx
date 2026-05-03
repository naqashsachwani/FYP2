'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// --- 1. Smart Bounds Controller ---
function BoundsController({ points }) {
  const map = useMap();
  const hasFitted = useRef(false);

  useEffect(() => {
    const validPoints = points.filter(p => p && p.lat != null && p.lng != null && !isNaN(p.lat) && !isNaN(p.lng));
    if (validPoints.length === 0) return;

    if (!hasFitted.current || validPoints.length > 2) { 
      if (validPoints.length === 1) {
        map.setView([validPoints[0].lat, validPoints[0].lng], 14, { animate: false });
      } else {
        const bounds = L.latLngBounds(validPoints.map(p => [p.lat, p.lng]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15, animate: true });
      }
      hasFitted.current = true;
    }
  }, [points, map]);

  return null;
}

// --- 2. Custom Icons ---
const createCustomIcon = (iconHtml, color, isPulse = false) => {
  return L.divIcon({
    html: `<div class="flex items-center justify-center w-10 h-10 bg-${color}-600 text-white rounded-full border-2 border-white shadow-md relative ${isPulse ? 'animate-pulse ring-4 ring-blue-300' : ''}">
              ${iconHtml}
              <div class="absolute -bottom-1 w-2 h-2 bg-${color}-600 transform rotate-45"></div>
            </div>`,
    className: 'custom-map-icon', 
    iconSize: [40, 40], iconAnchor: [20, 45], popupAnchor: [0, -45]
  });
};

export default function DeliveryMap({ delivery }) {
  
  // ✅ THE ULTIMATE FIX: Create a guaranteed unique key for every mount
  const [mapKey, setMapKey] = useState(null);

  useEffect(() => {
    // By combining Date and Math.random, React is forced to destroy the old map <div> 
    // and create a fresh one every time this component mounts or hot-reloads.
    setMapKey(`map-${delivery?.id}-${Date.now()}-${Math.random()}`);
    
    return () => setMapKey(null); // Cleanup on unmount
  }, [delivery?.id]);

  // --- 3. Extract Locations Safely ---
  const storeLocation = useMemo(() => {
    const store = delivery?.goal?.product?.store;
    if (!store?.latitude || !store?.longitude) return null;
    return { lat: Number(store.latitude), lng: Number(store.longitude), name: store.name };
  }, [delivery]);

  const customerLocation = useMemo(() => {
    return (delivery?.destinationLat != null && delivery?.destinationLng != null)
      ? { lat: Number(delivery.destinationLat), lng: Number(delivery.destinationLng) } 
      : null;
  }, [delivery]);

  const riderLocation = useMemo(() => {
    return (delivery?.latitude != null && delivery?.longitude != null)
      ? { lat: Number(delivery.latitude), lng: Number(delivery.longitude) } 
      : null;
  }, [delivery]);

  const allPoints = useMemo(() => {
      return [storeLocation, customerLocation, riderLocation].filter(Boolean);
  }, [storeLocation, customerLocation, riderLocation]);

  // --- 4. Dynamic Polyline (Store -> Rider -> Customer) ---
  const routePath = useMemo(() => {
    const path = [];
    if (storeLocation) path.push([storeLocation.lat, storeLocation.lng]);
    if (riderLocation) path.push([riderLocation.lat, riderLocation.lng]); 
    if (customerLocation) path.push([customerLocation.lat, customerLocation.lng]);
    return path;
  }, [storeLocation, customerLocation, riderLocation]);

  // --- 5. Icons ---
  const StoreIcon = useMemo(() => createCustomIcon('<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M2 7h20"/></svg>', "indigo"), []);
  const HomeIcon = useMemo(() => createCustomIcon('<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>', "green"), []);
  const RiderIcon = useMemo(() => createCustomIcon('<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="16" height="16" x="4" y="4" rx="2"/><path d="M9 14h.01"/><path d="M15 14h.01"/><path d="M8 10h8"/></svg>', "blue", true), []); 

  // ✅ Show a loader until the unique key is generated safely on the client
  if (!mapKey) {
    return <div className="w-full h-full bg-slate-100 animate-pulse flex items-center justify-center text-slate-400 font-medium rounded-xl">Initializing Map...</div>;
  }

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer 
        key={mapKey} // ✅ This completely prevents Leaflet from crashing
        center={[24.8607, 67.0011]} 
        zoom={12} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
        
        <BoundsController points={allPoints} />

        {storeLocation && (
            <Marker position={[storeLocation.lat, storeLocation.lng]} icon={StoreIcon}>
                <Popup>{storeLocation.name} (Pickup)</Popup>
            </Marker>
        )}

        {customerLocation && (
            <Marker position={[customerLocation.lat, customerLocation.lng]} icon={HomeIcon}>
                <Popup>Your Destination</Popup>
            </Marker>
        )}
        
        {riderLocation && (
            <Marker position={[riderLocation.lat, riderLocation.lng]} icon={RiderIcon}>
                <Popup>Rider's Live Location</Popup>
            </Marker>
        )}
        
        {routePath.length > 1 && (
          <Polyline 
            positions={routePath} 
            color="#6366f1" 
            weight={4} 
            dashArray="10, 10" 
            opacity={0.7}
            lineCap="round"
          />
        )}
      </MapContainer>
    </div>
  );
}