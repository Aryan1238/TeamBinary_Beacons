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
    <div className="min-h-screen bg-[#091021] bg-gradient-to-b from-[#0B132B] via-[#0E172E] to-[#070D1C] text-slate-100 overflow-y-auto selection:bg-amber-400/30 selection:text-amber-200 font-sans scroll-smooth relative">
      
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn select-none"
          onClick={() => setComingSoonModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-[#111C35] via-[#0D162B] to-[#090F1E] border border-sky-500/40 p-6 sm:p-8 shadow-[0_0_60px_rgba(2,132,199,0.3)] text-center space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setComingSoonModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors border border-slate-700/60"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Weather Modal Icon */}
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 via-sky-500/20 to-indigo-600/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-inner">
              <CloudSun className="w-8 h-8" />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-amber-400/10 text-amber-300 text-[11px] font-mono font-semibold border border-amber-400/30 inline-block">
                DASHBOARD SLOT RESERVED
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Monitoring Dashboard
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm mx-auto">
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
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-semibold text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                <span>Explore Architecture</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setComingSoonModalOpen(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
              >
                Close
              </button>
            </div>

            <p className="text-[10px] text-slate-500 font-mono">
              SIH 2026 • Standalone Landing Page Architecture
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
