'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Crosshair, RefreshCw } from 'lucide-react';

// --- 1. Smart Bounds Controller ---
function BoundsController({ points }) {
  const map = useMap();
  const hasFitted = useRef(false);

  useEffect(() => {
    if (hasFitted.current) return;

    const validPoints = points.filter(p => p && p.lat != null && p.lng != null && !isNaN(p.lat) && !isNaN(p.lng));
    if (validPoints.length > 0) {
      if (validPoints.length === 1) {
        map.setView([validPoints[0].lat, validPoints[0].lng], 14, { animate: false });
      } else {
        const bounds = L.latLngBounds(validPoints.map(p => [p.lat, p.lng]));
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15, animate: false });
      }
      hasFitted.current = true;
    }
  }, [points, map]);

  return null;
}

// --- 2. Locate Rider Button ---
function LocateRiderButton({ riderLocation }) {
  const map = useMap();
  if (!riderLocation) return null; 

  return (
    <div className="absolute bottom-6 right-6 z-[1000] flex flex-col gap-2">
      <button
        onClick={(e) => {
          e.stopPropagation();
          map.flyTo([riderLocation.lat, riderLocation.lng], 16, { animate: true, duration: 1.0 });
        }}
        className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2.5 rounded-full font-bold shadow-xl border border-blue-100 hover:bg-blue-50 transition-all active:scale-95"
      >
        <Crosshair size={18} />
        Locate Rider
      </button>
    </div>
  );
}

// --- 3. Bulletproof Custom Icons ---
const createCustomIcon = (iconHtml, bgColor) => {
  return L.divIcon({
    html: `
      <div style="display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; background-color: ${bgColor}; color: white; border-radius: 50%; border: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.2); position: relative;">
        ${iconHtml}
        <div style="position: absolute; bottom: -5px; width: 12px; height: 12px; background-color: ${bgColor}; transform: rotate(45deg);"></div>
      </div>
    `,
    className: '', 
    iconSize: [40, 40], 
    iconAnchor: [20, 45], 
    popupAnchor: [0, -45]
  });
};

// --- 4. High-Resolution Straight Line Fallback ---
const generateStraightLine = (start, end, steps = 100) => {
  const path = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    path.push({
      lat: start.lat + (end.lat - start.lat) * t,
      lng: start.lng + (end.lng - start.lng) * t
    });
  }
  return path;
};

