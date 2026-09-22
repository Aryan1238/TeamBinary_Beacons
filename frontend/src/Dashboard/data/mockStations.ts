import { AWSStation, AnomalyAlert, MaintenanceTicket } from '../types/dashboard.types';

export const MOCK_STATIONS: AWSStation[] = [
  {
    id: 'AWS-001',
    name: 'Chennai / Minambakkam Intl',
    location: 'Chennai',
    state: 'Tamil Nadu',
    region: 'South',
    elevationMeters: 16,
    coordinates: { lat: 12.9900, lng: 80.1693 },
    dataSource: '[Meteostat + NOAA]',
    meteostatId: '43279',
    noaaId: '43279099999',
    status: 'NORMAL',
    healthScore: 99,
    lastPingSeconds: 2,
    sensors: {
      temperature: { value: 29.8, unit: '°C', status: 'NORMAL', min24h: 24.2, max24h: 33.1, expectedMin: 24.0, expectedMax: 34.0, lastUpdated: '1s ago' },
      humidity: { value: 78, unit: '%', status: 'NORMAL', min24h: 62, max24h: 89, expectedMin: 55, expectedMax: 92, lastUpdated: '1s ago' },
      pressure: { value: 1009.4, unit: 'hPa', status: 'NORMAL', min24h: 1006.8, max24h: 1012.1, expectedMin: 1005.0, expectedMax: 1014.0, lastUpdated: '1s ago' },
      wind: { value: 15.2, unit: 'km/h', status: 'NORMAL', min24h: 5.4, max24h: 24.1, expectedMin: 4.0, expectedMax: 30.0, lastUpdated: '1s ago' },
      rainfall: { value: 0.0, unit: 'mm', status: 'NORMAL', min24h: 0.0, max24h: 1.2, expectedMin: 0.0, expectedMax: 15.0, lastUpdated: '1s ago' }
    },
    weatherCondition: 'Humid Coastal Breeze • Partly Cloudy',
    forecastSummary: 'Maritime boundary flow stable with nominal barometric pressure.',
    calibrationDueDays: 180,
    communicationUptime: 99.9
  },
  {
    id: 'AWS-002',
    name: 'Bengaluru / HAL Airport',
    location: 'Bengaluru',
    state: 'Karnataka',
    region: 'South',
    elevationMeters: 888,
    coordinates: { lat: 12.9500, lng: 77.6680 },
    dataSource: '[Meteostat + NOAA]',
    meteostatId: '43295',
    noaaId: '43295099999',
    status: 'NORMAL',
    healthScore: 98,
    lastPingSeconds: 3,
    sensors: {
      temperature: { value: 24.6, unit: '°C', status: 'NORMAL', min24h: 18.2, max24h: 28.4, expectedMin: 17.5, expectedMax: 29.0, lastUpdated: '2s ago' },
      humidity: { value: 65, unit: '%', status: 'NORMAL', min24h: 48, max24h: 84, expectedMin: 45, expectedMax: 88, lastUpdated: '2s ago' },
      pressure: { value: 918.2, unit: 'hPa', status: 'NORMAL', min24h: 915.1, max24h: 921.4, expectedMin: 914.0, expectedMax: 923.0, lastUpdated: '2s ago' },
      wind: { value: 11.8, unit: 'km/h', status: 'NORMAL', min24h: 3.5, max24h: 18.2, expectedMin: 2.0, expectedMax: 22.0, lastUpdated: '2s ago' },
      rainfall: { value: 0.0, unit: 'mm', status: 'NORMAL', min24h: 0.0, max24h: 0.5, expectedMin: 0.0, expectedMax: 10.0, lastUpdated: '2s ago' }
    },
    weatherCondition: 'Pleasant Plateau Breeze • Scattered Clouds',
    forecastSummary: 'High plateau ventilation active. Sensors calibrated and nominal.',
    calibrationDueDays: 145,
    communicationUptime: 99.8
  },
  {
    id: 'AWS-003',
    name: 'Pune',
    location: 'Pune',
    state: 'Maharashtra',
    region: 'West',
    elevationMeters: 592,
    coordinates: { lat: 18.5800, lng: 73.9197 },
    dataSource: '[Meteostat + NOAA]',
    meteostatId: '43063',
    noaaId: '43063099999',
    status: 'ANOMALY',
    healthScore: 74,
    lastPingSeconds: 1,
    sensors: {
      temperature: { value: 34.8, unit: '°C', status: 'ANOMALY', min24h: 19.5, max24h: 34.8, expectedMin: 20.0, expectedMax: 29.5, lastUpdated: 'Just now' },
      humidity: { value: 58, unit: '%', status: 'NORMAL', min24h: 45, max24h: 88, expectedMin: 45, expectedMax: 85, lastUpdated: 'Just now' },
      pressure: { value: 948.5, unit: 'hPa', status: 'NORMAL', min24h: 945.8, max24h: 951.2, expectedMin: 944.0, expectedMax: 953.0, lastUpdated: 'Just now' },
      wind: { value: 8.6, unit: 'km/h', status: 'NORMAL', min24h: 2.0, max24h: 15.0, expectedMin: 1.0, expectedMax: 20.0, lastUpdated: 'Just now' },
      rainfall: { value: 0.0, unit: 'mm', status: 'NORMAL', min24h: 0.0, max24h: 0.0, expectedMin: 0.0, expectedMax: 5.0, lastUpdated: 'Just now' }
    },
    weatherCondition: 'Isolated Thermal Discrepancy',
    forecastSummary: 'Sudden +5.3°C deviation from regional cluster. Physical rate-of-change violated.',
    calibrationDueDays: 12,
    communicationUptime: 96.1
  },
  {
    id: 'AWS-004',
    name: 'Mumbai / Santacruz Intl',
    location: 'Mumbai',
    state: 'Maharashtra',
    region: 'West',
    elevationMeters: 14,
    coordinates: { lat: 19.0886, lng: 72.8679 },
    dataSource: '[Meteostat + NOAA]',
    meteostatId: '43057',
    noaaId: '43057099999',
    status: 'NORMAL',
    healthScore: 96,
    lastPingSeconds: 4,
    sensors: {
      temperature: { value: 30.5, unit: '°C', status: 'NORMAL', min24h: 25.8, max24h: 33.2, expectedMin: 25.0, expectedMax: 34.0, lastUpdated: '3s ago' },
      humidity: { value: 79, unit: '%', status: 'NORMAL', min24h: 63, max24h: 90, expectedMin: 58, expectedMax: 94, lastUpdated: '3s ago' },
      pressure: { value: 1008.2, unit: 'hPa', status: 'NORMAL', min24h: 1005.4, max24h: 1010.9, expectedMin: 1004.0, expectedMax: 1012.0, lastUpdated: '3s ago' },
      wind: { value: 21.0, unit: 'km/h', status: 'NORMAL', min24h: 8.5, max24h: 31.0, expectedMin: 6.0, expectedMax: 38.0, lastUpdated: '3s ago' },
      rainfall: { value: 0.0, unit: 'mm', status: 'NORMAL', min24h: 0.0, max24h: 1.8, expectedMin: 0.0, expectedMax: 15.0, lastUpdated: '3s ago' }
    },
    weatherCondition: 'Sea Breeze • High Moisture',
    forecastSummary: 'Strong onshore gusts from Arabian Sea. All transducers calibrated.',
    calibrationDueDays: 73,
    communicationUptime: 98.9
  },
  {
    id: 'AWS-005',
    name: 'Kolkata / Dum Dum Intl',
    location: 'Kolkata',
    state: 'West Bengal',
    region: 'East',
    elevationMeters: 6,
    coordinates: { lat: 22.6547, lng: 88.4467 },
    dataSource: '[Meteostat + NOAA]',
    meteostatId: '42809',
    noaaId: '42809099999',
    status: 'NORMAL',
    healthScore: 95,
    lastPingSeconds: 5,
    sensors: {
      temperature: { value: 31.2, unit: '°C', status: 'NORMAL', min24h: 24.8, max24h: 34.5, expectedMin: 24.0, expectedMax: 35.0, lastUpdated: '4s ago' },
      humidity: { value: 84, unit: '%', status: 'NORMAL', min24h: 68, max24h: 96, expectedMin: 60, expectedMax: 98, lastUpdated: '4s ago' },
      pressure: { value: 1006.8, unit: 'hPa', status: 'NORMAL', min24h: 1003.8, max24h: 1009.6, expectedMin: 1002.0, expectedMax: 1011.0, lastUpdated: '4s ago' },
      wind: { value: 16.5, unit: 'km/h', status: 'NORMAL', min24h: 5.0, max24h: 25.0, expectedMin: 4.0, expectedMax: 32.0, lastUpdated: '4s ago' },
      rainfall: { value: 2.4, unit: 'mm', status: 'NORMAL', min24h: 0.0, max24h: 8.0, expectedMin: 0.0, expectedMax: 35.0, lastUpdated: '4s ago' }
    },
    weatherCondition: 'Humid Overcast • Delta Maritime',
    forecastSummary: 'Gangetic delta moisture surge. Telemetry within nominal envelope.',
    calibrationDueDays: 88,
    communicationUptime: 98.7
  },
  {
    id: 'AWS-006',
    name: 'Ahmedabad / Sardar Vallabhbhai Patel Intl',
    location: 'Ahmedabad',
    state: 'Gujarat',
    region: 'West',
    elevationMeters: 55,
    coordinates: { lat: 23.0725, lng: 72.6347 },
    dataSource: '[Meteostat + NOAA]',
    meteostatId: '42647',
    noaaId: '42647099999',
    status: 'NORMAL',
    healthScore: 97,
    lastPingSeconds: 3,
    sensors: {
      temperature: { value: 33.5, unit: '°C', status: 'NORMAL', min24h: 22.8, max24h: 36.8, expectedMin: 22.0, expectedMax: 38.0, lastUpdated: '2s ago' },
      humidity: { value: 42, unit: '%', status: 'NORMAL', min24h: 24, max24h: 62, expectedMin: 20, expectedMax: 68, lastUpdated: '2s ago' },
      pressure: { value: 1004.2, unit: 'hPa', status: 'NORMAL', min24h: 1001.2, max24h: 1007.8, expectedMin: 1000.0, expectedMax: 1010.0, lastUpdated: '2s ago' },
      wind: { value: 14.8, unit: 'km/h', status: 'NORMAL', min24h: 4.2, max24h: 22.5, expectedMin: 3.0, expectedMax: 28.0, lastUpdated: '2s ago' },
      rainfall: { value: 0.0, unit: 'mm', status: 'NORMAL', min24h: 0.0, max24h: 0.0, expectedMin: 0.0, expectedMax: 5.0, lastUpdated: '2s ago' }
    },
    weatherCondition: 'Dry Semi-Arid Heat • Clear Sky',
    forecastSummary: 'Diurnal heating within historical envelope. Barometric transducer nominal.',
    calibrationDueDays: 115,
    communicationUptime: 99.4
  },
  {
    id: 'AWS-007',
    name: 'Hyderabad / Begumpet',
    location: 'Hyderabad',
    state: 'Telangana',
    region: 'South',
    elevationMeters: 531,
    coordinates: { lat: 17.4531, lng: 78.4676 },
    dataSource: '[Meteostat + NOAA]',
    meteostatId: '43128',
    noaaId: '43128099999',
    status: 'WARNING',
    healthScore: 86,
    lastPingSeconds: 6,
    sensors: {
      temperature: { value: 29.8, unit: '°C', status: 'NORMAL', min24h: 22.0, max24h: 32.5, expectedMin: 21.0, expectedMax: 33.0, lastUpdated: '1s ago' },
      humidity: { value: 59, unit: '%', status: 'NORMAL', min24h: 42, max24h: 76, expectedMin: 40, expectedMax: 80, lastUpdated: '1s ago' },
      pressure: { value: 968.2, unit: 'hPa', status: 'WARNING', min24h: 954.0, max24h: 971.0, expectedMin: 952.0, expectedMax: 960.0, lastUpdated: '5s ago' },
      wind: { value: 11.2, unit: 'km/h', status: 'NORMAL', min24h: 3.5, max24h: 17.0, expectedMin: 2.0, expectedMax: 22.0, lastUpdated: '1s ago' },
      rainfall: { value: 0.0, unit: 'mm', status: 'NORMAL', min24h: 0.0, max24h: 1.5, expectedMin: 0.0, expectedMax: 10.0, lastUpdated: '1s ago' }
    },
    weatherCondition: 'Deccan Plateau Clear • Pressure Deviation',
    forecastSummary: 'Barometric transducer reporting step change relative to synoptic pressure field.',
    calibrationDueDays: 22,
    communicationUptime: 97.5
  }
];

