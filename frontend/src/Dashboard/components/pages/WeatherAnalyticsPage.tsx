import React, { useState, useEffect } from 'react';
import {
  Layers,
  Radio,
  Clock,
  Calendar,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  CheckCircle2,
  Info,
  ShieldAlert,
  Compass,
  ArrowRight,
  RefreshCw,
  BarChart3,
  Thermometer,
  Droplets,
  Gauge,
  Wind,
  CloudRain,
  Share2,
  Sliders,
  ChevronRight,
  Sun,
  CloudSun,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  BarChart,
  ScatterChart,
  Scatter,
  Line,
  Bar,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { PageHeader } from '../common/PageHeader';
import { ChartWrapper } from '../common/ChartWrapper';
import type {
  AWSStation,
  DashboardTab,
  WeatherAnalyticsResponse,
  WeatherCorrelationResponse,
  WeatherStationCompareResponse,
} from '../../types/dashboard.types';

interface WeatherAnalyticsPageProps {
  stations: AWSStation[];
  onNavigateTab?: (tab: DashboardTab) => void;
}

type TimeRangeOption = '24h' | '7d' | '30d' | '90d' | 'custom';
type SensorKey = 'temperature' | 'humidity' | 'pressure' | 'wind_speed' | 'precipitation';

// Distinct palette for multi-station comparison
const STATION_COLORS: Record<string, string> = {
  'AWS-001': '#38bdf8', // Chennai: Sky
  'AWS-002': '#2563eb', // Bengaluru: Royal Blue
  'AWS-003': '#f43f5e', // Pune: Rose
  'AWS-004': '#34d399', // Mumbai: Emerald
  'AWS-005': '#fbbf24', // Kolkata: Amber
  'AWS-006': '#f97316', // Ahmedabad: Orange
  'AWS-007': '#0d9488', // Hyderabad: Teal
};

export const WeatherAnalyticsPage: React.FC<WeatherAnalyticsPageProps> = ({
  stations,
  onNavigateTab,
}) => {
  const [selectedStationId, setSelectedStationId] = useState<string>('AWS-003'); // Default: Pune
  const [selectedSensor, setSelectedSensor] = useState<SensorKey>('temperature');
  const [timeRange, setTimeRange] = useState<TimeRangeOption>('30d');
  const [source, setSource] = useState<'Meteostat' | 'NOAA'>('Meteostat');
  const [startDate, setStartDate] = useState<string>('2025-11-01');
  const [endDate, setEndDate] = useState<string>('2025-12-31');

  // Multi-station compare
  const [compareStations, setCompareStations] = useState<boolean>(false);
  const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>(['AWS-003', 'AWS-004']);
  const [compareData, setCompareData] = useState<WeatherStationCompareResponse | null>(null);

  // Active correlation pair
  const [selectedCorrPair, setSelectedCorrPair] = useState<string>('temp_vs_humidity');

  // Main state
  const [analyticsData, setAnalyticsData] = useState<WeatherAnalyticsResponse | null>(null);
  const [correlationData, setCorrelationData] = useState<WeatherCorrelationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const selectedStation = stations.find((s) => s.id === selectedStationId) || stations[0];
  const maxValidDate = source === 'NOAA' ? '2025-08-24' : '2025-12-31';

  const handleSourceChange = (newSource: 'Meteostat' | 'NOAA') => {
    setSource(newSource);
    if (newSource === 'NOAA') {
      if (endDate > '2025-08-24' || startDate > '2025-08-24') {
        setStartDate('2025-07-25');
        setEndDate('2025-08-24');
      }
    } else {
      if (endDate === '2025-08-24') {
        setStartDate('2025-11-01');
        setEndDate('2025-12-31');
      }
    }
  };

  const toggleCompareStation = (stId: string) => {
    if (selectedCompareIds.includes(stId)) {
      if (selectedCompareIds.length > 2) {
        setSelectedCompareIds(selectedCompareIds.filter((id) => id !== stId));
      }
    } else {
      setSelectedCompareIds([...selectedCompareIds, stId]);
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `http://127.0.0.1:8000/api/analytics/weather?station_id=${selectedStationId}&sensor=${selectedSensor}&time_range=${timeRange}&source=${source}`;
      let corrUrl = `http://127.0.0.1:8000/api/analytics/correlations?station_id=${selectedStationId}&time_range=${timeRange}&source=${source}`;
      if (timeRange === 'custom') {
        url += `&start_date=${startDate}&end_date=${endDate}`;
        corrUrl += `&start_date=${startDate}&end_date=${endDate}`;
      }

      const [res, cRes] = await Promise.all([fetch(url), fetch(corrUrl)]);
      if (!res.ok) throw new Error(`Analytics HTTP ${res.status}`);
      const data: WeatherAnalyticsResponse = await res.json();
      setAnalyticsData(data);

      if (cRes.ok) {
        const cData: WeatherCorrelationResponse = await cRes.json();
        setCorrelationData(cData);
      }

      if (compareStations && selectedCompareIds.length >= 2) {
        const compRes = await fetch('http://127.0.0.1:8000/api/analytics/compare', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            station_ids: selectedCompareIds,
            sensor: selectedSensor,
            time_range: timeRange,
            source: source,
            start_date: timeRange === 'custom' ? startDate : undefined,
            end_date: timeRange === 'custom' ? endDate : undefined,
          }),
        });
        if (compRes.ok) {
          const compData: WeatherStationCompareResponse = await compRes.json();
          setCompareData(compData);
        }
      } else {
        setCompareData(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch weather analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedStationId, selectedSensor, timeRange, source, startDate, endDate, compareStations, selectedCompareIds]);

  const k = analyticsData?.kpis;
  const t = analyticsData?.trend;
  const d = analyticsData?.distribution;
  const diurnal = analyticsData?.diurnal_pattern;
  const monthly = analyticsData?.monthly_pattern;
  const precip = analyticsData?.precipitation_analytics;
  const liveContext = analyticsData?.live_vs_historical;
  const insights = analyticsData?.insights || [];
  const dq = analyticsData?.data_quality;

  const currentCorr = correlationData?.correlations?.[selectedCorrPair];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Weather Analytics & Climatological Intelligence"
        subtitle="Empirical patterns, diurnal profiles, multi-station comparisons, and cross-variable correlations from the verified historical archive."
        badge="WEATHER ANALYTICS"
      />

      {/* Anchor Reference Banner */}
      <div className="p-3.5 px-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-sky-600" />
          <span className="text-slate-600">Fixed Historical Reference Anchor:</span>
          <strong className="text-sky-800">Dec 31, 2025 23:00 IST</strong>
          <span className="text-slate-500 text-[11px]">(Latest Real Ground-Truth Timestamp)</span>
        </div>
        <div className="text-slate-500 text-[11px] flex items-center gap-3">
          <span>Preset ranges (24H/7D/30D/90D) compute backwards from anchor</span>
          <span className="text-indigo-600">• Archive: 2023–2025</span>
        </div>
      </div>

      {/* Configuration Controls Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Station Selector */}
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-sky-600" />
            <select
              value={selectedStation.id}
              onChange={(e) => setSelectedStationId(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-500 shadow-xs"
            >
              {stations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id} — {s.name} ({s.state})
                </option>
              ))}
            </select>
          </div>

          {/* Sensor / Variable Selector */}
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <select
              value={selectedSensor}
              onChange={(e) => setSelectedSensor(e.target.value as SensorKey)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 capitalize shadow-xs"
            >
              <option value="temperature">Temperature (°C)</option>
              <option value="humidity">Relative Humidity (%)</option>
              <option value="pressure">Barometric Pressure (hPa)</option>
              <option value="wind_speed">Wind Speed (m/s)</option>
              <option value="precipitation">Precipitation (mm)</option>
            </select>
          </div>

          {/* Source Selector */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => handleSourceChange('Meteostat')}
              className={`px-2.5 py-1 rounded-lg font-mono font-semibold transition-all ${
                source === 'Meteostat'
                  ? 'bg-sky-50 text-sky-700 border border-sky-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Meteostat (Continuous)
            </button>
            <button
              onClick={() => handleSourceChange('NOAA')}
              className={`px-2.5 py-1 rounded-lg font-mono font-semibold transition-all ${
                source === 'NOAA'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              NOAA Synoptic
            </button>
          </div>
        </div>

        {/* Time Span Picker & Compare Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-xl border border-slate-200 text-xs">
            {(['24h', '7d', '30d', '90d', 'custom'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-lg font-mono font-semibold uppercase transition-all ${
                  timeRange === range
                    ? 'bg-sky-50 text-sky-700 border border-sky-200 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          {/* Multi-Station Compare Switch */}
          <label className="flex items-center gap-1.5 cursor-pointer text-xs font-mono text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all">
            <input
              type="checkbox"
              checked={compareStations}
              onChange={(e) => setCompareStations(e.target.checked)}
              className="rounded border-slate-300 text-sky-600 focus:ring-0"
            />
            <span>Compare Stations</span>
          </label>
        </div>
      </div>

      {/* Custom Date Range Pickers (if custom selected) */}
      {timeRange === 'custom' && (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-sky-600" />
            <span className="text-slate-600">Start Date:</span>
            <input
              type="date"
              value={startDate}
              min="2023-01-01"
              max={maxValidDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs focus:outline-none focus:border-sky-500 shadow-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-sky-600" />
            <span className="text-slate-600">End Date:</span>
            <input
              type="date"
              value={endDate}
              min="2023-01-01"
              max={maxValidDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs focus:outline-none focus:border-sky-500 shadow-xs"
            />
          </div>
          <span className="text-slate-500 text-[11px]">Valid historical boundary: 2023-01-01 to {maxValidDate}</span>
        </div>
      )}

      {/* Graceful Degradation Warning Banner (if insufficient history) */}
      {analyticsData?.status === 'INSUFFICIENT_HISTORY' && (
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h4 className="font-bold text-sm text-amber-800">
              Graceful Degradation Notice: Insufficient Historical Coverage
            </h4>
            <p className="leading-relaxed text-amber-800">
              {analyticsData.explanation}
            </p>
            {analyticsData.degradation_reason === 'NOAA_STREAM_ENDED' && (
              <p className="text-[11px] text-amber-700 pt-1 font-mono">
                Recommendation: Switch data source to <strong>Meteostat (Continuous)</strong> for uninterrupted 3-year multi-sensor ground truth, or pick a custom date range before 2025-08-24.
              </p>
            )}
          </div>
        </div>
      )}

      {/* STEP 1: KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Temperature Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Mean Temperature</span>
            <Thermometer className="w-4 h-4 text-rose-600" />
          </div>
          <div className="my-1">
            {k?.temperature?.available ? (
              <>
                <span className="text-2xl font-bold text-slate-900 font-mono">{k.temperature.mean}°C</span>
                <p className="text-[11px] text-slate-500 font-mono mt-1">Range: {k.temperature.min}°C – {k.temperature.max}°C (Δ{k.temperature.range}°C)</p>
              </>
            ) : (
              <span className="text-sm font-semibold text-slate-400 font-mono">Data unavailable</span>
            )}
          </div>
        </div>

        {/* Humidity Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Mean Humidity</span>
            <Droplets className="w-4 h-4 text-sky-600" />
          </div>
          <div className="my-1">
            {k?.humidity?.available ? (
              <>
                <span className="text-2xl font-bold text-slate-900 font-mono">{k.humidity.mean}%</span>
                <p className="text-[11px] text-slate-500 font-mono mt-1">Range: {k.humidity.min}% – {k.humidity.max}% (Δ{k.humidity.range}%)</p>
              </>
            ) : (
              <span className="text-sm font-semibold text-slate-400 font-mono">Data unavailable</span>
            )}
          </div>
        </div>

        {/* Barometric Pressure Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Mean Pressure</span>
            <Gauge className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="my-1">
            {k?.pressure?.available ? (
              <>
                <span className="text-2xl font-bold text-slate-900 font-mono">{k.pressure.mean} hPa</span>
                <p className="text-[11px] text-slate-500 font-mono mt-1">Range: {k.pressure.min} – {k.pressure.max} hPa</p>
              </>
            ) : (
              <span className="text-sm font-semibold text-slate-400 font-mono">Data unavailable</span>
            )}
          </div>
        </div>

        {/* Wind Speed Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Mean Wind Speed</span>
            <Wind className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="my-1">
            {k?.wind_speed?.available ? (
              <>
                <span className="text-2xl font-bold text-slate-900 font-mono">{k.wind_speed.mean} m/s</span>
                <p className="text-[11px] text-slate-500 font-mono mt-1">Peak: {k.wind_speed.max} m/s (Range: {k.wind_speed.min}–{k.wind_speed.max})</p>
              </>
            ) : (
              <span className="text-sm font-semibold text-slate-400 font-mono">Data unavailable</span>
            )}
          </div>
        </div>

        {/* Precipitation Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Precipitation Total</span>
            <CloudRain className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="my-1">
            {k?.precipitation?.available ? (
              <>
                <span className="text-2xl font-bold text-slate-900 font-mono">{k.precipitation.total} mm</span>
                <p className="text-[11px] text-slate-500 font-mono mt-1">Rain: {precip?.rain_events_count || 0}h | Dry: {precip?.confirmed_dry_hours || 0}h</p>
              </>
            ) : (
              <span className="text-sm font-semibold text-slate-400 font-mono">Data unavailable</span>
            )}
          </div>
        </div>
      </div>

      {/* STEP 2: TREND CHART (SINGLE-STATION TIME SERIES) */}
      {!compareStations && (
        <ChartWrapper
          title={`Weather Patterns & Time-Series: ${selectedStation.name} (${analyticsData?.sensor_label || selectedSensor})`}
          subtitle={
            t
              ? `Period Avg: ${t.period_avg} ${analyticsData?.unit} | Period Range: [${t.period_min}, ${t.period_max}] ${analyticsData?.unit} | 3-Yr Baseline Mean: ${t.baseline_mean} ${analyticsData?.unit}`
              : 'Climatological observation stream'
          }
          badge="TEMPORAL PATTERN"
          height={380}
        >
          {(!t || t.series.length === 0) ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 rounded-xl border border-slate-200 text-center p-6 space-y-3 z-10 backdrop-blur-sm">
              <div className="p-3 rounded-full bg-amber-50 border border-amber-200">
                <AlertTriangle className="w-8 h-8 text-amber-600" />
              </div>
              <div className="space-y-1.5 max-w-md">
                <h4 className="text-sm font-bold text-slate-800">No Observations in Selected Range</h4>
                <p className="text-xs text-slate-500 font-mono leading-relaxed">
                  {analyticsData?.explanation || 'No historical data found for this range. Select Meteostat or adjust custom dates.'}
                </p>
              </div>
              {source === 'NOAA' && (
                <button
                  onClick={() => handleSourceChange('Meteostat')}
                  className="px-3 py-1.5 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 text-xs font-mono font-semibold"
                >
                  Switch to Meteostat (Continuous)
                </button>
              )}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={t.series} margin={{ top: 15, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit={` ${analyticsData?.unit || ''}`} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '0.75rem',
                    color: '#0f172a',
                    fontSize: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} iconType="circle" />

                {/* 3-Yr Baseline Mean Reference */}
                <ReferenceLine
                  y={t.baseline_mean}
                  stroke="#d97706"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: `3-Yr Baseline: ${t.baseline_mean} ${analyticsData?.unit}`,
                    fill: '#b45309',
                    fontSize: 10,
                    position: 'insideTopRight',
                  }}
                />

                {/* Period Average Reference */}
                <ReferenceLine
                  y={t.period_avg}
                  stroke="#0284c7"
                  strokeDasharray="2 2"
                  strokeWidth={1}
                  label={{
                    value: `Period Avg: ${t.period_avg}`,
                    fill: '#0369a1',
                    fontSize: 10,
                    position: 'insideBottomRight',
                  }}
                />

                {/* 24h Moving Average */}
                <Line
                  type="monotone"
                  dataKey="moving_avg_24h"
                  name="24h Moving Average"
                  stroke="#0284c7"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                  dot={false}
                />

                {/* Actual Observations */}
                <Line
                  type="monotone"
                  dataKey="value"
                  name={`${selectedStation.name} (Observed)`}
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </ChartWrapper>
      )}

      {/* STEP 3: MULTI-STATION COMPARISON VIEW */}
      {compareStations && (
        <div className="space-y-4">
          {/* Station Cohort Selector */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-sky-600" />
              <span className="text-slate-800 font-bold uppercase">Select AWS Nodes to Compare:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {stations.map((s) => {
                const isSelected = selectedCompareIds.includes(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => toggleCompareStation(s.id)}
                    className={`px-2.5 py-1 rounded-lg border transition-all text-xs flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-sky-50 text-sky-700 border-sky-200 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: STATION_COLORS[s.id] || '#64748b' }}
                    />
                    <span>{s.id} — {s.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Station Comparative KPI Cards */}
          {compareData?.station_summaries && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {compareData.station_summaries.map((st) => (
                <div
                  key={st.station_id}
                  className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between font-mono text-xs"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: STATION_COLORS[st.station_id] || '#64748b' }}
                      />
                      <span className="font-bold text-slate-900">{st.station_name}</span>
                    </div>
                    <span className="text-slate-500 text-[10px]">{st.station_id}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-600">
                      <span>Mean:</span>
                      <strong className="text-slate-900">{st.mean} {st.unit}</strong>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>Range:</span>
                      <span>{st.min} – {st.max} {st.unit}</span>
                    </div>
                    <div className="flex justify-between text-[11px] pt-1 border-t border-slate-100">
                      <span className="text-slate-500">vs Network Mean:</span>
                      <span className={st.delta_vs_network_mean >= 0 ? 'text-amber-700 font-semibold' : 'text-sky-700 font-semibold'}>
                        {st.delta_vs_network_mean >= 0 ? '+' : ''}{st.delta_vs_network_mean} {st.unit}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Multi-Station Overlay Line Chart */}
          <ChartWrapper
            title={`Multi-Station Comparison: ${compareData?.sensor_label || selectedSensor.toUpperCase()}`}
            subtitle={`Comparing ${selectedCompareIds.length} stations across the Indian subcontinent. Network Mean: ${compareData?.network_mean || 'N/A'} ${compareData?.unit || ''}.`}
            badge="SYNOPTIC OVERLAY"
            height={400}
          >
            {(!compareData?.series || compareData.series.length === 0) ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 rounded-xl border border-slate-200 text-center p-6 space-y-2">
                <AlertTriangle className="w-8 h-8 text-amber-600" />
                <span className="text-sm font-semibold text-slate-700">No overlapping observations</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={compareData.series} margin={{ top: 15, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} unit={` ${compareData?.unit || ''}`} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '0.75rem',
                      color: '#0f172a',
                      fontSize: '12px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} iconType="circle" />

                  {/* Network Average Line */}
                  <Line
                    type="monotone"
                    dataKey="network_avg"
                    name="Network Cohort Average"
                    stroke="#0f172a"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                  />

                  {/* Station Lines */}
                  {selectedCompareIds.map((sid) => {
                    const st = stations.find((s) => s.id === sid);
                    return (
                      <Line
                        key={sid}
                        type="monotone"
                        dataKey={sid}
                        name={`${st?.name || sid}`}
                        stroke={STATION_COLORS[sid] || '#818cf8'}
                        strokeWidth={1.8}
                        dot={false}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartWrapper>
        </div>
      )}

      {/* STEP 4 & STEP 5: CORRELATIONS + DISTRIBUTION ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* STEP 4: Bivariate Correlation & Scatter Plot */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm tracking-tight">Cross-Variable Relationships</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                PEARSON r
              </span>
            </div>

            {/* Pair Selector Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-4 text-[11px] font-mono">
              {[
                { key: 'temp_vs_humidity', label: 'Temp ↔ RH' },
                { key: 'temp_vs_pressure', label: 'Temp ↔ Press' },
                { key: 'wind_vs_pressure', label: 'Wind ↔ Press' },
                { key: 'temp_vs_precip', label: 'Temp ↔ Rain' },
              ].map((p) => (
                <button
                  key={p.key}
                  onClick={() => setSelectedCorrPair(p.key)}
                  className={`py-1.5 px-2 rounded-lg font-semibold transition-all border text-center ${
                    selectedCorrPair === p.key
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Correlation Metrics Banner */}
            {currentCorr?.available ? (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 mb-3 space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Relationship:</span>
                  <span className="font-bold text-slate-900">{currentCorr.description}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500 text-[11px] pt-1 border-t border-slate-200">
                  <span>Pearson r: <strong className="text-indigo-700">{(currentCorr.r ?? 0) > 0 ? '+' : ''}{currentCorr.r ?? 'N/A'}</strong></span>
                  <span>R²: <strong className="text-slate-900">{currentCorr.r_squared}</strong></span>
                  <span>Observations: <strong className="text-slate-900">{currentCorr.sample_size}</strong></span>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-mono mb-3">
                {currentCorr?.reason || 'Insufficient paired data to compute bivariate relationship.'}
              </div>
            )}

            {/* Scatter Plot */}
            <div className="h-[220px] w-full">
              {currentCorr?.available && currentCorr.scatter && currentCorr.scatter.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      type="number"
                      dataKey="x"
                      name={currentCorr.label_x}
                      stroke="#64748b"
                      fontSize={10}
                      tickLine={false}
                      unit={` ${currentCorr.unit_x}`}
                      domain={['auto', 'auto']}
                    />
                    <YAxis
                      type="number"
                      dataKey="y"
                      name={currentCorr.label_y}
                      stroke="#64748b"
                      fontSize={10}
                      tickLine={false}
                      unit={` ${currentCorr.unit_y}`}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e2e8f0',
                        borderRadius: '0.75rem',
                        color: '#0f172a',
                        fontSize: '11px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      }}
                    />
                    <Scatter
                      name={`${currentCorr.label_x} vs ${currentCorr.label_y}`}
                      data={currentCorr.scatter}
                      fill="#6366f1"
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400 font-mono">
                  Scatter plot unavailable
                </div>
              )}
            </div>
          </div>

          <p className="text-[10px] text-slate-500 italic font-mono pt-2 border-t border-slate-200">
            Notice: Correlation does not imply causation. Meteorological relationships are subject to local topography and macro-synoptic conditions.
          </p>
        </div>

        {/* STEP 5: Distribution Analysis & Percentiles */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-sky-600" />
                <h3 className="font-bold text-slate-900 text-sm tracking-tight">Frequency Distribution &amp; Percentiles</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                10-BIN HISTOGRAM
              </span>
            </div>

            {/* Percentile Stats Strip */}
            {d?.available && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-mono mb-4 text-center">
                <div>
                  <span className="text-slate-500 text-[10px] block">MIN</span>
                  <strong className="text-slate-900">{d.min}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">P25</span>
                  <strong className="text-sky-700">{d.p25}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">MEDIAN</span>
                  <strong className="text-emerald-700">{d.median}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">P75</span>
                  <strong className="text-sky-700">{d.p75}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">MAX</span>
                  <strong className="text-slate-900">{d.max}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">SKEW</span>
                  <strong className="text-indigo-700">{d.skewness}</strong>
                </div>
              </div>
            )}

            {/* Histogram Chart */}
            <div className="h-[220px] w-full">
              {d?.available && d.histogram ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={d.histogram} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="bin_label" stroke="#64748b" fontSize={9} tickLine={false} interval={1} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e2e8f0',
                        borderRadius: '0.75rem',
                        color: '#0f172a',
                        fontSize: '11px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      }}
                    />
                    <Bar dataKey="count" name="Frequency Count" fill="#0284c7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400 font-mono">
                  Histogram unavailable
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 text-[11px] font-mono text-slate-500 flex justify-between">
            <span>Mean: <strong className="text-slate-900">{d?.mean} {analyticsData?.unit}</strong></span>
            <span>Std Dev: <strong className="text-slate-900">{d?.std} {analyticsData?.unit}</strong></span>
          </div>
        </div>
      </div>

      {/* STEP 6: HOURLY DIURNAL & MONTHLY CLIMATOLOGICAL PATTERNS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Diurnal Hourly Cycle */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-sm tracking-tight">Diurnal Hourly Profile (00:00 – 23:00 IST)</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                24H SOLAR CYCLE
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Average diurnal swing for {selectedStation.name} evaluated over {timeRange.toUpperCase()}.
            </p>

            {diurnal?.available && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono mb-3">
                <div className="text-rose-700">
                  <span>Peak: </span>
                  <strong>{diurnal.peak_hour} ({diurnal.peak_value}{analyticsData?.unit})</strong>
                </div>
                <div className="text-sky-700">
                  <span>Trough: </span>
                  <strong>{diurnal.trough_hour} ({diurnal.trough_value}{analyticsData?.unit})</strong>
                </div>
                <div className="text-slate-700">
                  <span>Swing: </span>
                  <strong>{diurnal.diurnal_swing}{analyticsData?.unit}</strong>
                </div>
              </div>
            )}

            <div className="h-[200px] w-full">
              {diurnal?.available && diurnal.hourly_profile ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={diurnal.hourly_profile} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="hour_label" stroke="#64748b" fontSize={10} tickLine={false} interval={2} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} unit={` ${analyticsData?.unit || ''}`} domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e2e8f0',
                        borderRadius: '0.75rem',
                        color: '#0f172a',
                        fontSize: '11px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      }}
                    />
                    <Line type="monotone" dataKey="mean" name="Hourly Average" stroke="#d97706" strokeWidth={2} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400 font-mono">
                  {diurnal?.reason || 'Diurnal pattern requires at least 7 days of continuous data.'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 12-Month Climatological Cycle */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <CloudSun className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm tracking-tight">3-Year Monthly Climatology (Jan – Dec)</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                ANNUAL ENVELOPE
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Long-term annual climatology from 2023–2025 archive.
            </p>

            {monthly?.available && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono mb-3">
                <div className="text-rose-700">
                  <span>Highest: </span>
                  <strong>{monthly.highest_month}</strong>
                </div>
                <div className="text-sky-700">
                  <span>Lowest: </span>
                  <strong>{monthly.lowest_month}</strong>
                </div>
              </div>
            )}

            <div className="h-[200px] w-full">
              {monthly?.available && monthly.monthly_profile ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthly.monthly_profile} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month_name" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} unit={` ${analyticsData?.unit || ''}`} domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e2e8f0',
                        borderRadius: '0.75rem',
                        color: '#0f172a',
                        fontSize: '11px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      }}
                    />
                    <Bar dataKey="mean" name="Monthly Average" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400 font-mono">
                  Monthly climatology unavailable
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* STEP 7 & STEP 8: PRECIPITATION ANALYTICS + LIVE VS HISTORICAL CONTEXT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* STEP 7: Precipitation Analytics */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <CloudRain className="w-4 h-4 text-cyan-600" />
                <h3 className="font-bold text-slate-900 text-sm tracking-tight">Precipitation Analytics &amp; Sensor Fidelity</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
                RAIN AUDIT
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Distinguishes verified 0.0mm dry readings from missing sensor streams.
            </p>

            {precip?.available && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-mono mb-3 text-center">
                <div>
                  <span className="text-slate-500 text-[10px] block">TOTAL RAIN</span>
                  <strong className="text-slate-900">{precip.total_rain_mm} mm</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">RAIN HOURS</span>
                  <strong className="text-cyan-700">{precip.rain_events_count}h</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">DRY (0.0mm)</span>
                  <strong className="text-emerald-700">{precip.confirmed_dry_hours}h</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">MISSING</span>
                  <strong className="text-amber-700">{precip.unrecorded_missing_hours}h</strong>
                </div>
              </div>
            )}

            {/* Daily Totals Bar Chart */}
            <div className="h-[180px] w-full">
              {precip?.available && precip.daily_totals && precip.daily_totals.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={precip.daily_totals} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={9} tickLine={false} interval={Math.ceil(precip.daily_totals.length / 8)} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} unit=" mm" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e2e8f0',
                        borderRadius: '0.75rem',
                        color: '#0f172a',
                        fontSize: '11px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      }}
                    />
                    <Bar dataKey="rainfall_mm" name="Daily Rainfall" fill="#0891b2" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400 font-mono">
                  No rainfall events in this period
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 text-[10px] font-mono text-slate-500">
            {precip?.data_integrity_note}
          </div>
        </div>

        {/* STEP 8: Live vs Historical Climatological Context */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm tracking-tight">Live vs Historical Baseline Context</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                CLIMATOLOGICAL REFERENCE
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Real-time Open-Meteo observation contextualized against 3-year station baseline.
            </p>

            {liveContext?.available ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 text-[10px] block uppercase">Current Live Reading:</span>
                    <strong className="text-xl text-slate-900 font-bold">{liveContext.live_value} {liveContext.unit}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 text-[10px] block uppercase">3-Yr Baseline Mean:</span>
                    <strong className="text-xl text-sky-700 font-bold">{liveContext.baseline_mean} {liveContext.unit}</strong>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">Climatological Standing:</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
                        liveContext.badge_style === 'emerald'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : liveContext.badge_style === 'amber'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-sky-50 text-sky-800 border-sky-200'
                      }`}
                    >
                      {liveContext.comparison}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 text-[11px] pt-2 border-t border-slate-200">
                    <span>Baseline Delta: <strong className="text-slate-800">{(liveContext.delta ?? 0) > 0 ? '+' : ''}{liveContext.delta ?? 0} {liveContext.unit}</strong></span>
                    <span>Z-Score: <strong className="text-slate-800">{liveContext.delta_z ?? 0}σ</strong></span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs font-mono">
                {liveContext?.reason || 'Live reading temporarily unavailable.'}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-200 text-[10px] font-mono text-slate-500">
            {liveContext?.context_label}
          </div>
        </div>
      </div>

      {/* STEP 9 & STEP 10: WEATHER INSIGHTS & DATA QUALITY INDICATOR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* STEP 9: Data-Backed Weather Insights */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-sky-600" />
              <h3 className="font-bold text-slate-900 text-sm tracking-tight">Data-Backed Climatological Insights</h3>
            </div>
            <div className="space-y-2.5 font-mono text-xs">
              {insights.map((ins, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                  <div className="p-1 rounded-md bg-sky-50 text-sky-600 shrink-0 mt-0.5">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-slate-700 leading-relaxed">{ins}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* STEP 10: Data Quality Indicator */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between font-mono text-xs">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm tracking-tight">Data Quality Audit</h3>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                dq?.status === 'NOMINAL' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {dq?.status || 'NOMINAL'}
              </span>
            </div>

            <div className="space-y-2 py-2">
              <div className="flex justify-between text-slate-600">
                <span>Coverage Pct:</span>
                <strong className="text-emerald-700">{dq?.coverage_pct || 0}%</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Recorded Readings:</span>
                <strong className="text-slate-900">{dq?.recorded_readings || 0}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Missing Count:</span>
                <strong className={dq && dq.missing_readings > 0 ? 'text-amber-700' : 'text-slate-500'}>
                  {dq?.missing_readings || 0}
                </strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Source Archive:</span>
                <strong className="text-indigo-700">{dq?.source || 'Meteostat'}</strong>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-500">
            Last observation: {dq?.last_observation_timestamp || 'N/A'}
          </div>
        </div>
      </div>
    </div>
  );
};
