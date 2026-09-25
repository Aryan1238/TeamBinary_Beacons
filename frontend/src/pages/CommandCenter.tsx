import React, { useState, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  Building2,
  ShieldCheck,
  Radio,
  ChevronRight,
  BrainCircuit,
  ExternalLink,
  Flame,
  Globe2,
  CheckCircle2,
  Info,
  Thermometer,
  CloudRain,
  Wind,
  Droplets,
  Gauge,
  MapPin,
  Clock,
  Sparkles,
  ArrowRight,
  Search,
  Sun,
  Cloud,
  CloudLightning,
  TrendingUp,
  Compass,
  Layers,
  Calendar
} from 'lucide-react';
import { Station, AnomalyRecord, NetworkKPIs } from '../types';
import { IndiaMap, WeatherParameterType } from '../components/IndiaMap';
import { TelemetryChart } from '../components/TelemetryChart';
import { WeatherParameterModal } from '../components/WeatherParameterModal';
import { WeatherForecastStrip } from '../components/WeatherForecastStrip';

interface CommandCenterProps {
  stations: Station[];
  anomalies: AnomalyRecord[];
  kpis: NetworkKPIs | null;
  aiBrief: string;
  onSelectStation: (id: string) => void;
  onInvestigateAnomaly: (anomaly: AnomalyRecord) => void;
  onNavigateTab: (tab: string) => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  stations,
  anomalies,
  kpis,
  aiBrief,
  onSelectStation,
  onInvestigateAnomaly,
  onNavigateTab
}) => {
  // Highlight target station (default: Pune or first critical station)
  const criticalAnomaly = anomalies.find(a => a.severity === 'CRITICAL');
  const defaultStation = stations.find(s => s.name === "Pune") || stations[0];
  const [selectedStationId, setSelectedStationId] = useState<string>(
    criticalAnomaly ? criticalAnomaly.station_id : (defaultStation?.id || 'LOC-MH-02')
  );

  const selectedStation = stations.find(s => s.id === selectedStationId) || defaultStation;

  // Search & filter state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);

  // Parameter Modal state for deep-dive
  const [activeModalParam, setActiveModalParam] = useState<WeatherParameterType | null>(null);

  // Map parameter layer state
  const [mapParameter, setMapParameter] = useState<WeatherParameterType>('temperature');

  // Filtered search list
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return stations.filter(s =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.region.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, stations]);

  // Dynamic calculations from live dataset
  const validTemps = stations.map(s => s.temperature).filter(t => t !== null && t !== undefined);
  const nationalAvgTemp = validTemps.length
    ? Math.round((validTemps.reduce((a, b) => a + b, 0) / validTemps.length) * 10) / 10
    : 28.0;

  const validPressures = stations.map(s => s.pressure).filter(p => p !== null && p !== undefined);
  const nationalAvgPress = validPressures.length
    ? Math.round((validPressures.reduce((a, b) => a + b, 0) / validPressures.length) * 10) / 10
    : 1005.0;

  const validHumidities = stations.map(s => s.humidity).filter(h => h !== null && h !== undefined);
  const nationalAvgHumidity = validHumidities.length
    ? Math.round((validHumidities.reduce((a, b) => a + b, 0) / validHumidities.length) * 10) / 10
    : 65.0;

  const validWinds = stations.map(s => s.wind_speed ?? 0).filter(w => w !== null && w !== undefined);
  const nationalAvgWind = validWinds.length
    ? Math.round((validWinds.reduce((a, b) => a + b, 0) / validWinds.length) * 10) / 10
    : 8.5;

  // Top 5 Hottest & Coldest
  const topHottest = useMemo(() => {
    return [...stations].sort((a, b) => (b.temperature ?? -99) - (a.temperature ?? -99)).slice(0, 5);
  }, [stations]);

  const topColdest = useMemo(() => {
    return [...stations].sort((a, b) => (a.temperature ?? 999) - (b.temperature ?? 999)).slice(0, 5);
  }, [stations]);

  // Top Wind
  const topWind = useMemo(() => {
    return [...stations].sort((a, b) => (b.wind_speed ?? 0) - (a.wind_speed ?? 0)).slice(0, 5);
  }, [stations]);

  // Max Rain / Precipitation
  const topRain = useMemo(() => {
    return [...stations].sort((a, b) => ((b.rainfall ?? b.precipitation ?? 0) - (a.rainfall ?? a.precipitation ?? 0))).slice(0, 5);
  }, [stations]);

  const baseT = selectedStation?.temperature ?? 28.0;
  const isSelectedCritical = selectedStation?.status === 'critical';

  // Weather condition visual theme helper
  const conditionStyle = useMemo(() => {
    const code = selectedStation?.weather_code ?? 0;
    const cond = selectedStation?.weather_condition?.toLowerCase() || '';

    if (cond.includes('thunder') || [95, 96, 99].includes(code)) {
      return {
        bg: 'from-slate-900 via-slate-950 to-slate-900 border-amber-800/60',
        badge: 'bg-amber-950/40 text-amber-300 border-amber-700/40',
        icon: CloudLightning,
        glow: 'text-amber-400'
      };
    } else if (cond.includes('rain') || cond.includes('drizzle') || [51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) {
      return {
        bg: 'from-slate-900 via-blue-950 to-slate-900 border-blue-800',
        badge: 'bg-blue-100 text-blue-800 border-blue-300',
        icon: CloudRain,
        glow: 'text-blue-400'
      };
    } else if (cond.includes('cloud') || cond.includes('overcast') || [2, 3].includes(code)) {
      return {
        bg: 'from-slate-900 via-slate-800 to-slate-900 border-slate-700',
        badge: 'bg-slate-100 text-slate-800 border-slate-300',
        icon: Cloud,
        glow: 'text-slate-300'
      };
    }
    return {
      bg: 'from-slate-900 via-slate-800 to-cyan-950 border-cyan-800',
      badge: 'bg-amber-100 text-amber-800 border-amber-300',
      icon: Sun,
      glow: 'text-cyan-300'
    };
  }, [selectedStation]);

  const ConditionIcon = conditionStyle.icon;

  // Live telemetry stream data points for selected location
  const tempChartData = [
    { time: '13:00', observed: baseT, expected: nationalAvgTemp },
    { time: '13:15', observed: baseT, expected: nationalAvgTemp },
    { time: '13:30', observed: baseT, expected: nationalAvgTemp },
    { time: '13:45', observed: baseT, expected: nationalAvgTemp },
    { time: 'Current', observed: baseT, expected: isSelectedCritical ? nationalAvgTemp : baseT }
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50 text-slate-900 font-sans">
      {/* Parameter Deep Dive Modal */}
      <WeatherParameterModal
        parameter={activeModalParam}
        selectedStation={selectedStation}
        stations={stations}
        onClose={() => setActiveModalParam(null)}
        onSelectStation={(id) => {
          setSelectedStationId(id);
          setActiveModalParam(null);
        }}
      />

      {/* Header & Live Polling Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              National Weather Intelligence Command Center
            </h1>
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              LIVE STREAM
            </span>
          </div>
          <p className="text-xs text-slate-500 font-sans mt-1">
            Ministry of Earth Sciences (MoES) • India Meteorological Department (IMD) Prototype
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 flex items-center gap-2 shadow-xs">
            <Radio className="w-3.5 h-3.5 text-cyan-600 animate-pulse" />
            <span className="text-slate-500">PROVIDER:</span>
            <span className="text-cyan-700 font-bold">Open-Meteo API</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 shadow-xs">
            SYNCED: <span className="text-slate-900 font-semibold">{kpis?.timestamp || selectedStation?.last_update || 'Real-time'}</span>
          </div>
        </div>
      </div>

      {/* Mandatory Data Attribution & Transparency Banner */}
      <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-3 text-xs font-sans text-slate-600">
        <Info className="w-4 h-4 text-cyan-600 shrink-0" />
        <p className="leading-relaxed">
          <strong className="text-slate-800 font-semibold">Live Weather Data — Open-Meteo API:</strong> Weather observations and forecasts are dynamically fetched from Open-Meteo. This operational platform is a meteorological surveillance demonstration and not an official IMD AWS operational feed.
        </p>
      </div>

      {/* Top Banner with Condition Backdrop */}
      <div className={`bg-gradient-to-r ${conditionStyle.bg} text-white rounded-2xl p-5 shadow-sm border transition-all duration-500`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono tracking-wider uppercase text-cyan-300 font-bold">
                LIVE WEATHER INTELLIGENCE
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {selectedStation?.name}, {selectedStation?.state}
              </h2>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/15 text-white flex items-center gap-1.5 border border-white/20">
                <ConditionIcon className="w-3.5 h-3.5 text-amber-300" />
                <span>{selectedStation?.weather_condition || 'Clear Sky'}</span>
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Real-time atmospheric telemetry across {stations.length} Indian Automatic Weather Station nodes. All metrics update dynamically from public weather APIs.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10">
            <div className="px-2">
              <span className="text-[10px] uppercase font-mono text-slate-300 block">Nat'l Avg Temp</span>
              <span className="text-xl font-mono font-bold text-cyan-300">{nationalAvgTemp}°C</span>
            </div>
            <div className="px-2 border-l border-white/10">
              <span className="text-[10px] uppercase font-mono text-slate-300 block">Avg Humidity</span>
              <span className="text-xl font-mono font-bold text-blue-300">{nationalAvgHumidity}%</span>
            </div>
            <div className="px-2 border-l border-white/10">
              <span className="text-[10px] uppercase font-mono text-slate-300 block">Avg Wind</span>
              <span className="text-xl font-mono font-bold text-teal-300">{nationalAvgWind} kph</span>
            </div>
            <div className="px-2 border-l border-white/10">
              <span className="text-[10px] uppercase font-mono text-slate-300 block">Highest Temp</span>
              <span className="text-xl font-mono font-bold text-amber-300">
                {topHottest[0] ? `${topHottest[0].name} ${topHottest[0].temperature}°C` : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Location Search and Quick Select */}
      <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search location (e.g. Pune, Delhi, Mumbai, Jaipur...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
            />

            {isSearchFocused && searchTerm.trim() && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-100">
                {searchResults.length === 0 ? (
                  <p className="p-3 text-xs text-slate-500">No matching Indian stations found</p>
                ) : (
                  searchResults.map(s => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSelectedStationId(s.id);
                        setSearchTerm('');
                        setIsSearchFocused(false);
                      }}
                      className="w-full text-left p-2.5 hover:bg-slate-50 flex items-center justify-between transition"
                    >
                      <div>
                        <span className="text-xs font-bold text-slate-900">{s.name}</span>
                        <span className="text-[10px] text-slate-500 ml-1.5">{s.state} ({s.region})</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-cyan-700">{s.temperature}°C</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <span className="text-xs text-slate-500 hidden sm:inline">
            Quick Select Location:
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {stations.map((st) => {
            const isSelected = selectedStation?.id === st.id;
            return (
              <button
                key={st.id}
                onClick={() => setSelectedStationId(st.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-sans transition whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-cyan-600 text-white font-semibold shadow-xs ring-2 ring-cyan-400/40'
                    : 'bg-slate-100/80 border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                <span>{st.name}</span>
                <span className={`font-mono text-[11px] ${isSelected ? 'text-white font-bold' : 'text-slate-500'}`}>
                  {st.temperature}°C
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {/* SECTION: LIVE WEATHER OVERVIEW (4 LARGE VISUAL INTERACTIVE CARDS) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Live Weather Observations</span>
              <span className="text-xs font-normal text-slate-500">
                — Click any card for national distribution deep dive
              </span>
            </h3>
          </div>
          <span className="text-xs font-mono text-cyan-700 font-semibold bg-cyan-50 px-2.5 py-1 rounded-lg border border-cyan-200">
            {selectedStation?.name} • Updated {selectedStation?.last_update}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Temperature Card */}
          <div
            onClick={() => setActiveModalParam('temperature')}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-orange-400 hover:shadow-md cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Temperature</span>
              <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600 group-hover:scale-110 transition border border-orange-200">
                <Thermometer className="w-5 h-5" />
              </div>
            </div>

            <div className="my-4">
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-bold font-mono tracking-tight ${isSelectedCritical ? 'text-red-600' : 'text-slate-900'}`}>
                  {selectedStation?.temperature ?? 'N/A'}°C
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-sans flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{selectedStation?.name} ({selectedStation?.weather_condition || 'Clear'})</span>
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1 text-orange-600 font-medium">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>View All 15 Cities</span>
              </span>
              <span className="font-mono text-slate-400 text-[10px]">Open-Meteo</span>
            </div>
          </div>

          {/* Rainfall Card */}
          <div
            onClick={() => setActiveModalParam('rainfall')}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-blue-400 hover:shadow-md cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Rainfall / Precip</span>
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 transition border border-blue-200">
                <CloudRain className="w-5 h-5" />
              </div>
            </div>

            <div className="my-4">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold font-mono text-blue-600 tracking-tight">
                  {(selectedStation?.rainfall ?? selectedStation?.precipitation ?? 0).toFixed(1)}
                  <span className="text-lg font-normal text-slate-500 ml-1">mm</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-sans flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{(selectedStation?.rainfall ?? 0) > 0 ? 'Active Rain Recorded' : 'Dry Surface Conditions'}</span>
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1 text-blue-600 font-medium">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Rain Gauge Details</span>
              </span>
              <span className="font-mono text-slate-400 text-[10px]">Open-Meteo</span>
            </div>
          </div>

          {/* Wind Speed Card */}
          <div
            onClick={() => setActiveModalParam('wind')}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-teal-400 hover:shadow-md cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Wind Velocity</span>
              <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600 group-hover:scale-110 transition border border-teal-200">
                <Wind className="w-5 h-5" />
              </div>
            </div>

            <div className="my-4">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold font-mono text-teal-700 tracking-tight">
                  {selectedStation?.wind_speed ?? 0}
                  <span className="text-lg font-normal text-slate-500 ml-1">km/h</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-sans flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-slate-400" />
                <span>10-meter surface anemometer</span>
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1 text-teal-600 font-medium">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Wind Flow Analysis</span>
              </span>
              <span className="font-mono text-slate-400 text-[10px]">Open-Meteo</span>
            </div>
          </div>

          {/* Humidity & Pressure Card */}
          <div
            onClick={() => setActiveModalParam('humidity')}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-indigo-400 hover:shadow-md cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Humidity & Pressure</span>
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-110 transition border border-indigo-200">
                <Droplets className="w-5 h-5" />
              </div>
            </div>

            <div className="my-4">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold font-mono text-indigo-700 tracking-tight">
                  {selectedStation?.humidity ?? 60}%
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  / {selectedStation?.pressure ?? 1008} hPa
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-sans flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-slate-400" />
                <span>Saturation: {(selectedStation?.humidity ?? 0) > 75 ? 'Elevated' : 'Moderate'}</span>
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1 text-indigo-600 font-medium">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Moisture Saturation</span>
              </span>
              <span className="font-mono text-slate-400 text-[10px]">Open-Meteo</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: TOP METEOROLOGICAL RANKINGS */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            <h3 className="font-bold text-sm text-slate-900 tracking-tight">
              Live Meteorological Rankings & National Extremes
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-sans">
            Computed dynamically from 15 monitored nodes
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Top 5 Hottest */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold uppercase tracking-wide text-orange-700 flex items-center gap-1 mb-2">
              <Thermometer className="w-3.5 h-3.5" />
              <span>Top 5 Hottest Locations</span>
            </span>
            <div className="space-y-1.5">
              {topHottest.map((st, i) => (
                <div
                  key={st.id}
                  onClick={() => setSelectedStationId(st.id)}
                  className={`p-1.5 rounded-lg flex items-center justify-between text-xs cursor-pointer transition ${
                    selectedStation?.id === st.id ? 'bg-orange-100 text-orange-950 font-bold' : 'hover:bg-white'
                  }`}
                >
                  <span className="text-slate-700">{i + 1}. {st.name}</span>
                  <span className="font-mono font-bold text-orange-600">{st.temperature}°C</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top 5 Coldest */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold uppercase tracking-wide text-blue-700 flex items-center gap-1 mb-2">
              <Thermometer className="w-3.5 h-3.5" />
              <span>Top 5 Coldest Locations</span>
            </span>
            <div className="space-y-1.5">
              {topColdest.map((st, i) => (
                <div
                  key={st.id}
                  onClick={() => setSelectedStationId(st.id)}
                  className={`p-1.5 rounded-lg flex items-center justify-between text-xs cursor-pointer transition ${
                    selectedStation?.id === st.id ? 'bg-blue-100 text-blue-950 font-bold' : 'hover:bg-white'
                  }`}
                >
                  <span className="text-slate-700">{i + 1}. {st.name}</span>
                  <span className="font-mono font-bold text-blue-600">{st.temperature}°C</span>
                </div>
              ))}
            </div>
          </div>

          {/* Strongest Wind */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold uppercase tracking-wide text-teal-700 flex items-center gap-1 mb-2">
              <Wind className="w-3.5 h-3.5" />
              <span>Strongest Wind Speeds</span>
            </span>
            <div className="space-y-1.5">
              {topWind.map((st, i) => (
                <div
                  key={st.id}
                  onClick={() => setSelectedStationId(st.id)}
                  className={`p-1.5 rounded-lg flex items-center justify-between text-xs cursor-pointer transition ${
                    selectedStation?.id === st.id ? 'bg-teal-100 text-teal-950 font-bold' : 'hover:bg-white'
                  }`}
                >
                  <span className="text-slate-700">{i + 1}. {st.name}</span>
                  <span className="font-mono font-bold text-teal-700">{st.wind_speed ?? 0} kph</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rainfall / Moisture Leader */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold uppercase tracking-wide text-indigo-700 flex items-center gap-1 mb-2">
              <CloudRain className="w-3.5 h-3.5" />
              <span>Precipitation / Rain Leaders</span>
            </span>
            <div className="space-y-1.5">
              {topRain.map((st, i) => (
                <div
                  key={st.id}
                  onClick={() => setSelectedStationId(st.id)}
                  className={`p-1.5 rounded-lg flex items-center justify-between text-xs cursor-pointer transition ${
                    selectedStation?.id === st.id ? 'bg-indigo-100 text-indigo-950 font-bold' : 'hover:bg-white'
                  }`}
                >
                  <span className="text-slate-700">{i + 1}. {st.name}</span>
                  <span className="font-mono font-bold text-indigo-600">{(st.rainfall ?? 0).toFixed(1)} mm</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: ATMOSPHERIC FORECAST ENGINE (24-HOUR & 5-DAY OUTLOOK) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900 tracking-tight">
              Atmospheric Forecast Engine (24-Hour & 5-Day Outlook)
            </h3>
            <span className="text-xs text-slate-500">
              — Next 24 hours hourly curve & 5-day forecast for {selectedStation?.name}
            </span>
          </div>
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('weather')}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg border border-blue-200 transition"
            >
              <span>Explore Multi-Layer WINDS Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <WeatherForecastStrip
          station={selectedStation}
          onOpenDeepDive={(p) => setActiveModalParam(p)}
        />
      </div>

      {/* AI Network Briefing */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-start gap-3.5 shadow-xs">
        <div className="p-2 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-200 shrink-0 mt-0.5">
          <BrainCircuit className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs uppercase tracking-wide text-slate-800">
              AI NETWORK BRIEF (REAL-TIME WEATHER SYNTHESIS)
            </h4>
            <span className="text-[11px] font-sans text-slate-500">Open-Meteo Dataset</span>
          </div>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed font-sans">
            {aiBrief}
          </p>
        </div>
      </div>

      {/* Main Grid: Interactive Map (Left) + Focused Location & Stream Envelope (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live India Map (7 cols) */}
        <div className="lg:col-span-7 flex flex-col h-[520px] rounded-xl bg-white p-3 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between px-2 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-600 animate-pulse"></span>
              <h3 className="font-bold text-sm text-slate-900">Geospatial AWS Grid Telemetry</h3>
            </div>
            <button
              onClick={() => onNavigateTab('live-network')}
              className="text-xs text-cyan-700 hover:text-cyan-800 font-semibold flex items-center gap-1 transition"
            >
              <span>Full Network View</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 w-full rounded-lg overflow-hidden border border-slate-200">
            <IndiaMap
              stations={stations}
              selectedStationId={selectedStationId}
              parameter={mapParameter}
              onParameterChange={(p) => setMapParameter(p)}
              onSelectStation={(id) => setSelectedStationId(id)}
              onOpenAnomalyModal={(stId) => {
                const ano = anomalies.find(a => a.station_id === stId);
                if (ano) onInvestigateAnomaly(ano);
              }}
            />
          </div>
        </div>

        {/* Right Column: Focused Station Detail & Chart (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          {/* Focused Location Card */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[10px] font-sans font-semibold text-slate-400 uppercase tracking-wider">
                  Focused Location
                </span>
                <h3 className="font-bold text-base text-slate-900">{selectedStation?.name}</h3>
                <p className="text-[11px] text-slate-500 font-sans">
                  {selectedStation?.state} • {selectedStation?.region} Region ({selectedStation?.lat.toFixed(2)}°N, {selectedStation?.lon.toFixed(2)}°E)
                </p>
              </div>

              <button
                onClick={() => onSelectStation(selectedStation?.id)}
                className="px-3 py-1.5 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-300 text-xs font-semibold flex items-center gap-1 transition shadow-2xs"
              >
                <span>Details</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick 4 Parameters from Open-Meteo */}
            <div className="grid grid-cols-4 gap-1.5 text-center font-mono">
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[9px] text-slate-500 uppercase">Temp</span>
                <p className={`text-sm font-bold ${isSelectedCritical ? 'text-red-600' : 'text-slate-900'}`}>
                  {selectedStation?.temperature ?? 'N/A'}°C
                </p>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[9px] text-slate-500 uppercase">Rain</span>
                <p className="text-sm font-bold text-blue-600">
                  {selectedStation?.rainfall ?? 0} mm
                </p>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[9px] text-slate-500 uppercase">Wind</span>
                <p className="text-sm font-bold text-teal-700">
                  {selectedStation?.wind_speed ?? 0} kph
                </p>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[9px] text-slate-500 uppercase">Humidity</span>
                <p className="text-sm font-bold text-indigo-700">
                  {selectedStation?.humidity ?? 'N/A'}%
                </p>
              </div>
            </div>
          </div>

          {/* Temperature Telemetry Stream Chart */}
          <div className="h-[210px]">
            <TelemetryChart
              title={`Temperature Stream (${selectedStation?.name})`}
              parameter="Temperature"
              unit="°C"
              data={tempChartData}
              currentValue={selectedStation?.temperature ?? 28.0}
              expectedValue={isSelectedCritical ? 55.0 : nationalAvgTemp}
              normalRange={[15, 45]}
              color="#0284C7"
              anomalyDetected={isSelectedCritical}
            />
          </div>

          {/* Current Alerts / Anomaly Feed */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-xs uppercase text-slate-800 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>Active Alerts & Triage ({anomalies.length})</span>
              </h4>
              <button
                onClick={() => onNavigateTab('anomalies')}
                className="text-[11px] font-semibold text-cyan-700 hover:text-cyan-800 transition"
              >
                Manage All
              </button>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[140px] pr-1">
              {anomalies.length === 0 ? (
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-center flex items-center justify-center gap-2.5 text-xs text-emerald-800 font-sans">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>All 15 monitored locations are currently within normal meteorological limits.</span>
                </div>
              ) : (
                anomalies.slice(0, 3).map((ano) => (
                  <div
                    key={ano.id}
                    onClick={() => onInvestigateAnomaly(ano)}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-cyan-400 cursor-pointer transition flex items-center justify-between shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2 h-2 rounded-full ${ano.severity === 'CRITICAL' ? 'bg-red-500 animate-ping' : 'bg-amber-500'}`}></span>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{ano.station_name}</p>
                        <p className="text-[11px] font-sans text-slate-600">
                          {ano.parameter}: <span className="text-red-600 font-bold">{ano.observed_value}</span> (Expected: {ano.expected_value})
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        ano.severity === 'CRITICAL' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {ano.severity}
                      </span>
                      <span className="block text-[9px] text-slate-400 font-mono mt-0.5">{ano.timestamp}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: QUICK ACTIONS BAR */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-sans text-slate-600">
          <Sparkles className="w-4 h-4 text-cyan-600" />
          <span className="font-semibold text-slate-800">Quick Navigation:</span>
          <span>Explore deep telemetry, automated maintenance, or run simulation scenarios.</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigateTab('live-network')}
            className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
          >
            Full Network Directory
          </button>
          <button
            onClick={() => onNavigateTab('anomalies')}
            className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
          >
            Anomaly Triage
          </button>
          <button
            onClick={() => onNavigateTab('simulation-lab')}
            className="px-3.5 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 text-xs font-semibold transition"
          >
            Simulation Lab
          </button>
        </div>
      </div>
    </div>
  );
};
