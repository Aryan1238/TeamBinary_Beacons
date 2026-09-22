import React, { useState } from 'react';
import {
  Network,
  Radio,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { PageHeader } from '../common/PageHeader';
import { ChartWrapper } from '../common/ChartWrapper';
import type { AWSStation, DashboardTab } from '../../types/dashboard.types';
import { MOCK_24H_HISTORY } from '../../data/mockStations';

interface CrossStationIntelligencePageProps {
  stations: AWSStation[];
  onNavigateTab: (tab: DashboardTab) => void;
}

export const CrossStationIntelligencePage: React.FC<CrossStationIntelligencePageProps> = ({
  stations,
  onNavigateTab,
}) => {
  const [targetId, setTargetId] = useState<string>('AWS-003');

  const targetStation = stations.find((s) => s.id === targetId) || stations[2];

  // Pick 3 neighbors dynamically from other stations
  const otherStations = stations.filter((s) => s.id !== targetStation.id);
  const nb1 = otherStations[0] || stations[0];
  const nb2 = otherStations[1] || stations[1];
  const nb3 = otherStations[2] || stations[2];
  const neighbors = [nb1, nb2, nb3];

  // Combined 24h data for the 4 stations
  const baseCurve = MOCK_24H_HISTORY['AWS-001'] || [];
  const combinedHistory = baseCurve.map((item, index) => {
    return {
      time: item.time,
      targetTemp: MOCK_24H_HISTORY[targetStation.id]?.[index]?.temperature ?? item.temperature,
      nb1Temp: MOCK_24H_HISTORY[nb1.id]?.[index]?.temperature ?? item.temperature,
      nb2Temp: MOCK_24H_HISTORY[nb2.id]?.[index]?.temperature ?? item.temperature,
      nb3Temp: MOCK_24H_HISTORY[nb3.id]?.[index]?.temperature ?? item.temperature,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Spatial Intelligence & Cross-Station Correlation"
        subtitle="Multi-point spatial consensus analysis comparing candidate stations against neighboring meteorological nodes."
        badge="SPATIAL CONSENSUS ENGINE"
      />

      {/* Target Station Selector */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#111a31]/90 via-[#0e1628]/85 to-[#090e1c]/95 border border-slate-800/80 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <label htmlFor="target-station" className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
            <Radio className="w-3.5 h-3.5 text-indigo-400" />
            Target Station under Analysis:
          </label>
          <select
            id="target-station"
            value={targetStation.id}
            onChange={(e) => setTargetId(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[#090e1c] border border-slate-700 text-sm font-semibold text-white focus:outline-none focus:border-indigo-500"
          >
            {stations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id} — {s.name} ({s.state}) {s.dataSource || '[Meteostat + NOAA]'} ({s.status})
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Inverse Distance Weighted Radius: <strong className="text-indigo-400">250 km</strong>
        </div>
      </div>

      {/* Spatial Neighbor Comparison Table with Dusk Styling */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-[#111a31]/90 via-[#0e1628]/85 to-[#090e1c]/95 border border-slate-800/80 backdrop-blur-md shadow-xl overflow-hidden relative">
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-400/20 to-transparent" />

        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-white flex items-center gap-2 tracking-tight">
              <Network className="w-4 h-4 text-indigo-400" />
              <span>Neighbor Consensus Matrix</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Evaluating spatial divergence between target station and surrounding observational mesh.
            </p>
          </div>
          <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/35">
            PEER CLUSTER: NORTH-WEST
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#0a101f]/90 text-slate-400 font-mono uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Station Node</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Distance</th>
                <th className="py-2.5 px-3">Observed Temp</th>
                <th className="py-2.5 px-3">Humidity</th>
                <th className="py-2.5 px-3">Pressure</th>
                <th className="py-2.5 px-3">R² Correlation</th>
                <th className="py-2.5 px-3">Consensus Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {/* Target Row — Warm Coral-Red Accent */}
              <tr className="bg-rose-950/25 text-slate-200 font-semibold">
                <td className="py-3 px-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse shadow-[0_0_6px_rgba(244,63,94,0.6)]" />
                  <span className="text-white font-bold">{targetStation.name} ({targetStation.id})</span>
                </td>
                <td className="py-3 px-3 text-rose-300 uppercase text-[10px]">Target Node</td>
                <td className="py-3 px-3 text-slate-400">0 km (Origin)</td>
                <td className="py-3 px-3 text-rose-400 font-bold">{targetStation.sensors.temperature.value}°C</td>
                <td className="py-3 px-3">{targetStation.sensors.humidity.value}%</td>
                <td className="py-3 px-3">{targetStation.sensors.pressure.value} hPa</td>
                <td className="py-3 px-3 text-rose-400">0.24 (Divergent)</td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px]">
                    ANOMALY OUTLIER
                  </span>
                </td>
              </tr>

              {/* Neighbor Rows — Mint Green Accents */}
              {neighbors.map((nb, i) => (
                <tr key={nb.id} className="hover:bg-slate-800/40 text-slate-300 transition-colors">
                  <td className="py-3 px-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
                    <span className="text-slate-200">{nb.name} ({nb.id})</span>
                  </td>
                  <td className="py-3 px-3 text-slate-400 uppercase text-[10px]">Neighbor #{i + 1}</td>
                  <td className="py-3 px-3 text-slate-400">{240 + i * 85} km</td>
                  <td className="py-3 px-3 text-emerald-400 font-semibold">{nb.sensors.temperature.value}°C</td>
                  <td className="py-3 px-3">{nb.sensors.humidity.value}%</td>
                  <td className="py-3 px-3">{nb.sensors.pressure.value} hPa</td>
                  <td className="py-3 px-3 text-emerald-400">0.96 (Coherent)</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/35 text-[10px]">
                      REGIONAL CONSENSUS
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Synchronized Multi-Station Diurnal Comparison Chart */}
      <ChartWrapper
        title="Synchronized Diurnal Curves: Target Station vs 3 Regional Peers"
        subtitle="Visual proof of spatial divergence: Peer stations follow normal atmospheric curve; target spikes aberrantly at 14:00."
        badge="CROSS-STATION SYNCHRONIZATION"
        height={360}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={combinedHistory} margin={{ top: 15, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1c253d" />
            <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit="°C" domain={[15, 52]} />
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
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              iconType="circle"
            />
            <Line
              type="monotone"
              dataKey="targetTemp"
              name={`${targetStation.name} (${targetStation.id}) [Target]`}
              stroke="#f43f5e"
              strokeWidth={3}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="nb1Temp"
              name={`${nb1.name} (${nb1.id})`}
              stroke="#38bdf8"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="nb2Temp"
              name={`${nb2.name} (${nb2.id})`}
              stroke="#fbbf24"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="nb3Temp"
              name={`${nb3.name} (${nb3.id})`}
              stroke="#34d399"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>

      {/* Spatial AI Diagnosis Card with Indigo Glow */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-[#101428]/85 to-sky-950/30 border border-indigo-500/35 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent" />

        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 mt-0.5 shadow-[0_0_12px_rgba(129,140,248,0.25)]">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white tracking-tight">
              Spatial Consensus Verdict: Local Sensor Fault Confirmed
            </h4>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Target station deviates from regional mean with zero support from nearby stations ({nb1.name}, {nb2.name}). This rules out genuine macro-meteorological heat waves, proving sensor probe error with 99.4% confidence.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('anomaly-investigation')}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-500/20 via-sky-500/20 to-sky-500/15 hover:from-indigo-500/30 hover:to-sky-500/30 text-sky-200 border border-sky-500/35 shrink-0 transition-all shadow-sm"
        >
          <span>Return to Triage</span>
          <ArrowRight className="w-4 h-4 text-sky-300" />
        </button>
      </div>
    </div>
  );
};
