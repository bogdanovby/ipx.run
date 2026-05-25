'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, AttributionControl } from 'react-leaflet';
import L from 'leaflet';

interface MapProps {
  lat: number;
  lon: number;
  city: string;
  country: string;
}

// Custom helper component to pan/zoom the map smoothly when coordinates change
function ChangeMapCenter({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lon], 11, {
      animate: true,
      duration: 1.5,
    });
  }, [lat, lon, map]);
  return null;
}

export default function Map({ lat, lon, city, country }: MapProps) {
  const [mapId] = useState(() => `map-${Math.random().toString(36).substring(2, 9)}`);
  const [mounted, setMounted] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Detect initial theme
    const hasDarkClass = document.documentElement.classList.contains('dark');
    setIsDarkTheme(hasDarkClass);

    // Watch for theme changes on html element
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkTheme(isDark);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-full min-h-[350px] md:min-h-[400px] rounded-xl bg-border-muted/30 animate-pulse flex items-center justify-center border border-card-border">
        <span className="text-text-muted text-sm font-medium">Initializing Map Engine...</span>
      </div>
    );
  }

  // Create custom marker icon with a premium pulsing orange dot
  const customMarkerIcon = L.divIcon({
    className: 'custom-leaflet-icon',
    html: `
      <div class="relative w-8 h-8 flex items-center justify-center">
        <!-- Outer pulsing shadow -->
        <span class="absolute w-8 h-8 rounded-full bg-brand-orange/30 animate-ping opacity-75"></span>
        <!-- Inner ring -->
        <span class="absolute w-5 h-5 rounded-full border border-white bg-brand-orange/70 shadow-lg"></span>
        <!-- Center core -->
        <span class="absolute w-2.5 h-2.5 rounded-full bg-white"></span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  // Select Tile Layer depending on current theme state
  // CartoDB Dark Matter for dark, CartoDB Positron for light
  const tileUrl = isDarkTheme
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  const attribution =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

  return (
    <div className="w-full h-full min-h-[350px] md:min-h-[400px] relative rounded-xl overflow-hidden border border-card-border shadow-inner">
      <MapContainer
        key={mapId}
        center={[lat, lon]}
        zoom={11}
        scrollWheelZoom={false}
        zoomControl={true}
        attributionControl={false} // Disable default so we can hide 'Leaflet' logo and links
        className="w-full h-full absolute inset-0 z-10"
      >
        <TileLayer url={tileUrl} />
        <AttributionControl prefix={false} position="bottomright" />
        <Marker position={[lat, lon]} icon={customMarkerIcon}>
          <Popup className="custom-popup">
            <div className="text-center font-sans p-1 text-slate-950 dark:text-slate-950">
              <p className="font-semibold text-xs leading-tight">{city}</p>
              <p className="text-[10px] text-slate-500 font-medium leading-none mt-0.5">{country}</p>
            </div>
          </Popup>
        </Marker>
        <ChangeMapCenter lat={lat} lon={lon} />
      </MapContainer>
    </div>
  );
}
