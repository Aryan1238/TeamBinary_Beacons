import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { CommandOverviewPage } from './components/pages/CommandOverviewPage';
import { LiveMonitoringPage } from './components/pages/LiveMonitoringPage';
import { LiveWeatherPage } from './components/pages/LiveWeatherPage';
import { StationMapPage } from './components/pages/StationMapPage';
import { AnomalyAlertsPage } from './components/pages/AnomalyAlertsPage';
import { AnomalyInvestigationPage } from './components/pages/AnomalyInvestigationPage';
import { CrossStationIntelligencePage } from './components/pages/CrossStationIntelligencePage';
import { HistoricalAnalysisPage } from './components/pages/HistoricalAnalysisPage';
import { WeatherAnalyticsPage } from './components/pages/WeatherAnalyticsPage';
import { SensorHealthPage } from './components/pages/SensorHealthPage';
import { ResponseMaintenancePage } from './components/pages/ResponseMaintenancePage';
import { SimulationLabPage } from './components/pages/SimulationLabPage';

import type { DashboardTab, AnomalyAlert } from './types/dashboard.types';
import { TelemetryProvider, useTelemetry } from './context/TelemetryContext';
import { investigationToAlert } from './utils/investigationUtils';
import { API_BASE } from '../services/api';

interface DashboardAppProps {
  onNavigateHome?: () => void;
}

const DashboardContent: React.FC<DashboardAppProps> = ({
  onNavigateHome = () => {
    window.location.href = '/';
  },
}) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') as DashboardTab;
      if (tabParam) return tabParam;
      const hash = window.location.hash.replace('#', '') as DashboardTab;
      if (hash) return hash;
    }
    return 'command-center';
  });
  const [selectedStationId, setSelectedStationId] = useState<string>('AWS-001');
  const [openTicketsCount, setOpenTicketsCount] = useState<number>(0);
  const { stations, investigationsList } = useTelemetry();

  const fetchTicketsCount = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/maintenance/tickets`);
      if (res.ok) {
        const data = await res.json();
        setOpenTicketsCount(data?.kpis?.open_tickets ?? 0);
      }
    } catch {
      // fallback
    }
  }, []);

  useEffect(() => {
    fetchTicketsCount();
    const interval = setInterval(fetchTicketsCount, 4000);
    return () => clearInterval(interval);
  }, [fetchTicketsCount]);

  // Derive dynamic real anomaly alerts from active investigation records
  const dynamicAlerts = useMemo(() => {
    return investigationsList.map(investigationToAlert);
  }, [investigationsList]);

  const [selectedAlert, setSelectedAlert] = useState<AnomalyAlert | null>(null);

  // Active alert to investigate: selected alert or first active investigation
  const activeInvestigationAlert = selectedAlert || (dynamicAlerts.length > 0 ? dynamicAlerts[0] : null);

  const handleSelectStation = (stationId: string) => {
    setSelectedStationId(stationId);
  };

  const handleInvestigateAlert = (alert: AnomalyAlert) => {
    setSelectedAlert(alert);
    setActiveTab('anomaly-investigation');
  };

  return (
    <DashboardLayout
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      stations={stations}
      onSelectStation={handleSelectStation}
      onNavigateHome={onNavigateHome}
      activeAnomaliesCount={dynamicAlerts.length}
      openTicketsCount={openTicketsCount}
    >
      {activeTab === 'command-center' && (
        <CommandOverviewPage
          stations={stations}
          anomalies={dynamicAlerts}
          onSelectStation={handleSelectStation}
          onNavigateTab={setActiveTab}
          onInvestigateAlert={handleInvestigateAlert}
        />
      )}

      {activeTab === 'live-monitoring' && (
        <LiveMonitoringPage
          stations={stations}
          selectedStationId={selectedStationId}
          onSelectStation={handleSelectStation}
          onNavigateTab={setActiveTab}
        />
      )}

      {activeTab === 'live-weather' && (
        <LiveWeatherPage
          stations={stations}
          selectedStationId={selectedStationId}
          onSelectStation={handleSelectStation}
        />
      )}

      {activeTab === 'station-map' && (
        <StationMapPage
          stations={stations}
          onSelectStation={handleSelectStation}
          onNavigateTab={setActiveTab}
        />
      )}

      {activeTab === 'anomaly-alerts' && (
        <AnomalyAlertsPage
          anomalies={dynamicAlerts}
          onInvestigateAlert={handleInvestigateAlert}
          onNavigateTab={setActiveTab}
        />
      )}

      {activeTab === 'anomaly-investigation' && (
        <AnomalyInvestigationPage
          alert={activeInvestigationAlert}
          onNavigateTab={setActiveTab}
        />
      )}

      {activeTab === 'cross-station' && (
        <CrossStationIntelligencePage
          stations={stations}
          selectedStationId={selectedStationId}
          onSelectStation={handleSelectStation}
          onNavigateTab={setActiveTab}
        />
      )}

      {activeTab === 'historical-analysis' && (
        <HistoricalAnalysisPage stations={stations} onNavigateTab={setActiveTab} />
      )}

      {activeTab === 'weather-analytics' && (
        <WeatherAnalyticsPage stations={stations} onNavigateTab={setActiveTab} />
      )}

      {activeTab === 'sensor-health' && (
        <SensorHealthPage
          stations={stations}
          onSelectStation={handleSelectStation}
          onNavigateTab={setActiveTab}
          onTicketCreated={fetchTicketsCount}
        />
      )}

      {activeTab === 'maintenance' && (
        <ResponseMaintenancePage
          onNavigateTab={setActiveTab}
          onTicketUpdated={fetchTicketsCount}
        />
      )}

      {activeTab === 'simulation-lab' && <SimulationLabPage />}
    </DashboardLayout>
  );
};

export const DashboardApp: React.FC<DashboardAppProps> = (props) => {
  return (
    <TelemetryProvider>
      <DashboardContent {...props} />
    </TelemetryProvider>
  );
};

export default DashboardApp;
