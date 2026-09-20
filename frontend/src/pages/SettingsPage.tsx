import React, { useState } from 'react';
import {
  Settings,
  Cpu,
  Zap,
  Volume2,
  VolumeX,
  Radio,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Database,
  RefreshCw,
  Info
} from 'lucide-react';

interface SettingsPageProps {
  audioEnabled: boolean;
  onToggleAudio: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  audioEnabled,
  onToggleAudio
}) => {
  const [powerMode, setPowerMode] = useState<'Normal' | 'Eco' | 'Ultra Eco'>('Eco');
  const [pollInterval, setPollInterval] = useState(2.5);
  const [thresholdZ, setThresholdZ] = useState(2.8);
  const [spatialRadius, setSpatialRadius] = useState(350);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              System Configuration & Edge AI Gateway
            </h1>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-300 font-semibold">
              ESP32 ARCHITECTURE
            </span>
          </div>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            On-device inference settings, solar power duty-cycles, and model calibration thresholds
          </p>
        </div>
      </div>

      {/* Edge AI Concept for ESP32 */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-50 text-cyan-700">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                ESP32 Remote RTU Edge AI Simulation
              </h3>
              <p className="text-xs text-slate-500">
                Low-power micro-inference deployed directly on automatic weather station data loggers
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            ONLINE (12ms Ingestion)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-sans">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Micro-Controller</span>
            <strong className="text-slate-800 font-mono">ESP32-S3 (Dual-Core 240MHz)</strong>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Inference Engine</span>
            <strong className="text-slate-800 font-mono">TensorFlow Lite for Micro (TFLM)</strong>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Flash / SRAM Budget</span>
            <strong className="text-slate-800 font-mono">148 KB / 320 KB (46% Used)</strong>
          </div>
        </div>
      </div>

      {/* Threshold Calibration Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ML Thresholds */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide">
            Detection Sensitivity Calibration
          </h3>

          <div className="space-y-4 text-xs font-sans">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-700 font-medium">Statistical Z-Score Threshold:</span>
                <strong className="font-mono text-cyan-700">{thresholdZ} σ</strong>
              </div>
              <input
                type="range"
                min="1.5"
                max="4.0"
                step="0.1"
                value={thresholdZ}
                onChange={(e) => setThresholdZ(parseFloat(e.target.value))}
                className="w-full accent-cyan-600"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Standard deviations departure before flagging an outlier. (Default: 2.8σ)
              </p>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-700 font-medium">Spatial Consensus Radius:</span>
                <strong className="font-mono text-cyan-700">{spatialRadius} km</strong>
              </div>
              <input
                type="range"
                min="150"
                max="600"
                step="25"
                value={spatialRadius}
                onChange={(e) => setSpatialRadius(parseInt(e.target.value))}
                className="w-full accent-cyan-600"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Maximum geographic radius for identifying proximate AWS stations for IDW consensus.
              </p>
            </div>
          </div>
        </div>

        {/* Audio & Alert Preferences */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide">
            Audio & Alert Configuration
          </h3>

          <div className="space-y-3 text-xs font-sans">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <p className="font-bold text-slate-900">Audible Alert Sound (Web Audio API)</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Play acoustic alerts when critical anomalies or sensor spikes occur.
                </p>
              </div>
              <button
                onClick={onToggleAudio}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  audioEnabled
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                <span>{audioEnabled ? 'Active' : 'Muted'}</span>
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-900 block mb-1">Power Management Profile</span>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {(['Normal', 'Eco', 'Ultra Eco'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setPowerMode(mode)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium transition ${
                      powerMode === mode
                        ? 'bg-slate-900 text-white font-semibold'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
