'use client';

import { useEffect, useState } from 'react';

interface MapProps {
  lat: number;
  lon: number;
  city: string;
  country: string;
}

interface LogLine {
  timestamp: string;
  text: string;
  type: 'info' | 'success' | 'warning' | 'geo';
}

export default function Map({ lat, lon, city, country }: MapProps) {
  const [mounted, setMounted] = useState(false);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [pingSpeed, setPingSpeed] = useState<number>(34);

  useEffect(() => {
    setMounted(true);
    
    // Generate initial logs
    const now = new Date();
    const formatTime = (d: Date) => d.toTimeString().split(' ')[0];
    
    const initialLogs: LogLine[] = [
      { timestamp: formatTime(new Date(now.getTime() - 2500)), text: 'System tracking engine online.', type: 'info' },
      { timestamp: formatTime(new Date(now.getTime() - 2000)), text: `Geo-locating target: ${city || 'Remote IP'}, ${country || 'Unknown'}`, type: 'geo' },
      { timestamp: formatTime(new Date(now.getTime() - 1500)), text: `Mapped coordinates: [${lat.toFixed(4)}, ${lon.toFixed(4)}]`, type: 'info' },
      { timestamp: formatTime(new Date(now.getTime() - 1000)), text: 'Calculating equirectangular grid projection...', type: 'info' },
      { timestamp: formatTime(now), text: 'Signal trace locked. Continuous ping telemetry engaged.', type: 'success' },
    ];
    setLogs(initialLogs);

    // Simulate real-time continuous telemetry logging
    const interval = setInterval(() => {
      const timeStr = new Date().toTimeString().split(' ')[0];
      const mockHops = ['103.22.200.11', '1.1.1.1', '10.0.0.1', '172.16.4.25'];
      const randomHop = mockHops[Math.floor(Math.random() * mockHops.length)];
      const latency = Math.floor(Math.random() * 40) + 15;
      setPingSpeed(latency);

      const logTypes: Array<() => LogLine> = [
        () => ({ timestamp: timeStr, text: `Trace packet routed through ${randomHop} | RTT ${latency}ms`, type: 'info' }),
        () => ({ timestamp: timeStr, text: `Coordinates verification: lock is stable at [${lat.toFixed(2)}°, ${lon.toFixed(2)}°]`, type: 'geo' }),
        () => ({ timestamp: timeStr, text: `Signal trace active: packet loss 0.00%`, type: 'success' }),
      ];

      const selectLog = logTypes[Math.floor(Math.random() * logTypes.length)]();
      setLogs(prev => [...prev.slice(-4), selectLog]); // Keep last 5 lines
    }, 4000);

    return () => clearInterval(interval);
  }, [lat, lon, city, country]);

  if (!mounted) {
    return (
      <div className="w-full h-full min-h-[350px] md:min-h-[400px] rounded-xl bg-border-muted/30 animate-pulse flex items-center justify-center border border-card-border">
        <span className="text-text-muted text-sm font-medium">Initializing Tracker...</span>
      </div>
    );
  }

  // Calculate percentage coordinates for equirectangular projection
  // x: -180 to +180 maps to 0% to 100%
  // y: +90 to -90 maps to 0% to 100%
  const x = ((lon + 180) / 360) * 100;
  const y = ((90 - lat) / 180) * 100;

  return (
    <div className="w-full h-full flex flex-col justify-between select-none">
      
      {/* Upper Area: Highly-styled map inside a crisp 2:1 container */}
      <div className="w-full aspect-[2/1] relative rounded-xl overflow-hidden border border-slate-200/60 dark:border-slate-800/80 bg-slate-100/40 dark:bg-slate-950/80 shadow-inner group">
        
        {/* Radar concentric circular scan animation in the background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(243,128,32,0.015)_0%,transparent_70%)] pointer-events-none" />
        
        {/* Subtle grid system */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.04)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(243,128,32,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(243,128,32,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

        {/* Live Status Overlay Badges */}
        <div className="absolute top-2.5 left-2.5 z-20 flex gap-2 pointer-events-none">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/80 px-2 py-1 rounded-md shadow-sm flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <span className="text-[8px] uppercase tracking-wider font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              Signal Lock
            </span>
          </div>
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/80 px-2 py-1 rounded-md shadow-sm text-[8px] font-mono text-slate-500 dark:text-slate-400">
            PING: <span className="text-brand-orange font-bold">{pingSpeed}ms</span>
          </div>
        </div>

        {/* GPS Coordinates Ribbon */}
        <div className="absolute top-2.5 right-2.5 z-20 pointer-events-none bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/80 px-2 py-1 rounded-md shadow-sm font-mono text-[8px] text-slate-600 dark:text-slate-300">
          {lat.toFixed(2)}°, {lon.toFixed(2)}°
        </div>

        {/* Vector SVG World Map with Smooth Bezier Coordinates */}
        <div className="absolute inset-2 flex items-center justify-center">
          <svg
            viewBox="0 0 360 180"
            className="w-full h-full text-slate-300 dark:text-slate-800 transition-colors duration-500"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Latitude and Longitude Grid Lines */}
            <g className="stroke-slate-200/40 dark:stroke-slate-800/20 stroke-[0.3]" strokeDasharray="3 3">
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

            {/* High-Fidelity, Smooth Curved Continents Vector Paths */}
            <g fill="currentColor" className="transition-colors duration-500">
              {/* North America & Canada */}
              <path d="M 22.5 15 C 33.5 15.5 39 12 45 13 C 48 13.5 49 11.5 54 11 C 59.5 10.5 59.5 13 65 14 C 70.5 15 72.5 11.5 78 12.5 C 80.5 13 83.5 16 82.5 18 C 81.5 20 74 20.5 73.5 22.5 C 73 24.5 77 24.5 74.5 28.5 C 72 32.5 61.5 30 58.5 34 C 55.5 38 52 38.5 50.5 36 C 49 33.5 46.5 33.5 42.5 31.5 C 38.5 29.5 32 32.5 30 30 C 28 27.5 20.5 29.5 19.5 26.5 C 18.5 23.5 11.5 25.5 11.5 22 C 11.5 18.5 11.5 14.5 22.5 15 Z M 48.5 37 C 50.5 38.5 50.5 41 48.5 43.5 C 46.5 46 41 46.5 39 44 C 37 41.5 41.5 39.5 43.5 39.5 C 45.5 39.5 46.5 35.5 48.5 37 Z" />
              
              {/* Greenland */}
              <path d="M 98 10 C 104 9 108.5 7.5 114 8.5 C 119.5 9.5 120.5 14.5 121.5 16.5 C 122.5 18.5 115 25 111 24.5 C 107 24 100 23.5 97.5 20.5 C 95 17.5 92 11 98 10 Z" />
              
              {/* Central America & Caribbean Bridge */}
              <path d="M 45 44 C 47.5 45 49 47 48.5 49.5 C 48 52 50.5 54.5 54 57 C 57.5 59.5 61.5 60.5 63 64.5 C 64.5 68.5 61.5 70.5 58 69.5 C 54.5 68.5 53 66.5 52 64 C 51 61.5 48.5 60.5 44.5 59.5 C 40.5 58.5 41 55 42 53.5 C 43 52 42.5 44.5 45 44 Z" strokeWidth="0.5" />
              
              {/* South America */}
              <path d="M 60 72 C 63.5 71 67.5 71.5 72 73 C 76.5 74.5 81.5 77 84 81.5 C 86.5 86 89.5 91 87.5 96 C 85.5 101 82 108.5 79 114 C 76 119.5 75.5 127 72 133 C 68.5 139 65.5 143.5 64 141 C 62.5 138.5 64 130 63 123.5 C 62 117 58 109.5 56 103 C 54 96.5 55 90.5 54 86 C 53 81.5 56.5 73 60 72 Z" />
              
              {/* Africa */}
              <path d="M 152 70 C 158.5 66.5 167 66 174 69.5 C 181 73 189 74.5 194.5 81 C 200 87.5 198.5 93 192.5 96.5 C 186.5 100 185 106.5 181 113 C 177 119.5 174.5 126 171.5 129 C 168.5 132 165.5 131 164 125 C 162.5 119 164.5 112 162.5 106 C 160.5 100 156.5 96 153.5 91.5 C 150.5 87 146.5 83 145 78 C 143.5 73 145.5 73.5 152 70 Z M 194 105 C 196.5 105.5 198 109 196.5 112.5 C 195 116 191.5 114.5 191.5 111 C 191.5 107.5 191.5 104.5 194 105 Z" />
              
              {/* Europe & Asia (Eurasia) */}
              <path d="M 141.5 45 C 144.5 40 148.5 35 156 31 C 163.5 27 169.5 25.5 178 24.5 C 186.5 23.5 204.5 21.5 215 21.5 C 225.5 21.5 237 20 249.5 20 C 262 20 274.5 22.5 285 24 C 295.5 25.5 301 29 304.5 33.5 C 308 38 304 43 301.5 45 C 299 47 292.5 45.5 288.5 48 C 284.5 50.5 282.5 56 276.5 59.5 C 270.5 63 260 62.5 253 66 C 246 69.5 242 74 236 71 C 230 68 230.5 73.5 224 74 C 217.5 74.5 214.5 70.5 209.5 71.5 C 204.5 72.5 200.5 64.5 194.5 63 C 188.5 61.5 181.5 64.5 174.5 61.5 C 167.5 58.5 161.5 60.5 155.5 57 C 149.5 53.5 142.5 53.5 140 50 C 137.5 46.5 138.5 50 141.5 45 Z" />
              
              {/* Japan & Eastern Islands */}
              <path d="M 304 48 C 305.5 48.5 306 51 304.5 53 C 303 55 301 55.5 299.5 53.5 C 298 51.5 302.5 47.5 304 48 Z M 292.5 63 C 294 63.5 294.5 66.5 293 68 C 291.5 69.5 289 68 289 65.5 C 289 63 291 62.5 292.5 63 Z" />
              
              {/* India & Southeast Asia Peninsula */}
              <path d="M 218 64 C 220 64.5 222 67.5 222 71 C 222 74.5 219.5 77 217 74.5 C 214.5 72 216 63.5 218 64 Z M 241 71 C 243.5 71.5 246.5 74.5 246 78 C 245.5 81.5 241 83 239 80 C 237 77 238.5 70.5 241 71 Z" />
              
              {/* Australia */}
              <path d="M 288.5 113 C 294 110.5 303.5 109 308.5 111.5 C 313.5 114 318.5 118 317.5 123.5 C 316.5 129 313 131.5 307.5 131.5 C 302 131.5 295.5 129 291.5 124.5 C 287.5 120 283 115.5 288.5 113 Z M 310.5 135 C 311.5 135.5 312 137.5 311 139 C 310 140.5 308 139.5 308 137.5 C 308 135.5 309.5 134.5 310.5 135 Z" />
              
              {/* Antarctica */}
              <path d="M 15 168 C 55 170.5 95 169 135 169.5 C 175 170 215 168.5 255 170 C 295 171.5 315 169 335 171 C 345 172 345 174 330 174.5 C 315 175 275 174.5 235 175.5 C 195 176.5 155 175.5 115 176 C 75 176.5 35 174.5 15 172.5 C 5 171.5 5 167.5 15 168 Z" />
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
              
              {/* Triple Sonar Ping Animation */}
              <span className="absolute w-12 h-12 rounded-full border-2 border-brand-orange bg-brand-orange/5 animate-ping opacity-75" style={{ animationDuration: '2.5s' }} />
              <span className="absolute w-8 h-8 rounded-full border border-brand-orange bg-brand-orange/10 animate-ping opacity-90" style={{ animationDuration: '1.8s', animationDelay: '0.4s' }} />
              <span className="absolute w-4 h-4 rounded-full border border-white dark:border-slate-900 bg-brand-orange shadow-lg shadow-brand-orange/60" />
              
              {/* Central Solid Focal Core */}
              <span className="absolute w-1.5 h-1.5 rounded-full bg-white" />
              
              {/* Horizontal / Vertical telemetry helper alignment guides */}
              <div className="absolute w-16 h-[0.5px] bg-gradient-to-r from-brand-orange/40 to-transparent left-3 pointer-events-none hidden md:block" />
              <div className="absolute w-16 h-[0.5px] bg-gradient-to-l from-brand-orange/40 to-transparent right-3 pointer-events-none hidden md:block" />
              <div className="absolute w-[0.5px] h-16 bg-gradient-to-b from-brand-orange/40 to-transparent top-3 pointer-events-none hidden md:block" />
              <div className="absolute w-[0.5px] h-16 bg-gradient-to-t from-brand-orange/40 to-transparent bottom-3 pointer-events-none hidden md:block" />
            </div>
          </div>
        </div>

        {/* Footer map reference text */}
        <div className="absolute bottom-2 left-2.5 right-2.5 z-20 flex justify-between text-[7px] font-mono text-slate-400 dark:text-slate-500 pointer-events-none uppercase">
          <span>Vector Grid Projection v3.0</span>
          <span>Lock Stable</span>
        </div>
      </div>

      {/* Lower Area: Real-Time Signal Trace Terminal Logs Console */}
      <div className="w-full flex-1 flex flex-col justify-between mt-3.5 bg-slate-950 border border-slate-900 rounded-xl p-3.5 font-mono text-[10px] leading-relaxed text-slate-400 shadow-md">
        
        {/* Terminal Header */}
        <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-900">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-[9px] uppercase tracking-wider font-bold text-slate-200">SIGNAL CONSOLE LOG</span>
          </div>
          <span className="text-[8px] text-slate-500 uppercase tracking-widest">ACTIVE SESSION</span>
        </div>

        {/* Terminal Live Output Lines */}
        <div className="flex-1 flex flex-col gap-1.5 overflow-hidden">
          {logs.map((log, idx) => (
            <div key={idx} className="flex gap-2 items-start animate-fadeIn">
              <span className="text-slate-600 text-[9px] shrink-0">{log.timestamp}</span>
              <span className="text-slate-500 select-none">$&gt;</span>
              <span className={`flex-1 break-all ${
                log.type === 'success' ? 'text-emerald-400 font-bold' : 
                log.type === 'geo' ? 'text-brand-orange font-semibold' : 
                'text-slate-300'
              }`}>
                {log.text}
              </span>
            </div>
          ))}
        </div>
        
      </div>
    </div>
  );
}
