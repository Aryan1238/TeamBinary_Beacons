import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { Station } from '../types';
import { Eye, ShieldAlert, Thermometer, CloudRain, Wind, Droplets } from 'lucide-react';

export type WeatherParameterType = 'temperature' | 'rainfall' | 'wind' | 'humidity';

interface IndiaMapProps {
  stations: Station[];
  onSelectStation?: (stationId: string) => void;
  onOpenAnomalyModal?: (stationId: string) => void;
  selectedStationId?: string;
  parameter?: WeatherParameterType;
  onParameterChange?: (param: WeatherParameterType) => void;
}

// Generate dynamic marker with parameter value badge and status styling
const createWeatherMarkerIcon = (
  station: Station,
  isSelected: boolean,
  parameter: WeatherParameterType = 'temperature'
) => {
  let badgeText = '';
  let pinColor = '#10B981'; // green default

  if (parameter === 'temperature') {
    const t = station.temperature ?? 25;
    badgeText = `${t}°C`;
    if (station.status === 'critical') pinColor = '#EF4444';
    else if (t >= 34) pinColor = '#DC2626'; // hot red
    else if (t >= 28) pinColor = '#EA580C'; // warm orange
    else if (t >= 23) pinColor = '#10B981'; // comfortable green
    else pinColor = '#0284C7'; // cool blue
  } else if (parameter === 'rainfall') {
    const r = station.rainfall ?? station.precipitation ?? 0;
    badgeText = `${r.toFixed(1)}mm`;
    if (r > 5) pinColor = '#4F46E5';
    else if (r > 0) pinColor = '#2563EB';
    else pinColor = '#0284C7';
  } else if (parameter === 'wind') {
    const w = station.wind_speed ?? 0;
    badgeText = `${w.toFixed(1)}kph`;
    if (w > 20) pinColor = '#EA580C';
    else if (w > 10) pinColor = '#0891B2';
    else pinColor = '#0D9488';
  } else if (parameter === 'humidity') {
    const h = station.humidity ?? 60;
    badgeText = `${Math.round(h)}%`;
    if (h > 75) pinColor = '#4338CA';
    else if (h > 50) pinColor = '#2563EB';
    else pinColor = '#0284C7';
  }

  const isCritical = station.status === 'critical';
  const borderClass = isSelected ? 'border-2 border-slate-900 shadow-lg scale-110' : 'border border-white/80 shadow-md';

  return L.divIcon({
    className: 'custom-weather-pin',
    html: `
      <div style="position: relative; display: inline-flex; flex-direction: column; align-items: center; pointer-events: auto;">
        ${isCritical ? `<span style="position: absolute; width: 34px; height: 34px; top: -2px; border-radius: 50%; background: #EF4444; opacity: 0.5;" class="animate-ping"></span>` : ''}
        <div style="background-color: ${pinColor};" class="text-[10px] font-mono font-bold text-white px-1.5 py-0.5 rounded-full shadow-sm whitespace-nowrap flex items-center gap-1 ${borderClass}">
          <span>${badgeText}</span>
        </div>
        <div style="width: 2px; height: 6px; background-color: ${pinColor}; margin-top: 1px;"></div>
        <div style="width: 5px; height: 5px; border-radius: 50%; background-color: ${pinColor};"></div>
      </div>
    `,
    iconSize: [48, 30],
    iconAnchor: [24, 28],
    popupAnchor: [0, -28]
  });
};

