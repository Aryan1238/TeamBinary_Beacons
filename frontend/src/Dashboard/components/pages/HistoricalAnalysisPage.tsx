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
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Dot,
} from 'recharts';
import { PageHeader } from '../common/PageHeader';
import { ChartWrapper } from '../common/ChartWrapper';
import type { AWSStation, DashboardTab, HistoricalDriftResponse } from '../../types/dashboard.types';
import { API_BASE } from '../../../services/api';

interface HistoricalAnalysisPageProps {
  stations: AWSStation[];
  onNavigateTab?: (tab: DashboardTab) => void;
}

type TimeRangeOption = '24h' | '7d' | '30d' | '90d' | 'custom';
type SensorKey = 'temperature' | 'humidity' | 'pressure' | 'wind_speed' | 'precipitation';

// Custom dot renderer for filled/interpolated points
const CustomizedDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (payload.is_spike) {
    return (
      <circle
        cx={cx}
        cy={cy}
        r={5}
        fill="#f43f5e"
        stroke="#ffffff"
        strokeWidth={1.5}
      />
    );
  }
  if (payload.is_large_gap) {
    return (
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill="#fbbf24"
        stroke="#78350f"
        strokeWidth={1.5}
      />
    );
  }
  if (payload.is_filled) {
    return (
      <circle
        cx={cx}
        cy={cy}
        r={3}
        fill="#38bdf8"
        stroke="#0c4a6e"
        strokeWidth={1}
      />
    );
  }
  return null;
};