export default function DeliveryMap({ delivery }) {
  const [isMounted, setIsMounted] = useState(false);
  
  // Status Checks
  const isDelivered = delivery?.status === 'DELIVERED';
  const isInTransit = delivery?.status === 'IN_TRANSIT'; 
  
  // Progress defaults to 100% if delivered, otherwise 0%
  const [progress, setProgress] = useState(isDelivered ? 1.0 : 0.0); 
  const [fullRoute, setFullRoute] = useState([]); 

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Force progress to 100% instantly if the status changes to DELIVERED via OTP
  useEffect(() => {
    if (delivery?.status === 'DELIVERED') {
      setProgress(1.0);
    }
  }, [delivery?.status]);

  // --- 5. Extract Store & Customer Locations ---
  const storeLocation = useMemo(() => {
    const store = delivery?.goal?.product?.store;
    if (!store?.latitude || !store?.longitude) {
        return { lat: 24.8607, lng: 67.0011, name: store?.name || "Store (Fallback)" };
    }
    return { lat: Number(store.latitude), lng: Number(store.longitude), name: store.name };
  }, [delivery]);

  const customerLocation = useMemo(() => {
    if (delivery?.destinationLat == null || delivery?.destinationLng == null) {
        return { lat: 24.9150, lng: 67.0600 }; 
    }
    return { lat: Number(delivery.destinationLat), lng: Number(delivery.destinationLng) };
  }, [delivery]);

  // --- 6. Fetch Real Road Geometry (Frontend Only) ---
  useEffect(() => {
    if (!storeLocation || !customerLocation) return;

    const fetchRoadPath = async () => {
      try {
        // ✅ The base URL is securely fetched from the .env file with a fallback
        const baseUrl = process.env.NEXT_PUBLIC_OSRM_BASE_URL || 'https://router.project-osrm.org';
        const res = await fetch(`${baseUrl}/route/v1/driving/${storeLocation.lng},${storeLocation.lat};${customerLocation.lng},${customerLocation.lat}?overview=full&geometries=geojson`);
        
        const data = await res.json();
        
        if (data.routes && data.routes.length > 0) {
          const roadCoords = data.routes[0].geometry.coordinates.map(coord => ({
            lat: coord[1],
            lng: coord[0]
          }));
          setFullRoute(roadCoords);
        } else {
          setFullRoute(generateStraightLine(storeLocation, customerLocation));
        }
      } catch (error) {
        setFullRoute(generateStraightLine(storeLocation, customerLocation));
      }
    };

    fetchRoadPath();
  }, [storeLocation, customerLocation]);

  // --- 7. Calculate Simulated Rider Position ---
  const simulatedRider = useMemo(() => {
    if (fullRoute.length === 0) return storeLocation;
    const index = Math.floor(progress * (fullRoute.length - 1));
    return fullRoute[index];
  }, [fullRoute, progress, storeLocation]);

  const completedRoutePath = useMemo(() => {
    if (fullRoute.length === 0) return [];
    const index = Math.floor(progress * (fullRoute.length - 1));
    return fullRoute.slice(0, index + 1).map(p => [p.lat, p.lng]);
  }, [fullRoute, progress]);

  const activeRoutePath = useMemo(() => {
    if (fullRoute.length === 0) return [];
    const index = Math.floor(progress * (fullRoute.length - 1));
    return fullRoute.slice(index).map(p => [p.lat, p.lng]);
  }, [fullRoute, progress]);

  const focusPoints = useMemo(() => {
      return [storeLocation, customerLocation, simulatedRider].filter(Boolean);
  }, [storeLocation, customerLocation, simulatedRider]);

  // --- Generate Icons ---
  const StoreIcon = useMemo(() => createCustomIcon('<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M2 7h20"/></svg>', "#4f46e5"), []); 
  const HomeIcon = useMemo(() => createCustomIcon('<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>', "#16a34a"), []); 
  const RiderIcon = useMemo(() => createCustomIcon('<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="16" height="16" x="4" y="4" rx="2"/><path d="M9 14h.01"/><path d="M15 14h.01"/><path d="M8 10h8"/></svg>', "#2563eb"), []); 

  // --- Move 5% per click ---
  const handleManualUpdate = (e) => {
    e.stopPropagation();
    setProgress(prev => Math.min(prev + 0.05, 1));
  };

  if (!isMounted) {
    return <div className="w-full h-[300px] sm:h-full bg-slate-100 flex items-center justify-center text-slate-400 text-sm font-medium rounded-xl">Loading Map...</div>;
  }

  return (
    <div className="w-full h-full min-h-[300px] sm:min-h-[400px] relative z-0 rounded-xl overflow-hidden border border-slate-200 cursor-default">
      <MapContainer 
        center={[24.8607, 67.0011]} 
        zoom={12} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
        
        <BoundsController points={focusPoints} />
        <LocateRiderButton riderLocation={simulatedRider} />

        {/* 5% SIMULATION BUTTON (Locks if Not In Transit or Delivered) */}
        <div className="absolute top-4 right-4 z-[1000]">
            <button
              onClick={handleManualUpdate}
              disabled={!isInTransit || progress >= 1 || fullRoute.length === 0}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all active:scale-95 disabled:bg-slate-400 disabled:cursor-not-allowed border border-white/20"
            >
              <RefreshCw size={18} />
              {(progress >= 1 || isDelivered) 
                ? "Rider Arrived" 
                : !isInTransit 
                  ? "Waiting for Transit" 
                  : "Fetch Rider Update"}
            </button>
        </div>

        {/* STATIC PINS */}
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
        
        {/* SIMULATED RIDER PIN */}
        {simulatedRider && (
            <Marker position={[simulatedRider.lat, simulatedRider.lng]} icon={RiderIcon} zIndexOffset={1000}>
                <Popup>{isDelivered ? "Delivery Completed" : "Rider Location"}</Popup>
            </Marker>
        )}
        
        {/* GREY LINE (Completed Path Behind Rider) */}
        {completedRoutePath.length > 1 && (
          <Polyline 
            positions={completedRoutePath} 
            color="#94a3b8" 
            weight={4} 
            opacity={0.8}
            lineCap="round"
          />
        )}

        {/* BLUE LINE (Remaining Path Ahead of Rider) */}
        {activeRoutePath.length > 1 && !isDelivered && (
          <Polyline 
            positions={activeRoutePath} 
            color="#3b82f6" 
            weight={5} 
            dashArray="8, 10" 
            opacity={0.9}
            lineCap="round"
          />
        )}

      </MapContainer>
    </div>
  );
}