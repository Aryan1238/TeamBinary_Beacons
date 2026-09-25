import React, { useState, useEffect, useCallback } from 'react';
import {
  FlaskConical,
  RotateCcw,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  Radio,
  Zap,
  Play,
  StopCircle,
  Clock,
  Activity,
  ShieldCheck,
  Cpu,
  Layers,
  Wrench,
  Search,
  ExternalLink,
  ChevronRight,
  Flame,
  Info,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { PageHeader } from '../common/PageHeader';
import type { DashboardTab, SensorType } from '../../types/dashboard.types';
import { API_BASE } from '../../../services/api';

interface SimulationLabPageProps {
  onNavigateTab?: (tab: DashboardTab) => void;
}

const SCENARIOS = [
  { id: 'normal', label: 'Normal Baseline Test', range: 'Nominal telemetry (0 deviation)' },
  { id: 'temperature-spike', label: 'Temperature Spike', range: '+8°C to +15°C (Default: +14.2°C)' },
  { id: 'temperature-drift', label: 'Temperature Drift', range: '+3°C to +8°C (Default: +5.0°C)' },
  { id: 'frozen-sensor', label: 'Frozen Sensor (Zero Variance)', range: 'Constant static value across >=3 cycles' },
  { id: 'humidity-spike', label: 'Humidity Anomaly', range: '+20% to +35% (Default: +25%)' },
  { id: 'pressure-drop', label: 'Pressure Drop', range: '-15 hPa to -25 hPa (Default: -18 hPa)' },
  { id: 'wind-anomaly', label: 'Wind Anomaly', range: '+18 km/h to +30 km/h (Default: +22 km/h)' },
  { id: 'communication-failure', label: 'Communication Failure', range: '>=2.5 hours offline (Packet loss)' },
];

const STATIONS = [
  { id: 'AWS-001', name: 'Chennai / Minambakkam', cadence: '1h', source: 'Meteostat' },
  { id: 'AWS-002', name: 'Bengaluru / HAL Airport', cadence: '1h', source: 'Meteostat' },
  { id: 'AWS-003', name: 'Pune', cadence: '1h', source: 'Meteostat' },
  { id: 'AWS-004', name: 'Mumbai / Santacruz', cadence: '1h', source: 'Meteostat' },
  { id: 'AWS-005', name: 'Kolkata / Dum Dum', cadence: '1h', source: 'Meteostat' },
  { id: 'AWS-006', name: 'Ahmedabad / Sardar Patel', cadence: '3h', source: 'NOAA' },
  { id: 'AWS-007', name: 'Hyderabad / Begumpet', cadence: '3h', source: 'NOAA' },
];

export const SimulationLabPage: React.FC<SimulationLabPageProps> = ({ onNavigateTab }) => {
  const [stationId, setStationId] = useState<string>('AWS-003');
  const [sensor, setSensor] = useState<SensorType>('temperature');
  const [scenario, setScenario] = useState<string>('temperature-spike');
  const [magnitude, setMagnitude] = useState<number>(14.2);
  const [duration, setDuration] = useState<number>(12);
  const [noiseLevel, setNoiseLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [autoWarmup, setAutoWarmup] = useState<boolean>(true);

  const [activeSimulation, setActiveSimulation] = useState<any>(null);
  const [testHistory, setTestHistory] = useState<any[]>([]);
  const [warmupStatus, setWarmupStatus] = useState<any>(null);
  const [running, setRunning] = useState<boolean>(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const currentStation = STATIONS.find((s) => s.id === stationId) || STATIONS[2];
  const is3hCadence = currentStation.cadence === '3h';

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/simulation/status`);
      if (res.ok) {
        const data = await res.json();
        setActiveSimulation(data.simulation);
      }
    } catch {}
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/simulation/history`);
      if (res.ok) {
        const data = await res.json();
        setTestHistory(data.history || []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchHistory();
    const interval = setInterval(() => {
      fetchStatus();
      fetchHistory();
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchStatus, fetchHistory]);

  const handleWarmup = async () => {
    try {
      const res = await fetch(`${API_BASE}/simulation/warmup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ station_id: stationId, source: currentStation.source }),
      });
      const data = await res.json();
      setWarmupStatus(data);
      setActionFeedback(data.message || data.reason || 'Buffer warm-up completed');
    } catch {
      setActionFeedback('Failed to warm up buffer');
    }
  };

  const handleStartSimulation = async (overrideScenario?: string) => {
    const sc = overrideScenario || scenario;
    setRunning(true);
    setActionFeedback(null);
    try {
      let mag = magnitude;
      if (sc === 'normal') mag = 0.0;
      else if (sc === 'temperature-spike') mag = 14.2;
      else if (sc === 'temperature-drift') mag = 5.0;
      else if (sc === 'frozen-sensor') mag = 0.0;
      else if (sc === 'humidity-spike') mag = 25.0;
      else if (sc === 'pressure-drop') mag = -18.0;
      else if (sc === 'wind-anomaly') mag = 22.0;
      else if (sc === 'communication-failure') mag = 2.5;

      const res = await fetch(`${API_BASE}/simulation/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          station_id: stationId,
          sensor,
          scenario: sc,
          magnitude: mag,
          duration,
          noise_level: noiseLevel,
          auto_warmup: autoWarmup,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setActiveSimulation(data);
        fetchHistory();
        setActionFeedback(`Executed ${data.scenario_label}: Verdict ${data.result_summary.verdict}`);
      }
    } catch {
      setActionFeedback('Simulation execution failed');
    } finally {
      setRunning(false);
    }
  };

  const handleClearFault = async () => {
    try {
      const res = await fetch(`${API_BASE}/simulation/clear`, { method: 'POST' });
      if (res.ok) {
        setActiveSimulation(null);
        setActionFeedback('Simulated fault cleared. Live telemetry normalized.');
      }
    } catch {}
  };

  const handleResetLab = async () => {
    try {
      const res = await fetch(`${API_BASE}/simulation/reset-lab`, { method: 'POST' });
      if (res.ok) {
        setActiveSimulation(null);
        setWarmupStatus(null);
        fetchHistory();
        setActionFeedback('Simulation lab reset to clean baseline.');
      }
    } catch {}
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Simulation Lab & Fault Injection Testbench"
        subtitle="End-to-end experimental harness demonstrating the complete assurance pipeline from synthetic injection to maintenance response."
        badge={activeSimulation ? 'FAULT INJECTION ACTIVE' : 'ALGORITHMIC TESTBENCH'}
      />

      {/* Control Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Test Configuration */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-sky-600" />
              <h3 className="font-bold text-slate-900 tracking-tight">Injection Configuration</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleStartSimulation('normal')}
                disabled={running}
                className="px-3 py-1 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-all flex items-center gap-1.5 shadow-xs"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Run Normal Baseline</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Target Station */}
            <div>
              <label className="text-[11px] text-slate-600 font-mono block mb-1">Target Station</label>
              <select
                value={stationId}
                onChange={(e) => setStationId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-medium focus:border-sky-500 shadow-xs"
              >
                {STATIONS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id} — {s.name} ({s.cadence}, {s.source})
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                {is3hCadence ? '3h Synoptic Cadence (NOAA) • ML Lane: NOT_APPLICABLE' : '1h Cadence (Meteostat) • ML Lane: LSTM 24-step active'}
              </span>
            </div>

            {/* Target Sensor */}
            <div>
              <label className="text-[11px] text-slate-600 font-mono block mb-1">Target Sensor Probe</label>
              <select
                value={sensor}
                onChange={(e) => setSensor(e.target.value as SensorType)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-medium focus:border-sky-500 shadow-xs"
              >
                <option value="temperature">Temperature (RTD Platinum)</option>
                <option value="humidity">Humidity (Capacitive)</option>
                <option value="pressure">Pressure (Barometric Piezo)</option>
                <option value="wind">Wind Speed (Ultrasonic)</option>
                <option value="rainfall">Precipitation (Tipping Bucket)</option>
              </select>
            </div>

            {/* Fault Scenario */}
            <div>
              <label className="text-[11px] text-slate-600 font-mono block mb-1">Fault Scenario</label>
              <select
                value={scenario}
                onChange={(e) => {
                  setScenario(e.target.value);
                  const cfg = SCENARIOS.find((s) => s.id === e.target.value);
                  if (cfg?.id === 'temperature-spike') setMagnitude(14.2);
                  else if (cfg?.id === 'temperature-drift') setMagnitude(5.0);
                  else if (cfg?.id === 'frozen-sensor') setMagnitude(0.0);
                  else if (cfg?.id === 'humidity-spike') setMagnitude(25.0);
                  else if (cfg?.id === 'pressure-drop') setMagnitude(-18.0);
                  else if (cfg?.id === 'wind-anomaly') setMagnitude(22.0);
                  else if (cfg?.id === 'communication-failure') setMagnitude(2.5);
                  else setMagnitude(0.0);
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-medium focus:border-sky-500 shadow-xs"
              >
                {SCENARIOS.map((sc) => (
                  <option key={sc.id} value={sc.id}>
                    {sc.label}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                {SCENARIOS.find((s) => s.id === scenario)?.range}
              </span>
            </div>

            {/* Magnitude */}
            <div>
              <label className="text-[11px] text-slate-600 font-mono block mb-1">
                Injection Magnitude ({sensor === 'temperature' ? '°C' : sensor === 'pressure' ? 'hPa' : sensor === 'humidity' ? '%' : 'km/h'})
              </label>
              <input
                type="number"
                step="0.1"
                value={magnitude}
                onChange={(e) => setMagnitude(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono font-bold focus:border-sky-500 shadow-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div>
              <label className="text-[10px] text-slate-600 font-mono block mb-1">Duration (Hours / Steps)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 12)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 font-mono shadow-xs"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-600 font-mono block mb-1">Atmospheric Noise</label>
              <select
                value={noiseLevel}
                onChange={(e) => setNoiseLevel(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 shadow-xs"
              >
                <option value="LOW">Low (Gaussian σ = 0.2)</option>
                <option value="MEDIUM">Medium (Gaussian σ = 0.5)</option>
                <option value="HIGH">High (Turbulent σ = 1.2)</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-4">
              <input
                type="checkbox"
                id="autowarmup"
                checked={autoWarmup}
                onChange={(e) => setAutoWarmup(e.target.checked)}
                className="rounded border-slate-300 text-sky-600 focus:ring-0"
              />
              <label htmlFor="autowarmup" className="text-xs text-slate-700 cursor-pointer">
                Auto-warmup 24h buffer
              </label>
            </div>
          </div>

          {/* Action Buttons Bar */}
          <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleStartSimulation()}
                disabled={running}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all flex items-center gap-2"
              >
                <Flame className="w-4 h-4 text-white" />
                <span>{running ? 'Propagating Pipeline...' : 'Start Fault Injection'}</span>
              </button>

              <button
                onClick={handleClearFault}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs transition-all flex items-center gap-2"
              >
                <StopCircle className="w-4 h-4 text-slate-500" />
                <span>Clear Fault</span>
              </button>

              <button
                onClick={handleResetLab}
                className="px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 transition-all flex items-center gap-1.5"
                title="Reset simulation states and rolling buffers"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Testbench</span>
              </button>
            </div>

            <button
              onClick={handleWarmup}
              className="px-3 py-2 rounded-xl text-xs font-mono bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 shadow-xs transition-all flex items-center gap-1.5"
            >
              <Cpu className="w-3.5 h-3.5 text-sky-600" />
              <span>Pre-Seed 24h Buffer</span>
            </button>
          </div>

          {actionFeedback && (
            <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-800 font-mono">
              {actionFeedback}
            </div>
          )}
        </div>

        {/* Right Column: Live Fault Status / Visualization */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 font-mono">
                <Activity className="w-4 h-4 text-sky-600" />
                Active Test State
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                activeSimulation ? 'bg-rose-100 text-rose-800 border border-rose-200 animate-pulse' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}>
                {activeSimulation ? 'FAULT ACTIVE' : 'NOMINAL STREAM'}
              </span>
            </div>

            {activeSimulation ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-mono">Current Scenario</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">{activeSimulation.scenario_label}</div>
                  <div className="text-[11px] text-slate-600 mt-1">
                    Target: <strong className="text-sky-700">{activeSimulation.station_id}</strong> ({activeSimulation.sensor})
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-mono block">Simulated Value</span>
                    <div className="text-base font-bold text-rose-700 font-mono mt-0.5">
                      {activeSimulation.current_simulated_value} {activeSimulation.unit}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-mono block">Normal Reference</span>
                    <div className="text-base font-bold text-slate-800 font-mono mt-0.5">
                      {activeSimulation.normal_reference_value} {activeSimulation.unit}
                    </div>
                  </div>
                </div>

                {/* Timeline of Real Event Progression */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-mono font-bold text-slate-600 uppercase tracking-wider block mb-2">
                    Event Propagation Sequence
                  </span>
                  <div className="space-y-1.5 text-[11px] font-mono">
                    <div className="flex items-center justify-between text-slate-700">
                      <span>1. INJECTION</span>
                      <span className="text-emerald-700 font-semibold">{activeSimulation.start_time ? new Date(activeSimulation.start_time).toLocaleTimeString() : 'Active'}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-700">
                      <span>2. DETECTION</span>
                      <span className="text-emerald-700 font-semibold">{activeSimulation.result_summary?.detection_mechanism}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-700">
                      <span>3. TRIAGE</span>
                      <span className="text-rose-700 font-bold">{activeSimulation.result_summary?.severity}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-700">
                      <span>4. RESPONSE</span>
                      <span className="text-sky-700 font-semibold">{activeSimulation.ticket?.id || 'Auto-created'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center rounded-xl bg-slate-50 border border-slate-200 my-auto">
                <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto mb-2 opacity-80" />
                <div className="text-xs font-bold text-slate-900">Zero Active Faults</div>
                <p className="text-[11px] text-slate-600 mt-1">
                  Fleet telemetry is currently running in nominal baseline mode. Select a fault scenario above and click Start Fault Injection to evaluate detection.
                </p>
              </div>
            )}
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 font-mono">
            <span>Historical Data Integrity: </span>
            <strong className="text-emerald-700">Read-Only Enforced (Zero Corruption)</strong>
          </div>
        </div>
      </div>

      {/* Pipeline Verification Checklist Panel (Step 5) */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-slate-900 tracking-tight">8-Stage Live Pipeline Verification Checklist</h3>
          </div>
          <span className="text-xs font-mono text-slate-500">
            Stages marked COMPLETE only upon verified event occurrence
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { key: 'fault_injected', label: '1. Fault Injected' },
            { key: 'telemetry_updated', label: '2. Telemetry Updated' },
            { key: 'ml_or_rule_inference', label: '3. Inference Executed' },
            { key: 'anomaly_alert_generated', label: '4. Anomaly Alert' },
            { key: 'deep_dive_evidence_available', label: '5. Deep-Dive Evidence' },
            { key: 'spatial_analysis_available', label: '6. Spatial Consensus' },
            { key: 'sensor_health_updated', label: '7. Health Matrix Updated' },
            { key: 'maintenance_ticket_created', label: '8. Ticket Dispatched' },
          ].map(({ key, label }) => {
            const step = activeSimulation?.pipeline_steps?.[key];
            const isDone = !!step?.complete;

            return (
              <div
                key={key}
                className={`p-3.5 rounded-xl border transition-all ${
                  isDone
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-mono font-bold tracking-tight">{label}</span>
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
                      PENDING
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 line-clamp-2">
                  {step?.detail || 'Awaiting fault propagation trigger...'}
                </p>
                {step?.timestamp && (
                  <span className="text-[9px] font-mono text-slate-400 block mt-1">
                    {new Date(step.timestamp).toLocaleTimeString()}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Result Summary Card (Step 6 & 7) */}
      {activeSimulation?.result_summary && (
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
            <h3 className="font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-600" />
              <span>Live Test Execution Verdict &amp; Summary</span>
            </h3>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-xl text-xs font-mono font-bold ${
                activeSimulation.result_summary.verdict === 'PASS'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-100 text-rose-800 border border-rose-200'
              }`}>
                VERDICT: {activeSimulation.result_summary.verdict}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 font-mono block">Detection Mode</span>
              <div className="text-sm font-bold text-sky-800 mt-0.5">
                {activeSimulation.result_summary.detection_mechanism}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 font-mono block">Reconstruction Error</span>
              <div className="text-sm font-bold text-slate-900 mt-0.5">
                {activeSimulation.result_summary.reconstruction_error !== null
                  ? `${activeSimulation.result_summary.reconstruction_error} (Threshold ${activeSimulation.result_summary.threshold})`
                  : 'NOT_APPLICABLE (3h cadence)'}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 font-mono block">Sensor Health Outcome</span>
              <div className="text-sm font-bold text-rose-700 mt-0.5">
                {activeSimulation.result_summary.sensor_health_result}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-500 font-mono block">Maintenance Action</span>
              <div className="text-sm font-bold text-amber-800 mt-0.5">
                {activeSimulation.result_summary.maintenance_outcome}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <strong className="text-sky-800">Verdict Rationale: </strong>
            <span className="text-slate-700">{activeSimulation.result_summary.verdict_reason}</span>
          </div>
        </div>
      )}

      {/* Test History Table (Step 8) */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
          <h3 className="font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <span>Testbench Execution History (Isolated Simulation Records)</span>
          </h3>
          <span className="text-xs font-mono text-slate-500">
            {testHistory.length} recorded runs
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-mono text-slate-600 uppercase tracking-wider">
                <th className="py-2.5 px-3">Test ID</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Station &amp; Sensor</th>
                <th className="py-2.5 px-3">Scenario</th>
                <th className="py-2.5 px-3">Detection</th>
                <th className="py-2.5 px-3">Health Status</th>
                <th className="py-2.5 px-3">Ticket</th>
                <th className="py-2.5 px-3 text-right">Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {testHistory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-500">
                    No simulation tests logged yet. Execute a scenario above to inspect historical runs.
                  </td>
                </tr>
              ) : (
                testHistory.slice(0, 10).map((run) => (
                  <tr key={run.test_id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-sky-700 font-bold">{run.test_id}</td>
                    <td className="py-2.5 px-3 text-slate-500">{new Date(run.timestamp).toLocaleTimeString()}</td>
                    <td className="py-2.5 px-3 text-slate-900 font-semibold">{run.station_id} ({run.sensor})</td>
                    <td className="py-2.5 px-3 text-slate-700">{run.scenario}</td>
                    <td className="py-2.5 px-3 text-slate-800">{run.detection_mechanism}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        run.sensor_health === 'HEALTHY' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}>
                        {run.sensor_health}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-amber-800 font-semibold">{run.ticket_id || 'None'}</td>
                    <td className="py-2.5 px-3 text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        run.verdict === 'PASS' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}>
                        {run.verdict}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
