'use client';

import { useState } from 'react';
import { ShieldCheck, Calendar, Globe, Server, Terminal, Copy, Check, Info, FileCode } from 'lucide-react';
import { WhoisData } from '@/services/whoisService';

interface WhoisCardProps {
  whois?: WhoisData | null;
  queriedDomain?: string;
  targetIp?: string;
}

export default function WhoisCard({ whois, queriedDomain, targetIp }: WhoisCardProps) {
  const [showRaw, setShowRaw] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyRaw = async () => {
    if (!whois?.raw) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(whois.raw, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy raw JSON: ', err);
    }
  };

  if (!whois || !whois.parsed) {
    return (
      <div className="glass-card rounded-2xl p-8 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
        <div className="w-12 h-12 rounded-full bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center mb-4">
          <ShieldCheck className="w-5 h-5 text-brand-orange" />
        </div>
        <h3 className="font-bold text-lg text-foreground mb-1">No WHOIS Registry Data</h3>
        <p className="text-sm text-text-muted max-w-sm">
          No registry information could be retrieved for this query.
        </p>
      </div>
    );
  }

  const { parsed, raw } = whois;

  // Format Date safely
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Remaining days for domains
  const getExpiryDays = (expiryStr?: string) => {
    if (!expiryStr) return null;
    try {
      const expiry = new Date(expiryStr);
      const diffTime = expiry.getTime() - Date.now();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch {
      return null;
    }
  };

  const diffDays = getExpiryDays(parsed.expirationDate);
  const expiryBadge = diffDays !== null
    ? diffDays > 0
      ? { text: `${diffDays} days left`, className: 'bg-green-500/10 text-green-500 border-green-500/10' }
      : { text: `Expired ${Math.abs(diffDays)} days ago`, className: 'bg-red-500/10 text-red-500 border-red-500/10' }
    : null;

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-orange" />
            Registry WHOIS Lookup
          </span>
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5 mt-1 font-mono">
            {parsed.name}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {parsed.rir && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-blue-500/20 bg-blue-500/5 text-blue-500 font-mono">
              RIR: {parsed.rir}
            </span>
          )}
          {parsed.countryCode && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-border-muted bg-border-muted/10 text-text-muted font-mono">
              {parsed.countryCode}
            </span>
          )}
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* Registry & Entity Meta */}
        <div className="bg-border-muted/10 border border-card-border/45 rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-2 border-b border-card-border/30">
            <Globe className="w-4.5 h-4.5 text-brand-orange" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Registration Metadata</h3>
          </div>

          <div className="space-y-3 text-xs">
            {parsed.networkRange && (
              <div className="flex flex-col gap-0.5">
                <span className="text-text-muted font-medium">IP Network Range</span>
                <span className="font-mono font-semibold text-foreground select-all">{parsed.networkRange}</span>
              </div>
            )}

            {parsed.networkName && (
              <div className="flex flex-col gap-0.5">
                <span className="text-text-muted font-medium">Network Identifier Name</span>
                <span className="font-semibold text-foreground font-mono">{parsed.networkName}</span>
              </div>
            )}

            <div className="flex flex-col gap-0.5">
              <span className="text-text-muted font-medium">Registrar / Authority</span>
              <span className="font-semibold text-foreground truncate" title={parsed.registrar}>
                {parsed.registrar || 'N/A'}
              </span>
            </div>

            {parsed.registrantOrg && (
              <div className="flex flex-col gap-0.5">
                <span className="text-text-muted font-medium">Registrant Organization</span>
                <span className="font-semibold text-foreground truncate" title={parsed.registrantOrg}>
                  {parsed.registrantOrg}
                </span>
              </div>
            )}

            {parsed.registrant && !parsed.registrantOrg && (
              <div className="flex flex-col gap-0.5">
                <span className="text-text-muted font-medium">Registrant Name</span>
                <span className="font-semibold text-foreground truncate" title={parsed.registrant}>
                  {parsed.registrant}
                </span>
              </div>
            )}

            {parsed.status && parsed.status.length > 0 && (
              <div className="flex flex-col gap-1.5 pt-1">
                <span className="text-text-muted font-medium">Registry Status Flags</span>
                <div className="flex flex-wrap gap-1">
                  {parsed.status.slice(0, 3).map((st, idx) => (
                    <span 
                      key={idx} 
                      className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-background/50 border border-card-border/40 text-text-muted"
                      title={st}
                    >
                      {st}
                    </span>
                  ))}
                  {parsed.status.length > 3 && (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-background/50 border border-card-border/40 text-text-muted">
                      +{parsed.status.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Timeline & Name Servers */}
        <div className="flex flex-col gap-5">
          {/* Important Dates */}
          <div className="bg-border-muted/10 border border-card-border/45 rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-2 border-b border-card-border/30">
              <Calendar className="w-4.5 h-4.5 text-blue-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Timeline</h3>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="flex flex-col gap-0.5">
                <span className="text-text-muted font-medium">Registration Date</span>
                <span className="font-semibold text-foreground">{formatDate(parsed.createdDate)}</span>
              </div>

              {parsed.expirationDate && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-text-muted font-medium">Expiration Date</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-foreground">{formatDate(parsed.expirationDate)}</span>
                    {expiryBadge && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${expiryBadge.className}`}>
                        {expiryBadge.text}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {parsed.updatedDate && (
                <div className="flex flex-col gap-0.5 col-span-2 border-t border-card-border/10 pt-2 mt-1">
                  <span className="text-text-muted font-medium">Last Registry Modification</span>
                  <span className="font-semibold text-foreground">{formatDate(parsed.updatedDate)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Name Servers List (if available) */}
          {parsed.nameServers && parsed.nameServers.length > 0 && (
            <div className="bg-border-muted/10 border border-card-border/45 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-purple-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">Name Servers</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {parsed.nameServers.map((ns, idx) => (
                  <span 
                    key={idx} 
                    className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-background/50 border border-card-border/35 text-foreground hover:border-brand-orange/30 transition-all duration-150"
                  >
                    {ns.toLowerCase()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Expandable Raw Console Terminal */}
      <div className="border border-card-border/45 rounded-2xl overflow-hidden glass-card">
        {/* Toggle Bar */}
        <div 
          onClick={() => setShowRaw(!showRaw)}
          className="flex items-center justify-between px-5 py-3.5 bg-border-muted/10 hover:bg-border-muted/20 cursor-pointer select-none transition-colors duration-200"
        >
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
            <Terminal className="w-4 h-4 text-brand-orange" />
            Developer Inspection Console (Raw RDAP Registry response)
          </div>
          <div className="flex items-center gap-3">
            {showRaw && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyRaw();
                }}
                className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-md border cursor-pointer transition-all duration-150 ${
                  copied 
                    ? 'bg-green-500/10 border-green-500/30 text-green-500' 
                    : 'bg-background/40 hover:bg-background border-card-border text-text-muted hover:text-foreground'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied JSON!' : 'Copy Code'}
              </button>
            )}
            <span className="text-xs text-text-muted font-bold font-mono">
              {showRaw ? 'Collapse [-]' : 'Expand [+]'}
            </span>
          </div>
        </div>

        {/* Scrollable Terminal Screen */}
        {showRaw && (
          <div className="p-4 bg-[#0a0c10] border-t border-card-border/40 max-h-[350px] overflow-y-auto font-mono text-[11px] leading-relaxed text-slate-300 relative select-all select-all">
            <pre className="whitespace-pre-wrap word-break-all select-all">
              {JSON.stringify(raw, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
