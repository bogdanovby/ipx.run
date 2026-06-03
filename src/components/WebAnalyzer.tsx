'use client';

import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, ShieldCheck, ShieldAlert, Cpu, BarChart3, Database, 
  MapPin, Calendar, HelpCircle, Users, Activity, ExternalLink, RefreshCw, Lock, AlertTriangle,
  Mail, Phone, MessageSquare, Send
} from 'lucide-react';
import { IpDetails } from '@/services/ipService';

interface WebAnalyzerProps {
  initialDomain?: string;
  initialData?: IpDetails;
}

interface AnalysisReport {
  domain: string;
  ip: string;
  hosting: {
    isp: string;
    asn: string;
    country: string;
    countryCode: string;
    region: string;
    city: string;
    zip: string;
    lat: number;
    lon: number;
  };
  ssl: {
    issuer: string;
    subject: string;
    validFrom: string;
    validTo: string;
    serialNumber: string;
    fingerprint: string;
    isExpired: boolean;
  };
  techStack: Array<{ name: string; category: string }>;
  contacts?: {
    emails: string[];
    phones: string[];
    socials: Array<{ platform: string; url: string }>;
  };
  whois: {
    name: string;
    status: string[];
    registrar?: string;
    createdDate?: string;
    expirationDate?: string;
  };
  metrics: {
    globalRank: number;
    monthlyVisits: number;
    bounceRate: number;
    pagesPerVisit: number;
    avgDurationSec: number;
    trendVisits: number[];
    trafficSources: {
      direct: number;
      search: number;
      referrals: number;
      social: number;
      email: number;
    };
    topCountries: Array<{ name: string; code: string; share: number }>;
  };
}

