import React, { useState, useEffect } from 'react';
import {
  Thermometer,
  Droplets,
  Gauge,
  Wind,
  Radio,
  CheckCircle2,
  CloudSun
} from 'lucide-react';

interface StationNode {
  id: string;
  name: string;
  code: string;
  x: number;
  y: number;
  status: 'nominal' | 'active_sync' | 'analyzing';
  region: string;
}

export const NetworkVisual: React.FC = () => {
  const [telemetry, setTelemetry] = useState({
    temperature: 28.4,
    humidity: 64,
    pressure: 1008,
    wind: 12
  });

  const [activePacketIndex, setActivePacketIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry({
        temperature: Number((28.4 + (Math.random() * 0.4 - 0.2)).toFixed(1)),
        humidity: Math.round(64 + (Math.random() * 2 - 1)),
        pressure: Number((1008 + (Math.random() * 0.6 - 0.3)).toFixed(0)),
        wind: Number((12 + (Math.random() * 1.6 - 0.8)).toFixed(1))
      });
      setActivePacketIndex((prev) => (prev + 1) % 6);
    }, 2400);

    return () => clearInterval(interval);
  }, []);

  const stations: StationNode[] = [
    { id: 'st-1', name: 'Srinagar', code: 'LOC-SXR', x: 195, y: 65, status: 'nominal', region: 'North' },
    { id: 'st-2', name: 'Delhi', code: 'LOC-DEL', x: 225, y: 135, status: 'active_sync', region: 'North' },
    { id: 'st-3', name: 'Jaipur', code: 'LOC-JPR', x: 175, y: 180, status: 'nominal', region: 'Northwest' },
    { id: 'st-4', name: 'Ahmedabad', code: 'LOC-AMD', x: 140, y: 235, status: 'nominal', region: 'West' },
    { id: 'st-5', name: 'Mumbai', code: 'LOC-BOM', x: 155, y: 300, status: 'nominal', region: 'West' },
    { id: 'st-6', name: 'Pune', code: 'LOC-PUN', x: 190, y: 330, status: 'active_sync', region: 'West' },
    { id: 'st-7', name: 'Bhopal', code: 'LOC-BHO', x: 235, y: 230, status: 'nominal', region: 'Central' },
    { id: 'st-8', name: 'Hyderabad', code: 'LOC-HYD', x: 235, y: 310, status: 'nominal', region: 'South-Central' },
    { id: 'st-9', name: 'Bengaluru', code: 'LOC-BLR', x: 220, y: 405, status: 'active_sync', region: 'South' },
    { id: 'st-10', name: 'Chennai', code: 'LOC-MAA', x: 270, y: 395, status: 'nominal', region: 'South' },
    { id: 'st-11', name: 'Bhubaneswar', code: 'LOC-BBI', x: 335, y: 280, status: 'nominal', region: 'East' },
    { id: 'st-12', name: 'Kolkata', code: 'LOC-CCU', x: 370, y: 225, status: 'nominal', region: 'East' },
    { id: 'st-13', name: 'Guwahati', code: 'LOC-GAU', x: 440, y: 180, status: 'nominal', region: 'Northeast' }
  ];

  const edges = [
    { from: 'st-1', to: 'st-2' },
    { from: 'st-2', to: 'st-3' },
    { from: 'st-2', to: 'st-7' },
    { from: 'st-3', to: 'st-4' },
    { from: 'st-4', to: 'st-5' },
    { from: 'st-5', to: 'st-6' },
    { from: 'st-6', to: 'st-8' },
    { from: 'st-7', to: 'st-8' },
    { from: 'st-7', to: 'st-11' },
    { from: 'st-8', to: 'st-9' },
    { from: 'st-9', to: 'st-10' },
    { from: 'st-8', to: 'st-10' },
    { from: 'st-10', to: 'st-11' },
    { from: 'st-11', to: 'st-12' },
    { from: 'st-12', to: 'st-13' },
    { from: 'st-2', to: 'st-12' }
  ];

  const getStationCoords = (id: string) => {
    return stations.find((s) => s.id === id) || { x: 0, y: 0 };
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Outer Card Frame */}
      <div className="relative rounded-3xl bg-white border border-slate-200 p-4 sm:p-6 shadow-md backdrop-blur-2xl overflow-hidden">
        
        {/* Atmospheric Weather Background Lighting: Subtle Sky & Indigo tints */}
        <div className="absolute -top-12 -left-12 w-72 h-72 bg-sky-100/40 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 right-0 w-80 h-80 bg-blue-50/50 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-10 left-1/3 w-64 h-64 bg-indigo-50/40 rounded-full blur-[90px] pointer-events-none" />

        {/* Header Ribbon / Status Bar */}
        <div className="relative flex items-center justify-between pb-3.5 mb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
            </span>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 font-mono tracking-wider flex items-center gap-1.5">
                  <CloudSun className="w-3.5 h-3.5 text-amber-500" />
                  METEOROLOGICAL AWS MESH
                </span>
                <span className="text-[10px] text-sky-700 bg-sky-50 border border-sky-200 px-1.5 py-0.2 rounded font-mono font-semibold">
                  LIVE STREAM
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono">
                13 Regional Nodes • Automated Packet Assurance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-right">
            <div className="hidden sm:block">
              <p className="text-[10px] text-slate-500 font-mono">Sync Latency</p>
              <p className="text-xs font-semibold text-emerald-600 font-mono">14ms • Synchronized</p>
            </div>
            <div className="p-1.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-600">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Center Canvas / SVG Map Topology */}
        <div className="relative w-full h-[290px] sm:h-[330px] flex items-center justify-center">
          
          {/* Subtle Atmospheric Isobar & Radar Rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-64 rounded-full border border-sky-500/10" />
            <div className="w-96 h-96 rounded-full border border-indigo-500/10 absolute" />
            <div className="w-full h-full opacity-20 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.08)_0%,transparent_70%)]" />
          </div>

          <svg
            viewBox="0 0 540 470"
            className="w-full h-full select-none"
            style={{ filter: 'drop-shadow(0 0 16px rgba(56, 189, 248, 0.2))' }}
          >
            <defs>
              {/* Weather Line Gradients */}
              <linearGradient id="weatherEdgeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.6" />
                <stop offset="50%" stopColor="#818CF8" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.5" />
              </linearGradient>

              {/* Station Node Aura */}
              <radialGradient id="weatherNodeGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.9" />
                <stop offset="45%" stopColor="#38BDF8" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#0284C7" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Simplified Geographic Contour (Abstract India atmospheric boundary) */}
            <path
              d="M 195 55 
                 L 225 105 
                 L 270 120 
                 L 350 170 
                 L 460 170 
                 L 465 210 
                 L 390 220 
                 L 380 250 
                 L 340 290 
                 L 280 395 
                 L 230 450 
                 L 205 420 
                 L 150 310 
                 L 125 240 
                 L 160 175 
                 Z"
              fill="rgba(56, 189, 248, 0.04)"
              stroke="rgba(56, 189, 248, 0.25)"
              strokeWidth="1.4"
              strokeDasharray="5 5"
            />

            {/* Network Connections (Weather Radar Edges) */}
            {edges.map((edge, idx) => {
              const start = getStationCoords(edge.from);
              const end = getStationCoords(edge.to);
              return (
                <g key={`edge-${idx}`}>
                  <line
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke="url(#weatherEdgeGradient)"
                    strokeWidth="1.5"
                  />
                  {/* Atmospheric data particle pulse */}
                  {(idx % 3 === activePacketIndex % 3 || idx === activePacketIndex) && (
                    <circle r="3" fill="#FBBF24">
                      <animateMotion
                        path={`M ${start.x} ${start.y} L ${end.x} ${end.y}`}
                        dur={`${2.2 + (idx % 3) * 0.4}s`}
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}
                </g>
              );
            })}

            {/* Station Nodes */}
            {stations.map((station) => {
              const isActive = station.status === 'active_sync';
              return (
                <g key={station.id} className="cursor-pointer group">
                  {/* Radar Pulse Rings */}
                  {isActive && (
                    <circle
                      cx={station.x}
                      cy={station.y}
                      r="13"
                      fill="none"
                      stroke="#38BDF8"
                      strokeWidth="1.4"
                      className="animate-ping opacity-60"
                      style={{ transformOrigin: `${station.x}px ${station.y}px`, animationDuration: '2.4s' }}
                    />
                  )}

                  {/* Halo Glow */}
                  <circle
                    cx={station.x}
                    cy={station.y}
                    r={isActive ? 9 : 6.5}
                    fill="url(#weatherNodeGlow)"
                  />

                  {/* Center Core Dot */}
                  <circle
                    cx={station.x}
                    cy={station.y}
                    r={isActive ? 4 : 3}
                    fill={isActive ? '#F59E0B' : '#0284C7'}
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                  />

                  {/* Station Tag */}
                  <text
                    x={station.x + 8}
                    y={station.y + 3}
                    fontSize="9"
                    fontFamily="monospace"
                    fill="#334155"
                    className="font-semibold tracking-tight"
                  >
                    {station.code}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Overlaid Badges */}
          <div className="absolute left-4 top-4 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/95 border border-amber-200 backdrop-blur-md shadow-xs">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <div className="text-[11px] font-mono text-slate-700">
              <span className="text-amber-700 font-bold">AWS-PUN-04</span>: Pune Transducer Sync
            </div>
          </div>

          <div className="absolute right-4 bottom-4 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/95 border border-emerald-200 backdrop-blur-md shadow-xs">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <div className="text-[11px] font-mono text-slate-700">
              Atmospheric Triangulation: <span className="text-emerald-700 font-bold">NOMINAL</span>
            </div>
          </div>
        </div>

        {/* 4 Weather Telemetry Cards (Sun / Rain / Pressure / Wind Palette) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-slate-200">
          
          {/* Temperature */}
          <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/80 hover:border-amber-300 transition-all duration-200">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-800 font-semibold">Temperature</span>
              <Thermometer className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="text-base sm:text-lg font-bold text-slate-900 font-mono flex items-baseline gap-0.5">
              <span>{telemetry.temperature}</span>
              <span className="text-xs text-amber-700 font-normal">°C</span>
            </div>
            <p className="text-[9px] text-emerald-700 font-mono flex items-center gap-1 mt-0.5">
              <span>●</span> Solar equilibrium
            </p>
          </div>

          {/* Humidity */}
          <div className="p-3 rounded-2xl bg-sky-50/60 border border-sky-200/80 hover:border-sky-300 transition-all duration-200">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-sky-800 font-semibold">Humidity</span>
              <Droplets className="w-3.5 h-3.5 text-sky-600" />
            </div>
            <div className="text-base sm:text-lg font-bold text-slate-900 font-mono flex items-baseline gap-0.5">
              <span>{telemetry.humidity}</span>
              <span className="text-xs text-sky-700 font-normal">%</span>
            </div>
            <p className="text-[9px] text-slate-500 font-mono mt-0.5">
              Dew point 20.8°C
            </p>
          </div>

          {/* Pressure */}
          <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 hover:border-indigo-300 transition-all duration-200">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-800 font-semibold">Pressure</span>
              <Gauge className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div className="text-base sm:text-lg font-bold text-slate-900 font-mono flex items-baseline gap-0.5">
              <span>{telemetry.pressure}</span>
              <span className="text-xs text-indigo-700 font-normal">hPa</span>
            </div>
            <p className="text-[9px] text-slate-500 font-mono mt-0.5">
              Barometric SLP
            </p>
          </div>

          {/* Wind */}
          <div className="p-3 rounded-2xl bg-teal-50/60 border border-teal-200/80 hover:border-teal-300 transition-all duration-200">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-teal-800 font-semibold">Wind</span>
              <Wind className="w-3.5 h-3.5 text-teal-600" />
            </div>
            <div className="text-base sm:text-lg font-bold text-slate-900 font-mono flex items-baseline gap-0.5">
              <span>{telemetry.wind}</span>
              <span className="text-xs text-teal-700 font-normal">km/h</span>
            </div>
            <p className="text-[9px] text-slate-500 font-mono mt-0.5">
              Gusts 15.2 km/h
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
