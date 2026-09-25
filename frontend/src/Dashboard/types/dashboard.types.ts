export type StationStatus = 'NORMAL' | 'WARNING' | 'ANOMALY' | 'OFFLINE';

export type AnomalySeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type SensorType = 'temperature' | 'humidity' | 'pressure' | 'wind' | 'rainfall';

export interface SensorReading {
  value: number;
  unit: string;
  status: StationStatus;
  min24h: number;
  max24h: number;
  expectedMin: number;
  expectedMax: number;
  lastUpdated: string;
}

export interface AWSStation {
  id: string;
  name: string;
  location: string;
  state: string;
  region: 'North' | 'South' | 'East' | 'West' | 'Central' | 'Northeast';
  elevationMeters: number;
  coordinates: {
    lat: number;
    lng: number;
  };
  dataSource?: string;
  meteostatId?: string;
  noaaId?: string;
  status: StationStatus;
  healthScore: number;
  lastPingSeconds: number;
  sensors: {
    temperature: SensorReading;
    humidity: SensorReading;
    pressure: SensorReading;
    wind: SensorReading;
    rainfall: SensorReading;
  };
  weatherCondition: string;
  forecastSummary: string;
  calibrationDueDays: number;
  communicationUptime: number; // percentage
}

export interface AnomalyAlert {
  id: string;
  stationId: string;
  stationName: string;
  location: string;
  sensor: SensorType;
  title: string;
  description: string;
  severity: AnomalySeverity;
  observedValue: string;
  expectedRange: string;
  deviationPercent: number;
  detectedAt: string;
  status: 'Investigating' | 'Open' | 'Resolved';
  evidence: {
    historical: string;
    crossStation: string;
    physicalConsistency: string;
    recommendedAction: string;
  };
  investigation?: InvestigationRecord;
}

export interface MaintenanceTicket {
  id: string;
  stationId: string;
  stationName: string;
  station_id?: string;
  station_name?: string;
  station_location?: string;
  sensor: SensorType;
  issue: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'ASSIGNED' | 'IN PROGRESS' | 'AWAITING VERIFICATION' | 'RESOLVED' | 'CLOSED' | 'Pending Dispatch' | 'In Progress' | 'Resolved';
  assignedTo?: string;
  assigned_to?: string;
  reportedAt?: string;
  created_at?: string;
  updated_at?: string;
  recommendedAction?: string;
  recommended_action?: string;
  evidence?: any;
  notes?: Array<{ timestamp: string; author: string; text: string }>;
  resolution?: string | null;
  verified_at?: string | null;
  verification_result?: any;
  timeline?: Array<{ timestamp: string; event: string; status: string; detail: string }>;
}

export type DashboardTab =
  | 'command-center'
  | 'live-monitoring'
  | 'live-weather'
  | 'station-map'
  | 'historical-analysis'
  | 'weather-analytics'
  | 'anomaly-alerts'
  | 'anomaly-investigation'
  | 'cross-station'
  | 'sensor-health'
  | 'maintenance'
  | 'simulation-lab';

export type SimulationScenario =
  | 'normal'
  | 'sudden-spike'
  | 'gradual-drift'
  | 'frozen-sensor'
  | 'humidity-spike'
  | 'pressure-drop'
  | 'communication-failure';

export type MLStatus =
  | 'NORMAL'
  | 'ANOMALY'
  | 'WARMING_UP (n/24)'
  | 'NOT_APPLICABLE (3h cadence)'
  | string;

export interface MLInferenceResult {
  status: MLStatus;
  reconstructionError: number | null;
  threshold: number;
  errorRatio: number | null;
  warmupStep: number;
  dominantFeature: string;
  source: 'Meteostat' | 'NOAA';
  stationId: string;
  message?: string;
  updatedAt?: string;
}

export interface InvestigationRecord {
  id: string;
  station_id: string;
  station_name: string;
  timestamp: string;
  affected_variable: string;
  observed_value: number;
  expected_range: string;

  // LSTM block (null for 3h synoptic stations)
  lstm_reconstruction_error: number | null;
  lstm_threshold: number;
  lstm_status: string | null;
  lstm_error_ratio: number | null;
  dominant_feature: string | null;

  // Deterministic rule checks
  rate_of_change_check: {
    status: 'PASS' | 'FAIL';
    value: number;
    threshold: number;
    unit: string;
  };
  physical_range_check: {
    status: 'PASS' | 'FAIL';
    value: number;
    expected_min: number;
    expected_max: number;
    unit: string;
  };
  zero_variance_check: {
    status: 'PASS' | 'FAIL';
    consecutive_constant_readings: number;
  };

  // Multi-source reference checks
  external_weather_comparison: {
    status: 'MATCH' | 'MISMATCH' | 'UNAVAILABLE';
    external_source: string;
    external_value: number | null;
    diff: number | null;
    distance_km: number | null;
  };
  spatial_consensus: {
    status: 'MATCH' | 'MISMATCH' | 'INSUFFICIENT_NEIGHBORS';
    classification?: 'REGIONAL EVENT' | 'ISOLATED SENSOR ANOMALY' | 'INSUFFICIENT EVIDENCE';
    confidence?: 'HIGH' | 'LOW' | 'NONE';
    peer_basis?: string;
    explanation?: string;
    neighbor_count: number;
    expected_value: number | null;
    diff: number | null;
    target_delta?: number;
    neighbors: Array<{
      station_id: string;
      station_name: string;
      distance_km: number;
      value: number;
      expected_midpoint?: number;
      delta?: number;
      confirms_target?: boolean;
      status: string;
    }>;
  };

