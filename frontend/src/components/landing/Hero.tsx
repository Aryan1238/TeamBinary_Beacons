import React from 'react';
import { ArrowRight, ChevronDown, CloudSun } from 'lucide-react';
import { NetworkVisual } from './NetworkVisual';

interface HeroProps {
  onOpenDashboard: () => void;
  onExploreSystem: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenDashboard, onExploreSystem }) => {
  return (
    <section className="relative overflow-hidden pt-8 pb-16 sm:pt-14 sm:pb-24 border-b border-slate-200">
      
      {/* Atmospheric Weather Background: Light sky glow */}
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-br from-sky-100/60 via-blue-50/40 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-gradient-to-bl from-sky-200/40 via-indigo-50/30 to-transparent rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-36 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none" />
      
      {/* Subtle Atmospheric Isobar / Cloud Texture Lines */}
      <div 
        className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(2,132,199,0.04)_0%,transparent_50%),radial-gradient(circle_at_80%_60%,rgba(14,165,233,0.05)_0%,transparent_50%)] pointer-events-none" 
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Headlines & Call-to-Actions */}
          <div className="lg:col-span-6 text-left space-y-6">
            
            {/* Small Badge Above Heading */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-xs font-semibold shadow-xs">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-600"></span>
              </span>
              <span className="text-sky-900">
                Autonomous Weather Station Intelligence
              </span>
            </div>

            {/* Large Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
              Intelligent Anomaly Detection for Automatic Weather <span className="text-sky-600">Stations</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal max-w-xl">
              Real-time monitoring, historical intelligence, and automated anomaly detection for reliable weather-station data.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <button
                onClick={onOpenDashboard}
                className="group inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm sm:text-base border border-sky-600 shadow-sm hover:shadow-md transition-all duration-200 active:scale-95 cursor-pointer"
              >
                <span>Open Monitoring Dashboard</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </button>

              <button
                onClick={onExploreSystem}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-300 hover:border-slate-400 text-sm sm:text-base font-semibold transition-all duration-200 shadow-xs cursor-pointer"
              >
                <span>Explore the System</span>
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Live Monitoring System Communicator Badge */}
            <div className="pt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-mono text-slate-500">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
                <span>Simulated Network: <strong className="text-slate-800">20 AWS Nodes Active</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <CloudSun className="w-3.5 h-3.5 text-sky-600" />
                <span>Cadence: <strong className="text-slate-800">Continuous 3s Telemetry Cycle</strong></span>
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
