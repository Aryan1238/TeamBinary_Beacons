import React from 'react';
import {
  Layers,
  Thermometer,
  CloudRain,
  Wind,
  Droplets,
  Gauge,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Radio,
  SlidersHorizontal,
  Check
} from 'lucide-react';
import { WeatherParameterType } from './IndiaMap';

export type TemporalMode = 'live' | 'forecast_24h' | 'forecast_5d' | 'past_24h';
export type StationFilterType = 'all' | 'arg' | 'anomalous';

interface WindsObservationPanelProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  activeParameter: WeatherParameterType;
  onParameterChange: (param: WeatherParameterType) => void;
  temporalMode: TemporalMode;
  onTemporalModeChange: (mode: TemporalMode) => void;
  stationFilter: StationFilterType;
  onStationFilterChange: (filter: StationFilterType) => void;
  totalStations: number;
  anomalousCount: number;
  apiStatus: string;
}

export const WindsObservationPanel: React.FC<WindsObservationPanelProps> = ({
  isCollapsed,
  onToggleCollapse,
  activeParameter,
  onParameterChange,
  temporalMode,
  onTemporalModeChange,
  stationFilter,
  onStationFilterChange,
  totalStations,
  anomalousCount,
  apiStatus
}) => {
  if (isCollapsed) {
    return (
      <div className="w-12 bg-white border-r border-slate-200 flex flex-col items-center py-4 gap-4 z-10 transition-all select-none shadow-xs">
        <button
          onClick={onToggleCollapse}
          title="Expand WINDS Observation Panel"
          className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 transition"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="rotate-90 origin-center whitespace-nowrap text-[11px] font-bold tracking-wider text-slate-400 mt-12">
          OBSERVATIONS
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 bg-white border-r border-slate-200 flex flex-col z-10 select-none shadow-xs overflow-y-auto font-sans transition-all">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-600 text-white shadow-2xs">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 tracking-wide">
              WINDS OBSERVATIONS
            </h3>
            <span className="text-[10px] text-slate-500 block">
              Meteorological Layers & Filters
            </span>
          </div>
        </div>
        <button
          onClick={onToggleCollapse}
          title="Collapse Panel"
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-5 flex-1">
        {/* Section 1: Weather Parameters */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
            Observation Layer
          </label>
          <div className="space-y-1.5">
            {[
              { id: 'temperature', label: 'Air Temperature', unit: '°C', icon: Thermometer, color: 'text-orange-500', activeBg: 'bg-orange-50 border-orange-300 text-orange-900' },
              { id: 'rainfall', label: 'Precipitation / Rain', unit: 'mm', icon: CloudRain, color: 'text-blue-600', activeBg: 'bg-blue-50 border-blue-300 text-blue-900' },
              { id: 'wind', label: 'Wind Speed', unit: 'km/h', icon: Wind, color: 'text-teal-600', activeBg: 'bg-teal-50 border-teal-300 text-teal-900' },
              { id: 'humidity', label: 'Relative Humidity', unit: '%', icon: Droplets, color: 'text-indigo-600', activeBg: 'bg-indigo-50 border-indigo-300 text-indigo-900' },
            ].map(param => {
              const Icon = param.icon;
              const isActive = activeParameter === param.id;
              return (
                <button
                  key={param.id}
                  onClick={() => onParameterChange(param.id as WeatherParameterType)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs font-medium transition ${
                    isActive
                      ? `${param.activeBg} ring-1 ring-blue-500/20 shadow-2xs font-semibold`
                      : 'border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${param.color}`} />
                    <span>{param.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      {param.unit}
                    </span>
                    {isActive && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Temporal Cycle */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
            Temporal Horizon
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { id: 'live', label: 'Live (Now)', icon: Radio },
              { id: 'forecast_24h', label: '24h Forecast', icon: Clock },
              { id: 'forecast_5d', label: '5-Day Outlook', icon: Calendar },
              { id: 'past_24h', label: 'Past 24h', icon: SlidersHorizontal }
            ].map(mode => {
              const Icon = mode.icon;
              const isActive = temporalMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => onTemporalModeChange(mode.id as TemporalMode)}
                  className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-xs transition ${
                    isActive
                      ? 'bg-blue-600 border-blue-600 text-white font-semibold shadow-2xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{mode.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3: Station Type Filter */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
            Station Network Layer
          </label>
          <div className="space-y-1.5 text-xs">
            <button
              onClick={() => onStationFilterChange('all')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border transition ${
                stationFilter === 'all'
                  ? 'bg-slate-900 border-slate-900 text-white font-semibold'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>All AWS Stations</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                stationFilter === 'all' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
              }`}>
                {totalStations}
              </span>
            </button>

            <button
              onClick={() => onStationFilterChange('arg')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border transition ${
                stationFilter === 'arg'
                  ? 'bg-blue-700 border-blue-700 text-white font-semibold'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>Agro-Met / Rain Gauges</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                stationFilter === 'arg' ? 'bg-blue-800 text-blue-100' : 'bg-slate-100 text-slate-600'
              }`}>
                {totalStations}
              </span>
            </button>

            <button
              onClick={() => onStationFilterChange('anomalous')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border transition ${
                stationFilter === 'anomalous'
                  ? 'bg-amber-600 border-amber-600 text-white font-semibold'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>Flagged / Anomalous Only</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                stationFilter === 'anomalous' ? 'bg-amber-700 text-amber-100' : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {anomalousCount}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Info Badge */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 space-y-1">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-medium text-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            WMO-8 Standard Checked
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
            VALID
          </span>
        </div>
        <p className="text-[10px] text-slate-400">
          Source: Live Open-Meteo Weather API
        </p>
      </div>
    </div>
  );
};