export const MOCK_ANOMALIES: AnomalyAlert[] = [
  {
    id: 'A-1042',
    stationId: 'AWS-003',
    stationName: 'Pune',
    location: 'Pune, Maharashtra',
    sensor: 'temperature',
    title: 'Sudden Temperature Spike (+5.3°C)',
    description: 'Thermistor recorded +5.3°C increase in 10 minutes under calm regional meteorological conditions.',
    severity: 'HIGH',
    observedValue: '34.8°C',
    expectedRange: '27.5°C – 29.5°C',
    deviationPercent: 18.0,
    detectedAt: '12 mins ago',
    status: 'Investigating',
    evidence: {
      historical: 'Violates historical diurnal rate of change (< 2.2°C/hr at 14:00 local solar time).',
      crossStation: 'Nearby stations AWS-004 (Mumbai, 30.5°C) and AWS-006 (Ahmedabad, 33.5°C) exhibit stable baseline.',
      physicalConsistency: 'Relative humidity did not exhibit corresponding thermodynamic drop according to Clausius-Clapeyron envelope.',
      recommendedAction: 'Inspect solar radiation shield ventilation fan and check thermistor ADC calibration.'
    }
  },
  {
    id: 'A-1043',
    stationId: 'AWS-007',
    stationName: 'Hyderabad / Begumpet',
    location: 'Hyderabad, Telangana',
    sensor: 'pressure',
    title: 'Unexpected Pressure Deviation (+12 hPa)',
    description: 'Barometric transducer step change inconsistent with synoptic-scale pressure field.',
    severity: 'MEDIUM',
    observedValue: '968.2 hPa',
    expectedRange: '954.0 – 958.0 hPa',
    deviationPercent: 1.4,
    detectedAt: '34 mins ago',
    status: 'Open',
    evidence: {
      historical: 'Exceeds standard 3-hour barometric pressure tendency threshold (max allowed ±3.0 hPa/3h).',
      crossStation: 'Deccan plateau stations show uniform 954 hPa isobars without frontal passage.',
      physicalConsistency: 'Wind velocity did not register squall gradient expected for a 12 hPa pressure step.',
      recommendedAction: 'Verify piezo-resistive pressure port for dust blockage or moisture condensation.'
    }
  },
  {
    id: 'A-1044',
    stationId: 'AWS-005',
    stationName: 'Kolkata / Dum Dum Intl',
    location: 'Kolkata, West Bengal',
    sensor: 'humidity',
    title: 'Hygrometer Transducer Drift Warning',
    description: 'Capacitive relative humidity sensor showing intermittent output clamping and slow response curve.',
    severity: 'LOW',
    observedValue: '84% (Lagging)',
    expectedRange: '72% – 78%',
    deviationPercent: 7.7,
    detectedAt: '1 hr ago',
    status: 'Open',
    evidence: {
      historical: 'Response time during marine layer dissipation was 2.8x slower than seasonal normal.',
      crossStation: 'Coastal Eastern comparison indicates localized sensor mesh contamination.',
      physicalConsistency: 'Dew point calculated from temperature deviates by 3.8°C from ambient psychrometric balance.',
      recommendedAction: 'Clean capacitive sensor polymer mesh and perform chamber calibration.'
    }
  }
];

