import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Printer,
  Copy,
  Check,
  ShieldAlert,
  Search,
  Building2,
  ExternalLink,
  BrainCircuit,
  Database,
  CheckCircle2,
  Info
} from 'lucide-react';
import { IncidentReport } from '../types';
import { api } from '../services/api';

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<IncidentReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const data = await api.getReports();
        setReports(data);
        if (data.length > 0) setSelectedReport(data[0]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const handleExportCSV = () => {
    if (reports.length === 0) return;
    const headers = ['ReportID', 'StationID', 'StationName', 'Parameter', 'Observed', 'Expected', 'Deviation', 'Severity', 'AnomalyType', 'RootCause', 'CorrectedValue'];
    const rows = reports.map(r => [
      r.report_id,
      r.station_info.station_id,
      `"${r.station_info.name}"`,
      r.anomaly_details.parameter,
      r.anomaly_details.observed_value,
      r.anomaly_details.expected_value,
      r.anomaly_details.deviation,
      r.anomaly_details.severity,
      `"${r.anomaly_details.classification_type}"`,
      `"${r.ai_attribution.probable_root_cause}"`,
      r.self_healing.imputed_value
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SkyGuard_IMD_AWS_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyJSON = () => {
    if (!selectedReport) return;
    navigator.clipboard.writeText(JSON.stringify(selectedReport, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Official IMD Incident & Audit Reports
            </h1>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-300 font-semibold">
              GOV AUDIT DOSSIER
            </span>
          </div>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Ministry of Earth Sciences (MoES) & India Meteorological Department formal incident documentation
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={reports.length === 0}
            className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition shadow-xs disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Download CSV</span>
          </button>
          <button
            onClick={handlePrint}
            disabled={!selectedReport}
            className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition shadow-xs disabled:opacity-50"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Reports List (Left) + Document Viewer (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Reports List */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="font-bold text-xs uppercase tracking-wide text-slate-500">
            Recorded Incident Reports ({reports.length})
          </h3>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {reports.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs space-y-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                <p className="font-bold text-slate-800">No Incidents Recorded</p>
                <p className="text-slate-400">All live telemetry streams are operating within nominal thresholds.</p>
              </div>
            ) : (
              reports.map((rep) => (
                <div
                  key={rep.report_id}
                  onClick={() => setSelectedReport(rep)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer ${
                    selectedReport?.report_id === rep.report_id
                      ? 'bg-cyan-50/70 border-cyan-400 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-cyan-700 font-bold">{rep.report_id}</span>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                      rep.anomaly_details.severity === 'CRITICAL' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-800'
                    }`}>
                      {rep.anomaly_details.severity}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-900">{rep.station_info.name}</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {rep.anomaly_details.parameter}: <strong className="text-red-600 font-mono">{rep.anomaly_details.observed_value}</strong> (Expected: {rep.anomaly_details.expected_value})
                  </p>
                  <span className="block text-[10px] text-slate-400 font-mono mt-1">{rep.generated_at}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Official Document Viewer */}
        <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6 print:border-none print:shadow-none">
          {selectedReport ? (
            <div>
              {/* Document Header */}
              <div className="border-b border-slate-200 pb-4 mb-4 text-center space-y-1">
                <p className="text-[10px] font-sans uppercase tracking-widest text-slate-400 font-semibold">
                  GOVERNMENT OF INDIA • MINISTRY OF EARTH SCIENCES (MoES)
                </p>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  INDIA METEOROLOGICAL DEPARTMENT (IMD)
                </h2>
                <p className="text-xs text-slate-500 font-mono">
                  AUTOMATIC WEATHER STATION ANOMALY AUDIT DOSSIER • REPORT ID: {selectedReport.report_id}
                </p>
              </div>

              {/* Station Information Box */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs font-sans space-y-2 mb-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Station ID</span>
                    <strong className="font-mono text-cyan-700">{selectedReport.station_info.station_id}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Location</span>
                    <strong className="text-slate-800">{selectedReport.station_info.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Coordinates</span>
                    <strong className="font-mono text-slate-800">{selectedReport.station_info.coordinates}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Elevation</span>
                    <strong className="font-mono text-slate-800">{selectedReport.station_info.elevation_m}m</strong>
                  </div>
                </div>
              </div>

              {/* Anomaly Evidence & Telemetry Excursion */}
              <div className="space-y-3 mb-4">
                <h3 className="font-bold text-xs uppercase tracking-wide text-slate-800">
                  1. Telemetry Excursion Evidence
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-sans">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Observed Value</span>
                    <p className="text-xl font-bold font-mono text-red-600 mt-1">{selectedReport.anomaly_details.observed_value}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Expected Value</span>
                    <p className="text-xl font-bold font-mono text-slate-700 mt-1">{selectedReport.anomaly_details.expected_value}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Net Deviation</span>
                    <p className="text-xl font-bold font-mono text-amber-600 mt-1">{selectedReport.anomaly_details.deviation > 0 ? `+${selectedReport.anomaly_details.deviation}` : selectedReport.anomaly_details.deviation}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">AI Confidence</span>
                    <p className="text-xl font-bold font-mono text-cyan-700 mt-1">{selectedReport.anomaly_details.confidence_pct}%</p>
                  </div>
                </div>
              </div>

              {/* Scientific Attribution */}
              <div className="space-y-2 mb-4">
                <h3 className="font-bold text-xs uppercase tracking-wide text-slate-800">
                  2. AI Algorithmic Attribution & Scientific Finding
                </h3>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed font-sans">
                  <p className="mb-2">
                    <strong>Event Authenticity:</strong> {selectedReport.ai_attribution.event_authenticity}
                  </p>
                  <p className="mb-2">
                    <strong>Probable Root Cause:</strong> {selectedReport.ai_attribution.probable_root_cause}
                  </p>
                  <p className="italic text-slate-600">
                    "{selectedReport.ai_attribution.scientific_explanation}"
                  </p>
                </div>
              </div>

              {/* Self-Healing & Lineage */}
              <div className="space-y-2 mb-4">
                <h3 className="font-bold text-xs uppercase tracking-wide text-slate-800">
                  3. Self-Healing Telemetry Lineage
                </h3>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs font-sans flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-semibold">Imputed / Corrected Value</span>
                    <p className="text-lg font-bold font-mono text-cyan-700 mt-0.5">
                      {selectedReport.self_healing.imputed_value} (Confidence: {selectedReport.self_healing.imputation_confidence}%)
                    </p>
                  </div>
                  <span className="text-xs text-emerald-700 font-semibold px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200">
                    Non-Destructive Lineage Preserved
                  </span>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">Digitally Signed & Validated • MoES-IMD Protocol</span>
                <button
                  onClick={handleCopyJSON}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'Copied JSON!' : 'Copy Audit JSON'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-16 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-3">
              <FileText className="w-8 h-8 text-slate-300" />
              <p className="font-bold text-slate-800 text-sm">No Incident Dossier Selected</p>
              <p className="text-slate-500 max-w-sm">
                Select an active report from the left panel to review government audit documentation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
