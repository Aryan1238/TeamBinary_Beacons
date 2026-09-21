import React, { useState } from 'react';
import {
  Activity,
  Thermometer,
  Droplets,
  Gauge,
  Wind,
  CloudRain,
  Radio,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { PageHeader } from '../common/PageHeader';
import { StatusBadge } from '../common/StatusBadge';
import { ChartWrapper } from '../common/ChartWrapper';
import type { AWSStation, SensorType, DashboardTab } from '../../types/dashboard.types';
import { MOCK_24H_HISTORY } from '../../data/mockStations';
import { useTelemetry } from '../../context/TelemetryContext';

interface LiveMonitoringPageProps {
  stations: AWSStation[];
  selectedStationId: string;
  onSelectStation: (stationId: string) => void;
  onNavigateTab: (tab: DashboardTab) => void;
}

export const LiveMonitoringPage: React.FC<LiveMonitoringPageProps> = ({
  stations,
  selectedStationId,
  onSelectStation,
  onNavigateTab,
}) => {
  const currentStation =
    stations.find((s) => s.id === selectedStationId) || stations[0];

  const [activeSensor, setActiveSensor] = useState<SensorType>('temperature');
  const { simulationStatus, historyBuffers, recentReadings, activeFaults, clearFault } = useTelemetry();
  const currentActiveFault = activeFaults[currentStation.id];

  const sensorConfig: Record<
    SensorType,
    { label: string; icon: React.ComponentType<{ className?: string }>; unit: string; color: string; fill: string; activeGlow: string }
  > = {
    temperature: {
      label: 'Temperature',
      icon: Thermometer,
      unit: '°C',
      color: '#f59e0b',
      fill: 'rgba(245, 158, 11, 0.15)',
      activeGlow: 'bg-amber-500/15 border-amber-500/50 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.2)]',
    },
    humidity: {
      label: 'Relative Humidity',
      icon: Droplets,
      unit: '%',
      color: '#38bdf8',
      fill: 'rgba(56, 189, 248, 0.15)',
      activeGlow: 'bg-sky-500/15 border-sky-500/50 text-sky-200 shadow-[0_0_15px_rgba(56,189,248,0.2)]',
    },
    pressure: {
      label: 'Barometric Pressure',
      icon: Gauge,
      unit: 'hPa',
      color: '#818cf8',
      fill: 'rgba(129, 140, 248, 0.15)',
      activeGlow: 'bg-indigo-500/15 border-indigo-500/50 text-indigo-200 shadow-[0_0_15px_rgba(129,140,248,0.2)]',
    },
    wind: {
      label: 'Wind Velocity',
      icon: Wind,
      unit: 'km/h',
      color: '#34d399',
      fill: 'rgba(52, 211, 153, 0.15)',
      activeGlow: 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200 shadow-[0_0_15px_rgba(52,211,153,0.2)]',
    },
    rainfall: {
      label: 'Precipitation Accumulation',
      icon: CloudRain,
      unit: 'mm',
      color: '#60a5fa',
      fill: 'rgba(96, 165, 250, 0.15)',
      activeGlow: 'bg-blue-500/15 border-blue-500/50 text-blue-200 shadow-[0_0_15px_rgba(96,165,250,0.2)]',
    },
  };

  const currentReading = currentStation.sensors[activeSensor];
  const activeCfg = sensorConfig[activeSensor];
  const historyData = historyBuffers[currentStation.id] || MOCK_24H_HISTORY[currentStation.id] || [];
  const stationLogs = recentReadings[currentStation.id] || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Sensor Telemetry"
        subtitle={`Real-time high-rate sensor streams for ${currentStation.name} (${currentStation.id}) with envelope anomaly thresholds.`}
        badge={simulationStatus === 'RUNNING' ? 'LIVE TELEMETRY STREAM' : 'HIGH FREQUENCY SAMPLING'}
      />

      {/* Station Selector Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#111a31]/90 via-[#0e1628]/85 to-[#090e1c]/95 border border-slate-800/80 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="station-select" className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
            <Radio className="w-3.5 h-3.5 text-sky-400" />
            Station:
          </label>
          <select
            id="station-select"
            value={currentStation.id}
            onChange={(e) => onSelectStation(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[#090e1c] border border-slate-700 text-sm font-semibold text-white focus:outline-none focus:border-sky-500"
          >
            {stations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id} — {s.name} ({s.state})
              </option>
            ))}
          </select>

          <StatusBadge status={currentStation.status} />

          {/* Dynamic Live Status Indicator */}
          {simulationStatus === 'RUNNING' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[11px] font-mono font-semibold shadow-[0_0_12px_rgba(16,185,129,0.3)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span>LIVE</span>
            </div>
          )}
          {simulationStatus === 'PAUSED' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[11px] font-mono font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>PAUSED</span>
            </div>
          )}
          {simulationStatus === 'STOPPED' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/60 border border-slate-700/60 text-slate-400 text-[11px] font-mono font-semibold">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              <span>STANDBY</span>
            </div>
          )}

          {/* Active Fault Indicator Pill with Quick Clear Button */}
          {currentActiveFault && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-200 text-xs font-mono font-bold shadow-[0_0_15px_rgba(245,158,11,0.25)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
              </span>
              <span>FAULT: {currentActiveFault.label.toUpperCase()} (TICK #{currentActiveFault.ticksActive})</span>
              <button
                onClick={() => clearFault(currentStation.id)}
                className="ml-1 px-2 py-0.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[10px] uppercase font-sans font-semibold tracking-wide transition-colors cursor-pointer"
                title="Clear Active Fault and Resume Normal Stream"
              >
                Clear
              </button>
            </div>
          )}

          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            Lat {currentStation.coordinates.lat}°N, Lng {currentStation.coordinates.lng}°E • Elev {currentStation.elevationMeters}m
          </span>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center">
          <button
            onClick={() => onNavigateTab('simulation-lab')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(251,191,36,0.18)] transition-all"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Inject Fault (Testbench)</span>
          </button>
        </div>
      </div>

      {/* Sensor Tab Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {(Object.keys(sensorConfig) as SensorType[]).map((st) => {
          const cfg = sensorConfig[st];
          const Icon = cfg.icon;
          const reading = currentStation.sensors[st];
          const isSelected = activeSensor === st;
          const isAnomaly = reading.status === 'ANOMALY';
          const isFaulted = currentActiveFault && currentActiveFault.sensor === st;

          return (
            <button
              key={st}
              onClick={() => setActiveSensor(st)}
              className={`p-4 rounded-2xl border text-left transition-all backdrop-blur-md relative overflow-hidden group ${
                isSelected
                  ? cfg.activeGlow
                  : isFaulted
                  ? 'bg-gradient-to-b from-[#2a1b12]/80 to-[#090e1c]/80 border-amber-500/60 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                  : 'bg-gradient-to-b from-[#111a31]/60 to-[#090e1c]/80 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon className={`w-4 h-4 transition-colors ${isSelected || isFaulted ? 'text-current' : 'text-slate-400 group-hover:text-slate-200'}`} />
                {isFaulted ? (
                  <span className="text-[10px] font-mono font-bold text-amber-400 animate-pulse">⚡ FAULT</span>
                ) : isAnomaly ? (
                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" title="Anomaly Detected" />
                ) : null}
              </div>
              <div className="mt-2.5">
                <span className="text-xs font-medium block truncate text-slate-300">{cfg.label}</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl font-bold font-mono text-white">
                    {reading.value}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{cfg.unit}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Chart + Real-Time Telemetry Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sensor Curve Chart */}
        <div className="lg:col-span-3">
          <ChartWrapper
            title={`24-Hour Diurnal Curve — ${activeCfg.label}`}
            subtitle={`Station ${currentStation.name} • Envelope denotes ±3σ physical boundary`}
            badge="SYNCHRONIZED TIMELINE"
            height={360}
            controls={
              <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 bg-amber-400" />
                  <span>Observed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 border-t border-dashed border-rose-400" />
                  <span>Threshold Envelope</span>
                </div>
              </div>
            }
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="sensorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={activeCfg.color} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={activeCfg.color} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c253d" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0c1326',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#f8fafc',
                    fontSize: '12px',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                  }}
                  formatter={(val) => [`${val} ${activeCfg.unit}`, activeCfg.label]}
                />
                <ReferenceLine
                  y={currentReading.expectedMax}
                  stroke="#f43f5e"
                  strokeDasharray="4 4"
                  label={{ value: 'Upper Limit', fill: '#f43f5e', fontSize: 10, position: 'insideTopRight' }}
                />
                <ReferenceLine
                  y={currentReading.expectedMin}
                  stroke="#38bdf8"
                  strokeDasharray="4 4"
                  label={{ value: 'Lower Limit', fill: '#38bdf8', fontSize: 10, position: 'insideBottomRight' }}
                />
                <Area
                  type="monotone"
                  dataKey={activeSensor}
                  stroke={activeCfg.color}
                  strokeWidth={2.5}
                  fill="url(#sensorGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </div>

        {/* Current Metric Breakdown Card */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-gradient-to-b from-[#111a31]/90 via-[#0e1628]/85 to-[#090e1c]/95 border border-slate-800/80 backdrop-blur-md shadow-xl">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center justify-between font-mono">
              <span>Metric Diagnostics</span>
              <Activity className="w-4 h-4 text-sky-400" />
            </h4>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-[#0a101f]/70 border border-slate-800/70">
                <span className="text-[11px] text-slate-400">Current Reading</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black font-mono text-white">
                    {currentReading.value}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{activeCfg.unit}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-[#0a101f]/50 border border-slate-800/60">
                  <span className="text-[10px] text-slate-400 block font-mono">24h Low</span>
                  <span className="font-mono font-bold text-slate-200">
                    {currentReading.min24h} {activeCfg.unit}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#0a101f]/50 border border-slate-800/60">
                  <span className="text-[10px] text-slate-400 block font-mono">24h High</span>
                  <span className="font-mono font-bold text-slate-200">
                    {currentReading.max24h} {activeCfg.unit}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0a101f]/70 border border-slate-800/70">
                <span className="text-[10px] text-slate-400 block mb-1 font-mono">Expected Operational Band</span>
                <span className="font-mono text-xs text-sky-300 font-bold">
                  {currentReading.expectedMin} — {currentReading.expectedMax} {activeCfg.unit}
                </span>
                <div className="w-full bg-slate-800/80 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full ${
                      currentReading.value > currentReading.expectedMax ||
                      currentReading.value < currentReading.expectedMin
                        ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
                        : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          10,
                          ((currentReading.value - currentReading.expectedMin) /
                            (currentReading.expectedMax - currentReading.expectedMin || 1)) *
                            100
                        )
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1 font-mono">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Last packet: {currentReading.lastUpdated}</span>
              </div>
            </div>
          </div>

          {/* Physical Consistency Check */}
          <div className="p-4 rounded-2xl bg-gradient-to-b from-[#111a31]/70 to-[#090e1c]/80 border border-slate-800/70 text-xs backdrop-blur-md">
            <h5 className="font-bold text-slate-200 mb-2 flex items-center gap-1.5">
              {currentStation.status === 'ANOMALY' ? (
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
              <span>Physics Consistency Rule</span>
            </h5>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              {currentStation.id === 'AWS-003'
                ? 'Temperature spike violates inverse thermodynamic correlation with 94% humidity during nighttime.'
                : 'Sensor envelope correlates with barometric curve and local solar radiation model.'}
            </p>
          </div>
        </div>
      </div>

      {/* Live Ingestion Telemetry Stream Table */}
      <div className="p-5 rounded-2xl bg-gradient-to-b from-[#111a31]/90 via-[#0e1628]/85 to-[#090e1c]/95 border border-slate-800/80 backdrop-blur-md shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white tracking-wide uppercase font-mono">
                Recent Ingested Packets — {currentStation.name} ({currentStation.id})
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Rolling queue of the latest telemetry frames transmitted by onboard micro-controller modem.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${simulationStatus === 'RUNNING' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              Channel: MQTT over TLS
            </span>
            <span className="text-slate-600">•</span>
            <span>QoS 1 Ack</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">Packet Timestamp</th>
                <th className="py-2.5 px-3">Temp (°C)</th>
                <th className="py-2.5 px-3">Humidity (%)</th>
                <th className="py-2.5 px-3">Pressure (hPa)</th>
                <th className="py-2.5 px-3">Wind (km/h)</th>
                <th className="py-2.5 px-3">Rain (mm)</th>
                <th className="py-2.5 px-3">Payload Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {stationLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500">
                    Awaiting telemetry packets...
                  </td>
                </tr>
              ) : (
                stationLogs.map((entry, idx) => {
                  const isLatest = idx === 0 && simulationStatus === 'RUNNING';

                  if (entry.flag === 'failure') {
                    return (
                      <tr
                        key={entry.id}
                        className="bg-rose-950/25 border-l-2 border-rose-500 text-rose-300 font-mono"
                      >
                        <td colSpan={6} className="py-2.5 px-3">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                            <span className="font-bold text-rose-300">{entry.timestamp}</span>
                            <span className="text-slate-500">•</span>
                            <span className="text-rose-200">
                              {entry.transitionNote || `${currentStation.id} — No telemetry received — Communication Failure`}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            MODEM OFFLINE
                          </span>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr
                      key={entry.id}
                      className={`hover:bg-slate-800/30 transition-colors ${
                        entry.flag === 'injected'
                          ? 'bg-amber-500/[0.08] border-l-2 border-amber-400 text-slate-100'
                          : isLatest
                          ? 'bg-emerald-500/[0.06] text-slate-100'
                          : 'text-slate-300'
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          {isLatest && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          )}
                          {entry.flag === 'injected' && (
                            <span className="text-amber-400 text-xs">⚡</span>
                          )}
                          <span className="text-slate-200 font-semibold">{entry.timestamp}</span>
                        </div>
                        {entry.transitionNote && entry.flag === 'injected' && (
                          <div className="text-[10px] text-amber-300/90 font-mono mt-0.5">
                            {entry.transitionNote}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-amber-300">
                        {entry.temperature.toFixed(1)}
                      </td>
                      <td className="py-2.5 px-3 text-sky-300">
                        {entry.humidity.toFixed(0)}%
                      </td>
                      <td className="py-2.5 px-3 text-indigo-300">
                        {entry.pressure.toFixed(1)}
                      </td>
                      <td className="py-2.5 px-3 text-emerald-300">
                        {entry.wind.toFixed(1)}
                      </td>
                      <td className="py-2.5 px-3 text-blue-300">
                        {entry.rainfall.toFixed(1)}
                      </td>
                      <td className="py-2.5 px-3">
                        {entry.flag === 'injected' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            INJECTED FAULT
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            VERIFIED
                          </span>
                        )}
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
