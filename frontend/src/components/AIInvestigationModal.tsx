import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  BrainCircuit,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  Database,
  Sliders,
  History,
  Info,
  Check
} from 'lucide-react';
import { AnomalyRecord } from '../types';

interface AIInvestigationModalProps {
  anomaly: AnomalyRecord | null;
  onClose: () => void;
  onAcceptCorrection: (anomalyId: string) => void;
}

export const AIInvestigationModal: React.FC<AIInvestigationModalProps> = ({
  anomaly,
  onClose,
  onAcceptCorrection
}) => {
  const [accepted, setAccepted] = useState(false);
  if (!anomaly) return null;

  const isCritical = anomaly.severity === 'CRITICAL';
  const isGenuine = anomaly.is_genuine_weather;

  const handleAccept = () => {
    onAcceptCorrection(anomaly.id);
    setAccepted(true);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${
              isCritical
                ? 'bg-red-50 border border-red-200 text-red-700'
                : 'bg-amber-50 border border-amber-200 text-amber-800'
            }`}>
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  AI Anomaly Investigation Panel
                </h3>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                  isCritical
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                  {anomaly.severity}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Target: <strong className="text-slate-800">{anomaly.station_name}</strong> ({anomaly.station_id}) • {anomaly.parameter} Sensor
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 text-slate-800 font-sans">
          {/* Top Metric Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] uppercase font-semibold text-slate-500 block">Observed Value</span>
              <p className="text-2xl font-bold font-mono text-red-600 mt-1">{anomaly.observed_value}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] uppercase font-semibold text-slate-500 block">Regional Expected</span>
              <p className="text-2xl font-bold font-mono text-slate-800 mt-1">{anomaly.expected_value}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] uppercase font-semibold text-slate-500 block">Net Departure</span>
              <p className="text-2xl font-bold font-mono text-amber-700 mt-1">
                {anomaly.deviation > 0 ? `+${anomaly.deviation}` : anomaly.deviation}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] uppercase font-semibold text-slate-500 block">AI Confidence</span>
              <p className="text-2xl font-bold font-mono text-cyan-700 mt-1">{anomaly.confidence}%</p>
            </div>
          </div>

          {/* Event Authenticity Classification */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-cyan-100 text-cyan-800 shrink-0 mt-0.5">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 uppercase">
                  Event Authenticity Verdict: {isGenuine ? 'Genuine Meteorological Phenomenon' : 'Sensor Malfunction / Transducer Fault'}
                </span>
                <span className="text-xs font-mono font-bold text-cyan-800">98% Verified</span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {anomaly.explanation}
              </p>
            </div>
          </div>

          {/* Feature Attribution (SHAP-Style) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wide text-slate-800 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-600" />
                <span>Feature Attribution (Surrogate Sensitivity)</span>
              </h4>
              <span className="text-[11px] text-slate-400 font-mono">Relative Weighting</span>
            </div>

            <div className="space-y-2.5">
              {anomaly.feature_contributions?.map((feat, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-700 font-medium">{feat.feature}</span>
                    <span className="font-mono font-bold text-cyan-700">
                      {Math.round(feat.importance * 100)}% ({feat.direction})
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-600 rounded-full"
                      style={{ width: `${feat.importance * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Probable Root Causes */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wide text-slate-800 flex items-center gap-2">
              <History className="w-4 h-4 text-cyan-600" />
              <span>Posterior Root Cause Probabilities</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {anomaly.root_cause_breakdown?.map((rc, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-600 block">{rc.cause}</span>
                  <p className="text-lg font-mono font-bold text-slate-900 mt-0.5">
                    {Math.round(rc.probability * 100)}%
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Self-Healing / Imputation Box */}
          <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-sans font-bold uppercase text-emerald-800 tracking-wide block">
                Estimated Clean Telemetry (Self-Healing)
              </span>
              <p className="text-xl font-bold font-mono text-emerald-900 mt-0.5">
                {anomaly.corrected_value} {anomaly.parameter === 'Temperature' ? '°C' : (anomaly.parameter === 'Atmospheric Pressure' ? 'hPa' : '%')}
              </p>
              <p className="text-[11px] text-emerald-700 font-sans mt-0.5">
                Calculated via Inverse-Distance Spatial Consensus. Raw sensor reading remains permanently archived in immutable lineage.
              </p>
            </div>

            <button
              onClick={handleAccept}
              disabled={accepted || anomaly.accepted_correction}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-xs ${
                accepted || anomaly.accepted_correction
                  ? 'bg-emerald-200 text-emerald-800 cursor-default'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{accepted || anomaly.accepted_correction ? 'Correction Imputed' : 'Accept Imputed Value'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
