import React, { useState, useEffect } from 'react';
import {
  Menu,
  Clock,
  Bell,
  Search,
  ExternalLink,
  Cpu,
} from 'lucide-react';
import type { DashboardTab, AWSStation } from '../../types/dashboard.types';

interface DashboardTopBarProps {
  activeTab: DashboardTab;
  onToggleSidebar: () => void;
  stations: AWSStation[];
  onSelectStation?: (stationId: string) => void;
  onNavigateHome: () => void;
  activeAnomaliesCount: number;
}

const TAB_TITLES: Record<DashboardTab, { title: string; category: string; categoryFamily: 'sky' | 'indigo' | 'teal' | 'amber' }> = {
  'command-center': { title: 'Command Overview', category: 'COMMAND CENTER', categoryFamily: 'sky' },
  'live-monitoring': { title: 'Live Sensor Telemetry', category: 'MONITORING', categoryFamily: 'sky' },
  'live-weather': { title: 'Live Weather Conditions', category: 'MONITORING', categoryFamily: 'sky' },
  'station-map': { title: 'AWS Station Network Map', category: 'MONITORING', categoryFamily: 'sky' },
  'anomaly-alerts': { title: 'Anomaly Alerts & Triage', category: 'INTELLIGENCE', categoryFamily: 'indigo' },
  'anomaly-investigation': { title: 'Deep Dive Triage (A-1042)', category: 'INTELLIGENCE', categoryFamily: 'indigo' },
  'cross-station': { title: 'Spatial Intelligence & Correlation', category: 'INTELLIGENCE', categoryFamily: 'indigo' },
  'historical-analysis': { title: 'Historical Drift & Time-Series', category: 'INTELLIGENCE', categoryFamily: 'indigo' },
  'weather-analytics': { title: 'Weather & Diurnal Analytics', category: 'INTELLIGENCE', categoryFamily: 'indigo' },
  'sensor-health': { title: 'Sensor Health & Calibration Matrix', category: 'OPERATIONS', categoryFamily: 'teal' },
  'maintenance': { title: 'Response & Field Tickets', category: 'OPERATIONS', categoryFamily: 'teal' },
  'simulation-lab': { title: 'Simulation & Fault Injection Lab', category: 'TESTBENCH', categoryFamily: 'amber' },
};

export const DashboardTopBar: React.FC<DashboardTopBarProps> = ({
  activeTab,
  onToggleSidebar,
  stations,
  onSelectStation,
  onNavigateHome,
  activeAnomaliesCount,
}) => {
  const [time, setTime] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-IN', { hour12: false }) + ' IST');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const meta = TAB_TITLES[activeTab] || { title: 'Dashboard', category: 'AWS MONITOR', categoryFamily: 'sky' };

  const getCategoryColor = (family: 'sky' | 'indigo' | 'teal' | 'amber') => {
    switch (family) {
      case 'sky':
        return 'text-sky-400';
      case 'indigo':
        return 'text-indigo-400';
      case 'teal':
        return 'text-emerald-400';
      case 'amber':
        return 'text-amber-400';
    }
  };

  const filteredStations = searchQuery.trim()
    ? stations.filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.location.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <header className="h-16 bg-gradient-to-r from-[#090e1c]/90 via-[#0d1428]/90 to-[#090e1c]/90 border-b border-slate-800/80 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-lg shadow-black/20">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent hover:border-slate-700/60 transition-all"
          title="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-[10px] font-mono tracking-wider text-slate-400 uppercase">
            <span className={`font-semibold ${getCategoryColor(meta.categoryFamily)}`}>{meta.category}</span>
            <span>/</span>
            <span className="text-slate-300 font-medium">{activeTab}</span>
          </div>
          <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
            {meta.title}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Quick Search Dropdown with Glass Texture */}
        <div className="relative hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Find station (e.g. AWS-001)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              className="w-56 lg:w-64 pl-9 pr-3 py-1.5 rounded-xl bg-gradient-to-r from-slate-900/90 to-[#0e1629]/90 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/30 transition-all font-mono backdrop-blur-md"
            />
          </div>

          {/* Quick Search Results Dropdown */}
          {isSearchOpen && filteredStations.length > 0 && (
            <div
              className="absolute left-0 right-0 mt-2 p-2 bg-[#0c1326] border border-slate-700/80 rounded-2xl shadow-2xl z-50 max-h-64 overflow-y-auto backdrop-blur-xl"
              onMouseLeave={() => setIsSearchOpen(false)}
            >
              <div className="text-[10px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider font-mono">
                Matching Stations
              </div>
              {filteredStations.map((station) => (
                <button
                  key={station.id}
                  onClick={() => {
                    if (onSelectStation) onSelectStation(station.id);
                    setSearchQuery('');
                    setIsSearchOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-slate-800/80 flex items-center justify-between text-xs transition-colors group"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-200 group-hover:text-white">{station.name}</span>
                    <span className="text-[10px] text-slate-400">{station.location}, {station.state}</span>
                  </div>
                  <span className="font-mono text-[10px] text-sky-400 font-bold">{station.id}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Live Clock with Glass Backdrop */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/70 border border-slate-800/80 text-xs font-mono text-slate-200 shadow-sm backdrop-blur-md">
          <Clock className="w-3.5 h-3.5 text-sky-400" />
          <span>{time || '--:--:-- IST'}</span>
        </div>

        {/* Prototype Simulated Banner with Soft Amber Glow */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-[11px] font-semibold text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
          <Cpu className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span className="tracking-wide">SIMULATED AWS PIPELINE</span>
        </div>

        {/* Alert Bell with Warm Coral-Red Dot */}
        <div className="relative">
          <button
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent hover:border-slate-800 transition-colors relative"
            title={`${activeAnomaliesCount} active alerts`}
          >
            <Bell className="w-4 h-4" />
            {activeAnomaliesCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
            {activeAnomaliesCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
            )}
          </button>
        </div>

        {/* Landing Page Link */}
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-900/80 hover:bg-sky-500/15 border border-slate-800 hover:border-sky-500/40 transition-all shadow-sm"
          title="Return to Landing Page"
        >
          <span className="hidden sm:inline">Landing Page</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>
    </header>
  );
};
