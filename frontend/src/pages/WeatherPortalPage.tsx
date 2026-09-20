import React, { useState, useMemo } from 'react';
import {
  Search,
  MapPin,
  Compass,
  Layers,
  Sparkles,
  Sliders,
  ShieldCheck,
  RotateCcw,
  BarChart2,
  Calendar,
  Clock,
  Radio,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { Station, AnomalyRecord, NetworkKPIs } from '../types';
import { IndiaMap, WeatherParameterType } from '../components/IndiaMap';
import { WindsObservationPanel, TemporalMode, StationFilterType } from '../components/WindsObservationPanel';
import { WindsRankingsPanel } from '../components/WindsRankingsPanel';
import { WeatherForecastStrip } from '../components/WeatherForecastStrip';
import { WeatherParameterModal } from '../components/WeatherParameterModal';

interface WeatherPortalPageProps {
  stations: Station[];
  anomalies: AnomalyRecord[];
  kpis: NetworkKPIs | null;
  onSelectStation: (stationId: string) => void;
  onInvestigateAnomaly: (anomaly: AnomalyRecord) => void;
}

export const WeatherPortalPage: React.FC<WeatherPortalPageProps> = ({
  stations,
  anomalies,
  kpis,
  onSelectStation,
  onInvestigateAnomaly
}) => {
  // Active parameter
  const [activeParameter, setActiveParameter] = useState<WeatherParameterType>('temperature');

  // Selected station
  const [selectedStationId, setSelectedStationId] = useState<string>(
    stations.length > 0 ? stations[0].id : 'LOC-MH-02'
  );

  // Search input
  const [searchQuery, setSearchQuery] = useState('');

  // Panel collapse states
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);

  // Temporal & filter state
  const [temporalMode, setTemporalMode] = useState<TemporalMode>('live');
  const [stationFilter, setStationFilter] = useState<StationFilterType>('all');

  // Parameter deep dive modal
  const [modalParam, setModalParam] = useState<WeatherParameterType | null>(null);

  // Current selected station object
  const selectedStation = useMemo(() => {
    return stations.find(s => s.id === selectedStationId) || stations[0] || null;
  }, [stations, selectedStationId]);

  // Filtered station list based on search and layer filter
  const displayedStations = useMemo(() => {
    return stations.filter(s => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          s.name.toLowerCase().includes(q) ||
          s.state.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q);
        if (!matches) return false;
      }
      // Layer filter
      if (stationFilter === 'anomalous') {
        return s.status !== 'healthy';
      }
      return true;
    });
  }, [stations, searchQuery, stationFilter]);

  // Quick select station
  const handleSelectStation = (id: string) => {
    setSelectedStationId(id);
    const found = stations.find(s => s.id === id);
    if (found) {
      // Station selected
    }
  };

  const anomalousCount = stations.filter(s => s.status !== 'healthy').length;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100 overflow-hidden font-sans">
      {/* Top WINDS Portal Header / Location Search Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 z-10 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
            <h1 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>National Weather Intelligence Portal</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                WINDS-Interactive
              </span>
            </h1>
          </div>
          <span className="hidden md:inline text-xs text-slate-400">|</span>
          <p className="hidden lg:block text-xs text-slate-500">
            Real-time multi-layer observations across 15 Automatic Weather Stations
          </p>
        </div>

        {/* Search Bar with Quick Chips */}
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search station (e.g. Pune, Delhi, Jaipur)..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
            />
          </div>
        </div>

        {/* Quick Location Chips */}
        <div className="hidden xl:flex items-center gap-1.5 text-xs">
          <span className="text-[11px] text-slate-400">Quick:</span>
          {['Pune', 'Delhi', 'Mumbai', 'Bengaluru', 'Jaipur'].map(city => {
            const st = stations.find(s => s.name.toLowerCase().includes(city.toLowerCase()));
            if (!st) return null;
            const isSel = selectedStation?.id === st.id;
            return (
              <button
                key={city}
                onClick={() => handleSelectStation(st.id)}
                className={`px-2 py-1 rounded-md text-[11px] font-medium border transition ${
                  isSel
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {city}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Interactive 3-Zone Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Observation / Layer Controls Panel */}
        <WindsObservationPanel
          isCollapsed={leftPanelCollapsed}
          onToggleCollapse={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
          activeParameter={activeParameter}
          onParameterChange={(p) => setActiveParameter(p)}
          temporalMode={temporalMode}
          onTemporalModeChange={(m) => setTemporalMode(m)}
          stationFilter={stationFilter}
          onStationFilterChange={(f) => setStationFilter(f)}
          totalStations={stations.length}
          anomalousCount={anomalousCount}
          apiStatus="ONLINE"
        />

        {/* Center: Leaflet Interactive Map & Forecast Section */}
        <div className="flex-1 flex flex-col overflow-y-auto p-3 gap-3">
          {/* Active Parameter Quick Stats Banner */}
          <div className="bg-white rounded-xl border border-slate-200 p-2.5 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">
                Active Layer:
              </span>
              <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                {activeParameter}
              </span>
              <span className="text-[11px] text-slate-500">
                • Showing {displayedStations.length} of {stations.length} locations
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setModalParam(activeParameter)}
                className="text-xs px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition font-medium flex items-center gap-1"
              >
                <Sliders className="w-3 h-3" />
                <span>Deep-Dive Distribution</span>
              </button>
            </div>
          </div>

          {/* Interactive Map Container */}
          <div className="h-[460px] w-full rounded-2xl overflow-hidden shadow-xs border border-slate-200">
            <IndiaMap
              stations={displayedStations}
              selectedStationId={selectedStationId}
              onSelectStation={handleSelectStation}
              parameter={activeParameter}
              onParameterChange={(p) => setActiveParameter(p)}
            />
          </div>

          {/* 24-Hour Hourly & 5-Day Forecast Strip for Selected Station */}
          <div className="w-full">
            <WeatherForecastStrip
              station={selectedStation}
              onOpenDeepDive={(p) => setModalParam(p)}
            />
          </div>
        </div>

        {/* Right Dynamic Rankings & Station Dossier Panel */}
        <WindsRankingsPanel
          stations={stations}
          selectedStation={selectedStation}
          onSelectStation={handleSelectStation}
          onOpenDeepDive={(p) => setModalParam(p)}
          onViewStationDetails={onSelectStation}
          isCollapsed={rightPanelCollapsed}
          onToggleCollapse={() => setRightPanelCollapsed(!rightPanelCollapsed)}
        />
      </div>

      {/* Parameter Deep-Dive Modal */}
      {modalParam && (
        <WeatherParameterModal
          parameter={modalParam}
          selectedStation={selectedStation}
          stations={stations}
          onClose={() => setModalParam(null)}
          onSelectStation={(id) => {
            handleSelectStation(id);
            setModalParam(null);
          }}
        />
      )}
    </div>
  );
};
