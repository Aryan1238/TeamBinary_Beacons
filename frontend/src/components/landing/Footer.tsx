import React from 'react';
import { CloudSun } from 'lucide-react';

export const Footer: React.FC = () => {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer id="about" className="border-t border-slate-200 bg-white text-slate-500 py-12 sm:py-16 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-200">
          {/* Brand Info */}
          <div className="space-y-2 max-w-sm">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sky-50 border border-sky-200 text-sky-600">
                <CloudSun className="w-4 h-4" />
              </div>
              <span className="font-bold text-base text-slate-900 tracking-tight">
                AWS <span className="text-sky-600">Intelligence</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-mono">
                Meteorological System
              </span>
            </div>
            <p className="text-slate-600 text-xs leading-relaxed">
              Intelligent Anomaly Detection and Telemetry Assurance for Automatic Weather Stations.
            </p>
          </div>

          {/* Quick Navigation Links */}
          <div className="flex flex-wrap items-center gap-6 sm:gap-8 font-medium text-slate-600">
            <button
              onClick={() => scrollTo('overview')}
              className="hover:text-sky-600 transition-colors cursor-pointer"
            >
              Overview
            </button>
            <button
              onClick={() => scrollTo('technology')}
              className="hover:text-sky-600 transition-colors cursor-pointer"
            >
              Technology
            </button>
            <button
              onClick={() => scrollTo('monitoring')}
              className="hover:text-sky-600 transition-colors cursor-pointer"
            >
              Monitoring
            </button>
            <button
              onClick={() => scrollTo('about')}
              className="hover:text-sky-600 transition-colors cursor-pointer"
            >
              About
            </button>
          </div>

          {/* Explicit Prototype Tag */}
          <div className="px-3.5 py-1.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-800 text-[11px] font-mono flex items-center gap-2 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Operational • Multi-Station Mesh</span>
          </div>
        </div>

        {/* Bottom Details & Attribution */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500 font-mono">
          <p>
            SkyGuard AI • All telemetry metrics and station signals are backed by live API and historical calibration datasets.
          </p>
          <p className="shrink-0">
            AWS Intelligence Surveillance Platform
          </p>
        </div>

      </div>
    </footer>
  );
};
