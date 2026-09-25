import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Search,
  XCircle,
  Clock,
  ExternalLink,
  Wrench,
  Activity,
  ShieldCheck,
  RefreshCw,
  Sliders,
  ChevronRight,
  Info,
  Radio,
  X
} from 'lucide-react';
import { PageHeader } from '../common/PageHeader';
import type {
  AWSStation,
  DashboardTab,
  SensorType,
  SensorHealthStatus,
  SingleSensorHealthDetail,
  StationHealthMatrixRow,
  SensorHealthMatrixResponse
} from '../../types/dashboard.types';

interface SensorHealthPageProps {
  stations: AWSStation[];
  onSelectStation: (stationId: string) => void;
  onNavigateTab: (tab: DashboardTab) => void;
  onTicketCreated?: () => void;
}

const SENSOR_ICONS: Record<SensorType, string> = {
  temperature: '🌡️',
  humidity: '💧',
  pressure: '⏱️',
  wind: '💨',
  rainfall: '🌧️',
};

const SENSOR_DISPLAY_NAMES: Record<SensorType, string> = {
  temperature: 'Temperature',
  humidity: 'Humidity',
  pressure: 'Pressure',
  wind: 'Wind Speed',
  rainfall: 'Precipitation',
};

export const SensorHealthPage: React.FC<SensorHealthPageProps> = ({
  stations,
  onSelectStation,
  onNavigateTab,
  onTicketCreated,
}) => {
  const [matrixData, setMatrixData] = useState<SensorHealthMatrixResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedSensorDetail, setSelectedSensorDetail] = useState<SingleSensorHealthDetail | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [ticketSuccessMsg, setTicketSuccessMsg] = useState<string | null>(null);

  // Ticket creation modal form state
  const [ticketForm, setTicketForm] = useState({
    assignee: 'Regional Field Unit',
    notes: '',
  });

  const fetchMatrix = useCallback(async () => {
    try {
      const res = await fetch('/api/sensor-health/matrix');
      if (res.ok) {
        const data = await res.json();
        setMatrixData(data);
      }
    } catch (err) {
      console.error('Failed to fetch sensor health matrix:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatrix();
    const interval = setInterval(fetchMatrix, 4000);
    return () => clearInterval(interval);
  }, [fetchMatrix]);

  const handleOpenDetail = async (stationId: string, sensor: SensorType) => {
    try {
      const res = await fetch(`/api/sensor-health/sensor?station_id=${stationId}&sensor=${sensor}`);
      if (res.ok) {
        const detail = await res.json();
        setSelectedSensorDetail(detail);
        setDrawerOpen(true);
        setTicketSuccessMsg(null);
      }
    } catch (err) {
      console.error('Failed to fetch sensor detail:', err);
    }
  };

  const handleCreateTicket = async () => {
    if (!selectedSensorDetail) return;
    setCreatingTicket(true);
    setTicketSuccessMsg(null);
    try {
      const payload = {
        station_id: selectedSensorDetail.station_id,
        station_name: selectedSensorDetail.station_name,
        station_location: selectedSensorDetail.location,
        sensor: selectedSensorDetail.sensor,
        issue: selectedSensorDetail.why_this_status,
        priority: selectedSensorDetail.investigation.severity || (selectedSensorDetail.status === 'CRITICAL' ? 'CRITICAL' : selectedSensorDetail.status === 'DEGRADED' ? 'HIGH' : 'MEDIUM'),
        assigned_to: ticketForm.assignee,
        evidence: {
          triggers: selectedSensorDetail.qualifying_triggers,
          root_cause: selectedSensorDetail.investigation.root_cause,
          drift_sigma: selectedSensorDetail.drift.drift_sigma,
          observed_value: selectedSensorDetail.current_value,
        },
        recommended_action: `Recalibrate ${selectedSensorDetail.sensor_name} probe and verify telemetry link.`,
        notes: [
          {
            timestamp: new Date().toISOString(),
            author: 'Control Room Operator',
            text: ticketForm.notes || 'Dispatched via Sensor Health Matrix.',
          }
        ]
      };

      const res = await fetch('/api/maintenance/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const created = await res.json();
        setTicketSuccessMsg(`Work order ${created.id} generated successfully!`);
        fetchMatrix();
        if (onTicketCreated) onTicketCreated();
        // refresh detail
        handleOpenDetail(selectedSensorDetail.station_id, selectedSensorDetail.sensor);
      }
    } catch (err) {
      console.error('Error creating ticket:', err);
    } finally {
      setCreatingTicket(false);
    }
  };

  const getStatusBadge = (status: SensorHealthStatus) => {
    switch (status) {
      case 'HEALTHY':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>HEALTHY</span>
          </span>
        );
      case 'WATCH':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>WATCH</span>
          </span>
        );
      case 'DEGRADED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold bg-orange-50 text-orange-700 border border-orange-200 shadow-2xs">
            <AlertTriangle className="w-3 h-3 text-orange-600" />
            <span>DEGRADED</span>
          </span>
        );
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs animate-pulse">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>CRITICAL</span>
          </span>
        );
      case 'AWAITING VERIFICATION':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
            <Clock className="w-3 h-3 text-blue-600 animate-spin" />
            <span>AWAITING VERIF</span>
          </span>
        );
      case 'OFFLINE':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold bg-slate-100 text-slate-500 border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span>OFFLINE</span>
          </span>
        );
    }
  };

  const filteredRows = useMemo(() => {
    if (!matrixData?.matrix) return [];
    return matrixData.matrix.filter((row) => {
      const matchSearch =
        row.station_name.toLowerCase().includes(search.toLowerCase()) ||
        row.station_id.toLowerCase().includes(search.toLowerCase()) ||
        row.location.toLowerCase().includes(search.toLowerCase());

      if (!matchSearch) return false;
      if (statusFilter === 'ALL') return true;

      // Filter by station overall or any sensor matching
      if (row.overall_status === statusFilter) return true;
      const sensorMatches = Object.values(row.sensors).some((s) => s.status === statusFilter);
      return sensorMatches;
    });
  }, [matrixData, search, statusFilter]);

  const kpis = matrixData?.kpis;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sensor Health & Calibration Matrix"
        subtitle="Individual sensor probe diagnostics, 30-day historical drift evaluation, and real-time operational assurance."
        badge="HARDWARE TELEMETRY"
      />

      {/* Real Live KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] text-slate-500 font-mono block">Monitored Fleet</span>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 mt-1">
            {kpis?.total_stations || 7} Stations
          </div>
          <span className="text-[10px] text-slate-500 font-mono">National Synoptic Mesh</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[11px] text-slate-500 font-mono block">Total Probes</span>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 mt-1">
            {kpis?.total_sensors || 35} Probes
          </div>
          <span className="text-[10px] text-slate-500 font-mono">5 sensors × 7 stations</span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 shadow-sm">
          <span className="text-[11px] text-emerald-800 font-mono block">Healthy Probes</span>
          <div className="text-xl sm:text-2xl font-black font-mono text-emerald-700 mt-1">
            {kpis?.healthy_count ?? 35}
          </div>
          <span className="text-[10px] text-emerald-600 font-mono">Nominal baseline</span>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 shadow-sm">
          <span className="text-[11px] text-amber-800 font-mono block">Watch / Drift</span>
          <div className="text-xl sm:text-2xl font-black font-mono text-amber-700 mt-1">
            {kpis?.watch_count ?? 0}
          </div>
          <span className="text-[10px] text-amber-600 font-mono">Mild shift / ROC alert</span>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 shadow-sm">
          <span className="text-[11px] text-rose-800 font-mono block">Degraded / Critical</span>
          <div className="text-xl sm:text-2xl font-black font-mono text-rose-700 mt-1">
            {(kpis?.critical_count ?? 0) + (kpis?.degraded_count ?? 0)}
          </div>
          <span className="text-[10px] text-rose-600 font-mono">Action required</span>
        </div>

        <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-200 shadow-sm">
          <span className="text-[11px] text-sky-800 font-mono block">Open Tickets</span>
          <div className="text-xl sm:text-2xl font-black font-mono text-sky-700 mt-1">
            {kpis?.open_maintenance_issues ?? 0}
          </div>
          <span className="text-[10px] text-sky-600 font-mono">Active work orders</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-700 font-mono font-semibold uppercase tracking-wider">Status:</span>
          {(['ALL', 'CRITICAL', 'DEGRADED', 'WATCH', 'AWAITING VERIFICATION', 'HEALTHY'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-xl text-xs font-mono font-semibold transition-all ${
                statusFilter === st
                  ? 'bg-sky-50 text-sky-700 border border-sky-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-50 border border-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search station or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 shadow-xs"
          />
        </div>
      </div>

      {/* Sensor Health Matrix Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden relative">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="font-bold text-slate-900 tracking-tight">Fleet Sensor Diagnostic Matrix</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Click any sensor probe cell to inspect root-cause evidence, drift score, and open maintenance tickets.
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-500">
            <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span>Live Polling (4s)</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-mono text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Station &amp; Cadence</th>
                <th className="py-3 px-3">Temperature</th>
                <th className="py-3 px-3">Humidity</th>
                <th className="py-3 px-3">Pressure</th>
                <th className="py-3 px-3">Wind Speed</th>
                <th className="py-3 px-3">Rainfall</th>
                <th className="py-3 px-4 text-right">Overall Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredRows.map((row) => (
                <tr key={row.station_id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sky-700">{row.station_id}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                        {row.cadence}
                      </span>
                    </div>
                    <div className="text-slate-900 font-medium truncate max-w-[160px]">{row.station_name}</div>
                    <div className="text-[11px] text-slate-500">{row.location}, {row.state}</div>
                  </td>

                  {(['temperature', 'humidity', 'pressure', 'wind', 'rainfall'] as SensorType[]).map((stype) => {
                    const s = row.sensors[stype];
                    if (!s) return <td key={stype} className="py-3.5 px-3 text-slate-400">-</td>;
                    return (
                      <td
                        key={stype}
                        onClick={() => handleOpenDetail(row.station_id, stype)}
                        className="py-3.5 px-3 cursor-pointer group"
                      >
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 group-hover:border-sky-300 group-hover:bg-sky-50/40 transition-all">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-slate-500 font-mono">
                              {SENSOR_ICONS[stype]}
                            </span>
                            <span className="text-xs font-mono font-bold text-slate-900">
                              {s.current_value} {s.unit}
                            </span>
                          </div>
                          <div>{getStatusBadge(s.status)}</div>
                        </div>
                      </td>
                    );
                  })}

                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex flex-col items-end">
                      {getStatusBadge(row.overall_status)}
                      <span className="text-[10px] font-mono text-slate-500 mt-1">
                        Score: <strong className="text-slate-900">{row.overall_health_score}%</strong>
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sensor Detail Drawer / Modal */}
      {drawerOpen && selectedSensorDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-500" />

            <div className="flex items-start justify-between border-b border-slate-200 pb-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-sky-700">{selectedSensorDetail.station_id}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {selectedSensorDetail.cadence} cadence
                  </span>
                  {getStatusBadge(selectedSensorDetail.status)}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  {selectedSensorDetail.station_name} — {selectedSensorDetail.sensor_name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Location: {selectedSensorDetail.location}, {selectedSensorDetail.state} ({selectedSensorDetail.region} Region)
                </p>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Telemetry & Status Explanation */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-mono block">Current Value</span>
                  <div className="text-xl font-mono font-bold text-slate-900 mt-0.5">
                    {selectedSensorDetail.current_value} {selectedSensorDetail.unit}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-mono block">Health Score</span>
                  <div className="text-xl font-mono font-bold text-emerald-600 mt-0.5">
                    {selectedSensorDetail.health_score}%
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-mono block">30d Historical Drift</span>
                  <div className="text-xl font-mono font-bold text-sky-700 mt-0.5">
                    {selectedSensorDetail.drift.drift_sigma.toFixed(2)}σ
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono">{selectedSensorDetail.drift.classification}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-mono block">Telemetry Link</span>
                  <div className="text-xl font-mono font-bold text-emerald-600 mt-0.5">
                    {selectedSensorDetail.freshness.link_status}
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono">{selectedSensorDetail.freshness.last_ping_seconds}s ping</span>
                </div>
              </div>

              {/* "Why this status?" Callout */}
              <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200">
                <div className="flex items-center gap-2 mb-1.5">
                  <Info className="w-4 h-4 text-sky-600" />
                  <span className="text-xs font-mono font-bold text-sky-800 uppercase tracking-wider">
                    Diagnostic Status Attribution
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-sans">
                  {selectedSensorDetail.why_this_status}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t border-sky-200/60 text-[10px] font-mono text-slate-500">
                  <span className="text-slate-600">Triggers:</span>
                  {selectedSensorDetail.qualifying_triggers.map((trig) => (
                    <span key={trig} className="px-1.5 py-0.5 rounded bg-white text-sky-700 border border-sky-200">
                      {trig}
                    </span>
                  ))}
                </div>
              </div>

              {/* Investigation Forensics (if active) */}
              {selectedSensorDetail.investigation.active && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      Active Forensic Investigation Record
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300">
                      SEVERITY: {selectedSensorDetail.investigation.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700">
                    <strong className="text-rose-700">Root Cause:</strong> {selectedSensorDetail.investigation.root_cause}
                  </p>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-[11px] font-mono">
                    <div className="p-2 rounded bg-white border border-rose-200">
                      <span className="text-slate-500 block">Spatial Peer Consensus:</span>
                      <span className="text-slate-800">{selectedSensorDetail.investigation.spatial_status}</span>
                    </div>
                    <div className="p-2 rounded bg-white border border-rose-200">
                      <span className="text-slate-500 block">External Weather Delta:</span>
                      <span className="text-slate-800">{selectedSensorDetail.investigation.external_status}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ML Model Applicability Note */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <span className="text-slate-500 font-mono block mb-1">Model Inference Pipeline</span>
                <p className="text-slate-700">
                  {selectedSensorDetail.ml_model.lstm_applicable
                    ? `LSTM Autoencoder Active: Status ${selectedSensorDetail.ml_model.lstm_status}. Sequence reconstruction error continuously evaluated.`
                    : 'Station operates on 3-hour synoptic cadence (NOAA). Evaluated purely via deterministic rules, spatial consensus, and historical drift.'}
                </p>
              </div>

              {/* Timeline of Events */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-mono font-bold text-slate-800 block mb-2">
                  Telemetry &amp; Audit Timeline
                </span>
                <div className="space-y-2">
                  {selectedSensorDetail.timeline.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-xs">
                      <span className="font-mono text-slate-500 text-[11px] shrink-0 mt-0.5">{item.time}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-sky-700 text-[11px]">{item.event}</span>
                          {getStatusBadge(item.status as SensorHealthStatus)}
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">{item.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Maintenance Ticket Action */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Wrench className="w-4 h-4 text-amber-600" />
                    Field Maintenance Work Order
                  </span>
                  {selectedSensorDetail.active_ticket ? (
                    <span className="text-xs font-mono text-emerald-700">
                      Ticket {selectedSensorDetail.active_ticket.id} ({selectedSensorDetail.active_ticket.status})
                    </span>
                  ) : (
                    <span className="text-xs font-mono text-slate-500">No active work order</span>
                  )}
                </div>

                {ticketSuccessMsg && (
                  <div className="mb-3 p-2.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs border border-emerald-200">
                    {ticketSuccessMsg}
                  </div>
                )}

                {selectedSensorDetail.active_ticket ? (
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-700">
                      Assigned to: <strong className="text-slate-900">{selectedSensorDetail.active_ticket.assigned_to}</strong>
                    </p>
                    <button
                      onClick={() => {
                        setDrawerOpen(false);
                        onNavigateTab('maintenance');
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 transition-all flex items-center gap-1.5"
                    >
                      <span>View in Operations</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] text-slate-500 font-mono block mb-1">Assignee Field Unit</label>
                        <input
                          type="text"
                          value={ticketForm.assignee}
                          onChange={(e) => setTicketForm({ ...ticketForm, assignee: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-mono block mb-1">Dispatch Notes</label>
                        <input
                          type="text"
                          placeholder="Calibration check / Probe swap..."
                          value={ticketForm.notes}
                          onChange={(e) => setTicketForm({ ...ticketForm, notes: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleCreateTicket}
                      disabled={creatingTicket}
                      className="w-full py-2 rounded-xl text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 shadow-2xs transition-all flex items-center justify-center gap-2"
                    >
                      <Wrench className="w-4 h-4 text-amber-600" />
                      <span>{creatingTicket ? 'Generating Work Order...' : 'Create Maintenance Ticket for this Sensor'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
