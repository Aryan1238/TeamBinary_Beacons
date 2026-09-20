export interface TelemetryReading {
  station_id: string;
  station_name: string;
  region: string;
  timestamp: string;
  temperature: number;
  pressure: number;
  humidity: number;
  wind_speed?: number;
  sensor_health?: number;
  status?: string;
  battery_voltage?: number;
  signal_rssi?: number;
}

export interface Station {
  id: string;
  name: string;
  state: string;
  region: string;
  lat: number;
  lon: number;
  elevation: number;
  status: 'healthy' | 'warning' | 'critical' | 'offline' | 'suspicious';
  last_update: string;
  temperature: number;
  pressure: number;
  humidity: number;
  wind_speed?: number;
  rainfall?: number;
  precipitation?: number;
  weather_code?: number;
  weather_condition?: string;
  source?: string;
  obs_time?: string;
  sensor_health: number;
  risk_level: string;
  ai_confidence: number;
  is_frozen?: boolean;
  is_offline?: boolean;
  temp_base?: number;
  press_base?: number;
  rh_base?: number;
  daily_forecast?: DailyForecastDay[];
  hourly_forecast?: HourlyForecastHour[];
}

export interface DailyForecastDay {
  date: string;
  weather_code: number;
  condition: string;
  temp_max: number | null;
  temp_min: number | null;
  precipitation_sum: number;
  precip_probability: number;
  wind_speed_max: number | null;
}

export interface HourlyForecastHour {
  time: string;
  hour: string;
  temperature: number | null;
  humidity: number | null;
  precipitation: number;
  precip_probability: number;
  wind_speed: number | null;
  weather_code: number;
  condition: string;
}

export interface FeatureContribution {
  feature: string;
  importance: number;
  direction: string;
}

export interface RootCauseProbability {
  cause: string;
  probability: number;
}

export interface AnomalyRecord {
  id: string;
  timestamp: string;
  station_id: string;
  station_name: string;
  parameter: 'Temperature' | 'Atmospheric Pressure' | 'Relative Humidity' | 'Multivariate' | 'Communication' | 'Physical Boundary';
  observed_value: number;
  expected_value: number;
  deviation: number;
  anomaly_score: number;
  confidence: number;
  severity: 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';
  anomaly_type: string;
  root_cause: string;
  root_cause_breakdown: RootCauseProbability[];
  is_genuine_weather: boolean;
  feature_contributions: FeatureContribution[];
  explanation: string;
  corrected_value: number;
  correction_confidence: number;
  status: 'Active' | 'Investigating' | 'Acknowledged' | 'Corrected' | 'Dismissed';
  accepted_correction: boolean;
  data_lineage?: Record<string, any>;
}

export interface SensorHealthMetric {
  station_id: string;
  station_name: string;
  region: string;
  overall_health: number;
  data_reliability: number;
  sensor_stability: number;
  communication_quality: number;
  drift_score: number;
  anomaly_frequency: string;
  calibration_confidence: number;
  status: 'Excellent' | 'Healthy' | 'Degraded' | 'Critical';
  trend: number[];
  recommendation: string;
}

export interface MaintenanceTicket {
  id: string;
  station_id: string;
  station_name: string;
  sensor: string;
  health: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  anomaly_frequency: string;
  drift_status: string;
  recommended_action: string;
  created_at: string;
  status: 'Open' | 'Scheduled' | 'Resolved';
}

export interface NetworkKPIs {
  total_stations: number;
  active_sensors: number;
  anomalies_detected: number;
  critical_alerts: number;
  network_health_pct?: number;
  data_quality_pct?: number | string;
  valid_records?: string;
  data_freshness?: string;
  api_status?: string;
  api_latency?: string;
  data_source?: string;
  offline_stations?: number;
  timestamp: string;
}

export interface SystemStatus {
  status: string;
  mode: 'LIVE' | 'DEMO';
  source: string;
  disclaimer: string;
  api_status: string;
  last_updated: string;
  next_refresh_seconds?: number;
  kpis: NetworkKPIs;
  ai_brief: string;
  national_stats?: {
    avg_temperature: number | null;
    avg_pressure: number | null;
    avg_humidity: number | null;
    highest_temp_location: string;
    lowest_temp_location: string;
  };
  data_quality?: {
    completeness_pct: string;
    validity_pct: string;
    freshness_seconds: string;
    valid_records: string;
    api_latency_ms: string;
    api_status: string;
  };
}

export interface IncidentReport {
  report_id: string;
  title: string;
  organization: string;
  classification: string;
  generated_at: string;
  station_info: {
    station_id: string;
    name: string;
    region: string;
    state: string;
    coordinates: string;
    elevation_m: number;
  };
  anomaly_details: {
    parameter: string;
    observed_value: number;
    expected_value: number;
    deviation: number;
    severity: string;
    confidence_pct: number;
    anomaly_score: number;
    classification_type: string;
  };
  ai_attribution: {
    probable_root_cause: string;
    event_authenticity: string;
    feature_weights: FeatureContribution[];
    scientific_explanation: string;
  };
  self_healing: {
    imputed_value: number;
    imputation_confidence: number;
    data_lineage: Record<string, any>;
    action_status: string;
  };
  maintenance: {
    recommended_action: string;
    dispatch_priority: string;
  };
}
