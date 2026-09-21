import { AWSStation, AnomalyAlert, MaintenanceTicket } from '../types/dashboard.types';

export const MOCK_STATIONS: AWSStation[] = [
  {
    id: 'AWS-001',
    name: 'Safdarjung Observatory',
    location: 'New Delhi',
    state: 'Delhi (NCR)',
    region: 'North',
    elevationMeters: 216,
    coordinates: { lat: 28.584, lng: 77.206 },
    status: 'NORMAL',
    healthScore: 98,
    lastPingSeconds: 2,
    sensors: {
      temperature: { value: 28.4, unit: '°C', status: 'NORMAL', min24h: 21.2, max24h: 31.8, expectedMin: 22.0, expectedMax: 32.5, lastUpdated: '1s ago' },
      humidity: { value: 64, unit: '%', status: 'NORMAL', min24h: 42, max24h: 78, expectedMin: 40, expectedMax: 80, lastUpdated: '1s ago' },
      pressure: { value: 1008.2, unit: 'hPa', status: 'NORMAL', min24h: 1005.1, max24h: 1011.4, expectedMin: 1004.0, expectedMax: 1013.0, lastUpdated: '1s ago' },
      wind: { value: 12.4, unit: 'km/h', status: 'NORMAL', min24h: 3.1, max24h: 18.6, expectedMin: 2.0, expectedMax: 25.0, lastUpdated: '1s ago' },
      rainfall: { value: 0.0, unit: 'mm', status: 'NORMAL', min24h: 0.0, max24h: 0.2, expectedMin: 0.0, expectedMax: 15.0, lastUpdated: '1s ago' }
    },
    weatherCondition: 'Clear Sky • Mild Breeze',
    forecastSummary: 'Scattered clouds expected towards evening. Barometric pressure stable.',
    calibrationDueDays: 142,
    communicationUptime: 99.8
  },
  {
    id: 'AWS-002',
    name: 'Palam Weather Array',
    location: 'New Delhi',
    state: 'Delhi (NCR)',
    region: 'North',
    elevationMeters: 228,
    coordinates: { lat: 28.568, lng: 77.112 },
    status: 'NORMAL',
    healthScore: 97,
    lastPingSeconds: 4,
    sensors: {
      temperature: { value: 29.1, unit: '°C', status: 'NORMAL', min24h: 21.8, max24h: 32.4, expectedMin: 22.0, expectedMax: 33.0, lastUpdated: '3s ago' },
      humidity: { value: 61, unit: '%', status: 'NORMAL', min24h: 39, max24h: 75, expectedMin: 38, expectedMax: 78, lastUpdated: '3s ago' },
      pressure: { value: 1007.6, unit: 'hPa', status: 'NORMAL', min24h: 1004.8, max24h: 1010.9, expectedMin: 1003.5, expectedMax: 1012.5, lastUpdated: '3s ago' },
      wind: { value: 14.1, unit: 'km/h', status: 'NORMAL', min24h: 4.0, max24h: 21.2, expectedMin: 2.0, expectedMax: 26.0, lastUpdated: '3s ago' },
      rainfall: { value: 0.0, unit: 'mm', status: 'NORMAL', min24h: 0.0, max24h: 0.0, expectedMin: 0.0, expectedMax: 10.0, lastUpdated: '3s ago' }
    },
    weatherCondition: 'Hazy Sunshine',
    forecastSummary: 'Temperature rising to 32°C. Low convective probability.',
    calibrationDueDays: 98,
    communicationUptime: 99.4
  },
  {
    id: 'AWS-003',
    name: 'Shivajinagar Research Base',
    location: 'Pune',
    state: 'Maharashtra',
    region: 'West',
    elevationMeters: 560,
    coordinates: { lat: 18.531, lng: 73.855 },
    status: 'ANOMALY',
    healthScore: 74,
    lastPingSeconds: 1,
    sensors: {
      temperature: { value: 34.8, unit: '°C', status: 'ANOMALY', min24h: 19.5, max24h: 34.8, expectedMin: 20.0, expectedMax: 29.5, lastUpdated: 'Just now' },
      humidity: { value: 58, unit: '%', status: 'NORMAL', min24h: 45, max24h: 88, expectedMin: 45, expectedMax: 85, lastUpdated: 'Just now' },
      pressure: { value: 1008.0, unit: 'hPa', status: 'NORMAL', min24h: 1006.2, max24h: 1012.0, expectedMin: 1005.0, expectedMax: 1013.0, lastUpdated: 'Just now' },
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
    name: 'HAL Airport Station',
    location: 'Bengaluru',
    state: 'Karnataka',
    region: 'South',
    elevationMeters: 920,
    coordinates: { lat: 12.956, lng: 77.665 },
    status: 'NORMAL',
    healthScore: 99,
    lastPingSeconds: 3,
    sensors: {
      temperature: { value: 26.2, unit: '°C', status: 'NORMAL', min24h: 18.0, max24h: 28.5, expectedMin: 17.5, expectedMax: 29.0, lastUpdated: '2s ago' },
      humidity: { value: 72, unit: '%', status: 'NORMAL', min24h: 55, max24h: 92, expectedMin: 50, expectedMax: 95, lastUpdated: '2s ago' },
      pressure: { value: 914.5, unit: 'hPa', status: 'NORMAL', min24h: 912.0, max24h: 917.2, expectedMin: 910.0, expectedMax: 919.0, lastUpdated: '2s ago' },
      wind: { value: 16.2, unit: 'km/h', status: 'NORMAL', min24h: 5.0, max24h: 24.0, expectedMin: 3.0, expectedMax: 30.0, lastUpdated: '2s ago' },
      rainfall: { value: 1.2, unit: 'mm', status: 'NORMAL', min24h: 0.0, max24h: 4.8, expectedMin: 0.0, expectedMax: 20.0, lastUpdated: '2s ago' }
    },
    weatherCondition: 'Scattered Showers',
    forecastSummary: 'Light pre-monsoon precipitation observed. High sensor confidence.',
    calibrationDueDays: 205,
    communicationUptime: 99.9
  },
  {
    id: 'AWS-005',
    name: 'Alipore Weather Base',
    location: 'Kolkata',
    state: 'West Bengal',
    region: 'East',
    elevationMeters: 9,
    coordinates: { lat: 22.533, lng: 88.333 },
    status: 'NORMAL',
    healthScore: 95,
    lastPingSeconds: 5,
    sensors: {
      temperature: { value: 31.4, unit: '°C', status: 'NORMAL', min24h: 25.1, max24h: 34.0, expectedMin: 24.0, expectedMax: 35.0, lastUpdated: '4s ago' },
      humidity: { value: 84, unit: '%', status: 'NORMAL', min24h: 68, max24h: 96, expectedMin: 60, expectedMax: 98, lastUpdated: '4s ago' },
      pressure: { value: 1006.1, unit: 'hPa', status: 'NORMAL', min24h: 1003.5, max24h: 1009.2, expectedMin: 1002.0, expectedMax: 1011.0, lastUpdated: '4s ago' },
      wind: { value: 18.5, unit: 'km/h', status: 'NORMAL', min24h: 6.0, max24h: 26.0, expectedMin: 4.0, expectedMax: 35.0, lastUpdated: '4s ago' },
      rainfall: { value: 6.4, unit: 'mm', status: 'NORMAL', min24h: 0.0, max24h: 12.0, expectedMin: 0.0, expectedMax: 40.0, lastUpdated: '4s ago' }
    },
    weatherCondition: 'Humid Overcast',
    forecastSummary: 'Coastal maritime moisture surge. Telemetry nominal.',
    calibrationDueDays: 88,
    communicationUptime: 98.7
  },
  {
    id: 'AWS-006',
    name: 'Sanganer Field Office',
    location: 'Jaipur',
    state: 'Rajasthan',
    region: 'North',
    elevationMeters: 390,
    coordinates: { lat: 26.828, lng: 75.805 },
    status: 'NORMAL',
    healthScore: 96,
    lastPingSeconds: 3,
    sensors: {
      temperature: { value: 33.2, unit: '°C', status: 'NORMAL', min24h: 23.0, max24h: 36.5, expectedMin: 22.0, expectedMax: 37.0, lastUpdated: '2s ago' },
      humidity: { value: 38, unit: '%', status: 'NORMAL', min24h: 22, max24h: 54, expectedMin: 20, expectedMax: 60, lastUpdated: '2s ago' },
      pressure: { value: 998.4, unit: 'hPa', status: 'NORMAL', min24h: 995.2, max24h: 1002.0, expectedMin: 994.0, expectedMax: 1004.0, lastUpdated: '2s ago' },
      wind: { value: 19.8, unit: 'km/h', status: 'NORMAL', min24h: 8.0, max24h: 28.0, expectedMin: 5.0, expectedMax: 35.0, lastUpdated: '2s ago' },
      rainfall: { value: 0.0, unit: 'mm', status: 'NORMAL', min24h: 0.0, max24h: 0.0, expectedMin: 0.0, expectedMax: 2.0, lastUpdated: '2s ago' }
    },
    weatherCondition: 'Arid Dry Winds',
    forecastSummary: 'Typical diurnal temperature amplitude. Heat envelope consistent.',
    calibrationDueDays: 165,
    communicationUptime: 99.2
  },
  {
    id: 'AWS-007',
    name: 'Begumpet Met Station',
    location: 'Hyderabad',
    state: 'Telangana',
    region: 'South',
    elevationMeters: 535,
    coordinates: { lat: 17.453, lng: 78.468 },
    status: 'NORMAL',
    healthScore: 98,
    lastPingSeconds: 2,
    sensors: {
      temperature: { value: 29.8, unit: '°C', status: 'NORMAL', min24h: 22.0, max24h: 32.5, expectedMin: 21.0, expectedMax: 33.0, lastUpdated: '1s ago' },
      humidity: { value: 59, unit: '%', status: 'NORMAL', min24h: 42, max24h: 76, expectedMin: 40, expectedMax: 80, lastUpdated: '1s ago' },
      pressure: { value: 954.2, unit: 'hPa', status: 'NORMAL', min24h: 951.8, max24h: 958.0, expectedMin: 950.0, expectedMax: 960.0, lastUpdated: '1s ago' },
      wind: { value: 11.2, unit: 'km/h', status: 'NORMAL', min24h: 3.5, max24h: 17.0, expectedMin: 2.0, expectedMax: 22.0, lastUpdated: '1s ago' },
      rainfall: { value: 0.0, unit: 'mm', status: 'NORMAL', min24h: 0.0, max24h: 1.5, expectedMin: 0.0, expectedMax: 10.0, lastUpdated: '1s ago' }
    },
    weatherCondition: 'Partly Cloudy',
    forecastSummary: 'Moderate plateau ventilation. Sensor status optimal.',
    calibrationDueDays: 114,
    communicationUptime: 99.7
  },
  {
    id: 'AWS-008',
    name: 'Colaba Coastal Radar',
    location: 'Mumbai',
    state: 'Maharashtra',
    region: 'West',
    elevationMeters: 14,
    coordinates: { lat: 18.898, lng: 72.808 },
    status: 'NORMAL',
    healthScore: 94,
    lastPingSeconds: 4,
    sensors: {
      temperature: { value: 30.2, unit: '°C', status: 'NORMAL', min24h: 26.0, max24h: 32.8, expectedMin: 25.0, expectedMax: 33.5, lastUpdated: '3s ago' },
      humidity: { value: 81, unit: '%', status: 'NORMAL', min24h: 65, max24h: 92, expectedMin: 60, expectedMax: 95, lastUpdated: '3s ago' },
      pressure: { value: 1007.8, unit: 'hPa', status: 'NORMAL', min24h: 1005.1, max24h: 1010.5, expectedMin: 1004.0, expectedMax: 1012.0, lastUpdated: '3s ago' },
      wind: { value: 22.4, unit: 'km/h', status: 'NORMAL', min24h: 10.0, max24h: 34.0, expectedMin: 8.0, expectedMax: 40.0, lastUpdated: '3s ago' },
      rainfall: { value: 0.0, unit: 'mm', status: 'NORMAL', min24h: 0.0, max24h: 2.2, expectedMin: 0.0, expectedMax: 15.0, lastUpdated: '3s ago' }
    },
    weatherCondition: 'Sea Breeze • High Moisture',
    forecastSummary: 'Strong onshore gusts from Arabian Sea. All transducers calibrated.',
    calibrationDueDays: 73,
    communicationUptime: 98.9
  },
  {
    id: 'AWS-009',
    name: 'Aerodrome Node',
    location: 'Srinagar',
    state: 'Jammu & Kashmir',
    region: 'North',
    elevationMeters: 1585,
    coordinates: { lat: 33.987, lng: 74.774 },
    status: 'WARNING',
    healthScore: 82,
    lastPingSeconds: 28,
    sensors: {
      temperature: { value: 14.2, unit: '°C', status: 'NORMAL', min24h: 6.5, max24h: 18.0, expectedMin: 6.0, expectedMax: 19.0, lastUpdated: '25s ago' },
      humidity: { value: 68, unit: '%', status: 'WARNING', min24h: 45, max24h: 90, expectedMin: 40, expectedMax: 85, lastUpdated: '25s ago' },
      pressure: { value: 842.1, unit: 'hPa', status: 'NORMAL', min24h: 839.0, max24h: 846.0, expectedMin: 838.0, expectedMax: 848.0, lastUpdated: '25s ago' },
      wind: { value: 6.5, unit: 'km/h', status: 'NORMAL', min24h: 1.0, max24h: 14.0, expectedMin: 1.0, expectedMax: 20.0, lastUpdated: '25s ago' },
      rainfall: { value: 0.0, unit: 'mm', status: 'NORMAL', min24h: 0.0, max24h: 0.0, expectedMin: 0.0, expectedMax: 8.0, lastUpdated: '25s ago' }
    },
    weatherCondition: 'Alpine Valley Cool',
    forecastSummary: 'Intermittent hygrometer telemetry lag. Maintenance flag raised.',
    calibrationDueDays: 6,
    communicationUptime: 92.4
  },
  {
    id: 'AWS-010',
    name: 'Borjhar Observatory',
    location: 'Guwahati',
    state: 'Assam',
    region: 'Northeast',
    elevationMeters: 55,
    coordinates: { lat: 26.106, lng: 91.585 },
    status: 'NORMAL',
    healthScore: 97,
    lastPingSeconds: 3,
    sensors: {
      temperature: { value: 27.6, unit: '°C', status: 'NORMAL', min24h: 21.0, max24h: 30.2, expectedMin: 20.0, expectedMax: 31.0, lastUpdated: '2s ago' },
      humidity: { value: 88, unit: '%', status: 'NORMAL', min24h: 70, max24h: 98, expectedMin: 65, expectedMax: 99, lastUpdated: '2s ago' },
      pressure: { value: 1004.2, unit: 'hPa', status: 'NORMAL', min24h: 1001.0, max24h: 1007.5, expectedMin: 1000.0, expectedMax: 1009.0, lastUpdated: '2s ago' },
      wind: { value: 7.2, unit: 'km/h', status: 'NORMAL', min24h: 2.0, max24h: 16.0, expectedMin: 1.0, expectedMax: 22.0, lastUpdated: '2s ago' },
      rainfall: { value: 14.2, unit: 'mm', status: 'NORMAL', min24h: 0.0, max24h: 28.0, expectedMin: 0.0, expectedMax: 50.0, lastUpdated: '2s ago' }
    },
    weatherCondition: 'Moderate Riverine Rain',
    forecastSummary: 'Brahmaputra basin convective cell active. Pluviometer tracking steady.',
    calibrationDueDays: 130,
    communicationUptime: 99.5
  },
  {
    id: 'AWS-011',
    name: 'Bairagarh Station',
    location: 'Bhopal',
    state: 'Madhya Pradesh',
    region: 'Central',
    elevationMeters: 523,
    coordinates: { lat: 23.287, lng: 77.345 },
    status: 'WARNING',
    healthScore: 86,
    lastPingSeconds: 6,
    sensors: {
      temperature: { value: 31.0, unit: '°C', status: 'NORMAL', min24h: 22.4, max24h: 33.8, expectedMin: 21.5, expectedMax: 34.0, lastUpdated: '5s ago' },
      humidity: { value: 49, unit: '%', status: 'NORMAL', min24h: 32, max24h: 68, expectedMin: 30, expectedMax: 70, lastUpdated: '5s ago' },
      pressure: { value: 968.2, unit: 'hPa', status: 'WARNING', min24h: 954.0, max24h: 971.0, expectedMin: 952.0, expectedMax: 960.0, lastUpdated: '5s ago' },
      wind: { value: 13.0, unit: 'km/h', status: 'NORMAL', min24h: 4.0, max24h: 20.0, expectedMin: 2.0, expectedMax: 25.0, lastUpdated: '5s ago' },
      rainfall: { value: 0.0, unit: 'mm', status: 'NORMAL', min24h: 0.0, max24h: 0.0, expectedMin: 0.0, expectedMax: 5.0, lastUpdated: '5s ago' }
    },
    weatherCondition: 'Dry Interior Atmosphere',
    forecastSummary: 'Uncharacteristic +12 hPa barometric pressure shift. Transducer baseline verification in queue.',
    calibrationDueDays: 18,
    communicationUptime: 95.8
  },
  {
    id: 'AWS-012',
    name: 'Chandrasekharpur Array',
    location: 'Bhubaneswar',
    state: 'Odisha',
    region: 'East',
    elevationMeters: 45,
    coordinates: { lat: 20.325, lng: 85.819 },
    status: 'OFFLINE',
    healthScore: 61,
    lastPingSeconds: 780,
    sensors: {
      temperature: { value: 30.5, unit: '°C', status: 'OFFLINE', min24h: 24.5, max24h: 33.0, expectedMin: 24.0, expectedMax: 34.0, lastUpdated: '13m ago' },
      humidity: { value: 78, unit: '%', status: 'OFFLINE', min24h: 60, max24h: 90, expectedMin: 55, expectedMax: 92, lastUpdated: '13m ago' },
      pressure: { value: 1007.0, unit: 'hPa', status: 'OFFLINE', min24h: 1004.0, max24h: 1009.5, expectedMin: 1003.0, expectedMax: 1011.0, lastUpdated: '13m ago' },
      wind: { value: 15.0, unit: 'km/h', status: 'OFFLINE', min24h: 5.0, max24h: 22.0, expectedMin: 4.0, expectedMax: 28.0, lastUpdated: '13m ago' },
      rainfall: { value: 0.0, unit: 'mm', status: 'OFFLINE', min24h: 0.0, max24h: 3.5, expectedMin: 0.0, expectedMax: 25.0, lastUpdated: '13m ago' }
    },
    weatherCondition: 'Telemetry Signal Loss',
    forecastSummary: 'Cellular modem heartbeat timed out. Solar battery voltage check dispatched.',
    calibrationDueDays: 45,
    communicationUptime: 84.1
  }
];

export const MOCK_ANOMALIES: AnomalyAlert[] = [
  {
    id: 'A-1042',
    stationId: 'AWS-003',
    stationName: 'Shivajinagar Research Base',
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
      crossStation: 'Nearby stations AWS-001 (28.4°C), AWS-002 (29.1°C), and AWS-004 (26.2°C) exhibit stable baseline.',
      physicalConsistency: 'Relative humidity did not exhibit corresponding thermodynamic drop according to Clausius-Clapeyron envelope.',
      recommendedAction: 'Inspect solar radiation shield ventilation fan and check thermistor ADC calibration.'
    }
  },
  {
    id: 'A-1043',
    stationId: 'AWS-011',
    stationName: 'Bairagarh Station',
    location: 'Bhopal, Madhya Pradesh',
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
      crossStation: 'Central regional stations show uniform 954 hPa isobars without frontal passage.',
      physicalConsistency: 'Wind velocity did not register squall gradient expected for a 12 hPa pressure step.',
      recommendedAction: 'Verify piezo-resistive pressure port for dust blockage or moisture condensation.'
    }
  },
  {
    id: 'A-1044',
    stationId: 'AWS-009',
    stationName: 'Aerodrome Node',
    location: 'Srinagar, Jammu & Kashmir',
    sensor: 'humidity',
    title: 'Hygrometer Transducer Drift Warning',
    description: 'Capacitive relative humidity sensor showing intermittent output clamping and slow response curve.',
    severity: 'LOW',
    observedValue: '68% (Lagging)',
    expectedRange: '74% – 82%',
    deviationPercent: 8.5,
    detectedAt: '1 hr ago',
    status: 'Open',
    evidence: {
      historical: 'Response time during valley fog dissipated 3x slower than station 5-year seasonal normal.',
      crossStation: 'High mountain valley microclimate comparison suggests local sensor contamination.',
      physicalConsistency: 'Dew point calculated from temperature deviates by 4.2°C from ambient psychrometric balance.',
      recommendedAction: 'Clean capacitive sensor polymer mesh and perform salt chamber calibration.'
    }
  }
];

