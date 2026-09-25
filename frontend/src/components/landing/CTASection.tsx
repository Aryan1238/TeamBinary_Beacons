import React from 'react';
import { ArrowRight, CloudSun } from 'lucide-react';

interface CTASectionProps {
  onOpenDashboard: () => void;
}

export const CTASection: React.FC<CTASectionProps> = ({ onOpenDashboard }) => {
  return (
    <section className="relative py-20 sm:py-28 overflow-hidden bg-slate-50">
      {/* Weather Dawn & Storm Atmosphere Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[380px] bg-gradient-to-r from-sky-100/50 via-blue-50/50 to-indigo-100/40 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="relative rounded-3xl bg-white border border-slate-200 p-8 sm:p-14 text-center shadow-lg overflow-hidden">
          
          {/* Subtle Atmospheric Cloud Lines Texture */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(2,132,199,0.05),transparent_70%)] pointer-events-none" />

          {/* Pill Badge */}
          <div className="relative inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-xs font-semibold mb-6 shadow-xs">
            <CloudSun className="w-3.5 h-3.5 text-sky-600" />
            <span>Meteorological Operational Command</span>
          </div>

          {/* Heading */}
          <h2 className="relative text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-5">
            Monitor. Detect.{' '}
            <span className="text-sky-600">
              Understand.
            </span>
          </h2>

          {/* Text */}
          <p className="relative max-w-2xl mx-auto text-slate-600 text-base sm:text-lg leading-relaxed mb-9">
            Enter the monitoring platform to explore station telemetry, anomaly detection and sensor intelligence.
          </p>

          {/* Button (Active Dashboard Launcher) */}
          <div className="relative flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onOpenDashboard}
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-base border border-sky-600 shadow-sm hover:shadow-md transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <span>Launch Monitoring Dashboard</span>
              <ArrowRight className="w-5 h-5 text-white transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </div>

          {/* Bottom Trust Subtext */}
          <div className="relative mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-mono">
            <span>• Real-Time Telemetry Pipeline</span>
            <span>• High-Fidelity Anomaly Isolation</span>
            <span>• Built for Meteorologists & Field Engineers</span>
          </div>

        </div>
      </div>
    </section>
  );
};
