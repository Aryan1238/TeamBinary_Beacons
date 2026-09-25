import React from 'react';
import {
  LayoutDashboard,
  Radio,
  AlertTriangle,
  Building2,
  LineChart,
  BrainCircuit,
  Activity,
  Wrench,
  FlaskConical,
  ShieldCheck,
  FileText,
  Bot,
  Sparkles,
  ChevronRight,
  X,
  CloudSun
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenCopilot?: () => void;
  activeAnomaliesCount: number;
  criticalCount: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: any;
  badge?: number;
  badgeCritical?: boolean;
  isAction?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenCopilot,
  activeAnomaliesCount,
  criticalCount,
  isMobileOpen = false,
  onCloseMobile
}) => {
  const navSections: NavSection[] = [
    {
      title: 'MONITOR',
      items: [
        { id: 'command-center', label: 'Command Center', icon: LayoutDashboard },
        { id: 'weather', label: 'Weather Portal (WINDS)', icon: CloudSun },
        { id: 'live-network', label: 'Live Network', icon: Radio },
        { id: 'stations', label: 'Stations Directory', icon: Building2 },
      ]
    },
    {
      title: 'INTELLIGENCE',
      items: [
        { id: 'anomalies', label: 'Anomaly Center', icon: AlertTriangle, badge: activeAnomaliesCount, badgeCritical: criticalCount > 0 },
        { id: 'explainability', label: 'AI Explainability (XAI)', icon: BrainCircuit },
        { id: 'analytics', label: 'Weather Analytics', icon: LineChart },
      ]
    },
    {
      title: 'OPERATIONS',
      items: [
        { id: 'sensor-health', label: 'Sensor Health', icon: Activity },
        { id: 'maintenance', label: 'Predictive Maintenance', icon: Wrench },
        { id: 'simulation-lab', label: 'Simulation Lab', icon: FlaskConical },
      ]
    },
    {
      title: 'DATA & AUDIT',
      items: [
        { id: 'data-quality', label: 'Data Quality (WMO-8)', icon: ShieldCheck },
        { id: 'reports', label: 'Official Reports', icon: FileText },
      ]
    },
    {
      title: 'ASSIST',
      items: [
        { id: 'copilot', label: 'SkyGuard Copilot', icon: Bot, isAction: true },
      ]
    }
  ];

  const handleItemClick = (item: NavItem) => {
    if (item.isAction && onOpenCopilot) {
      onOpenCopilot();
    } else {
      onSelectTab(item.id);
    }
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col h-screen select-none shrink-0 transition-transform duration-200 ease-in-out shadow-xs ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => { onSelectTab('landing'); if (onCloseMobile) onCloseMobile(); }}
          >
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 p-0.5 shadow-md shadow-sky-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-400"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-slate-900">SKYGUARD</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-50 text-sky-700 font-mono font-bold border border-sky-200">
                  AI
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">MoES / IMD Prototype</p>
            </div>
          </div>

          {/* Close button for mobile drawer */}
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto p-3 space-y-5">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              <h3 className="px-3 text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase">
                {section.title}
              </h3>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition group ${
                        isActive
                          ? 'bg-sky-50 text-sky-700 font-semibold border border-sky-200 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className={`w-4 h-4 shrink-0 transition ${
                          isActive ? 'text-sky-600' : 'text-slate-400 group-hover:text-sky-600'
                        }`} />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge !== undefined && item.badge > 0 && (
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          item.badgeCritical
                            ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer IMD / MoES Badge */}
        <div className="p-3 border-t border-slate-200 bg-slate-50">
          <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between shadow-2xs">
            <div>
              <span className="text-[10px] font-mono text-sky-700 font-bold block">SkyGuard AI • Telemetry</span>
              <span className="text-[9px] text-slate-500 font-sans block">Automatic Weather Stations</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
        </div>
      </aside>
    </>
  );
};
