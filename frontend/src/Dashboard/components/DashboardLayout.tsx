import React, { useState } from 'react';
import {
  LayoutDashboard,
  Building2,
  Activity,
  AlertTriangle,
  Cpu,
  Menu,
  X
} from 'lucide-react';
import { DashboardNavTab } from '../types';
import { DashboardHeader } from './DashboardHeader';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: DashboardNavTab;
  onSelectTab: (tab: DashboardNavTab) => void;
  onBackToLanding: () => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  activeTab,
  onSelectTab,
  onBackToLanding
}) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const navItems = [
    { id: 'overview' as DashboardNavTab, label: 'Overview', icon: LayoutDashboard },
    { id: 'stations' as DashboardNavTab, label: 'Stations', icon: Building2, count: 6 },
    { id: 'telemetry' as DashboardNavTab, label: 'Telemetry', icon: Activity, phase: 'P3' },
    { id: 'anomalies' as DashboardNavTab, label: 'Anomalies', icon: AlertTriangle, phase: 'P4' },
    { id: 'diagnostics' as DashboardNavTab, label: 'Diagnostics', icon: Cpu, phase: 'P7' }
  ];

  return (
    <div className="dashboard-root flex flex-col h-screen overflow-hidden">
      {/* Standalone Dashboard Header */}
      <DashboardHeader onBackToLanding={onBackToLanding} />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Mobile Sidebar Backdrop */}
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar Navigation */}
        <aside
          className={`fixed md:static inset-y-0 left-0 z-50 w-60 bg-[#0A101D] border-r border-slate-800/90 flex flex-col transition-transform duration-200 ease-in-out select-none ${
            mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          {/* Mobile Sidebar Close Button */}
          <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-800">
            <span className="font-bold text-white text-sm">Navigation</span>
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Links Section */}
          <div className="p-3 flex-1 overflow-y-auto space-y-1">
            <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Monitoring Modules
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && (
                    <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] font-mono text-slate-300">
                      {item.count}
                    </span>
                  )}
                  {item.phase && (
                    <span className="px-1.5 py-0.2 rounded bg-slate-800/80 border border-slate-700/60 text-[9px] font-mono text-cyan-400">
                      {item.phase}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Sidebar Footer Info */}
          <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-400 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-cyan-400 font-bold">AWS MESH</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Simulated Node Matrix • Phase 1
              </p>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-[#080D1A] flex flex-col">
          {/* Mobile toggle bar */}
          <div className="md:hidden flex items-center justify-between px-4 py-2 bg-[#0A101D] border-b border-slate-800 text-xs font-mono">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              <Menu className="w-4 h-4" />
              <span>Menu</span>
            </button>
            <span className="text-slate-400 uppercase tracking-wider">{activeTab}</span>
          </div>

          {/* Child Page Content */}
          <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
};
