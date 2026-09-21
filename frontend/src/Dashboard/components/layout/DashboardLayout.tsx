import React, { useState } from 'react';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardTopBar } from './DashboardTopBar';
import type { DashboardTab, AWSStation } from '../../types/dashboard.types';

interface DashboardLayoutProps {
  activeTab: DashboardTab;
  onSelectTab: (tab: DashboardTab) => void;
  stations: AWSStation[];
  onSelectStation?: (stationId: string) => void;
  onNavigateHome: () => void;
  activeAnomaliesCount: number;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  activeTab,
  onSelectTab,
  stations,
  onSelectStation,
  onNavigateHome,
  activeAnomaliesCount,
  children,
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f1d] via-[#10172c] to-[#0b0e1b] text-slate-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-sky-200 relative overflow-x-hidden">
      {/* Layered Atmospheric Sky & Radar Textures */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Sky / Dusk atmospheric ambient orbs */}
        <div className="absolute -top-48 -right-48 w-[500px] h-[500px] bg-gradient-to-br from-sky-500/15 via-indigo-600/10 to-transparent rounded-full blur-[140px]" />
        <div className="absolute top-1/3 -left-48 w-[550px] h-[550px] bg-gradient-to-tr from-indigo-700/15 via-violet-600/10 to-transparent rounded-full blur-[160px]" />
        <div className="absolute -bottom-48 right-1/4 w-[450px] h-[450px] bg-gradient-to-t from-amber-500/8 via-sky-600/5 to-transparent rounded-full blur-[140px]" />

        {/* Faint Synoptic Weather Radar Rings Texture */}
        <div className="absolute top-1/4 right-1/3 w-[600px] h-[600px] rounded-full border border-sky-500/[0.03] pointer-events-none" />
        <div className="absolute top-1/4 right-1/3 w-[900px] h-[900px] -translate-x-[150px] -translate-y-[150px] rounded-full border border-indigo-500/[0.025] pointer-events-none" />

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#38bdf805_1px,transparent_1px),linear-gradient(to_bottom,#38bdf805_1px,transparent_1px)] bg-[size:48px_48px] opacity-60" />
      </div>

      {/* Sidebar */}
      <DashboardSidebar
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        onNavigateHome={onNavigateHome}
        activeAnomaliesCount={activeAnomaliesCount}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 relative z-10 ${
          sidebarCollapsed ? 'pl-20' : 'pl-64'
        }`}
      >
        <DashboardTopBar
          activeTab={activeTab}
          onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
          stations={stations}
          onSelectStation={onSelectStation}
          onNavigateHome={onNavigateHome}
          activeAnomaliesCount={activeAnomaliesCount}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>

        <footer className="px-6 py-4 border-t border-slate-800/50 bg-[#080d1a]/60 backdrop-blur-md text-center text-xs text-slate-400/80 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px] text-slate-400">SkyGuard AWS Subcontinent Mesh • Active Telemetry Radar</span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">
            SIH 2026 Atmospheric Anomaly Detection • High-Fidelity Simulation Pipeline
          </span>
        </footer>
      </div>
    </div>
  );
};
