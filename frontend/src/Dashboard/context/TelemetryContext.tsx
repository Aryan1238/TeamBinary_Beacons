import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { MOCK_STATIONS, MOCK_24H_HISTORY, HistoryPoint } from '../data/mockStations';
import type { AWSStation, StationStatus } from '../types/dashboard.types';

export type SimulationStatus = 'STOPPED' | 'RUNNING' | 'PAUSED';

export type StationScenario =
  | 'normal'
  | 'sudden_spike'
  | 'gradual_drift'
  | 'frozen_sensor'
  | 'pressure_drop'
  | 'communication_failure';

export interface TelemetryLogEntry {
  id: string;
  timestamp: string;
  temperature: number;
  humidity: number;
  pressure: number;
  wind: number;
  rainfall: number;
}

export interface TelemetryContextType {
  stations: AWSStation[];
  simulationStatus: SimulationStatus;
  tickCount: number;
  lastTickTime: string;
  historyBuffers: Record<string, HistoryPoint[]>;
  recentReadings: Record<string, TelemetryLogEntry[]>;
  startSimulation: () => void;
  pauseSimulation: () => void;
  resetSimulation: () => void;
  getStation: (id: string) => AWSStation | undefined;
}

const MAX_HISTORY_BUFFER_SIZE = 35;
const MAX_RECENT_READINGS_SIZE = 12;
const SIMULATION_INTERVAL_MS = 2500;

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
      temperature: pt.temperature,
      humidity: pt.humidity,
      pressure: pt.pressure,
      wind: pt.wind,
      rainfall: pt.rainfall,
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

  // Scenarios state for future anomaly-injection extensibility
  const [scenarios] = useState<Record<string, StationScenario>>(() => {
    const map: Record<string, StationScenario> = {};
    MOCK_STATIONS.forEach((s) => {
      map[s.id] = 'normal';
    });
    return map;
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * Generates realistic gradual bounded random walk telemetry.
   * Extensibility hook for future anomaly scenarios is built into the switch statement.
   */
  const generateStationUpdate = useCallback((
    station: AWSStation,
    scenario: StationScenario,
    timeString: string
  ): { updatedStation: AWSStation; newHistoryPoint: HistoryPoint; newLogEntry: TelemetryLogEntry } => {
    // Current sensor values
    let temp = station.sensors.temperature.value;
    let hum = station.sensors.humidity.value;
    let press = station.sensors.pressure.value;
    let wind = station.sensors.wind.value;
    let rain = station.sensors.rainfall.value;

    switch (scenario) {
      case 'normal':
      default: {
        // 1. Temperature: bounded random walk (±0.15°C) with diurnal bias
        const tempDelta = (Math.random() * 0.3 - 0.15);
        temp = Math.round((temp + tempDelta) * 10) / 10;
        // Clamp to station envelope
        temp = Math.max(station.sensors.temperature.expectedMin - 0.5, Math.min(station.sensors.temperature.expectedMax + 0.5, temp));

        // 2. Relative Humidity: bounded random walk (±0.8%), inverse slight trend with temp
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
        break;
      }

      /*
       * EXTENSION HOOKS FOR FUTURE SCENARIOS:
       * (Do not implement algorithmic anomalies yet as per task requirements;
       * these switch cases provide the clean structural extension point)
       */
      // case 'sudden_spike':
      //   temp += 8.5;
      //   break;
      // case 'gradual_drift':
      //   temp += 0.3;
      //   break;
      // case 'frozen_sensor':
      //   // value remains unchanged
      //   break;
      // case 'pressure_drop':
      //   press -= 4.0;
      //   break;
      // case 'communication_failure':
      //   break;
    }

    // Determine status based on thresholds
    const tempStatus: StationStatus =
      temp > station.sensors.temperature.expectedMax || temp < station.sensors.temperature.expectedMin
        ? (station.status === 'ANOMALY' ? 'ANOMALY' : 'WARNING')
        : 'NORMAL';

    const updatedStation: AWSStation = {
      ...station,
      lastPingSeconds: 2,
      sensors: {
        ...station.sensors,
        temperature: {
          ...station.sensors.temperature,
          value: temp,
          status: tempStatus,
          min24h: Math.min(station.sensors.temperature.min24h, temp),
          max24h: Math.max(station.sensors.temperature.max24h, temp),
          lastUpdated: 'Just now',
        },
        humidity: {
          ...station.sensors.humidity,
          value: hum,
          min24h: Math.min(station.sensors.humidity.min24h, hum),
          max24h: Math.max(station.sensors.humidity.max24h, hum),
          lastUpdated: 'Just now',
        },
        pressure: {
          ...station.sensors.pressure,
          value: press,
          min24h: Math.min(station.sensors.pressure.min24h, press),
          max24h: Math.max(station.sensors.pressure.max24h, press),
          lastUpdated: 'Just now',
        },
        wind: {
          ...station.sensors.wind,
          value: wind,
          min24h: Math.min(station.sensors.wind.min24h, wind),
          max24h: Math.max(station.sensors.wind.max24h, wind),
          lastUpdated: 'Just now',
        },
        rainfall: {
          ...station.sensors.rainfall,
          value: rain,
          max24h: Math.max(station.sensors.rainfall.max24h, rain),
          lastUpdated: 'Just now',
        },
      },
    };

    const newHistoryPoint: HistoryPoint = {
      time: timeString,
      temperature: temp,
      humidity: hum,
      pressure: press,
      wind,
      rainfall: rain,
      expectedTemp: station.sensors.temperature.expectedMax - 2,
    };

    const newLogEntry: TelemetryLogEntry = {
      id: `${station.id}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: timeString,
      temperature: temp,
      humidity: hum,
      pressure: press,
      wind,
      rainfall: rain,
    };

    return { updatedStation, newHistoryPoint, newLogEntry };
  }, []);

  /**
   * Execution step for one simulation tick across ALL stations simultaneously.
   */
  const executeTick = useCallback(() => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-IN', { hour12: false });
    setLastTickTime(timeString);
    setTickCount((prev) => prev + 1);

    setStations((prevStations) => {
      const nextHistoryBuffers: Record<string, HistoryPoint[]> = {};
      const nextRecentReadings: Record<string, TelemetryLogEntry[]> = {};

      const nextStations = prevStations.map((station) => {
        const scenario = scenarios[station.id] || 'normal';
        const { updatedStation, newHistoryPoint, newLogEntry } = generateStationUpdate(
          station,
          scenario,
          timeString
        );

        // Update rolling history buffer (bounded queue)
        const currentBuffer = historyBuffers[station.id] || [];
        const updatedBuffer = [...currentBuffer, newHistoryPoint];
        if (updatedBuffer.length > MAX_HISTORY_BUFFER_SIZE) {
          nextHistoryBuffers[station.id] = updatedBuffer.slice(updatedBuffer.length - MAX_HISTORY_BUFFER_SIZE);
        } else {
          nextHistoryBuffers[station.id] = updatedBuffer;
        }

        // Update recent readings log (bounded queue)
        const currentLogs = recentReadings[station.id] || [];
        nextRecentReadings[station.id] = [newLogEntry, ...currentLogs.slice(0, MAX_RECENT_READINGS_SIZE - 1)];

        return updatedStation;
      });

      setHistoryBuffers((prev) => ({ ...prev, ...nextHistoryBuffers }));
      setRecentReadings((prev) => ({ ...prev, ...nextRecentReadings }));

      return nextStations;
    });
  }, [generateStationUpdate, historyBuffers, recentReadings, scenarios]);

  /**
   * Start Simulation: sets status to RUNNING and creates interval.
   */
  const startSimulation = useCallback(() => {
    if (simulationStatus === 'RUNNING') return;
    setSimulationStatus('RUNNING');
  }, [simulationStatus]);

  /**
   * Pause Simulation: freezes updates at current values.
   */
  const pauseSimulation = useCallback(() => {
    setSimulationStatus('PAUSED');
  }, []);

  /**
   * Reset Simulation: stops timer and returns ALL stations to baseline.
   */
  const resetSimulation = useCallback(() => {
    setSimulationStatus('STOPPED');
    setTickCount(0);
    setLastTickTime('Baseline State');
    setStations(getBaselineStations());
    setHistoryBuffers(getBaselineHistory());
    setRecentReadings(getBaselineRecentReadings());
  }, []);

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
        startSimulation,
        pauseSimulation,
        resetSimulation,
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
