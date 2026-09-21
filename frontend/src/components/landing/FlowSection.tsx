import React from 'react';
import {
  Radio,
  Cpu,
  CloudLightning,
  SunMedium,
  CheckCircle2,
  ArrowRight,
  ArrowDown
} from 'lucide-react';

export const FlowSection: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'SENSOR DATA',
      subtitle: 'Raw Ingestion',
      description: 'Continuous AWS telemetry capturing temperature, pressure, relative humidity, and wind.',
      icon: Radio,
      tag: 'Raw Telemetry',
      accentColor: 'text-sky-300',
      tagColor: 'text-sky-300 bg-sky-950/70 border-sky-500/30',
      borderHover: 'group-hover:border-sky-400/70 group-hover:shadow-[0_0_25px_rgba(56,189,248,0.25)]'
    },
    {
      step: '02',
      title: 'ANALYSIS',
      subtitle: 'Multi-Factor Validation',
      description: 'Temporal rate-of-change, spatial neighbor consensus, and thermodynamic physics checking.',
      icon: Cpu,
      tag: 'Physical Bounds',
      accentColor: 'text-cyan-300',
      tagColor: 'text-cyan-300 bg-cyan-950/70 border-cyan-500/30',
      borderHover: 'group-hover:border-cyan-400/70 group-hover:shadow-[0_0_25px_rgba(6,182,212,0.25)]'
    },
    {
      step: '03',
      title: 'ANOMALY DETECTION',
      subtitle: 'Intelligent Classifier',
      description: 'Separates isolated hardware/ADC defects from genuine regional meteorological squalls.',
      icon: CloudLightning,
      tag: 'Event Filtering',
      accentColor: 'text-indigo-300',
      tagColor: 'text-indigo-300 bg-indigo-950/70 border-indigo-500/30',
      borderHover: 'group-hover:border-indigo-400/70 group-hover:shadow-[0_0_25px_rgba(99,102,241,0.25)]'
    },
    {
      step: '04',
      title: 'EXPLANATION',
      subtitle: 'Root-Cause Attribution',
      description: 'Translates model flags into understandable contributing factors and root-cause probabilities.',
      icon: SunMedium,
      tag: 'Explainable AI',
      accentColor: 'text-amber-300',
      tagColor: 'text-amber-300 bg-amber-950/70 border-amber-500/30',
      borderHover: 'group-hover:border-amber-400/70 group-hover:shadow-[0_0_25px_rgba(245,158,11,0.25)]'
    },
    {
      step: '05',
      title: 'ACTION',
      subtitle: 'Field Operations',
      description: 'Immediate alert dispatch, field maintenance prioritization, and validated data routing.',
      icon: CheckCircle2,
      tag: 'Operational Triage',
      accentColor: 'text-emerald-300',
      tagColor: 'text-emerald-300 bg-emerald-950/70 border-emerald-500/30',
      borderHover: 'group-hover:border-emerald-400/70 group-hover:shadow-[0_0_25px_rgba(16,185,129,0.25)]'
    }
  ];

  return (
    <section id="technology" className="relative py-16 sm:py-24 border-b border-slate-800/80 overflow-hidden">
      
      {/* Weather Storm Atmosphere Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[400px] bg-gradient-to-r from-sky-500/5 via-indigo-600/10 to-amber-500/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Section Heading & Description */}
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-20">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#111C35] border border-sky-500/30 text-sky-300 text-xs font-semibold uppercase tracking-wider mb-3">
            <span>Meteorological Pipeline</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
            From Sensor Data to Actionable Intelligence
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Transform raw weather-station observations into meaningful operational insights.
          </p>
        </div>

        {/* Desktop Horizontal Connected Flow */}
        <div className="hidden lg:grid grid-cols-5 gap-4 relative">
          
          {/* Continuous Glowing Weather Background Line */}
          <div className="absolute top-12 left-12 right-12 h-0.5 bg-gradient-to-r from-sky-500/30 via-indigo-500/40 via-amber-500/30 to-emerald-500/30 z-0" />

          {steps.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="relative z-10 flex flex-col items-center text-center group">
                
                {/* Step Node Icon Box */}
                <div className={`relative w-24 h-24 rounded-2xl bg-gradient-to-b from-[#111C35] via-[#0D162B] to-[#09101F] border border-slate-700/80 p-4 flex flex-col items-center justify-center shadow-lg transition-all duration-300 group-hover:-translate-y-1 ${item.borderHover}`}>
                  <span className="absolute -top-2.5 px-2 py-0.5 rounded-full bg-slate-950 border border-slate-700 text-[10px] font-mono font-bold text-white">
                    {item.step}
                  </span>
                  <Icon className={`w-7 h-7 ${item.accentColor} transition-transform duration-200 group-hover:scale-110`} />
                </div>

                {/* Animated Arrow to Next Step */}
                {index < steps.length - 1 && (
                  <div className="absolute top-10 -right-2 text-sky-400/50 hidden lg:block pointer-events-none">
                    <ArrowRight className="w-4 h-4 animate-pulse" />
                  </div>
                )}

                {/* Text Content */}
                <div className="mt-5 space-y-1.5 px-2">
                  <span className={`text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${item.tagColor} inline-block`}>
                    {item.tag}
                  </span>
                  <h3 className="text-sm font-bold text-white tracking-wide pt-1">
                    {item.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-normal">
                    {item.description}
                  </p>
                </div>

              </div>
            );
          })}
        </div>

        {/* Mobile & Tablet Vertical Flow */}
        <div className="lg:hidden flex flex-col space-y-4 max-w-md mx-auto">
          {steps.map((item, index) => {
            const Icon = item.icon;
            return (
              <React.Fragment key={index}>
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-gradient-to-r from-[#111C35] via-[#0D162B] to-[#09101F] border border-slate-800 hover:border-sky-500/40 transition-colors">
                  <div className="shrink-0 relative w-12 h-12 rounded-xl bg-slate-800/90 border border-slate-700 flex items-center justify-center text-sky-400">
                    <Icon className="w-6 h-6" />
                    <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-slate-950 border border-sky-400 text-[9px] font-mono font-bold flex items-center justify-center text-sky-300">
                      {index + 1}
                    </span>
                  </div>
                  <div className="text-left space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">{item.title}</h3>
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${item.tagColor}`}>
                        {item.tag}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                {index < steps.length - 1 && (
                  <div className="flex justify-center py-0.5">
                    <ArrowDown className="w-4 h-4 text-sky-400/60 animate-pulse" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

      </div>
    </section>
  );
};
