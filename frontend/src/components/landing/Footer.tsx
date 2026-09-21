import React from 'react';
import { CloudSun } from 'lucide-react';

export const Footer: React.FC = () => {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer id="about" className="border-t border-slate-800/80 bg-[#070D1C] text-slate-400 py-12 sm:py-16 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-800/80">
          {/* Brand Info */}
          <div className="space-y-2 max-w-sm">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 text-amber-300">
                <CloudSun className="w-4 h-4" />
              </div>
              <span className="font-bold text-base text-white tracking-tight">
                AWS <span className="text-sky-400">Intelligence</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-sky-950/80 text-sky-300 border border-sky-500/30 text-[10px] font-mono">
                SIH 2026 Prototype
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Intelligent Anomaly Detection and Telemetry Assurance for Automatic Weather Stations.
            </p>
          </div>

          {/* Quick Navigation Links */}
          <div className="flex flex-wrap items-center gap-6 sm:gap-8 font-medium text-slate-300">
            <button
              onClick={() => scrollTo('overview')}
              className="hover:text-amber-300 transition-colors cursor-pointer"
            >
              Overview
            </button>
            <button
              onClick={() => scrollTo('technology')}
              className="hover:text-amber-300 transition-colors cursor-pointer"
            >
              Technology
            </button>
            <button
              onClick={() => scrollTo('monitoring')}
              className="hover:text-amber-300 transition-colors cursor-pointer"
            >
              Monitoring
            </button>
            <button
              onClick={() => scrollTo('about')}
              className="hover:text-amber-300 transition-colors cursor-pointer"
            >
              About
            </button>
          </div>

          {/* Explicit Prototype Tag */}
          <div className="px-3.5 py-1.5 rounded-lg bg-[#0F1A33] border border-sky-500/30 text-sky-300 text-[11px] font-mono flex items-center gap-2 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span>Prototype • Simulated Data</span>
          </div>
        </div>

        {/* Bottom Details & Attribution */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500 font-mono">
          <p>
            Smart India Hackathon 2026 • Problem Statement 26073 • All telemetry metrics and station signals are simulated demo models.
          </p>
          <p className="shrink-0">
            AWS Intelligence Surveillance Platform
          </p>
        </div>

      </div>
    </footer>
  );
};
