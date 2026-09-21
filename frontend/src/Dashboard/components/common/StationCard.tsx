import React from 'react';
import { AWSStation } from '../../types/dashboard.types';
import { StatusBadge } from './StatusBadge';
import { Thermometer, Droplets, Gauge, Wind, MapPin } from 'lucide-react';

interface StationCardProps {
  station: AWSStation;
  isSelected?: boolean;
  onClick?: (station: AWSStation) => void;
}

export const StationCard: React.FC<StationCardProps> = ({
  station,
  isSelected = false,
  onClick,
}) => {
  const getStatusBorderAndGlow = () => {
    if (isSelected) {
      return 'border-sky-400 shadow-[0_0_25px_rgba(56,189,248,0.25)] ring-1 ring-sky-400/50';
    }
    switch (station.status) {
      case 'ANOMALY':
        return 'border-rose-500/35 hover:border-rose-400/70 hover:shadow-[0_4px_24px_rgba(244,63,94,0.18)]';
      case 'WARNING':
        return 'border-amber-500/30 hover:border-amber-400/60 hover:shadow-[0_4px_24px_rgba(251,191,36,0.15)]';
      case 'NORMAL':
        return 'border-slate-800/80 hover:border-sky-500/40 hover:shadow-[0_4px_24px_rgba(56,189,248,0.12)]';
      case 'OFFLINE':
      default:
        return 'border-slate-800/60 hover:border-slate-700/80';
    }
  };

  return (
    <div
      onClick={() => onClick?.(station)}
      className={`rounded-2xl bg-gradient-to-b from-[#111a31]/90 via-[#0e1628]/85 to-[#090e1c]/95 border p-5 transition-all duration-200 cursor-pointer select-none backdrop-blur-md relative overflow-hidden group hover:-translate-y-0.5 ${getStatusBorderAndGlow()}`}
    >
      {/* Top subtle ambient shine */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-sky-400/15 to-transparent" />

      {/* Header: ID + Location + Status */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-sm text-sky-400">{station.id}</span>
            <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-slate-900/80 border border-slate-800">
              {station.region}
            </span>
          </div>
          <h3 className="font-bold text-white text-sm tracking-tight mt-1 group-hover:text-sky-200 transition-colors">
            {station.name}
          </h3>
          <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-slate-500" />
            <span>{station.location}, {station.state}</span>
          </p>
        </div>
        <StatusBadge status={station.status} size="sm" />
      </div>

      {/* Live Parameter Grid with Dusk Surface */}
      <div className="grid grid-cols-2 gap-2 my-3 p-2.5 rounded-xl bg-[#0a101f]/70 border border-slate-800/80 text-xs font-mono">
        <div className="flex items-center gap-1.5">
          <Thermometer className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-400">Temp:</span>
          <span className={`font-bold ${station.sensors.temperature.status === 'ANOMALY' ? 'text-rose-400 font-extrabold' : 'text-slate-200'}`}>
            {station.sensors.temperature.value}°C
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Droplets className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-slate-400">RH:</span>
          <span className="font-bold text-slate-200">{station.sensors.humidity.value}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Gauge className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-slate-400">Pres:</span>
          <span className="font-bold text-slate-200">{station.sensors.pressure.value}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Wind className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-400">Wind:</span>
          <span className="font-bold text-slate-200">{station.sensors.wind.value} km/h</span>
        </div>
      </div>

      {/* Footer: Health score & Last ping */}
      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-800/80">
        <div className="flex items-center gap-1.5">
          <span>Fleet Health:</span>
          <span className={`font-bold ${station.healthScore > 90 ? 'text-emerald-400' : station.healthScore > 75 ? 'text-amber-400' : 'text-rose-400'}`}>
            {station.healthScore}%
          </span>
        </div>
        <div className="text-slate-400">
          Synced {station.lastPingSeconds}s ago
        </div>
      </div>
    </div>
  );
};
