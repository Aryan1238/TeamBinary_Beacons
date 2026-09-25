import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Sun,
  CloudRain,
  CloudSun,
  Wind,
  Droplets,
  Gauge,
  Calendar,
  CloudLightning,
  CloudFog,
  Snowflake,
  RefreshCw,
  AlertTriangle,
  Radio,
  Satellite,
  Compass,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { PageHeader } from '../common/PageHeader';
import { ChartWrapper } from '../common/ChartWrapper';
import type { AWSStation } from '../../types/dashboard.types';
import {
  fetchLiveWeather,
  LiveWeatherData,
} from '../../services/weatherService';

interface LiveWeatherPageProps {
  stations: AWSStation[];
  selectedStationId?: string;
  onSelectStation?: (stationId: string) => void;
}

export const LiveWeatherPage: React.FC<LiveWeatherPageProps> = ({
  stations,
  selectedStationId: externalSelectedStationId,
  onSelectStation,
}) => {
  // Local station selection state fallback if not controlled externally
  const [internalStationId, setInternalStationId] = useState<string>(
    externalSelectedStationId || stations[0]?.id || 'AWS-001'
  );

  const activeStationId = externalSelectedStationId || internalStationId;
  const currentStation =
    stations.find((s) => s.id === activeStationId) || stations[0];

  const [weatherData, setWeatherData] = useState<LiveWeatherData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleStationChange = (newStationId: string) => {
    setInternalStationId(newStationId);
    if (onSelectStation) {
      onSelectStation(newStationId);
    }
  };

  /**
   * Fetches real live weather data from Open-Meteo for the current station
   */
  const loadWeatherData = useCallback(
    async (isManualRefresh = false) => {
      if (!currentStation || !currentStation.coordinates) {
        setError('Station coordinates are missing or invalid.');
        setIsLoading(false);
        return;
      }

      // Cancel previous pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        // Clear stale data immediately upon station switch as requested
        setWeatherData(null);
        setIsLoading(true);
      }
      setError(null);

      try {
        const { lat, lng } = currentStation.coordinates;
        const data = await fetchLiveWeather(lat, lng, controller.signal);
        setWeatherData(data);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          return; // Request was aborted due to station change
        }
        const errorMsg =
          err instanceof Error
            ? err.message
            : 'Unable to reach external meteorological server. Check network connection.';
        setError(errorMsg);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [currentStation]
  );

  // Automatically fetch weather when the selected station changes
  useEffect(() => {
    loadWeatherData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadWeatherData]);

  /**
   * Weather icon selector based on API category and condition
   */
  const renderWeatherIcon = (category?: string) => {
    switch (category) {
      case 'clear':
        return <Sun className="w-10 h-10 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.4)] animate-pulse" />;
      case 'rain':
        return <CloudRain className="w-10 h-10 text-sky-400 drop-shadow-[0_0_12px_rgba(56,189,248,0.4)]" />;
      case 'storm':
        return <CloudLightning className="w-10 h-10 text-indigo-400 drop-shadow-[0_0_12px_rgba(129,140,248,0.4)]" />;
      case 'snow':
        return <Snowflake className="w-10 h-10 text-sky-200 drop-shadow-[0_0_12px_rgba(186,230,253,0.4)]" />;
      case 'fog':
        return <CloudFog className="w-10 h-10 text-slate-300 drop-shadow-[0_0_12px_rgba(148,163,184,0.4)]" />;
      case 'clouds':
      default:
        return <CloudSun className="w-10 h-10 text-sky-300 drop-shadow-[0_0_12px_rgba(56,189,248,0.3)]" />;
    }
  };

  // Sensor vs External Weather Comparison Deltas
  const tempDelta =
    weatherData && currentStation
      ? Math.round((currentStation.sensors.temperature.value - weatherData.temperature) * 10) / 10
      : null;

  const humDelta =
    weatherData && currentStation
      ? Math.round(currentStation.sensors.humidity.value - weatherData.humidity)
      : null;

  const pressDelta =
    weatherData && currentStation
      ? Math.round((currentStation.sensors.pressure.value - weatherData.pressure) * 10) / 10
      : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Weather Feed & Synoptic Observations"
        subtitle={`Real-time atmospheric observations queried directly from Open-Meteo Synoptic Grid for ${currentStation.name}.`}
        badge="LIVE EXTERNAL METEOROLOGICAL API"
      />

      {/* Station Selector Bar & API Synchronizer */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <label
            htmlFor="weather-station-select"
            className="text-xs font-semibold text-slate-700 uppercase tracking-wider font-mono flex items-center gap-1.5"
          >
            <Radio className="w-3.5 h-3.5 text-sky-600" />
            Observatory Station:
          </label>
          <select
            id="weather-station-select"
            value={currentStation.id}
            onChange={(e) => handleStationChange(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-sm font-semibold text-slate-800 focus:outline-none focus:border-sky-500 shadow-xs"
          >
            {stations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id} — {s.name} ({s.state}) {s.dataSource || '[Meteostat + NOAA]'}
              </option>
            ))}
          </select>

          <span className="text-xs text-slate-500 font-mono hidden md:inline">
            Lat {currentStation.coordinates.lat.toFixed(3)}°N, Lng{' '}
            {currentStation.coordinates.lng.toFixed(3)}°E • Elev{' '}
            {currentStation.elevationMeters}m • <span className="text-sky-700 font-semibold">{currentStation.dataSource || '[Meteostat + NOAA]'}</span>
          </span>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-center">
          <button
            onClick={() => loadWeatherData(true)}
            disabled={isLoading || isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all shadow-xs active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            title="Refresh current weather data from external API"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-sky-600 ${
                isRefreshing || isLoading ? 'animate-spin' : ''
              }`}
            />
            <span>{isRefreshing ? 'Fetching API...' : 'Refresh Feed'}</span>
          </button>
        </div>
      </div>

      {/* ERROR STATE */}
      {error && !isLoading && (
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-rose-900 tracking-wide">
                  Live Weather Feed Temporarily Unavailable
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  Could not retrieve external observations for {currentStation.name} ({currentStation.coordinates.lat}°N, {currentStation.coordinates.lng}°E).
                </p>
                <div className="mt-2 text-[11px] font-mono text-rose-800 bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-200 inline-block">
                  Error Detail: {error}
                </div>
              </div>
            </div>
            <button
              onClick={() => loadWeatherData(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all shrink-0 cursor-pointer active:scale-95"
            >
              Retry Live API Connection
            </button>
          </div>
        </div>
      )}

      {/* LOADING STATE */}
      {isLoading && !weatherData && !error && (
        <div className="p-10 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
          <div className="relative flex items-center justify-center">
            <div className="w-14 h-14 rounded-full border-2 border-sky-300 border-t-sky-600 animate-spin" />
            <Satellite className="w-6 h-6 text-sky-600 absolute" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 tracking-wide">
              Querying Open-Meteo Synoptic Grid
            </h4>
            <p className="text-xs text-slate-500 mt-1 font-mono">
              Retrieving live atmospheric surface observations for {currentStation.name} (Lat {currentStation.coordinates.lat}°N, Lng {currentStation.coordinates.lng}°E)...
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-sky-600 animate-ping" />
            <span>Open Access WMO Forecast Endpoint</span>
          </div>
        </div>
      )}

      {/* LIVE WEATHER CONTENT */}
      {weatherData && (
        <>
          {/* Synoptic Weather Main Card & Indicators */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-sky-400/30 to-transparent" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-sky-700 font-mono">
                      Live Surface Observation
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      LIVE API
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">
                    {currentStation.name}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {currentStation.location}, {currentStation.state} • Lat{' '}
                    {currentStation.coordinates.lat.toFixed(3)}°N, Lng{' '}
                    {currentStation.coordinates.lng.toFixed(3)}°E
                  </p>
                </div>

                <div className="flex items-center gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                  {renderWeatherIcon(weatherData.weatherCategory)}
                  <div className="text-right">
                    <div className="text-3xl font-black font-mono text-slate-900">
                      {weatherData.temperature}°C
                    </div>
                    <div className="text-xs text-slate-500 capitalize font-medium">
                      {weatherData.weatherCondition}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Feels like {weatherData.apparentTemperature}°C
                    </div>
                  </div>
                </div>
              </div>

              {/* API Metadata & Station Elevation */}
              <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 font-mono">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-sky-600" />
                  <span>
                    API Observation Time:{' '}
                    <strong className="text-slate-900">{weatherData.timestamp}</strong>
                  </span>
                </div>
                <span className="text-slate-400 hidden sm:inline">•</span>
                <span className="text-[11px] text-slate-500">
                  Source: <strong className="text-sky-700">{weatherData.source}</strong>
                </span>
              </div>

              {/* Four Primary Weather Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                {/* Humidity */}
                <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200/80 shadow-xs">
                  <div className="flex items-center gap-1.5 text-sky-800 text-xs mb-1 font-medium">
                    <Droplets className="w-3.5 h-3.5 text-sky-600" />
                    <span>Humidity</span>
                  </div>
                  <div className="text-xl font-bold font-mono text-slate-900">
                    {weatherData.humidity}%
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Dew Point: ~{Math.round(weatherData.temperature - (100 - weatherData.humidity) / 5)}°C
                  </div>
                </div>

                {/* Pressure */}
                <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200/80 shadow-xs">
                  <div className="flex items-center gap-1.5 text-indigo-800 text-xs mb-1 font-medium">
                    <Gauge className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Pressure</span>
                  </div>
                  <div className="text-xl font-bold font-mono text-slate-900">
                    {weatherData.pressure}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">hPa (Surface QNH)</div>
                </div>

                {/* Wind Speed & Direction */}
                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 shadow-xs">
                  <div className="flex items-center gap-1.5 text-emerald-800 text-xs mb-1 font-medium">
                    <Wind className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Wind Velocity</span>
                  </div>
                  <div className="text-xl font-bold font-mono text-slate-900">
                    {weatherData.windSpeed} km/h
                  </div>
                  <div className="text-[10px] text-emerald-700 font-mono flex items-center gap-1">
                    <Compass className="w-3 h-3" />
                    <span>
                      {weatherData.windDirection}° ({weatherData.windCompass})
                    </span>
                  </div>
                </div>

                {/* Rainfall / Precipitation */}
                <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 shadow-xs">
                  <div className="flex items-center gap-1.5 text-blue-800 text-xs mb-1 font-medium">
                    <CloudRain className="w-3.5 h-3.5 text-blue-600" />
                    <span>Precipitation</span>
                  </div>
                  <div className="text-xl font-bold font-mono text-slate-900">
                    {weatherData.precipitation} mm
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {weatherData.precipitation > 0 ? 'Active Precipitation' : 'Zero Rain Ingest'}
                  </div>
                </div>
              </div>
            </div>

            {/* Atmospheric Indicators & Synoptic Status */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent" />

              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 tracking-tight">
                <Compass className="w-4 h-4 text-sky-600" />
                <span>Atmospheric Parameters</span>
              </h3>

              <div className="space-y-3 my-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-amber-600" />
                    <span className="text-xs text-slate-700">WMO Weather Code</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-amber-700">
                    WW-{weatherData.weatherCode}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wind className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs text-slate-700">Wind Direction</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-emerald-700">
                    {weatherData.windCompass} ({weatherData.windDirection}°)
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs text-slate-700">Reporting Zone</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-700">
                    {weatherData.timezone}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-800">
                <span className="font-bold block mb-0.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Live Synoptic Feed Verified
                </span>
                External weather values retrieved directly from open satellite and meteorological reanalysis grids.
              </div>
            </div>
          </div>

          {/* SIDE-BY-SIDE: Station Telemetry vs. External Weather API Comparison */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2">
                  <Radio className="w-4 h-4 text-sky-600" />
                  <span>Side-by-Side Comparison: AWS Sensor Telemetry vs. External Live Weather</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Direct ground-truth cross-referencing between onboard telemetry probe streams and independent external weather observations for {currentStation.name}.
                </p>
              </div>
              <div className="text-[11px] font-mono text-slate-500">
                Cross-Verification Grid
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Temperature Comparison */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Temperature</span>
                  {tempDelta !== null && (
                    <span
                      className={`text-[10px] font-mono font-bold flex items-center gap-0.5 ${
                        Math.abs(tempDelta) > 3.0
                          ? 'text-rose-600'
                          : Math.abs(tempDelta) > 1.5
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {tempDelta > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      Δ {Math.abs(tempDelta)}°C
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-center pt-1">
                  <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-xs">
                    <span className="text-[10px] text-slate-500 block font-mono">AWS Sensor</span>
                    <span className="text-base font-bold font-mono text-amber-700">
                      {currentStation.sensors.temperature.value}°C
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-xs">
                    <span className="text-[10px] text-slate-500 block font-mono">External API</span>
                    <span className="text-base font-bold font-mono text-sky-700">
                      {weatherData.temperature}°C
                    </span>
                  </div>
                </div>
              </div>

              {/* Humidity Comparison */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Humidity</span>
                  {humDelta !== null && (
                    <span
                      className={`text-[10px] font-mono font-bold flex items-center gap-0.5 ${
                        Math.abs(humDelta) > 15
                          ? 'text-rose-600'
                          : Math.abs(humDelta) > 8
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {humDelta > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      Δ {Math.abs(humDelta)}%
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-center pt-1">
                  <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-xs">
                    <span className="text-[10px] text-slate-500 block font-mono">AWS Sensor</span>
                    <span className="text-base font-bold font-mono text-sky-700">
                      {currentStation.sensors.humidity.value}%
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-xs">
                    <span className="text-[10px] text-slate-500 block font-mono">External API</span>
                    <span className="text-base font-bold font-mono text-sky-700">
                      {weatherData.humidity}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Pressure Comparison */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Pressure</span>
                  {pressDelta !== null && (
                    <span
                      className={`text-[10px] font-mono font-bold flex items-center gap-0.5 ${
                        Math.abs(pressDelta) > 10
                          ? 'text-rose-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {pressDelta > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      Δ {Math.abs(pressDelta)} hPa
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-center pt-1">
                  <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-xs">
                    <span className="text-[10px] text-slate-500 block font-mono">AWS Sensor</span>
                    <span className="text-base font-bold font-mono text-indigo-700">
                      {currentStation.sensors.pressure.value}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-xs">
                    <span className="text-[10px] text-slate-500 block font-mono">External API</span>
                    <span className="text-base font-bold font-mono text-indigo-700">
                      {weatherData.pressure}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rain Comparison */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Precipitation</span>
                  <span className="text-[10px] font-mono text-emerald-700 font-bold">
                    Independent Sensor
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center pt-1">
                  <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-xs">
                    <span className="text-[10px] text-slate-500 block font-mono">AWS Sensor</span>
                    <span className="text-base font-bold font-mono text-blue-700">
                      {currentStation.sensors.rainfall.value} mm
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-xs">
                    <span className="text-[10px] text-slate-500 block font-mono">External API</span>
                    <span className="text-base font-bold font-mono text-blue-700">
                      {weatherData.precipitation} mm
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 24-Hour Diurnal Trajectory Chart from Real Weather API */}
          {weatherData.hourlyForecast && weatherData.hourlyForecast.length > 0 && (
            <ChartWrapper
              title="24-Hour API Diurnal Trajectory (Temperature & Humidity)"
              subtitle={`Live meteorological trajectory computed from Open-Meteo hourly synoptic model for ${currentStation.name}.`}
              badge="EXTERNAL HOURLY FORECAST"
              height={300}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={weatherData.hourlyForecast}
                  margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis
                    yAxisId="temp"
                    stroke="#d97706"
                    fontSize={11}
                    tickLine={false}
                    unit="°C"
                    domain={['auto', 'auto']}
                  />
                  <YAxis
                    yAxisId="hum"
                    orientation="right"
                    stroke="#0284c7"
                    fontSize={11}
                    tickLine={false}
                    unit="%"
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '0.75rem',
                      color: '#0f172a',
                      fontSize: '12px',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                    }}
                  />
                  <Line
                    yAxisId="temp"
                    type="monotone"
                    dataKey="temperature"
                    stroke="#d97706"
                    strokeWidth={2.5}
                    dot={false}
                    name="API Temp (°C)"
                  />
                  <Line
                    yAxisId="hum"
                    type="monotone"
                    dataKey="humidity"
                    stroke="#0284c7"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                    name="API Humidity (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartWrapper>
          )}
        </>
      )}
    </div>
  );
};

export default LiveWeatherPage;
