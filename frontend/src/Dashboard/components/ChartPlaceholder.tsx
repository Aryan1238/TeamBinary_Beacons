import React from 'react';
import { LineChart } from 'lucide-react';

export const ChartPlaceholder: React.FC = () => {
  return (
    <div className="dashboard-card p-6 select-none flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400">
            <LineChart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Interactive Telemetry Charts
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Temporal Sensor Observation Graphs
            </p>
          </div>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-sky-950/70 border border-sky-500/30 text-sky-400 text-[10px] font-mono font-semibold">
          PLANNED FOR PHASE 3
        </span>
      </div>

      {/* Placeholder visual area */}
      <div className="dashboard-placeholder rounded-xl p-8 flex flex-col items-center justify-center text-center my-auto min-h-[220px]">
        <div className="w-12 h-12 rounded-2xl bg-slate-900/90 border border-slate-700/80 flex items-center justify-center text-sky-400 mb-3 shadow-inner">
          <LineChart className="w-6 h-6 opacity-80" />
        </div>
        <h4 className="text-sm font-bold text-white mb-1">
          Interactive Sensor Telemetry Visualization
        </h4>
        <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-4">
          Multi-axis time-series visualization for Temperature, Humidity, Pressure, and Wind will be integrated in Phase 3.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono text-slate-400">
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">Temp (°C)</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">Humidity (%)</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">Pressure (hPa)</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">Wind (km/h)</span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span>Architectural Reservation</span>
        <span className="text-sky-400">Phase 3: Charting Module</span>
      </div>
    </div>
  );
};
