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
}

export interface MaintenanceTicket {
  id: string;
  stationId: string;
  stationName: string;
  sensor: SensorType;
  issue: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  status: 'Pending Dispatch' | 'In Progress' | 'Resolved';
  assignedTo?: string;
  reportedAt: string;
  recommendedAction: string;
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
