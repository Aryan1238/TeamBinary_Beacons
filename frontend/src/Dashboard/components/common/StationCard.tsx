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
      return 'border-sky-500 ring-2 ring-sky-500/20 shadow-md';
    }
    switch (station.status) {
      case 'ANOMALY':
        return 'border-red-200 hover:border-red-400 hover:shadow-md hover:shadow-red-500/10';
      case 'WARNING':
        return 'border-amber-200 hover:border-amber-400 hover:shadow-md hover:shadow-amber-500/10';
      case 'NORMAL':
        return 'border-slate-200 hover:border-sky-300 hover:shadow-md hover:shadow-sky-500/10';
      case 'OFFLINE':
      default:
        return 'border-slate-200 hover:border-slate-300';
    }
  };

  return (
    <div
      onClick={() => onClick?.(station)}
      className={`rounded-2xl bg-white border p-5 transition-all duration-200 cursor-pointer select-none relative overflow-hidden group hover:-translate-y-0.5 shadow-xs ${getStatusBorderAndGlow()}`}
    >
      {/* Header: ID + Location + Status */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-sm text-sky-700">{station.id}</span>
            <span className="text-[10px] font-mono text-slate-600 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
              {station.region}
            </span>
            <span className="text-[9px] font-mono font-semibold text-sky-700 px-1.5 py-0.5 rounded bg-sky-50 border border-sky-200">
              {station.dataSource || '[Meteostat + NOAA]'}
            </span>
          </div>
          <h3 className="font-bold text-slate-900 text-sm tracking-tight mt-1 group-hover:text-sky-700 transition-colors">
            {station.name}
          </h3>
          <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-slate-400" />
            <span>{station.location}, {station.state}</span>
          </p>
        </div>
        <StatusBadge status={station.status} size="sm" />
      </div>

      {/* Live Parameter Grid with Clean Light Surface */}
      <div className="grid grid-cols-2 gap-2 my-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-mono">
        <div className="flex items-center gap-1.5">
          <Thermometer className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-slate-500">Temp:</span>
          <span className={`font-bold ${station.sensors.temperature.status === 'ANOMALY' ? 'text-red-600 font-extrabold' : 'text-slate-800'}`}>
            {station.sensors.temperature.value}°C
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Droplets className="w-3.5 h-3.5 text-sky-600" />
          <span className="text-slate-500">RH:</span>
          <span className="font-bold text-slate-800">{station.sensors.humidity.value}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Gauge className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-slate-500">Pres:</span>
          <span className="font-bold text-slate-800">{station.sensors.pressure.value}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Wind className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-slate-500">Wind:</span>
          <span className="font-bold text-slate-800">{station.sensors.wind.value} km/h</span>
        </div>
      </div>

      {/* Footer: Health score & Last ping */}
      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1.5">
          <span>Fleet Health:</span>
          <span className={`font-bold ${station.healthScore > 90 ? 'text-emerald-600' : station.healthScore > 75 ? 'text-amber-600' : 'text-red-600'}`}>
            {station.healthScore}%
          </span>
        </div>
        <div className="text-slate-500">
          Synced {station.lastPingSeconds}s ago
        </div>
      </div>
    </div>
  );
};
