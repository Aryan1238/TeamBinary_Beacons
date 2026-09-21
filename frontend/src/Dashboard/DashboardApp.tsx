import React, { useState } from 'react';
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

import { MOCK_STATIONS, MOCK_ANOMALIES } from './data/mockStations';
import type { DashboardTab, AnomalyAlert } from './types/dashboard.types';

interface DashboardAppProps {
  onNavigateHome?: () => void;
}

export const DashboardApp: React.FC<DashboardAppProps> = ({
  onNavigateHome = () => {
    window.location.href = '/';
  },
}) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('command-center');
  const [selectedStationId, setSelectedStationId] = useState<string>('AWS-001');
  const [selectedAlert, setSelectedAlert] = useState<AnomalyAlert>(MOCK_ANOMALIES[0]);

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
      stations={MOCK_STATIONS}
      onSelectStation={handleSelectStation}
      onNavigateHome={onNavigateHome}
      activeAnomaliesCount={MOCK_ANOMALIES.length}
    >
      {activeTab === 'command-center' && (
        <CommandOverviewPage
          stations={MOCK_STATIONS}
          anomalies={MOCK_ANOMALIES}
          onSelectStation={handleSelectStation}
          onNavigateTab={setActiveTab}
          onInvestigateAlert={handleInvestigateAlert}
        />
      )}

      {activeTab === 'live-monitoring' && (
        <LiveMonitoringPage
          stations={MOCK_STATIONS}
          selectedStationId={selectedStationId}
          onSelectStation={handleSelectStation}
          onNavigateTab={setActiveTab}
        />
      )}

      {activeTab === 'live-weather' && (
        <LiveWeatherPage stations={MOCK_STATIONS} />
      )}

      {activeTab === 'station-map' && (
        <StationMapPage
          stations={MOCK_STATIONS}
          onSelectStation={handleSelectStation}
          onNavigateTab={setActiveTab}
        />
      )}

      {activeTab === 'anomaly-alerts' && (
        <AnomalyAlertsPage
          anomalies={MOCK_ANOMALIES}
          onInvestigateAlert={handleInvestigateAlert}
          onNavigateTab={setActiveTab}
        />
      )}

      {activeTab === 'anomaly-investigation' && (
        <AnomalyInvestigationPage
          alert={selectedAlert}
          onNavigateTab={setActiveTab}
        />
      )}

      {activeTab === 'cross-station' && (
        <CrossStationIntelligencePage
          stations={MOCK_STATIONS}
          onNavigateTab={setActiveTab}
        />
      )}

      {activeTab === 'historical-analysis' && (
        <HistoricalAnalysisPage stations={MOCK_STATIONS} />
      )}

      {activeTab === 'weather-analytics' && (
        <WeatherAnalyticsPage stations={MOCK_STATIONS} />
      )}

      {activeTab === 'sensor-health' && (
        <SensorHealthPage
          stations={MOCK_STATIONS}
          onSelectStation={handleSelectStation}
          onNavigateTab={setActiveTab}
        />
      )}

      {activeTab === 'maintenance' && (
        <ResponseMaintenancePage onNavigateTab={setActiveTab} />
      )}

      {activeTab === 'simulation-lab' && <SimulationLabPage />}
    </DashboardLayout>
  );
};

export default DashboardApp;
