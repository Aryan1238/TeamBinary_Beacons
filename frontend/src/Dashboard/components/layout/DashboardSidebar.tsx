import React from 'react';
import {
  LayoutDashboard,
  Activity,
  CloudSun,
  MapPin,
  AlertTriangle,
  SearchCode,
  Network,
  History,
  BarChart3,
  Cpu,
  Wrench,
  FlaskConical,
  Radio,
  ChevronLeft,
  ChevronRight,
  Home,
  ShieldCheck,
} from 'lucide-react';
import type { DashboardTab } from '../../types/dashboard.types';

interface SidebarItem {
  id: DashboardTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeColor?: string;
  accentFamily?: 'sky' | 'indigo' | 'teal' | 'amber';
}

interface SidebarSection {
  title: string;
  category: 'sky' | 'indigo' | 'teal' | 'amber';
  items: SidebarItem[];
}

interface DashboardSidebarProps {
  activeTab: DashboardTab;
  onSelectTab: (tab: DashboardTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onNavigateHome: () => void;
  activeAnomaliesCount: number;
  openTicketsCount?: number;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  activeTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  onNavigateHome,
  activeAnomaliesCount,
  openTicketsCount = 0,
}) => {
  const sections: SidebarSection[] = [
    {
      title: 'COMMAND CENTER',
      category: 'sky',
      items: [
        { id: 'command-center', label: 'System Overview', icon: LayoutDashboard, accentFamily: 'sky' },
      ],
    },
    {
      title: 'MONITORING',
      category: 'sky',
      items: [
        { id: 'live-monitoring', label: 'Live Telemetry', icon: Activity, accentFamily: 'sky' },
        { id: 'live-weather', label: 'Live Weather Feed', icon: CloudSun, accentFamily: 'sky' },
        { id: 'station-map', label: 'AWS Station Map', icon: MapPin, accentFamily: 'sky' },
      ],
    },
    {
      title: 'INTELLIGENCE & DETECTION',
      category: 'indigo',
      items: [
        {
          id: 'anomaly-alerts',
          label: 'Anomaly Alerts',
          icon: AlertTriangle,
          badge: activeAnomaliesCount > 0 ? activeAnomaliesCount : undefined,
          badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/35',
          accentFamily: 'indigo',
        },
        { id: 'anomaly-investigation', label: 'Deep Dive Triage', icon: SearchCode, accentFamily: 'indigo' },
        { id: 'cross-station', label: 'Spatial Intelligence', icon: Network, accentFamily: 'indigo' },
        { id: 'historical-analysis', label: 'Historical Drift', icon: History, accentFamily: 'indigo' },
        { id: 'weather-analytics', label: 'Weather Analytics', icon: BarChart3, accentFamily: 'indigo' },
      ],
    },
    {
      title: 'OPERATIONS',
      category: 'teal',
      items: [
        { id: 'sensor-health', label: 'Sensor Health Matrix', icon: Cpu, accentFamily: 'teal' },
        { id: 'maintenance', label: 'Maintenance Tickets', icon: Wrench, badge: openTicketsCount > 0 ? openTicketsCount : undefined, badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/35', accentFamily: 'teal' },
      ],
    },
    {
      title: 'SIMULATION & LAB',
      category: 'amber',
      items: [
        { id: 'simulation-lab', label: 'Simulation Testbench', icon: FlaskConical, accentFamily: 'amber' },
      ],
    },
  ];

  const getSectionTitleColor = (category: SidebarSection['category']) => {
    switch (category) {
      case 'sky':
        return 'text-sky-700';
      case 'indigo':
        return 'text-sky-800';
      case 'teal':
        return 'text-emerald-700';
      case 'amber':
        return 'text-amber-700';
    }
  };

  const getItemActiveStyle = (_category: SidebarSection['category']) => {
    return 'bg-sky-50 text-sky-700 font-semibold border-l-2 border-sky-600 shadow-2xs';
  };

  return (
    <aside
      className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-white border-r border-slate-200/90 shadow-xs transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200/80 shrink-0 bg-slate-50/70">
        {!collapsed ? (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-sky-600 border border-sky-500/50 flex items-center justify-center text-white font-bold shadow-md shadow-sky-600/20 shrink-0">
              <Radio className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div className="flex flex-col truncate">
              <span className="font-bold text-sm tracking-tight text-slate-900 flex items-center gap-1">
                SkyGuard <span className="text-sky-600 font-extrabold">AWS</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono tracking-wider">NETWORK MONITOR</span>
            </div>
          </div>
        ) : (
          <div className="mx-auto w-8 h-8 rounded-xl bg-sky-600 border border-sky-500/50 flex items-center justify-center text-white font-bold shadow-md shadow-sky-600/20">
            <Radio className="w-4 h-4 text-white animate-pulse" />
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ${
            collapsed ? 'hidden' : 'block'
          }`}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-200">
        {sections.map((section) => (
          <div key={section.title} className="space-y-1">
            {!collapsed ? (
              <div className={`px-3 text-[10px] font-bold tracking-wider uppercase font-mono ${getSectionTitleColor(section.category)}`}>
                {section.title}
              </div>
            ) : (
              <div className="h-2 border-t border-slate-200 my-2" />
            )}

            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const activeClass = getItemActiveStyle(section.category);

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? activeClass
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-transparent'
                  } ${collapsed ? 'justify-center' : ''}`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-sky-600' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  {!collapsed && (
                    <span className="truncate flex-1 text-left">{item.label}</span>
                  )}
                  {!collapsed && item.badge !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold shrink-0 font-mono ${
                        item.badgeColor || 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer / Exit to Landing Page */}
      <div className="p-3 border-t border-slate-200/80 bg-slate-50/70 shrink-0 space-y-2">
        {collapsed ? (
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Expand Sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="px-2.5 py-2 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center gap-2.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">Telemetry Mesh Active</span>
              <span className="text-[9px] text-emerald-600 font-mono">7 Stations Synced</span>
            </div>
          </div>
        )}

        <button
          onClick={onNavigateHome}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80 hover:border-sky-300 transition-all ${
            collapsed ? 'justify-center' : ''
          }`}
          title="Back to Landing Page"
        >
          <Home className="w-4 h-4 shrink-0 text-sky-600" />
          {!collapsed && <span>Return to Landing Page</span>}
        </button>
      </div>
    </aside>
  );
};
