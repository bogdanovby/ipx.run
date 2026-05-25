'use client';

import { useEffect, useState } from 'react';

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
        <span className="text-text-muted text-sm font-medium">Loading Telemetry Map...</span>
      </div>
    );
  }

  // Calculate percentage coordinates for equirectangular projection
  // x: -180 to +180 maps to 0% to 100%
  // y: +90 to -90 maps to 0% to 100%
  const x = ((lon + 180) / 360) * 100;
  const y = ((90 - lat) / 180) * 100;

  return (
    <div className="w-full h-full min-h-[350px] md:min-h-[400px] relative rounded-xl overflow-hidden border border-card-border bg-slate-50/50 dark:bg-[#0b0f19]/60 backdrop-blur-md shadow-inner group select-none">
      
      {/* Background Cyber-Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.05)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(243,128,32,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(243,128,32,0.03)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      
      {/* Map Content Frame */}
      <div className="absolute inset-0 p-4 flex flex-col justify-between">
        
        {/* Top Header - Telemetry Display */}
        <div className="flex justify-between items-start z-20 pointer-events-none">
          <div className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/80 rounded-lg p-2.5 shadow-lg flex flex-col gap-0.5 max-w-[240px]">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-500 dark:text-emerald-400 font-mono">
                Telemetry Engaged
              </span>
            </div>
            <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate mt-1">
              {city || 'Unknown Location'}
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
              {country || 'Unknown Country'}
            </p>
          </div>

          {/* Coordinate Telemetry Card */}
          <div className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/80 rounded-lg p-2.5 shadow-lg font-mono text-[9px] text-slate-500 dark:text-slate-400 flex flex-col gap-0.5 text-right">
            <div>LAT: <span className="text-slate-900 dark:text-white font-semibold">{lat.toFixed(4)}°</span></div>
            <div>LON: <span className="text-slate-900 dark:text-white font-semibold">{lon.toFixed(4)}°</span></div>
            <div className="text-[8px] text-brand-orange uppercase tracking-wider font-bold mt-0.5">Geo Projected</div>
          </div>
        </div>

        {/* Vector SVG World Map Outline Container */}
        <div className="absolute inset-4 top-16 bottom-4 flex items-center justify-center">
          <div className="w-full h-full relative">
            <svg
              viewBox="0 0 360 180"
              className="w-full h-full text-slate-300 dark:text-slate-800/70 transition-colors duration-500"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Latitude and Longitude Grid Lines */}
              <g className="stroke-slate-200/40 dark:stroke-slate-800/30 stroke-[0.3]" strokeDasharray="2 2">
                {/* Latitudes */}
                <line x1="0" y1="30" x2="360" y2="30" />
                <line x1="0" y1="60" x2="360" y2="60" />
                <line x1="0" y1="90" x2="360" y2="90" /> {/* Equator */}
                <line x1="0" y1="120" x2="360" y2="120" />
                <line x1="0" y1="150" x2="360" y2="150" />
                
                {/* Longitudes */}
                <line x1="60" y1="0" x2="60" y2="180" />
                <line x1="120" y1="0" x2="120" y2="180" />
                <line x1="180" y1="0" x2="180" y2="180" /> {/* Prime Meridian */}
                <line x1="240" y1="0" x2="240" y2="180" />
                <line x1="300" y1="0" x2="300" y2="180" />
              </g>

              {/* World Continents Simplified High-Fidelity Paths */}
              <g fill="currentColor" className="transition-all duration-500">
                {/* North America */}
                <path d="M45,20 L55,18 L65,15 L75,20 L80,28 L72,32 L60,35 L48,30 L40,25 Z M42,32 L48,32 L50,38 L44,45 L38,40 Z M28,25 L38,25 L35,32 L28,30 Z M52,42 L65,45 L62,55 L58,52 L54,58 L48,50 Z" />
                {/* Greenland */}
                <path d="M100,10 L115,12 L120,20 L112,28 L98,22 Z" />
                {/* South America */}
                <path d="M60,82 L72,78 L85,84 L90,92 L82,108 L76,125 L72,138 L68,142 L66,135 L68,120 L62,105 L58,95 Z" />
                {/* Africa */}
                <path d="M155,75 L165,70 L178,72 L192,78 L200,88 L195,95 L188,92 L185,102 L178,118 L172,130 L168,132 L166,124 L168,110 L160,98 L152,90 L148,82 Z L195,102 L200,108 L198,114 L193,108 Z" />
                {/* Eurasia (Europe + Asia) */}
                <path d="M148,38 L160,30 L175,25 L190,22 L215,20 L240,18 L265,22 L285,25 L300,32 L310,40 L305,48 L295,45 L280,55 L268,62 L255,60 L248,72 L238,68 L232,78 L224,70 L212,74 L200,65 L185,68 L170,62 L158,65 L150,58 L142,50 L145,44 Z M260,65 L272,62 L278,72 L272,78 L262,74 Z M285,60 L295,58 L292,68 L285,65 Z" />
                {/* Australia */}
                <path d="M295,115 L310,110 L320,118 L318,128 L308,132 L296,128 L292,122 Z M315,134 L318,134 L316,138 Z" />
                {/* Antarctica */}
                <path d="M40,170 L80,172 L120,170 L160,171 L200,170 L240,172 L280,170 L320,171 L340,173 L320,175 L280,176 L240,175 L200,176 L160,175 L120,176 L80,175 L20,173 Z" />
                {/* Island Groups (Japan, UK, Iceland, NZ, Madagascar, etc.) */}
                <path d="M135,32 L138,32 L136,36 Z M302,48 L305,52 L301,55 Z M198,118 L202,118 L199,126 Z M322,138 L325,142 L321,146 Z" />
              </g>
            </svg>

            {/* Pulsing Sonar Locator Pin */}
            <div
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              className="absolute z-10 pointer-events-none transition-all duration-1000 ease-out"
            >
              <div className="relative flex items-center justify-center">
                
                {/* Dynamic Sonar Rings (Cascading Delay) */}
                <span className="absolute w-12 h-12 rounded-full border-2 border-brand-orange bg-brand-orange/10 animate-ping opacity-75" style={{ animationDuration: '3s' }} />
                <span className="absolute w-8 h-8 rounded-full border border-brand-orange bg-brand-orange/5 animate-ping opacity-90" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
                <span className="absolute w-4 h-4 rounded-full border border-white dark:border-slate-900 bg-brand-orange shadow-lg shadow-brand-orange/50" />
                
                {/* Core Focus Center */}
                <span className="absolute w-1.5 h-1.5 rounded-full bg-white" />
                
                {/* Horizontal Telemetry Grid Coordinates Link */}
                <div className="absolute w-24 h-[1px] bg-gradient-to-r from-brand-orange/50 to-transparent left-4 pointer-events-none hidden md:block" />
                <div className="absolute w-24 h-[1px] bg-gradient-to-l from-brand-orange/50 to-transparent right-4 pointer-events-none hidden md:block" />
                <div className="absolute w-[1px] h-24 bg-gradient-to-b from-brand-orange/50 to-transparent top-4 pointer-events-none hidden md:block" />
                <div className="absolute w-[1px] h-24 bg-gradient-to-t from-brand-orange/50 to-transparent bottom-4 pointer-events-none hidden md:block" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Coordinate Status */}
        <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 dark:text-slate-500 z-10 pointer-events-none mt-auto">
          <span>WEB VECTOR SYSTEM v2.0</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-orange animate-pulse" />
            LIVE SIGNAL TRACE
          </span>
        </div>
        
      </div>
    </div>
  );
}
