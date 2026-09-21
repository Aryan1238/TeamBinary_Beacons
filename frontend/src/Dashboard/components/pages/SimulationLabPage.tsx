import React, { useState } from 'react';
import {
  FlaskConical,
  RotateCcw,
  Sliders,
  AlertTriangle,
  CheckCircle2,
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

export const SimulationLabPage: React.FC = () => {
  const [activeScenario, setActiveScenario] = useState<SimulationScenario>('sudden-spike');
  const [offsetMagnitude, setOffsetMagnitude] = useState<number>(14);
  const [noiseLevel, setNoiseLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');

  const baseData = MOCK_24H_HISTORY['AWS-001'];

  const simulatedData = baseData.map((pt, i) => {
    let temp = pt.temperature;
    let hum = pt.humidity;
    let press = pt.pressure;

    const noise = noiseLevel === 'HIGH' ? (Math.sin(i * 3) * 1.5) : noiseLevel === 'MEDIUM' ? (Math.sin(i * 2) * 0.5) : 0;

    if (activeScenario === 'sudden-spike' && i >= 14) {
      temp += offsetMagnitude + noise;
    } else if (activeScenario === 'gradual-drift' && i >= 8) {
      temp += ((i - 8) * (offsetMagnitude / 10)) + noise;
    } else if (activeScenario === 'frozen-sensor' && i >= 10) {
      temp = 32.4;
    } else if (activeScenario === 'humidity-spike' && i >= 12) {
      hum = 98;
      temp += 10 + noise;
    } else if (activeScenario === 'pressure-drop' && i >= 14) {
      press -= 35;
      temp += noise;
    } else {
      temp += noise;
    }

    return {
      time: pt.time,
      temperature: Math.round(temp * 10) / 10,
      humidity: Math.round(hum),
      pressure: Math.round(press),
    };
  });

  const resetToNormal = () => {
    setActiveScenario('normal');
    setOffsetMagnitude(0);
    setNoiseLevel('LOW');
  };

  const isAnomalous = activeScenario !== 'normal';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Simulation Lab & Fault Injection Testbench"
        subtitle="Controlled experimental harness to stress-test anomaly detection models against synthetic sensor failures."
        badge="ALGORITHMIC TESTBENCH"
      />

      {/* Scenario Presets Bar */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-[#111a31]/90 via-[#0e1628]/85 to-[#090e1c]/95 border border-slate-800/80 backdrop-blur-md shadow-xl space-y-3 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/20 to-transparent" />

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 tracking-tight">
            <FlaskConical className="w-4 h-4 text-amber-400" />
            <span>Select Fault Injection Scenario</span>
          </h3>
          <button
            onClick={resetToNormal}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-semibold bg-slate-900 text-slate-300 hover:text-white border border-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Nominal</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {[
            { id: 'normal', label: 'Nominal Baseline', desc: 'Zero faults active' },
            { id: 'sudden-spike', label: 'Sudden Step Spike', desc: '+14°C step at 14:00' },
            { id: 'gradual-drift', label: 'Gradual Drift', desc: '+0.5°C / hr drift' },
            { id: 'frozen-sensor', label: 'Frozen / Flatline', desc: 'Zero variance stuck' },
            { id: 'humidity-spike', label: 'Thermodynamic Conflict', desc: 'High temp + 98% hum' },
            { id: 'pressure-drop', label: 'Pressure Drop', desc: '-35 hPa abrupt fall' },
          ].map((sc) => (
            <button
              key={sc.id}
              onClick={() => {
                setActiveScenario(sc.id as SimulationScenario);
                if (sc.id === 'normal') setOffsetMagnitude(0);
                else if (offsetMagnitude === 0) setOffsetMagnitude(14);
              }}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                activeScenario === sc.id
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-200 shadow-[0_0_15px_rgba(251,191,36,0.2)]'
                  : 'bg-[#0a101f]/70 border-slate-800/80 hover:bg-slate-800/50 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="text-xs font-bold text-white tracking-tight">{sc.label}</div>
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
            title={`Simulated Stream — Scenario: ${activeScenario.toUpperCase()}`}
            subtitle="Real-time waveform response as synthetic faults are applied to the time series."
            badge="SYNTHETIC WAVEFORM"
            height={360}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={simulatedData} margin={{ top: 15, right: 20, left: -10, bottom: 0 }}>
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
                  y={38}
                  stroke="#f43f5e"
                  strokeDasharray="4 4"
                  label={{ value: 'Normal Envelope Ceiling (38°C)', fill: '#f43f5e', fontSize: 10, position: 'insideTopRight' }}
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
              <span>Fault Parameters</span>
              <Sliders className="w-4 h-4 text-amber-400" />
            </h4>

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
