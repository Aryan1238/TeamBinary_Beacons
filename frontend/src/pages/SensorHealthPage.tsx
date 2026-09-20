import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Search,
  ChevronRight,
  ShieldCheck,
  Building2,
  TrendingUp,
  Info
} from 'lucide-react';
import { SensorHealthMetric } from '../types';
import { api } from '../services/api';

interface SensorHealthPageProps {
  onSelectStation: (id: string) => void;
}

export const SensorHealthPage: React.FC<SensorHealthPageProps> = ({ onSelectStation }) => {
  const [healthData, setHealthData] = useState<SensorHealthMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [expandedStationId, setExpandedStationId] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      setLoading(true);
      try {
        const data = await api.getSensorHealth();
        setHealthData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHealth();
  }, []);

  const filtered = healthData.filter(h => {
    const matchesSearch = h.station_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          h.station_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || h.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              AWS Sensor Health Surveillance
            </h1>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 font-semibold">
              TRANSDUCER STABILITY
            </span>
          </div>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Continuous health grading, drift tracking, and sensor calibration lifecycle status
          </p>
        </div>
      </div>

      {/* Health Overview Definitions Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-emerald-700 font-bold block">90 - 100% : EXCELLENT</span>
          <p className="text-[11px] text-slate-500 mt-0.5">Zero drift, valid responses</p>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-cyan-700 font-bold block">75 - 89% : HEALTHY</span>
          <p className="text-[11px] text-slate-500 mt-0.5">Normal baseline noise</p>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-amber-700 font-bold block">50 - 74% : DEGRADED</span>
          <p className="text-[11px] text-slate-500 mt-0.5">Recalibration due</p>
        </div>
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
          <span className="text-red-700 font-bold block">&lt; 50% : CRITICAL</span>
          <p className="text-[11px] text-slate-500 mt-0.5">Hardware maintenance needed</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search location by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-cyan-500 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200 text-xs font-sans">
          {['All', 'Excellent', 'Healthy', 'Degraded', 'Critical'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded transition text-[11px] ${
                statusFilter === st
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Clean User-Friendly Cards with Progressive Disclosure */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => {
          const isExpanded = expandedStationId === item.station_id;
          const isHealthy = item.overall_health >= 75;

          return (
            <div
              key={item.station_id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-cyan-300 transition"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">{item.station_name}</h3>
                    <p className="text-[11px] text-slate-500 font-mono">{item.station_id} • {item.region} Region</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase font-mono ${
                    item.status === 'Excellent' || item.status === 'Healthy'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : (item.status === 'Degraded' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-red-50 text-red-700 border border-red-200')
                  }`}>
                    {item.status}
                  </span>
                </div>

                {/* Main Score */}
                <div className="my-4 flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] uppercase text-slate-500 font-semibold block">Transducers</span>
                    <span className="text-xs font-semibold text-slate-700">Temperature, Pressure, RH</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold font-mono text-cyan-700">{item.overall_health}%</span>
                  </div>
                </div>

                {/* Progressive Disclosure (Expandable technical metrics) */}
                {isExpanded && (
                  <div className="space-y-2 pt-2 pb-3 border-t border-slate-100 text-xs font-sans animate-fadeIn">
                    <div className="flex justify-between text-slate-600">
                      <span>Data Reliability:</span>
                      <strong className="font-mono text-slate-800">{item.data_reliability}%</strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Sensor Stability:</span>
                      <strong className="font-mono text-slate-800">{item.sensor_stability}%</strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Calibration Confidence:</span>
                      <strong className="font-mono text-slate-800">{item.calibration_confidence}%</strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Drift Score:</span>
                      <strong className="font-mono text-slate-800">{item.drift_score}</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                <button
                  onClick={() => setExpandedStationId(isExpanded ? null : item.station_id)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                >
                  {isExpanded ? 'Hide Specs' : 'View Specs'}
                </button>
                <button
                  onClick={() => onSelectStation(item.station_id)}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold flex items-center justify-center gap-1 transition shadow-xs"
                >
                  <span>Full Station Details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
