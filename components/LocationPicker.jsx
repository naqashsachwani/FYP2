'use client';

import { useEffect } from 'react';
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
    // Default fallback center (Karachi)
    const defaultCenter = [24.8607, 67.0011]; 
    const center = position ? [position.lat, position.lng] : defaultCenter;

    return (
        <div className="h-56 w-full rounded-xl overflow-hidden border-2 border-slate-200 relative z-0 mb-2 shadow-inner">
            <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                <MapEvents setPosition={setPosition} />
                <MapUpdater position={position} />
                {position && <Marker position={[position.lat, position.lng]} icon={customIcon} />}
            </MapContainer>
            
            <div className="absolute top-3 right-3 bg-white/95 backdrop-blur px-3 py-1.5 text-xs font-bold text-blue-700 rounded-lg shadow-md z-[1000] pointer-events-none border border-blue-100">
                📍 Click map to place exact pin
            </div>
        </div>
    );
}