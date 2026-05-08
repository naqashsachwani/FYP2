'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix standard leaflet icon paths for Next.js
const customIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

// Listens for clicks on the map and moves the pin
function MapEvents({ setPosition }) {
    useMapEvents({
        click(e) {
            setPosition({ lat: e.latlng.lat, lng: e.latlng.lng });
        }
    });
    return null;
}

// Automatically pans the map if the user clicks "Use GPS"
function MapUpdater({ position }) {
    const map = useMap();
    useEffect(() => {
        if (position) {
            map.flyTo([position.lat, position.lng], 15);
        }
    }, [position, map]);
    return null;
}

export default function LocationPicker({ position, setPosition }) {
    // ✅ THE ULTIMATE FIX: Create a guaranteed unique key for every mount
    const [mapKey, setMapKey] = useState(null);

    useEffect(() => {
      // By combining Date and Math.random, React is forced to destroy the old map <div> 
      // and create a fresh one every time this component mounts or hot-reloads.
      setMapKey(`location-picker-${Date.now()}-${Math.random()}`);
      
      return () => setMapKey(null); // Cleanup on unmount
    }, []);

    // Default fallback center (Karachi)
    const defaultCenter = [24.8607, 67.0011]; 
    const center = position ? [position.lat, position.lng] : defaultCenter;

    // ✅ Show a loader until the unique key is generated safely on the client
    if (!mapKey) {
      return <div className="h-48 sm:h-56 w-full bg-slate-100 animate-pulse flex items-center justify-center text-slate-400 text-xs font-medium rounded-xl mb-2">Initializing Map...</div>;
    }

    return (
        // Adjusted height so it doesn't take up the whole screen on small mobiles
        <div className="h-48 sm:h-56 w-full rounded-xl overflow-hidden border-2 border-slate-200 relative z-0 mb-2 shadow-inner">
            <MapContainer 
                key={mapKey} // ✅ This completely prevents Leaflet from crashing
                center={center} 
                zoom={12} 
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                <MapEvents setPosition={setPosition} />
                <MapUpdater position={position} />
                {position && <Marker position={[position.lat, position.lng]} icon={customIcon} />}
            </MapContainer>
            
            {/* Kept tooltip inside but ensured it stays hidden from touch events so it doesn't block map interaction */}
            <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-white/95 backdrop-blur px-2.5 sm:px-3 py-1.5 text-[10px] sm:text-xs font-bold text-blue-700 rounded-lg shadow-md z-[1000] pointer-events-none border border-blue-100">
                📍 Click map to place exact pin
            </div>
        </div>
    );
}