export const MOCK_MAINTENANCE_TICKETS: MaintenanceTicket[] = [
  {
    id: 'MNT-2026-081',
    stationId: 'AWS-003',
    stationName: 'Pune',
    sensor: 'temperature',
    issue: 'Thermistor ADC Calibration Drift & Thermal Spike',
    priority: 'HIGH',
    status: 'In Progress',
    assignedTo: 'Regional Field Unit (Pune)',
    reportedAt: 'Today, 14:15 IST',
    recommendedAction: 'Replace PT100 probe and verify aspirated shield intake.'
  },
  {
    id: 'MNT-2026-079',
    stationId: 'AWS-007',
    stationName: 'Hyderabad / Begumpet',
    sensor: 'pressure',
    issue: 'Piezo Barometer Port Occlusion / Deviation',
    priority: 'MEDIUM',
    status: 'Pending Dispatch',
    assignedTo: 'Southern Technical Depot (Hyderabad)',
    reportedAt: 'Today, 13:40 IST',
    recommendedAction: 'Blow clear static pressure port with dry nitrogen.'
  },
  {
    id: 'MNT-2026-075',
    stationId: 'AWS-005',
    sensor: 'humidity',
    stationName: 'Kolkata / Dum Dum Intl',
    issue: 'Capacitive Hygrometer Drift & Polymer Contamination',
    priority: 'MEDIUM',
    status: 'Pending Dispatch',
    assignedTo: 'Eastern Grid Technical Team',
    reportedAt: 'Yesterday, 18:20 IST',
    recommendedAction: 'Clean capacitive sensor polymer mesh and verify psychrometer.'
  },
  {
    id: 'MNT-2026-068',
    stationId: 'AWS-004',
    sensor: 'wind',
    stationName: 'Mumbai / Santacruz Intl',
    issue: 'Routine Anemometer Bearing Inspection',
    priority: 'MEDIUM',
    status: 'Resolved',
    assignedTo: 'Western Coastal Support',
    reportedAt: '2 days ago',
    recommendedAction: 'Ultrasonic wind sensor recalibration and mast leveling.'
  }
];

