'use client';

import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// --- 1. Smart Bounds Controller ---
// Automatically zooms and pans the map to fit all points perfectly on load
function BoundsController({ points }) {
  const map = useMap();
  const hasFitted = useRef(false);

  useEffect(() => {
    // Filter out null or invalid points safely
    const validPoints = points.filter(p => p && p.lat != null && p.lng != null && !isNaN(p.lat) && !isNaN(p.lng));

    if (validPoints.length === 0) return;

    if (!hasFitted.current) {
      if (validPoints.length === 1) {
        // animate: false prevents the _leaflet_pos crash
        map.setView([validPoints[0].lat, validPoints[0].lng], 14, { animate: false });
      } else {
        const bounds = L.latLngBounds(validPoints.map(p => [p.lat, p.lng]));
        // animate: false prevents the _leaflet_pos crash
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15, animate: false });
      }
      hasFitted.current = true;
    }
  }, [points, map]);

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
    iconSize: [40, 40], iconAnchor: [20, 45], popupAnchor: [0, -45]
  });
};

export default function DeliveryMap({ delivery }) {
  
  // --- 3. Extract Locations Safely ---
  const storeLocation = useMemo(() => {
    const store = delivery?.goal?.product?.store;
    if (!store?.latitude || !store?.longitude) return null;
    return { 
      lat: Number(store.latitude), 
      lng: Number(store.longitude), 
      name: store.name 
    };
  }, [delivery]);

  const customerLocation = useMemo(() => {
    return (delivery?.destinationLat != null && delivery?.destinationLng != null)
      ? { lat: Number(delivery.destinationLat), lng: Number(delivery.destinationLng) } 
      : null;
  }, [delivery]);

  // Pass all active points to the bounds controller
  const allPoints = useMemo(() => {
      return [storeLocation, customerLocation].filter(Boolean);
  }, [storeLocation, customerLocation]);

  // --- 4. Direct Polyline Calculation (Straight Line) ---
  // Connects Store -> Customer sequentially
  const routePath = useMemo(() => {
    const path = [];
    if (storeLocation) path.push([storeLocation.lat, storeLocation.lng]);
    if (customerLocation) path.push([customerLocation.lat, customerLocation.lng]);
    return path;
  }, [storeLocation, customerLocation]);

  // --- 5. Icons ---
  const StoreIcon = useMemo(() => createCustomIcon('<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M2 7h20"/></svg>', "indigo"), []);
  const HomeIcon = useMemo(() => createCustomIcon('<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>', "green"), []);

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer 
        center={[24.8607, 67.0011]} // Default safe fallback (Karachi)
        zoom={12} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
        
        <BoundsController points={allPoints} />

        {storeLocation && (
            <Marker position={[storeLocation.lat, storeLocation.lng]} icon={StoreIcon}>
                <Popup>{storeLocation.name} (Store)</Popup>
            </Marker>
        )}

        {customerLocation && (
            <Marker position={[customerLocation.lat, customerLocation.lng]} icon={HomeIcon}>
                <Popup>Delivery Destination</Popup>
            </Marker>
        )}
        
        {/* Render a dashed straight line connecting the active points */}
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