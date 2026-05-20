'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Database, Terminal, FileText, CheckCircle2, Clock, Globe, ShieldCheck, HelpCircle, Copy, Check } from 'lucide-react';
import { DigResult, DigRecord } from '@/services/digService';

interface DigCardProps {
  initialDomain: string;
}

const RECORD_TYPES = ['A', 'AAAA', 'MX', 'TXT', 'NS', 'CNAME', 'SOA', 'ANY'];
const NAMESERVERS = [
  { label: 'Google Public DNS (8.8.8.8)', value: '8.8.8.8' },
  { label: 'Cloudflare DNS (1.1.1.1)', value: '1.1.1.1' },
  { label: 'OpenDNS (208.67.222.222)', value: '208.67.222.222' },
  { label: 'Authoritative Nameserver', value: 'authoritative' },
];

export default function DigCard({ initialDomain }: DigCardProps) {
  const [domain, setDomain] = useState<string>('');
  const [recordType, setRecordType] = useState<string>('A');
  const [nameserver, setNameserver] = useState<string>('8.8.8.8');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DigResult | null>(null);
  const [outputTab, setOutputTab] = useState<'structured' | 'raw'>('structured');
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  // Sync domain with initialDomain prop
  useEffect(() => {
    // Strip protocols, path segments or trailing slashes if present
    if (initialDomain) {
      let clean = initialDomain.trim().toLowerCase();
      clean = clean.replace(/^(https?:\/\/)?(www\.)?/, '');
      clean = clean.split('/')[0];
      setDomain(clean);
    }
  }, [initialDomain]);

  const handleCopy = (value: string, id: string) => {
    navigator.clipboard.writeText(value);
    setCopiedValue(id);
    setTimeout(() => setCopiedValue(null), 1500);
  };

  const handleDig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!domain.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const url = `/api/dig?domain=${encodeURIComponent(domain.trim())}&type=${recordType}&nameserver=${nameserver}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to execute dig query');
      }

      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred during DNS dig lookup.');
    } finally {
      setLoading(false);
    }
  };

  // Perform dig query on mount or initial sync
  useEffect(() => {
    if (domain) {
      handleDig();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain, recordType, nameserver]);

  // Color styles for record types
  const getRecordTypeColor = (type: string) => {
    switch (type.toUpperCase()) {
      case 'A': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 dark:text-emerald-400';
      case 'AAAA': return 'bg-teal-500/10 border-teal-500/20 text-teal-500 dark:text-teal-400';
      case 'MX': return 'bg-blue-500/10 border-blue-500/20 text-blue-500 dark:text-blue-400';
      case 'TXT': return 'bg-sky-500/10 border-sky-500/20 text-sky-500 dark:text-sky-400';
      case 'NS': return 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500 dark:text-indigo-400';
      case 'CNAME': return 'bg-purple-500/10 border-purple-500/20 text-purple-500 dark:text-purple-400';
      case 'SOA': return 'bg-pink-500/10 border-pink-500/20 text-pink-500 dark:text-pink-400';
      default: return 'bg-slate-500/10 border-slate-500/20 text-slate-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'NOERROR':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold border border-emerald-500/20 bg-emerald-500/10 text-emerald-500">NOERROR</span>;
      case 'NXDOMAIN':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold border border-yellow-500/20 bg-yellow-500/10 text-yellow-500">NXDOMAIN</span>;
      case 'SERVFAIL':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold border border-red-500/20 bg-red-500/10 text-red-500">SERVFAIL</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold border border-slate-500/20 bg-slate-500/10 text-slate-400">{status}</span>;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Interactive Form Controls */}
      <form onSubmit={handleDig} className="flex flex-col md:flex-row md:items-end gap-4 w-full">
        {/* Target Domain Input */}
        <div className="flex-1 flex flex-col gap-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Query Target</label>
          <div className="relative">
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="e.g. google.com"
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-card-border bg-background/30 backdrop-blur-sm text-sm text-foreground focus:outline-none focus:border-brand-orange/50 transition-all duration-300"
            />
            <Globe className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Nameserver Dropdown Selector */}
        <div className="md:w-64 flex flex-col gap-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted">DNS Nameserver</label>
          <select
            value={nameserver}
            onChange={(e) => setNameserver(e.target.value)}
            className="w-full h-11 px-3.5 rounded-xl border border-card-border bg-card-bg text-foreground text-sm focus:outline-none focus:border-brand-orange/50 transition-all duration-300 cursor-pointer"
          >
            {NAMESERVERS.map((ns) => (
              <option key={ns.value} value={ns.value} className="bg-background text-foreground">
                {ns.label}
              </option>
            ))}
          </select>
        </div>

        {/* Query execution trigger */}
        <button
          type="submit"
          disabled={loading || !domain.trim()}
          className="px-5 h-11 rounded-xl bg-brand-orange hover:bg-brand-orange-hover text-white text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-50"
        >
          <Search className="w-4 h-4" />
          Dig DNS
        </button>
      </form>

      {/* Record Type Selection Pills */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">DNS Record Type</span>
        <div className="flex flex-wrap gap-1.5">
          {RECORD_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setRecordType(type)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all duration-200 cursor-pointer ${
                recordType === type
                  ? 'border-brand-orange/30 bg-brand-orange/10 text-brand-orange shadow-sm'
                  : 'border-card-border/50 hover:border-card-border text-text-muted hover:text-foreground hover:bg-border-muted/10'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="h-[1px] w-full bg-card-border/60" />

      {/* Display States */}
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-16 flex flex-col items-center justify-center gap-4 text-center select-none"
          >
            <div className="relative flex items-center justify-center">
              <Database className="w-8 h-8 text-brand-orange animate-pulse" />
              <span className="absolute w-12 h-12 rounded-full border border-brand-orange/30 animate-ping" />
            </div>
            <span className="text-text-muted text-xs font-semibold animate-pulse">
              Querying nameserver records...
            </span>
          </motion.div>
        )}

        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-500 text-sm font-semibold flex items-start gap-3.5"
          >
            <Database className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <span className="font-bold">Dig Lookup Failed</span>
              <span className="text-xs text-red-400">{error}</span>
            </div>
          </motion.div>
        )}

        {result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-6"
          >
            {/* Metadata Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-card rounded-xl p-4 flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Response Status
                </span>
                <div className="self-start mt-0.5">
                  {getStatusBadge(result.status)}
                </div>
              </div>

              <div className="glass-card rounded-xl p-4 flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  Query Time
                </span>
                <span className="text-sm font-black text-foreground">
                  {result.queryTime}
                </span>
              </div>

              <div className="glass-card rounded-xl p-4 flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-sky-400" />
                  Nameserver Queried
                </span>
                <span className="text-xs font-bold text-foreground break-all" title={result.server}>
                  {result.server}
                </span>
              </div>

              <div className="glass-card rounded-xl p-4 flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-pink-400" />
                  Lookup Timestamp
                </span>
                <span className="text-[10px] font-bold text-foreground">
                  {result.when}
                </span>
              </div>
            </div>

            {/* Results Presentation Tab Headers */}
            <div className="flex items-center gap-2 border-b border-card-border/40 pb-2">
              <button
                onClick={() => setOutputTab('structured')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all duration-150 cursor-pointer ${
                  outputTab === 'structured'
                    ? 'bg-brand-orange/10 text-brand-orange border border-brand-orange/20'
                    : 'text-text-muted hover:text-foreground'
                }`}
              >
                <FileText className="w-4 h-4" />
                Structured Records
              </button>
              <button
                onClick={() => setOutputTab('raw')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all duration-150 cursor-pointer ${
                  outputTab === 'raw'
                    ? 'bg-brand-orange/10 text-brand-orange border border-brand-orange/20'
                    : 'text-text-muted hover:text-foreground'
                }`}
              >
                <Terminal className="w-4 h-4" />
                Raw Console Log
              </button>
            </div>

            {/* Tab Panels */}
            {outputTab === 'structured' ? (
              <div className="glass-card rounded-2xl overflow-hidden border border-card-border/40">
                {result.records.length === 0 ? (
                  <div className="py-12 text-center text-text-muted text-xs italic flex flex-col items-center gap-2">
                    <HelpCircle className="w-6 h-6 text-border-muted" />
                    No records found in the ANSWER SECTION for {recordType} of {domain}.
                  </div>
                ) : (
                  <div className="w-full overflow-x-auto scrollbar-thin">
                    <table className="w-full text-left border-collapse text-xs md:text-sm">
                      <thead>
                        <tr className="border-b border-card-border/60 bg-border-muted/10 font-bold text-text-muted uppercase text-[10px] tracking-wider select-none">
                          <th className="py-3.5 px-4 font-black">Name</th>
                          <th className="py-3.5 px-3 font-black">TTL</th>
                          <th className="py-3.5 px-3 font-black">Class</th>
                          <th className="py-3.5 px-3 font-black">Type</th>
                          <th className="py-3.5 px-4 font-black">Data / Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-card-border/40 font-mono">
                        {result.records.map((rec, index) => {
                          const recordId = `rec-${index}`;
                          return (
                            <tr key={index} className="hover:bg-border-muted/5 group transition-colors duration-150">
                              <td className="py-3 px-4 text-text-muted break-all font-semibold select-all">{rec.name}</td>
                              <td className="py-3 px-3 font-bold text-slate-500">{rec.ttl}</td>
                              <td className="py-3 px-3 font-bold text-slate-400">{rec.class}</td>
                              <td className="py-3 px-3 select-none">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black border uppercase ${getRecordTypeColor(rec.type)}`}>
                                  {rec.type}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-foreground break-all relative pr-12 select-text font-medium">
                                <span className="line-clamp-3 leading-5">{rec.value}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(rec.value, recordId)}
                                  className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg border border-card-border/60 bg-card-bg hover:bg-border-muted/30 text-text-muted hover:text-foreground transition-all duration-150 cursor-pointer"
                                  title="Copy Record Value"
                                >
                                  {copiedValue === recordId ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              /* Raw Terminal Panel */
              <div className="w-full flex flex-col rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
                <div className="h-9 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 select-none shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wider">
                    DIG_CONSOL_OUTPUT
                  </span>
                  <div className="w-10" />
                </div>
                <div className="p-4 overflow-auto max-h-[350px] font-mono text-[11px] text-slate-300 leading-5 scrollbar-thin scrollbar-track-slate-950 scrollbar-thumb-slate-800 select-text">
                  {result.rawOutput.split('\n').map((line, idx) => {
                    let color = 'text-slate-300';
                    if (line.startsWith('; <<>>')) color = 'text-brand-orange font-bold';
                    else if (line.startsWith(';; ANSWER SECTION:')) color = 'text-emerald-400 font-bold mt-2';
                    else if (line.startsWith(';; QUESTION SECTION:')) color = 'text-sky-400 font-bold mt-2';
                    else if (line.startsWith(';; AUTHORITY SECTION:')) color = 'text-yellow-400 font-bold mt-2';
                    else if (line.startsWith(';; SERVER:')) color = 'text-slate-400 font-bold border-t border-slate-800/60 mt-2 pt-2';
                    else if (line.startsWith(';;') || line.startsWith(';')) color = 'text-slate-500';

                    return (
                      <div key={idx} className={`${color} whitespace-pre`}>
                        {line || ' '}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
