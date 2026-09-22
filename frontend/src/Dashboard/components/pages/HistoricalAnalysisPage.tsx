import React, { useState } from 'react';
import { Layers, Radio } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { PageHeader } from '../common/PageHeader';
import { ChartWrapper } from '../common/ChartWrapper';
import type { AWSStation, SensorType } from '../../types/dashboard.types';
import { MOCK_24H_HISTORY } from '../../data/mockStations';

interface HistoricalAnalysisPageProps {
  stations: AWSStation[];
}

export const HistoricalAnalysisPage: React.FC<HistoricalAnalysisPageProps> = ({ stations }) => {
  const [selectedStationId, setSelectedStationId] = useState<string>(stations[0]?.id || 'AWS-001');
  const [selectedSensor, setSelectedSensor] = useState<SensorType>('temperature');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');

  const selectedStation = stations.find((s) => s.id === selectedStationId) || stations[0];
  const historyData = MOCK_24H_HISTORY[selectedStation.id] || MOCK_24H_HISTORY['AWS-001'];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Historical Drift & Time-Series Analysis"
        subtitle="Long-term sensor stability tracking, calibration drift detection, and diurnal baseline models."
        badge="HISTORICAL ARCHIVE"
      />

      {/* Configuration Controls Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#111a31]/90 via-[#0e1628]/85 to-[#090e1c]/95 border border-slate-800/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-sky-400" />
            <select
              value={selectedStation.id}
              onChange={(e) => setSelectedStationId(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#090e1c] border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-sky-500"
            >
              {stations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id} — {s.name} ({s.state}) {s.dataSource || '[Meteostat + NOAA]'}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <select
              value={selectedSensor}
              onChange={(e) => setSelectedSensor(e.target.value as SensorType)}
              className="px-3 py-1.5 rounded-xl bg-[#090e1c] border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-sky-500 capitalize"
            >
              <option value="temperature">Temperature</option>
              <option value="humidity">Relative Humidity</option>
              <option value="pressure">Barometric Pressure</option>
              <option value="wind">Wind Speed</option>
              <option value="rainfall">Precipitation</option>
            </select>
          </div>
        </div>

        {/* Time Span Picker */}
        <div className="flex items-center gap-1 bg-[#0a101f]/90 p-1.5 rounded-xl border border-slate-800 text-xs">
          {(['24h', '7d', '30d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-lg font-mono font-semibold uppercase transition-all ${
                timeRange === range
                  ? 'bg-sky-500/20 text-sky-200 border border-sky-500/40 shadow-[0_0_10px_rgba(56,189,248,0.2)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Historical Trend Chart */}
      <ChartWrapper
        title={`Historical Time-Series Archive — ${selectedSensor.toUpperCase()}`}
        subtitle={`Historical data playback for ${selectedStation.name} (${selectedStation.id}) over ${timeRange.toUpperCase()} span`}
        badge="TELEMETRY LOG"
        height={360}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={historyData} margin={{ top: 15, right: 20, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="histGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
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
            />
            <Area
              type="monotone"
              dataKey={selectedSensor}
              stroke="#38bdf8"
              strokeWidth={2.5}
              fill="url(#histGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartWrapper>

      {/* Long-Term Calibration & Statistical Metrics Cards with Assigned Accents */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-gradient-to-b from-[#111a31]/90 via-[#0e1628]/85 to-[#090e1c]/95 border border-slate-800/80 backdrop-blur-md shadow-xl">
          <span className="text-xs text-slate-400 font-mono font-medium block">Empirical Mean (μ)</span>
          <div className="text-2xl font-black font-mono text-white mt-1">
            {selectedStation.sensors[selectedSensor].value} {selectedStation.sensors[selectedSensor].unit}
          </div>
          <span className="text-[10px] text-slate-400 font-mono">24-hour moving average</span>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-b from-[#181538]/80 via-[#0f142c]/85 to-[#090e1c]/95 border border-indigo-500/25 backdrop-blur-md shadow-xl">
          <span className="text-xs text-indigo-300 font-mono font-medium block">Standard Deviation (σ)</span>
          <div className="text-2xl font-black font-mono text-indigo-400 mt-1">
            ±2.4 {selectedStation.sensors[selectedSensor].unit}
          </div>
          <span className="text-[10px] text-indigo-400/80 font-mono">Diurnal spread envelope</span>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-b from-[#231b12]/80 via-[#0e1628]/85 to-[#090e1c]/95 border border-amber-500/25 backdrop-blur-md shadow-xl">
          <span className="text-xs text-amber-300 font-mono font-medium block">Observed Range</span>
          <div className="text-xl font-bold font-mono text-amber-300 mt-1">
            {selectedStation.sensors[selectedSensor].min24h} → {selectedStation.sensors[selectedSensor].max24h}
          </div>
          <span className="text-[10px] text-amber-400/80 font-mono">Min to max boundaries</span>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-b from-[#102422]/80 via-[#0e172a]/85 to-[#090e1c]/95 border border-emerald-500/25 backdrop-blur-md shadow-xl">
          <span className="text-xs text-emerald-300 font-mono font-medium block">Drift Coefficient</span>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
            +0.04% / mo
          </div>
          <span className="text-[10px] text-emerald-400/80 font-mono">Within factory calibration</span>
        </div>
      </div>
    </div>
  );
};
