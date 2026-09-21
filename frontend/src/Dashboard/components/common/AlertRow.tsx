import React from 'react';
import { AlertTriangle, ArrowUpRight, Clock } from 'lucide-react';
import type { AnomalyAlert } from '../../types/dashboard.types';

interface AlertRowProps {
  alert: AnomalyAlert;
  onInvestigate?: (alert: AnomalyAlert) => void;
  compact?: boolean;
}

export const AlertRow: React.FC<AlertRowProps> = ({ alert, onInvestigate, compact = false }) => {
  const getSeverityBadge = (severity: AnomalyAlert['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.2)]';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(251,191,36,0.18)]';
      case 'MEDIUM':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/35';
      case 'LOW':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
    }
  };

  const getContainerStyle = (severity: AnomalyAlert['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-gradient-to-r from-[#24131b]/80 via-[#171428]/80 to-[#0e1529]/80 border-rose-500/35 hover:border-rose-400/70 hover:shadow-[0_4px_24px_rgba(244,63,94,0.15)]';
      case 'HIGH':
        return 'bg-gradient-to-r from-[#231b12]/80 via-[#161427]/80 to-[#0e1529]/80 border-amber-500/35 hover:border-amber-400/70 hover:shadow-[0_4px_24px_rgba(251,191,36,0.15)]';
      default:
        return 'bg-gradient-to-r from-[#121930]/80 via-[#0e1528]/80 to-[#0a101f]/80 border-slate-800/80 hover:border-sky-500/40 hover:shadow-[0_4px_20px_rgba(56,189,248,0.1)]';
    }
  };

  return (
    <div className={`p-4 rounded-2xl border transition-all duration-200 backdrop-blur-md relative overflow-hidden ${getContainerStyle(alert.severity)}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3.5">
          <div className={`p-2.5 rounded-xl mt-0.5 shrink-0 ${
            alert.severity === 'CRITICAL'
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/35 shadow-[0_0_12px_rgba(244,63,94,0.25)]'
              : alert.severity === 'HIGH'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/35 shadow-[0_0_12px_rgba(251,191,36,0.2)]'
              : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
          }`}>
            <AlertTriangle className="w-4 h-4" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-slate-300">{alert.id}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border font-mono ${getSeverityBadge(alert.severity)}`}>
                {alert.severity}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-900/80 text-sky-300 border border-slate-700/60 font-medium font-mono uppercase">
                {alert.sensor}
              </span>
              <span className="text-xs text-slate-400">• {alert.stationName} ({alert.stationId})</span>
            </div>

            <h4 className="text-sm font-semibold text-white tracking-tight">{alert.title}</h4>
            {!compact && (
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                {alert.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-300 font-mono">
              <div>
                <span className="text-slate-400">Observed: </span>
                <span className="font-bold text-rose-400">{alert.observedValue}</span>
              </div>
              <div>
                <span className="text-slate-400">Expected: </span>
                <span className="text-slate-200">{alert.expectedRange}</span>
              </div>
              <div className="flex items-center gap-1 text-slate-400">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{alert.detectedAt}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          {onInvestigate && (
            <button
              onClick={() => onInvestigate(alert)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-500/20 via-sky-500/20 to-sky-500/15 hover:from-indigo-500/30 hover:to-sky-500/30 text-sky-200 border border-sky-500/35 transition-all shadow-sm"
            >
              <span>Deep Triage</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-sky-300" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