  historical_drift?: {
    classification: 'NORMAL' | 'WATCH' | 'DRIFT DETECTED' | 'SIGNIFICANT DRIFT';
    confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
    slope_per_day: number;
    rate_per_week: number;
    baseline_mean: number;
    baseline_std?: number;
    deviation_from_baseline: number;
    duration_days: number;
    status_description: string;
    reference_timestamp?: string;
  } | null;

  // Forensic verdict
  severity: AnomalySeverity;
  fault_type_if_known: string;
  probable_cause: string;
  recommended_action:
    | 'Continue Monitoring'
    | 'Verify with External Weather'
    | 'Cross-check Neighboring Stations'
    | 'Sensor Inspection Required'
    | 'Create Maintenance Ticket'
    | 'Possible Genuine Weather Event';
  trigger_source: string[];
}

export interface HistoricalDataPoint {
  time: string;
  value: number;
  moving_avg_24h: number;
  baseline_mean: number;
  trend: number;
  is_filled?: boolean;
  is_large_gap?: boolean;
  is_spike?: boolean;
}

export interface HistoricalDriftResponse {
  status: 'SUCCESS' | 'INSUFFICIENT_HISTORY' | 'ERROR';
  station_id: string;
  station_name: string;
  state?: string;
  sensor: string;
  unit: string;
  time_range: string;
  source: string;
  reference_timestamp: string;
  window_start?: string;
  window_end?: string;
  data_points?: number;
  coverage_pct?: number;
  null_pct?: number;
  degradation_reason?: string;
  explanation?: string;
  baseline?: {
    mean: number;
    std: number;
    expected_min: number;
    expected_max: number;
    historical_std: number;
  };
  drift?: {
    classification: 'NORMAL' | 'WATCH' | 'DRIFT DETECTED' | 'SIGNIFICANT DRIFT';
    confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
    status_description: string;
    slope_per_day: number;
    rate_per_week: number;
    magnitude: number;
    signed_magnitude: number;
    direction: '+' | '-';
    duration_days: number;
    deviation_from_baseline: number;
    normalized_z_score: number;
    seasonal_caveat: string;
  };
  spike_filter?: {
    spikes_detected: number;
    has_transient_spikes: boolean;
    spike_indices: number[];
    explanation: string;
    roc_limit: number;
  };
  injected_drift_applied?: boolean;
  injected_spike_applied?: boolean;
  series: HistoricalDataPoint[];
}

export interface WeatherAnalyticsKPI {
  available: boolean;
  mean?: number;
  min?: number;
  max?: number;
  range?: number;
  total?: number;
  unit?: string;
  status?: string;
}

export interface WeatherTrendDataPoint {
  time: string;
  value: number;
  moving_avg_24h: number;
}

export interface HistogramBin {
  bin_label: string;
  bin_start: number;
  bin_end: number;
  count: number;
  pct: number;
}

export interface WeatherDistribution {
  available: boolean;
  min?: number;
  p25?: number;
  median?: number;
  p75?: number;
  max?: number;
  mean?: number;
  std?: number;
  skewness?: number;
  histogram?: HistogramBin[];
  reason?: string;
}

export interface HourlyProfilePoint {
  hour: number;
  hour_label: string;
  mean: number;
  std: number;
  min: number;
  max: number;
}

export interface WeatherDiurnalPattern {
  available: boolean;
  hourly_profile?: HourlyProfilePoint[];
  peak_hour?: string;
  peak_value?: number;
  trough_hour?: string;
  trough_value?: number;
  diurnal_swing?: number;
  reason?: string;
}

export interface MonthlyProfilePoint {
  month_num: number;
  month_name: string;
  mean: number;
  std: number;
}

export interface WeatherMonthlyPattern {
  available: boolean;
  monthly_profile?: MonthlyProfilePoint[];
  highest_month?: string;
  lowest_month?: string;
  reason?: string;
}

export interface WeatherPrecipitationAnalytics {
  available: boolean;
  total_rain_mm?: number;
  max_hourly_event_mm?: number;
  avg_rain_intensity_mm_h?: number;
  rain_events_count?: number;
  confirmed_dry_hours?: number;
  unrecorded_missing_hours?: number;
  dry_ratio_pct?: number;
  daily_totals?: { date: string; rainfall_mm: number }[];
  data_integrity_note?: string;
  reason?: string;
}

export interface WeatherLiveVsHist {
  available: boolean;
  live_value?: number;
  baseline_mean?: number;
  baseline_std?: number;
  delta?: number;
  delta_z?: number;
  comparison?: string;
  badge_style?: string;
  unit?: string;
  last_update?: string;
  context_label?: string;
  reason?: string;
}

