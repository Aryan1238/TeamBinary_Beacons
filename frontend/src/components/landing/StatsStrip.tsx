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
      accentColor: 'text-sky-600',
      iconBg: 'bg-sky-50 border-sky-200 text-sky-600 shadow-xs',
      borderGlow: 'hover:border-sky-300 hover:shadow-md',
      cardBg: 'bg-white',
      statusText: '13 Synced Zones',
      statusColor: 'text-sky-700'
    },
    {
      id: '02',
      value: '15',
      label: 'Online Stations',
      description: 'Active continuous meteorological telemetry streams with sub-second polling',
      icon: Wifi,
      accentColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-xs',
      borderGlow: 'hover:border-emerald-300 hover:shadow-md',
      cardBg: 'bg-white',
      statusText: 'Active 3s Stream',
      statusColor: 'text-emerald-700'
    },
    {
      id: '03',
      value: '4',
      label: 'Active Anomaly Examples',
      description: 'Synthetic edge-case fault injections: stuck ADC registers, spikes, calibration drift',
      icon: AlertTriangle,
      accentColor: 'text-amber-600',
      iconBg: 'bg-amber-50 border-amber-200 text-amber-600 shadow-xs',
      borderGlow: 'hover:border-amber-300 hover:shadow-md',
      cardBg: 'bg-white',
      statusText: 'Squall vs Malfunction',
      statusColor: 'text-amber-700'
    },
    {
      id: '04',
      value: '98.6%',
      label: 'Demo System Health',
      description: 'Pipeline data-cleansing integrity & Clausius-Clapeyron thermodynamic scoring',
      icon: ShieldCheck,
      accentColor: 'text-indigo-600',
      iconBg: 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-xs',
      borderGlow: 'hover:border-indigo-300 hover:shadow-md',
      cardBg: 'bg-white',
      statusText: 'Validation Assured',
      statusColor: 'text-indigo-700'
    }
  ];

  return (
    <section id="monitoring" className="relative py-16 sm:py-24 border-b border-slate-200 overflow-hidden bg-slate-50">
      
      {/* Weather Radar Background Texture & Concentric Rings */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-[450px] h-[450px] rounded-full border border-sky-100 absolute" />
        <div className="w-[750px] h-[750px] rounded-full border border-slate-200 absolute" />
        <div className="w-[1050px] h-[1050px] rounded-full border border-slate-100 absolute" />
        
        <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent absolute" />
        <div className="h-full w-px bg-gradient-to-b from-transparent via-slate-200 to-transparent absolute" />
        
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-sky-100/40 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-blue-50/50 rounded-full blur-[140px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Prototype Environment Notice Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-12 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <CloudSun className="w-4 h-4 text-amber-500" />
              <h3 className="text-base sm:text-lg font-bold text-slate-900 font-mono tracking-wide uppercase">
                Platform Statistics & Meteorological Matrix
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Live prototype telemetry demonstrating anomaly surveillance across simulated meteorological environments.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-600 font-mono self-start sm:self-auto shadow-xs">
            <Info className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <span>Prototype values only • Simulated demo measurements</span>
          </div>
        </div>

        {/* 4 Elevated Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className={`group relative rounded-3xl ${stat.cardBg} border border-slate-200 p-6 sm:p-7 transition-all duration-300 transform hover:-translate-y-1.5 shadow-sm ${stat.borderGlow}`}
              >
                {/* Top Row: Weather Icon & Step/ID Badge */}
                <div className="flex items-center justify-between mb-5">
                  <div className={`p-3 rounded-2xl border ${stat.iconBg}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="w-7 h-7 rounded-full bg-slate-100 border border-slate-300 text-xs font-mono font-bold text-slate-700 flex items-center justify-center">
                    {stat.id}
                  </span>
                </div>

                {/* Big Metric Number */}
                <div className="text-4xl sm:text-5xl font-black text-slate-900 font-mono tracking-tight mb-2 group-hover:text-sky-700 transition-colors">
                  {stat.value}
                </div>

                {/* Metric Label */}
                <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2 font-mono">
                  {stat.label}
                </h4>

                {/* Metric Description */}
                <p className="text-xs text-slate-500 font-normal leading-relaxed mb-4 min-h-[36px]">
                  {stat.description}
                </p>

                {/* Status Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400 uppercase tracking-wider">Status</span>
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
