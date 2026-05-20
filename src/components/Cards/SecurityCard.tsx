'use client';

import { useEffect, useState } from 'react';
import { ShieldAlert, CheckCircle, AlertTriangle, HelpCircle, Activity } from 'lucide-react';
import { isPrivateIp } from '@/services/ipService';

interface SecurityCardProps {
  security: {
    isProxy: boolean;
    isVpn: boolean;
    isTor: boolean;
    isHosting: boolean;
    score: number;
  };
}

export default function SecurityCard({ security }: SecurityCardProps) {
  const [localIps, setLocalIps] = useState<string[]>([]);
  const [webRtcStatus, setWebRtcStatus] = useState<'checking' | 'secure' | 'leaked' | 'unsupported'>('checking');

  useEffect(() => {
    setWebRtcStatus('checking');
    setLocalIps([]);

    try {
      // Create temporary RTCPeerConnection to gather candidate addresses
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });

      // Create a mock channel to trigger gathering
      pc.createDataChannel('');
      
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .catch(() => setWebRtcStatus('unsupported'));

      const gatheredIps: string[] = [];

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const candidate = event.candidate.candidate;
          // Regex to isolate IPv4 or IPv6 addresses
          const ipRegex = /([0-9a-fA-F]{1,4}:[0-9a-fA-F:]+|[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})/g;
          const matched = candidate.match(ipRegex);

          if (matched) {
            matched.forEach((ip) => {
              // We only care if the exposed IP is a private LAN subnet, which indicates a leak
              if (isPrivateIp(ip) && ip !== '127.0.0.1' && ip !== '::1') {
                if (!gatheredIps.includes(ip)) {
                  gatheredIps.push(ip);
                }
              }
            });
          }
        } else {
          // Gathering is complete
          pc.close();
          if (gatheredIps.length > 0) {
            setLocalIps(gatheredIps);
            setWebRtcStatus('leaked');
          } else {
            setWebRtcStatus('secure');
          }
        }
      };

      // Guard timeout in case STUN is slow or blocked
      const timeout = setTimeout(() => {
        pc.close();
        if (gatheredIps.length === 0) {
          setWebRtcStatus('secure');
        }
      }, 3500);

      return () => {
        clearTimeout(timeout);
        pc.close();
      };
    } catch (err) {
      setWebRtcStatus('unsupported');
    }
  }, []);

  // Compute status colors
  const hasThreat = security.isProxy || security.isVpn || security.isTor || security.isHosting;
  const isTor = security.isTor;
  const isVpn = security.isVpn || (security.isProxy && !security.isHosting);
  const isProxy = security.isProxy;
  const isHosting = security.isHosting;

  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col justify-between h-full relative overflow-hidden">
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-brand-orange" />
            Security & Privacy
          </span>
          <div className="flex items-center gap-1">
            <span className="text-xs text-text-muted font-semibold mr-1">Risk Score:</span>
            <span
              className={`font-mono text-sm font-extrabold px-2 py-0.5 rounded ${
                security.score >= 70
                  ? 'bg-red-500/10 text-red-500'
                  : security.score >= 30
                  ? 'bg-amber-500/10 text-amber-500'
                  : 'bg-green-500/10 text-green-500'
              }`}
            >
              {security.score}/100
            </span>
          </div>
        </div>

        {/* Security Summary Banner */}
        <div className="mt-1 mb-5 flex items-center gap-3">
          {security.score >= 50 ? (
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-green-500/10 text-green-500 shrink-0">
              <CheckCircle className="w-6 h-6" />
            </div>
          )}
          <div>
            <div className="text-sm font-bold text-foreground">
              {security.score >= 70
                ? 'High Risk Connection'
                : security.score >= 30
                ? 'Anonymized Connection'
                : 'Clean Connection'}
            </div>
            <div className="text-xs text-text-muted mt-0.5 font-medium">
              {security.score >= 30
                ? 'Anonymizers or server subnets detected.'
                : 'Direct connection, no active anonymizers detected.'}
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Security Checkboxes */}
      <div className="space-y-4 pt-4 border-t border-border-muted">
        {/* Status Indicators Grid */}
        <div className="grid grid-cols-2 gap-3.5">
          {/* Proxy */}
          <div className="flex items-center gap-2 p-2.5 rounded-lg border border-card-border bg-border-muted/10">
            <span
              className={`w-2 h-2 rounded-full ${
                isProxy ? 'bg-amber-500 animate-pulse' : 'bg-green-500'
              }`}
            />
            <div className="flex flex-col">
              <span className="text-[10px] text-text-muted font-semibold uppercase leading-none">Proxy</span>
              <span className="text-xs font-bold mt-0.5">{isProxy ? 'Active' : 'No'}</span>
            </div>
          </div>

          {/* VPN */}
          <div className="flex items-center gap-2 p-2.5 rounded-lg border border-card-border bg-border-muted/10">
            <span
              className={`w-2 h-2 rounded-full ${
                isVpn ? 'bg-amber-500 animate-pulse' : 'bg-green-500'
              }`}
            />
            <div className="flex flex-col">
              <span className="text-[10px] text-text-muted font-semibold uppercase leading-none">VPN</span>
              <span className="text-xs font-bold mt-0.5">{isVpn ? 'Active' : 'No'}</span>
            </div>
          </div>

          {/* Tor */}
          <div className="flex items-center gap-2 p-2.5 rounded-lg border border-card-border bg-border-muted/10">
            <span
              className={`w-2 h-2 rounded-full ${
                isTor ? 'bg-red-500 animate-pulse' : 'bg-green-500'
              }`}
            />
            <div className="flex flex-col">
              <span className="text-[10px] text-text-muted font-semibold uppercase leading-none">Tor Exit</span>
              <span className="text-xs font-bold mt-0.5">{isTor ? 'Yes' : 'No'}</span>
            </div>
          </div>

          {/* Hosting */}
          <div className="flex items-center gap-2 p-2.5 rounded-lg border border-card-border bg-border-muted/10">
            <span
              className={`w-2 h-2 rounded-full ${
                isHosting ? 'bg-amber-500' : 'bg-green-500'
              }`}
            />
            <div className="flex flex-col">
              <span className="text-[10px] text-text-muted font-semibold uppercase leading-none">Hosting/Cloud</span>
              <span className="text-xs font-bold mt-0.5">{isHosting ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>

        {/* WebRTC Leak Test Block */}
        <div className="border-t border-border-muted/70 pt-3 flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs font-bold text-text-muted">
            <span className="flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-brand-orange" /> WebRTC Leak Test
            </span>
            <span className="text-[10px] text-text-muted/70 font-medium">Real-Time</span>
          </div>

          {/* WebRTC Leak Output Box */}
          <div className="mt-1">
            {webRtcStatus === 'checking' && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-border-muted/10 border border-dashed border-card-border">
                <svg className="animate-spin h-3.5 w-3.5 text-brand-orange shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-xs text-text-muted font-medium">Querying local network interfaces...</span>
              </div>
            )}

            {webRtcStatus === 'secure' && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <div className="flex flex-col leading-tight">
                  <span className="text-xs font-bold">Secure Connection</span>
                  <span className="text-[9px] opacity-80">No private local LAN IPs exposed.</span>
                </div>
              </div>
            )}

            {webRtcStatus === 'leaked' && (
              <div className="flex flex-col gap-1 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold leading-none">WebRTC IP Leak Detected</span>
                </div>
                <div className="mt-1 font-mono text-[10px] leading-tight select-all">
                  Leaked Private Subnet IP: 
                  <span className="block mt-0.5 bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-600 dark:text-amber-400 font-extrabold w-fit">
                    {localIps.join(', ')}
                  </span>
                </div>
              </div>
            )}

            {webRtcStatus === 'unsupported' && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-border-muted/20 border border-card-border text-text-muted">
                <HelpCircle className="w-4 h-4 shrink-0" />
                <span className="text-xs font-medium">Blocker or unsupported browser.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
