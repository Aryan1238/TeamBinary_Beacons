import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Bot,
  Zap,
  RefreshCw,
  Globe2,
  Menu,
  Clock,
  ChevronDown,
  LayoutDashboard,
  CloudSun,
  Radio,
  Building2,
  AlertTriangle,
  LineChart,
  BrainCircuit,
  FileText,
  Activity,
  Wrench,
  FlaskConical,
  ShieldCheck,
  Check
} from 'lucide-react';
import { NetworkKPIs } from '../types';

interface TopBarProps {
  kpis: NetworkKPIs | null;
  mode: 'LIVE' | 'DEMO';
  onOpenCopilot: () => void;
  onOpenDemo: () => void;
  onReset: () => void;
  onRefreshLive: () => void;
  audioEnabled: boolean;
  onToggleAudio: () => void;
  activeAnomaliesCount: number;
  onToggleMobile?: () => void;
  currentTab?: string;
  onSelectTab?: (tab: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  kpis,
  mode,
  onOpenCopilot,
  onOpenDemo,
  onReset,
  onRefreshLive,
  audioEnabled,
  onToggleAudio,
  activeAnomaliesCount,
  onToggleMobile,
  currentTab = 'command-center',
  onSelectTab
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-IN', { hour12: false }) + ' IST');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMoreDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await onRefreshLive();
    setTimeout(() => setRefreshing(false), 800);
  };

  const isDemo = mode === 'DEMO';

  const primaryTabs = [
    { id: 'command-center', label: 'HOME' },
    { id: 'weather', label: 'WEATHER' },
    { id: 'live-network', label: 'LIVE NETWORK' },
    { id: 'stations', label: 'STATIONS' },
    { id: 'anomalies', label: 'ANOMALIES', badge: activeAnomaliesCount },
    { id: 'analytics', label: 'ANALYTICS' },
    { id: 'explainability', label: 'AI INSIGHTS' },
    { id: 'reports', label: 'REPORTS' }
  ];

  const secondaryTools = [
    { id: 'simulation-lab', label: 'Simulation Lab', icon: FlaskConical },
    { id: 'sensor-health', label: 'Sensor Health & Drift', icon: Activity },
    { id: 'maintenance', label: 'Predictive Maintenance', icon: Wrench },
    { id: 'data-quality', label: 'Data Quality (WMO-8)', icon: ShieldCheck },
    { id: 'landing', label: 'Portal Introduction / Landing', icon: LayoutDashboard }
  ];

  return (
    <header className="h-14 bg-white border-b border-slate-200/90 px-3 sm:px-5 flex items-center justify-between z-30 select-none shadow-xs font-sans">
      {/* Left: Mobile hamburger + Operational Status Badge */}
      <div className="flex items-center gap-3">
        {onToggleMobile && (
          <button
            onClick={onToggleMobile}
            className="md:hidden p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {isDemo ? (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="text-[10px] font-mono font-bold text-amber-800 tracking-wider">
              SIH DEMO MODE
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-800 tracking-wider">
              LIVE • Open-Meteo
            </span>
          </div>
        )}
      </div>

      {/* Center: WINDS-style Portal Navigation Tabs (visible on desktop) */}
      {onSelectTab && (
        <nav className="hidden xl:flex items-center gap-1">
          {primaryTabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`relative px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition flex items-center gap-1.5 ${
                  isActive
                    ? 'text-blue-700 bg-blue-50/80 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-red-500 text-white font-bold">
                    {tab.badge}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-600 rounded-full"></span>
                )}
              </button>
            );
          })}

          {/* More Tools Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition flex items-center gap-1"
            >
              <span>MORE</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${moreDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {moreDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl border border-slate-200 shadow-lg py-1 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  Engineering & Maintenance
                </div>
                {secondaryTools.map(tool => {
                  const Icon = tool.icon;
                  const isCur = currentTab === tool.id;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => {
                        onSelectTab(tool.id);
                        setMoreDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs transition text-left ${
                        isCur ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-slate-500" />
                        <span>{tool.label}</span>
                      </div>
                      {isCur && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </nav>
      )}

      {/* Right Controls: Clock, Sync, Exit Demo, Audio, Copilot, SIH Demo */}
      <div className="flex items-center gap-2">
        <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-mono text-slate-500 bg-slate-100/80 px-2.5 py-1 rounded-lg border border-slate-200">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>{timeStr}</span>
        </div>

        {!isDemo && (
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="flex items-center gap-1 p-1.5 sm:px-2 sm:py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition"
            title="Fetch Fresh Weather Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span className="hidden sm:inline text-[11px] font-medium">Sync</span>
          </button>
        )}

        {isDemo && (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
            title="Exit Demo and return to real Open-Meteo weather data"
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Return to Live Data</span>
          </button>
        )}

        <button
          onClick={onToggleAudio}
          className={`p-1.5 rounded-lg border transition text-xs flex items-center gap-1.5 ${
            audioEnabled
              ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
              : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'
          }`}
          title={audioEnabled ? "Alert Sound: Enabled" : "Alert Sound: Muted"}
        >
          {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        <button
          onClick={onOpenCopilot}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 hover:bg-blue-100 transition text-xs font-semibold shadow-2xs"
        >
          <Bot className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden md:inline">Copilot</span>
        </button>

        <button
          onClick={onOpenDemo}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-2xs transition"
        >
          <Zap className="w-3.5 h-3.5 fill-white" />
          <span>SIH DEMO</span>
        </button>
      </div>
    </header>
  );
};
