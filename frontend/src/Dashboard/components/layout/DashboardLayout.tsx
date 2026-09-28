import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardTopBar } from './DashboardTopBar';
import type { DashboardTab, AWSStation } from '../../types/dashboard.types';
import { useTelemetry } from '../../context/TelemetryContext';

interface DashboardLayoutProps {
  activeTab: DashboardTab;
  onSelectTab: (tab: DashboardTab) => void;
  stations: AWSStation[];
  onSelectStation?: (stationId: string) => void;
  onNavigateHome: () => void;
  activeAnomaliesCount: number;
  openTicketsCount?: number;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  activeTab,
  onSelectTab,
  stations,
  onSelectStation,
  onNavigateHome,
  activeAnomaliesCount,
  openTicketsCount = 0,
  children,
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { demoProgress, resetSimulation } = useTelemetry();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-sky-500/20 selection:text-sky-900 relative overflow-x-hidden">
      {/* Layered Atmospheric Sky & Civic Textures */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Soft sky-blue atmospheric gradients */}
        <div className="absolute -top-48 -right-48 w-[500px] h-[500px] bg-gradient-to-br from-sky-200/40 via-sky-100/30 to-transparent rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -left-48 w-[550px] h-[550px] bg-gradient-to-tr from-sky-100/50 via-slate-100/40 to-transparent rounded-full blur-[140px]" />
        <div className="absolute -bottom-48 right-1/4 w-[450px] h-[450px] bg-gradient-to-t from-sky-200/30 via-slate-100/20 to-transparent rounded-full blur-[120px]" />

        {/* Faint subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0284c70a_1px,transparent_1px),linear-gradient(to_bottom,#0284c70a_1px,transparent_1px)] bg-[size:48px_48px] opacity-60" />
      </div>

      {/* Sidebar */}
      <DashboardSidebar
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        onNavigateHome={onNavigateHome}
        activeAnomaliesCount={activeAnomaliesCount}
        openTicketsCount={openTicketsCount}
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
          {/* Active Demo Mode Banner */}
          {demoProgress.active && (
            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white px-5 py-3.5 rounded-2xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn border border-amber-300/40">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
                </span>
                <div>
                  <span className="font-bold text-sm tracking-wide">
                    DEMO MODE — simulated faults active ({demoProgress.count}/5 injected)
                  </span>
                  <span className="text-xs text-amber-100 ml-2 hidden md:inline">
                    Progressive 5-station verification suite executing through real detection pipeline
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  resetSimulation();
                  if (typeof window !== 'undefined' && window.history.replaceState) {
                    const url = new URL(window.location.href);
                    url.searchParams.delete('demo');
                    window.history.replaceState({}, '', url.pathname + (url.search ? url.search : '') + url.hash);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-white text-rose-600 hover:bg-rose-50 font-bold text-xs tracking-wider transition-all shadow-md hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Return to Live Data</span>
              </button>
            </div>
          )}

          {children}
        </main>

        <footer className="px-6 py-4 border-t border-slate-200 bg-white/90 backdrop-blur-md text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-mono text-[11px] text-slate-600">SkyGuard AWS Subcontinent Mesh • Active Telemetry Radar</span>
          </div>
          <span className="font-mono text-[10px] text-slate-500">
            SkyGuard Atmospheric Anomaly Detection • High-Fidelity Simulation Pipeline
          </span>
        </footer>
      </div>
    </div>
  );
};
