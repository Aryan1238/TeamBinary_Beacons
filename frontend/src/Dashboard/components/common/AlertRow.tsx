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
        return 'bg-red-50 text-red-700 border-red-200';
      case 'HIGH':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'MEDIUM':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'LOW':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getContainerStyle = (severity: AnomalyAlert['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-white border-red-200 hover:border-red-400 hover:shadow-md hover:shadow-red-500/10';
      case 'HIGH':
        return 'bg-white border-orange-200 hover:border-orange-400 hover:shadow-md hover:shadow-orange-500/10';
      case 'MEDIUM':
        return 'bg-white border-amber-200 hover:border-amber-400 hover:shadow-md hover:shadow-amber-500/10';
      default:
        return 'bg-white border-slate-200 hover:border-sky-300 hover:shadow-md hover:shadow-sky-500/10';
    }
  };

  return (
    <div className={`p-4 rounded-2xl border transition-all duration-200 shadow-2xs relative overflow-hidden ${getContainerStyle(alert.severity)}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3.5">
          <div className={`p-2.5 rounded-xl mt-0.5 shrink-0 ${
            alert.severity === 'CRITICAL'
              ? 'bg-red-50 text-red-600 border border-red-200'
              : alert.severity === 'HIGH'
              ? 'bg-orange-50 text-orange-600 border border-orange-200'
              : 'bg-amber-50 text-amber-600 border border-amber-200'
          }`}>
            <AlertTriangle className="w-4 h-4" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-slate-500">{alert.id}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border font-mono ${getSeverityBadge(alert.severity)}`}>
                {alert.severity}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 font-medium font-mono uppercase">
                {alert.sensor}
              </span>
              <span className="text-xs text-slate-500">• {alert.stationName} ({alert.stationId})</span>
              {alert.investigation?.trigger_source && alert.investigation.trigger_source.length > 0 && (
                <div className="flex flex-wrap items-center gap-1">
                  {alert.investigation.trigger_source.map((src) => (
                    <span
                      key={src}
                      className="px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold bg-sky-50 text-sky-700 border border-sky-200"
                    >
                      {src}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <h4 className="text-sm font-semibold text-slate-900 tracking-tight">{alert.title}</h4>
            {!compact && (
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                {alert.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500 font-mono">
              <div>
                <span className="text-slate-400">Observed: </span>
                <span className="font-bold text-red-600">{alert.observedValue}</span>
              </div>
              <div>
                <span className="text-slate-400">Expected: </span>
                <span className="text-slate-700">{alert.expectedRange}</span>
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
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 transition-all shadow-2xs"
            >
              <span>Deep Triage</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-sky-700" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
