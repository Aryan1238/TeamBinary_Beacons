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
    <header className="border-b border-slate-200 bg-white px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 select-none shadow-xs">
      {/* Brand & Title */}
      <div className="flex items-center gap-3">
        {onBackToLanding && (
          <button
            onClick={onBackToLanding}
            title="Return to Landing Page"
            className="px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200 flex items-center gap-1.5 text-xs font-mono"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-sky-600" />
            <span className="hidden sm:inline">Landing Page</span>
          </button>
        )}
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-sky-50 border border-sky-200 text-sky-600 shadow-xs">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 font-sans">
              AWS Monitoring Command Center
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-md bg-sky-50 text-sky-700 border border-sky-200 font-mono">
              OPERATIONAL
            </span>
          </div>
          <p className="text-xs text-slate-500 font-mono hidden sm:block">
            Phase 1 Prototype • Foundation Dashboard Architecture
          </p>
        </div>
      </div>

      {/* Right Side: Network Status & Operational Time */}
      <div className="flex items-center gap-3 sm:gap-4 text-xs font-mono">
        {/* Active Monitored Network Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 shadow-2xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold tracking-wide">Active Monitored Network</span>
        </div>

        {/* Operational Clock */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
          <Clock className="w-3.5 h-3.5 text-sky-600" />
          <span className="tracking-wider">{operationalTime || 'SYNCHRONIZING...'}</span>
        </div>

        {/* Phase Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
          <span>PHASE 1 ACTIVE</span>
        </div>
      </div>
    </header>
  );
};
