'use client';

import { useEffect, useState } from 'react';
import { Map as MapIcon, Globe } from 'lucide-react';

interface MapProps {
  lat: number;
  lon: number;
  city: string;
  country: string;
}

type MapProvider = 'google' | 'osm';

export default function Map({ lat, lon, city, country }: MapProps) {
  const [mounted, setMounted] = useState(false);
  const [provider, setProvider] = useState<MapProvider>('google');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-full min-h-[350px] md:min-h-[400px] rounded-xl bg-border-muted/30 animate-pulse flex items-center justify-center border border-card-border">
        <span className="text-text-muted text-sm font-medium">Initializing Map Embed...</span>
      </div>
    );
  }

  // Create clean embed URLs for both providers
  // Google Maps: familiar road map with search coordinates
  const googleMapsUrl = `https://maps.google.com/maps?q=${lat},${lon}&t=&z=14&ie=UTF8&iwloc=&output=embed`;

  // OpenStreetMap: open-source standard with custom boundary bounding box centering
  const osmDelta = 0.015; // Zoom scale factor
  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lon - osmDelta}%2C${lat - osmDelta / 2}%2C${lon + osmDelta}%2C${lat + osmDelta / 2}&layer=mapnik&marker=${lat}%2C${lon}`;

  return (
    <div className="w-full h-full min-h-[380px] md:min-h-[420px] flex flex-col gap-3">
      
      {/* Dynamic Map Provider Segmented Toggle */}
      <div className="flex items-center justify-between bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/80 rounded-xl p-1 shadow-sm shrink-0">
        <div className="flex gap-1">
          <button
            onClick={() => setProvider('google')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              provider === 'google'
                ? 'bg-white dark:bg-slate-800 text-brand-orange shadow-sm font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            Google Maps
          </button>
          <button
            onClick={() => setProvider('osm')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
              provider === 'osm'
                ? 'bg-white dark:bg-slate-800 text-brand-orange shadow-sm font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            OpenStreetMap
          </button>
        </div>
        
        {/* Subtle GPS Indicator */}
        <div className="hidden sm:block font-mono text-[10px] text-slate-500 dark:text-slate-400 pr-2">
          {city && `${city}, `}{country} ({lat.toFixed(3)}, {lon.toFixed(3)})
        </div>
      </div>

      {/* Interactive Map Iframe Container */}
      <div className="flex-1 w-full h-full relative rounded-2xl overflow-hidden border border-slate-200/60 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#0b0f19]/60 shadow-md">
        <iframe
          title={`${provider === 'google' ? 'Google Maps' : 'OpenStreetMap'} View`}
          src={provider === 'google' ? googleMapsUrl : osmUrl}
          className="w-full h-full absolute inset-0 border-0"
          allowFullScreen={false}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      
    </div>
  );
}
