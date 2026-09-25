import React, { useState } from 'react';
import {
  Network,
  Radio,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  MapPin,
  ExternalLink,
  ShieldAlert,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { PageHeader } from '../common/PageHeader';
import { ChartWrapper } from '../common/ChartWrapper';
import { StatusBadge } from '../common/StatusBadge';
import type { AWSStation, DashboardTab, StationStatus } from '../../types/dashboard.types';
import { useTelemetry } from '../../context/TelemetryContext';
import { MOCK_24H_HISTORY } from '../../data/mockStations';

interface CrossStationIntelligencePageProps {
  stations: AWSStation[];
  selectedStationId?: string;
  onSelectStation?: (stationId: string) => void;
  onNavigateTab: (tab: DashboardTab) => void;
}

// Exact Haversine formula (km)
const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371.0;
  const dLat = ((lat2 - lat1) * Math.PI) / 180.0;
  const dLon = ((lon2 - lon1) * Math.PI) / 180.0;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180.0) *
      Math.cos((lat2 * Math.PI) / 180.0) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

// Station climatological midpoints for delta reference
const CLIMATOLOGICAL_MIDPOINTS: Record<string, number> = {
  'AWS-001': 30.5, // Chennai
  'AWS-002': 24.5, // Bengaluru
  'AWS-003': 26.0, // Pune
  'AWS-004': 27.5, // Mumbai
  'AWS-005': 27.0, // Kolkata
  'AWS-006': 27.5, // Ahmedabad
  'AWS-007': 27.5, // Hyderabad
};

