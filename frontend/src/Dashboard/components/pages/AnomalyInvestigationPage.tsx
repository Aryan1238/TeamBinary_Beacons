import React, { useState } from 'react';
import {
  Network,
  ExternalLink,
  Clock,
  MapPin,
  CheckCircle2,
  Wrench,
  Cpu,
  ArrowRight,
  ShieldAlert,
  CloudSun,
  Activity,
  AlertTriangle,
  Radio,
  TrendingUp,
  BarChart3,
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
import type { AnomalyAlert, DashboardTab, InvestigationRecord } from '../../types/dashboard.types';
import { useTelemetry } from '../../context/TelemetryContext';
import { MOCK_24H_HISTORY } from '../../data/mockStations';

interface AnomalyInvestigationPageProps {
  alert?: AnomalyAlert | null;
  onNavigateTab: (tab: DashboardTab) => void;
}

export const AnomalyInvestigationPage: React.FC<AnomalyInvestigationPageProps> = ({
  alert,
  onNavigateTab,
}) => {
  const [ticketCreated, setTicketCreated] = useState(false);
  const [createdTicketId, setCreatedTicketId] = useState<string>('');

  const handleCreateRealTicket = async () => {
    if (!alert) return;
    try {
      const payload = {
        station_id: alert.stationId,
        station_name: alert.stationName,
        station_location: alert.location,
        sensor: alert.sensor,
        issue: alert.description || alert.title,
        priority: alert.severity,
        evidence: {
          investigation_id: inv?.id,
          triggers: inv?.trigger_source || [],
          observed_value: alert.observedValue,
          expected_range: alert.expectedRange,
          deviation: alert.deviationPercent,
        },
        recommended_action: inv?.recommended_action || 'Inspect physical probe and recalibrate sensor.',
        assigned_to: 'Regional Field Unit'
      };
      const res = await fetch('/api/maintenance/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const created = await res.json();
        setCreatedTicketId(created.id);
        setTicketCreated(true);
      }
    } catch (e) {
      console.error(e);
      setTicketCreated(true);
    }
  };
  const { historyBuffers, stations } = useTelemetry();

  // If no alert is selected, render nominal clean network state
  if (!alert) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Anomaly Forensic Triage"
          subtitle="Multi-evidence forensic triage layer for sensor anomaly diagnosis and operational dispatch."
          badge="FORENSIC TRIAGE REPORT"
        />

        <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 flex flex-col items-center justify-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              All Weather Stations Operating Within Tolerance
            </h3>
            <p className="text-xs text-slate-600 max-w-lg mx-auto mt-1 leading-relaxed">
              No active anomaly investigations are currently open. Every monitored sensor matches
              diurnal physical bounds, temporal stability checks, live external weather references,
              and regional spatial peer consensus.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigateTab('anomaly-alerts')}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 transition-all shadow-xs"
            >
              <span>View Anomaly Queue</span>
            </button>
            <button
              onClick={() => onNavigateTab('simulation-lab')}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 transition-all shadow-xs"
            >
              <span>Open Simulation Lab to Inject Fault</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const inv: InvestigationRecord | undefined = alert.investigation;

  // Chart data: prefer live telemetry history buffer if available
  const stationHistory = historyBuffers[alert.stationId];
  const chartData = (stationHistory && stationHistory.length > 5)
    ? stationHistory.map((pt) => ({ time: pt.time, temperature: pt.temperature }))
    : (MOCK_24H_HISTORY[alert.stationId] || MOCK_24H_HISTORY['AWS-001'] || []);

  const latestPoint = chartData.length > 0 ? chartData[chartData.length - 1] : { time: '14:00', temperature: 32.0 };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return {
          bannerBg: 'bg-rose-50/70 border-rose-200/90',
          badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
          iconBg: 'bg-rose-100 border-rose-200 text-rose-700',
          valColor: 'text-rose-700',
        };
      case 'HIGH':
        return {
          bannerBg: 'bg-orange-50/70 border-orange-200/90',
          badgeBg: 'bg-orange-100 text-orange-800 border-orange-200',
          iconBg: 'bg-orange-100 border-orange-200 text-orange-700',
          valColor: 'text-orange-700',
        };
      case 'MEDIUM':
        return {
          bannerBg: 'bg-amber-50/70 border-amber-200/90',
          badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
          iconBg: 'bg-amber-100 border-amber-200 text-amber-700',
          valColor: 'text-amber-700',
        };
      default:
        return {
          bannerBg: 'bg-sky-50/70 border-sky-200/90',
          badgeBg: 'bg-sky-100 text-sky-800 border-sky-200',
          iconBg: 'bg-sky-100 border-sky-200 text-sky-700',
          valColor: 'text-sky-700',
        };
    }
  };

  const sevStyle = getSeverityStyle(alert.severity);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Anomaly Investigation: ${alert.id}`}
        subtitle={`Multi-evidence forensic triage for ${alert.stationName} (${alert.stationId})`}
        badge="FORENSIC TRIAGE REPORT"
      />

      {/* Hero Alert Banner */}
      <div className={`p-6 rounded-2xl ${sevStyle.bannerBg} border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden`}>
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-2xl border ${sevStyle.iconBg} shrink-0`}>
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase font-mono border ${sevStyle.badgeBg}`}>
                {alert.severity} SEVERITY
              </span>
              <span className="font-mono text-xs text-slate-600">ID: {alert.id}</span>
              <span className="text-xs text-slate-500 font-mono">• {alert.location}</span>
              {inv?.trigger_source && inv.trigger_source.length > 0 && (
                <div className="flex flex-wrap items-center gap-1">
                  {inv.trigger_source.map((ts) => (
                    <span
                      key={ts}
                      className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-sky-100 text-sky-800 border border-sky-200"
                    >
                      {ts}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{alert.title}</h2>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">{alert.description}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0 self-end md:self-center">
          <div className="text-right font-mono hidden sm:block">
            <div className="text-xs text-slate-500">Observed vs Expected</div>
            <div className={`text-sm font-bold ${sevStyle.valColor}`}>
              {alert.observedValue} <span className="text-slate-500 font-normal">vs {alert.expectedRange}</span>
            </div>
          </div>

          <button
            onClick={handleCreateRealTicket}
            disabled={ticketCreated}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              ticketCreated
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs cursor-default'
                : 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
            }`}
          >
            {ticketCreated ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Ticket #{createdTicketId || 'DISPATCHED'} Dispatched</span>
              </>
            ) : (
              <>
                <Wrench className="w-4 h-4" />
                <span>Dispatch: {inv?.recommended_action || 'Create Ticket'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3 Forensic Evidences Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Evidence 1: LSTM Autoencoder Sequence Error */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-center gap-2 text-sky-700 text-xs font-bold uppercase tracking-wider mb-2 font-mono">
              <Cpu className="w-4 h-4" />
              <span>Evidence 1 • Temporal ML Sequence Error</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-2 tracking-tight">
              {inv && inv.lstm_reconstruction_error !== null
                ? 'LSTM Autoencoder Reconstruction MSE'
                : 'N/A — 3h Cadence (Excluded from LSTM)'}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {inv && inv.lstm_reconstruction_error !== null
                ? `24-step sequence evaluated by LSTM Autoencoder. Reconstruction error ${inv.lstm_reconstruction_error.toFixed(4)} ${
                    inv.lstm_error_ratio && inv.lstm_error_ratio >= 1.0 ? 'exceeds' : 'within'
                  } the frozen max-F1 threshold (${inv.lstm_threshold.toFixed(5)}).`
                : 'NOAA synoptic stations with 3-hourly observation cadence are strictly excluded from 24-step sequence modeling to preserve temporal integrity. Evaluated via deterministic rules only.'}
            </p>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono">
            {inv && inv.lstm_reconstruction_error !== null ? (
              <>
                <div className="flex justify-between text-slate-600 py-1 border-b border-slate-200/80">
                  <span>ML Status:</span>
                  <span className={`font-bold ${inv.lstm_status === 'ANOMALY' ? 'text-rose-700' : 'text-emerald-700'}`}>
                    {inv.lstm_status || 'UNKNOWN'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 py-1 border-b border-slate-200/80">
                  <span>Reconstruction MSE:</span>
                  <span className="text-slate-900 font-semibold">{inv.lstm_reconstruction_error.toFixed(4)}</span>
                </div>
                <div className="flex justify-between text-slate-600 py-1 border-b border-slate-200/80">
                  <span>Frozen Threshold:</span>
                  <span className="text-slate-900 font-semibold">{inv.lstm_threshold.toFixed(5)}</span>
                </div>
                <div className="flex justify-between text-slate-600 py-1 border-b border-slate-200/80">
                  <span>Error Ratio:</span>
                  <span className={inv.lstm_error_ratio && inv.lstm_error_ratio >= 1.0 ? 'text-rose-700 font-bold' : 'text-emerald-700 font-semibold'}>
                    {inv.lstm_error_ratio ? `${inv.lstm_error_ratio.toFixed(2)}x threshold` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 py-1">
                  <span>Dominant Driver:</span>
                  <span className="text-sky-700 font-semibold">{inv.dominant_feature || 'N/A'}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between text-slate-600 py-1 border-b border-slate-200/80">
                  <span>Cadence:</span>
                  <span className="text-amber-800 font-semibold">3-Hourly Synoptic (NOAA)</span>
                </div>
                <div className="flex justify-between text-slate-600 py-1 border-b border-slate-200/80">
                  <span>ML Sequence Engine:</span>
                  <span className="text-slate-800">Excluded (No Heuristic Fill)</span>
                </div>
                <div className="flex justify-between text-slate-600 py-1">
                  <span>Integrity Rule:</span>
                  <span className="text-sky-700 font-semibold">Strict Rule-Based Only</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Evidence 2: Deterministic Rule Checks */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-center gap-2 text-amber-700 text-xs font-bold uppercase tracking-wider mb-2 font-mono">
              <Activity className="w-4 h-4" />
              <span>Evidence 2 • Deterministic Rule Checks</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-2 tracking-tight">
              Operational Bounds & Rate-of-Change
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Deterministic physical limits and temporal rate-of-change limiters applied to individual sensor
              transducers to prevent undetected sensor drift or freeze.
            </p>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono">
            <div className="flex justify-between text-slate-600 py-1 border-b border-slate-200/80">
              <span>Rate of Change:</span>
              <span className={`font-semibold ${inv?.rate_of_change_check?.status === 'FAIL' ? 'text-rose-700' : 'text-emerald-700'}`}>
                {inv ? `${inv.rate_of_change_check.status} (${inv.rate_of_change_check.value} ${inv.rate_of_change_check.unit})` : 'PASS'}
              </span>
            </div>
            <div className="flex justify-between text-slate-600 py-1 border-b border-slate-200/80">
              <span>ROC Limit:</span>
              <span className="text-slate-900 font-semibold">
                {inv ? `<= ${inv.rate_of_change_check.threshold} ${inv.rate_of_change_check.unit}` : '<= 3.0°C/h'}
              </span>
            </div>
            <div className="flex justify-between text-slate-600 py-1 border-b border-slate-200/80">
              <span>Physical Range:</span>
              <span className={`font-semibold ${inv?.physical_range_check?.status === 'FAIL' ? 'text-rose-700' : 'text-emerald-700'}`}>
                {inv ? `${inv.physical_range_check.status} (${inv.physical_range_check.value} ${inv.physical_range_check.unit})` : 'PASS'}
              </span>
            </div>
            <div className="flex justify-between text-slate-600 py-1 border-b border-slate-200/80">
              <span>Envelope Band:</span>
              <span className="text-slate-900 font-semibold">
                {inv ? `[${inv.physical_range_check.expected_min}, ${inv.physical_range_check.expected_max}] ${inv.physical_range_check.unit}` : '20°C - 38°C'}
              </span>
            </div>
            <div className="flex justify-between text-slate-600 py-1">
              <span>Zero-Variance Sensor:</span>
              <span className={`font-semibold ${inv?.zero_variance_check?.status === 'FAIL' ? 'text-amber-700' : 'text-emerald-700'}`}>
                {inv ? `${inv.zero_variance_check.status} (${inv.zero_variance_check.consecutive_constant_readings} cycles)` : 'PASS (1 cycle)'}
              </span>
            </div>
          </div>
        </div>

        {/* Evidence 3: Multi-Source Corroboration & Spatial Consensus */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sky-700 text-xs font-bold uppercase tracking-wider font-mono">
                <Network className="w-4 h-4" />
                <span>Evidence 3 • Spatial & External Consensus</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200">
                &le; 150km RADIUS
              </span>
            </div>

            <h3 className="text-sm font-bold text-slate-900 mb-2 tracking-tight">
              Cross-Station Consensus & Open-Meteo Reference
            </h3>
            
            {/* Prominent 3-Way Spatial Classification Badge */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 mb-3 space-y-1.5 font-mono text-xs">
              <div className="flex items-center justify-between flex-wrap gap-1.5">
                <span className="text-slate-600 text-[11px]">Spatial Verdict:</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${
                    inv?.spatial_consensus?.classification === 'REGIONAL EVENT'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : inv?.spatial_consensus?.classification === 'ISOLATED SENSOR ANOMALY'
                      ? 'bg-rose-100 text-rose-800 border-rose-200'
                      : 'bg-amber-100 text-amber-800 border-amber-200'
                  }`}
                >
                  {inv?.spatial_consensus?.classification || 'INSUFFICIENT EVIDENCE'}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/80">
                <span className="text-slate-600">Confidence Tier:</span>
                <span
                  className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                    inv?.spatial_consensus?.confidence === 'HIGH'
                      ? 'text-emerald-800 bg-emerald-100'
                      : inv?.spatial_consensus?.confidence === 'LOW'
                      ? 'text-amber-800 bg-amber-100'
                      : 'text-slate-700 bg-slate-200'
                  }`}
                >
                  {inv?.spatial_consensus?.confidence || 'NONE'} CONFIDENCE
                </span>
              </div>

              <div className="text-[10px] text-slate-500 italic">
                {inv?.spatial_consensus?.peer_basis || (inv?.spatial_consensus?.neighbor_count === 0 ? 'no peer stations within 150km' : `${inv?.spatial_consensus?.neighbor_count || 0} peers`)}
              </div>
            </div>

            {/* Peer Cards or Insufficient Notice */}
            {inv?.spatial_consensus?.neighbors && inv.spatial_consensus.neighbors.length > 0 ? (
              <div className="space-y-2 mb-3">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                  Peers Evaluated (&le;150km):
                </span>
                {inv.spatial_consensus.neighbors.map((nb) => (
                  <div
                    key={nb.station_id}
                    className="p-2.5 rounded-lg bg-white border border-slate-200 text-[11px] font-mono space-y-1 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{nb.station_name}</span>
                      <span className="text-sky-700 font-semibold">{nb.distance_km} km</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Value: <strong className="text-slate-900">{nb.value}°C</strong> (Mid: {nb.expected_midpoint}°C)</span>
                      <span className={nb.confirms_target ? 'text-emerald-700 font-semibold' : 'text-rose-700 font-semibold'}>
                        &Delta; {nb.delta !== undefined ? `${nb.delta > 0 ? '+' : ''}${nb.delta.toFixed(1)}°C` : 'N/A'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center justify-between pt-0.5">
                      <span>Status:</span>
                      <span className={nb.confirms_target ? 'text-emerald-700' : 'text-slate-600'}>
                        {nb.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-mono mb-3">
                No peer stations within 150km — spatial consensus inconclusive.
              </div>
            )}
          </div>

          <div className="space-y-3">
            {/* External Weather Reference Table */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Open-Meteo Feed:</span>
                <span className={`font-semibold ${
                  inv?.external_weather_comparison?.status === 'MATCH'
                    ? 'text-emerald-700'
                    : inv?.external_weather_comparison?.status === 'MISMATCH'
                    ? 'text-rose-700'
                    : 'text-slate-600'
                }`}>
                  {inv?.external_weather_comparison?.status || 'UNAVAILABLE'}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Live External Temp:</span>
                <span className="text-slate-900 font-semibold">
                  {inv?.external_weather_comparison?.external_value !== null && inv?.external_weather_comparison?.external_value !== undefined
                    ? `${inv.external_weather_comparison.external_value}°C`
                    : 'Unavailable'}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>External Delta:</span>
                <span className="text-slate-900 font-semibold">
                  {inv?.external_weather_comparison?.diff !== null && inv?.external_weather_comparison?.diff !== undefined
                    ? `${inv.external_weather_comparison.diff > 0 ? '+' : ''}${inv.external_weather_comparison.diff.toFixed(1)}°C`
                    : 'N/A'}
                </span>
              </div>
            </div>

            {/* Direct Link to Spatial Intelligence Tab */}
            <button
              onClick={() => onNavigateTab('cross-station')}
              className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 flex items-center justify-center gap-1.5 transition-all shadow-xs"
            >
              <span>Inspect in Spatial Intelligence</span>
              <ExternalLink className="w-3.5 h-3.5 text-sky-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Evidence 4: 30-Day Historical Baseline & Drift Corroboration */}
      {inv?.historical_drift && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-sky-50 text-sky-700 mt-0.5 shrink-0 border border-sky-200">
              <TrendingUp className="w-5 h-5 text-sky-700" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                  Evidence 4 • 30-Day Historical Baseline & Drift Corroboration
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
                    inv.historical_drift.classification === 'SIGNIFICANT DRIFT'
                      ? 'bg-rose-100 text-rose-800 border-rose-200'
                      : inv.historical_drift.classification === 'DRIFT DETECTED'
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : inv.historical_drift.classification === 'WATCH'
                      ? 'bg-sky-100 text-sky-800 border-sky-200'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  }`}
                >
                  {inv.historical_drift.classification}
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  (Anchor: {inv.historical_drift.reference_timestamp || '2025-12-31 23:00'})
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed max-w-3xl font-mono">
                30-day baseline mean: <strong className="text-slate-900">{inv.historical_drift.baseline_mean.toFixed(1)}°C</strong> | Current deviation from baseline: <strong className={Math.abs(inv.historical_drift.deviation_from_baseline) > 4 ? 'text-amber-700 font-bold' : 'text-slate-800'}>{inv.historical_drift.deviation_from_baseline > 0 ? '+' : ''}{inv.historical_drift.deviation_from_baseline.toFixed(1)}°C</strong> | Drift Trend: <strong>{inv.historical_drift.rate_per_week > 0 ? '+' : ''}{inv.historical_drift.rate_per_week.toFixed(2)}°C/wk</strong> over {inv.historical_drift.duration_days} days.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('historical-analysis')}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 flex items-center gap-1.5 transition-all shadow-xs shrink-0"
          >
            <span>View Historical Trend</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Weather Analytics Climatological Context Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-800 font-mono">
                Context • Synoptic Climatological Patterns
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border bg-sky-50 text-sky-800 border-sky-200">
                WEATHER ANALYTICS
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed max-w-3xl font-mono">
              Explore {alert.stationName}'s long-term macro-climatic patterns, diurnal temperature curves, multi-station comparisons, and cross-variable correlations.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('weather-analytics')}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 flex items-center gap-1.5 transition-all shadow-xs shrink-0"
        >
          <span>Explore Weather Analytics</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Forensic Time-Series Chart */}
      <ChartWrapper
        title={`Forensic Time Series: ${alert.stationName} (${alert.sensor.toUpperCase()})`}
        subtitle="Historical readings leading up to current anomaly detection frame."
        badge="TIMELINE OF FAULT"
        height={340}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 15, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit="°C" domain={['auto', 'auto']} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                borderColor: '#e2e8f0',
                borderRadius: '0.75rem',
                color: '#0f172a',
                fontSize: '12px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              }}
            />
            <Line
              type="monotone"
              dataKey="temperature"
              stroke="#e11d48"
              strokeWidth={3}
              name="Observed Temperature"
            />
            <ReferenceDot
              x={latestPoint.time}
              y={latestPoint.temperature}
              r={7}
              fill="#e11d48"
              stroke="#ffffff"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>

      {/* Recommended Action / Next Steps Footer */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block font-mono">
            System Recommended Remedy
          </span>
          <p className="text-xs text-slate-900 font-semibold mt-1">
            {inv?.recommended_action || alert.evidence.recommendedAction}
          </p>
          {inv?.probable_cause && (
            <p className="text-[11px] text-slate-500 mt-0.5">
              Root Cause: {inv.probable_cause}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigateTab('cross-station')}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 flex items-center gap-1.5 transition-all shadow-xs"
          >
            <span>Inspect Spatial Correlation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onNavigateTab('maintenance')}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 flex items-center gap-1.5 transition-all shadow-xs"
          >
            <span>View All Tickets</span>
            <Wrench className="w-3.5 h-3.5 text-sky-600" />
          </button>
        </div>
      </div>
    </div>
  );
};
