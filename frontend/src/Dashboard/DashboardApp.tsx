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

import { MOCK_ANOMALIES } from './data/mockStations';
import type { DashboardTab, AnomalyAlert } from './types/dashboard.types';
import { TelemetryProvider, useTelemetry } from './context/TelemetryContext';

interface DashboardAppProps {
  onNavigateHome?: () => void;
}

const DashboardContent: React.FC<DashboardAppProps> = ({
  onNavigateHome = () => {
    window.location.href = '/';
  },
}) => {
  const { stations, activeFaults } = useTelemetry();
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
      stations={stations}
      onSelectStation={handleSelectStation}
      onNavigateHome={onNavigateHome}
      activeAnomaliesCount={MOCK_ANOMALIES.length + Object.keys(activeFaults).length}
    >
      {activeTab === 'command-center' && (
        <CommandOverviewPage
          stations={stations}
          anomalies={MOCK_ANOMALIES}
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
        <LiveWeatherPage stations={stations} />
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
          stations={stations}
          onNavigateTab={setActiveTab}
        />
      )}

      {activeTab === 'historical-analysis' && (
        <HistoricalAnalysisPage stations={stations} />
      )}

      {activeTab === 'weather-analytics' && (
        <WeatherAnalyticsPage stations={stations} />
      )}

      {activeTab === 'sensor-health' && (
        <SensorHealthPage
          stations={stations}
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

export const DashboardApp: React.FC<DashboardAppProps> = (props) => {
  return (
    <TelemetryProvider>
      <DashboardContent {...props} />
    </TelemetryProvider>
  );
};

export default DashboardApp;
