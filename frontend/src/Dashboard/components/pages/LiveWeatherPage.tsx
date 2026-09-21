import React, { useState } from 'react';
import {
  Sun,
  CloudRain,
  CloudSun,
  Wind,
  Droplets,
  Eye,
  Compass,
  Gauge,
  Calendar,
  CloudLightning,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { PageHeader } from '../common/PageHeader';
import { ChartWrapper } from '../common/ChartWrapper';
import type { AWSStation } from '../../types/dashboard.types';
import { MOCK_24H_HISTORY } from '../../data/mockStations';

interface LiveWeatherPageProps {
  stations: AWSStation[];
}

export const LiveWeatherPage: React.FC<LiveWeatherPageProps> = ({ stations }) => {
  const [selectedStationId, setSelectedStationId] = useState<string>(stations[0]?.id || 'AWS-001');

  const selectedStation = stations.find((s) => s.id === selectedStationId) || stations[0];
  const historyData = MOCK_24H_HISTORY[selectedStation.id] || MOCK_24H_HISTORY['AWS-001'];

  // Weather icon mapping
  const getWeatherIcon = (cond: string) => {
    const c = cond.toLowerCase();
    if (c.includes('rain') || c.includes('shower')) return <CloudRain className="w-10 h-10 text-sky-400 drop-shadow-[0_0_12px_rgba(56,189,248,0.4)]" />;
    if (c.includes('storm')) return <CloudLightning className="w-10 h-10 text-indigo-400 drop-shadow-[0_0_12px_rgba(129,140,248,0.4)]" />;
    if (c.includes('clear') || c.includes('sunny')) return <Sun className="w-10 h-10 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.4)]" />;
    return <CloudSun className="w-10 h-10 text-sky-300 drop-shadow-[0_0_12px_rgba(56,189,248,0.3)]" />;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Weather Feed & Synoptic Observations"
        subtitle="Current surface conditions, atmospheric moisture, dew points, and diurnal projections."
        badge="METEOROLOGICAL TELEMETRY"
      />

      {/* Station Selector Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#111a31]/90 via-[#0e1628]/85 to-[#090e1c]/95 border border-slate-800/80 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <label htmlFor="weather-station-select" className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
            Observatory Station:
          </label>
          <select
            id="weather-station-select"
            value={selectedStation.id}
            onChange={(e) => setSelectedStationId(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[#090e1c] border border-slate-700 text-sm font-semibold text-white focus:outline-none focus:border-sky-500"
          >
            {stations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.location}, {s.state})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
          <span>Region: <strong className="text-sky-300">{selectedStation.region}</strong></span>
          <span>•</span>
          <span>Elevation: <strong className="text-slate-200">{selectedStation.elevationMeters}m</strong></span>
        </div>
      </div>

      {/* Synoptic Weather Main Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl bg-gradient-to-br from-[#121c38]/90 via-[#0e162b]/85 to-[#090e1c]/95 border border-slate-800/80 backdrop-blur-md shadow-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-sky-400/20 to-transparent" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-400 font-mono">
                Current Surface Observation
              </span>
              <h2 className="text-2xl font-bold text-white mt-1 tracking-tight">
                {selectedStation.name}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">{selectedStation.location}, {selectedStation.state} • India</p>
            </div>

            <div className="flex items-center gap-4 bg-[#0a101f]/80 p-3.5 rounded-2xl border border-slate-800/80 backdrop-blur-md">
              {getWeatherIcon(selectedStation.weatherCondition)}
              <div className="text-right">
                <div className="text-3xl font-black font-mono text-white">
                  {selectedStation.sensors.temperature.value}°C
                </div>
                <div className="text-xs text-slate-400 capitalize">{selectedStation.weatherCondition}</div>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-300 mt-4 bg-[#0a101f]/60 p-3.5 rounded-xl border border-slate-800/60">
            <strong className="text-sky-300">Forecast Summary: </strong> {selectedStation.forecastSummary}
          </p>

          {/* Meteorological Parameter Tiles with Distinct Accents */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <div className="p-3.5 rounded-xl bg-gradient-to-b from-sky-950/20 to-[#0a101f]/60 border border-sky-500/20">
              <div className="flex items-center gap-1.5 text-slate-300 text-xs mb-1">
                <Droplets className="w-3.5 h-3.5 text-sky-400" />
                <span>Humidity</span>
              </div>
              <div className="text-xl font-bold font-mono text-white">
                {selectedStation.sensors.humidity.value}%
              </div>
              <div className="text-[10px] text-slate-400 font-mono">Dew Point: ~19°C</div>
            </div>

            <div className="p-3.5 rounded-xl bg-gradient-to-b from-indigo-950/20 to-[#0a101f]/60 border border-indigo-500/20">
              <div className="flex items-center gap-1.5 text-slate-300 text-xs mb-1">
                <Gauge className="w-3.5 h-3.5 text-indigo-400" />
                <span>Pressure</span>
              </div>
              <div className="text-xl font-bold font-mono text-white">
                {selectedStation.sensors.pressure.value}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">hPa (QNH Baro)</div>
            </div>

            <div className="p-3.5 rounded-xl bg-gradient-to-b from-emerald-950/20 to-[#0a101f]/60 border border-emerald-500/20">
              <div className="flex items-center gap-1.5 text-slate-300 text-xs mb-1">
                <Wind className="w-3.5 h-3.5 text-emerald-400" />
                <span>Wind Speed</span>
              </div>
              <div className="text-xl font-bold font-mono text-white">
                {selectedStation.sensors.wind.value} km/h
              </div>
              <div className="text-[10px] text-slate-400 font-mono">Gusts to 22 km/h</div>
            </div>

            <div className="p-3.5 rounded-xl bg-gradient-to-b from-blue-950/20 to-[#0a101f]/60 border border-blue-500/20">
              <div className="flex items-center gap-1.5 text-slate-300 text-xs mb-1">
                <CloudRain className="w-3.5 h-3.5 text-blue-400" />
                <span>Rain (24h)</span>
              </div>
              <div className="text-xl font-bold font-mono text-white">
                {selectedStation.sensors.rainfall.value} mm
              </div>
              <div className="text-[10px] text-slate-400 font-mono">Tipping gauge</div>
            </div>
          </div>
        </div>

        {/* Micro-Climate & Optics Metrics */}
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-[#111a31]/90 via-[#0e1628]/85 to-[#090e1c]/95 border border-slate-800/80 backdrop-blur-md shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-400/20 to-transparent" />

          <h3 className="font-bold text-white text-sm flex items-center gap-2 tracking-tight">
            <Compass className="w-4 h-4 text-sky-400" />
            <span>Atmospheric Indicators</span>
          </h3>

          <div className="space-y-3 my-3">
            <div className="p-3 rounded-xl bg-[#0a101f]/70 border border-slate-800/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-300">Surface Visibility</span>
              </div>
              <span className="font-mono text-xs font-bold text-white">8.5 km</span>
            </div>

            <div className="p-3 rounded-xl bg-[#0a101f]/70 border border-slate-800/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-slate-300">Solar Radiance (GHI)</span>
              </div>
              <span className="font-mono text-xs font-bold text-amber-300">680 W/m²</span>
            </div>

            <div className="p-3 rounded-xl bg-[#0a101f]/70 border border-slate-800/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span className="text-xs text-slate-300">Observation Cycle</span>
              </div>
              <span className="font-mono text-xs font-bold text-slate-300">SYNOP 3-Hourly</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-gradient-to-r from-sky-950/30 via-indigo-950/20 to-transparent border border-sky-500/30 text-xs text-sky-300">
            <span className="font-bold block mb-0.5">Automated Synoptic Status</span>
            Sensors operating within regional normal dispersion brackets.
          </div>
        </div>
      </div>

      {/* 24-Hour Temperature Forecast vs Actual */}
      <ChartWrapper
        title="24-Hour Atmospheric Trajectory (Temperature & Humidity)"
        subtitle="Harmonic diurnal cycle comparison for the selected station."
        badge="HARMONIC CURVE"
        height={300}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={historyData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1c253d" />
            <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
            <YAxis yAxisId="temp" stroke="#f59e0b" fontSize={11} tickLine={false} unit="°C" />
            <YAxis yAxisId="hum" orientation="right" stroke="#38bdf8" fontSize={11} tickLine={false} unit="%" />
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
            <Line
              yAxisId="temp"
              type="monotone"
              dataKey="temperature"
              stroke="#f59e0b"
              strokeWidth={2.5}
              dot={false}
              name="Temperature (°C)"
            />
            <Line
              yAxisId="hum"
              type="monotone"
              dataKey="humidity"
              stroke="#38bdf8"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
              name="Humidity (%)"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>
    </div>
  );
};
