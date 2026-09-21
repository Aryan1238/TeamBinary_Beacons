import React from 'react';
import { ArrowRight, ChevronDown, CloudSun } from 'lucide-react';
import { NetworkVisual } from './NetworkVisual';

interface HeroProps {
  onOpenDashboard: () => void;
  onExploreSystem: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenDashboard, onExploreSystem }) => {
  return (
    <section className="relative overflow-hidden pt-8 pb-16 sm:pt-14 sm:pb-24 border-b border-slate-800/80">
      
      {/* Atmospheric Weather Background: Morning Sun Dawn Glow + Storm Clouds */}
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-br from-amber-500/10 via-sky-500/15 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-gradient-to-bl from-indigo-600/15 via-sky-600/10 to-transparent rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-36 bg-gradient-to-t from-[#0B132B] to-transparent pointer-events-none" />
      
      {/* Subtle Atmospheric Isobar / Cloud Texture Lines */}
      <div 
        className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(245,158,11,0.06)_0%,transparent_50%),radial-gradient(circle_at_80%_60%,rgba(56,189,248,0.08)_0%,transparent_50%)] pointer-events-none" 
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Headlines & Call-to-Actions */}
          <div className="lg:col-span-6 text-left space-y-6">
            
            {/* Small Badge Above Heading */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-950/70 via-sky-950/70 to-indigo-950/70 border border-amber-500/30 text-amber-300 text-xs font-semibold shadow-[0_0_20px_rgba(245,158,11,0.15)]">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
              </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-sky-200 to-indigo-200">
                SIH 2026 • Automatic Weather Station Intelligence
              </span>
            </div>

            {/* Large Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
              Intelligent Anomaly Detection{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-sky-300 to-indigo-300">
                for Automatic Weather Stations
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal max-w-xl">
              Real-time monitoring, historical intelligence, and automated anomaly detection for reliable weather-station data.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <button
                onClick={onOpenDashboard}
                className="group inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-sky-600 via-indigo-600 to-slate-800 hover:from-sky-500 hover:via-indigo-500 hover:to-slate-700 text-white font-bold text-sm sm:text-base border border-sky-400/40 shadow-[0_0_30px_rgba(56,189,248,0.3)] hover:shadow-[0_0_40px_rgba(56,189,248,0.5)] transition-all duration-200 active:scale-95 cursor-pointer"
              >
                <span>Open Monitoring Dashboard</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-mono font-normal border border-amber-400/40">
                  Coming Soon
                </span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </button>

              <button
                onClick={onExploreSystem}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#0E172C]/80 hover:bg-[#131E3A] text-slate-200 hover:text-white border border-slate-700 hover:border-sky-400/50 text-sm sm:text-base font-semibold transition-all duration-200 cursor-pointer"
              >
                <span>Explore the System</span>
                <ChevronDown className="w-4 h-4 text-sky-300" />
              </button>
            </div>

            {/* Live Monitoring System Communicator Badge */}
            <div className="pt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Simulated Network: <strong className="text-slate-200">20 AWS Nodes Active</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <CloudSun className="w-3.5 h-3.5 text-amber-400" />
                <span>Cadence: <strong className="text-slate-200">Continuous 3s Telemetry Cycle</strong></span>
              </div>
            </div>

          </div>

          {/* Right Column: Dynamic Network / Station Visualization */}
          <div className="lg:col-span-6 w-full flex justify-center">
            <NetworkVisual />
          </div>

        </div>
      </div>
    </section>
  );
};