export interface HistoryPoint {
  time: string;
  temperature: number;
  humidity: number;
  pressure: number;
  wind: number;
  rainfall: number;
  expectedTemp: number;
}

const DEFAULT_CURVE: HistoryPoint[] = [
  { time: '00:00', temperature: 22.4, humidity: 82, pressure: 1007.8, wind: 6.2, rainfall: 0, expectedTemp: 22.0 },
  { time: '02:00', temperature: 21.8, humidity: 85, pressure: 1007.2, wind: 5.1, rainfall: 0, expectedTemp: 21.5 },
  { time: '04:00', temperature: 21.2, humidity: 88, pressure: 1006.8, wind: 4.8, rainfall: 0, expectedTemp: 21.1 },
  { time: '06:00', temperature: 22.0, humidity: 84, pressure: 1007.5, wind: 5.5, rainfall: 0, expectedTemp: 22.2 },
  { time: '08:00', temperature: 24.5, humidity: 76, pressure: 1008.6, wind: 8.2, rainfall: 0, expectedTemp: 24.8 },
  { time: '10:00', temperature: 27.2, humidity: 68, pressure: 1009.2, wind: 11.4, rainfall: 0, expectedTemp: 27.0 },
  { time: '12:00', temperature: 29.8, humidity: 62, pressure: 1008.8, wind: 13.5, rainfall: 0, expectedTemp: 29.2 },
  { time: '13:00', temperature: 31.0, humidity: 59, pressure: 1008.2, wind: 14.0, rainfall: 0, expectedTemp: 30.1 },
  { time: '13:30', temperature: 32.5, humidity: 58, pressure: 1008.1, wind: 12.0, rainfall: 0, expectedTemp: 30.4 },
  { time: '14:00', temperature: 33.8, humidity: 58, pressure: 1008.0, wind: 10.6, rainfall: 0, expectedTemp: 31.0 },
  { time: '14:30', temperature: 33.6, humidity: 57, pressure: 1007.9, wind: 9.1, rainfall: 0, expectedTemp: 30.8 },
  { time: '15:00', temperature: 33.2, humidity: 58, pressure: 1007.8, wind: 10.2, rainfall: 0, expectedTemp: 30.2 }
];