export const HistoricalAnalysisPage: React.FC<HistoricalAnalysisPageProps> = ({
  stations,
  onNavigateTab,
}) => {
  const [selectedStationId, setSelectedStationId] = useState<string>('AWS-003'); // Default: Pune
  const [selectedSensor, setSelectedSensor] = useState<SensorKey>('temperature');
  const [timeRange, setTimeRange] = useState<TimeRangeOption>('30d');
  const [source, setSource] = useState<'Meteostat' | 'NOAA'>('Meteostat');
  const [startDate, setStartDate] = useState<string>('2025-11-01');
  const [endDate, setEndDate] = useState<string>('2025-12-31');

  // Peer comparison toggle
  const [comparePeer, setComparePeer] = useState<boolean>(false);
  const [peerStationId, setPeerStationId] = useState<string>('AWS-004'); // Default peer: Mumbai
  const [peerData, setPeerData] = useState<HistoricalDriftResponse | null>(null);

  const [driftData, setDriftData] = useState<HistoricalDriftResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

  const selectedStation = stations.find((s) => s.id === selectedStationId) || stations[0];
  const peerStation = stations.find((s) => s.id === peerStationId) || stations[1];

  const fetchDriftAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `${API_BASE}/historical/drift?station_id=${selectedStationId}&sensor=${selectedSensor}&time_range=${timeRange}&source=${source}`;
      if (timeRange === 'custom') {
        url += `&start_date=${startDate}&end_date=${endDate}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: HistoricalDriftResponse = await res.json();
      setDriftData(data);

      if (comparePeer && peerStationId) {
        let peerUrl = `${API_BASE}/historical/drift?station_id=${peerStationId}&sensor=${selectedSensor}&time_range=${timeRange}&source=${source}`;
        if (timeRange === 'custom') {
          peerUrl += `&start_date=${startDate}&end_date=${endDate}`;
        }
        const pRes = await fetch(peerUrl);
        if (pRes.ok) {
          const pData: HistoricalDriftResponse = await pRes.json();
          setPeerData(pData);
        }
      } else {
        setPeerData(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch historical drift analysis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriftAnalysis();
  }, [selectedStationId, selectedSensor, timeRange, source, startDate, endDate, comparePeer, peerStationId]);

  // Merge series for chart if peer comparison is on
  const mergedSeries = (driftData?.series || []).map((pt, idx) => {
    const entry: Record<string, any> = { ...pt };
    if (comparePeer && peerData?.series && peerData.series[idx]) {
      entry['peer_value'] = peerData.series[idx].value;
      entry['peer_moving_avg'] = peerData.series[idx].moving_avg_24h;
    }
    return entry;
  });

  const d = driftData?.drift;
  const b = driftData?.baseline;
  const sf = driftData?.spike_filter;

  const getClassificationBadgeStyle = (classification?: string) => {
    switch (classification) {
      case 'SIGNIFICANT DRIFT':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'DRIFT DETECTED':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'WATCH':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Historical Drift & Sensor Stability Tracking"
        subtitle="Empirical time-series regression and long-term diurnal baseline models anchored to the real historical archive."
        badge="HISTORICAL DRIFT ENGINE"
      />

      {/* Anchor Reference Banner */}
      <div className="p-3.5 px-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-sky-600" />
          <span className="text-slate-600">Fixed Historical Reference Anchor:</span>
          <strong className="text-sky-700">Dec 31, 2025 23:00 IST</strong>
          <span className="text-slate-500 text-[11px]">(Latest Real Ground-Truth Timestamp)</span>
        </div>
        <div className="text-slate-600 text-[11px] flex items-center gap-3">
          <span>All intervals computed backwards from this anchor</span>
          <span className="text-indigo-700">• Full 3-Year Archive: 2023–2025</span>
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

          {/* Sensor Selector */}
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-sky-600" />
            <select
              value={selectedSensor}
              onChange={(e) => setSelectedSensor(e.target.value as SensorKey)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-500 shadow-xs capitalize"
            >
              <option value="temperature">Temperature (°C)</option>
              <option value="humidity">Relative Humidity (%)</option>
              <option value="pressure">Barometric Pressure (hPa)</option>
              <option value="wind_speed">Wind Speed (m/s)</option>
              <option value="precipitation">Precipitation (mm)</option>
            </select>
          </div>

          {/* Source Selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => handleSourceChange('Meteostat')}
              className={`px-2.5 py-1 rounded-lg font-mono font-semibold transition-all ${
                source === 'Meteostat'
                  ? 'bg-white text-sky-800 border border-slate-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Meteostat (Continuous)
            </button>
            <button
              onClick={() => handleSourceChange('NOAA')}
              className={`px-2.5 py-1 rounded-lg font-mono font-semibold transition-all ${
                source === 'NOAA'
                  ? 'bg-white text-indigo-800 border border-slate-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              NOAA Synoptic
            </button>
          </div>
        </div>

        {/* Time Span Picker & Peer Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs">
            {(['24h', '7d', '30d', '90d', 'custom'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-lg font-mono font-semibold uppercase transition-all ${
                  timeRange === range
                    ? 'bg-white text-sky-800 border border-slate-200 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          {/* Peer Compare Switch */}
          <div className="flex items-center gap-2 text-xs font-mono text-slate-700">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={comparePeer}
                onChange={(e) => setComparePeer(e.target.checked)}
                className="rounded border-slate-300 text-sky-600 focus:ring-0"
              />
              <span>Compare Peer Node</span>
            </label>
            {comparePeer && (
              <select
                value={peerStationId}
                onChange={(e) => setPeerStationId(e.target.value)}
                className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-800 shadow-xs"
              >
                {stations
                  .filter((s) => s.id !== selectedStation.id)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.id} — {s.name}
                    </option>
                  ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Custom Date Range Pickers (if custom selected) */}
      {timeRange === 'custom' && (
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-sky-600" />
            <span className="text-slate-600">Start Date:</span>
            <input
              type="date"
              value={startDate}
              min="2023-01-01"
              max={maxValidDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-300 text-slate-800 text-xs shadow-xs"
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
              className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-300 text-slate-800 text-xs shadow-xs"
            />
          </div>
          <span className="text-slate-500 text-[11px]">Valid historical boundary: 2023-01-01 to {maxValidDate}</span>
        </div>
      )}

      {/* Graceful Degradation Warning Banner (if insufficient history) */}
      {driftData?.status === 'INSUFFICIENT_HISTORY' && (
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h4 className="font-bold text-sm text-amber-900">
              Graceful Degradation Notice: Insufficient Historical Archive
            </h4>
            <p className="leading-relaxed text-amber-800">
              {driftData.explanation}
            </p>
            {driftData.degradation_reason === 'NOAA_STREAM_ENDED' && (
              <p className="text-[11px] text-amber-800 pt-1 font-mono">
                Recommendation: Switch data source to <strong>Meteostat (Continuous)</strong> for uninterrupted 3-year multi-sensor ground truth.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Drift Diagnostics & Metrics Panel */}
      {driftData?.status === 'SUCCESS' && d && b && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Classification Card */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono block mb-1.5">
                Drift Classification
              </span>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase font-mono border ${getClassificationBadgeStyle(d.classification)}`}>
                  {d.classification}
                </span>
                <span className="text-[11px] font-mono text-slate-500">({d.confidence} CONF)</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mt-1">
                {d.status_description}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 text-[11px] font-mono text-slate-500 flex justify-between mt-2">
              <span>Z-Score: <strong className="text-slate-800">{d.normalized_z_score}&sigma;</strong></span>
              <span>Window: <strong className="text-slate-800">{d.duration_days} days</strong></span>
            </div>
          </div>

          {/* Rate & Direction Card */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between font-mono text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                Trend Slope & Rate
              </span>
              <div className="flex items-center gap-2 my-1">
                {d.direction === '+' ? (
                  <TrendingUp className="w-5 h-5 text-rose-600" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-sky-600" />
                )}
                <span className="text-lg font-bold text-slate-900">
                  {d.signed_magnitude > 0 ? '+' : ''}{d.signed_magnitude} {driftData.unit}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Total cumulative drift over window</p>
            </div>

            <div className="space-y-1 pt-2 border-t border-slate-100 text-[11px]">
              <div className="flex justify-between text-slate-600">
                <span>Daily Rate:</span>
                <span className="font-bold text-slate-900">{d.slope_per_day > 0 ? '+' : ''}{d.slope_per_day} {driftData.unit}/day</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Weekly Rate:</span>
                <span className="font-bold text-slate-900">{d.rate_per_week > 0 ? '+' : ''}{d.rate_per_week} {driftData.unit}/wk</span>
              </div>
            </div>
          </div>

          {/* Long-Term Baseline Stats Card */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between font-mono text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                Long-Term Baseline (3-Year)
              </span>
              <div className="text-lg font-bold text-sky-700 my-1">
                {b.mean} {driftData.unit}
                <span className="text-slate-500 text-xs font-normal"> (&plusmn;{b.std} {driftData.unit})</span>
              </div>
              <p className="text-[11px] text-slate-500">Normal Band: [{b.expected_min}, {b.expected_max}] {driftData.unit}</p>
            </div>

            <div className="pt-2 border-t border-slate-100 text-[11px] flex justify-between">
              <span className="text-slate-600">Deviation from Mean:</span>
              <span className={`font-bold ${Math.abs(d.deviation_from_baseline) > b.std ? 'text-amber-700' : 'text-slate-900'}`}>
                {d.deviation_from_baseline > 0 ? '+' : ''}{d.deviation_from_baseline} {driftData.unit}
              </span>
            </div>
          </div>

          {/* Spike Filter & Transient Audit Card */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between font-mono text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                Spike-vs-Drift Filter
              </span>
              <div className="flex items-center gap-2 my-1">
                {sf?.has_transient_spikes ? (
                  <Activity className="w-4 h-4 text-amber-600" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                )}
                <span className="font-bold text-slate-900">
                  {sf?.spikes_detected || 0} Transient Spike(s) Filtered
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {sf?.explanation}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500">
              ROC Limiter: &le; {sf?.roc_limit} {driftData.unit}/h
            </div>
          </div>
        </div>
      )}

      {/* Main Engineering Historical Trend Chart */}
      <ChartWrapper
        title={`Historical Drift & Time-Series: ${selectedStation.name} (${selectedSensor.toUpperCase()})`}
        subtitle={
          driftData?.status === 'SUCCESS'
            ? `Showing ${driftData.data_points} hourly observations (${driftData.window_start} to ${driftData.window_end}). Solid line: Native readings; Cyan dashed: 24h Moving Average; Gold dashed: Long-term baseline; Red dashed: Regression Trend.`
            : 'Historical data timeline'
        }
        badge="PRECISION LOG"
        height={400}
      >
        {mergedSeries.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/90 rounded-xl border border-slate-200 text-center p-6 space-y-3 z-10 backdrop-blur-sm">
            <div className="p-3 rounded-full bg-amber-50 border border-amber-200 shadow-xs">
              <AlertTriangle className="w-8 h-8 text-amber-600" />
            </div>
            <div className="space-y-1.5 max-w-md">
              <h4 className="text-sm font-bold text-slate-900">
                No Observations in Selected Range
              </h4>
              <p className="text-xs text-slate-600 font-mono leading-relaxed">
                {driftData?.explanation ||
                  (source === 'NOAA'
                    ? 'NOAA synoptic stream ends on 2025-08-24. Preset ranges (24h/7d/30d/90d) are anchored backwards from 2025-12-31 23:00:00.'
                    : 'No historical observations found for this station and time window.')}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs font-mono">
              {source === 'NOAA' ? (
                <>
                  <button
                    onClick={() => handleSourceChange('Meteostat')}
                    className="px-3 py-1.5 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition-all font-semibold shadow-xs"
                  >
                    Switch to Meteostat (Continuous)
                  </button>
                  <button
                    onClick={() => {
                      setTimeRange('custom');
                      setStartDate('2025-07-25');
                      setEndDate('2025-08-24');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-all font-semibold shadow-xs"
                  >
                    Select Valid NOAA Range (Jul–Aug 2025)
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setTimeRange('30d')}
                  className="px-3 py-1.5 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition-all font-semibold shadow-xs"
                >
                  Reset to 30D Window
                </button>
              )}
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={mergedSeries} margin={{ top: 15, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit={` ${driftData?.unit || ''}`} domain={['auto', 'auto']} />
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
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} iconType="circle" />

              {/* Long-Term Baseline Reference Line */}
              {b && (
                <ReferenceLine
                  y={b.mean}
                  stroke="#d97706"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: `3-Yr Baseline Mean: ${b.mean} ${driftData?.unit}`,
                    fill: '#b45309',
                    fontSize: 10,
                    position: 'insideTopRight',
                  }}
                />
              )}

              {/* 24h Rolling Mean */}
              <Line
                type="monotone"
                dataKey="moving_avg_24h"
                name="24h Rolling Mean"
                stroke="#0284c7"
                strokeWidth={2}
                strokeDasharray="3 3"
                dot={false}
              />

              {/* Linear Regression Trend Line */}
              <Line
                type="monotone"
                dataKey="trend"
                name="Fitted Drift Trend"
                stroke="#e11d48"
                strokeWidth={1.5}
                strokeDasharray="6 3"
                dot={false}
              />

              {/* Native Observed Line with custom dots for filled/spikes */}
              <Line
                type="monotone"
                dataKey="value"
                name={`${selectedStation.name} (Observed)`}
                stroke="#6366f1"
                strokeWidth={2}
                dot={<CustomizedDot />}
              />

              {/* Peer Comparison Lines (if active) */}
              {comparePeer && (
                <Line
                  type="monotone"
                  dataKey="peer_value"
                  name={`${peerStation.name} (Peer Observed)`}
                  stroke="#16a34a"
                  strokeWidth={1.5}
                  dot={false}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </ChartWrapper>

      {/* Chart Legend / Dot Guide & Meteorological Caveat */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-mono shadow-sm">
        <div className="flex flex-wrap items-center gap-4 text-slate-600">
          <span className="text-slate-900 font-bold uppercase">Data Point Audit:</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#6366f1]" /> Native Observation
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7] border border-[#0369a1]" /> Imputed / Filled
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#d97706] border border-[#b45309]" /> Large Gap Reconstructed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#e11d48]" /> Filtered Transient Spike
          </span>
        </div>

        <div className="text-[11px] text-slate-500 max-w-xl italic">
          {d?.seasonal_caveat || 'Corroborate long-term drift with proximate AWS peers before dispatching field calibration.'}
        </div>
      </div>
    </div>
  );
};
