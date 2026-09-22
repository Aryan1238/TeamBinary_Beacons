import React, { useState } from 'react';
import {
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Search,
  XCircle,
} from 'lucide-react';
import { PageHeader } from '../common/PageHeader';
import type { AWSStation, DashboardTab, StationStatus } from '../../types/dashboard.types';

interface SensorHealthPageProps {
  stations: AWSStation[];
  onSelectStation: (stationId: string) => void;
  onNavigateTab: (tab: DashboardTab) => void;
}

export const SensorHealthPage: React.FC<SensorHealthPageProps> = ({
  stations,
  onSelectStation,
  onNavigateTab,
}) => {
  const [search, setSearch] = useState('');

  const filteredStations = stations.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase())
  );

  const getSensorStatusIcon = (status: StationStatus) => {
    switch (status) {
      case 'NORMAL':
        return <span title="Healthy"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.6)]" /></span>;
      case 'WARNING':
        return <span title="Drifting / Watch"><AlertTriangle className="w-3.5 h-3.5 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]" /></span>;
      case 'ANOMALY':
        return <span title="Hardware Failure"><XCircle className="w-3.5 h-3.5 text-rose-400 animate-pulse drop-shadow-[0_0_6px_rgba(244,63,94,0.6)]" /></span>;
      case 'OFFLINE':
        return <span className="w-2 h-2 rounded-full bg-slate-500 inline-block" title="Offline" />;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sensor Health & Calibration Matrix"
        subtitle="Individual sensor probe diagnostics, calibration countdowns, and communication uptime ratios."
        badge="HARDWARE TELEMETRY"
      />

      {/* KPI Cards with Meaning-Assigned Colors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-gradient-to-b from-[#111a31]/90 via-[#0e1628]/85 to-[#090e1c]/95 border border-slate-800/80 backdrop-blur-md shadow-xl">
          <span className="text-xs text-slate-400 font-mono font-medium block">Total Active Sensors</span>
          <div className="text-2xl font-black font-mono text-white mt-1">35 Probes</div>
          <span className="text-[10px] text-slate-400 font-mono">5 sensors × 7 stations</span>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-b from-[#231b12]/80 via-[#161324]/80 to-[#090e1c]/95 border border-amber-500/35 backdrop-blur-md shadow-xl">
          <span className="text-xs text-amber-300 font-mono font-medium block">Calibration Due (&lt;30d)</span>
          <div className="text-2xl font-black font-mono text-amber-400 mt-1">2 Stations</div>
          <span className="text-[10px] text-amber-400/80 font-mono">Scheduled recertification</span>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-b from-[#24131b]/80 via-[#161224]/80 to-[#090e1c]/95 border border-rose-500/35 backdrop-blur-md shadow-xl">
          <span className="text-xs text-rose-300 font-mono font-medium block">Degraded / Faulty Probes</span>
          <div className="text-2xl font-black font-mono text-rose-400 mt-1">2 Probes</div>
          <span className="text-[10px] text-rose-400/80 font-mono">AWS-003 Temp & AWS-007 Pressure</span>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-b from-[#102422]/80 via-[#0e172a]/85 to-[#090e1c]/95 border border-emerald-500/30 backdrop-blur-md shadow-xl">
          <span className="text-xs text-emerald-300 font-mono font-medium block">Fleet Comm Uptime</span>
          <div className="text-2xl font-black font-mono text-emerald-400 mt-1">99.4%</div>
          <span className="text-[10px] text-emerald-400/80 font-mono">Packet loss &lt; 0.6%</span>
        </div>
      </div>

      {/* Sensor Health Matrix Table with Dusk Styling */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-[#111a31]/90 via-[#0e1628]/85 to-[#090e1c]/95 border border-slate-800/80 backdrop-blur-md shadow-xl overflow-hidden relative">
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-teal-400/20 to-transparent" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="font-bold text-white flex items-center gap-2 tracking-tight">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>Fleet Sensor Diagnostic Matrix</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live status across RTD Temperature, Capacitive Humidity, Piezo Pressure, Ultrasonic Wind, and Rain Gauge
            </p>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search station..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-xl bg-[#090e1c] border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#0a101f]/90 text-slate-400 font-mono uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Station</th>
                <th className="py-2.5 px-3">Temp (RTD)</th>
                <th className="py-2.5 px-3">Humidity (Cap)</th>
                <th className="py-2.5 px-3">Pressure (Piezo)</th>
                <th className="py-2.5 px-3">Wind (Sonic)</th>
                <th className="py-2.5 px-3">Rain (Tipping)</th>
                <th className="py-2.5 px-3">Health Score</th>
                <th className="py-2.5 px-3">Calibration Due</th>
                <th className="py-2.5 px-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredStations.map((station) => (
                <tr key={station.id} className="hover:bg-slate-800/40 text-slate-300 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-bold text-white font-sans">{station.name}</div>
                    <div className="text-[10px] text-slate-400">
                      {station.id} • {station.state} <span className="text-sky-400 font-semibold">{station.dataSource || '[Meteostat + NOAA]'}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      {getSensorStatusIcon(station.sensors.temperature.status)}
                      <span className="text-slate-200">{station.sensors.temperature.value}°C</span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      {getSensorStatusIcon(station.sensors.humidity.status)}
                      <span className="text-slate-200">{station.sensors.humidity.value}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      {getSensorStatusIcon(station.sensors.pressure.status)}
                      <span className="text-slate-200">{station.sensors.pressure.value}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      {getSensorStatusIcon(station.sensors.wind.status)}
                      <span className="text-slate-200">{station.sensors.wind.value} km/h</span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      {getSensorStatusIcon(station.sensors.rainfall.status)}
                      <span className="text-slate-200">{station.sensors.rainfall.value} mm</span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`font-black ${
                      station.healthScore > 85
                        ? 'text-emerald-400'
                        : station.healthScore > 70
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}>
                      {station.healthScore}%
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                      station.calibrationDueDays <= 30
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/35 font-bold'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}>
                      {station.calibrationDueDays} days
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <button
                      onClick={() => {
                        onSelectStation(station.id);
                        onNavigateTab('live-monitoring');
                      }}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-sans font-semibold text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 transition-colors"
                    >
                      Inspect Stream
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
