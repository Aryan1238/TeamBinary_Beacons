import React, { useState } from 'react';
import {
  Compass,
  Filter,
  ArrowUpRight,
  Layers,
  Network,
  Radio,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { PageHeader } from '../common/PageHeader';
import { StatusBadge } from '../common/StatusBadge';
import type { AWSStation, StationStatus, DashboardTab } from '../../types/dashboard.types';
import { useTelemetry } from '../../context/TelemetryContext';

interface StationMapPageProps {
  stations: AWSStation[];
  onSelectStation: (stationId: string) => void;
  onNavigateTab: (tab: DashboardTab) => void;
}

// Exact Haversine formula (km)
const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371.0;
  const dLat = ((lat2 - lat1) * Math.PI) / 180.0;
  const dLon = ((lon2 - lon1) * Math.PI) / 180.0;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180.0) *
      Math.cos((lat2 * Math.PI) / 180.0) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

export const StationMapPage: React.FC<StationMapPageProps> = ({
  stations,
  onSelectStation,
  onNavigateTab,
}) => {
  const { activeInvestigations } = useTelemetry();
  const [selectedStation, setSelectedStation] = useState<AWSStation>(stations[2] || stations[0]);
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

  // Find in-range peers (<= 150km) for the selected station
  const inRangePeers = stations
    .filter((s) => s.id !== selectedStation.id)
    .map((s) => ({
      station: s,
      distanceKm: haversineKm(
        selectedStation.coordinates.lat,
        selectedStation.coordinates.lng,
        s.coordinates.lat,
        s.coordinates.lng
      ),
    }))
    .filter((s) => s.distanceKm <= 150.0);

  // Active investigation for selected station
  const selectedInv = activeInvestigations[selectedStation.id];
  const spatialData = selectedInv?.spatial_consensus;

  // Spatial consensus summary
  const spatialVerdict = spatialData?.classification || (inRangePeers.length === 0 ? 'INSUFFICIENT EVIDENCE' : (selectedStation.status === 'ANOMALY' ? 'ISOLATED SENSOR ANOMALY' : 'REGIONAL EVENT'));
  const spatialConfidence = spatialData?.confidence || (inRangePeers.length === 0 ? 'NONE' : 'LOW');
  const selectedCoords = projectCoords(selectedStation.coordinates.lat, selectedStation.coordinates.lng);

  return (
    <div className="space-y-6">
      <PageHeader
        title="AWS Station Network Map"
        subtitle="Geospatial distribution of Indian Automatic Weather Stations with 150km spatial consensus overlay."
        badge="GEOSPATIAL RADAR (150km RADIUS)"
      />

      {/* Filter Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-mono">
            <Filter className="w-3.5 h-3.5 text-sky-600" />
            <span className="font-semibold uppercase tracking-wider">Status:</span>
          </div>
          <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-xl border border-slate-200 text-xs">
            {(['ALL', 'NORMAL', 'WARNING', 'ANOMALY', 'OFFLINE'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg font-mono font-semibold transition-all ${
                  statusFilter === st
                    ? 'bg-sky-50 text-sky-700 border border-sky-200 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-700 ml-0 sm:ml-2 font-mono">
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span className="font-semibold uppercase tracking-wider">Region:</span>
          </div>
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-500 shadow-xs"
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

        <div className="text-xs text-slate-500 font-mono flex items-center gap-2">
          <span>Active Nodes: <strong className="text-sky-700">{filteredStations.length}</strong> / {stations.length}</span>
          <span className="text-indigo-600">• Radius: <strong>&le; 150km</strong></span>
        </div>
      </div>

      {/* Main Map Viewport & Detail Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive SVG Subcontinent Map */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden flex flex-col items-center justify-center min-h-[560px]">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-sky-400/30 to-transparent" />

          {/* Map Grid lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f080_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f080_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

          {/* Compass Rose */}
          <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 border border-slate-200 text-[10px] font-mono text-slate-700 backdrop-blur-md shadow-xs">
            <Compass className="w-3.5 h-3.5 text-sky-600" />
            <span>INDIAN PENINSULA • 150km SPATIAL MESH</span>
          </div>

          {/* Map Graphic */}
          <div className="w-full max-w-lg aspect-[600/650] relative">
            <svg
              viewBox="0 0 600 650"
              className="w-full h-full filter drop-shadow-sm"
            >
              {/* Simplified India boundary outline */}
              <polygon
                points="
                  200,60 250,80 310,110 370,120 420,150 490,170 540,190 530,220 480,240 450,270
                  420,300 400,350 370,410 340,480 320,530 300,580 280,620 260,560 230,500 210,430
                  190,380 150,340 120,310 100,270 120,220 150,170 170,120 180,80
                "
                fill="#f8fafc"
                stroke="#cbd5e1"
                strokeWidth="1.5"
                strokeDasharray="4 2"
                opacity="0.9"
              />

              {/* Connecting spatial lines strictly between stations <= 150km (Pune <-> Mumbai) */}
              {stations.map((s1, i) =>
                stations.slice(i + 1).map((s2) => {
                  const d = haversineKm(
                    s1.coordinates.lat,
                    s1.coordinates.lng,
                    s2.coordinates.lat,
                    s2.coordinates.lng
                  );
                  if (d <= 150.0) {
                    const p1 = projectCoords(s1.coordinates.lat, s1.coordinates.lng);
                    const p2 = projectCoords(s2.coordinates.lat, s2.coordinates.lng);
                    return (
                      <g key={`${s1.id}-${s2.id}`}>
                        <line
                          x1={p1.x}
                          y1={p1.y}
                          x2={p2.x}
                          y2={p2.y}
                          stroke="#38bdf8"
                          strokeWidth="1.5"
                          strokeDasharray="3 3"
                          opacity="0.8"
                        />
                        <rect
                          x={(p1.x + p2.x) / 2 - 16}
                          y={(p1.y + p2.y) / 2 - 14}
                          width="32"
                          height="12"
                          rx="3"
                          fill="#080e1c"
                          stroke="#38bdf8"
                          strokeWidth="0.7"
                          opacity="0.9"
                        />
                        <text
                          x={(p1.x + p2.x) / 2}
                          y={(p1.y + p2.y) / 2 - 5}
                          textAnchor="middle"
                          fill="#38bdf8"
                          fontSize="7"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {d}km
                        </text>
                      </g>
                    );
                  }
                  return null;
                })
              )}

              {/* 150km Radius Circle around Selected Station */}
              <circle
                cx={selectedCoords.x}
                cy={selectedCoords.y}
                r="24.5"
                fill="#38bdf8"
                fillOpacity="0.12"
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <text
                x={selectedCoords.x}
                y={selectedCoords.y - 27}
                textAnchor="middle"
                fill="#38bdf8"
                fontSize="7.5"
                fontFamily="monospace"
                fontWeight="bold"
              >
                150km Spatial Radius
              </text>

              {/* Station Map Pins */}
              {filteredStations.map((station) => {
                const { x, y } = projectCoords(station.coordinates.lat, station.coordinates.lng);
                const isSelected = selectedStation.id === station.id;
                const isAnomaly = station.status === 'ANOMALY' || !!activeInvestigations[station.id];
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
                      <>
                        <circle
                          cx={x}
                          cy={y}
                          r="16"
                          fill="none"
                          stroke="#f43f5e"
                          strokeWidth="2"
                          opacity="0.8"
                          className="animate-ping"
                        />
                        <circle
                          cx={x}
                          cy={y}
                          r="13"
                          fill="#f43f5e"
                          fillOpacity="0.15"
                          stroke="#f43f5e"
                          strokeWidth="1"
                        />
                      </>
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

          {/* Legend */}
          <div className="mt-2 pt-3 border-t border-slate-800/80 w-full flex flex-wrap items-center justify-between text-xs text-slate-400 px-2 font-mono">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" /> Normal</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]" /> Warning</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.6)]" /> Anomaly</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Offline</span>
            </div>
            <span className="text-sky-400">Dashed circle: &le; 150km spatial radius</span>
          </div>
        </div>

        {/* Selected Station Deep Details Pane */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-sky-400/30 to-transparent" />

          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-sky-700 font-bold">{selectedStation.id}</span>
                  <span className="text-[10px] font-mono font-semibold text-sky-700 px-1.5 py-0.5 rounded bg-sky-50 border border-sky-200">
                    {selectedStation.dataSource || '[Meteostat + NOAA]'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{selectedStation.name}</h3>
                <p className="text-xs text-slate-500">{selectedStation.location}, {selectedStation.state}</p>
              </div>
              <StatusBadge status={selectedStation.status} />
            </div>

            {/* SPATIAL INTELLIGENCE SECTION */}
            <div className="my-3 p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-indigo-800 font-bold flex items-center gap-1 text-[11px] uppercase">
                  <Network className="w-3.5 h-3.5 text-indigo-600" />
                  Spatial Consensus (&le;150km)
                </span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                    spatialConfidence === 'HIGH'
                      ? 'text-emerald-700 bg-emerald-100'
                      : spatialConfidence === 'LOW'
                      ? 'text-amber-700 bg-amber-100'
                      : 'text-slate-600 bg-slate-100'
                  }`}
                >
                  {spatialConfidence} CONF
                </span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-indigo-100">
                <span className="text-slate-500 text-[11px]">Consensus Status:</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    spatialVerdict === 'REGIONAL EVENT'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : spatialVerdict === 'ISOLATED SENSOR ANOMALY'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {spatialVerdict}
                </span>
              </div>

              <div className="pt-1 border-t border-indigo-100">
                <span className="text-slate-500 text-[11px] block mb-1">Peers in Radius (&le;150km):</span>
                {inRangePeers.length > 0 ? (
                  <div className="space-y-1">
                    {inRangePeers.map((p) => (
                      <div key={p.station.id} className="flex justify-between text-slate-700 text-[11px]">
                        <span>{p.station.name} ({p.station.id})</span>
                        <span className="text-indigo-700 font-semibold">{p.distanceKm} km</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-amber-700 text-[11px] italic">
                    None within 150km (Network Sparsity)
                  </span>
                )}
              </div>
            </div>

            {/* Geographical & Hardware Specs */}
            <div className="grid grid-cols-2 gap-2 my-3 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-500 block font-mono">Region</span>
                <span className="font-semibold text-slate-800">{selectedStation.region} India</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-500 block font-mono">Elevation</span>
                <span className="font-semibold text-slate-800">{selectedStation.elevationMeters}m MSL</span>
              </div>
            </div>

            {/* Live Sensors Table */}
            <div className="mt-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 font-mono">
                Live Sensors
              </h4>
              <div className="space-y-1.5">
                {Object.entries(selectedStation.sensors).map(([key, sensor]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                  >
                    <span className="capitalize text-slate-700 font-medium">{key}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">
                        {sensor.value} {sensor.unit}
                      </span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          sensor.status === 'NORMAL'
                            ? 'bg-emerald-500'
                            : sensor.status === 'WARNING'
                            ? 'bg-amber-500'
                            : 'bg-rose-500 animate-pulse'
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
                onNavigateTab('cross-station');
              }}
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 flex items-center justify-center gap-1.5 transition-all shadow-sm"
            >
              <span>Open Spatial Intelligence</span>
              <Network className="w-3.5 h-3.5 text-indigo-300" />
            </button>

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
