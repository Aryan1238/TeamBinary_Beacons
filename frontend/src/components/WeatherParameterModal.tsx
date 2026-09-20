import React from 'react';
import {
  X,
  Thermometer,
  CloudRain,
  Wind,
  Droplets,
  TrendingUp,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { Station } from '../types';

export type WeatherParameterType = 'temperature' | 'rainfall' | 'wind' | 'humidity';

interface WeatherParameterModalProps {
  parameter: WeatherParameterType | null;
  selectedStation: Station | null;
  stations: Station[];
  onClose: () => void;
  onSelectStation: (stationId: string) => void;
}

export const WeatherParameterModal: React.FC<WeatherParameterModalProps> = ({
  parameter,
  selectedStation,
  stations,
  onClose,
  onSelectStation
}) => {
  if (!parameter) return null;

  const config = {
    temperature: {
      title: 'Atmospheric Temperature Intelligence',
      unit: '°C',
      icon: Thermometer,
      iconBg: 'bg-orange-50 text-orange-600 border-orange-200',
      color: '#EA580C',
      description: 'Surface level air temperature measured at 2 meters above ground level per WMO-No. 8 standards.',
      validRange: '-15°C to +55°C (Indian terrestrial envelope)',
      getValue: (s: Station) => s.temperature ?? 0,
      formatValue: (v: number) => `${v.toFixed(1)}°C`,
      barScale: (v: number) => Math.min(100, Math.max(5, ((v - 10) / 35) * 100))
    },
    rainfall: {
      title: 'Precipitation & Rainfall Telemetry',
      unit: 'mm',
      icon: CloudRain,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-200',
      color: '#0284C7',
      description: 'Accumulated surface precipitation and liquid equivalent rainfall detected by tipping bucket AWS gauge.',
      validRange: '0.0 mm to 300.0 mm/hr',
      getValue: (s: Station) => s.rainfall ?? s.precipitation ?? 0,
      formatValue: (v: number) => `${v.toFixed(1)} mm`,
      barScale: (v: number) => Math.min(100, Math.max(5, (v / 15) * 100))
    },
    wind: {
      title: 'Surface Wind Velocity & Flow (10m)',
      unit: 'km/h',
      icon: Wind,
      iconBg: 'bg-teal-50 text-teal-600 border-teal-200',
      color: '#0D9488',
      description: 'Horizontal wind speed recorded by ultrasonic/cup anemometer at standardized 10-meter mast height.',
      validRange: '0.0 to 180.0 km/h (Squall / Gale scale)',
      getValue: (s: Station) => s.wind_speed ?? 0,
      formatValue: (v: number) => `${v.toFixed(1)} km/h`,
      barScale: (v: number) => Math.min(100, Math.max(5, (v / 40) * 100))
    },
    humidity: {
      title: 'Relative Humidity & Barometric Moisture',
      unit: '%',
      icon: Droplets,
      iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-200',
      color: '#4F46E5',
      description: 'Ratio of current ambient vapor pressure to saturation vapor pressure at observed air temperature.',
      validRange: '0% to 100% RH (Physical limits)',
      getValue: (s: Station) => s.humidity ?? 0,
      formatValue: (v: number) => `${Math.round(v)}%`,
      barScale: (v: number) => Math.min(100, Math.max(5, v))
    }
  }[parameter];

  const Icon = config.icon;

  const sortedStations = [...stations].sort((a, b) => config.getValue(b) - config.getValue(a));
  const highest = sortedStations[0];
  const lowest = sortedStations[sortedStations.length - 1];
  const avg = sortedStations.length
    ? Math.round((sortedStations.reduce((sum, s) => sum + config.getValue(s), 0) / sortedStations.length) * 10) / 10
    : 0;

  const currentVal = selectedStation ? config.getValue(selectedStation) : 0;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${config.iconBg} shadow-xs`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-slate-900 tracking-tight">{config.title}</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 font-bold uppercase">
                  Live Telemetry
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{config.description}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {selectedStation && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono text-cyan-300 uppercase tracking-wide">
                  Currently Selected Location
                </span>
                <h4 className="text-xl font-bold text-white flex items-center gap-2 mt-0.5">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  <span>{selectedStation.name}, {selectedStation.state}</span>
                </h4>
                <p className="text-xs text-slate-300 font-sans mt-0.5">
                  Condition: <strong className="text-white">{selectedStation.weather_condition || 'Clear Sky'}</strong> • Elevation: {selectedStation.elevation}m
                </p>
              </div>

              <div className="text-left sm:text-right bg-white/10 px-4 py-2.5 rounded-xl border border-white/10">
                <span className="text-[10px] font-mono text-slate-300 uppercase block">Live Reading</span>
                <span className="text-2xl font-bold font-mono text-cyan-300">
                  {config.formatValue(currentVal)}
                </span>
                <span className="block text-[10px] text-slate-300 font-mono mt-0.5">
                  {selectedStation.last_update}
                </span>
              </div>
            </div>
          )}

          {/* National Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-mono text-slate-500 block">National Average</span>
              <p className="text-xl font-bold font-mono text-slate-900 mt-1">
                {config.formatValue(avg)}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Calculated across 15 monitored nodes</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-mono text-slate-500 block">Highest Recorded</span>
              <p className="text-xl font-bold font-mono text-orange-600 mt-1">
                {highest ? config.formatValue(config.getValue(highest)) : 'N/A'}
              </p>
              <p className="text-[11px] text-slate-600 mt-0.5 font-medium">
                {highest ? `${highest.name} (${highest.state})` : 'N/A'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-mono text-slate-500 block">Lowest Recorded</span>
              <p className="text-xl font-bold font-mono text-blue-600 mt-1">
                {lowest ? config.formatValue(config.getValue(lowest)) : 'N/A'}
              </p>
              <p className="text-[11px] text-slate-600 mt-0.5 font-medium">
                {lowest ? `${lowest.name} (${lowest.state})` : 'N/A'}
              </p>
            </div>
          </div>

          {/* All 15 Stations Comparison List */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h5 className="font-bold text-xs uppercase text-slate-800 tracking-wide">
                Live National Distribution ({sortedStations.length} Locations)
              </h5>
              <span className="text-[11px] text-slate-500 font-sans">Ranked Highest to Lowest</span>
            </div>

            <div className="divide-y divide-slate-100 max-h-[260px] overflow-y-auto">
              {sortedStations.map((st, idx) => {
                const val = config.getValue(st);
                const isCurrent = selectedStation?.id === st.id;
                const pct = config.barScale(val);

                return (
                  <div
                    key={st.id}
                    onClick={() => onSelectStation(st.id)}
                    className={`p-3 flex items-center justify-between gap-4 cursor-pointer transition ${
                      isCurrent ? 'bg-cyan-50/80 font-semibold' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-[160px]">
                      <span className="text-xs font-mono text-slate-400 w-5">#{idx + 1}</span>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{st.name}</p>
                        <p className="text-[10px] text-slate-500">{st.state} • {st.region}</p>
                      </div>
                    </div>

                    <div className="flex-1 hidden sm:block mx-4">
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: config.color
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-mono font-bold text-slate-900">
                        {config.formatValue(val)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectStation(st.id);
                        }}
                        className="p-1 text-slate-400 hover:text-cyan-700 transition"
                        title="Focus on map"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Physical Validity Bounds:</strong> {config.validRange}. Readings outside this range trigger automated sensor anomaly flags. Source: Open-Meteo Weather API.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-sans">
            Source: Live Weather Data — Open-Meteo API
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition shadow-xs"
          >
            Close Deep Dive
          </button>
        </div>
      </div>
    </div>
  );
};