export const IndiaMap: React.FC<IndiaMapProps> = ({
  stations,
  onSelectStation,
  onOpenAnomalyModal,
  selectedStationId,
  parameter: propParameter,
  onParameterChange
}) => {
  const [internalParam, setInternalParam] = useState<WeatherParameterType>('temperature');
  const activeParam = propParameter || internalParam;

  const handleParamChange = (p: WeatherParameterType) => {
    setInternalParam(p);
    if (onParameterChange) onParameterChange(p);
  };

  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [mapMode, setMapMode] = useState<'pins' | 'heatmap'>('pins');

  const filteredStations = stations.filter(s => {
    if (filterStatus === 'All') return true;
    return s.status === filterStatus.toLowerCase();
  });

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-inner font-sans">
      {/* Parameter Selector & Map Controls Bar */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-wrap items-center gap-2 bg-white/95 backdrop-blur-md p-1.5 rounded-xl border border-slate-200 shadow-sm">
        {/* Parameter Selector */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <button
            onClick={() => handleParamChange('temperature')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition flex items-center gap-1 ${
              activeParam === 'temperature'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5" />
            <span>Temp</span>
          </button>
          <button
            onClick={() => handleParamChange('rainfall')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition flex items-center gap-1 ${
              activeParam === 'rainfall'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5" />
            <span>Rain</span>
          </button>
          <button
            onClick={() => handleParamChange('wind')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition flex items-center gap-1 ${
              activeParam === 'wind'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>Wind</span>
          </button>
          <button
            onClick={() => handleParamChange('humidity')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition flex items-center gap-1 ${
              activeParam === 'humidity'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>Humidity</span>
          </button>
        </div>

        {/* View Mode */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setMapMode('pins')}
            className={`px-2 py-1 rounded text-[11px] font-medium transition ${
              mapMode === 'pins' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pins
          </button>
          <button
            onClick={() => setMapMode('heatmap')}
            className={`px-2 py-1 rounded text-[11px] font-medium transition ${
              mapMode === 'heatmap' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Atmosphere Rings
          </button>
        </div>

        {/* Status Filter */}
        <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
          {(['All', 'Healthy', 'Warning', 'Critical'] as const).map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                filterStatus === st ? 'bg-cyan-700 text-white font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Layer Guide / Legend on Top Right */}
      <div className="absolute top-3 right-3 z-[1000] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs hidden sm:flex items-center gap-3 text-[11px] font-sans text-slate-700">
        <span className="font-semibold text-slate-800 uppercase tracking-wide text-[10px]">
          {activeParam} Layer
        </span>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-600"></span>
          <span>Open-Meteo Feed</span>
        </div>
      </div>

      {/* Leaflet Map */}
      <MapContainer
        center={[21.5, 80.0]}
        zoom={4.7}
        minZoom={4}
        maxZoom={10}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {/* Parameter-Scaled Radii */}
        {mapMode === 'heatmap' && filteredStations.map(st => {
          let circleColor = '#0284C7';
          let circleRadius = 70000;

          if (activeParam === 'temperature') {
            const t = st.temperature ?? 25;
            circleRadius = Math.max(50000, t * 3000);
            circleColor = t >= 32 ? '#DC2626' : (t >= 26 ? '#EA580C' : '#0284C7');
          } else if (activeParam === 'rainfall') {
            const r = st.rainfall ?? st.precipitation ?? 0;
            circleRadius = Math.max(40000, r * 15000 + 40000);
            circleColor = r > 0 ? '#4F46E5' : '#0284C7';
          } else if (activeParam === 'wind') {
            const w = st.wind_speed ?? 5;
            circleRadius = Math.max(45000, w * 4000);
            circleColor = w > 15 ? '#EA580C' : '#0D9488';
          } else if (activeParam === 'humidity') {
            const h = st.humidity ?? 50;
            circleRadius = Math.max(40000, h * 1200);
            circleColor = h > 70 ? '#312E81' : '#0284C7';
          }

          if (st.status === 'critical') {
            circleColor = '#EF4444';
            circleRadius = 120000;
          }

          return (
            <Circle
              key={`circle-${st.id}`}
              center={[st.lat, st.lon]}
              radius={circleRadius}
              pathOptions={{
                fillColor: circleColor,
                fillOpacity: 0.18,
                color: circleColor,
                weight: 1
              }}
            />
          );
        })}

        {/* Station Markers */}
        {filteredStations.map(st => (
          <Marker
            key={st.id}
            position={[st.lat, st.lon]}
            icon={createWeatherMarkerIcon(st, st.id === selectedStationId, activeParam)}
          >
            <Popup className="custom-station-popup">
              <div className="p-1 min-w-[260px] text-slate-800 font-sans">
                {/* Popup Header */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{st.name}</h4>
                    <p className="text-[11px] text-slate-500">
                      {st.state} • Elev: {st.elevation}m ({st.lat.toFixed(2)}°N, {st.lon.toFixed(2)}°E)
                    </p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase font-bold ${
                    st.status === 'critical'
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : (st.status === 'warning'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200')
                  }`}>
                    {st.weather_condition || (st.status === 'healthy' ? 'NORMAL' : st.status)}
                  </span>
                </div>

                {/* 5-parameter grid */}
                <div className="grid grid-cols-4 gap-1 text-center mb-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <div className="p-0.5">
                    <p className="text-[9px] text-slate-500 uppercase font-mono">Temp</p>
                    <p className="text-xs font-mono font-bold text-slate-900">{st.temperature}°C</p>
                  </div>
                  <div className="p-0.5 border-l border-slate-200">
                    <p className="text-[9px] text-slate-500 uppercase font-mono">Rain</p>
                    <p className="text-xs font-mono font-bold text-blue-600">{st.rainfall ?? 0} mm</p>
                  </div>
                  <div className="p-0.5 border-l border-slate-200">
                    <p className="text-[9px] text-slate-500 uppercase font-mono">Wind</p>
                    <p className="text-xs font-mono font-bold text-teal-700">{st.wind_speed ?? 0} kph</p>
                  </div>
                  <div className="p-0.5 border-l border-slate-200">
                    <p className="text-[9px] text-slate-500 uppercase font-mono">Humidity</p>
                    <p className="text-xs font-mono font-bold text-indigo-700">{st.humidity}%</p>
                  </div>
                </div>

                {/* Pressure & Source */}
                <div className="flex items-center justify-between text-[10px] text-slate-500 mb-2 px-1">
                  <span>Pressure: <strong className="text-slate-700 font-mono">{st.pressure} hPa</strong></span>
                  <span className="font-mono text-slate-600">{st.last_update}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 pt-1">
                  {onSelectStation && (
                    <button
                      onClick={() => onSelectStation(st.id)}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-[11px] font-semibold flex items-center justify-center gap-1 transition shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Full Details</span>
                    </button>
                  )}
                  {st.status !== 'healthy' && onOpenAnomalyModal && (
                    <button
                      onClick={() => onOpenAnomalyModal(st.id)}
                      className="py-1.5 px-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-semibold flex items-center justify-center gap-1 transition shadow-xs"
                      title="Inspect Anomaly"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Investigate</span>
                    </button>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
