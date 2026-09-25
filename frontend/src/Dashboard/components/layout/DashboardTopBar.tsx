import React, { useState, useEffect } from 'react';
import {
  Menu,
  Clock,
  Bell,
  Search,
  ExternalLink,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';
import type { DashboardTab, AWSStation } from '../../types/dashboard.types';
import { useTelemetry } from '../../context/TelemetryContext';

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

  const {
    simulationStatus,
    tickCount,
    startSimulation,
    pauseSimulation,
    resetSimulation,
  } = useTelemetry();

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
    <header className="h-16 bg-white/95 border-b border-slate-200/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all"
          title="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-[10px] font-mono tracking-wider text-slate-500 uppercase">
            <span className="font-semibold text-sky-700">{meta.category}</span>
            <span>/</span>
            <span className="text-slate-600 font-medium">{activeTab}</span>
          </div>
          <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
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
              className="w-56 lg:w-64 pl-9 pr-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 transition-all font-mono"
            />
          </div>

          {/* Quick Search Results Dropdown */}
          {isSearchOpen && filteredStations.length > 0 && (
            <div
              className="absolute left-0 right-0 mt-2 p-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 max-h-64 overflow-y-auto"
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
                  className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-sky-50 flex items-center justify-between text-xs transition-colors group"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-800 group-hover:text-sky-700">{station.name}</span>
                    <span className="text-[10px] text-slate-500">{station.location}, {station.state}</span>
                  </div>
                  <span className="font-mono text-[10px] text-sky-600 font-bold">{station.id}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Live Clock with Glass Backdrop */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700 shadow-2xs">
          <Clock className="w-3.5 h-3.5 text-sky-600" />
          <span>{time || '--:--:-- IST'}</span>
        </div>

        {/* Simulation Controls Cluster */}
        <div className="flex items-center gap-1.5 sm:gap-2 p-1 rounded-2xl bg-slate-100 border border-slate-200 shadow-inner">
          {/* Status Pill */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-mono font-semibold transition-all ${
              simulationStatus === 'RUNNING'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : simulationStatus === 'PAUSED'
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-slate-200/80 text-slate-700 border border-slate-300'
            }`}
          >
            {simulationStatus === 'RUNNING' && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
              </span>
            )}
            {simulationStatus === 'PAUSED' && (
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            )}
            {simulationStatus === 'STOPPED' && (
              <span className="w-2 h-2 rounded-full bg-slate-400" />
            )}
            <span className="tracking-wide text-[10px] sm:text-[11px]">
              {simulationStatus === 'RUNNING' ? 'RUNNING' : simulationStatus === 'PAUSED' ? 'PAUSED' : 'STOPPED'}
            </span>
            {tickCount > 0 && (
              <span className="text-[10px] text-slate-500 hidden xl:inline font-mono">
                • #{tickCount}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            {simulationStatus !== 'RUNNING' ? (
              <button
                onClick={startSimulation}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all active:scale-95 cursor-pointer"
                title={simulationStatus === 'PAUSED' ? 'Resume Simulation' : 'Start Simulation'}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span className="hidden sm:inline">
                  {simulationStatus === 'PAUSED' ? 'Resume' : 'Start'}
                </span>
              </button>
            ) : (
              <button
                onClick={pauseSimulation}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition-all active:scale-95 cursor-pointer"
                title="Pause Simulation"
              >
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span className="hidden sm:inline">Pause</span>
              </button>
            )}

            <button
              onClick={resetSimulation}
              className="flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-transparent hover:border-slate-300 transition-all active:scale-95 cursor-pointer"
              title="Reset Simulation to Baseline Values"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Reset</span>
            </button>
          </div>
        </div>

        {/* Alert Bell with Warm Coral-Red Dot */}
        <div className="relative">
          <button
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors relative"
            title={`${activeAnomaliesCount} active alerts`}
          >
            <Bell className="w-4 h-4" />
            {activeAnomaliesCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
            {activeAnomaliesCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
            )}
          </button>
        </div>

        {/* Landing Page Link */}
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-700 hover:text-sky-700 bg-white hover:bg-sky-50 border border-slate-200 hover:border-sky-300 transition-all shadow-2xs"
          title="Return to Landing Page"
        >
          <span className="hidden sm:inline">Landing Page</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
        </button>
      </div>
    </header>
  );
};
