'use client';

import { useState } from 'react';
import { Copy, Check, Server, Shield, Radio, Globe } from 'lucide-react';

interface ConnectionCardProps {
  ip: string;
  hostname?: string;
  isp: string;
  asn: string;
  connectionType: string;
}

export default function ConnectionCard({
  ip,
  hostname,
  isp,
  asn,
  connectionType,
}: ConnectionCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(ip);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col justify-between h-full relative overflow-hidden">
      {/* Top Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-brand-orange" />
            Connection Info
          </span>
          <div className="flex items-center gap-1 bg-green-500/10 text-green-500 text-[10px] font-semibold px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Active
          </div>
        </div>

        {/* Large IP Block */}
        <div className="group relative mt-1 mb-6">
          <div className="text-xs text-text-muted font-medium mb-1">Your IP Address</div>
          <div className="flex items-center justify-between gap-4">
            <span className="font-mono text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-foreground break-all select-all">
              {ip}
            </span>
            <button
              onClick={handleCopy}
              className={`p-2 rounded-lg border cursor-pointer transition-all duration-200 focus:outline-none flex items-center justify-center shrink-0 ${
                copied
                  ? 'bg-green-500/10 border-green-500/30 text-green-500 scale-105'
                  : 'bg-border-muted/10 border-card-border text-text-muted hover:text-foreground hover:bg-border-muted/40 hover:border-brand-orange/30'
              }`}
              title="Copy IP Address"
              aria-label="Copy IP Address"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          {/* Absolute Copied Tag */}
          <div
            className={`absolute -bottom-5 right-0 text-[10px] font-semibold text-green-500 transition-all duration-300 transform ${
              copied ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
            }`}
          >
            Copied to clipboard!
          </div>
        </div>
      </div>

      {/* Grid of Network Details */}
      <div className="space-y-4 pt-4 border-t border-border-muted">
        {/* Hostname */}
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-text-muted font-medium flex items-center gap-1">
            <Server className="w-3.5 h-3.5" /> Hostname (rDNS)
          </span>
          <span className="text-sm font-semibold text-foreground truncate font-mono" title={hostname}>
            {hostname || 'No rDNS record found'}
          </span>
        </div>

        {/* ISP */}
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-text-muted font-medium flex items-center gap-1">
            <Shield className="w-3.5 h-3.5" /> ISP & ASN
          </span>
          <span className="text-sm font-semibold text-foreground truncate" title={`${isp} (${asn})`}>
            {isp} <span className="font-mono text-xs text-text-muted font-normal">({asn})</span>
          </span>
        </div>

        {/* Connection Type */}
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-text-muted font-medium flex items-center gap-1">
            <Radio className="w-3.5 h-3.5" /> Connection Type
          </span>
          <span className="text-sm font-semibold text-foreground">
            {connectionType}
          </span>
        </div>
      </div>
    </div>
  );
}
