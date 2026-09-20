import React, { useState, useMemo } from 'react';
import {
  Radio,
  Search,
  MapPin,
  Globe2,
  ShieldCheck,
  AlertTriangle,
  Flame,
  ArrowRight,
  Eye,
  Sliders,
  Building2,
  CheckCircle2,
  Wind,
  Thermometer,
  CloudRain,
  Droplets,
  Gauge,
  TrendingUp,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';
import { Station, AnomalyRecord } from '../types';
import { IndiaMap, WeatherParameterType } from '../components/IndiaMap';

interface LiveNetworkPageProps {
  stations: Station[];
  anomalies: AnomalyRecord[];
  onSelectStation: (id: string) => void;
  onInvestigateAnomaly: (anomaly: AnomalyRecord) => void;
}

export const LiveNetworkPage: React.FC<LiveNetworkPageProps> = ({
  stations,
  anomalies,
  onSelectStation,
  onInvestigateAnomaly
}) => {
  const [viewMode, setViewMode] = useState<'map' | 'cards' | 'grid'>('map');
  const [regionFilter, setRegionFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeParameter, setActiveParameter] = useState<WeatherParameterType>('temperature');

  // Currently focused station on map / details
  const [focusedStationId, setFocusedStationId] = useState<string>(
    stations.find(s => s.name === "Pune")?.id || stations[0]?.id || ''
  );

  const regions = ['All', 'Western', 'Northern', 'Southern', 'Eastern', 'Central', 'North-Eastern'];

  const filteredStations = useMemo(() => {
    return stations.filter(s => {
      const matchesRegion = regionFilter === 'All' || s.region === regionFilter;
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            s.state.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesRegion && matchesSearch;
    });
  }, [stations, regionFilter, searchTerm]);

  const focusedStation = stations.find(s => s.id === focusedStationId) || filteredStations[0] || stations[0];

  // Dynamic Top Hottest and Coldest from filtered stations
  const topHottest = useMemo(() => {
    return [...filteredStations].sort((a, b) => (b.temperature ?? -99) - (a.temperature ?? -99)).slice(0, 5);
  }, [filteredStations]);

  const topColdest = useMemo(() => {
    return [...filteredStations].sort((a, b) => (a.temperature ?? 999) - (b.temperature ?? 999)).slice(0, 5);
  }, [filteredStations]);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Live National AWS Weather Grid
            </h1>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-300 font-semibold">
              {filteredStations.length} OF {stations.length} NODES DISPLAYED
            </span>
          </div>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Real-time multi-layer atmospheric observation across India • Open-Meteo Weather API
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs font-sans shadow-xs">
          <button
            onClick={() => setViewMode('map')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              viewMode === 'map' ? 'bg-cyan-600 text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>Map View</span>
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              viewMode === 'cards' ? 'bg-cyan-600 text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Cards</span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              viewMode === 'grid' ? 'bg-cyan-600 text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Table</span>
          </button>
        </div>
      </div>

      {/* Weather Parameter Selector & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Parameter Pills */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:inline">
              Parameter:
            </span>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setActiveParameter('temperature')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  activeParameter === 'temperature'
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Thermometer className="w-3.5 h-3.5" />
                <span>Temperature (°C)</span>
              </button>
              <button
                onClick={() => setActiveParameter('rainfall')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  activeParameter === 'rainfall'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CloudRain className="w-3.5 h-3.5" />
                <span>Rainfall (mm)</span>
              </button>
              <button
                onClick={() => setActiveParameter('wind')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  activeParameter === 'wind'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Wind className="w-3.5 h-3.5" />
                <span>Wind (km/h)</span>
              </button>
              <button
                onClick={() => setActiveParameter('humidity')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  activeParameter === 'humidity'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Droplets className="w-3.5 h-3.5" />
                <span>Humidity (%)</span>
              </button>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by city, state, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-cyan-500 focus:bg-white transition"
            />
          </div>
        </div>

        {/* Region Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-slate-100">
          <span className="text-xs text-slate-400 mr-1 hidden sm:inline">Regions:</span>
          {regions.map(reg => (
            <button
              key={reg}
              onClick={() => setRegionFilter(reg)}
              className={`px-3 py-1 rounded-full text-xs font-sans transition whitespace-nowrap ${
                regionFilter === reg
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {reg}
            </button>
          ))}
        </div>
      </div>

      {/* MAP VIEW */}
      {viewMode === 'map' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Map (8 cols) */}
            <div className="lg:col-span-8 flex flex-col h-[580px] rounded-2xl bg-white p-3 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between px-2 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-600 animate-pulse"></span>
                  <h3 className="font-bold text-sm text-slate-900">
                    Live Pan-India Geospatial Telemetry ({activeParameter.toUpperCase()} LAYER)
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-slate-500">
                  Click any marker for station dossier
                </span>
              </div>

              <div className="flex-1 w-full rounded-xl overflow-hidden border border-slate-200">
                <IndiaMap
                  stations={filteredStations}
                  selectedStationId={focusedStationId}
                  parameter={activeParameter}
                  onParameterChange={(p) => setActiveParameter(p)}
                  onSelectStation={(id) => setFocusedStationId(id)}
                  onOpenAnomalyModal={(stId) => {
                    const ano = anomalies.find(a => a.station_id === stId);
                    if (ano) onInvestigateAnomaly(ano);
                  }}
                />
              </div>
            </div>

            {/* Selected Location & Rankings (4 cols) */}
            <div className="lg:col-span-4 flex flex-col space-y-4">
              {/* Focused Station Detail Card */}
              {focusedStation && (
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-cyan-700 uppercase font-semibold">
                        Focused Weather Station
                      </span>
                      <h3 className="text-xl font-bold text-slate-900 mt-0.5">{focusedStation.name}</h3>
                      <p className="text-xs text-slate-500 font-sans">
                        {focusedStation.state} • Elev: {focusedStation.elevation}m ({focusedStation.lat.toFixed(2)}°N, {focusedStation.lon.toFixed(2)}°E)
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-800 border border-cyan-200">
                      {focusedStation.weather_condition || 'Clear Sky'}
                    </span>
                  </div>

                  {/* 5-parameter grid */}
                  <div className="grid grid-cols-2 gap-2 text-center font-mono">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 uppercase block">Temperature</span>
                      <span className="text-lg font-bold text-orange-600">{focusedStation.temperature}°C</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 uppercase block">Rainfall</span>
                      <span className="text-lg font-bold text-blue-600">{(focusedStation.rainfall ?? 0).toFixed(1)} mm</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 uppercase block">Wind Velocity</span>
                      <span className="text-lg font-bold text-teal-700">{focusedStation.wind_speed ?? 0} kph</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 uppercase block">Relative Humidity</span>
                      <span className="text-lg font-bold text-indigo-700">{focusedStation.humidity}%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <span>Pressure: <strong className="text-slate-800 font-mono">{focusedStation.pressure} hPa</strong></span>
                    <span className="font-mono text-slate-600">{focusedStation.last_update}</span>
                  </div>

                  <button
                    onClick={() => onSelectStation(focusedStation.id)}
                    className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xs"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Complete Station Telemetry</span>
                  </button>
                </div>
              )}

              {/* Dynamic Rankings */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase text-slate-800 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-orange-500" />
                    <span>Top Hottest & Coldest</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">Live API</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Top Hottest */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-orange-700 uppercase block">Hottest</span>
                    {topHottest.slice(0, 4).map((st, i) => (
                      <div
                        key={st.id}
                        onClick={() => setFocusedStationId(st.id)}
                        className={`p-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition ${
                          focusedStation?.id === st.id ? 'bg-orange-100 font-bold text-orange-900' : 'bg-slate-50 hover:bg-slate-100'
                        }`}
                      >
                        <span className="truncate max-w-[80px] text-slate-700">{st.name}</span>
                        <span className="font-mono font-bold text-orange-600">{st.temperature}°</span>
                      </div>
                    ))}
                  </div>

                  {/* Top Coldest */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-blue-700 uppercase block">Coldest</span>
                    {topColdest.slice(0, 4).map((st, i) => (
                      <div
                        key={st.id}
                        onClick={() => setFocusedStationId(st.id)}
                        className={`p-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition ${
                          focusedStation?.id === st.id ? 'bg-blue-100 font-bold text-blue-900' : 'bg-slate-50 hover:bg-slate-100'
                        }`}
                      >
                        <span className="truncate max-w-[80px] text-slate-700">{st.name}</span>
                        <span className="font-mono font-bold text-blue-600">{st.temperature}°</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CARDS VIEW */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStations.map(station => (
            <div
              key={station.id}
              onClick={() => onSelectStation(station.id)}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-cyan-400 hover:shadow-md cursor-pointer transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">{station.name}</h3>
                    <p className="text-xs text-slate-500">{station.state} • {station.region}</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                    {station.weather_condition || 'Normal'}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1 text-center font-mono my-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase block">Temp</span>
                    <span className="text-sm font-bold text-slate-900">{station.temperature}°C</span>
                  </div>
                  <div className="border-l border-slate-200">
                    <span className="text-[9px] text-slate-500 uppercase block">Rain</span>
                    <span className="text-sm font-bold text-blue-600">{station.rainfall ?? 0} mm</span>
                  </div>
                  <div className="border-l border-slate-200">
                    <span className="text-[9px] text-slate-500 uppercase block">Wind</span>
                    <span className="text-sm font-bold text-teal-700">{station.wind_speed ?? 0} kph</span>
                  </div>
                  <div className="border-l border-slate-200">
                    <span className="text-[9px] text-slate-500 uppercase block">Humidity</span>
                    <span className="text-sm font-bold text-indigo-700">{station.humidity}%</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span>Pressure: {station.pressure} hPa</span>
                <span className="text-cyan-700 font-semibold flex items-center gap-1">
                  <span>Explore</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TABLE VIEW */}
      {viewMode === 'grid' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3">Station</th>
                  <th className="p-3">State / Region</th>
                  <th className="p-3">Condition</th>
                  <th className="p-3">Temperature</th>
                  <th className="p-3">Precipitation</th>
                  <th className="p-3">Wind</th>
                  <th className="p-3">Humidity</th>
                  <th className="p-3">Pressure</th>
                  <th className="p-3">Updated</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStations.map(st => (
                  <tr key={st.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-bold text-slate-900">{st.name}</td>
                    <td className="p-3 text-slate-600">{st.state} ({st.region})</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 font-medium">
                        {st.weather_condition || 'Clear Sky'}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-900">{st.temperature}°C</td>
                    <td className="p-3 font-mono text-blue-600 font-semibold">{st.rainfall ?? 0} mm</td>
                    <td className="p-3 font-mono text-teal-700">{st.wind_speed ?? 0} km/h</td>
                    <td className="p-3 font-mono text-indigo-700">{st.humidity}%</td>
                    <td className="p-3 font-mono text-slate-700">{st.pressure} hPa</td>
                    <td className="p-3 font-mono text-slate-500 text-[10px]">{st.last_update}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => onSelectStation(st.id)}
                        className="px-2.5 py-1 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-800 text-[11px] font-semibold transition"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
