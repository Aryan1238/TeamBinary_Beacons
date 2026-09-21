export interface AWSStation {
  id: string;
  name: string;
  location: string;
  state: string;
  elevationMeters: number;
  sensorArray: string[];
  transmissionStatus: 'ONLINE' | 'STANDBY' | 'DEGRADED';
  lastPing: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface StatMetric {
  title: string;
  value: string;
  badge?: string;
  statusType?: 'success' | 'warning' | 'info' | 'neutral';
  helperText?: string;
}

export type DashboardNavTab = 'overview' | 'stations' | 'telemetry' | 'anomalies' | 'diagnostics';