export interface WeatherDataQuality {
  total_expected_hours: number;
  recorded_readings: number;
  missing_readings: number;
  coverage_pct: number;
  last_observation_timestamp: string;
  source: string;
  status: string;
}

export interface WeatherAnalyticsResponse {
  status: 'SUCCESS' | 'INSUFFICIENT_HISTORY' | 'ERROR';
  station_id?: string;
  station_name?: string;
  state?: string;
  sensor?: string;
  sensor_label?: string;
  unit?: string;
  time_range?: string;
  source?: string;
  reference_timestamp?: string;
  window_start?: string;
  window_end?: string;
  degradation_reason?: string;
  explanation?: string;
  kpis?: Record<string, WeatherAnalyticsKPI>;
  trend?: {
    period_min: number;
    period_max: number;
    period_avg: number;
    baseline_mean: number;
    baseline_std: number;
    data_points: number;
    series: WeatherTrendDataPoint[];
  };
  distribution?: WeatherDistribution;
  diurnal_pattern?: WeatherDiurnalPattern;
  monthly_pattern?: WeatherMonthlyPattern;
  precipitation_analytics?: WeatherPrecipitationAnalytics;
  live_vs_historical?: WeatherLiveVsHist;
  insights?: string[];
  data_quality?: WeatherDataQuality;
}

export interface BivariateCorrelation {
  available: boolean;
  r?: number;
  r_squared?: number;
  slope?: number;
  intercept?: number;
  strength?: string;
  direction?: string;
  description?: string;
  label_x?: string;
  label_y?: string;
  unit_x?: string;
  unit_y?: string;
  sample_size?: number;
  scatter?: { x: number; y: number }[];
  disclaimer?: string;
  reason?: string;
  status?: string;
}

export interface WeatherCorrelationResponse {
  status: string;
  station_id: string;
  station_name: string;
  time_range: string;
  source: string;
  correlations: Record<string, BivariateCorrelation>;
}

export interface StationComparisonSummary {
  station_id: string;
  station_name: string;
  state: string;
  mean: number;
  min: number;
  max: number;
  range: number;
  std: number;
  delta_vs_network_mean: number;
  unit: string;
}

export interface WeatherStationCompareResponse {
  status: string;
  sensor: string;
  sensor_label: string;
  unit: string;
  time_range: string;
  source: string;
  network_mean: number;
  station_summaries: StationComparisonSummary[];
  series: Record<string, any>[];
}


// =====================================================================
// Sensor Health Matrix & Response Types
// =====================================================================

export type SensorHealthStatus =
  | 'HEALTHY'
  | 'WATCH'
  | 'DEGRADED'
  | 'CRITICAL'
  | 'AWAITING VERIFICATION'
  | 'OFFLINE';

export interface SingleSensorHealthDetail {
  station_id: string;
  station_name: string;
  location: string;
  state: string;
  region: string;
  cadence: string;
  sensor: SensorType;
  sensor_name: string;
  unit: string;
  current_value: number;
  status: SensorHealthStatus;
  health_score: number;
  why_this_status: string;
  qualifying_triggers: string[];
  investigation: {
    active: boolean;
    severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | null;
    id?: string | null;
    triggers: string[];
    root_cause: string;
    spatial_status: string;
    external_status: string;
  };
  drift: {
    classification: 'NORMAL' | 'WATCH' | 'DRIFT DETECTED' | 'SIGNIFICANT DRIFT';
    drift_sigma: number;
    slope: number;
    total_drift: number;
    z_score: number;
    summary: string;
  };
  ml_model: {
    lstm_applicable: boolean;
    lstm_status: string;
  };
  freshness: {
    cadence: string;
    last_ping_seconds: number;
    is_stale: boolean;
    link_status: 'ONLINE' | 'OFFLINE';
  };
  active_ticket?: {
    id: string;
    status: string;
    priority: string;
    assigned_to: string;
  } | null;
  timeline: Array<{
    time: string;
    event: string;
    status: string;
    note: string;
  }>;
}

export interface StationHealthMatrixRow {
  station_id: string;
  station_name: string;
  location: string;
  state: string;
  region: string;
  cadence: string;
  source: string;
  overall_status: SensorHealthStatus;
  overall_health_score: number;
  sensors: Record<SensorType, SingleSensorHealthDetail>;
}

export interface SensorHealthKPIs {
  total_stations: number;
  total_sensors: number;
  healthy_count: number;
  watch_count: number;
  degraded_count: number;
  critical_count: number;
  awaiting_verification_count: number;
  offline_count: number;
  open_maintenance_issues: number;
  fleet_comm_uptime_pct: number;
  timestamp: string;
}

export interface SensorHealthMatrixResponse {
  kpis: SensorHealthKPIs;
  matrix: StationHealthMatrixRow[];
}

export interface MaintenanceKPIs {
  total_tickets: number;
  open_tickets: number;
  high_priority: number;
  in_progress: number;
  awaiting_verification: number;
  resolved_or_closed: number;
  overdue: number;
}

export interface MaintenanceTicketsResponse {
  kpis: MaintenanceKPIs;
  tickets: MaintenanceTicket[];
}

