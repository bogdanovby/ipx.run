'use client';

import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';

interface MapProps {
  lat: number;
  lon: number;
  city: string;
  country: string;
}

export default function Map({ lat, lon, city, country }: MapProps) {
  const [mounted, setMounted] = useState(false);

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

  // Google Maps: familiar road map with search coordinates
  const googleMapsUrl = `https://maps.google.com/maps?q=${lat},${lon}&t=&z=14&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className="w-full h-full min-h-[380px] md:min-h-[420px] flex flex-col gap-3">
      
      {/* Map Header Info Bar */}
      <div className="flex items-center justify-between bg-slate-100/80 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/80 rounded-xl px-3 py-2 shadow-sm shrink-0">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
          <MapPin className="w-3.5 h-3.5 text-brand-orange animate-pulse" />
          <span>Interactive Node Map</span>
        </div>
        
        {/* GPS Indicator */}
        <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
          {city && `${city}, `}{country} ({lat.toFixed(3)}, {lon.toFixed(3)})
        </div>
      </div>

      {/* Interactive Map Iframe Container */}
      <div className="flex-1 w-full h-full relative rounded-2xl overflow-hidden border border-slate-200/60 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#0b0f19]/60 shadow-md">
        <iframe
          title="Google Maps View"
          src={googleMapsUrl}
          className="w-full h-full absolute inset-0 border-0"
          allowFullScreen={false}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
}
