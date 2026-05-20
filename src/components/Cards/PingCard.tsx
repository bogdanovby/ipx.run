'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, Terminal, ShieldAlert, Cpu, Activity, Clock, Server, ArrowDown } from 'lucide-react';

interface PingCardProps {
  initialTarget: string;
}

interface LatencyPoint {
  seq: number;
  time: number;
  status: 'good' | 'average' | 'slow' | 'timeout';
}

export default function PingCard({ initialTarget }: PingCardProps) {
  const [target, setTarget] = useState<string>(initialTarget || '');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [latencyPoints, setLatencyPoints] = useState<LatencyPoint[]>([]);
  
  // Real-time statistics parsed from output
  const [stats, setStats] = useState<{
    min: string;
    avg: string;
    max: string;
    loss: string;
    transmitted: number;
    received: number;
  }>({
    min: '—',
    avg: '—',
    max: '—',
    loss: '0',
    transmitted: 0,
    received: 0,
  });

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const activeReaderRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);

  // Sync target with initialTarget when it changes
  useEffect(() => {
    if (initialTarget) {
      setTarget(initialTarget);
    }
  }, [initialTarget]);

  // Auto-scroll terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLines]);

  // Clean up reader on unmount
  useEffect(() => {
    return () => {
      if (activeReaderRef.current) {
        activeReaderRef.current.cancel();
      }
    };
  }, []);

  const handleStop = () => {
    if (activeReaderRef.current) {
      activeReaderRef.current.cancel();
      activeReaderRef.current = null;
    }
    setIsRunning(false);
    setTerminalLines(prev => [...prev, '\n[Process manually terminated by user]']);
  };

  const handleStart = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isRunning) return;
    if (!target.trim()) return;

    setIsRunning(true);
    setTerminalLines([`$ ping -c 4 ${target.trim()}`, 'Initializing network packets...']);
    setLatencyPoints([]);
    setStats({
      min: '—',
      avg: '—',
      max: '—',
      loss: '0',
      transmitted: 0,
      received: 0,
    });

    try {
      const response = await fetch(`/api/ping?target=${encodeURIComponent(target.trim())}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to connect to ping API');
      }

      if (!response.body) {
        throw new Error('Readable stream not supported by server');
      }

      const reader = response.body.getReader();
      activeReaderRef.current = reader;
      const decoder = new TextDecoder();
      let buffer = '';

      let sequenceCounter = 0;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        // Keep the incomplete last line in the buffer
        buffer = lines.pop() || '';

        for (const rawLine of lines) {
          if (rawLine.startsWith('data: ')) {
            try {
              const dataStr = rawLine.substring(6);
              const { line } = JSON.parse(dataStr);
              
              setTerminalLines(prev => [...prev, line]);

              // 1. Parse individual ping RTT response lines
              // Example: 64 bytes from ...: icmp_seq=1 ttl=114 time=50.0 ms
              // Or fallback format: 64 bytes connection from ...: tcp_seq=1 port=80 time=50.00 ms
              const timeMatch = line.match(/time=([0-9.]+)\s*ms/);
              if (timeMatch) {
                const latency = parseFloat(timeMatch[1]);
                sequenceCounter++;
                
                let status: 'good' | 'average' | 'slow' | 'timeout' = 'good';
                if (latency > 150) status = 'slow';
                else if (latency > 60) status = 'average';

                setLatencyPoints(prev => [...prev, {
                  seq: sequenceCounter,
                  time: latency,
                  status
                }]);
              } else if (line.toLowerCase().includes('timeout') || line.toLowerCase().includes('failed')) {
                sequenceCounter++;
                setLatencyPoints(prev => [...prev, {
                  seq: sequenceCounter,
                  time: 0,
                  status: 'timeout'
                }]);
              }

              // 2. Parse statistics summary lines
              // Example: 4 packets transmitted, 4 received, 0% packet loss, time 3005ms
              const statMatch = line.match(/(\d+)\s+packets?\s+transmitted,\s+(\d+)\s+(?:packets\s+)?received,\s+([\d.]+)%\s+packet\s+loss/);
              if (statMatch) {
                setStats(prev => ({
                  ...prev,
                  transmitted: parseInt(statMatch[1]),
                  received: parseInt(statMatch[2]),
                  loss: statMatch[3],
                }));
              }

              // Example: rtt min/avg/max/mdev = 50.035/54.527/60.014/3.704 ms
              // Or TCP fallback: rtt min/avg/max = 50.035/54.527/60.014 ms
              const rttMatch = line.match(/rtt\s+min\/avg\/max(?:\/mdev)?\s*=\s*([\d.]+)\/([\d.]+)\/([\d.]+)/);
              if (rttMatch) {
                setStats(prev => ({
                  ...prev,
                  min: `${parseFloat(rttMatch[1]).toFixed(1)} ms`,
                  avg: `${parseFloat(rttMatch[2]).toFixed(1)} ms`,
                  max: `${parseFloat(rttMatch[3]).toFixed(1)} ms`,
                }));
              }
            } catch (err) {
              // Parse errors on custom/empty lines
            }
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      setTerminalLines(prev => [...prev, `\n[Error: ${err.message || 'Stream connection lost'}]`]);
    } finally {
      setIsRunning(false);
      activeReaderRef.current = null;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Search and Trigger form */}
      <form onSubmit={handleStart} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            disabled={isRunning}
            placeholder="Enter IP address or domain name (e.g. 8.8.8.8, google.com)"
            className="w-full h-11 px-4 py-2.5 rounded-xl border border-card-border bg-background/30 backdrop-blur-sm text-sm text-foreground placeholder-text-muted focus:outline-none focus:border-brand-orange/50 transition-all duration-300 disabled:opacity-60"
          />
        </div>
        <div className="flex gap-2">
          {!isRunning ? (
            <button
              type="submit"
              disabled={!target.trim()}
              className="px-5 h-11 rounded-xl bg-brand-orange hover:bg-brand-orange-hover text-white text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4 fill-white" />
              Launch Ping
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStop}
              className="px-5 h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
            >
              <Square className="w-4 h-4 fill-white" />
              Stop Query
            </button>
          )}
        </div>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Terminal Simulator Panel */}
        <div className="lg:col-span-8 flex flex-col h-full min-h-[400px]">
          <div className="w-full flex-1 flex flex-col rounded-2xl overflow-hidden border border-slate-800/80 bg-slate-950 shadow-2xl relative">
            {/* Terminal Window Header */}
            <div className="h-10 bg-slate-900 border-b border-slate-800/60 flex items-center justify-between px-4 select-none shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/80 border border-red-600/30" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/80 border border-yellow-600/30" />
                <span className="w-3 h-3 rounded-full bg-green-500/80 border border-green-600/30" />
              </div>
              <span className="text-[11px] font-bold text-slate-400 font-mono tracking-wider uppercase flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-brand-orange" />
                Terminal Consoles
              </span>
              <div className="w-14" /> {/* Spacer */}
            </div>

            {/* Terminal Console Viewport */}
            <div className="flex-1 p-4 overflow-y-auto max-h-[380px] font-mono text-[12px] text-slate-300 scrollbar-thin scrollbar-track-slate-950 scrollbar-thumb-slate-800 flex flex-col gap-1 select-text">
              {terminalLines.length === 0 ? (
                <div className="text-slate-500 italic h-full flex items-center justify-center select-none py-12">
                  Terminal ready. Enter a target above and click Launch Ping.
                </div>
              ) : (
                terminalLines.map((line, idx) => {
                  let colorClass = 'text-slate-300';
                  if (line.startsWith('$')) colorClass = 'text-brand-orange font-bold';
                  else if (line.includes('time=')) colorClass = 'text-emerald-400/95';
                  else if (line.includes('failed') || line.includes('timed out') || line.includes('[stderr]') || line.includes('[Warning]')) colorClass = 'text-red-400 font-medium';
                  else if (line.startsWith('---') || line.startsWith('rtt')) colorClass = 'text-slate-400 font-bold border-t border-slate-800/50 mt-1 pt-1';

                  return (
                    <div key={idx} className={`${colorClass} leading-5 break-all whitespace-pre-wrap`}>
                      {line}
                    </div>
                  );
                })
              )}
              <div ref={terminalEndRef} />
            </div>
          </div>
        </div>

        {/* Live Visualization Column */}
        <div className="lg:col-span-4 flex flex-col gap-6 justify-between">
          {/* Latency wave visualizer */}
          <div className="glass-card rounded-2xl p-5 flex flex-col gap-4 flex-1">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-text-muted">
              <span className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-brand-orange animate-pulse" />
                Latency Waves
              </span>
              <span className="text-[10px] text-brand-orange font-medium animate-pulse">
                {isRunning ? 'Listening...' : 'Idle'}
              </span>
            </div>

            <div className="flex-1 flex flex-col justify-center items-center py-6">
              <div className="flex items-end gap-3.5 h-28 relative">
                {/* Visualizer center target metric */}
                {latencyPoints.length === 0 ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none text-text-muted">
                    <Clock className="w-8 h-8 text-border-muted mb-2 animate-bounce" />
                    <span className="text-xs font-bold">Waiting for packets</span>
                  </div>
                ) : (
                  latencyPoints.map((pt, idx) => {
                    let barColor = 'bg-emerald-500 shadow-emerald-500/20';
                    let barHeight = 'h-1/3';
                    if (pt.status === 'slow') {
                      barColor = 'bg-red-500 shadow-red-500/20';
                      barHeight = 'h-full';
                    } else if (pt.status === 'average') {
                      barColor = 'bg-amber-500 shadow-amber-500/20';
                      barHeight = 'h-2/3';
                    } else if (pt.status === 'timeout') {
                      barColor = 'bg-slate-700 border-2 border-dashed border-red-500/40';
                      barHeight = 'h-1.5';
                    } else {
                      // healthy speed
                      const clampedPercent = Math.min(Math.max((pt.time / 80) * 100, 15), 85);
                      barHeight = `h-[${clampedPercent}%]`;
                    }

                    return (
                      <div key={idx} className="flex flex-col items-center gap-2 group relative">
                        <motion.div
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          style={{ height: pt.status === 'timeout' ? '6px' : `${Math.min(Math.max((pt.time / 150) * 100, 15), 100)}px` }}
                          className={`w-6 rounded-md origin-bottom shadow-lg transition-all duration-500 ${barColor}`}
                        />
                        <span className="text-[10px] font-bold text-text-muted">
                          #{pt.seq}
                        </span>
                        
                        {/* Hover Tooltip */}
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-950 border border-slate-800 text-white text-[10px] py-1 px-2 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 shadow-xl whitespace-nowrap z-20">
                          {pt.status === 'timeout' ? 'Timed Out' : `${pt.time.toFixed(1)} ms`}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics Statistics Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card rounded-xl p-4 flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                Avg Latency
              </span>
              <span className="text-lg md:text-xl font-black text-foreground">
                {stats.avg}
              </span>
            </div>

            <div className="glass-card rounded-xl p-4 flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                Packet Loss
              </span>
              <span className={`text-lg md:text-xl font-black ${parseFloat(stats.loss) > 0 ? 'text-red-500' : 'text-foreground'}`}>
                {stats.loss}%
              </span>
            </div>

            <div className="glass-card rounded-xl p-4 flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1">
                <ArrowDown className="w-3.5 h-3.5 text-sky-400" />
                Min Speed
              </span>
              <span className="text-sm md:text-md font-bold text-foreground">
                {stats.min}
              </span>
            </div>

            <div className="glass-card rounded-xl p-4 flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1">
                <Server className="w-3.5 h-3.5 text-amber-400" />
                Max Speed
              </span>
              <span className="text-sm md:text-md font-bold text-foreground">
                {stats.max}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