// Pune AWS-003 Anomaly Spike Curve
const PUNE_SPIKE_CURVE: HistoryPoint[] = DEFAULT_CURVE.map((pt) => {
  if (pt.time === '14:00' || pt.time === '14:30' || pt.time === '15:00') {
    return { ...pt, temperature: 48.6, humidity: 94 };
  }
  return pt;
});

// Record keyed by station ID
export const MOCK_24H_HISTORY: Record<string, HistoryPoint[]> = {
  'AWS-001': DEFAULT_CURVE.map(p => ({ ...p, temperature: p.temperature + 1.2, humidity: p.humidity + 5 })),
  'AWS-002': DEFAULT_CURVE.map(p => ({ ...p, temperature: p.temperature - 5.0, pressure: p.pressure - 90 })),
  'AWS-003': PUNE_SPIKE_CURVE,
  'AWS-004': DEFAULT_CURVE.map(p => ({ ...p, temperature: p.temperature + 1.8, humidity: p.humidity + 7 })),
  'AWS-005': DEFAULT_CURVE.map(p => ({ ...p, humidity: p.humidity + 10, rainfall: p.rainfall + 2 })),
  'AWS-006': DEFAULT_CURVE.map(p => ({ ...p, temperature: p.temperature + 4.5, humidity: p.humidity - 18 })),
  'AWS-007': DEFAULT_CURVE.map(p => ({ ...p, pressure: p.pressure - 40 })),
};

// Helper calculations
export const getKPISummary = () => {
  const total = MOCK_STATIONS.length;
  const online = MOCK_STATIONS.filter((s) => s.status === 'NORMAL' || s.status === 'WARNING').length;
  const anomalies = MOCK_STATIONS.filter((s) => s.status === 'ANOMALY').length;
  const healthAvg = (
    MOCK_STATIONS.reduce((acc, s) => acc + s.healthScore, 0) / total
  ).toFixed(1);

  return {
    totalStations: total,
    onlineStations: online,
    activeAnomalies: anomalies,
    systemHealth: `${healthAvg}%`
  };
};

export const getStationById = (id: string): AWSStation | undefined => {
  return MOCK_STATIONS.find((s) => s.id === id);
};

export const getAlertById = (id: string): AnomalyAlert | undefined => {
  return MOCK_ANOMALIES.find((a) => a.id === id);
};
