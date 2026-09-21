import React, { useState, useEffect } from 'react';
import { Activity, Clock, ShieldCheck, ArrowLeft } from 'lucide-react';

interface DashboardHeaderProps {
  onBackToLanding?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onBackToLanding }) => {
  const [operationalTime, setOperationalTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setOperationalTime(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }) + ' IST'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="border-b border-slate-800 bg-[#0A101D] px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 select-none">
      {/* Brand & Title */}
      <div className="flex items-center gap-3">
        {onBackToLanding && (
          <button
            onClick={onBackToLanding}
            title="Return to Landing Page"
            className="px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors border border-slate-700/80 flex items-center gap-1.5 text-xs font-mono"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Landing Page</span>
          </button>
        )}
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 shadow-sm">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white font-sans">
              AWS Monitoring Command Center
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-md bg-cyan-950/90 text-cyan-300 border border-cyan-500/30 font-mono">
              SIH 2026
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono hidden sm:block">
            Phase 1 Prototype • Foundation Dashboard Architecture
          </p>
        </div>
      </div>

      {/* Right Side: Network Status & Operational Time */}
      <div className="flex items-center gap-3 sm:gap-4 text-xs font-mono">
        {/* Active Monitored Network Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
          </span>
          <span className="font-semibold tracking-wide">Active Monitored Network</span>
        </div>

        {/* Operational Clock */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span className="tracking-wider">{operationalTime || 'SYNCHRONIZING...'}</span>
        </div>

        {/* Phase Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>PHASE 1 ACTIVE</span>
        </div>
      </div>
    </header>
  );
};
