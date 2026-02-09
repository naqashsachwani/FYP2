'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// --- 1. Map Controller (CRASH FIXED) ---
function MapController({ center }) {
  const map = useMap();
  const hasCentered = useRef(false);

  useEffect(() => {
    // Check if we have a valid center and haven't centered yet
    if (center && !isNaN(center[0]) && !hasCentered.current) {
      // ✅ FIX: { animate: false } prevents the _leaflet_pos crash
      // It forces an instant jump instead of a slide animation
      map.setView(center, 13, { animate: false });
      hasCentered.current = true;
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
    iconSize: [40, 40], iconAnchor: [20, 45], popupAnchor: [0, -45]
  });
};

export default function DeliveryMap({ delivery }) {
  const [routePath, setRoutePath] = useState([]);
  const [usingFallback, setUsingFallback] = useState(false);

  // --- 3. Extract Locations (STRICTLY FROM DB) ---
  
  // A. Driver Location
  const driverLat = Number(delivery?.latitude);
  const driverLng = Number(delivery?.longitude);
  const isDriverVisible = !isNaN(driverLat) && !isNaN(driverLng) && driverLat !== 0;

  // B. Store Location (Strictly from Product -> Store relation)
  const storeLocation = useMemo(() => {
    const store = delivery?.goal?.product?.store;
    if (!store?.latitude || !store?.longitude) return null;
    return { 
      lat: Number(store.latitude), 
      lng: Number(store.longitude), 
      name: store.name 
    };
  }, [delivery]);

  // C. Customer Location
  const customerLocation = useMemo(() => {
    return (delivery?.destinationLat && delivery?.destinationLng)
      ? { lat: Number(delivery.destinationLat), lng: Number(delivery.destinationLng) } 
      : null;
  }, [delivery]);

  // --- 4. Route Calculation ---
  useEffect(() => {
    let isMounted = true;
    
    const fetchRoute = async () => {
      const start = isDriverVisible ? { lat: driverLat, lng: driverLng } : storeLocation;
      const end = customerLocation;

      if (!start || !end || isNaN(start.lat) || isNaN(end.lat)) {
        if (isMounted) setRoutePath([]);
        return;
      }

      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000); 

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        const data = await response.json();
        
        if (isMounted && response.ok && data.code === "Ok" && data.routes?.length > 0) {
          setRoutePath(data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]));
          setUsingFallback(false);
        } else {
          throw new Error("OSRM Failed");
        }
      } catch (e) {
        if (isMounted) {
          setRoutePath([[start.lat, start.lng], [end.lat, end.lng]]);
          setUsingFallback(true);
        }
      }
    };

    fetchRoute();
    return () => { isMounted = false; };
  }, [driverLat, driverLng, storeLocation, customerLocation, isDriverVisible]);

  // Icons
  const StoreIcon = useMemo(() => createCustomIcon('<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M2 7h20"/></svg>', "indigo"), []);
  const TruckIcon = useMemo(() => createCustomIcon('<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="8" height="8" x="2" y="10" rx="2"/><path d="M10 10h4C19.33 10 22 12.67 22 18V18"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>', "blue"), []);
  const HomeIcon = useMemo(() => createCustomIcon('<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>', "green"), []);

  // Determine Map Center
  const initialCenter = isDriverVisible 
    ? [driverLat, driverLng] 
    : (storeLocation ? [storeLocation.lat, storeLocation.lng] : [24.8607, 67.0011]);

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer 
        center={initialCenter} 
        zoom={13} 
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
        
        {/* Pass the center to our fixed controller */}
        <MapController center={initialCenter} />

        {storeLocation && (
            <Marker position={[storeLocation.lat, storeLocation.lng]} icon={StoreIcon}>
                <Popup>{storeLocation.name}</Popup>
            </Marker>
        )}

        {isDriverVisible && <Marker position={[driverLat, driverLng]} icon={TruckIcon}><Popup>Driver</Popup></Marker>}
        {customerLocation && <Marker position={[customerLocation.lat, customerLocation.lng]} icon={HomeIcon}><Popup>Destination</Popup></Marker>}
        
        {routePath.length > 1 && (
          <Polyline 
            positions={routePath} 
            color={usingFallback ? "#9ca3af" : "#6366f1"} 
            weight={5} 
            dashArray={usingFallback ? "10, 10" : null} 
            opacity={0.8}
          />
        )}
      </MapContainer>
    </div>
  );
}