export default function WebAnalyzer({ initialDomain, initialData }: WebAnalyzerProps) {
  const [targetDomain, setTargetDomain] = useState<string>(initialDomain || 'vercel.com');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<AnalysisReport | null>(null);

  useEffect(() => {
    // Run initial analysis for initialDomain
    const defaultDomain = initialDomain || 'vercel.com';
    setTargetDomain(defaultDomain);
    triggerAnalysis(defaultDomain);
  }, [initialDomain]);

  const triggerAnalysis = async (domainToAnalyze: string) => {
    if (!domainToAnalyze.trim()) return;
    setLoading(true);
    setError(null);

    // Clean up domain format
    const cleanDomain = domainToAnalyze
      .trim()
      .toLowerCase()
      .replace(/^(https?:\/\/)?(www\.)?/, '')
      .split('/')[0]
      .split('?')[0];

    try {
      const res = await fetch(`/api/analyzer?domain=${encodeURIComponent(cleanDomain)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze website.');
      }

      setReport(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while executing site analysis.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    triggerAnalysis(targetDomain);
  };

  // Helper to format large numbers (e.g. 1.2M, 42.5K)
  const formatNumber = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toLocaleString();
  };

  // Helper to format visit duration (e.g. 4m 32s)
  const formatDuration = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  // Helper to format Date safely in ISO (YYYY-MM-DD)
  const formatIsoDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return dateStr;
    }
  };

  // Pre-calculate month labels for SVG Chart (Last 6 Months)
  const getMonthLabels = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const labels = [];
    for (let i = 5; i >= 0; i--) {
      const idx = (currentMonth - i + 12) % 12;
      labels.push(months[idx]);
    }
    return labels;
  };


  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 90, damping: 14 } }
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-fadeIn">
      {/* Analysis Input Box Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl glass-card border border-card-border/60 transition-all duration-300 focus-within:ring-2 focus-within:ring-brand-orange/20 focus-within:border-brand-orange/40 bg-background/40">
          <Globe className="w-5 h-5 text-text-muted shrink-0" />
          <input
            type="text"
            value={targetDomain}
            onChange={(e) => setTargetDomain(e.target.value)}
            disabled={loading}
            placeholder="Analyze website (e.g. vercel.com, github.com)..."
            className="w-full bg-transparent border-none outline-none py-1 text-sm md:text-base placeholder-text-muted/60 text-foreground shrink min-w-0"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
          <button
            type="submit"
            disabled={loading || !targetDomain.trim()}
            className={`px-4 py-2 rounded-lg text-xs md:text-sm font-semibold cursor-pointer select-none transition-all duration-200 shrink-0 flex items-center gap-1.5 active:scale-95 ${
              loading || !targetDomain.trim()
                ? 'bg-border-muted text-text-muted cursor-not-allowed opacity-50'
                : 'bg-brand-orange text-white hover:bg-brand-orange-hover hover:shadow-md shadow-brand-orange/20'
            }`}
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                Auditing
              </>
            ) : (
              'Analyze Site'
            )}
          </button>
        </div>
      </form>

      {/* Error message */}
      {error && (
        <div className="max-w-2xl mx-auto w-full p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-500 text-sm font-bold flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state indicator */}
      {loading && !report && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-text-muted select-none">
          <RefreshCw className="w-8 h-8 animate-spin text-brand-orange" />
          <div className="text-center">
            <h3 className="text-sm font-bold text-foreground">Performing Active Network Handshake...</h3>
            <p className="text-xs text-text-muted">Resolving DNS, fetching SSL headers, and scanning technology signatures.</p>
          </div>
        </div>
      )}

      {/* Full Analysis Report Render */}
      <AnimatePresence mode="wait">
        {report && !loading && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
          >
            {/* Top KPIs Summary Metrics Header */}
            <div className="lg:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Card 1: Global Rank */}
              <motion.div variants={itemVariants} className="glass-card rounded-xl p-4 flex flex-col gap-1.5 bg-background/30">
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-brand-orange" />
                  Estimated Global Rank
                </span>
                <span className="text-xl md:text-2xl font-black text-foreground">
                  #{report.metrics.globalRank.toLocaleString()}
                </span>
              </motion.div>

              {/* Card 2: Monthly Visitors */}
              <motion.div variants={itemVariants} className="glass-card rounded-xl p-4 flex flex-col gap-1.5 bg-background/30">
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-brand-orange" />
                  Monthly Visits
                </span>
                <span className="text-xl md:text-2xl font-black text-foreground">
                  {formatNumber(report.metrics.monthlyVisits)}
                </span>
              </motion.div>

              {/* Card 3: Bounce Rate */}
              <motion.div variants={itemVariants} className="glass-card rounded-xl p-4 flex flex-col gap-1.5 bg-background/30">
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1">
                  <BarChart3 className="w-3.5 h-3.5 text-brand-orange" />
                  Bounce Rate
                </span>
                <span className="text-xl md:text-2xl font-black text-foreground">
                  {report.metrics.bounceRate}%
                </span>
              </motion.div>

              {/* Card 4: Pages / Visit */}
              <motion.div variants={itemVariants} className="glass-card rounded-xl p-4 flex flex-col gap-1.5 bg-background/30">
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-brand-orange" />
                  Avg Duration
                </span>
                <span className="text-xl md:text-2xl font-black text-foreground">
                  {formatDuration(report.metrics.avgDurationSec)}
                </span>
              </motion.div>
            </div>

            {/* Column Left: SimilarWeb Analytics Section */}
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
              {/* Monthly Traffic Trend Table */}
              <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Estimated Monthly Traffic</h3>
                    <p className="text-xs text-text-muted">Unique visitors over the last 6 months</p>
                  </div>
                  <span className="text-[10px] font-bold text-brand-orange bg-brand-orange/10 px-2 py-1 rounded-full uppercase tracking-wider select-none">
                    Traffic Trend
                  </span>
                </div>

                {/* Classical Table */}
                <div className="w-full overflow-hidden rounded-xl border border-card-border/30 bg-background/20">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs font-medium">
                      <thead>
                        <tr className="border-b border-card-border/30 bg-white/[0.02] text-[10px] font-bold uppercase tracking-wider text-text-muted select-none">
                          <th className="p-3.5 pl-5">Month</th>
                          <th className="p-3.5 text-right">Unique Visitors</th>
                          <th className="p-3.5 pr-5 text-right">Growth / Change</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-card-border/20 font-mono">
                        {report.metrics.trendVisits.map((val, idx) => {
                          const monthName = getMonthLabels()[idx];
                          
                          // Calculate delta change compared to previous month
                          let delta: number | null = null;
                          if (idx > 0) {
                            const prevVal = report.metrics.trendVisits[idx - 1];
                            if (prevVal > 0) {
                              delta = ((val - prevVal) / prevVal) * 100;
                            }
                          }

                          return (
                            <tr key={idx} className="transition-colors duration-150 hover:bg-white/[0.01]">
                              <td className="p-3.5 pl-5 font-sans font-bold text-foreground">
                                {monthName}
                              </td>
                              <td className="p-3.5 text-right text-foreground font-bold">
                                {val.toLocaleString()}
                              </td>
                              <td className="p-3.5 pr-5 text-right">
                                {delta !== null ? (
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                                    delta > 0 
                                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                      : delta < 0
                                        ? 'bg-red-500/10 border-red-500/20 text-red-400'
                                        : 'bg-neutral-500/10 border-neutral-500/20 text-text-muted'
                                  }`}>
                                    <span className="text-[8px] leading-none">
                                      {delta > 0 ? '▲' : delta < 0 ? '▼' : '●'}
                                    </span>
                                    {delta > 0 ? '+' : ''}{delta.toFixed(1)}%
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-text-muted bg-white/[0.02] px-2.5 py-1 rounded-lg border border-card-border/10 select-none">
                                    Base
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>

              {/* Side-by-Side Splits: Traffic Sources & Geo Distribution */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Traffic Acquisition Channels */}
                <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6 flex flex-col gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Traffic Acquisition Channels</h3>
                    <p className="text-xs text-text-muted">Visitor source share distribution</p>
                  </div>

                  <div className="flex flex-col gap-3.5 mt-1 select-none">
                    {Object.entries(report.metrics.trafficSources).map(([source, share]) => {
                      const colors: Record<string, string> = {
                        direct: 'bg-brand-orange',
                        search: 'bg-brand-orange/80',
                        referrals: 'bg-brand-orange/60',
                        social: 'bg-brand-orange/40',
                        email: 'bg-brand-orange/20',
                      };
                      return (
                        <div key={source} className="flex flex-col gap-1">
                          <div className="flex items-center justify-between text-xs font-medium text-foreground">
                            <span className="capitalize">{source}</span>
                            <span className="font-bold font-mono">{share}%</span>
                          </div>
                          <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-card-border/20">
                            <div 
                              className={`h-full ${colors[source] || 'bg-brand-orange'}`} 
                              style={{ width: `${share}%` }} 
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>

                {/* Geographic Traffic Distribution */}
                <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6 flex flex-col gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Top Geolocation Sources</h3>
                    <p className="text-xs text-text-muted">Primary countries sending web traffic</p>
                  </div>

                  <div className="flex flex-col gap-3.5 mt-1 select-none">
                    {report.metrics.topCountries.map((c, idx) => (
                      <div key={idx} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-xs font-medium text-foreground">
                          <span className="flex items-center gap-1.5">
                            <span className="text-[10px] uppercase font-bold text-text-muted font-mono">{c.code}</span>
                            <span>{c.name}</span>
                          </span>
                          <span className="font-bold font-mono">{c.share}%</span>
                        </div>
                        <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-card-border/20">
                          <div 
                            className="h-full bg-brand-orange/85" 
                            style={{ width: `${c.share}%` }} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Technology Stack Detected */}
              <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6 flex flex-col gap-4">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Detected Technology Stack</h3>
                  <p className="text-xs text-text-muted">Software, servers, frameworks, and analytics found</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                  {['Framework', 'CMS', 'Web Server/CDN', 'Analytics', 'Library'].map((cat) => {
                    const filteredTechs = report.techStack.filter(t => t.category === cat);
                    if (filteredTechs.length === 0) return null;

                    return (
                      <div key={cat} className="flex flex-col gap-2 p-3 bg-neutral-900/30 border border-card-border/20 rounded-xl">
                        <span className="text-[10px] font-black uppercase tracking-wider text-text-muted flex items-center gap-1 select-none">
                          <Cpu className="w-3.5 h-3.5 text-brand-orange" />
                          {cat}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {filteredTechs.map((t, idx) => (
                            <span 
                              key={idx} 
                              className="px-2.5 py-0.5 rounded bg-brand-orange/10 border border-brand-orange/30 text-white font-mono text-xs font-bold shadow-sm select-none"
                            >
                              {t.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </div>

            {/* Column Right: SSL, Domain Metadata & Hosting */}
            <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6">
              {/* SSL Certificate Card */}
              <motion.div variants={itemVariants} className="glass-card rounded-2xl p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between select-none">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">SSL Certificate Details</h3>
                    <p className="text-xs text-text-muted">Peer TLS certificate verification</p>
                  </div>
                  {report.ssl.isExpired ? (
                    <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500">
                      <ShieldAlert className="w-4.5 h-4.5" />
                    </div>
                  ) : (
                    <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-500">
                      <ShieldCheck className="w-4.5 h-4.5" />
                    </div>
                  )}
                </div>

                <div className="space-y-3.5 text-xs font-medium">
                  {/* Status Indicator Bar */}
                  <div className={`p-2.5 rounded-xl border flex items-center gap-2 select-none ${
                    report.ssl.isExpired 
                      ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  }`}>
                    <Lock className="w-4 h-4 shrink-0" />
                    <span className="font-bold">
                      {report.ssl.isExpired ? 'SSL CERTIFICATE EXPIRED / INVALID' : 'SSL CONNECTION SECURED'}
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-card-border/30 pb-2">
                    <span className="text-text-muted">Certificate Authority:</span>
                    <span className="text-foreground text-right">{report.ssl.issuer}</span>
                  </div>
                  <div className="flex justify-between border-b border-card-border/30 pb-2">
                    <span className="text-text-muted">Issued Common Name:</span>
                    <span className="text-foreground text-right">{report.ssl.subject}</span>
                  </div>
                  <div className="flex justify-between border-b border-card-border/30 pb-2">
                    <span className="text-text-muted">Valid From:</span>
                    <span className="text-foreground font-mono">{formatIsoDate(report.ssl.validFrom)}</span>
                  </div>
                  <div className="flex justify-between border-b border-card-border/30 pb-2">
                    <span className="text-text-muted">Expiration Date:</span>
                    <span className="text-foreground font-mono">{formatIsoDate(report.ssl.validTo)}</span>
                  </div>
                </div>
              </motion.div>

              {/* Hosting & Geolocation Card */}
              <motion.div variants={itemVariants} className="glass-card rounded-2xl p-5 flex flex-col gap-4">
                <div className="select-none">
                  <h3 className="text-sm font-bold text-foreground">Hosting & Server Geolocation</h3>
                  <p className="text-xs text-text-muted">Physical server provider details</p>
                </div>

                <div className="space-y-3.5 text-xs font-medium">
                  <div className="flex justify-between border-b border-card-border/30 pb-2">
                    <span className="text-text-muted">Resolved IP Address:</span>
                    <span className="text-foreground font-mono font-bold">{report.ip}</span>
                  </div>
                  <div className="flex justify-between border-b border-card-border/30 pb-2">
                    <span className="text-text-muted">Host ISP/ASN:</span>
                    <span className="text-foreground text-right truncate max-w-[200px]" title={report.hosting.isp}>
                      {report.hosting.isp}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-card-border/30 pb-2">
                    <span className="text-text-muted">Physical Server ISP:</span>
                    <span className="text-foreground font-mono font-semibold">{report.hosting.asn}</span>
                  </div>
                  <div className="flex justify-between border-b border-card-border/30 pb-2">
                    <span className="text-text-muted">Location coordinates:</span>
                    <span className="text-foreground flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-brand-orange" />
                      {report.hosting.city}, {report.hosting.region} ({report.hosting.countryCode})
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Domain Registration timeline */}
              <motion.div variants={itemVariants} className="glass-card rounded-2xl p-5 flex flex-col gap-4">
                <div className="select-none">
                  <h3 className="text-sm font-bold text-foreground">Domain WHOIS Metadata</h3>
                  <p className="text-xs text-text-muted">Domain registration timeline</p>
                </div>

                <div className="space-y-3.5 text-xs font-medium">
                  <div className="flex justify-between border-b border-card-border/30 pb-2">
                    <span className="text-text-muted">Domain Registrar:</span>
                    <span className="text-foreground text-right font-semibold">{report.whois.registrar || 'N/A'}</span>
                  </div>
                  {report.whois.createdDate && (
                    <div className="flex justify-between border-b border-card-border/30 pb-2">
                      <span className="text-text-muted">Creation Date:</span>
                      <span className="text-foreground font-mono flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-brand-orange" />
                        {formatIsoDate(report.whois.createdDate)}
                      </span>
                    </div>
                  )}
                  {report.whois.expirationDate && (
                    <div className="flex justify-between border-b border-card-border/30 pb-2">
                      <span className="text-text-muted">Expiration Date:</span>
                      <span className="text-foreground font-mono flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-brand-orange" />
                        {formatIsoDate(report.whois.expirationDate)}
                      </span>
                    </div>
                  )}
                  {report.whois.status && report.whois.status.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-text-muted">Registry status:</span>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {report.whois.status.slice(0, 3).map((st, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-neutral-900 border border-card-border/30 text-text-muted font-mono text-[10px] rounded">
                            {st}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Contact Information Card */}
              {report.contacts && (report.contacts.emails.length > 0 || report.contacts.phones.length > 0 || report.contacts.socials.length > 0) && (
                <motion.div variants={itemVariants} className="glass-card rounded-2xl p-5 flex flex-col gap-4">
                  <div className="select-none">
                    <h3 className="text-sm font-bold text-foreground">Extracted Contacts</h3>
                    <p className="text-xs text-text-muted">Detected emails, phones, and social links</p>
                  </div>

                  <div className="space-y-4">
                    {/* Emails Section */}
                    {report.contacts.emails.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-text-muted flex items-center gap-1.5 select-none">
                          <Mail className="w-3.5 h-3.5 text-brand-orange" />
                          Email Addresses
                        </span>
                        <div className="flex flex-col gap-1.5">
                          {report.contacts.emails.map((email, idx) => (
                            <a
                              key={idx}
                              href={`mailto:${email}`}
                              className="text-xs font-mono font-medium text-foreground hover:text-brand-orange transition-colors flex items-center justify-between bg-neutral-900/30 border border-card-border/20 px-3 py-2 rounded-lg group"
                            >
                              <span className="truncate max-w-[200px]">{email}</span>
                              <ExternalLink className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Phones Section */}
                    {report.contacts.phones.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-text-muted flex items-center gap-1.5 select-none">
                          <Phone className="w-3.5 h-3.5 text-brand-orange" />
                          Phone Numbers
                        </span>
                        <div className="flex flex-col gap-1.5">
                          {report.contacts.phones.map((phone, idx) => (
                            <a
                              key={idx}
                              href={`tel:${phone.replace(/[^\d+]/g, '')}`}
                              className="text-xs font-mono font-medium text-foreground hover:text-brand-orange transition-colors flex items-center justify-between bg-neutral-900/30 border border-card-border/20 px-3 py-2 rounded-lg group"
                            >
                              <span>{phone}</span>
                              <ExternalLink className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Socials Section */}
                    {report.contacts.socials.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-text-muted flex items-center gap-1.5 select-none">
                          <MessageSquare className="w-3.5 h-3.5 text-brand-orange" />
                          Social Networks
                        </span>
                        <div className="grid grid-cols-2 gap-1.5">
                          {report.contacts.socials.map((soc, idx) => {
                            const colors: Record<string, string> = {
                              telegram: 'hover:border-sky-500/30 hover:bg-sky-500/5 hover:text-sky-400',
                              whatsapp: 'hover:border-emerald-500/30 hover:bg-emerald-500/5 hover:text-emerald-400',
                              facebook: 'hover:border-blue-500/30 hover:bg-blue-500/5 hover:text-blue-400',
                              instagram: 'hover:border-pink-500/30 hover:bg-pink-500/5 hover:text-pink-400',
                              linkedin: 'hover:border-indigo-500/30 hover:bg-indigo-500/5 hover:text-indigo-400',
                              twitter: 'hover:border-neutral-500/30 hover:bg-white/5 hover:text-foreground',
                              youtube: 'hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-400',
                              vk: 'hover:border-blue-500/30 hover:bg-blue-500/5 hover:text-blue-400',
                              github: 'hover:border-neutral-500/30 hover:bg-white/5 hover:text-foreground',
                            };
                            return (
                              <a
                                key={idx}
                                href={soc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`text-[10px] font-bold capitalize transition-all duration-200 border border-card-border/20 bg-neutral-900/30 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 justify-between group truncate ${colors[soc.platform] || 'hover:border-brand-orange/30 hover:bg-brand-orange/5 hover:text-brand-orange'}`}
                              >
                                <span className="truncate">{soc.platform}</span>
                                <ExternalLink className="w-2.5 h-2.5 text-text-muted opacity-40 group-hover:opacity-100 transition-opacity shrink-0" />
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
