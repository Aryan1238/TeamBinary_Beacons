import React from 'react';
import { ArrowRight, CloudSun } from 'lucide-react';

interface CTASectionProps {
  onOpenDashboard: () => void;
}

export const CTASection: React.FC<CTASectionProps> = ({ onOpenDashboard }) => {
  return (
    <section className="relative py-20 sm:py-28 overflow-hidden">
      {/* Weather Dawn & Storm Atmosphere Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[380px] bg-gradient-to-r from-amber-500/10 via-sky-500/15 to-indigo-600/15 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="relative rounded-3xl bg-gradient-to-b from-[#111C35] via-[#0D162B] to-[#090F1E] border border-sky-500/30 p-8 sm:p-14 text-center shadow-[0_0_60px_rgba(2,132,199,0.18)] overflow-hidden">
          
          {/* Subtle Atmospheric Cloud Lines Texture */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.08),transparent_70%)] pointer-events-none" />

          {/* Pill Badge */}
          <div className="relative inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#162343] border border-amber-500/30 text-amber-300 text-xs font-semibold mb-6 shadow-sm">
            <CloudSun className="w-3.5 h-3.5 text-amber-400" />
            <span>Meteorological Operational Command</span>
          </div>

          {/* Heading */}
          <h2 className="relative text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-5">
            Monitor. Detect.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-sky-200 to-indigo-300">
              Understand.
            </span>
          </h2>

          {/* Text */}
          <p className="relative max-w-2xl mx-auto text-slate-300 text-base sm:text-lg leading-relaxed mb-9">
            Enter the monitoring platform to explore station telemetry, anomaly detection and sensor intelligence.
          </p>

          {/* Button (Placeholder with Coming Soon badge) */}
          <div className="relative flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onOpenDashboard}
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-sky-600 via-indigo-600 to-slate-800 hover:from-sky-500 hover:via-indigo-500 hover:to-slate-700 text-white font-bold text-base border border-sky-400/40 shadow-[0_0_30px_rgba(56,189,248,0.3)] hover:shadow-[0_0_45px_rgba(56,189,248,0.55)] transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <span>Launch Monitoring Dashboard</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-mono font-normal border border-amber-400/40">
                Coming Soon
              </span>
              <ArrowRight className="w-5 h-5 text-sky-200 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </div>

          {/* Bottom Trust Subtext */}
          <div className="relative mt-8 pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-mono">
            <span>• SIH 2026 Innovation Track</span>
            <span>• Custom Dashboard Slot Reserved</span>
            <span>• Built for Meteorologists & Field Engineers</span>
          </div>

        </div>
      </div>
    </section>
  );
};
