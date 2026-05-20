'use client';

import { useEffect, useState } from 'react';
import { UAParser } from 'ua-parser-js';
import { Laptop, Monitor, Terminal, Eye, EyeOff } from 'lucide-react';

interface DeviceCardProps {
  userAgent: string;
}

export default function DeviceCard({ userAgent }: DeviceCardProps) {
  const [resolution, setResolution] = useState<string>('--');
  const [showRawUa, setShowRawUa] = useState<boolean>(false);

  // Parse User Agent details on the client side
  const parser = new UAParser(userAgent);
  const os = parser.getOS();
  const browser = parser.getBrowser();
  const device = parser.getDevice();

  useEffect(() => {
    // Resolve screen resolution on mount (client-side only)
    if (typeof window !== 'undefined') {
      setResolution(`${window.screen.width} × ${window.screen.height} px`);
    }
  }, []);

  const osName = os.name || 'Unknown OS';
  const osVersion = os.version ? ` ${os.version}` : '';
  const browserName = browser.name || 'Unknown Browser';
  const browserVersion = browser.version ? ` ${browser.version.split('.')[0]}` : ''; // Major version only for clean look

  // Format device type
  let deviceType = 'Desktop';
  if (device.type === 'mobile') deviceType = 'Smartphone';
  else if (device.type === 'tablet') deviceType = 'Tablet';
  else if (device.type === 'smarttv') deviceType = 'Smart TV';

  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col justify-between h-full relative overflow-hidden">
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
            <Laptop className="w-3.5 h-3.5 text-brand-orange" />
            Device & Browser Info
          </span>
          <div className="text-[10px] font-semibold text-text-muted bg-border-muted/20 px-2 py-0.5 rounded-md">
            Client-Side Analyzed
          </div>
        </div>

        {/* Big Header */}
        <div className="mt-1 mb-5">
          <div className="text-xs text-text-muted font-medium mb-1">Operating System</div>
          <div className="font-extrabold text-lg sm:text-xl md:text-2xl tracking-tight text-foreground truncate">
            {osName}{osVersion}
          </div>
          <div className="text-sm font-semibold text-text-muted mt-0.5">
            Running on a {deviceType}
          </div>
        </div>
      </div>

      {/* Grid of details */}
      <div className="space-y-4 pt-4 border-t border-border-muted">
        {/* Browser */}
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-text-muted font-medium flex items-center gap-1">
            <Monitor className="w-3.5 h-3.5" /> Web Browser
          </span>
          <span className="text-sm font-semibold text-foreground">
            {browserName} <span className="text-xs text-text-muted font-normal">v{browserVersion || 'Unknown'}</span>
          </span>
        </div>

        {/* Screen Resolution */}
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-text-muted font-medium flex items-center gap-1">
            <Monitor className="w-3.5 h-3.5" /> Screen Resolution
          </span>
          <span className="text-sm font-semibold text-foreground font-mono">
            {resolution}
          </span>
        </div>

        {/* Raw User Agent Container */}
        <div className="flex flex-col gap-1.5 pt-1">
          <button
            onClick={() => setShowRawUa(!showRawUa)}
            className="flex items-center gap-1.5 text-xs font-semibold text-brand-orange hover:text-brand-orange-hover transition-colors duration-150 cursor-pointer w-fit focus:outline-none"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Raw User-Agent</span>
            {showRawUa ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          </button>

          {/* Collapsible raw string */}
          <div
            className={`transition-all duration-300 overflow-hidden ${
              showRawUa ? 'max-h-40 opacity-100 mt-1' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="p-3 bg-border-muted/20 dark:bg-border-muted/10 border border-card-border rounded-lg text-[10px] font-mono leading-relaxed text-text-muted break-all whitespace-pre-wrap select-all max-h-32 overflow-y-auto">
              {userAgent || 'Unknown User-Agent'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
