import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Flame,
  Snowflake,
  Wind,
  CloudRain,
  ChevronRight,
  ChevronLeft,
  MapPin,
  ExternalLink,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Sliders
} from 'lucide-react';
import { Station } from '../types';
import { WeatherParameterType } from './IndiaMap';

interface WindsRankingsPanelProps {
  stations: Station[];
  selectedStation: Station | null;
  onSelectStation: (stationId: string) => void;
  onOpenDeepDive?: (param: WeatherParameterType) => void;
  onViewStationDetails?: (stationId: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

type RankingCategory = 'hottest' | 'coldest' | 'wind' | 'rain';

export const WindsRankingsPanel: React.FC<WindsRankingsPanelProps> = ({
  stations,
  selectedStation,
  onSelectStation,
  onOpenDeepDive,
  onViewStationDetails,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const [activeCategory, setActiveCategory] = useState<RankingCategory>('hottest');

  // Compute rankings dynamically from stations
  const rankings = useMemo(() => {
    const list = [...stations];
    switch (activeCategory) {
      case 'hottest':
        return list
          .filter(s => s.temperature !== undefined && s.temperature !== null)
          .sort((a, b) => (b.temperature ?? 0) - (a.temperature ?? 0))
          .slice(0, 5);
      case 'coldest':
        return list
          .filter(s => s.temperature !== undefined && s.temperature !== null)
          .sort((a, b) => (a.temperature ?? 0) - (b.temperature ?? 0))
          .slice(0, 5);
      case 'wind':
        return list
          .filter(s => s.wind_speed !== undefined && s.wind_speed !== null)
          .sort((a, b) => (b.wind_speed ?? 0) - (a.wind_speed ?? 0))
          .slice(0, 5);
      case 'rain':
        return list
          .sort((a, b) => ((b.rainfall ?? b.precipitation ?? 0) - (a.rainfall ?? a.precipitation ?? 0)))
          .slice(0, 5);
      default:
        return list.slice(0, 5);
    }
  }, [stations, activeCategory]);

  if (isCollapsed) {
    return (
      <div className="w-12 bg-white border-l border-slate-200 flex flex-col items-center py-4 gap-4 z-10 transition-all select-none shadow-xs">
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            title="Expand Dynamic Rankings"
            className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        <div className="rotate-90 origin-center whitespace-nowrap text-[11px] font-bold tracking-wider text-slate-400 mt-12">
          RANKINGS
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 lg:w-88 bg-white border-l border-slate-200 flex flex-col z-10 select-none shadow-xs overflow-y-auto font-sans transition-all">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500 text-white shadow-2xs">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 tracking-wide">
              NATIONAL RANKINGS
            </h3>
            <span className="text-[10px] text-slate-500 block">
              Dynamic Extremes (Open-Meteo)
            </span>
          </div>
        </div>
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            title="Collapse Panel"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="p-4 space-y-4 flex-1">
        {/* Category Switcher Tabs */}
        <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveCategory('hottest')}
            className={`py-1.5 rounded-lg transition flex flex-col items-center gap-0.5 ${
              activeCategory === 'hottest'
                ? 'bg-white text-orange-600 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Hottest Locations"
          >
            <Flame className="w-3.5 h-3.5" />
            <span className="text-[10px]">Hottest</span>
          </button>
          <button
            onClick={() => setActiveCategory('coldest')}
            className={`py-1.5 rounded-lg transition flex flex-col items-center gap-0.5 ${
              activeCategory === 'coldest'
                ? 'bg-white text-blue-600 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Coldest Locations"
          >
            <Snowflake className="w-3.5 h-3.5" />
            <span className="text-[10px]">Coldest</span>
          </button>
          <button
            onClick={() => setActiveCategory('wind')}
            className={`py-1.5 rounded-lg transition flex flex-col items-center gap-0.5 ${
              activeCategory === 'wind'
                ? 'bg-white text-teal-600 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Strongest Winds"
          >
            <Wind className="w-3.5 h-3.5" />
            <span className="text-[10px]">Wind</span>
          </button>
          <button
            onClick={() => setActiveCategory('rain')}
            className={`py-1.5 rounded-lg transition flex flex-col items-center gap-0.5 ${
              activeCategory === 'rain'
                ? 'bg-white text-indigo-600 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Highest Rainfall"
          >
            <CloudRain className="w-3.5 h-3.5" />
            <span className="text-[10px]">Rain</span>
          </button>
        </div>

        {/* Dynamic Top 5 List */}
        <div className="space-y-1.5">
          {rankings.map((st, idx) => {
            const isSelected = selectedStation?.id === st.id;
            let displayVal = '';
            let valColor = 'text-slate-800';

            if (activeCategory === 'hottest' || activeCategory === 'coldest') {
              displayVal = `${st.temperature}°C`;
              valColor = activeCategory === 'hottest' ? 'text-orange-600' : 'text-blue-600';
            } else if (activeCategory === 'wind') {
              displayVal = `${st.wind_speed ?? 0} km/h`;
              valColor = 'text-teal-600';
            } else {
              const r = st.rainfall ?? st.precipitation ?? 0;
              displayVal = `${r.toFixed(1)} mm`;
              valColor = 'text-indigo-600';
            }

            const rankBg =
              idx === 0
                ? 'bg-amber-100 text-amber-800 border-amber-300 font-extrabold'
                : idx === 1
                ? 'bg-slate-200 text-slate-700 border-slate-300 font-bold'
                : idx === 2
                ? 'bg-amber-50 text-amber-700 border-amber-200 font-bold'
                : 'bg-slate-100 text-slate-500 border-slate-200';

            return (
              <div
                key={st.id}
                onClick={() => onSelectStation(st.id)}
                className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20 shadow-2xs'
                    : 'bg-white border-slate-200/80 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] border flex-shrink-0 ${rankBg}`}>
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-800 truncate">
                      {st.name}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {st.state} • {st.weather_condition || 'Normal'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs font-mono font-bold ${valColor}`}>
                    {displayVal}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectStation(st.id);
                    }}
                    className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                    title="Focus on Map"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Station Dossier Card */}
        {selectedStation && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Station Dossier
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {selectedStation.id}
              </span>
            </div>

            <div className="bg-slate-50/90 rounded-xl p-3.5 border border-slate-200/90 space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">
                    {selectedStation.name}
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
                    {selectedStation.status.toUpperCase()}
                  </span>
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span>{selectedStation.state} ({selectedStation.region})</span>
                  <span>•</span>
                  <span>{selectedStation.elevation}m ASL</span>
                </div>
              </div>

              {/* Condition Badge */}
              <div className="bg-white rounded-lg p-2 border border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500">Condition</span>
                <span className="font-semibold text-slate-800">
                  {selectedStation.weather_condition || 'Clear Sky'}
                </span>
              </div>

              {/* 4 Telemetry Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">Temperature</span>
                  <span className="text-sm font-mono font-bold text-orange-600">
                    {selectedStation.temperature ?? '--'}°C
                  </span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">Pressure</span>
                  <span className="text-sm font-mono font-bold text-slate-800">
                    {selectedStation.pressure ?? '--'} hPa
                  </span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">Humidity</span>
                  <span className="text-sm font-mono font-bold text-blue-600">
                    {selectedStation.humidity ?? '--'}%
                  </span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">Wind Speed</span>
                  <span className="text-sm font-mono font-bold text-teal-600">
                    {selectedStation.wind_speed ?? '--'} km/h
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col gap-1.5">
                {onOpenDeepDive && (
                  <button
                    onClick={() => onOpenDeepDive('temperature')}
                    className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Deep-Dive Parameter Analysis</span>
                  </button>
                )}
                {onViewStationDetails && (
                  <button
                    onClick={() => onViewStationDetails(selectedStation.id)}
                    className="w-full py-1.5 px-3 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium transition flex items-center justify-center gap-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View Complete Station Audit</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
