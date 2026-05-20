'use client';

import { useState } from 'react';
import { Copy, Check, Hash, Mail, FileText, Database, ShieldAlert, ArrowRight } from 'lucide-react';
import { DnsRecords } from '@/services/dnsService';

interface DnsCardProps {
  dnsRecords?: DnsRecords | null;
  queriedDomain?: string;
}

export default function DnsCard({ dnsRecords, queriedDomain }: DnsCardProps) {
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  const handleCopy = async (val: string) => {
    try {
      await navigator.clipboard.writeText(val);
      setCopiedValue(val);
      setTimeout(() => setCopiedValue(null), 1500);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const hasRecords = dnsRecords && Object.keys(dnsRecords).length > 0;

  if (!hasRecords) {
    return (
      <div className="glass-card rounded-2xl p-8 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
        <div className="w-12 h-12 rounded-full bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center mb-4">
          <Database className="w-5 h-5 text-brand-orange animate-pulse" />
        </div>
        <h3 className="font-bold text-lg text-foreground mb-1">No DNS Records</h3>
        <p className="text-sm text-text-muted max-w-sm">
          {queriedDomain 
            ? `We couldn't resolve any active DNS records for '${queriedDomain}'.`
            : "No DNS records are resolved for standard IP queries. Type a domain name in the search bar to query its DNS zone."}
        </p>
      </div>
    );
  }

  // Helper to render record lists
  const renderRecordList = (
    title: string, 
    records: any[] | undefined, 
    icon: React.ReactNode, 
    formatValue: (item: any) => { display: string; copy: string }
  ) => {
    if (!records || records.length === 0) return null;

    return (
      <div className="bg-border-muted/10 border border-card-border/45 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2 pb-2 border-b border-card-border/30">
          {icon}
          <span className="text-xs font-bold uppercase tracking-wider text-foreground">{title}</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-brand-orange/10 text-brand-orange ml-auto">
            {records.length} {records.length === 1 ? 'Record' : 'Records'}
          </span>
        </div>
        <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
          {records.map((item, idx) => {
            const { display, copy } = formatValue(item);
            const isCopied = copiedValue === copy;
            return (
              <div 
                key={idx} 
                className="group/item flex items-center justify-between gap-3 text-xs py-1.5 px-2 rounded-lg bg-background/30 hover:bg-background/80 hover:border hover:border-card-border/40 border border-transparent transition-all duration-150"
              >
                <span className="font-mono text-text-muted group-hover/item:text-foreground break-all whitespace-pre-wrap flex-1 select-all select-all">
                  {display}
                </span>
                <button
                  onClick={() => handleCopy(copy)}
                  className={`p-1 rounded-md shrink-0 cursor-pointer transition-all duration-150 ${
                    isCopied 
                      ? 'bg-green-500/10 text-green-500' 
                      : 'hover:bg-border-muted hover:text-foreground text-text-muted'
                  }`}
                  title="Copy Record"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Top Meta info */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-brand-orange" />
            DNS Records Zone
          </span>
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5 mt-1 font-mono">
            {queriedDomain}
          </h2>
        </div>
        <div className="text-[10px] text-text-muted bg-border-muted/25 px-2 py-1 rounded-md font-mono border border-card-border/20">
          Zone Queries: 6 record types
        </div>
      </div>

      {/* Grid containing individual lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* A (IPv4) Records */}
        {renderRecordList(
          'A Records (IPv4)', 
          dnsRecords?.A, 
          <Hash className="w-4 h-4 text-brand-orange" />, 
          (ip) => ({ display: ip, copy: ip })
        )}

        {/* AAAA (IPv6) Records */}
        {renderRecordList(
          'AAAA Records (IPv6)', 
          dnsRecords?.AAAA, 
          <Hash className="w-4 h-4 text-brand-orange/70" />, 
          (ip) => ({ display: ip, copy: ip })
        )}

        {/* CNAME Records */}
        {renderRecordList(
          'CNAME Records', 
          dnsRecords?.CNAME, 
          <ArrowRight className="w-4 h-4 text-blue-500" />, 
          (cname) => ({ display: cname, copy: cname })
        )}

        {/* MX (Mail Servers) Records */}
        {renderRecordList(
          'MX (Mail Servers)', 
          dnsRecords?.MX, 
          <Mail className="w-4 h-4 text-green-500" />, 
          (mx) => ({ 
            display: `Priority: ${mx.priority} → ${mx.exchange}`, 
            copy: mx.exchange 
          })
        )}

        {/* NS (Name Servers) Records */}
        {renderRecordList(
          'Name Servers (NS)', 
          dnsRecords?.NS, 
          <Database className="w-4 h-4 text-purple-500" />, 
          (ns) => ({ display: ns, copy: ns })
        )}

        {/* TXT Records */}
        {renderRecordList(
          'TXT (Text Records)', 
          dnsRecords?.TXT, 
          <FileText className="w-4 h-4 text-yellow-500" />, 
          (txt) => {
            const rawVal = Array.isArray(txt) ? txt.join(' ') : txt;
            return { display: rawVal, copy: rawVal };
          }
        )}
      </div>
    </div>
  );
}
