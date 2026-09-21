import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { MOCK_STATIONS, MOCK_24H_HISTORY, HistoryPoint } from '../data/mockStations';
import type { AWSStation, SensorType, StationStatus } from '../types/dashboard.types';

export type SimulationStatus = 'STOPPED' | 'RUNNING' | 'PAUSED';

export type FaultType =
  | 'sudden-spike'
  | 'temperature_spike'
  | 'gradual-drift'
  | 'temperature_drift'
  | 'frozen-sensor'
  | 'frozen_sensor'
  | 'humidity-spike'
  | 'pressure-drop'
  | 'communication-failure'
  | 'communication_failure';

export interface ActiveFault {
  stationId: string;
  sensor: SensorType;
  faultType: FaultType;
  label: string;
  injectedAt: string;
  originalValue: number;
  ticksActive: number;
}

export interface TelemetryLogEntry {
  id: string;
  timestamp: string;
  stationId: string;
  temperature: number;
  humidity: number;
  pressure: number;
  wind: number;
  rainfall: number;
  flag: 'normal' | 'injected' | 'failure';
  faultType?: string;
  transitionNote?: string;
}

export interface TelemetryContextType {
  stations: AWSStation[];
  simulationStatus: SimulationStatus;
  tickCount: number;
  lastTickTime: string;
  historyBuffers: Record<string, HistoryPoint[]>;
  recentReadings: Record<string, TelemetryLogEntry[]>;
  activeFaults: Record<string, ActiveFault>;
  startSimulation: () => void;
  pauseSimulation: () => void;
  resetSimulation: () => void;
  injectFault: (stationId: string, faultType: FaultType, sensor?: SensorType) => void;
  clearFault: (stationId: string) => void;
  getStation: (id: string) => AWSStation | undefined;
}

const MAX_HISTORY_BUFFER_SIZE = 35;
const MAX_RECENT_READINGS_SIZE = 30;
const SIMULATION_INTERVAL_MS = 2500;

export const getFaultLabel = (type: FaultType): string => {
  switch (type) {
    case 'sudden-spike':
    case 'temperature_spike':
      return 'Temperature Spike';
    case 'gradual-drift':
    case 'temperature_drift':
      return 'Temperature Drift';
    case 'frozen-sensor':
    case 'frozen_sensor':
      return 'Frozen Sensor';
    case 'humidity-spike':
      return 'Humidity Spike';
    case 'pressure-drop':
      return 'Pressure Drop';
    case 'communication-failure':
    case 'communication_failure':
      return 'Communication Failure';
    default:
      return 'Active Fault';
  }
};

// Deep clone baseline stations so RESET always restores exact initial state
const getBaselineStations = (): AWSStation[] => JSON.parse(JSON.stringify(MOCK_STATIONS));

// Deep clone initial history curves
const getBaselineHistory = (): Record<string, HistoryPoint[]> => JSON.parse(JSON.stringify(MOCK_24H_HISTORY));

// Generate initial recent readings from baseline history
const getBaselineRecentReadings = (): Record<string, TelemetryLogEntry[]> => {
  const initialLog: Record<string, TelemetryLogEntry[]> = {};
  MOCK_STATIONS.forEach((station) => {
    const history = MOCK_24H_HISTORY[station.id] || MOCK_24H_HISTORY['AWS-001'];
    initialLog[station.id] = history.slice(-6).map((pt, idx) => ({
      id: `${station.id}-init-${idx}`,
      timestamp: pt.time,
      stationId: station.id,
      temperature: pt.temperature,
      humidity: pt.humidity,
      pressure: pt.pressure,
      wind: pt.wind,
      rainfall: pt.rainfall,
      flag: 'normal' as const,
      transitionNote: 'Nominal telemetry stream',
    })).reverse();
  });
  return initialLog;
};

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined);

