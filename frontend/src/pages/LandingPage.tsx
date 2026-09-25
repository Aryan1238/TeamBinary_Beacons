import React, { useState } from 'react';
import { Navbar } from '../components/landing/Navbar';
import { Hero } from '../components/landing/Hero';
import { FeatureCards } from '../components/landing/FeatureCards';
import { FlowSection } from '../components/landing/FlowSection';
import { StatsStrip } from '../components/landing/StatsStrip';
import { CTASection } from '../components/landing/CTASection';
import { Footer } from '../components/landing/Footer';
import { CloudSun, X, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onOpenDashboard?: () => void;
  onLaunchCommandCenter?: () => void;
  onLaunchSimulationLab?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenDashboard,
  onLaunchCommandCenter,
  onLaunchSimulationLab
}) => {
  const [comingSoonModalOpen, setComingSoonModalOpen] = useState(false);

  // Connect to custom dashboard if handler provided, otherwise open placeholder modal
  const handleOpenDashboard = () => {
    if (onOpenDashboard) {
      onOpenDashboard();
    } else {
      setComingSoonModalOpen(true);
    }
  };

  const handleExploreSystem = () => {
    const el = document.getElementById('overview');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-y-auto selection:bg-sky-500/20 selection:text-sky-900 font-sans scroll-smooth relative">
      
      {/* 1. Weather-Themed Navbar */}
      <Navbar onOpenDashboard={handleOpenDashboard} />

      {/* 2 & 3. Hero Section with Atmospheric Sky Hierarchy & Weather Telemetry Mesh */}
      <Hero
        onOpenDashboard={handleOpenDashboard}
        onExploreSystem={handleExploreSystem}
      />

      {/* 4. Three Capability Cards (Styled in reference card design with weather accents) */}
      <FeatureCards />

      {/* 5. System Flow Section: From Sensor Data to Actionable Intelligence */}
      <FlowSection />

      {/* 6. Elevated Platform Statistics Strip with Weather Radar Texture */}
      <StatsStrip />

      {/* 7. Final Weather CTA Section */}
      <CTASection onOpenDashboard={handleOpenDashboard} />

      {/* 8. Weather Dark Footer with Prototype Disclaimer */}
      <Footer />

      {/* "Coming Soon" Modal for Dashboard Slot */}
      {comingSoonModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fadeIn select-none"
          onClick={() => setComingSoonModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl text-center space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setComingSoonModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors border border-slate-200"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Weather Modal Icon */}
            <div className="mx-auto w-16 h-16 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600 shadow-xs">
              <CloudSun className="w-8 h-8" />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-[11px] font-mono font-semibold border border-sky-200 inline-block">
                DASHBOARD SLOT RESERVED
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Monitoring Dashboard
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
                The dashboard link is currently detached as requested. You can attach and wire your custom dashboard here when ready.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <button
                onClick={() => {
                  setComingSoonModalOpen(false);
                  handleExploreSystem();
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5"
              >
                <span>Explore Architecture</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setComingSoonModalOpen(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold transition-all"
              >
                Close
              </button>
            </div>

            <p className="text-[10px] text-slate-400 font-mono">
              SkyGuard AI • Landing Architecture
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
