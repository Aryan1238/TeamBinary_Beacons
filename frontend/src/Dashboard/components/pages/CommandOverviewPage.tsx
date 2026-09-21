import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Radio,
  ShieldCheck,
  MapPin,
  TrendingUp,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { PageHeader } from '../common/PageHeader';
import { StatCard } from '../common/StatCard';
import { StationCard } from '../common/StationCard';
import { AlertRow } from '../common/AlertRow';
import type { AWSStation, AnomalyAlert, DashboardTab, StationStatus } from '../../types/dashboard.types';
import { useTelemetry } from '../../context/TelemetryContext';

interface CommandOverviewPageProps {
  stations: AWSStation[];
  anomalies: AnomalyAlert[];
  onSelectStation: (stationId: string) => void;
  onNavigateTab: (tab: DashboardTab) => void;
  onInvestigateAlert: (alert: AnomalyAlert) => void;
}

export const CommandOverviewPage: React.FC<CommandOverviewPageProps> = ({
  stations,
  anomalies,
  onSelectStation,
  onNavigateTab,
  onInvestigateAlert,
}) => {
  const [statusFilter, setStatusFilter] = useState<'ALL' | StationStatus>('ALL');
  const { simulationStatus, tickCount, activeFaults } = useTelemetry();
  const activeFaultCount = Object.keys(activeFaults).length;

  const normalCount = stations.filter((s) => s.status === 'NORMAL').length;
  const warningCount = stations.filter((s) => s.status === 'WARNING').length;
  const anomalyCount = stations.filter((s) => s.status === 'ANOMALY').length;
  const offlineCount = stations.filter((s) => s.status === 'OFFLINE').length;

  const avgHealth = Math.round(
    stations.reduce((acc, s) => acc + s.healthScore, 0) / stations.length
  );

  const filteredStations = statusFilter === 'ALL'
    ? stations
    : stations.filter((s) => s.status === statusFilter);

  return (
    <div className="space-y-6">
      <PageHeader
        title="AWS Network Command Center"
        subtitle="Fleet-wide health telemetry, spatial status, and real-time anomaly surveillance across Indian Meteorological Stations."
        badge={simulationStatus === 'RUNNING' ? 'LIVE RADAR STREAM' : 'CENTRAL TELEMETRY RADAR'}
      />

      {/* KPI Stats Row — Thematic Color Assignment */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Monitored Fleet"
          value={stations.length}
          unit="Stations"
          icon={Radio}
          trend={{ value: 100, isPositive: true, label: 'online reach' }}
          subtext="6 synoptic meteorological zones"
          variant="sky"
        />

        <StatCard
          label="Fleet Health Index"
          value={`${avgHealth}%`}
          icon={ShieldCheck}
          trend={{ value: 2.4, isPositive: true, label: 'vs last 24h' }}
          subtext={`${normalCount} normal, ${warningCount} warning`}
          variant="emerald"
        />

        <StatCard
          label="Active Anomalies"
          value={anomalies.length + activeFaultCount}
          unit="Signals"
          icon={AlertTriangle}
          trend={{
            value: anomalies.length + activeFaultCount,
            isPositive: activeFaultCount === 0,
            label: activeFaultCount > 0 ? `${activeFaultCount} active fault(s)` : 'critical in AWS-003',
          }}
          subtext={
            activeFaultCount > 0
              ? `${activeFaultCount} testbench injected fault(s) active`
              : '1 Critical, 1 High, 1 Medium'
          }
          variant="rose"
        />

        <StatCard
          label="Telemetry Throughput"
          value={simulationStatus === 'RUNNING' ? `${480 + (tickCount % 4) * 6}` : '480'}
          unit="pkts/min"
          icon={Activity}
          trend={{ value: 99.8, isPositive: true, label: 'packet fidelity' }}
          subtext={
            simulationStatus === 'RUNNING'
              ? `Live Tick #${tickCount} • Active Stream`
              : simulationStatus === 'PAUSED'
              ? 'Stream Paused at current tick'
              : 'Standby baseline mode'
          }
          variant="indigo"
        />
      </div>

      {/* Mid-Row: Spatial Radar Overview + Active Anomalies Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spatial Mini-Map & Regional Distribution */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-[#111a31]/90 via-[#0e1628]/85 to-[#090e1c]/95 border border-slate-800/80 backdrop-blur-md shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-sky-400/20 to-transparent" />

          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-white flex items-center gap-2 tracking-tight">
                <MapPin className="w-4 h-4 text-sky-400" />
                <span>Regional Station Status Distribution</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Spatial breakdown of stations monitored across key geography zones
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('station-map')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-sky-300 hover:text-white bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 transition-all shadow-sm"
            >
              <span>Full Map View</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Station Visual Pinboard */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 my-2">
            {stations.map((s) => {
              const statusBg =
                s.status === 'NORMAL'
                  ? 'border-emerald-500/30 hover:border-emerald-500/60 bg-gradient-to-b from-emerald-950/30 to-[#0a101f]/80 text-emerald-300 hover:shadow-[0_0_15px_rgba(52,211,153,0.15)]'
                  : s.status === 'WARNING'
                  ? 'border-amber-500/30 hover:border-amber-500/60 bg-gradient-to-b from-amber-950/30 to-[#0a101f]/80 text-amber-300 hover:shadow-[0_0_15px_rgba(251,191,36,0.15)]'
                  : s.status === 'ANOMALY'
                  ? 'border-rose-500/40 hover:border-rose-500/80 bg-gradient-to-b from-rose-950/40 to-[#0a101f]/80 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                  : 'border-slate-800 bg-[#0a101f]/60 text-slate-400';

              return (
                <button
                  key={s.id}
                  onClick={() => onSelectStation(s.id)}
                  className={`p-3 rounded-xl border text-left transition-all group flex flex-col justify-between ${statusBg}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-slate-400 group-hover:text-white">
                      {s.id}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-current" />
                  </div>
                  <div className="mt-2">
                    <div className="font-semibold text-xs text-white truncate">{s.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{s.location}</div>
                  </div>
                  <div className="mt-2 text-[10px] font-mono flex items-center justify-between text-slate-300">
                    <span className="font-bold">{s.sensors.temperature.value}°C</span>
                    <span className="text-slate-400">{s.sensors.humidity.value}%</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2 font-mono">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" /> {normalCount} Normal</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]" /> {warningCount} Warning</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.6)]" /> {anomalyCount} Anomaly</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-500" /> {offlineCount} Offline</span>
            </div>
            <span className="text-sky-400 font-bold">12 GPS NODES SYNCED</span>
          </div>
        </div>

        {/* Priority Anomaly Triage Feed */}
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-[#181324]/90 via-[#101426]/85 to-[#090e1c]/95 border border-slate-800/80 backdrop-blur-md shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-rose-400/20 to-transparent" />

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white flex items-center gap-2 tracking-tight">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Active Anomaly Feed</span>
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.2)]">
                {anomalies.length} ALERTS
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Sensor signals breaching statistical and multi-station physical consistency rules.
            </p>

            <div className="space-y-3">
              {anomalies.slice(0, 2).map((alert) => (
                <AlertRow
                  key={alert.id}
                  alert={alert}
                  onInvestigate={(a) => {
                    onInvestigateAlert(a);
                    onNavigateTab('anomaly-investigation');
                  }}
                  compact
                />
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('anomaly-alerts')}
            className="w-full mt-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-900/80 hover:bg-slate-800/80 text-slate-200 hover:text-white border border-slate-700/80 flex items-center justify-center gap-1.5 transition-all shadow-sm"
          >
            <span>View All Anomalies & Triage</span>
            <ArrowRight className="w-3.5 h-3.5 text-sky-400" />
          </button>
        </div>
      </div>

      {/* Fleet Telemetry Cards Section with Filter Tabs */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 tracking-tight">
              <TrendingUp className="w-4 h-4 text-sky-400" />
              <span>Station Fleet Telemetry Overview</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select a station card to open its dedicated live monitoring drill-down
            </p>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-1 bg-[#0a101f]/80 p-1.5 rounded-xl border border-slate-800 text-xs self-start sm:self-center backdrop-blur-md">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1" />
            {(['ALL', 'NORMAL', 'WARNING', 'ANOMALY', 'OFFLINE'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1 rounded-lg font-mono font-semibold transition-all ${
                  statusFilter === filter
                    ? 'bg-sky-500/20 text-sky-200 border border-sky-500/40 shadow-[0_0_10px_rgba(56,189,248,0.2)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Station Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredStations.map((station) => (
            <StationCard
              key={station.id}
              station={station}
              onClick={(st) => {
                onSelectStation(st.id);
                onNavigateTab('live-monitoring');
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
