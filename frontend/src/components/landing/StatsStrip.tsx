import React from 'react';
import { Radio, Wifi, AlertTriangle, ShieldCheck, Info, CloudSun } from 'lucide-react';

export const StatsStrip: React.FC = () => {
  const stats = [
    {
      id: '01',
      value: '20',
      label: 'Demo Stations',
      description: 'Simulated across varied microclimatic terrain and topographical zones',
      icon: Radio,
      accentColor: 'text-sky-300',
      iconBg: 'bg-sky-500/10 border-sky-500/40 text-sky-300 shadow-[0_0_20px_rgba(56,189,248,0.2)]',
      borderGlow: 'hover:border-sky-400/60 hover:shadow-[0_10px_35px_rgba(56,189,248,0.2)]',
      cardBg: 'from-sky-950/40 via-[#0D162B] to-[#09101F]',
      statusText: '13 Synced Zones',
      statusColor: 'text-sky-300'
    },
    {
      id: '02',
      value: '15',
      label: 'Online Stations',
      description: 'Active continuous meteorological telemetry streams with sub-second polling',
      icon: Wifi,
      accentColor: 'text-emerald-300',
      iconBg: 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.2)]',
      borderGlow: 'hover:border-emerald-400/60 hover:shadow-[0_10px_35px_rgba(52,211,153,0.2)]',
      cardBg: 'from-emerald-950/40 via-[#0D162B] to-[#09101F]',
      statusText: 'Active 3s Stream',
      statusColor: 'text-emerald-400'
    },
    {
      id: '03',
      value: '4',
      label: 'Active Anomaly Examples',
      description: 'Synthetic edge-case fault injections: stuck ADC registers, spikes, calibration drift',
      icon: AlertTriangle,
      accentColor: 'text-amber-300',
      iconBg: 'bg-amber-500/10 border-amber-500/40 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.2)]',
      borderGlow: 'hover:border-amber-400/60 hover:shadow-[0_10px_35px_rgba(245,158,11,0.2)]',
      cardBg: 'from-amber-950/40 via-[#0D162B] to-[#09101F]',
      statusText: 'Squall vs Malfunction',
      statusColor: 'text-amber-400'
    },
    {
      id: '04',
      value: '98.6%',
      label: 'Demo System Health',
      description: 'Pipeline data-cleansing integrity & Clausius-Clapeyron thermodynamic scoring',
      icon: ShieldCheck,
      accentColor: 'text-indigo-300',
      iconBg: 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300 shadow-[0_0_20px_rgba(129,140,248,0.2)]',
      borderGlow: 'hover:border-indigo-400/60 hover:shadow-[0_10px_35px_rgba(129,140,248,0.2)]',
      cardBg: 'from-indigo-950/40 via-[#0D162B] to-[#09101F]',
      statusText: 'Validation Assured',
      statusColor: 'text-indigo-400'
    }
  ];

  return (
    <section id="monitoring" className="relative py-16 sm:py-24 border-b border-slate-800/80 overflow-hidden bg-slate-950/60">
      
      {/* Weather Radar Background Texture & Atmospheric Concentric Rings */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        {/* Radar concentric rings */}
        <div className="w-[450px] h-[450px] rounded-full border border-sky-500/10 absolute" />
        <div className="w-[750px] h-[750px] rounded-full border border-indigo-500/5 absolute" />
        <div className="w-[1050px] h-[1050px] rounded-full border border-sky-500/5 absolute" />
        
        {/* Radar crosshair grid */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-sky-500/10 to-transparent absolute" />
        <div className="h-full w-px bg-gradient-to-b from-transparent via-sky-500/10 to-transparent absolute" />
        
        {/* Atmospheric cloud auras */}
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-[140px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Prototype Environment Notice Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-12 pb-6 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <CloudSun className="w-4 h-4 text-amber-300" />
              <h3 className="text-base sm:text-lg font-bold text-white font-mono tracking-wide uppercase">
                Platform Statistics & Meteorological Matrix
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Live prototype telemetry demonstrating anomaly surveillance across simulated meteorological environments.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0D162B] border border-sky-500/30 text-[11px] text-slate-300 font-mono self-start sm:self-auto shadow-sm">
            <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>Prototype values only • Simulated demo measurements</span>
          </div>
        </div>

        {/* 4 Elevated Stat Cards Styled in Reference Card Architecture */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className={`group relative rounded-3xl bg-gradient-to-b ${stat.cardBg} border border-slate-800/90 p-6 sm:p-7 transition-all duration-300 transform hover:-translate-y-1.5 ${stat.borderGlow}`}
              >
                {/* Top Row: Weather Icon & Step/ID Badge */}
                <div className="flex items-center justify-between mb-5">
                  <div className={`p-3 rounded-2xl border ${stat.iconBg}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="w-7 h-7 rounded-full bg-slate-950 border border-slate-700 text-xs font-mono font-bold text-slate-300 flex items-center justify-center">
                    {stat.id}
                  </span>
                </div>

                {/* Big Metric Number */}
                <div className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight mb-2 group-hover:text-amber-300 transition-colors">
                  {stat.value}
                </div>

                {/* Metric Label */}
                <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-2 font-mono">
                  {stat.label}
                </h4>

                {/* Metric Description */}
                <p className="text-xs text-slate-400 font-normal leading-relaxed mb-4 min-h-[36px]">
                  {stat.description}
                </p>

                {/* Status Footer */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-500 uppercase tracking-wider">Status</span>
                  <span className={`font-semibold flex items-center gap-1.5 ${stat.statusColor}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                    {stat.statusText}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