export const CrossStationIntelligencePage: React.FC<CrossStationIntelligencePageProps> = ({
  stations,
  selectedStationId,
  onSelectStation,
  onNavigateTab,
}) => {
  const { historyBuffers, activeInvestigations } = useTelemetry();
  const [targetId, setTargetId] = useState<string>(selectedStationId || 'AWS-003');

  const handleSelectTarget = (id: string) => {
    setTargetId(id);
    if (onSelectStation) {
      onSelectStation(id);
    }
  };

  const targetStation = stations.find((s) => s.id === targetId) || stations[0];
  const targetMid = CLIMATOLOGICAL_MIDPOINTS[targetStation.id] || 27.0;
  const targetTemp = targetStation.sensors.temperature.value;
  const targetDelta = +(targetTemp - targetMid).toFixed(2);

  // Compute distances to all other stations
  const otherStationsWithDist = stations
    .filter((s) => s.id !== targetStation.id)
    .map((s) => {
      const dist = haversineKm(
        targetStation.coordinates.lat,
        targetStation.coordinates.lng,
        s.coordinates.lat,
        s.coordinates.lng
      );
      const sMid = CLIMATOLOGICAL_MIDPOINTS[s.id] || 27.0;
      const sTemp = s.sensors.temperature.value;
      const sDelta = +(sTemp - sMid).toFixed(2);

      // The 50% Rule: same sign as target deviation AND |peerDelta| >= 0.50 * |targetDelta|
      let confirms = false;
      if (Math.abs(targetDelta) <= 2.0) {
        confirms = Math.abs(sDelta) <= 2.5;
      } else {
        const sameSign = targetDelta * sDelta > 0;
        const sufficientMag = Math.abs(sDelta) >= 0.5 * Math.abs(targetDelta);
        confirms = sameSign && sufficientMag;
      }

      return {
        station: s,
        distanceKm: dist,
        temp: sTemp,
        midpoint: sMid,
        delta: sDelta,
        confirms,
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);

  // In-range peers strictly within <= 150.0 km
  const inRangePeers = otherStationsWithDist.filter((s) => s.distanceKm <= 150.0);
  const nearestOutOfRange = otherStationsWithDist.find((s) => s.distanceKm > 150.0);

  // Check if active investigation exists from backend
  const activeInv = activeInvestigations[targetStation.id];
  const spatialData = activeInv?.spatial_consensus;

  // Determine classification, confidence, and peer basis
  let classification: 'REGIONAL EVENT' | 'ISOLATED SENSOR ANOMALY' | 'INSUFFICIENT EVIDENCE';
  let confidence: 'HIGH' | 'LOW' | 'NONE';
  let peerBasis: string;
  let explanation: string;

  if (spatialData && spatialData.classification) {
    classification = spatialData.classification;
    confidence = spatialData.confidence || 'NONE';
    peerBasis = spatialData.peer_basis || (inRangePeers.length === 0 ? 'no peer stations within 150km' : `based on ${inRangePeers.length} peer stations`);
    explanation = spatialData.explanation || '';
  } else if (inRangePeers.length === 0) {
    classification = 'INSUFFICIENT EVIDENCE';
    confidence = 'NONE';
    peerBasis = 'no peer stations within 150km';
    explanation = `No peer AWS stations within 150km radius. Nearest AWS node is ${nearestOutOfRange?.station.name} (${nearestOutOfRange?.distanceKm}km). Spatial consensus cannot evaluate correlation.`;
  } else if (inRangePeers.length === 1) {
    confidence = 'LOW';
    peerBasis = 'based on 1 peer station';
    const peer = inRangePeers[0];
    if (Math.abs(targetDelta) > 2.0 && peer.confirms) {
      classification = 'REGIONAL EVENT';
      explanation = `Single peer ${peer.station.name} (${peer.distanceKm}km) confirms same-direction deviation (${peer.delta > 0 ? '+' : ''}${peer.delta}°C vs target ${targetDelta > 0 ? '+' : ''}${targetDelta}°C, >=50% magnitude). Low confidence based on 1 peer station.`;
    } else if (Math.abs(targetDelta) <= 2.0 && Math.abs(peer.delta) <= 2.5) {
      classification = 'REGIONAL EVENT';
      explanation = `Target and peer ${peer.station.name} (${peer.distanceKm}km) both report nominal diurnal baseline values.`;
    } else {
      classification = 'ISOLATED SENSOR ANOMALY';
      explanation = `Single peer ${peer.station.name} (${peer.distanceKm}km) contradicts deviation (peer ${peer.delta > 0 ? '+' : ''}${peer.delta}°C vs target ${targetDelta > 0 ? '+' : ''}${targetDelta}°C). Low confidence based on 1 peer station.`;
    }
  } else {
    confidence = 'HIGH';
    peerBasis = `based on ${inRangePeers.length} peer stations`;
    const confirmingCount = inRangePeers.filter((p) => p.confirms).length;
    if (Math.abs(targetDelta) > 2.0 && confirmingCount >= 2) {
      classification = 'REGIONAL EVENT';
      explanation = `${confirmingCount} of ${inRangePeers.length} peers within 150km confirm same-direction deviation (>=50% magnitude). High confidence regional meteorological event.`;
    } else if (Math.abs(targetDelta) <= 2.0) {
      classification = 'REGIONAL EVENT';
      explanation = `All ${inRangePeers.length} peers within 150km demonstrate coherent regional atmospheric baseline.`;
    } else {
      classification = 'ISOLATED SENSOR ANOMALY';
      explanation = `Peers within 150km contradict target deviation. High confidence isolated sensor anomaly.`;
    }
  }

  // Helper for computing station consensus tag for Network Table
  const getNetworkSpatialVerdict = (station: AWSStation) => {
    const inv = activeInvestigations[station.id];
    if (inv && inv.spatial_consensus) {
      return {
        classification: inv.spatial_consensus.classification,
        confidence: inv.spatial_consensus.confidence,
        peers: inv.spatial_consensus.neighbor_count ?? 0,
      };
    }
    // Check in-range peers for this station
    const peers = stations.filter((s) => {
      if (s.id === station.id) return false;
      return (
        haversineKm(
          station.coordinates.lat,
          station.coordinates.lng,
          s.coordinates.lat,
          s.coordinates.lng
        ) <= 150.0
      );
    });
    if (peers.length === 0) {
      return { classification: 'INSUFFICIENT EVIDENCE' as const, confidence: 'NONE' as const, peers: 0 };
    }
    if (station.status === 'ANOMALY') {
      return { classification: 'ISOLATED SENSOR ANOMALY' as const, confidence: 'LOW' as const, peers: peers.length };
    }
    return { classification: 'REGIONAL EVENT' as const, confidence: peers.length >= 2 ? 'HIGH' as const : 'LOW' as const, peers: peers.length };
  };

  // Build Diurnal chart data from history buffers
  const targetHistory = historyBuffers[targetStation.id] || MOCK_24H_HISTORY[targetStation.id] || MOCK_24H_HISTORY['AWS-001'] || [];
  const chartData = targetHistory.map((item, idx) => {
    const pt: Record<string, any> = {
      time: item.time,
      targetTemp: item.temperature,
    };
    inRangePeers.forEach((p, pIdx) => {
      const pHist = historyBuffers[p.station.id] || MOCK_24H_HISTORY[p.station.id] || [];
      pt[`peer_${pIdx}`] = pHist[idx]?.temperature ?? p.temp;
    });
    return pt;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Spatial Intelligence & Cross-Station Correlation"
        subtitle="Multi-point spatial consensus analysis comparing candidate stations against neighboring meteorological nodes within <=150km."
        badge="SPATIAL CONSENSUS ENGINE (<=150km)"
      />

      {/* Target Station Control & Radius Notice */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <label htmlFor="target-station" className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 font-mono">
            <Radio className="w-3.5 h-3.5 text-sky-600" />
            Target Station:
          </label>
          <select
            id="target-station"
            value={targetStation.id}
            onChange={(e) => handleSelectTarget(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-sm font-semibold text-slate-800 focus:outline-none focus:border-sky-500 shadow-xs"
          >
            {stations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id} — {s.name} ({s.state}) [{s.status}]
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600 font-mono">
          <span>Spatial Consensus Radius:</span>
          <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-800 font-bold border border-sky-200">
            &le; 150.0 km (IDW)
          </span>
        </div>
      </div>

      {/* VIEW 1: Consolidated AWS Network Table */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden relative">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 flex items-center gap-2 tracking-tight">
              <Network className="w-4 h-4 text-sky-600" />
              <span>AWS Network Mesh Status (All 7 Stations)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Consolidated operational telemetry with live spatial consensus verdicts. Click any station to inspect its spatial peer cluster.
            </p>
          </div>
          <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {stations.length} MONITORED NODES
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-mono uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Station Node</th>
                <th className="py-2.5 px-3">Region / State</th>
                <th className="py-2.5 px-3">Live Temp</th>
                <th className="py-2.5 px-3">Humidity</th>
                <th className="py-2.5 px-3">Pressure</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Spatial Consensus Verdict</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {stations.map((st) => {
                const isSelected = st.id === targetStation.id;
                const verdict = getNetworkSpatialVerdict(st);

                return (
                  <tr
                    key={st.id}
                    onClick={() => handleSelectTarget(st.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-sky-50/70 text-slate-900 font-semibold border-l-2 border-sky-600'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <td className="py-3 px-3 flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isSelected ? 'bg-sky-600 ring-2 ring-sky-600/30' : 'bg-slate-400'
                        }`}
                      />
                      <span className="font-bold text-slate-900">{st.id} — {st.name}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-500">{st.region} • {st.state}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">{st.sensors.temperature.value}°C</td>
                    <td className="py-3 px-3">{st.sensors.humidity.value}%</td>
                    <td className="py-3 px-3">{st.sensors.pressure.value} hPa</td>
                    <td className="py-3 px-3">
                      <StatusBadge status={st.status} />
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            verdict.classification === 'REGIONAL EVENT'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : verdict.classification === 'ISOLATED SENSOR ANOMALY'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {verdict.classification}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            verdict.confidence === 'HIGH'
                              ? 'text-emerald-800 bg-emerald-100'
                              : verdict.confidence === 'LOW'
                              ? 'text-amber-800 bg-amber-100'
                              : 'text-slate-700 bg-slate-100'
                          }`}
                        >
                          {verdict.confidence} CONF
                        </span>
                        <span className="text-[10px] text-slate-500">
                          ({verdict.peers} peer{verdict.peers !== 1 ? 's' : ''})
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectTarget(st.id);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                          isSelected
                            ? 'bg-sky-600 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {isSelected ? 'Active Target' : 'Inspect'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW 2: Focused Peer Comparison & Diagnosis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: 3-Way Classification Banner & Peer Detail Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Classification Banner */}
          <div
            className={`p-5 sm:p-6 rounded-2xl border shadow-sm relative overflow-hidden ${
              classification === 'REGIONAL EVENT'
                ? 'bg-emerald-50/70 border-emerald-200'
                : classification === 'ISOLATED SENSOR ANOMALY'
                ? 'bg-rose-50/70 border-rose-200'
                : 'bg-amber-50/70 border-amber-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5 font-mono">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                      classification === 'REGIONAL EVENT'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : classification === 'ISOLATED SENSOR ANOMALY'
                        ? 'bg-rose-100 text-rose-800 border-rose-200'
                        : 'bg-amber-100 text-amber-800 border-amber-200'
                    }`}
                  >
                    {classification}
                  </span>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${
                      confidence === 'HIGH'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : confidence === 'LOW'
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {confidence} CONFIDENCE
                  </span>

                  <span className="text-xs text-slate-500">({peerBasis})</span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                  Target Station: {targetStation.name} ({targetStation.id})
                </h3>
              </div>

              <div className="text-right font-mono hidden sm:block">
                <div className="text-xs text-slate-500">Observed vs Baseline Midpoint</div>
                <div className="text-base font-bold text-slate-900">
                  {targetTemp}°C{' '}
                  <span className="text-slate-500 font-normal">
                    (Mid: {targetMid}°C, &Delta; {targetDelta > 0 ? '+' : ''}{targetDelta}°C)
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-700 mt-3 leading-relaxed">
              {explanation}
            </p>
          </div>

          {/* Peer Station Cards or Insufficient Notice */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4 font-mono flex items-center justify-between">
              <span>Peer Stations within &le; 150km Radius</span>
              <span className="text-sky-700 font-semibold">{inRangePeers.length} Peer(s) In Range</span>
            </h4>

            {inRangePeers.length > 0 ? (
              <div className="space-y-3">
                {inRangePeers.map((p) => {
                  const deltaRatio =
                    Math.abs(targetDelta) > 0.01
                      ? ((Math.abs(p.delta) / Math.abs(targetDelta)) * 100).toFixed(0)
                      : '0';

                  return (
                    <div
                      key={p.station.id}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="font-bold text-slate-900 text-sm">
                            {p.station.name} ({p.station.id})
                          </span>
                          <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200 text-[10px]">
                            {p.distanceKm} km away (&le; 150km)
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {p.station.location}, {p.station.state} • Cadence: {p.station.dataSource || 'Hourly'}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full sm:w-auto">
                        <div className="p-2 rounded-lg bg-white border border-slate-200 text-center shadow-xs">
                          <span className="text-[10px] text-slate-500 block">Observed</span>
                          <span className="font-bold text-emerald-700">{p.temp}°C</span>
                        </div>

                        <div className="p-2 rounded-lg bg-white border border-slate-200 text-center shadow-xs">
                          <span className="text-[10px] text-slate-500 block">Peer Delta</span>
                          <span className="font-bold text-slate-900">
                            {p.delta > 0 ? '+' : ''}{p.delta}°C
                          </span>
                        </div>

                        <div className="p-2 rounded-lg bg-white border border-slate-200 text-center col-span-2 sm:col-span-1 shadow-xs">
                          <span className="text-[10px] text-slate-500 block">50% Rule Match</span>
                          <span
                            className={`font-bold ${
                              p.confirms ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {p.confirms ? 'MATCH' : 'MISMATCH'} ({deltaRatio}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-amber-900 text-sm">
                      No Peer Stations Within 150km Radius
                    </h5>
                    <p className="mt-1 leading-relaxed text-amber-800">
                      The nearest Automatic Weather Station to <strong>{targetStation.name}</strong> is{' '}
                      <strong>{nearestOutOfRange?.station.name}</strong> at{' '}
                      <strong>{nearestOutOfRange?.distanceKm} km</strong>, which exceeds the strict 150.0 km
                      spatial consensus boundary. Spatial consensus cannot confirm or refute anomalies for this station.
                    </p>
                  </div>
                </div>

                {/* Grayed-out nearest out-of-range station */}
                {nearestOutOfRange && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 opacity-60 font-mono text-xs flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-slate-400" />
                        <span className="font-semibold text-slate-700">
                          {nearestOutOfRange.station.name} ({nearestOutOfRange.station.id})
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {nearestOutOfRange.distanceKm} km away
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        OUT OF SPATIAL RADIUS (&gt;150km) — NOT USED FOR CONSENSUS
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-600 text-[10px]">
                      EXCLUDED
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Quick Action & Forensic Drilldowns */}
        <div className="space-y-6">
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5">
                <Info className="w-4 h-4 text-sky-600" />
                <span>Spatial Consensus Rules</span>
              </h4>
              <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-sky-700 block font-mono">1. Strict Radius Limit</span>
                  <span>Peers must lie within &le; 150.0 km. Outer stations are strictly excluded.</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-sky-700 block font-mono">2. The 50% Tolerance Rule</span>
                  <span>Peer must share deviation sign AND have |&Delta;peer| &ge; 50% of |&Delta;target| to confirm regional event.</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-amber-700 block font-mono">3. Confidence Tiering</span>
                  <span>0 peers = NONE, 1 peer = LOW, &ge;2 peers = HIGH confidence.</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => {
                  onNavigateTab('anomaly-investigation');
                }}
                className="w-full py-2.5 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 flex items-center justify-center gap-1.5 transition-all shadow-xs"
              >
                <span>Inspect in Forensic Triage</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => {
                  if (onSelectStation) onSelectStation(targetStation.id);
                  onNavigateTab('station-map');
                }}
                className="w-full py-2.5 rounded-xl text-xs font-semibold bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 flex items-center justify-center gap-1.5 transition-all shadow-xs"
              >
                <span>View on Geospatial Map</span>
                <MapPin className="w-3.5 h-3.5 text-sky-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Station Diurnal Comparison Chart */}
      <ChartWrapper
        title={`Synchronized Diurnal Curves: ${targetStation.name} (${targetStation.id}) vs In-Range Regional Peers`}
        subtitle={
          inRangePeers.length > 0
            ? `Comparing real telemetry time series against ${inRangePeers.length} peer station(s) within <=150km.`
            : `No peer stations within 150km. Plotting single target station curve.`
        }
        badge="CORRELATION BUFFER"
        height={360}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 15, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit="°C" domain={['auto', 'auto']} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                borderColor: '#e2e8f0',
                borderRadius: '0.75rem',
                color: '#0f172a',
                fontSize: '12px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} iconType="circle" />
            <Line
              type="monotone"
              dataKey="targetTemp"
              name={`${targetStation.name} (${targetStation.id}) [Target]`}
              stroke="#e11d48"
              strokeWidth={3}
              dot={{ r: 3 }}
            />
            {inRangePeers.map((p, idx) => (
              <Line
                key={p.station.id}
                type="monotone"
                dataKey={`peer_${idx}`}
                name={`${p.station.name} (${p.station.id}) [${p.distanceKm}km]`}
                stroke={idx === 0 ? '#0284c7' : '#16a34a'}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>
    </div>
  );
};