export const TelemetryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stations, setStations] = useState<AWSStation[]>(getBaselineStations);
  const [simulationStatus, setSimulationStatus] = useState<SimulationStatus>('STOPPED');
  const [tickCount, setTickCount] = useState<number>(0);
  const [lastTickTime, setLastTickTime] = useState<string>('Baseline State');
  const [historyBuffers, setHistoryBuffers] = useState<Record<string, HistoryPoint[]>>(getBaselineHistory);
  const [recentReadings, setRecentReadings] = useState<Record<string, TelemetryLogEntry[]>>(getBaselineRecentReadings);

  const [activeFaults, setActiveFaults] = useState<Record<string, ActiveFault>>({});

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * Generates realistic gradual bounded random walk telemetry, or applies active fault logic.
   */
  const generateStationUpdate = useCallback((
    station: AWSStation,
    fault: ActiveFault | undefined,
    timeString: string
  ): {
    updatedStation: AWSStation;
    newHistoryPoint: HistoryPoint | null;
    newLogEntry: TelemetryLogEntry | null;
    skipHistory: boolean;
  } => {
    // Current sensor values
    let temp = station.sensors.temperature.value;
    let hum = station.sensors.humidity.value;
    let press = station.sensors.pressure.value;
    let wind = station.sensors.wind.value;
    let rain = station.sensors.rainfall.value;

    let flag: 'normal' | 'injected' | 'failure' = 'normal';
    let transitionNote = 'Telemetry frame verified';
    let stationStatus: StationStatus = station.status === 'ANOMALY' && !fault ? 'ANOMALY' : 'NORMAL';
    let tempStatus: StationStatus = 'NORMAL';
    let humStatus: StationStatus = 'NORMAL';
    let pressStatus: StationStatus = 'NORMAL';
    let skipHistory = false;

    if (!fault) {
      // 1. Normal temperature bounded random walk (±0.15°C) with diurnal bias
      const tempDelta = (Math.random() * 0.3 - 0.15);
      temp = Math.round((temp + tempDelta) * 10) / 10;
      temp = Math.max(station.sensors.temperature.expectedMin - 0.5, Math.min(station.sensors.temperature.expectedMax + 0.5, temp));

      // 2. Relative Humidity: bounded random walk (±0.8%), inverse trend with temp
      const humDelta = (Math.random() * 1.6 - 0.8) - (tempDelta * 0.5);
      hum = Math.round(Math.max(20, Math.min(98, hum + humDelta)));

      // 3. Pressure: bounded smooth drift (±0.15 hPa)
      const pressDelta = (Math.random() * 0.3 - 0.15);
      press = Math.round((press + pressDelta) * 10) / 10;
      press = Math.max(station.sensors.pressure.expectedMin - 1.0, Math.min(station.sensors.pressure.expectedMax + 1.0, press));

      // 4. Wind speed: slightly higher variance (±0.4 km/h), non-negative
      const windDelta = (Math.random() * 0.8 - 0.4);
      wind = Math.round(Math.max(0.8, Math.min(32.0, wind + windDelta)) * 10) / 10;

      // 5. Rainfall: incremental trickle if already active rainfall, else mostly 0
      if (rain > 0 && Math.random() > 0.65) {
        rain = Math.round((rain + 0.1) * 10) / 10;
      }

      tempStatus = (temp > station.sensors.temperature.expectedMax || temp < station.sensors.temperature.expectedMin)
        ? (station.status === 'ANOMALY' ? 'ANOMALY' : 'WARNING')
        : 'NORMAL';
    } else {
      flag = 'injected';

      switch (fault.faultType) {
        case 'sudden-spike':
        case 'temperature_spike': {
          if (fault.ticksActive === 0) {
            // Abrupt step jump +11°C to +13°C
            temp = Math.round((fault.originalValue + 11.5 + (Math.random() * 1.5)) * 10) / 10;
            transitionNote = `Temperature: ${fault.originalValue.toFixed(1)}°C → ${temp.toFixed(1)}°C (Injected Spike)`;
          } else {
            // Random walk continues from new elevated baseline
            const delta = (Math.random() * 0.4 - 0.2);
            temp = Math.round((temp + delta) * 10) / 10;
            transitionNote = `Temperature: ${temp.toFixed(1)}°C (Elevated Baseline)`;
          }
          stationStatus = 'ANOMALY';
          tempStatus = 'ANOMALY';
          break;
        }

        case 'gradual-drift':
        case 'temperature_drift': {
          // Creeps steadily upward +0.7°C to +1.0°C per tick
          const driftStep = 0.75 + (Math.random() * 0.25);
          temp = Math.round((temp + driftStep) * 10) / 10;
          const totalDrift = Math.round((temp - fault.originalValue) * 10) / 10;
          transitionNote = `Temperature: ${temp.toFixed(1)}°C (+${totalDrift.toFixed(1)}°C Drift)`;
          tempStatus = totalDrift > 4.5 ? 'ANOMALY' : 'WARNING';
          stationStatus = totalDrift > 4.5 ? 'ANOMALY' : 'WARNING';
          break;
        }

        case 'frozen-sensor':
        case 'frozen_sensor': {
          // Zero variance: frozen at original value, ignore random walk
          temp = fault.originalValue;
          transitionNote = `Temperature: ${temp.toFixed(1)}°C (Sensor Frozen / Zero Variance)`;
          tempStatus = 'WARNING';
          stationStatus = 'WARNING';
          break;
        }

        case 'humidity-spike': {
          if (fault.ticksActive === 0) {
            hum = Math.min(98, Math.max(94, Math.round(fault.originalValue + 32)));
            transitionNote = `Humidity: ${fault.originalValue}% → ${hum}% (Injected Spike)`;
          } else {
            hum = Math.min(99, Math.max(92, hum + Math.round(Math.random() * 2 - 1)));
            transitionNote = `Humidity: ${hum}% (Elevated Baseline)`;
          }
          humStatus = 'ANOMALY';
          stationStatus = 'ANOMALY';
          break;
        }

        case 'pressure-drop': {
          if (fault.ticksActive < 2) {
            press = Math.round((press - 8.5) * 10) / 10;
            transitionNote = `Pressure: ${fault.originalValue.toFixed(1)} hPa → ${press.toFixed(1)} hPa (Rapid Barometric Fall)`;
          } else {
            press = Math.round((press + (Math.random() * 0.3 - 0.15)) * 10) / 10;
            transitionNote = `Pressure: ${press.toFixed(1)} hPa (Depressed Barometric Baseline)`;
          }
          pressStatus = 'ANOMALY';
          stationStatus = 'ANOMALY';
          break;
        }

        case 'communication-failure':
        case 'communication_failure': {
          flag = 'failure';
          stationStatus = 'OFFLINE';
          skipHistory = true;
          if (fault.ticksActive === 0) {
            transitionNote = `${station.id} — No telemetry received — Communication Failure`;
          } else {
            transitionNote = 'Signal Lost (Modem Link Offline)';
          }
          break;
        }
      }
    }

    const isCommFailure = fault?.faultType === 'communication-failure' || fault?.faultType === 'communication_failure';

    const updatedStation: AWSStation = {
      ...station,
      status: stationStatus,
      lastPingSeconds: isCommFailure ? Math.max(station.lastPingSeconds + 3, 14) : 2,
      sensors: {
        ...station.sensors,
        temperature: {
          ...station.sensors.temperature,
          value: temp,
          status: isCommFailure ? 'OFFLINE' : tempStatus,
          min24h: Math.min(station.sensors.temperature.min24h, temp),
          max24h: Math.max(station.sensors.temperature.max24h, temp),
          lastUpdated: isCommFailure ? 'Stale (Signal Lost)' : 'Just now',
        },
        humidity: {
          ...station.sensors.humidity,
          value: hum,
          status: isCommFailure ? 'OFFLINE' : humStatus,
          min24h: Math.min(station.sensors.humidity.min24h, hum),
          max24h: Math.max(station.sensors.humidity.max24h, hum),
          lastUpdated: isCommFailure ? 'Stale (Signal Lost)' : 'Just now',
        },
        pressure: {
          ...station.sensors.pressure,
          value: press,
          status: isCommFailure ? 'OFFLINE' : pressStatus,
          min24h: Math.min(station.sensors.pressure.min24h, press),
          max24h: Math.max(station.sensors.pressure.max24h, press),
          lastUpdated: isCommFailure ? 'Stale (Signal Lost)' : 'Just now',
        },
        wind: {
          ...station.sensors.wind,
          value: wind,
          min24h: Math.min(station.sensors.wind.min24h, wind),
          max24h: Math.max(station.sensors.wind.max24h, wind),
          lastUpdated: isCommFailure ? 'Stale (Signal Lost)' : 'Just now',
        },
        rainfall: {
          ...station.sensors.rainfall,
          value: rain,
          max24h: Math.max(station.sensors.rainfall.max24h, rain),
          lastUpdated: isCommFailure ? 'Stale (Signal Lost)' : 'Just now',
        },
      },
    };

    const newHistoryPoint: HistoryPoint | null = skipHistory
      ? null
      : {
          time: timeString,
          temperature: temp,
          humidity: hum,
          pressure: press,
          wind,
          rainfall: rain,
          expectedTemp: station.sensors.temperature.expectedMax - 2,
        };

    const newLogEntry: TelemetryLogEntry | null = isCommFailure && fault && fault.ticksActive > 0
      ? null
      : {
          id: `${station.id}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          timestamp: timeString,
          stationId: station.id,
          temperature: temp,
          humidity: hum,
          pressure: press,
          wind,
          rainfall: rain,
          flag,
          faultType: fault?.faultType,
          transitionNote,
        };

    return { updatedStation, newHistoryPoint, newLogEntry, skipHistory };
  }, []);

  /**
   * Execution step for one simulation tick across ALL stations simultaneously.
   */
  const executeTick = useCallback(() => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-IN', { hour12: false });
    setLastTickTime(timeString);
    setTickCount((prev) => prev + 1);

    // Advance ticksActive for all active faults
    setActiveFaults((prev) => {
      const next: Record<string, ActiveFault> = {};
      Object.keys(prev).forEach((id) => {
        next[id] = { ...prev[id], ticksActive: prev[id].ticksActive + 1 };
      });
      return next;
    });

    setStations((prevStations) => {
      const nextHistoryBuffers: Record<string, HistoryPoint[]> = {};
      const nextRecentReadings: Record<string, TelemetryLogEntry[]> = {};

      const nextStations = prevStations.map((station) => {
        const fault = activeFaults[station.id];
        const isCommFailure = fault?.faultType === 'communication-failure' || fault?.faultType === 'communication_failure';

        const { updatedStation, newHistoryPoint, newLogEntry, skipHistory } = generateStationUpdate(
          station,
          fault,
          timeString
        );

        // Update rolling history buffer (bounded queue)
        const currentBuffer = historyBuffers[station.id] || [];
        if (!skipHistory && newHistoryPoint) {
          const updatedBuffer = [...currentBuffer, newHistoryPoint];
          if (updatedBuffer.length > MAX_HISTORY_BUFFER_SIZE) {
            nextHistoryBuffers[station.id] = updatedBuffer.slice(updatedBuffer.length - MAX_HISTORY_BUFFER_SIZE);
          } else {
            nextHistoryBuffers[station.id] = updatedBuffer;
          }
        } else {
          nextHistoryBuffers[station.id] = currentBuffer;
        }

        // Update recent readings log (bounded queue)
        const currentLogs = recentReadings[station.id] || [];
        if (!isCommFailure && newLogEntry) {
          nextRecentReadings[station.id] = [newLogEntry, ...currentLogs.slice(0, MAX_RECENT_READINGS_SIZE - 1)];
        } else if (isCommFailure && fault && fault.ticksActive === 0 && newLogEntry) {
          // Single gap log entry on communication failure injection
          nextRecentReadings[station.id] = [newLogEntry, ...currentLogs.slice(0, MAX_RECENT_READINGS_SIZE - 1)];
        } else {
          // Freeze log without appending phantom rows
          nextRecentReadings[station.id] = currentLogs;
        }

        return updatedStation;
      });

      setHistoryBuffers((prev) => ({ ...prev, ...nextHistoryBuffers }));
      setRecentReadings((prev) => ({ ...prev, ...nextRecentReadings }));

      return nextStations;
    });
  }, [activeFaults, generateStationUpdate, historyBuffers, recentReadings]);

  /**
   * Start Simulation: sets status to RUNNING and creates interval.
   */
  const startSimulation = useCallback(() => {
    if (simulationStatus === 'RUNNING') return;
    setSimulationStatus('RUNNING');
  }, [simulationStatus]);

  /**
   * Pause Simulation: freezes updates at current values (including fault progression).
   */
  const pauseSimulation = useCallback(() => {
    setSimulationStatus('PAUSED');
  }, []);

  /**
   * Reset Simulation: stops timer, clears all active faults, and returns ALL stations to baseline.
   */
  const resetSimulation = useCallback(() => {
    setSimulationStatus('STOPPED');
    setTickCount(0);
    setLastTickTime('Baseline State');
    setActiveFaults({});
    setStations(getBaselineStations());
    setHistoryBuffers(getBaselineHistory());
    setRecentReadings(getBaselineRecentReadings());
  }, []);

  /**
   * Clears active fault for a station and resumes normal random walk from current value.
   * Does NOT snap back to pre-fault baseline.
   */
  const clearFault = useCallback((stationId: string) => {
    setActiveFaults((prev) => {
      const next = { ...prev };
      delete next[stationId];
      return next;
    });

    setStations((prev) =>
      prev.map((s) => {
        if (s.id !== stationId) return s;
        return {
          ...s,
          status: 'NORMAL',
          sensors: {
            ...s.sensors,
            temperature: { ...s.sensors.temperature, status: 'NORMAL' },
            humidity: { ...s.sensors.humidity, status: 'NORMAL' },
            pressure: { ...s.sensors.pressure, status: 'NORMAL' },
          },
        };
      })
    );
  }, []);

  /**
   * Injects a fault into the live telemetry stream for a specific station/sensor.
   * Replaces any existing fault on that station.
   */
  const injectFault = useCallback((stationId: string, faultType: FaultType, sensor?: SensorType) => {
    if (faultType === ('normal' as any)) {
      clearFault(stationId);
      return;
    }

    setStations((prevStations) => {
      const station = prevStations.find((s) => s.id === stationId);
      if (!station) return prevStations;

      const targetSensor: SensorType = sensor || (
        faultType === 'humidity-spike' ? 'humidity' :
        faultType === 'pressure-drop' ? 'pressure' : 'temperature'
      );
      const originalValue = station.sensors[targetSensor].value;

      const newFault: ActiveFault = {
        stationId,
        sensor: targetSensor,
        faultType,
        label: getFaultLabel(faultType),
        injectedAt: new Date().toLocaleTimeString('en-IN', { hour12: false }) + ' IST',
        originalValue,
        ticksActive: 0,
      };

      setActiveFaults((prev) => ({
        ...prev,
        [stationId]: newFault,
      }));

      // Immediately flag station status if communication failure or spike
      if (faultType === 'communication-failure' || faultType === 'communication_failure') {
        return prevStations.map((s) => (s.id === stationId ? { ...s, status: 'OFFLINE' as StationStatus } : s));
      }
      return prevStations;
    });
  }, [clearFault]);

  // Interval manager: runs only when status is RUNNING; cleanly cleared otherwise
  useEffect(() => {
    if (simulationStatus === 'RUNNING') {
      intervalRef.current = setInterval(() => {
        executeTick();
      }, SIMULATION_INTERVAL_MS);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [simulationStatus, executeTick]);

  const getStation = useCallback((id: string) => {
    return stations.find((s) => s.id === id);
  }, [stations]);

  return (
    <TelemetryContext.Provider
      value={{
        stations,
        simulationStatus,
        tickCount,
        lastTickTime,
        historyBuffers,
        recentReadings,
        activeFaults,
        startSimulation,
        pauseSimulation,
        resetSimulation,
        injectFault,
        clearFault,
        getStation,
      }}
    >
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = (): TelemetryContextType => {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error('useTelemetry must be used within a TelemetryProvider');
  }
  return context;
};
