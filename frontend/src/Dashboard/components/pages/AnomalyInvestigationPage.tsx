import React, { useState } from 'react';
import {
  Clock,
  MapPin,
  CheckCircle2,
  Wrench,
  Cpu,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceDot,
} from 'recharts';
import { PageHeader } from '../common/PageHeader';
import { ChartWrapper } from '../common/ChartWrapper';
import type { AnomalyAlert, DashboardTab } from '../../types/dashboard.types';
import { MOCK_24H_HISTORY } from '../../data/mockStations';

interface AnomalyInvestigationPageProps {
  alert: AnomalyAlert;
  onNavigateTab: (tab: DashboardTab) => void;
}

export const AnomalyInvestigationPage: React.FC<AnomalyInvestigationPageProps> = ({
  alert,
  onNavigateTab,
}) => {
  const [ticketCreated, setTicketCreated] = useState(false);

  const historyData = MOCK_24H_HISTORY[alert.stationId] || MOCK_24H_HISTORY['AWS-003'] || MOCK_24H_HISTORY['AWS-001'];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Anomaly Investigation: ${alert.id}`}
        subtitle={`Multi-evidence forensic triage for ${alert.stationName} (${alert.stationId})`}
        badge="FORENSIC TRIAGE REPORT"
      />

      {/* Hero Alert Banner — Warm Coral-Red Atmospheric Styling */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#28131d]/90 via-[#181428]/85 to-[#090e1c]/95 border border-rose-500/40 backdrop-blur-md shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-rose-400/30 to-transparent" />

        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)] shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-rose-500/25 text-rose-300 border border-rose-500/40 uppercase font-mono shadow-[0_0_10px_rgba(244,63,94,0.2)]">
                {alert.severity} SEVERITY
              </span>
              <span className="font-mono text-xs text-slate-300">ID: {alert.id}</span>
              <span className="text-xs text-slate-400 font-mono">• {alert.location}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{alert.title}</h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">{alert.description}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0 self-end md:self-center">
          <div className="text-right font-mono hidden sm:block">
            <div className="text-xs text-slate-400">Observed vs Expected</div>
            <div className="text-sm font-bold text-rose-400">{alert.observedValue} <span className="text-slate-400 font-normal">vs {alert.expectedRange}</span></div>
          </div>

          <button
            onClick={() => setTicketCreated(true)}
            disabled={ticketCreated}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              ticketCreated
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_15px_rgba(52,211,153,0.2)] cursor-default'
                : 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white shadow-lg shadow-rose-500/30 hover:shadow-rose-500/50'
            }`}
          >
            {ticketCreated ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Ticket #TKT-8902 Dispatched</span>
              </>
            ) : (
              <>
                <Wrench className="w-4 h-4" />
                <span>Generate Dispatch Ticket</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3 Forensic Evidences Grid with Thematic Distinct Accents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Evidence 1: Historical Baseline Drift (Sky/Cyan accent) */}
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-[#111e38]/85 via-[#0e1628]/85 to-[#090e1c]/95 border border-sky-500/25 backdrop-blur-md shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-sky-400/20 to-transparent" />

          <div>
            <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider mb-2 font-mono">
              <Clock className="w-4 h-4" />
              <span>Evidence 1 • Historical Baseline</span>
            </div>
            <h3 className="text-sm font-bold text-white mb-2 tracking-tight">
              Sudden Spike Exceeding 10-Year Diurnal Maximum
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {alert.evidence.historical}
            </p>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-[#0a101f]/80 border border-slate-800/70 text-xs font-mono">
            <div className="flex justify-between text-slate-400 py-1 border-b border-slate-800/60">
              <span>Historical Mean (14:00):</span>
              <span className="text-slate-200">33.5°C</span>
            </div>
            <div className="flex justify-between text-slate-400 py-1 border-b border-slate-800/60">
              <span>3-Sigma Envelope:</span>
              <span className="text-slate-200">29.0°C - 36.5°C</span>
            </div>
            <div className="flex justify-between text-rose-400 py-1 font-bold">
              <span>Observed Outlier:</span>
              <span>48.6°C (+39.8%)</span>
            </div>
          </div>
        </div>

        {/* Evidence 2: Cross-Station Spatial Consensus (Soft Violet/Indigo accent) */}
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-[#181538]/85 via-[#0f142c]/85 to-[#090e1c]/95 border border-indigo-500/25 backdrop-blur-md shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-400/20 to-transparent" />

          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2 font-mono">
              <MapPin className="w-4 h-4" />
              <span>Evidence 2 • Spatial Consensus</span>
            </div>
            <h3 className="text-sm font-bold text-white mb-2 tracking-tight">
              Isolated Neighbor Outlier (0 of 3 Peers Match)
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {alert.evidence.crossStation}
            </p>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-[#0a101f]/80 border border-slate-800/70 text-xs font-mono">
            <div className="flex justify-between text-slate-400 py-1 border-b border-slate-800/60">
              <span>AWS-001 (Delhi):</span>
              <span className="text-emerald-400 font-semibold">33.2°C (Normal)</span>
            </div>
            <div className="flex justify-between text-slate-400 py-1 border-b border-slate-800/60">
              <span>AWS-004 (Jodhpur):</span>
              <span className="text-emerald-400 font-semibold">35.1°C (Normal)</span>
            </div>
            <div className="flex justify-between text-rose-400 py-1 font-bold">
              <span>AWS-003 (Target):</span>
              <span>48.6°C (Delta +13.5°C)</span>
            </div>
          </div>
        </div>

        {/* Evidence 3: Multi-Sensor Physical Consistency (Amber/Gold solar accent) */}
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-[#231b12]/85 via-[#0e1628]/85 to-[#090e1c]/95 border border-amber-500/25 backdrop-blur-md shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/20 to-transparent" />

          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2 font-mono">
              <Cpu className="w-4 h-4" />
              <span>Evidence 3 • Thermodynamic Coherence</span>
            </div>
            <h3 className="text-sm font-bold text-white mb-2 tracking-tight">
              Thermodynamic Constraint Violation
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {alert.evidence.physicalConsistency}
            </p>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-[#0a101f]/80 border border-slate-800/70 text-xs font-mono">
            <div className="flex justify-between text-slate-400 py-1 border-b border-slate-800/60">
              <span>Relative Humidity:</span>
              <span className="text-sky-300 font-semibold">94% (Near Saturation)</span>
            </div>
            <div className="flex justify-between text-slate-400 py-1 border-b border-slate-800/60">
              <span>Theoretical Dew Point:</span>
              <span className="text-slate-200">&gt; 45°C (Physically Unviable)</span>
            </div>
            <div className="flex justify-between text-amber-400 py-1 font-bold">
              <span>Diagnosis:</span>
              <span>Probe Error / Solar Radiation Shield Loss</span>
            </div>
          </div>
        </div>
      </div>

      {/* Forensic Time-Series Chart */}
      <ChartWrapper
        title="Forensic Time Series: Observed Sensor vs Diurnal Threshold Band"
        subtitle="Red marker indicates exact point of envelope transgression at 14:00."
        badge="TIMELINE OF FAULT"
        height={340}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={historyData} margin={{ top: 15, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1c253d" />
            <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit="°C" domain={[20, 52]} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0c1326',
                borderColor: '#334155',
                borderRadius: '0.75rem',
                color: '#f8fafc',
                fontSize: '12px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
              }}
            />
            <Line
              type="monotone"
              dataKey="temperature"
              stroke="#f43f5e"
              strokeWidth={3}
              name="Observed Temperature"
            />
            <ReferenceDot
              x="14:00"
              y={48.6}
              r={7}
              fill="#f43f5e"
              stroke="#ffffff"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>

      {/* Recommended Action / Next Steps Footer */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#111a31]/90 via-[#0e1628]/85 to-[#090e1c]/95 border border-slate-800/80 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">
            System Recommended Remedy
          </span>
          <p className="text-xs text-slate-200 font-medium mt-1">
            {alert.evidence.recommendedAction}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigateTab('cross-station')}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/35 flex items-center gap-1.5 transition-all shadow-sm"
          >
            <span>Inspect Spatial Correlation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onNavigateTab('maintenance')}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 flex items-center gap-1.5 transition-all shadow-sm"
          >
            <span>View All Tickets</span>
            <Wrench className="w-3.5 h-3.5 text-sky-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
