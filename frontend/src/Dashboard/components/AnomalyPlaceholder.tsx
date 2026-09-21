import React from 'react';
import { ShieldAlert, Cpu } from 'lucide-react';

export const AnomalyPlaceholder: React.FC = () => {
  return (
    <div className="dashboard-card p-6 select-none flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Intelligent Anomaly Detection
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Sensor Malfunction vs Weather Event Discrimination
            </p>
          </div>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-amber-950/70 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-semibold">
          PLANNED FOR PHASE 4
        </span>
      </div>

      {/* Placeholder visual area */}
      <div className="dashboard-placeholder rounded-xl p-8 flex flex-col items-center justify-center text-center my-auto min-h-[220px]">
        <div className="w-12 h-12 rounded-2xl bg-slate-900/90 border border-slate-700/80 flex items-center justify-center text-amber-400 mb-3 shadow-inner">
          <Cpu className="w-6 h-6 opacity-80" />
        </div>
        <h4 className="text-sm font-bold text-white mb-1">
          Automated Anomaly Detection Engine
        </h4>
        <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-4">
          Machine learning algorithms (Isolation Forest, spatial-temporal rate checks, stuck ADC identification) will be integrated in Phase 4.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono text-slate-400">
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">Temporal Rate</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">Spatial Neighbors</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">Thermodynamics</span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span>Architectural Reservation</span>
        <span className="text-amber-400">Phase 4: ML Anomaly Pipeline</span>
      </div>
    </div>
  );
};
