import React, { useState } from 'react';
import {
  FlaskConical,
  RotateCcw,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  Radio,
  Zap,
  RadioOff,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { PageHeader } from '../common/PageHeader';
import { ChartWrapper } from '../common/ChartWrapper';
import type { SimulationScenario } from '../../types/dashboard.types';
import { MOCK_24H_HISTORY } from '../../data/mockStations';
import { useTelemetry, FaultType } from '../../context/TelemetryContext';

export const SimulationLabPage: React.FC = () => {
  const {
    stations,
    simulationStatus,
    historyBuffers,
    activeFaults,
    injectFault,
    clearFault,
  } = useTelemetry();

  const [selectedStationId, setSelectedStationId] = useState<string>('AWS-003');
  const [activeScenario, setActiveScenario] = useState<SimulationScenario>('sudden-spike');
  const [offsetMagnitude, setOffsetMagnitude] = useState<number>(14);
  const [noiseLevel, setNoiseLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');

  const currentStation = stations.find((s) => s.id === selectedStationId) || stations[0];
  const stationActiveFault = activeFaults[currentStation.id];

  // Real-time live history data for selected station
  const liveHistory = historyBuffers[currentStation.id] || MOCK_24H_HISTORY[currentStation.id] || MOCK_24H_HISTORY['AWS-001'];

  const handleApplyInjection = () => {
    if (activeScenario === 'normal') {
      clearFault(currentStation.id);
    } else {
      injectFault(currentStation.id, activeScenario as FaultType);
    }
  };

  const handleClearFault = () => {
    clearFault(currentStation.id);
    setActiveScenario('normal');
  };

  const isAnomalous = activeScenario !== 'normal' || !!stationActiveFault;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Simulation Lab & Fault Injection Testbench"
        subtitle="Controlled experimental harness to stress-test anomaly detection models against synthetic sensor failures."
        badge={simulationStatus === 'RUNNING' ? 'LIVE FAULT INJECTOR ACTIVE' : 'ALGORITHMIC TESTBENCH'}
      />

      {/* Fleet Active Faults Summary Banner */}
      {Object.keys(activeFaults).length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-wrap items-center justify-between gap-3 shadow-lg backdrop-blur-md">
          <div className="flex flex-wrap items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="text-xs font-semibold text-amber-200">
              Active Fault Injections in Fleet ({Object.keys(activeFaults).length}):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {Object.values(activeFaults).map((f) => (
                <span
                  key={f.stationId}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40"
                >
                  <span>{f.stationId}</span>
                  <span className="text-amber-400 font-bold">•</span>
                  <span>{f.label}</span>
                  <button
                    onClick={() => clearFault(f.stationId)}
                    className="hover:text-white font-bold ml-1 text-amber-300 hover:text-rose-300"
                    title="Clear Fault"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={() => Object.keys(activeFaults).forEach((id) => clearFault(id))}
            className="text-[11px] font-mono text-amber-300 hover:text-white underline cursor-pointer"
          >
            Clear All Active Faults
          </button>
        </div>
      )}

      {/* Target Station & Scenario Presets Bar */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-[#111a31]/90 via-[#0e1628]/85 to-[#090e1c]/95 border border-slate-800/80 backdrop-blur-md shadow-xl space-y-4 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/20 to-transparent" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 tracking-tight">
              <FlaskConical className="w-4 h-4 text-amber-400" />
              <span>Fault Injection Testbench</span>
            </h3>

            {/* Target Station Selector */}
            <div className="flex items-center gap-2">
              <label htmlFor="target-station" className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <Radio className="w-3.5 h-3.5 text-sky-400" />
                Target:
              </label>
              <select
                id="target-station"
                value={selectedStationId}
                onChange={(e) => setSelectedStationId(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-[#090e1c] border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-amber-500"
              >
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id} — {s.name} {s.dataSource || '[Meteostat + NOAA]'} ({s.status}) {activeFaults[s.id] ? '⚡ [ACTIVE FAULT]' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {stationActiveFault && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>ACTIVE: {stationActiveFault.label.toUpperCase()}</span>
              </span>
            )}
            <button
              onClick={handleClearFault}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold bg-slate-900 text-slate-300 hover:text-white border border-slate-800 transition-colors"
              title="Clear active fault on selected station"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Fault</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
          {[
            { id: 'normal', label: 'Nominal Baseline', desc: 'Zero faults active' },
            { id: 'sudden-spike', label: 'Sudden Step Spike', desc: '+12°C step jump' },
            { id: 'gradual-drift', label: 'Gradual Drift', desc: '+0.8°C / tick drift' },
            { id: 'frozen-sensor', label: 'Frozen / Flatline', desc: 'Zero variance stuck' },
            { id: 'humidity-spike', label: 'Humidity Spike', desc: 'Jump to 98% RH' },
            { id: 'pressure-drop', label: 'Pressure Drop', desc: '-17 hPa abrupt drop' },
            { id: 'communication-failure', label: 'Telemetry Failure', desc: 'Offline / Signal drop' },
          ].map((sc) => (
            <button
              key={sc.id}
              onClick={() => {
                setActiveScenario(sc.id as SimulationScenario);
                if (sc.id === 'normal') setOffsetMagnitude(0);
                else if (offsetMagnitude === 0) setOffsetMagnitude(14);
              }}
              className={`p-3 rounded-xl border text-left transition-all ${
                activeScenario === sc.id
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-200 shadow-[0_0_15px_rgba(251,191,36,0.2)]'
                  : 'bg-[#0a101f]/70 border-slate-800/80 hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="text-xs font-bold text-white tracking-tight flex items-center justify-between">
                <span>{sc.label}</span>
                {sc.id === 'communication-failure' && <RadioOff className="w-3 h-3 text-slate-400" />}
              </div>
              <div className="text-[10px] text-slate-400 mt-1 font-mono">{sc.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Controls & Live Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Real-time Dynamic Injected Chart */}
        <div className="lg:col-span-3">
          <ChartWrapper
            title={`Telemetry Waveform — ${currentStation.name} (${currentStation.id})`}
            subtitle={`Real-time sensor waveform response. Active scenario: ${activeScenario.toUpperCase()}${stationActiveFault ? ` • [INJECTED: ${stationActiveFault.label}]` : ''}`}
            badge={simulationStatus === 'RUNNING' ? 'LIVE STREAM' : 'SYNTHETIC WAVEFORM'}
            height={360}
            controls={
              <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                {stationActiveFault && (
                  <span className="flex items-center gap-1 text-amber-300 font-bold animate-pulse">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Fault Injected at {stationActiveFault.injectedAt}</span>
                  </span>
                )}
                {simulationStatus !== 'RUNNING' && (
                  <span className="text-slate-500 text-[11px]">
                    (Click "Start" in header to advance live ticks)
                  </span>
                )}
              </div>
            }
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={liveHistory} margin={{ top: 15, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c253d" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} domain={['auto', 'auto']} />
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
                <ReferenceLine
                  y={currentStation.sensors.temperature.expectedMax}
                  stroke="#f43f5e"
                  strokeDasharray="4 4"
                  label={{ value: `Upper Threshold (${currentStation.sensors.temperature.expectedMax}°C)`, fill: '#f43f5e', fontSize: 10, position: 'insideTopRight' }}
                />
                <ReferenceLine
                  y={currentStation.sensors.temperature.expectedMin}
                  stroke="#38bdf8"
                  strokeDasharray="4 4"
                  label={{ value: `Lower Threshold (${currentStation.sensors.temperature.expectedMin}°C)`, fill: '#38bdf8', fontSize: 10, position: 'insideBottomRight' }}
                />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  name="Temperature (°C)"
                  stroke={isAnomalous ? '#f59e0b' : '#38bdf8'}
                  strokeWidth={2.5}
                  dot={{ r: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </div>

        {/* Sliders & Decision Engine Diagnostics */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-gradient-to-b from-[#111a31]/90 via-[#0e1628]/85 to-[#090e1c]/95 border border-slate-800/80 backdrop-blur-md shadow-xl space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between font-mono">
              <span>Fault Injection Controls</span>
              <Sliders className="w-4 h-4 text-amber-400" />
            </h4>

            {/* Prominent Action Button: Inject into Live Feed */}
            <div className="space-y-2">
              <button
                onClick={handleApplyInjection}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-950/50 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Inject Fault into Live Feed</span>
              </button>

              <button
                onClick={handleClearFault}
                disabled={!stationActiveFault}
                className={`w-full py-2 px-3 rounded-xl text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  stationActiveFault
                    ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer'
                    : 'bg-slate-900/40 text-slate-600 border border-slate-800/40 cursor-not-allowed'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear Fault on {currentStation.id}</span>
              </button>
            </div>

            {/* Magnitude Slider */}
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1 font-mono">
                <span>Fault Magnitude:</span>
                <span className="font-bold text-amber-400">+{offsetMagnitude}°C</span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                value={offsetMagnitude}
                onChange={(e) => setOffsetMagnitude(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Noise Level Buttons */}
            <div>
              <span className="text-xs text-slate-400 block mb-1.5 font-mono">Sensor Gaussian Noise:</span>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                {(['LOW', 'MEDIUM', 'HIGH'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setNoiseLevel(lvl)}
                    className={`py-1 rounded-lg font-mono font-semibold transition-all ${
                      noiseLevel === lvl
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_8px_rgba(251,191,36,0.2)]'
                        : 'bg-[#0a101f] border border-slate-800 text-slate-400'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Real-time Classifier Decision Box with Glow */}
          <div className={`p-5 rounded-2xl border backdrop-blur-md shadow-xl transition-all ${
            isAnomalous
              ? 'bg-gradient-to-b from-[#25131b]/85 via-[#161224]/80 to-[#090e1c]/95 border-rose-500/40 shadow-[0_4px_24px_rgba(244,63,94,0.15)]'
              : 'bg-gradient-to-b from-[#102422]/85 via-[#0e172a]/80 to-[#090e1c]/95 border-emerald-500/35 shadow-[0_4px_24px_rgba(52,211,153,0.15)]'
          }`}>
            <h5 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2 font-mono">
              {isAnomalous ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span className="text-rose-300">Anomaly Classifier Verdict</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">Nominal Stream</span>
                </>
              )}
            </h5>

            <div className="space-y-1.5 text-[11px] font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Envelope Check:</span>
                <span className={isAnomalous ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                  {isAnomalous ? 'FAIL (Z > 3.8)' : 'PASS'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Physical Check:</span>
                <span className={activeScenario === 'humidity-spike' ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                  {activeScenario === 'humidity-spike' ? 'CONFLICT' : 'PASS'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Spatial Neighbors:</span>
                <span className={isAnomalous ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                  {isAnomalous ? 'OUTLIER' : 'CONSENSUS'}
                </span>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-xs text-slate-300">
              <strong className="text-white">Action: </strong>
              {isAnomalous ? 'Auto-ticket dispatched to field crew' : 'Telemetry logged to baseline archive'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
