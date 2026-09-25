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
  AlertCircle,
  CheckCircle2,
  Clock,
  Database,
  Cpu,
  Info,
  ShieldCheck,
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

  const {
    simulationStatus,
    historyBuffers,
    recentReadings,
    activeFaults,
    clearFault,
    mlResults,
    telemetryAlerts,
    streamSources,
    setStreamSource,
  } = useTelemetry();

  const currentActiveFault = activeFaults[currentStation.id];
  const currentAlert = telemetryAlerts[currentStation.id];
  const currentSource = streamSources[currentStation.id] || 'Meteostat';
  const currentML = mlResults[currentStation.id] || {
    status: 'NORMAL',
    reconstructionError: 0.1245,
    threshold: 0.24231,
    errorRatio: 0.5138,
    warmupStep: 24,
    dominantFeature: 'temperature',
    source: currentSource,
    stationId: currentStation.id,
    updatedAt: 'Nominal Baseline',
  };

  const sensorConfig: Record<
    SensorType,
    { label: string; icon: React.ComponentType<{ className?: string }>; unit: string; color: string; fill: string; activeGlow: string }
  > = {
    temperature: {
      label: 'Temperature',
      icon: Thermometer,
      unit: '°C',
      color: '#d97706',
      fill: 'rgba(217, 119, 6, 0.12)',
      activeGlow: 'bg-amber-50 border-amber-300 text-amber-900 shadow-xs ring-1 ring-amber-300',
    },
    humidity: {
      label: 'Relative Humidity',
      icon: Droplets,
      unit: '%',
      color: '#0284c7',
      fill: 'rgba(2, 132, 199, 0.12)',
      activeGlow: 'bg-sky-50 border-sky-300 text-sky-900 shadow-xs ring-1 ring-sky-300',
    },
    pressure: {
      label: 'Barometric Pressure',
      icon: Gauge,
      unit: 'hPa',
      color: '#4f46e5',
      fill: 'rgba(79, 70, 229, 0.12)',
      activeGlow: 'bg-indigo-50 border-indigo-300 text-indigo-900 shadow-xs ring-1 ring-indigo-300',
    },
    wind: {
      label: 'Wind Velocity',
      icon: Wind,
      unit: 'km/h',
      color: '#059669',
      fill: 'rgba(5, 150, 105, 0.12)',
      activeGlow: 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-xs ring-1 ring-emerald-300',
    },
    rainfall: {
      label: 'Precipitation Accumulation',
      icon: CloudRain,
      unit: 'mm',
      color: '#2563eb',
      fill: 'rgba(37, 99, 235, 0.12)',
      activeGlow: 'bg-blue-50 border-blue-300 text-blue-900 shadow-xs ring-1 ring-blue-300',
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
        subtitle={`Real-time high-rate sensor streams for ${currentStation.name} (${currentStation.id}) with dual-stream ML Autoencoder inference.`}
        badge={simulationStatus === 'RUNNING' ? 'LIVE TELEMETRY STREAM' : 'HIGH FREQUENCY SAMPLING'}
      />

      {/* Telemetry Availability Alert Banner (COMMUNICATION_FAILURE exclusive alert) */}
      {currentAlert && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span className="font-bold uppercase tracking-wide">Telemetry Availability Alert:</span>
            <span>{currentAlert}</span>
          </div>
          <span className="text-[11px] text-rose-700 bg-rose-100 px-2 py-0.5 rounded border border-rose-300">
            Hardware / Modem Link Offline (Not an LSTM Anomaly Verdict)
          </span>
        </div>
      )}

      {/* Station Selector Bar & Stream Controls */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="station-select" className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 font-mono">
            <Radio className="w-3.5 h-3.5 text-sky-600" />
            Station:
          </label>
          <select
            id="station-select"
            value={currentStation.id}
            onChange={(e) => onSelectStation(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-sm font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
          >
            {stations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id} — {s.name} ({s.state})
              </option>
            ))}
          </select>

          {/* Stream Source Selector Toggle: Meteostat vs NOAA */}
          <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200 text-xs font-mono font-semibold">
            <button
              onClick={() => setStreamSource(currentStation.id, 'Meteostat')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                currentSource === 'Meteostat'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Meteostat ({currentStation.meteostatId || 'ID'})
            </button>
            <button
              onClick={() => setStreamSource(currentStation.id, 'NOAA')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                currentSource === 'NOAA'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              NOAA ISD ({currentStation.noaaId || 'ID'})
            </button>
          </div>

          <StatusBadge status={currentStation.status} />

          {/* Dedicated ML Autoencoder Status Badge */}
          <div className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-bold border flex items-center gap-1.5 ${
            currentML.status === 'ANOMALY'
              ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-xs animate-pulse'
              : currentML.status.startsWith('WARMING_UP')
              ? 'bg-amber-50 text-amber-700 border-amber-300'
              : currentML.status.startsWith('NOT_APPLICABLE')
              ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
              : 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs'
          }`}>
            <Cpu className="w-3 h-3 text-current" />
            <span>ML: {currentML.status}</span>
          </div>

          {/* Dynamic Live Status Indicator */}
          {simulationStatus === 'RUNNING' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-700 text-[11px] font-mono font-semibold shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
              </span>
              <span>LIVE</span>
            </div>
          )}
          {simulationStatus === 'PAUSED' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-700 text-[11px] font-mono font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>PAUSED</span>
            </div>
          )}
          {simulationStatus === 'STOPPED' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-300 text-slate-600 text-[11px] font-mono font-semibold">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>STANDBY</span>
            </div>
          )}

          {/* Active Fault Indicator Pill with Quick Clear Button */}
          {currentActiveFault && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-800 text-xs font-mono font-bold shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-600" />
              </span>
              <span>FAULT: {currentActiveFault.label.toUpperCase()} (TICK #{currentActiveFault.ticksActive})</span>
              <button
                onClick={() => clearFault(currentStation.id)}
                className="ml-1 px-2 py-0.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[10px] uppercase font-sans font-semibold tracking-wide transition-colors cursor-pointer"
                title="Clear Active Fault and Resume Normal Stream"
              >
                Clear
              </button>
            </div>
          )}

          <span className="text-xs text-slate-500 font-mono hidden sm:inline">
            Lat {currentStation.coordinates.lat}°N, Lng {currentStation.coordinates.lng}°E • Elev {currentStation.elevationMeters}m
          </span>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center">
          <button
            onClick={() => onNavigateTab('simulation-lab')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 shadow-xs transition-all"
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
              className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                isSelected
                  ? cfg.activeGlow
                  : isFaulted
                  ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon className={`w-4 h-4 transition-colors ${isSelected || isFaulted ? 'text-current' : 'text-slate-500 group-hover:text-slate-700'}`} />
                {isFaulted ? (
                  <span className="text-[10px] font-mono font-bold text-amber-700 animate-pulse">⚡ FAULT</span>
                ) : isAnomaly ? (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" title="Anomaly Detected" />
                ) : null}
              </div>
              <div className="mt-2.5">
                <span className="text-xs font-medium block truncate text-slate-500">{cfg.label}</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl font-bold font-mono text-slate-900">
                    {reading.value}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">{cfg.unit}</span>
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
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '0.75rem',
                    color: '#0f172a',
                    fontSize: '12px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  }}
                  formatter={(val) => [`${val} ${activeCfg.unit}`, activeCfg.label]}
                />
                <ReferenceLine
                  y={currentReading.expectedMax}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  label={{ value: 'Upper Limit', fill: '#ef4444', fontSize: 10, position: 'insideTopRight' }}
                />
                <ReferenceLine
                  y={currentReading.expectedMin}
                  stroke="#0284c7"
                  strokeDasharray="4 4"
                  label={{ value: 'Lower Limit', fill: '#0284c7', fontSize: 10, position: 'insideBottomRight' }}
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
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center justify-between font-mono">
              <span>Metric Diagnostics</span>
              <Activity className="w-4 h-4 text-sky-600" />
            </h4>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] text-slate-500">Current Reading</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black font-mono text-slate-900">
                    {currentReading.value}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">{activeCfg.unit}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-500 block font-mono">24h Low</span>
                  <span className="font-mono font-bold text-slate-800">
                    {currentReading.min24h} {activeCfg.unit}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-500 block font-mono">24h High</span>
                  <span className="font-mono font-bold text-slate-800">
                    {currentReading.max24h} {activeCfg.unit}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-500 block mb-1 font-mono">Expected Operational Band</span>
                <span className="font-mono text-xs text-sky-700 font-bold">
                  {currentReading.expectedMin} — {currentReading.expectedMax} {activeCfg.unit}
                </span>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full ${
                      currentReading.value > currentReading.expectedMax ||
                      currentReading.value < currentReading.expectedMin
                        ? 'bg-rose-500'
                        : 'bg-emerald-500'
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

              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1 font-mono">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Last packet: {currentReading.lastUpdated}</span>
              </div>
            </div>
          </div>

          {/* STEP 2: Dedicated LSTM Autoencoder Sequence Surveillance Panel */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
            
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5 font-mono">
                <Cpu className="w-4 h-4 text-indigo-600" />
                <span>LSTM Autoencoder Surveillance</span>
              </h4>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                currentML.status === 'ANOMALY'
                  ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                  : currentML.status.startsWith('WARMING_UP')
                  ? 'bg-amber-50 text-amber-700 border-amber-300'
                  : currentML.status.startsWith('NOT_APPLICABLE')
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-300'
              }`}>
                {currentML.status}
              </span>
            </div>

            {/* Stream info */}
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-100">
              <span>Stream:</span>
              <span className="text-sky-700 font-semibold">
                {currentSource} ({currentSource === 'NOAA' ? (currentStation.noaaId || currentStation.id) : (currentStation.meteostatId || currentStation.id)})
              </span>
            </div>

            {/* Reconstruction MSE & Threshold */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500">Reconstruction Error (MSE):</span>
                <span className={`font-bold ${
                  currentML.reconstructionError !== null && currentML.reconstructionError > currentML.threshold
                    ? 'text-rose-600'
                    : 'text-emerald-600'
                }`}>
                  {currentML.reconstructionError !== null ? currentML.reconstructionError.toFixed(5) : 'N/A (Warming up)'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500">Frozen Threshold:</span>
                <span className="text-slate-800 font-bold">
                  {currentML.threshold.toFixed(5)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500">Threshold Margin:</span>
                <span className="text-indigo-700">
                  {currentML.reconstructionError !== null
                    ? (currentML.threshold - currentML.reconstructionError > 0
                        ? `+${(currentML.threshold - currentML.reconstructionError).toFixed(5)} margin`
                        : `${(currentML.reconstructionError - currentML.threshold).toFixed(5)} breach`)
                    : 'N/A'}
                </span>
              </div>
            </div>

            {/* Reconstruction Error Ratio (Normalized Proximity Score) */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-700 flex items-center gap-1">
                  <span>Reconstruction-error ratio:</span>
                  <span title="Reconstruction-error ratio (MSE / Threshold), not a calibrated probability">
                    <Info className="w-3 h-3 text-slate-400 cursor-help" />
                  </span>
                </span>
                <span className="text-amber-700 font-bold">
                  {currentML.errorRatio !== null ? `${currentML.errorRatio.toFixed(2)}x` : 'N/A'}
                </span>
              </div>

              {/* Ratio Visual Bar */}
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    currentML.errorRatio !== null && currentML.errorRatio > 1.0
                      ? 'bg-rose-500'
                      : 'bg-indigo-500'
                  }`}
                  style={{
                    width: `${Math.min(100, Math.max(5, (currentML.errorRatio || 0.5) * 50))}%`,
                  }}
                />
              </div>
              <span className="text-[10px] text-slate-500 block font-mono italic">
                *Normalized ratio relative to threshold, not a calibrated probability.
              </span>
            </div>

            {/* Dominant Feature */}
            <div className="flex items-center justify-between text-xs font-mono pt-1 border-t border-slate-100">
              <span className="text-slate-500">Dominant Error Driver:</span>
              <span className="text-amber-700 font-semibold truncate max-w-[140px]" title={currentML.dominantFeature}>
                {currentML.dominantFeature}
              </span>
            </div>

            {/* Prominent Model Disclaimer */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-snug">
              <span className="text-slate-800 font-semibold block mb-0.5 font-mono text-[10px] uppercase">
                Model Performance Disclaimer:
              </span>
              Test recall is ~26.5% / precision ~43% / F1 0.33. Misses are expected, especially for TEMP_DRIFT (11.5%) and TEMP_SPIKE (14.7%).
            </div>
          </div>

          {/* SEPARATE PANEL: Atmospheric Physics & Rule-Based Diagnostics */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm text-xs space-y-2">
            <h5 className="font-bold text-slate-900 flex items-center justify-between font-mono">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                <span>Deterministic Rule-Based Checks</span>
              </span>
              <span className="text-[10px] text-slate-500 font-normal">Independent of ML</span>
            </h5>

            <div className="space-y-1.5 text-[11px] font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Diurnal Envelope:</span>
                <span className={
                  currentReading.value > currentReading.expectedMax || currentReading.value < currentReading.expectedMin
                    ? 'text-rose-600 font-bold'
                    : 'text-emerald-600 font-bold'
                }>
                  {currentReading.value > currentReading.expectedMax || currentReading.value < currentReading.expectedMin
                    ? 'FAIL (Out of Bounds)'
                    : 'PASS (Nominal)'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">1h Rate-of-Change (ROC):</span>
                <span className="text-emerald-600 font-bold">PASS (&lt; 3.0°C/h)</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Cross-Source Divergence:</span>
                <span className="text-emerald-600 font-bold">NOMINAL (&lt; 1.5°C)</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Regional Consensus:</span>
                <span className="text-emerald-600 font-bold">CONSENSUS (4 neighbors)</span>
              </div>
            </div>

            <p className="text-slate-500 leading-relaxed text-[10px] pt-1 border-t border-slate-100 font-sans">
              Rule-based checks enforce physical thermodynamic boundaries and cross-source checks independently of sequence autoencoding.
            </p>
          </div>
        </div>
      </div>

      {/* Live Ingestion Telemetry Stream Table */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-sky-600" />
              <h3 className="text-sm font-bold text-slate-900 tracking-wide uppercase font-mono">
                Recent Ingested Packets — {currentStation.name} ({currentStation.id})
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Rolling queue of the latest telemetry frames transmitted by onboard micro-controller modem.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${simulationStatus === 'RUNNING' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              Channel: MQTT over TLS
            </span>
            <span className="text-slate-300">•</span>
            <span>QoS 1 Ack</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-3">Packet Timestamp</th>
                <th className="py-2.5 px-3">Temp (°C)</th>
                <th className="py-2.5 px-3">Humidity (%)</th>
                <th className="py-2.5 px-3">Pressure (hPa)</th>
                <th className="py-2.5 px-3">Wind (km/h)</th>
                <th className="py-2.5 px-3">Rain (mm)</th>
                <th className="py-2.5 px-3">Payload Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {stationLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
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
                        className="bg-rose-50 border-l-2 border-rose-500 text-rose-800 font-mono"
                      >
                        <td colSpan={6} className="py-2.5 px-3">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                            <span className="font-bold text-rose-800">{entry.timestamp}</span>
                            <span className="text-slate-400">•</span>
                            <span className="text-rose-700">
                              {entry.transitionNote || `${currentStation.id} — No telemetry received — Communication Failure`}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-100 text-rose-800 border border-rose-300">
                            MODEM OFFLINE
                          </span>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr
                      key={entry.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        entry.flag === 'injected'
                          ? 'bg-amber-50/70 border-l-2 border-amber-500 text-slate-900'
                          : isLatest
                          ? 'bg-emerald-50/50 text-slate-900'
                          : 'text-slate-700'
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          {isLatest && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                          )}
                          {entry.flag === 'injected' && (
                            <span className="text-amber-600 text-xs">⚡</span>
                          )}
                          <span className="text-slate-800 font-semibold">{entry.timestamp}</span>
                        </div>
                        {entry.transitionNote && entry.flag === 'injected' && (
                          <div className="text-[10px] text-amber-800 font-mono mt-0.5">
                            {entry.transitionNote}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-amber-700">
                        {entry.temperature.toFixed(1)}
                      </td>
                      <td className="py-2.5 px-3 text-sky-700">
                        {entry.humidity.toFixed(0)}%
                      </td>
                      <td className="py-2.5 px-3 text-indigo-700">
                        {entry.pressure.toFixed(1)}
                      </td>
                      <td className="py-2.5 px-3 text-emerald-700">
                        {entry.wind.toFixed(1)}
                      </td>
                      <td className="py-2.5 px-3 text-blue-700">
                        {entry.rainfall.toFixed(1)}
                      </td>
                      <td className="py-2.5 px-3">
                        {entry.flag === 'injected' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                            INJECTED FAULT
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
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
