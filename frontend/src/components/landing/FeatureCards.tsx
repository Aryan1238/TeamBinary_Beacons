import React from 'react';
import { CloudSun, History, CloudLightning, Check } from 'lucide-react';

export const FeatureCards: React.FC = () => {
  const features = [
    {
      step: '01',
      title: 'REAL-TIME MONITORING',
      description: 'Continuously observe sensor telemetry and station health across the AWS network.',
      icon: CloudSun,
      badge: 'Atmospheric Ingestion',
      iconColor: 'text-sky-700',
      iconBg: 'bg-sky-50 border-sky-200 shadow-xs',
      cardBg: 'bg-white',
      borderGlow: 'hover:border-sky-300 hover:shadow-md',
      highlights: [
        'Multi-sensor telemetry stream (Temp, RH, Pressure, Wind)',
        'Station heartbeat, packet latency & transmission health',
        'Topological distribution across varied microclimates'
      ]
    },
    {
      step: '02',
      title: 'HISTORICAL INTELLIGENCE',
      description: 'Compare incoming observations with historical patterns and expected behavior.',
      icon: History,
      badge: 'Diurnal Harmonic Analysis',
      iconColor: 'text-amber-700',
      iconBg: 'bg-amber-50 border-amber-200 shadow-xs',
      cardBg: 'bg-white',
      borderGlow: 'hover:border-amber-300 hover:shadow-md',
      highlights: [
        'Diurnal solar cycle harmonic validation envelope',
        'Seasonal baseline thresholds & climatological limits',
        'Multi-station spatial nearest-neighbor correlation'
      ]
    },
    {
      step: '03',
      title: 'INTELLIGENT ALERTS',
      description: 'Identify abnormal sensor behavior and provide clear information for investigation.',
      icon: CloudLightning,
      badge: 'Automated Squall Triage',
      iconColor: 'text-indigo-700',
      iconBg: 'bg-indigo-50 border-indigo-200 shadow-xs',
      cardBg: 'bg-white',
      borderGlow: 'hover:border-indigo-300 hover:shadow-md',
      highlights: [
        'Distinguishes real storm events from sensor malfunctions',
        'Stuck ADC transducer & progressive drift detection',
        'Root-cause meteorological attribution for operators'
      ]
    }
  ];

  return (
    <section id="overview" className="relative py-16 sm:py-24 border-b border-slate-200">
      
      {/* Background Soft Atmospheric Cloud Glows */}
      <div className="absolute top-1/2 left-1/3 w-96 h-96 bg-sky-100/50 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-blue-50/50 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-20">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-xs font-semibold uppercase tracking-wider mb-3">
            <span>Core Meteorological Capabilities</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mb-4">
            Purpose-Engineered for Automatic Weather Stations
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Reliable weather intelligence starts with trust in raw sensor data. Our architecture combines multi-modal observation, temporal tracking, and contextual alerting.
          </p>
        </div>

        {/* 3 Reference Style Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className={`group relative rounded-3xl ${feature.cardBg} border border-slate-200 p-6 sm:p-8 transition-all duration-300 transform hover:-translate-y-1.5 shadow-sm ${feature.borderGlow}`}
              >
                {/* Top Badge & Step Marker */}
                <div className="flex items-center justify-between mb-6">
                  <div className={`p-3.5 rounded-2xl border ${feature.iconBg} ${feature.iconColor}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                      {feature.badge}
                    </span>
                    <span className="w-6 h-6 rounded-full bg-slate-100 border border-slate-300 text-[10px] font-mono font-bold text-slate-700 flex items-center justify-center">
                      {feature.step}
                    </span>
                  </div>
                </div>

                {/* Card Title */}
                <h3 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 mb-3 group-hover:text-sky-700 transition-colors">
                  {feature.title}
                </h3>

                {/* Exact prompt quote */}
                <p className="text-sm text-slate-600 leading-relaxed mb-6 font-normal">
                  "{feature.description}"
                </p>

                {/* Feature Highlights */}
                <div className="pt-4 border-t border-slate-100 space-y-2.5">
                  {feature.highlights.map((item, hIdx) => (
                    <div key={hIdx} className="flex items-start gap-2.5 text-xs text-slate-600">
                      <div className="mt-0.5 rounded-full p-0.5 bg-sky-50 text-sky-600 border border-sky-200 shrink-0">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                      <span className="leading-snug">{item}</span>
                    </div>
                  ))}
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
