'use client';

import { useEffect, useState } from 'react';
import { MapPin, Compass, Clock, Map } from 'lucide-react';
import { getLocalTime } from '@/services/ipService';

interface LocationCardProps {
  country: string;
  countryCode: string;
  region: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  timezone: string;
}

/**
 * Converts a 2-letter ISO country code to its corresponding flag emoji.
 */
export function getCountryFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌐';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  try {
    return String.fromCodePoint(...codePoints);
  } catch (e) {
    return '🌐';
  }
}

export default function LocationCard({
  country,
  countryCode,
  region,
  city,
  zip,
  lat,
  lon,
  timezone,
}: LocationCardProps) {
  const [localClock, setLocalClock] = useState<string>('');

  useEffect(() => {
    // Initial clock render
    setLocalClock(getLocalTime(timezone));

    // Update the clock every second to keep it ticking in real-time
    const interval = setInterval(() => {
      setLocalClock(getLocalTime(timezone));
    }, 1000);

    return () => clearInterval(interval);
  }, [timezone]);

  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col justify-between h-full relative overflow-hidden">
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-brand-orange" />
            Location & Geography
          </span>
          <span className="text-xl shrink-0" title={`${countryCode} Flag`}>
            {getCountryFlagEmoji(countryCode)}
          </span>
        </div>

        {/* Big Location Banner */}
        <div className="mt-1 mb-5">
          <div className="text-xs text-text-muted font-medium mb-1">Your Location</div>
          <div className="font-extrabold text-lg sm:text-xl md:text-2xl tracking-tight text-foreground truncate">
            {city}, {region}
          </div>
          <div className="text-sm font-semibold text-text-muted mt-0.5">
            {country} <span className="font-mono text-xs text-text-muted/65 font-normal">({countryCode})</span>
          </div>
        </div>
      </div>

      {/* Grid of Geolocation details */}
      <div className="space-y-4 pt-4 border-t border-border-muted">
        {/* Postal Code */}
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-text-muted font-medium flex items-center gap-1">
            <Map className="w-3.5 h-3.5" /> Postal Code
          </span>
          <span className="text-sm font-semibold text-foreground font-mono">
            {zip || 'N/A'}
          </span>
        </div>

        {/* Coordinates */}
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-text-muted font-medium flex items-center gap-1">
            <Compass className="w-3.5 h-3.5" /> Coordinates
          </span>
          <span className="text-sm font-semibold text-foreground font-mono">
            {lat.toFixed(4)}°, {lon.toFixed(4)}°
          </span>
        </div>

        {/* Local Time & Timezone */}
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-text-muted font-medium flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Local Time & Timezone
          </span>
          <span className="text-sm font-semibold text-foreground flex items-baseline gap-2">
            <span className="font-mono tabular-nums text-foreground">{localClock || '--:--:--'}</span>
            <span className="text-xs text-text-muted font-normal font-sans truncate max-w-[120px] sm:max-w-[150px]" title={timezone}>
              ({timezone})
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
