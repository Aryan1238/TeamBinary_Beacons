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
      accentColor: 'text-sky-600',
      tagColor: 'text-sky-700 bg-sky-50 border-sky-200',
      borderHover: 'group-hover:border-sky-300 group-hover:shadow-md'
    },
    {
      step: '02',
      title: 'ANALYSIS',
      subtitle: 'Multi-Factor Validation',
      description: 'Temporal rate-of-change, spatial neighbor consensus, and thermodynamic physics checking.',
      icon: Cpu,
      tag: 'Physical Bounds',
      accentColor: 'text-cyan-600',
      tagColor: 'text-cyan-700 bg-cyan-50 border-cyan-200',
      borderHover: 'group-hover:border-cyan-300 group-hover:shadow-md'
    },
    {
      step: '03',
      title: 'ANOMALY DETECTION',
      subtitle: 'Intelligent Classifier',
      description: 'Separates isolated hardware/ADC defects from genuine regional meteorological squalls.',
      icon: CloudLightning,
      tag: 'Event Filtering',
      accentColor: 'text-indigo-600',
      tagColor: 'text-indigo-700 bg-indigo-50 border-indigo-200',
      borderHover: 'group-hover:border-indigo-300 group-hover:shadow-md'
    },
    {
      step: '04',
      title: 'EXPLANATION',
      subtitle: 'Root-Cause Attribution',
      description: 'Translates model flags into understandable contributing factors and root-cause probabilities.',
      icon: SunMedium,
      tag: 'Explainable AI',
      accentColor: 'text-amber-600',
      tagColor: 'text-amber-700 bg-amber-50 border-amber-200',
      borderHover: 'group-hover:border-amber-300 group-hover:shadow-md'
    },
    {
      step: '05',
      title: 'ACTION',
      subtitle: 'Field Operations',
      description: 'Immediate alert dispatch, field maintenance prioritization, and validated data routing.',
      icon: CheckCircle2,
      tag: 'Operational Triage',
      accentColor: 'text-emerald-600',
      tagColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      borderHover: 'group-hover:border-emerald-300 group-hover:shadow-md'
    }
  ];

  return (
    <section id="technology" className="relative py-16 sm:py-24 border-b border-slate-200 overflow-hidden">
      
      {/* Weather Storm Atmosphere Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[400px] bg-gradient-to-r from-sky-100/40 via-blue-50/40 to-indigo-50/40 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Section Heading & Description */}
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-20">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-xs font-semibold uppercase tracking-wider mb-3">
            <span>Meteorological Pipeline</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mb-4">
            From Sensor Data to Actionable Intelligence
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Transform raw weather-station observations into meaningful operational insights.
          </p>
        </div>

        {/* Desktop Horizontal Connected Flow */}
        <div className="hidden lg:grid grid-cols-5 gap-4 relative">
          
          {/* Continuous Weather Background Line */}
          <div className="absolute top-12 left-12 right-12 h-0.5 bg-slate-200 z-0" />

          {steps.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="relative z-10 flex flex-col items-center text-center group">
                
                {/* Step Node Icon Box */}
                <div className={`relative w-24 h-24 rounded-2xl bg-white border border-slate-200 p-4 flex flex-col items-center justify-center shadow-sm transition-all duration-300 group-hover:-translate-y-1 ${item.borderHover}`}>
                  <span className="absolute -top-2.5 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-mono font-bold text-slate-700">
                    {item.step}
                  </span>
                  <Icon className={`w-7 h-7 ${item.accentColor} transition-transform duration-200 group-hover:scale-110`} />
                </div>

                {/* Animated Arrow to Next Step */}
                {index < steps.length - 1 && (
                  <div className="absolute top-10 -right-2 text-slate-400 hidden lg:block pointer-events-none">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}

                {/* Text Content */}
                <div className="mt-5 space-y-1.5 px-2">
                  <span className={`text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${item.tagColor} inline-block`}>
                    {item.tag}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 tracking-wide pt-1">
                    {item.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-normal">
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
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-sky-300 transition-colors">
                  <div className="shrink-0 relative w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-sky-600">
                    <Icon className="w-6 h-6" />
                    <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-slate-100 border border-slate-300 text-[9px] font-mono font-bold flex items-center justify-center text-slate-700">
                      {index + 1}
                    </span>
                  </div>
                  <div className="text-left space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${item.tagColor}`}>
                        {item.tag}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                {index < steps.length - 1 && (
                  <div className="flex justify-center py-0.5">
                    <ArrowDown className="w-4 h-4 text-slate-400" />
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
