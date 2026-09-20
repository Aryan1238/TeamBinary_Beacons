import React, { useState } from 'react';
import {
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  Sliders,
  ShieldCheck,
  BrainCircuit,
  Eye,
  Check,
  Info
} from 'lucide-react';
import { AnomalyRecord } from '../types';

interface AnomalyCenterPageProps {
  anomalies: AnomalyRecord[];
  onInvestigateAnomaly: (anomaly: AnomalyRecord) => void;
  onAcceptCorrection: (anomalyId: string) => void;
}

export const AnomalyCenterPage: React.FC<AnomalyCenterPageProps> = ({
  anomalies,
  onInvestigateAnomaly,
  onAcceptCorrection
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [parameterFilter, setParameterFilter] = useState('All');

  const filtered = anomalies.filter(ano => {
    const matchesSearch =
      ano.station_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ano.station_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ano.parameter.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSev = severityFilter === 'All' || ano.severity === severityFilter;
    const matchesParam = parameterFilter === 'All' || ano.parameter.toLowerCase() === parameterFilter.toLowerCase();
    return matchesSearch && matchesSev && matchesParam;
  });

  const criticalCount = anomalies.filter(a => a.severity === 'CRITICAL').length;
  const warningCount = anomalies.filter(a => a.severity === 'WARNING').length;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Real-Time Anomaly Triage Center
            </h1>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-300 font-semibold">
              {anomalies.length} ACTIVE INCIDENTS
            </span>
          </div>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Automated spatial-temporal and physical boundary triage across reporting Indian AWS locations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 flex items-center gap-2 text-xs font-sans shadow-xs">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span className="text-slate-500">Critical:</span>
            <span className="font-bold text-red-600">{criticalCount}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 flex items-center gap-2 text-xs font-sans shadow-xs">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span className="text-slate-500">Warnings:</span>
            <span className="font-bold text-amber-600">{warningCount}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by location, station ID, or parameter..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-cyan-500 focus:bg-white transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-sans">
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
            <span className="text-slate-500 px-2 text-[10px] uppercase font-semibold">Severity:</span>
            {['All', 'CRITICAL', 'WARNING'].map(sev => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2.5 py-1 rounded transition text-[11px] ${
                  severityFilter === sev
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {sev === 'All' ? 'All' : (sev === 'CRITICAL' ? 'Critical' : 'Warning')}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
            <span className="text-slate-500 px-2 text-[10px] uppercase font-semibold">Param:</span>
            {['All', 'Temperature', 'Pressure', 'Humidity'].map(p => (
              <button
                key={p}
                onClick={() => setParameterFilter(p)}
                className={`px-2.5 py-1 rounded transition text-[11px] ${
                  parameterFilter === p
                    ? 'bg-cyan-600 text-white font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Anomalies Table / Feed */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-3.5">Time</th>
                <th className="p-3.5">Location</th>
                <th className="p-3.5">Parameter</th>
                <th className="p-3.5">Observed</th>
                <th className="p-3.5">Expected</th>
                <th className="p-3.5">Reason / Deviation</th>
                <th className="p-3.5">Severity</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">AI Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2.5">
                      <div className="p-3 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <span className="font-bold text-slate-900 text-sm">No Active Anomalies Detected</span>
                      <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                        All live Open-Meteo observations across the monitored Indian locations currently satisfy terrestrial physical limits and spatial neighbor consensus.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((ano) => {
                  const isCrit = ano.severity === 'CRITICAL';

                  return (
                    <tr
                      key={ano.id}
                      onClick={() => onInvestigateAnomaly(ano)}
                      className="hover:bg-slate-50 cursor-pointer transition"
                    >
                      <td className="p-3.5 font-mono text-slate-500">{ano.timestamp}</td>
                      <td className="p-3.5 font-bold text-slate-900">
                        {ano.station_name}
                        <span className="block text-[10px] font-mono text-slate-400 font-normal">{ano.station_id}</span>
                      </td>
                      <td className="p-3.5 font-semibold text-slate-700">{ano.parameter}</td>
                      <td className="p-3.5 font-mono font-bold text-red-600">{ano.observed_value}</td>
                      <td className="p-3.5 font-mono text-slate-500">{ano.expected_value}</td>
                      <td className="p-3.5 text-slate-600 max-w-xs truncate" title={ano.explanation}>
                        {ano.explanation || `Departure of ${ano.deviation > 0 ? `+${ano.deviation}` : ano.deviation} from baseline.`}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${
                          isCrit
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {ano.severity}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`text-[11px] font-semibold ${ano.accepted_correction ? 'text-emerald-600' : 'text-slate-600'}`}>
                          {ano.accepted_correction ? 'Imputed' : 'Active'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onInvestigateAnomaly(ano);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 text-xs font-semibold inline-flex items-center gap-1 transition shadow-2xs"
                        >
                          <BrainCircuit className="w-3.5 h-3.5 text-cyan-700" />
                          <span>View AI Explanation</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
