import React, { useState } from 'react';
import {
  Compass,
  Filter,
  ArrowUpRight,
  Layers,
} from 'lucide-react';
import { PageHeader } from '../common/PageHeader';
import { StatusBadge } from '../common/StatusBadge';
import type { AWSStation, StationStatus, DashboardTab } from '../../types/dashboard.types';

interface StationMapPageProps {
  stations: AWSStation[];
  onSelectStation: (stationId: string) => void;
  onNavigateTab: (tab: DashboardTab) => void;
}

export const StationMapPage: React.FC<StationMapPageProps> = ({
  stations,
  onSelectStation,
  onNavigateTab,
}) => {
  const [selectedStation, setSelectedStation] = useState<AWSStation>(stations[0]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | StationStatus>('ALL');
  const [regionFilter, setRegionFilter] = useState<string>('ALL');

  const projectCoords = (lat: number, lng: number) => {
    const x = ((lng - 68) / 29) * 500 + 50;
    const y = ((36 - lat) / 28) * 540 + 50;
    return { x, y };
  };

  const filteredStations = stations.filter((s) => {
    if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
    if (regionFilter !== 'ALL' && s.region !== regionFilter) return false;
    return true;
  });

  const getMarkerColor = (status: StationStatus) => {
    switch (status) {
      case 'NORMAL':
        return '#34d399'; // Mint Green
      case 'WARNING':
        return '#fbbf24'; // Amber
      case 'ANOMALY':
        return '#f43f5e'; // Warm Coral-Red
      case 'OFFLINE':
        return '#94a3b8'; // Slate
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="AWS Station Network Map"
        subtitle="Geospatial distribution of Indian Automatic Weather Stations with multi-sensor health overlay."
        badge="GEOSPATIAL RADAR"
      />

      {/* Filter Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#111a31]/90 via-[#0e1628]/85 to-[#090e1c]/95 border border-slate-800/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono">
            <Filter className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-semibold uppercase tracking-wider">Status:</span>
          </div>
          <div className="flex items-center gap-1 bg-[#0a101f]/90 p-1.5 rounded-xl border border-slate-800 text-xs">
            {(['ALL', 'NORMAL', 'WARNING', 'ANOMALY', 'OFFLINE'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg font-mono font-semibold transition-all ${
                  statusFilter === st
                    ? 'bg-sky-500/20 text-sky-200 border border-sky-500/40 shadow-[0_0_10px_rgba(56,189,248,0.2)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-300 ml-0 sm:ml-2 font-mono">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-semibold uppercase tracking-wider">Region:</span>
          </div>
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[#0a101f] border border-slate-800 text-xs font-semibold text-slate-200 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Regions</option>
            <option value="North">North</option>
            <option value="South">South</option>
            <option value="East">East</option>
            <option value="West">West</option>
            <option value="Central">Central</option>
            <option value="Northeast">Northeast</option>
          </select>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Showing <strong className="text-sky-300">{filteredStations.length}</strong> of {stations.length} stations
        </div>
      </div>

      {/* Main Map Viewport & Detail Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive SVG Subcontinent Map with Atmospheric Radar Glow */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-gradient-to-b from-[#111a31]/90 via-[#0e1628]/85 to-[#090e1c]/95 border border-slate-800/80 backdrop-blur-md relative overflow-hidden flex flex-col items-center justify-center min-h-[560px] shadow-2xl">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-sky-400/20 to-transparent" />

          {/* Subtle Map Grid lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#38bdf806_1px,transparent_1px),linear-gradient(to_bottom,#38bdf806_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

          {/* Compass Rose */}
          <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0a101f]/80 border border-slate-800/80 text-[10px] font-mono text-slate-300 backdrop-blur-md shadow-sm">
            <Compass className="w-3.5 h-3.5 text-sky-400" />
            <span>INDIAN PENINSULA</span>
          </div>

          {/* Map Graphic */}
          <div className="w-full max-w-lg aspect-[600/650] relative">
            <svg
              viewBox="0 0 600 650"
              className="w-full h-full filter drop-shadow-2xl"
            >
              {/* Simplified India boundary outline */}
              <polygon
                points="
                  200,60 250,80 310,110 370,120 420,150 490,170 540,190 530,220 480,240 450,270
                  420,300 400,350 370,410 340,480 320,530 300,580 280,620 260,560 230,500 210,430
                  190,380 150,340 120,310 100,270 120,220 150,170 170,120 180,80
                "
                fill="#080e1c"
                stroke="#1e2c4a"
                strokeWidth="1.5"
                strokeDasharray="4 2"
                opacity="0.9"
              />

              {/* Connecting spatial baselines */}
              <polyline
                points="215,160 270,195 330,305 270,470 210,315 215,160"
                fill="none"
                stroke="#0284c7"
                strokeWidth="0.8"
                strokeDasharray="2 4"
                opacity="0.4"
              />

              {/* Station Map Pins */}
              {filteredStations.map((station) => {
                const { x, y } = projectCoords(station.coordinates.lat, station.coordinates.lng);
                const isSelected = selectedStation.id === station.id;
                const isAnomaly = station.status === 'ANOMALY';
                const color = getMarkerColor(station.status);

                return (
                  <g
                    key={station.id}
                    className="cursor-pointer transition-transform duration-200 hover:scale-125"
                    onClick={() => {
                      setSelectedStation(station);
                      onSelectStation(station.id);
                    }}
                  >
                    {/* Pulsing ring for anomaly */}
                    {isAnomaly && (
                      <circle
                        cx={x}
                        cy={y}
                        r="16"
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth="1.5"
                        opacity="0.8"
                        className="animate-ping"
                      />
                    )}

                    {/* Selected Halo */}
                    {isSelected && (
                      <circle
                        cx={x}
                        cy={y}
                        r="12"
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="2"
                        strokeDasharray="3 3"
                      />
                    )}

                    {/* Core Pin Dot */}
                    <circle
                      cx={x}
                      cy={y}
                      r={isSelected ? '6.5' : '5'}
                      fill={color}
                      stroke="#070b16"
                      strokeWidth="2"
                    />

                    {/* Text Label */}
                    <text
                      x={x + 9}
                      y={y + 3}
                      fill={isSelected ? '#38bdf8' : '#cbd5e1'}
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                      className="select-none pointer-events-none"
                    >
                      {station.id}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Legend with Proper Palette */}
          <div className="mt-2 pt-3 border-t border-slate-800/80 w-full flex flex-wrap items-center justify-between text-xs text-slate-400 px-2 font-mono">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" /> Normal</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]" /> Warning</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.6)]" /> Anomaly</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Offline</span>
            </div>
            <span className="text-slate-400">Click node to inspect</span>
          </div>
        </div>

        {/* Selected Station Deep Details Pane */}
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-[#111a31]/90 via-[#0e1628]/85 to-[#090e1c]/95 border border-slate-800/80 backdrop-blur-md shadow-xl flex flex-col justify-between space-y-4 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-sky-400/20 to-transparent" />

          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-sky-400 font-bold">{selectedStation.id}</span>
                  <span className="text-[10px] font-mono font-semibold text-sky-300 px-1.5 py-0.5 rounded bg-sky-500/15 border border-sky-500/30">
                    {selectedStation.dataSource || '[Meteostat + NOAA]'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white">{selectedStation.name}</h3>
                <p className="text-xs text-slate-400">{selectedStation.location}, {selectedStation.state}</p>
              <StatusBadge status={selectedStation.status} />
            </div>

            {/* Geographical & Hardware Specs */}
            <div className="grid grid-cols-2 gap-2 my-3 text-xs">
              <div className="p-2.5 rounded-xl bg-[#0a101f]/70 border border-slate-800/70">
                <span className="text-[10px] text-slate-400 block font-mono">Region</span>
                <span className="font-semibold text-slate-200">{selectedStation.region} India</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0a101f]/70 border border-slate-800/70">
                <span className="text-[10px] text-slate-400 block font-mono">Elevation</span>
                <span className="font-semibold text-slate-200">{selectedStation.elevationMeters}m MSL</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0a101f]/70 border border-slate-800/70">
                <span className="text-[10px] text-slate-400 block font-mono">Hardware Health</span>
                <span className="font-semibold text-emerald-300">{selectedStation.healthScore}% Operational</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0a101f]/70 border border-slate-800/70">
                <span className="text-[10px] text-slate-400 block font-mono">Uptime Ratio</span>
                <span className="font-semibold text-sky-300">{selectedStation.communicationUptime}%</span>
              </div>
            </div>

            {/* Live Sensors Table */}
            <div className="mt-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 font-mono">
                Live Sensor Payload
              </h4>
              <div className="space-y-1.5">
                {Object.entries(selectedStation.sensors).map(([key, sensor]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#0a101f]/60 border border-slate-800/60 text-xs"
                  >
                    <span className="capitalize text-slate-300 font-medium">{key}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white">
                        {sensor.value} {sensor.unit}
                      </span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          sensor.status === 'NORMAL'
                            ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]'
                            : sensor.status === 'WARNING'
                            ? 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]'
                            : 'bg-rose-400 animate-pulse shadow-[0_0_6px_rgba(244,63,94,0.6)]'
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Drilldowns */}
          <div className="space-y-2 pt-3 border-t border-slate-800/80">
            <button
              onClick={() => {
                onSelectStation(selectedStation.id);
                onNavigateTab('live-monitoring');
              }}
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-sky-500/15 hover:bg-sky-500/25 text-sky-200 border border-sky-500/35 flex items-center justify-center gap-1.5 transition-all shadow-sm"
            >
              <span>Inspect Live Sensor Stream</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>

            {selectedStation.status === 'ANOMALY' && (
              <button
                onClick={() => onNavigateTab('anomaly-investigation')}
                className="w-full py-2.5 rounded-xl text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 flex items-center justify-center gap-1.5 transition-all shadow-sm"
              >
                <span>Investigate Station Anomaly</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