export const MOCK_MAINTENANCE_TICKETS: MaintenanceTicket[] = [
  {
    id: 'MNT-2026-081',
    stationId: 'AWS-003',
    stationName: 'Shivajinagar Research Base',
    sensor: 'temperature',
    issue: 'Thermistor ADC Calibration Drift & Thermal Spike',
    priority: 'HIGH',
    status: 'In Progress',
    assignedTo: 'Regional Field Unit 2 (Pune)',
    reportedAt: 'Today, 14:15 IST',
    recommendedAction: 'Replace PT100 probe and verify aspirated shield intake.'
  },
  {
    id: 'MNT-2026-079',
    stationId: 'AWS-012',
    stationName: 'Chandrasekharpur Array',
    sensor: 'rainfall',
    issue: 'Communication Timeout / Solar Battery Under-voltage',
    priority: 'CRITICAL',
    status: 'Pending Dispatch',
    assignedTo: 'Eastern Grid Emergency Team',
    reportedAt: 'Today, 13:40 IST',
    recommendedAction: 'Replace 12V 40Ah AGM battery pack and clean solar array.'
  },
  {
    id: 'MNT-2026-075',
    stationId: 'AWS-011',
    sensor: 'pressure',
    stationName: 'Bairagarh Station',
    issue: 'Piezo Barometer Port Occlusion',
    priority: 'MEDIUM',
    status: 'Pending Dispatch',
    assignedTo: 'Central Technical Depot',
    reportedAt: 'Yesterday, 18:20 IST',
    recommendedAction: 'Blow clear static pressure port with dry nitrogen.'
  },
  {
    id: 'MNT-2026-068',
    stationId: 'AWS-008',
    sensor: 'wind',
    stationName: 'Colaba Coastal Radar',
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

// Jaipur AWS-003 Anomaly Spike Curve
const JAIPUR_SPIKE_CURVE: HistoryPoint[] = DEFAULT_CURVE.map((pt) => {
  if (pt.time === '14:00' || pt.time === '14:30' || pt.time === '15:00') {
    return { ...pt, temperature: 48.6, humidity: 94 };
  }
  return pt;
});

// Record keyed by station ID
export const MOCK_24H_HISTORY: Record<string, HistoryPoint[]> = {
  'AWS-001': DEFAULT_CURVE,
  'AWS-002': DEFAULT_CURVE.map(p => ({ ...p, temperature: p.temperature - 10 })),
  'AWS-003': JAIPUR_SPIKE_CURVE,
  'AWS-004': DEFAULT_CURVE.map(p => ({ ...p, temperature: p.temperature + 3 })),
  'AWS-005': DEFAULT_CURVE.map(p => ({ ...p, humidity: p.humidity + 10 })),
  'AWS-006': DEFAULT_CURVE,
  'AWS-007': DEFAULT_CURVE,
  'AWS-008': DEFAULT_CURVE,
  'AWS-009': DEFAULT_CURVE.map(p => ({ ...p, temperature: p.temperature - 12 })),
  'AWS-010': DEFAULT_CURVE.map(p => ({ ...p, rainfall: p.rainfall + 12 })),
  'AWS-011': DEFAULT_CURVE,
  'AWS-012': DEFAULT_CURVE,
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
