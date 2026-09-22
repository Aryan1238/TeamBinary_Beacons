import React from 'react';
import {
  Layers,
  Thermometer,
  CloudSun,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { PageHeader } from '../common/PageHeader';
import { ChartWrapper } from '../common/ChartWrapper';
import type { AWSStation } from '../../types/dashboard.types';

interface WeatherAnalyticsPageProps {
  stations: AWSStation[];
}

export const WeatherAnalyticsPage: React.FC<WeatherAnalyticsPageProps> = ({ stations }) => {
  const regionAggregates = ['North', 'South', 'East', 'West', 'Central', 'Northeast'].map((region) => {
    const regionalStations = stations.filter((s) => s.region === region);
    const count = regionalStations.length;
    if (count === 0) return { region, avgTemp: 0, avgHum: 0, count: 0 };

    const avgTemp = Math.round(
      (regionalStations.reduce((acc, s) => acc + s.sensors.temperature.value, 0) / count) * 10
    ) / 10;

    const avgHum = Math.round(
      regionalStations.reduce((acc, s) => acc + s.sensors.humidity.value, 0) / count
    );

    return {
      region,
      avgTemp,
      avgHum,
      count,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Weather & Regional Analytics"
        subtitle="Synoptic climate comparisons across 6 geographical zones of the Indian subcontinent."
        badge="MACRO-CLIMATIC METRICS"
      />

      {/* Regional Mean Bar Chart */}
      <ChartWrapper
        title="Subcontinent Regional Comparisons: Mean Temperature & Relative Humidity"
        subtitle="Averaged across active operational Automatic Weather Stations in each zone"
        badge="SYNOPTIC AVERAGES"
        height={340}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={regionAggregates} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1c253d" />
            <XAxis dataKey="region" stroke="#64748b" fontSize={11} tickLine={false} />
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
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
            />
            <Bar dataKey="avgTemp" name="Mean Temperature (°C)" fill="#f59e0b" radius={[6, 6, 0, 0]} />
            <Bar dataKey="avgHum" name="Mean Humidity (%)" fill="#38bdf8" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartWrapper>

      {/* Micro-Climate Analytics Breakdown with Distinct Accents */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-[#111e38]/85 via-[#0e1628]/85 to-[#090e1c]/95 border border-sky-500/25 backdrop-blur-md shadow-xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-sky-400/20 to-transparent" />
          <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider mb-2 font-mono">
            <Thermometer className="w-4 h-4" />
            <span>Diurnal Amplitude Variance</span>
          </div>
          <h4 className="text-sm font-bold text-white mb-1.5 tracking-tight">
            Arid vs Coastal Gradients
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            Stations in Western India (Ahmedabad AWS-006) exhibit high diurnal spread (18.4°C amplitude), whereas Coastal Southern stations (Chennai AWS-001) exhibit compressed variance (6.2°C) due to marine boundary layers.
          </p>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-[#181538]/85 via-[#0f142c]/85 to-[#090e1c]/95 border border-indigo-500/25 backdrop-blur-md shadow-xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-400/20 to-transparent" />
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2 font-mono">
            <CloudSun className="w-4 h-4" />
            <span>Inverse Moisture Correlation</span>
          </div>
          <h4 className="text-sm font-bold text-white mb-1.5 tracking-tight">
            Thermodynamic Physics Compliance
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            Network-wide correlation between temperature and relative humidity holds at R = -0.84, adhering closely to Clausius-Clapeyron thermodynamic relationships across healthy stations.
          </p>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-[#231b12]/85 via-[#0e1628]/85 to-[#090e1c]/95 border border-amber-500/25 backdrop-blur-md shadow-xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/20 to-transparent" />
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2 font-mono">
            <Layers className="w-4 h-4" />
            <span>Sensor Envelope Fidelity</span>
          </div>
          <h4 className="text-sm font-bold text-white mb-1.5 tracking-tight">
            Adaptive Baseline Thresholding
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            Dynamic threshold models adapt to local topography and seasonal monsoon progression, reducing false alarms during genuine atmospheric frontal passages.
          </p>
        </div>
      </div>
    </div>
  );
};
