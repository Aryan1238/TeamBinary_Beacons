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
  const { simulationStatus, tickCount, activeFaults, mlResults } = useTelemetry();
  const activeFaultCount = Object.keys(activeFaults).length;
  const mlAnomalyCount = Object.values(mlResults).filter((r) => r.status === 'ANOMALY').length;
  const totalAnomalies = mlAnomalyCount + activeFaultCount;

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
          value={totalAnomalies}
          unit="Signals"
          icon={AlertTriangle}
          trend={{
            value: totalAnomalies,
            isPositive: totalAnomalies === 0,
            label: totalAnomalies > 0 ? `${totalAnomalies} active anomaly signal(s)` : 'All stations nominal',
          }}
          subtext={
            mlAnomalyCount > 0
              ? `${mlAnomalyCount} LSTM sequence anomaly detected`
              : activeFaultCount > 0
              ? `${activeFaultCount} testbench injected fault(s) active`
              : '0 active sequence anomalies'
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
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-start h-fit relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-sky-400/30 to-transparent" />

          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 flex items-center gap-2 tracking-tight">
                <MapPin className="w-4 h-4 text-sky-600" />
                <span>Regional Station Status Distribution</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Spatial breakdown of stations monitored across key geography zones
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('station-map')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-sky-700 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 transition-all shadow-xs"
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
                  ? 'border-emerald-200 hover:border-emerald-300 bg-emerald-50/60 text-emerald-800'
                  : s.status === 'WARNING'
                  ? 'border-amber-200 hover:border-amber-300 bg-amber-50/60 text-amber-800'
                  : s.status === 'ANOMALY'
                  ? 'border-rose-200 hover:border-rose-300 bg-rose-50/60 text-rose-800'
                  : 'border-slate-200 bg-slate-50 text-slate-600';

              return (
                <button
                  key={s.id}
                  onClick={() => onSelectStation(s.id)}
                  className={`p-3 rounded-xl border text-left transition-all group flex flex-col justify-between ${statusBg}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-slate-500 group-hover:text-slate-900">
                      {s.id}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-current" />
                  </div>
                  <div className="mt-2">
                    <div className="font-semibold text-xs text-slate-900 truncate">{s.name}</div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {s.location}, {s.state} • <span className="text-sky-600 font-semibold">{s.dataSource || '[Meteostat + NOAA]'}</span>
                    </div>
                  </div>
                  <div className="mt-2 text-[10px] font-mono flex items-center justify-between text-slate-600">
                    <span className="font-bold">{s.sensors.temperature.value}°C</span>
                    <span className="text-slate-500">{s.sensors.humidity.value}%</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2 font-mono">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> {normalCount} Normal</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> {warningCount} Warning</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" /> {anomalyCount} Anomaly</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-400" /> {offlineCount} Offline</span>
            </div>
            <span className="text-sky-700 font-bold">{stations.length} GPS NODES SYNCED</span>
          </div>
        </div>

        {/* Priority Anomaly Triage Feed */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-rose-400/30 to-transparent" />

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 tracking-tight">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>Active Anomaly Feed</span>
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-rose-50 text-rose-700 border border-rose-200">
                {anomalies.length} ALERTS
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Sensor signals breaching statistical and multi-station physical consistency rules.
            </p>

            <div className="space-y-3">
              {anomalies.length > 0 ? (
                anomalies.slice(0, 2).map((alert) => (
                  <AlertRow
                    key={alert.id}
                    alert={alert}
                    onInvestigate={(a) => {
                      onInvestigateAlert(a);
                      onNavigateTab('anomaly-investigation');
                    }}
                    compact
                  />
                ))
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-xs text-emerald-700 font-semibold block">All Stations Nominal</span>
                  <span className="text-[11px] text-slate-500">No active anomaly triggers across monitored network.</span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('anomaly-alerts')}
            className="w-full mt-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 flex items-center justify-center gap-1.5 transition-all shadow-xs"
          >
            <span>View All Anomalies & Triage</span>
            <ArrowRight className="w-3.5 h-3.5 text-sky-600" />
          </button>
        </div>
      </div>

      {/* Fleet Telemetry Cards Section with Filter Tabs */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 tracking-tight">
              <TrendingUp className="w-4 h-4 text-sky-600" />
              <span>Station Fleet Telemetry Overview</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select a station card to open its dedicated live monitoring drill-down
            </p>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-1 bg-white p-1.5 rounded-xl border border-slate-200 text-xs self-start sm:self-center shadow-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1" />
            {(['ALL', 'NORMAL', 'WARNING', 'ANOMALY', 'OFFLINE'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1 rounded-lg font-mono font-semibold transition-all ${
                  statusFilter === filter
                    ? 'bg-sky-50 text-sky-700 border border-sky-200 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
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
