import React, { useState } from 'react';
import {
  Zap,
  X,
  Flame,
  CloudRain,
  Snowflake,
  TrendingUp,
  WifiOff,
  RotateCcw,
  Sparkles,
  Check,
  Globe2
} from 'lucide-react';

interface SIHDemoControllerProps {
  onTriggerScenario: (scenario: string) => Promise<void>;
  onReset: () => Promise<void>;
}

export const SIHDemoController: React.FC<SIHDemoControllerProps> = ({
  onTriggerScenario,
  onReset
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loadingScenario, setLoadingScenario] = useState<string | null>(null);
  const [lastExecuted, setLastExecuted] = useState<string | null>(null);

  const scenarios = [
    {
      id: 'scenario_1_spike',
      title: '1. Catastrophic Sensor Spike (55°C)',
      target: 'AWS-MH-042 (Pune)',
      desc: 'Simulates sudden transducer fault. Spikes temperature to 55°C. AI identifies isolated departure, calculates 97% confidence anomaly, and computes imputed value.',
      icon: Flame,
      color: 'bg-red-50 text-red-700 border border-red-200',
      badge: 'CRITICAL SENSOR FAULT'
    },
    {
      id: 'scenario_2_regional',
      title: '2. Regional Genuine Weather Front',
      target: 'Western Ghats (5 Stations)',
      desc: 'Simulates incoming convective squall. 5 stations simultaneously drop temp & surge humidity. AI verifies spatial consensus and authenticates as Genuine Weather!',
      icon: CloudRain,
      color: 'bg-blue-50 text-blue-700 border border-blue-200',
      badge: 'GENUINE WEATHER'
    },
    {
      id: 'scenario_freeze',
      title: '3. Frozen Sensor (Stuck ADC)',
      target: 'AWS-MH-014 (Nashik)',
      desc: 'Sensor reading locks with zero micro-variance across consecutive cycles. AI detects stuck transducer condition.',
      icon: Snowflake,
      color: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
      badge: 'STUCK VALUE'
    },
    {
      id: 'scenario_drift',
      title: '4. Sensor Calibration Drift',
      target: 'AWS-RJ-045 (Jodhpur)',
      desc: 'Progressive creeping bias (+0.3°C/step). AI detects rate of change divergence relative to historical regional baseline.',
      icon: TrendingUp,
      color: 'bg-amber-50 text-amber-800 border border-amber-200',
      badge: 'CALIBRATION DRIFT'
    },
    {
      id: 'scenario_offline',
      title: '5. RTU Communication Failure',
      target: 'AWS-AS-010 (Guwahati)',
      desc: 'Simulates telemetry packet loss and communication timeout. Station status switches to offline.',
      icon: WifiOff,
      color: 'bg-slate-100 text-slate-700 border border-slate-200',
      badge: 'COMMUNICATION'
    }
  ];

  const handleRun = async (scenarioId: string) => {
    setLoadingScenario(scenarioId);
    await onTriggerScenario(scenarioId);
    setLastExecuted(scenarioId);
    setLoadingScenario(null);
  };

  const handleReset = async () => {
    setLoadingScenario('reset');
    await onReset();
    setLastExecuted(null);
    setLoadingScenario(null);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[1500] flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs tracking-wider shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all"
      >
        <Zap className="w-4 h-4 fill-white" />
        <span>⚡ SIH DEMO SCENARIOS</span>
      </button>

      {/* Slide-in Demo Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[2100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col font-sans">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                  <Zap className="w-5 h-5 fill-amber-700" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    SIH 2026 Judge Demonstration Suite
                  </h3>
                  <p className="text-xs text-slate-500 font-sans">
                    Problem 26073 • One-Click Live Verification Scenarios
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notice regarding Demo Mode */}
            <div className="mx-5 mt-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed font-sans">
              <strong>Notice for Evaluators:</strong> Triggering any scenario below activates <strong>Demo Mode</strong> to evaluate ML isolation on test excursions. Real live Open-Meteo observations can be restored at any time with the <strong>Return to Live Data</strong> button.
            </div>

            {/* Scenario Grid */}
            <div className="p-5 space-y-3">
              {scenarios.map((sc) => {
                const Icon = sc.icon;
                const isLoading = loadingScenario === sc.id;
                const isExecuted = lastExecuted === sc.id;

                return (
                  <div
                    key={sc.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isExecuted
                        ? 'bg-amber-50/60 border-amber-300 shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${sc.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900">{sc.title}</h4>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-cyan-800 font-semibold border border-slate-200">
                              {sc.target}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{sc.desc}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRun(sc.id)}
                        disabled={isLoading}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition flex items-center gap-1.5 ${
                          isExecuted
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                        }`}
                      >
                        {isExecuted ? <Check className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5 fill-white" />}
                        <span>{isLoading ? 'Injecting...' : (isExecuted ? 'Active' : 'Run Demo')}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer with Reset */}
            <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50">
              <div className="flex items-center gap-2 text-xs text-slate-500 font-sans">
                <Sparkles className="w-4 h-4 text-cyan-600" />
                <span>Runs end-to-end through real ML pipelines</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={handleReset}
                  disabled={loadingScenario === 'reset'}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                >
                  <Globe2 className="w-3.5 h-3.5" />
                  <span>Return to Live Weather Data</span>
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
