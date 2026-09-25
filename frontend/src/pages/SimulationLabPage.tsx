import React, { useState } from 'react';
import {
  FlaskConical,
  Zap,
  Flame,
  CloudRain,
  Snowflake,
  TrendingUp,
  RotateCcw,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  ArrowRight,
  AlertTriangle,
  Globe2
} from 'lucide-react';
import { Station } from '../types';
import { api } from '../services/api';

interface SimulationLabPageProps {
  stations: Station[];
  onTriggerScenario: (scenario: string) => Promise<void>;
  onReset: () => Promise<void>;
}

export const SimulationLabPage: React.FC<SimulationLabPageProps> = ({
  stations,
  onTriggerScenario,
  onReset
}) => {
  const [targetStationId, setTargetStationId] = useState('LOC-MH-02');
  const [customParam, setCustomParam] = useState<'Temperature' | 'Pressure' | 'Humidity'>('Temperature');
  const [customValue, setCustomValue] = useState('55.0');
  const [isInjecting, setIsInjecting] = useState(false);
  const [lastActionStatus, setLastActionStatus] = useState<string | null>(null);

  // 8-stage decision timeline
  const decisionTimeline = [
    { time: 'T+0.0s', label: 'Sensor observation received', desc: 'Telemetry packet ingested at simulated RTU gateway (12ms edge latency)', status: 'done' },
    { time: 'T+0.4s', label: 'Temporal anomaly flagged', desc: 'Rate of change departure beyond rolling standard deviation window', status: 'done' },
    { time: 'T+0.8s', label: 'Spatial consensus comparison', desc: 'Evaluates nearest neighbor consensus with Inverse Distance Weighting (IDW)', status: 'done' },
    { time: 'T+1.2s', label: 'Multivariate physical analysis', desc: 'Clausius-Clapeyron saturation consistency check', status: 'done' },
    { time: 'T+1.5s', label: 'AI classification completed', desc: 'Categorized into isolated transducer fault or genuine regional squall front', status: 'done' },
    { time: 'T+1.8s', label: 'Alert dispatched', desc: 'CRITICAL alert broadcasted to National AWS Command Center', status: 'done' },
    { time: 'T+2.0s', label: 'Corrected value estimated', desc: 'Hybrid spatial-temporal imputation calculated with immutable raw data lineage', status: 'done' },
    { time: 'T+2.3s', label: 'Maintenance ticket queued', desc: 'Automated field calibration inspection ticket generated', status: 'done' },
  ];

  const scenarios = [
    {
      id: 'scenario_1_spike',
      title: '1. Catastrophic Sensor Spike (55°C)',
      target: 'AWS-MH-042 (Pune)',
      desc: 'Simulates sudden transducer fault. Spikes temperature to 55°C. AI identifies isolated departure, calculates 97% confidence anomaly, and computes imputed value.',
      icon: Flame,
      color: 'bg-red-50 text-red-600 border-red-200'
    },
    {
      id: 'scenario_2_regional',
      title: '2. Regional Genuine Weather Front',
      target: 'Western Ghats (5 Stations)',
      desc: 'Simulates incoming convective squall. 5 stations simultaneously drop temp & surge humidity. AI verifies spatial consensus and authenticates as Genuine Weather!',
      icon: CloudRain,
      color: 'bg-blue-50 text-blue-600 border-blue-200'
    },
    {
      id: 'scenario_freeze',
      title: '3. Frozen Sensor (Stuck ADC)',
      target: 'AWS-MH-014 (Nashik)',
      desc: 'Sensor reading locks with zero micro-variance across consecutive cycles. AI detects stuck transducer condition.',
      icon: Snowflake,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200'
    },
    {
      id: 'scenario_drift',
      title: '4. Sensor Calibration Drift',
      target: 'AWS-RJ-045 (Jodhpur)',
      desc: 'Progressive creeping bias (+0.3°C/step). AI detects rate of change divergence relative to historical regional baseline.',
      icon: TrendingUp,
      color: 'bg-amber-50 text-amber-600 border-amber-200'
    }
  ];

  const handleQuickTrigger = async (scenario: string, name: string) => {
    setIsInjecting(true);
    setLastActionStatus(`Injecting ${name}...`);
    await onTriggerScenario(scenario);
    setLastActionStatus(`Successfully activated ${name}! Dashboard switched to Demo Mode.`);
    setIsInjecting(false);
  };

  const handleCustomInject = async () => {
    setIsInjecting(true);
    const val = parseFloat(customValue) || 55.0;
    let type = 'spike';
    if (customParam === 'Pressure') type = 'pressure_spike';
    if (customParam === 'Humidity') type = 'humidity_spike';

    setLastActionStatus(`Injecting custom ${customParam} value ${val} on ${targetStationId}...`);
    await api.injectAnomaly({
      station_id: targetStationId,
      anomaly_type: type,
      parameter: customParam,
      value: val
    });
    setLastActionStatus(`Custom injection complete on ${targetStationId}. Dashboard switched to Demo Mode.`);
    setIsInjecting(false);
  };

  const handleReturnToLive = async () => {
    setLastActionStatus('Resetting system to live Open-Meteo weather stream...');
    await onReset();
    setLastActionStatus('System restored to LIVE Open-Meteo mode.');
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50 text-slate-900 font-sans">
      {/* Simulation Mode Warning Banner */}
      <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-amber-950 uppercase tracking-wide">
              CONTROLLED SIMULATION & FAULT INJECTION TESTBENCH
            </h2>
            <p className="text-xs text-amber-800 mt-0.5 font-sans">
              Injecting scenarios here tests SkyGuard's ML isolation algorithms in <strong>Demo Mode</strong>. Real live Open-Meteo data can be restored instantly.
            </p>
          </div>
        </div>

        <button
          onClick={handleReturnToLive}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs shrink-0"
        >
          <Globe2 className="w-4 h-4" />
          <span>Return to Live Weather Data</span>
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              AI Anomaly Simulation Lab
            </h1>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300 font-semibold">
              VERIFICATION SUITE
            </span>
          </div>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Test and evaluate the end-to-end multi-dimensional anomaly detection and self-healing pipelines
          </p>
        </div>

        {lastActionStatus && (
          <div className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-mono text-cyan-800 shadow-xs">
            {lastActionStatus}
          </div>
        )}
      </div>

      {/* 4 Official Scenarios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scenarios.map(sc => {
          const Icon = sc.icon;
          return (
            <div
              key={sc.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-amber-400 transition"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl border ${sc.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900">{sc.title}</h3>
                      <span className="text-xs font-mono text-cyan-800 font-semibold">{sc.target}</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {sc.desc}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-sans">1-Click Execution</span>
                <button
                  onClick={() => handleQuickTrigger(sc.id, sc.title)}
                  disabled={isInjecting}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                >
                  <Zap className="w-3.5 h-3.5 fill-white" />
                  <span>{isInjecting ? 'Executing...' : 'Run Scenario'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Custom Injection + Decision Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Custom Injection Form */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-cyan-600" />
            <h3 className="font-bold text-base text-slate-900">Custom Parameter Injection</h3>
          </div>
          <p className="text-xs text-slate-500">
            Select an AWS location and inject custom excursions to watch the real-time AI classification response.
          </p>

          <div className="space-y-3 font-sans text-xs pt-1">
            <div>
              <label className="text-slate-600 font-semibold block mb-1">Target Station:</label>
              <select
                value={targetStationId}
                onChange={(e) => setTargetStationId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 outline-none focus:border-cyan-500 focus:bg-white"
              >
                {stations.map(st => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.state}) — Current: {st.temperature}°C
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Parameter:</label>
                <select
                  value={customParam}
                  onChange={(e) => setCustomParam(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 outline-none focus:border-cyan-500 focus:bg-white"
                >
                  <option value="Temperature">Temperature (°C)</option>
                  <option value="Pressure">Pressure (hPa)</option>
                  <option value="Humidity">Humidity (%)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Target Value:</label>
                <input
                  type="text"
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 outline-none focus:border-cyan-500 focus:bg-white font-mono"
                  placeholder="e.g. 55.0"
                />
              </div>
            </div>

            <button
              onClick={handleCustomInject}
              disabled={isInjecting}
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs transition shadow-xs flex items-center justify-center gap-2 mt-2"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>{isInjecting ? 'Injecting Excursion...' : 'Inject Custom Fault'}</span>
            </button>
          </div>
        </div>

        {/* 8-Stage Real-Time Decision Timeline */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-600" />
              <span>8-Stage End-to-End Decision Timeline</span>
            </h3>
            <span className="text-xs font-mono text-emerald-600 font-semibold">Deterministic</span>
          </div>

          <div className="space-y-3 pt-2">
            {decisionTimeline.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 text-xs font-sans">
                <div className="font-mono text-cyan-700 font-bold w-16 shrink-0 mt-0.5">
                  {item.time}
                </div>
                <div className="w-2 h-2 rounded-full bg-cyan-600 mt-1.5 shrink-0" />
                <div className="flex-1">
                  <p className="font-bold text-slate-900">{item.label}</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
