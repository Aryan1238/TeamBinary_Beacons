import React from 'react';
import { AWSStation } from '../types';
import { Radio, MapPin, Mountain } from 'lucide-react';

export const StationOverview: React.FC = () => {
  // 6 prototype AWS weather stations for Phase 1
  const stations: AWSStation[] = [
    {
      id: 'AWS-DEL-01',
      name: 'Safdarjung Observatory',
      location: 'New Delhi',
      state: 'Delhi (NCR)',
      elevationMeters: 216,
      sensorArray: ['Temperature', 'Pressure', 'Humidity', 'Wind', 'Rainfall'],
      transmissionStatus: 'ONLINE',
      lastPing: '3s ago',
      coordinates: { lat: 28.584, lng: 77.206 }
    },
    {
      id: 'AWS-PUN-04',
      name: 'Shivajinagar Station',
      location: 'Pune',
      state: 'Maharashtra',
      elevationMeters: 560,
      sensorArray: ['Temperature', 'Pressure', 'Humidity', 'Wind', 'Solar'],
      transmissionStatus: 'ONLINE',
      lastPing: '2s ago',
      coordinates: { lat: 18.531, lng: 73.855 }
    },
    {
      id: 'AWS-BLR-05',
      name: 'HAL Airport Array',
      location: 'Bengaluru',
      state: 'Karnataka',
      elevationMeters: 920,
      sensorArray: ['Temperature', 'Pressure', 'Humidity', 'Wind'],
      transmissionStatus: 'ONLINE',
      lastPing: '5s ago',
      coordinates: { lat: 12.956, lng: 77.665 }
    },
    {
      id: 'AWS-CCU-08',
      name: 'Alipore Weather Base',
      location: 'Kolkata',
      state: 'West Bengal',
      elevationMeters: 9,
      sensorArray: ['Temperature', 'Pressure', 'Humidity', 'Wind', 'Rainfall'],
      transmissionStatus: 'STANDBY',
      lastPing: '28s ago',
      coordinates: { lat: 22.533, lng: 88.333 }
    },
    {
      id: 'AWS-JPR-02',
      name: 'Sanganer Field Office',
      location: 'Jaipur',
      state: 'Rajasthan',
      elevationMeters: 390,
      sensorArray: ['Temperature', 'Pressure', 'Humidity', 'Wind'],
      transmissionStatus: 'ONLINE',
      lastPing: '4s ago',
      coordinates: { lat: 26.828, lng: 75.805 }
    },
    {
      id: 'AWS-SXR-12',
      name: 'Aerodrome Meteorological Node',
      location: 'Srinagar',
      state: 'Jammu & Kashmir',
      elevationMeters: 1585,
      sensorArray: ['Temperature', 'Pressure', 'Humidity', 'Wind'],
      transmissionStatus: 'DEGRADED',
      lastPing: '42s ago',
      coordinates: { lat: 33.987, lng: 74.774 }
    }
  ];

  const getStatusBadge = (status: AWSStation['transmissionStatus']) => {
    switch (status) {
      case 'ONLINE':
        return (
          <span className="badge-online inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            ONLINE
          </span>
        );
      case 'STANDBY':
        return (
          <span className="badge-standby inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            STANDBY
          </span>
        );
      case 'DEGRADED':
        return (
          <span className="badge-degraded inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
            DEGRADED
          </span>
        );
    }
  };

  return (
    <div className="dashboard-card p-5 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Station Overview
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              6 Prototype Automatic Weather Stations Monitored
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> 4 Online
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> 1 Standby
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-400" /> 1 Degraded
          </span>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
              <th className="pb-3 font-semibold">Station ID</th>
              <th className="pb-3 font-semibold">Location</th>
              <th className="pb-3 font-semibold">Elevation</th>
              <th className="pb-3 font-semibold">Sensor Array</th>
              <th className="pb-3 font-semibold">Transmission</th>
              <th className="pb-3 font-semibold text-right">Heartbeat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {stations.map((st) => (
              <tr key={st.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="py-3 font-bold text-cyan-400 flex items-center gap-2">
                  <span>{st.id}</span>
                </td>
                <td className="py-3 text-slate-200">
                  <div className="font-sans font-medium text-white">{st.name}</div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    <span>{st.location}, {st.state}</span>
                  </div>
                </td>
                <td className="py-3 text-slate-300">
                  <div className="flex items-center gap-1">
                    <Mountain className="w-3.5 h-3.5 text-slate-500" />
                    <span>{st.elevationMeters} m</span>
                  </div>
                </td>
                <td className="py-3 text-slate-300">
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {st.sensorArray.map((sensor, idx) => (
                      <span
                        key={idx}
                        className="px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700/50 text-[10px] text-slate-300"
                      >
                        {sensor}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-3">
                  {getStatusBadge(st.transmissionStatus)}
                </td>
                <td className="py-3 text-right text-slate-400 text-[11px]">
                  {st.lastPing}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Grid View */}
      <div className="md:hidden space-y-3">
        {stations.map((st) => (
          <div
            key={st.id}
            className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5 font-mono text-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-cyan-400">{st.id}</span>
              {getStatusBadge(st.transmissionStatus)}
            </div>
            <div>
              <div className="font-sans font-bold text-white text-sm">{st.name}</div>
              <div className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-slate-500" />
                <span>{st.location}, {st.state} • {st.elevationMeters}m</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-800/60">
              {st.sensorArray.map((sensor, idx) => (
                <span
                  key={idx}
                  className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300"
                >
                  {sensor}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
