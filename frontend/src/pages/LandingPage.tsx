import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  ShieldAlert,
  BrainCircuit,
  Activity,
  Zap,
  Globe2,
  Database,
  CheckCircle2,
  Thermometer,
  Gauge,
  Droplets,
  Layers,
  ChevronRight,
  Radio
} from 'lucide-react';

interface LandingPageProps {
  onLaunchCommandCenter: () => void;
  onLaunchSimulationLab: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLaunchCommandCenter,
  onLaunchSimulationLab
}) => {
  const [telemetry, setTelemetry] = useState({ temp: 28.5, press: 1008.2, rh: 62.0 });

  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry(prev => ({
        temp: Number((prev.temp + (Math.random() * 0.4 - 0.2)).toFixed(1)),
        press: Number((prev.press + (Math.random() * 0.6 - 0.3)).toFixed(1)),
        rh: Math.min(99, Math.max(20, Number((prev.rh + (Math.random() * 1.2 - 0.6)).toFixed(1))))
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-y-auto font-sans">
      {/* Top Government Banner */}
      <div className="bg-slate-900 text-white px-6 py-2.5 flex items-center justify-between text-xs font-sans">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-cyan-300 font-bold">SMART INDIA HACKATHON 2026</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300">Problem Statement ID: 26073</span>
        </div>
        <div className="hidden md:flex items-center gap-3 text-slate-300">
          <span>Ministry of Earth Sciences (MoES)</span>
          <span>•</span>
          <span>India Meteorological Department (IMD)</span>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative px-6 pt-16 pb-20 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-50 border border-cyan-300 text-cyan-800 text-xs font-semibold mb-6 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
          <span>Real-Time Meteorological Telemetry Assurance Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-slate-900 mb-3">
          SKYGUARD <span className="text-cyan-600">AI</span>
        </h1>
        <p className="text-xl sm:text-2xl text-cyan-800 font-semibold mb-4 tracking-tight">
          "Trust Every Weather Reading."
        </p>
        <p className="max-w-2xl mx-auto text-slate-600 text-sm sm:text-base leading-relaxed mb-8">
          AI-powered real-time anomaly detection and telemetry assurance for Automatic Weather Stations (AWS).
          Intelligently distinguishes isolated sensor malfunctions from genuine regional meteorological events.
        </p>

        {/* Live Animated Telemetry Ticker */}
        <div className="max-w-xl mx-auto mb-10 p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-around text-xs shadow-xs font-mono">
          <div className="flex items-center gap-2.5">
            <Thermometer className="w-5 h-5 text-orange-600" />
            <div className="text-left">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Temperature</p>
              <p className="text-sm font-bold text-slate-900">{telemetry.temp}°C</p>
            </div>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="flex items-center gap-2.5">
            <Gauge className="w-5 h-5 text-teal-600" />
            <div className="text-left">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Pressure</p>
              <p className="text-sm font-bold text-slate-900">{telemetry.press} hPa</p>
            </div>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="flex items-center gap-2.5">
            <Droplets className="w-5 h-5 text-blue-600" />
            <div className="text-left">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Humidity</p>
              <p className="text-sm font-bold text-slate-900">{telemetry.rh}%</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onLaunchCommandCenter}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm transition flex items-center justify-center gap-2 shadow-sm"
          >
            <span>Launch Command Center</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onLaunchSimulationLab}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 font-semibold text-sm transition flex items-center justify-center gap-2 shadow-2xs"
          >
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Open Simulation Lab</span>
          </button>
        </div>
      </section>

      {/* 3 Core Analytical Dimensions */}
      <section className="px-6 py-12 max-w-6xl mx-auto border-t border-slate-200">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Multi-Dimensional Telemetry Intelligence
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Tri-factor validation protects meteorologists from single-point false alarms
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="p-2.5 rounded-xl bg-cyan-50 text-cyan-700 w-fit">
              <Globe2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Spatial Consensus</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Compares observations with nearest physical neighbor AWS locations using Haversine distance and Inverse Distance Weighting (IDW).
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 w-fit">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Temporal Rate-of-Change</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Monitors rolling standard deviations and rate-of-change thresholds (e.g. max 5°C/hr under calm weather).
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700 w-fit">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Thermodynamic Physics</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Clausius-Clapeyron saturation vapor pressure bounds ensure coupled temperature, pressure, and humidity plausibility.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
