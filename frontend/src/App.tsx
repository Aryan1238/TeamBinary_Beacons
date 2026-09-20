import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { SIHDemoController } from './components/SIHDemoController';
import { CopilotModal } from './components/CopilotModal';
import { AIInvestigationModal } from './components/AIInvestigationModal';

// Pages
import { LandingPage } from './pages/LandingPage';
import { CommandCenter } from './pages/CommandCenter';
import { WeatherPortalPage } from './pages/WeatherPortalPage';
import { LiveNetworkPage } from './pages/LiveNetworkPage';
import { StationDetailsPage } from './pages/StationDetailsPage';
import { AnomalyCenterPage } from './pages/AnomalyCenterPage';
import { ExplainabilityPage } from './pages/ExplainabilityPage';
import { SensorHealthPage } from './pages/SensorHealthPage';
import { MaintenancePage } from './pages/MaintenancePage';
import { SimulationLabPage } from './pages/SimulationLabPage';
import { WeatherAnalyticsPage } from './pages/WeatherAnalyticsPage';
import { DataQualityPage } from './pages/DataQualityPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

import { Station, AnomalyRecord, NetworkKPIs } from './types';
import { api } from './services/api';

export function App() {
  const [mode, setMode] = useState<'LIVE' | 'DEMO'>('LIVE');
  const [currentTab, setCurrentTab] = useState<string>('command-center');
  const [selectedStationId, setSelectedStationId] = useState<string>('LOC-MH-02');
  const [stations, setStations] = useState<Station[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyRecord[]>([]);
  const [kpis, setKpis] = useState<NetworkKPIs | null>(null);
  const [aiBrief, setAiBrief] = useState<string>(
    "Live Open-Meteo telemetry stream initializing across national AWS grid."
  );

  const [copilotOpen, setCopilotOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [investigatingAnomaly, setInvestigatingAnomaly] = useState<AnomalyRecord | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);

  // Play subtle warning/critical alert sound using Web Audio API
  const playAlertSound = (isCritical: boolean = false) => {
    if (!audioEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = isCritical ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(isCritical ? 880 : 520, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (isCritical ? 0.4 : 0.2));

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + (isCritical ? 0.4 : 0.2));
    } catch (e) {
      // Audio autoplay policy catch
    }
  };

  // Synchronize telemetry data from API
  const refreshData = async () => {
    try {
      const [stList, anoList, statusData] = await Promise.all([
        api.getStations(),
        api.getAnomalies(),
        api.getSystemStatus()
      ]);
      setStations(stList);
      setAnomalies(anoList);
      if (statusData?.mode) setMode(statusData.mode);
      if (statusData?.kpis) setKpis(statusData.kpis);
      if (statusData?.ai_brief) setAiBrief(statusData.ai_brief);

      // Check if newly critical
      const hasCritical = anoList.some((a: AnomalyRecord) => a.severity === 'CRITICAL');
      if (hasCritical) {
        playAlertSound(true);
      }
    } catch (err) {
      console.warn("Polling fallback used", err);
    }
  };

  // Initial load and periodic polling
  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 3000);
    return () => clearInterval(interval);
  }, []);

  // WebSocket live streaming connection
  useEffect(() => {
    let ws: WebSocket | null = null;
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/telemetry`;
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'telemetry_update' || data.type === 'initial_state') {
            if (data.mode) setMode(data.mode.includes('DEMO') ? 'DEMO' : 'LIVE');
            if (data.kpis) setKpis(data.kpis);
            if (data.ai_brief) setAiBrief(data.ai_brief);
            if (data.stations) setStations(data.stations);
            if (data.anomalies) setAnomalies(data.anomalies);
          }
        } catch (e) {
          console.error("WS Parse error", e);
        }
      };
    } catch (e) {
      console.log("WebSocket connecting via standard polling mode");
    }

    return () => {
      if (ws) ws.close();
    };
  }, []);

  const handleTriggerScenario = async (scenario: string) => {
    setMode('DEMO');
    await api.triggerScenario(scenario);
    await refreshData();
    playAlertSound(scenario.includes('spike'));
  };

  const handleResetSimulation = async () => {
    setMode('LIVE');
    await api.resetSimulation();
    await refreshData();
  };

  const handleAcceptCorrection = async (anomalyId: string) => {
    await api.acceptCorrection(anomalyId);
    await refreshData();
    if (investigatingAnomaly?.id === anomalyId) {
      setInvestigatingAnomaly(prev => prev ? { ...prev, accepted_correction: true, status: 'Corrected' } : null);
    }
  };

  const activeAnomaliesCount = anomalies.length;
  const criticalCount = anomalies.filter(a => a.severity === 'CRITICAL').length;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070B14] text-slate-100 select-none">
      {/* Persistent Left Sidebar (Hidden if in landing page mode) */}
      {currentTab !== 'landing' && (
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            if (tab === 'stations') {
              setCurrentTab('live-network');
            } else {
              setCurrentTab(tab);
            }
          }}
          activeAnomaliesCount={activeAnomaliesCount}
          criticalCount={criticalCount}
        />
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* TopBar Header */}
        {currentTab !== 'landing' && (
          <TopBar
            kpis={kpis}
            mode={mode}
            onOpenCopilot={() => setCopilotOpen(true)}
            onOpenDemo={() => setDemoOpen(true)}
            onReset={handleResetSimulation}
            onRefreshLive={async () => {
              await api.forceRefreshLiveWeather();
              await refreshData();
            }}
            audioEnabled={audioEnabled}
            onToggleAudio={() => setAudioEnabled(!audioEnabled)}
            activeAnomaliesCount={activeAnomaliesCount}
            currentTab={currentTab}
            onSelectTab={(tab) => setCurrentTab(tab)}
          />
        )}

        {/* Dynamic Route Content */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {currentTab === 'landing' && (
            <LandingPage
              onLaunchCommandCenter={() => setCurrentTab('command-center')}
              onLaunchSimulationLab={() => setCurrentTab('simulation-lab')}
            />
          )}

          {currentTab === 'command-center' && (
            <CommandCenter
              stations={stations}
              anomalies={anomalies}
              kpis={kpis}
              aiBrief={aiBrief}
              onSelectStation={(stId) => {
                setSelectedStationId(stId);
                setCurrentTab('station-detail');
              }}
              onInvestigateAnomaly={(ano) => setInvestigatingAnomaly(ano)}
              onNavigateTab={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'weather' && (
            <WeatherPortalPage
              stations={stations}
              anomalies={anomalies}
              kpis={kpis}
              onSelectStation={(stId) => {
                setSelectedStationId(stId);
                setCurrentTab('station-detail');
              }}
              onInvestigateAnomaly={(ano) => setInvestigatingAnomaly(ano)}
            />
          )}

          {currentTab === 'live-network' && (
            <LiveNetworkPage
              stations={stations}
              anomalies={anomalies}
              onSelectStation={(stId) => {
                setSelectedStationId(stId);
                setCurrentTab('station-detail');
              }}
              onInvestigateAnomaly={(ano) => setInvestigatingAnomaly(ano)}
            />
          )}

          {currentTab === 'station-detail' && (
            <StationDetailsPage
              stationId={selectedStationId}
              onBack={() => setCurrentTab('command-center')}
              onInvestigateAnomaly={(ano) => setInvestigatingAnomaly(ano)}
            />
          )}

          {currentTab === 'anomalies' && (
            <AnomalyCenterPage
              anomalies={anomalies}
              onInvestigateAnomaly={(ano: AnomalyRecord) => setInvestigatingAnomaly(ano)}
              onAcceptCorrection={handleAcceptCorrection}
            />
          )}

          {currentTab === 'explainability' && (
            <ExplainabilityPage
              anomalies={anomalies}
              onInvestigateAnomaly={(ano) => setInvestigatingAnomaly(ano)}
            />
          )}

          {currentTab === 'sensor-health' && (
            <SensorHealthPage
              onSelectStation={(stId) => {
                setSelectedStationId(stId);
                setCurrentTab('station-detail');
              }}
            />
          )}

          {currentTab === 'maintenance' && (
            <MaintenancePage
              onSelectStation={(stId) => {
                setSelectedStationId(stId);
                setCurrentTab('station-detail');
              }}
            />
          )}

          {currentTab === 'simulation-lab' && (
            <SimulationLabPage
              stations={stations}
              onTriggerScenario={handleTriggerScenario}
              onReset={handleResetSimulation}
            />
          )}

          {currentTab === 'analytics' && (
            <WeatherAnalyticsPage stations={stations} />
          )}

          {currentTab === 'data-quality' && (
            <DataQualityPage kpis={kpis} />
          )}

          {currentTab === 'reports' && (
            <ReportsPage />
          )}

          {currentTab === 'settings' && (
            <SettingsPage
              audioEnabled={audioEnabled}
              onToggleAudio={() => setAudioEnabled(!audioEnabled)}
            />
          )}
        </main>
      </div>

      {/* Floating ⚡ SIH DEMO Controller */}
      <SIHDemoController
        onTriggerScenario={handleTriggerScenario}
        onReset={handleResetSimulation}
      />

      {/* Floating SkyGuard Copilot Modal */}
      <CopilotModal
        isOpen={copilotOpen}
        onClose={() => setCopilotOpen(false)}
        contextStationId={selectedStationId}
      />

      {/* Deep AI Investigation Panel Modal */}
      <AIInvestigationModal
        anomaly={investigatingAnomaly}
        onClose={() => setInvestigatingAnomaly(null)}
        onAcceptCorrection={handleAcceptCorrection}
      />
    </div>
  );
}

export default App;
