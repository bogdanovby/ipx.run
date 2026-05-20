'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, Search, AlertCircle, RefreshCw, Cpu, Database, ShieldCheck, Activity, Terminal, Github } from 'lucide-react';
import SearchBar from './SearchBar';
import ThemeToggle from './ThemeToggle';
import ConnectionCard from './Cards/ConnectionCard';
import LocationCard from './Cards/LocationCard';
import DeviceCard from './Cards/DeviceCard';
import SecurityCard from './Cards/SecurityCard';
import DnsCard from './Cards/DnsCard';
import WhoisCard from './Cards/WhoisCard';
import PingCard from './Cards/PingCard';
import DigCard from './Cards/DigCard';
import { IpDetails } from '@/services/ipService';

// Lazy-load Leaflet Map to completely bypass Server-Side rendering and avoid window errors
const DynamicMap = dynamic(() => import('./Map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[350px] md:min-h-[400px] rounded-xl bg-border-muted/30 animate-pulse flex items-center justify-center border border-card-border">
      <span className="text-text-muted text-sm font-medium flex items-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-brand-orange" />
        Preloading Map Module...
      </span>
    </div>
  ),
});

interface DashboardProps {
  initialData: IpDetails;
  userAgent: string;
}

export default function Dashboard({ initialData, userAgent }: DashboardProps) {
  const [data, setData] = useState<IpDetails>(initialData);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'geolocation' | 'dns' | 'whois' | 'ping' | 'dig'>('geolocation');

  const handleSearch = async (searchedIp: string) => {
    if (!searchedIp) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/ip/${encodeURIComponent(searchedIp)}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch details for this IP address/domain.');
      }

      setData(result);
      // Reset to geolocation tab on successful new lookup
      setActiveTab('geolocation');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while communicating with the analysis API.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setData(initialData);
    setError(null);
    setActiveTab('geolocation');
  };

  const isCurrentVisitor = data.ip === initialData.ip;

  // Animation layout configs
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 90,
        damping: 14,
      },
    },
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col z-10 pb-12">
      {/* Network Dot Matrix Background Layer */}
      <div className="grid-bg" />

      {/* Header Bar */}
      <header className="w-full border-b border-card-border/60 bg-background/50 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo Brand */}
          <div 
            onClick={handleReset} 
            className="flex items-center gap-2 group cursor-pointer select-none"
          >
            <div className="relative w-8 h-8 rounded-lg bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center group-hover:border-brand-orange/40 transition-all duration-300">
              <Network className="w-4.5 h-4.5 text-brand-orange" />
              <span className="absolute w-1.5 h-1.5 rounded-full bg-brand-orange -top-0.5 -right-0.5 pulse-dot" />
            </div>
            <span className="font-sans font-black text-lg md:text-xl tracking-tighter text-foreground group-hover:text-brand-orange transition-colors duration-200">
              ipx<span className="text-brand-orange font-normal">.run</span>
            </span>
          </div>

          {/* Search bar pinned in header for desktop layouts */}
          <div className="hidden md:block w-full max-w-md">
            <SearchBar onSearch={handleSearch} isLoading={loading} initialValue={data.isDomain ? data.queriedDomain : (data.ip === initialData.ip ? '' : data.ip)} />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 pt-6 md:pt-10 flex flex-col gap-6 relative">
        {/* Mobile Search Input */}
        <div className="block md:hidden w-full">
          <SearchBar onSearch={handleSearch} isLoading={loading} initialValue={data.isDomain ? data.queriedDomain : (data.ip === initialData.ip ? '' : data.ip)} />
        </div>

        {/* Localhost / Mock banner indicator */}
        {data.isMock && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full p-3 rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-500 text-xs md:text-sm font-semibold flex items-center gap-2.5"
          >
            <Cpu className="w-4.5 h-4.5 shrink-0 animate-pulse text-blue-500" />
            <span>
              {data.ip === '127.0.0.1' || data.ip === '::1'
                ? 'Localhost loopback address detected. Displaying Cloudflare (1.1.1.1) mock data for demonstration.'
                : 'Local / private network IP detected. Geolocation services display standardized mock information.'}
            </span>
          </motion.div>
        )}

        {/* Request Error Alert */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="w-full overflow-hidden"
            >
              <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-500 text-sm font-bold flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Segmented Glass Navigation Tabs */}
        <div className="grid grid-cols-2 md:flex md:flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-border-muted/10 border border-card-border/30 backdrop-blur-sm self-start w-full md:w-auto select-none">
          <button
            onClick={() => setActiveTab('geolocation')}
            className={`col-span-2 md:col-span-1 justify-center px-4 py-2.5 md:py-2 rounded-lg text-xs md:text-sm font-bold flex items-center gap-1.5 transition-all duration-300 cursor-pointer ${
              activeTab === 'geolocation'
                ? 'bg-brand-orange text-white shadow-md shadow-brand-orange/20'
                : 'text-text-muted hover:text-foreground hover:bg-border-muted/20'
            }`}
          >
            <Search className="w-4 h-4 shrink-0" />
            Geolocation & Security
          </button>
          <button
            onClick={() => setActiveTab('dns')}
            className={`justify-center px-4 py-2.5 md:py-2 rounded-lg text-xs md:text-sm font-bold flex items-center gap-1.5 transition-all duration-300 cursor-pointer ${
              activeTab === 'dns'
                ? 'bg-brand-orange text-white shadow-md shadow-brand-orange/20'
                : 'text-text-muted hover:text-foreground hover:bg-border-muted/20'
            }`}
          >
            <Database className="w-4 h-4 shrink-0" />
            DNS Records
          </button>
          <button
            onClick={() => setActiveTab('whois')}
            className={`justify-center px-4 py-2.5 md:py-2 rounded-lg text-xs md:text-sm font-bold flex items-center gap-1.5 transition-all duration-300 cursor-pointer ${
              activeTab === 'whois'
                ? 'bg-brand-orange text-white shadow-md shadow-brand-orange/20'
                : 'text-text-muted hover:text-foreground hover:bg-border-muted/20'
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            WHOIS Lookup
          </button>
          <button
            onClick={() => setActiveTab('ping')}
            className={`justify-center px-4 py-2.5 md:py-2 rounded-lg text-xs md:text-sm font-bold flex items-center gap-1.5 transition-all duration-300 cursor-pointer ${
              activeTab === 'ping'
                ? 'bg-brand-orange text-white shadow-md shadow-brand-orange/20'
                : 'text-text-muted hover:text-foreground hover:bg-border-muted/20'
            }`}
          >
            <Activity className="w-4 h-4 shrink-0" />
            Ping Latency
          </button>
          <button
            onClick={() => setActiveTab('dig')}
            className={`justify-center px-4 py-2.5 md:py-2 rounded-lg text-xs md:text-sm font-bold flex items-center gap-1.5 transition-all duration-300 cursor-pointer ${
              activeTab === 'dig'
                ? 'bg-brand-orange text-white shadow-md shadow-brand-orange/20'
                : 'text-text-muted hover:text-foreground hover:bg-border-muted/20'
            }`}
          >
            <Terminal className="w-4 h-4 shrink-0" />
            Dig DNS
          </button>
        </div>

        {/* Tab Panel Transitions */}
        <AnimatePresence mode="wait">
          {activeTab === 'geolocation' && (
            <motion.div
              key="geolocation"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              {/* Dynamic Animated Dashboard Grid */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
              >
                {/* Information Cards Column */}
                <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
                  {/* Grid of Cards */}
                  <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${isCurrentVisitor ? 'md:grid-rows-2' : ''}`}>
                    <motion.div variants={cardVariants} className="h-full">
                      <ConnectionCard
                        ip={data.ip}
                        hostname={data.hostname}
                        isp={data.isp}
                        asn={data.asn}
                        connectionType={data.connectionType}
                      />
                    </motion.div>

                    <motion.div variants={cardVariants} className="h-full">
                      <LocationCard
                        country={data.country}
                        countryCode={data.countryCode}
                        region={data.region}
                        city={data.city}
                        zip={data.zip}
                        lat={data.lat}
                        lon={data.lon}
                        timezone={data.timezone}
                      />
                    </motion.div>

                    {/* Security check shown for all lookups */}
                    <motion.div variants={cardVariants} className="h-full">
                      <SecurityCard security={data.security} />
                    </motion.div>

                    {/* Browser Details parsed from header, only displayed if viewing own IP */}
                    {isCurrentVisitor && (
                      <motion.div variants={cardVariants} className="h-full">
                        <DeviceCard userAgent={userAgent} />
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Interactive Map Column */}
                <motion.div
                  variants={cardVariants}
                  className="lg:col-span-5 xl:col-span-4 h-full flex flex-col min-h-[350px]"
                >
                  <div className="glass-card rounded-2xl p-4 h-full flex flex-col gap-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-text-muted">
                      <Search className="w-3.5 h-3.5 text-brand-orange" />
                      Live Node Tracking
                    </div>
                    <div className="flex-1 w-full h-full relative overflow-hidden rounded-xl bg-border-muted/10">
                      <DynamicMap lat={data.lat} lon={data.lon} city={data.city} country={data.country} />
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          )}

          {activeTab === 'dns' && (
            <motion.div
              key="dns"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="glass-card rounded-2xl p-6 md:p-8"
            >
              <DnsCard dnsRecords={data.dnsRecords} queriedDomain={data.isDomain ? data.queriedDomain : data.hostname} />
            </motion.div>
          )}

          {activeTab === 'whois' && (
            <motion.div
              key="whois"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="glass-card rounded-2xl p-6 md:p-8"
            >
              <WhoisCard whois={data.whois} queriedDomain={data.isDomain ? data.queriedDomain : undefined} targetIp={data.ip} />
            </motion.div>
          )}

          {activeTab === 'ping' && (
            <motion.div
              key="ping"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="glass-card rounded-2xl p-6 md:p-8"
            >
              <PingCard initialTarget={data.isDomain ? (data.queriedDomain || '') : data.ip} />
            </motion.div>
          )}

          {activeTab === 'dig' && (
            <motion.div
              key="dig"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="glass-card rounded-2xl p-6 md:p-8"
            >
              <DigCard initialDomain={data.isDomain ? (data.queriedDomain || '') : data.ip} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Simple, sleek tech Footer */}
      <footer className="w-full mt-auto text-center py-6 text-[11px] font-medium text-text-muted tracking-wide z-10 border-t border-card-border/30 bg-background/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <span>
              &copy; {new Date().getFullYear()} <span className="font-extrabold text-foreground">ipx.run</span>. All rights reserved.
            </span>
            <span className="hidden sm:inline text-card-border">•</span>
            <a href="https://github.com/bogdanovby/ipx.run" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-foreground transition-colors duration-150">
              <Github className="w-3.5 h-3.5" />
              Open Source
            </a>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2">
            <a href="https://livemy.app/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors duration-150 flex items-center gap-1">
              Hosted by <span className="font-semibold">livemy.app</span>
            </a>
            <span className="text-card-border">•</span>
            <a href="https://bahdanau.pl" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors duration-150 flex items-center gap-1">
              Created by <span className="font-semibold">Pavel Bahdanau</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
