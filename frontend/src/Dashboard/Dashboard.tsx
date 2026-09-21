import React, { useState } from 'react';
import './dashboard.css';
import { DashboardLayout } from './components/DashboardLayout';
import { StatCard } from './components/StatCard';
import { StationOverview } from './components/StationOverview';
import { ChartPlaceholder } from './components/ChartPlaceholder';
import { AnomalyPlaceholder } from './components/AnomalyPlaceholder';
import { DashboardNavTab, StatMetric } from './types';
import { Building2, Activity, ShieldCheck, Cpu } from 'lucide-react';

interface DashboardProps {
  onBackToLanding?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onBackToLanding }) => {
  const [activeTab, setActiveTab] = useState<DashboardNavTab>('overview');

  // Phase 1 Mock Metric Cards
  const metrics: { data: StatMetric; icon: any }[] = [
    {
      data: {
        title: 'Total Stations',
        value: '6',
        badge: 'Prototype Set',
        statusType: 'info',
        helperText: '4 Online • 1 Standby • 1 Degraded'
      },
      icon: Building2
    },
    {
      data: {
        title: 'Active Sensors',
        value: '28',
        badge: 'Transducers',
        statusType: 'success',
        helperText: 'Temperature, Pressure, Humidity, Wind'
      },
      icon: Activity
    },
    {
      data: {
        title: 'System Health',
        value: '98.2%',
        badge: 'Stable',
        statusType: 'success',
        helperText: 'Nominal telemetry stream & low jitter'
      },
      icon: ShieldCheck
    },
    {
      data: {
        title: 'Surveillance Mode',
        value: 'Autonomous',
        badge: 'Phase 1',
        statusType: 'info',
        helperText: 'Station heartbeat & topology surveillance'
      },
      icon: Cpu
    }
  ];

  const handleBackToLanding = () => {
    if (onBackToLanding) {
      onBackToLanding();
    } else if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  return (
    <DashboardLayout
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      onBackToLanding={handleBackToLanding}
    >
      {/* Metric Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((item, idx) => (
          <StatCard key={idx} metric={item.data} icon={item.icon} />
        ))}
      </section>

      {/* Station Overview (Tabular & Card view) */}
      <section>
        <StationOverview />
      </section>

      {/* 2-Column Placeholders for Future Phases: Charts (Phase 3) & Anomaly Detection (Phase 4) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartPlaceholder />
        <AnomalyPlaceholder />
      </section>
    </DashboardLayout>
  );
};

export default Dashboard;
