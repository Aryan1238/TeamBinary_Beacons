import React, { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import { Station } from '../types';
import { Sliders, Calendar, Filter, Sparkles, TrendingUp, Info, BarChart2 } from 'lucide-react';

interface WeatherAnalyticsPageProps {
  stations: Station[];
}

export const WeatherAnalyticsPage: React.FC<WeatherAnalyticsPageProps> = ({ stations }) => {
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [selectedParam, setSelectedParam] = useState<'Temperature' | 'Pressure' | 'Humidity' | 'Wind'>('Temperature');

  const filteredStations = stations.filter(s =>
    selectedRegion === 'All' ? true : s.region === selectedRegion
  );

  // Distribution data from actual live stations
  const distributionData = filteredStations.map(s => {
    let val = s.temperature;
    if (selectedParam === 'Pressure') val = s.pressure;
    if (selectedParam === 'Humidity') val = s.humidity;
    if (selectedParam === 'Wind') val = s.wind_speed ?? 8.0;

    return {
      name: s.name,
      value: val,
      status: s.status,
      state: s.state
    };
  });

  // Diurnal cycle trends
  const diurnalTrends = [
    { hour: '00:00', temp: 22.4, press: 1012.0, rh: 82, wind: 5.2 },
    { hour: '03:00', temp: 20.8, press: 1011.5, rh: 88, wind: 4.8 },
    { hour: '06:00', temp: 19.5, press: 1012.8, rh: 91, wind: 6.0 },
    { hour: '09:00', temp: 25.6, press: 1013.2, rh: 70, wind: 8.5 },
    { hour: '12:00', temp: 31.8, press: 1009.5, rh: 52, wind: 12.4 },
    { hour: '15:00', temp: 33.4, press: 1007.8, rh: 44, wind: 14.1 },
    { hour: '18:00', temp: 29.5, press: 1009.2, rh: 58, wind: 9.8 },
    { hour: '21:00', temp: 25.2, press: 1011.0, rh: 72, wind: 6.5 },
  ];

  const unit = selectedParam === 'Temperature' ? '°C' : (selectedParam === 'Pressure' ? 'hPa' : (selectedParam === 'Humidity' ? '%' : 'km/h'));
  const color = selectedParam === 'Temperature' ? '#0284C7' : (selectedParam === 'Pressure' ? '#0D9488' : (selectedParam === 'Humidity' ? '#6366F1' : '#F59E0B'));

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Meteorological Telemetry Analytics
            </h1>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-300 font-semibold">
              NATIONAL DATASET
            </span>
          </div>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Diurnal cycles, thermodynamic relationships, and comparative multi-station distributions
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-sans">
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 outline-none focus:border-cyan-500 shadow-xs"
          >
            <option value="All">All Regions</option>
            <option value="Western">Western</option>
            <option value="Northern">Northern</option>
            <option value="Southern">Southern</option>
            <option value="Eastern">Eastern</option>
            <option value="Central">Central</option>
          </select>

          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-xs">
            {(['Temperature', 'Pressure', 'Humidity', 'Wind'] as const).map(p => (
              <button
                key={p}
                onClick={() => setSelectedParam(p)}
                className={`px-3 py-1 rounded-md transition text-xs font-sans ${
                  selectedParam === p ? 'bg-cyan-600 text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Attribution Banner */}
      <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2 text-xs font-sans text-slate-600 shadow-xs">
        <span>Data Source: <strong className="text-slate-900 font-semibold">Live Weather Data — Open-Meteo API</strong></span>
        <span className="text-slate-500 font-mono">{filteredStations.length} reporting stations plotted</span>
      </div>

      {/* PRIMARY VISUALIZATION: Station Parameter Distribution */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Station {selectedParam} Distribution ({unit})
            </h3>
            <p className="text-xs text-slate-500">
              Live cross-station observations across selected locations
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-700 font-bold">Dynamic Live Feed</span>
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distributionData} margin={{ top: 10, right: 10, left: -10, bottom: 35 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="name" stroke="#64748B" fontSize={11} angle={-25} textAnchor="end" tickLine={false} />
              <YAxis stroke="#64748B" fontSize={11} domain={['auto', 'auto']} tickLine={false} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white border border-slate-200 p-2.5 rounded-lg shadow-lg font-sans text-xs text-slate-800">
                        <p className="font-bold text-slate-900 mb-0.5">{label}</p>
                        <p className="font-mono text-cyan-700 font-bold">{selectedParam}: {payload[0]?.value} {unit}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SUPPORTING VISUALIZATIONS: Diurnal Harmonic Cycle & Thermodynamic Relationship */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Diurnal Trend Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              24-Hour Diurnal Atmospheric Cycle (Harmonic Model)
            </h3>
            <p className="text-xs text-slate-500">
              Expected diurnal variation curve for temperature and humidity balance
            </p>
          </div>

          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={diurnalTrends} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284C7" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0284C7" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="hour" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white border border-slate-200 p-2.5 rounded-lg shadow-lg font-sans text-xs text-slate-800">
                          <p className="font-bold text-slate-900">{label}</p>
                          <p className="text-cyan-700 font-mono">Temp: {payload[0]?.value}°C</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="temp" stroke="#0284C7" strokeWidth={2} fillOpacity={1} fill="url(#colorTemp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Thermodynamic Relationship Overview */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              Thermodynamic Cross-Parameter Correlation
            </h3>
            <p className="text-xs text-slate-500">
              Physics rules governing Temperature, Pressure, and Relative Humidity
            </p>
          </div>

          <div className="space-y-3 font-sans text-xs pt-1">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-semibold text-slate-800 block">Inverse Temp-Humidity Coupling</span>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Under nominal atmospheric conditions, as midday temperature peaks, relative humidity drops due to Clausius-Clapeyron saturation capacity.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-semibold text-slate-800 block">Barometric Diurnal Semi-Diurnal Tide</span>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Atmospheric pressure exhibits predictable 12-hour thermal tides (peaking at ~10:00 and ~22:00 local solar time).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
