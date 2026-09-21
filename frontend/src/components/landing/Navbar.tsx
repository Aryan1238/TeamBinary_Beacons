import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowRight, CloudSun } from 'lucide-react';

interface NavbarProps {
  onOpenDashboard: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenDashboard }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#0B132B]/90 backdrop-blur-md border-b border-sky-500/20 shadow-[0_4px_30px_rgba(2,132,199,0.15)]'
          : 'bg-[#0B132B]/60 backdrop-blur-xs border-b border-slate-800/80'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand Logo & Name */}
          <div
            className="flex items-center gap-3 cursor-pointer group select-none"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500/20 via-indigo-500/20 to-amber-500/20 border border-sky-400/40 shadow-[0_0_20px_rgba(56,189,248,0.25)] group-hover:border-amber-400/60 transition-colors">
              <CloudSun className="w-5 h-5 text-amber-300" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0B132B] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg sm:text-xl tracking-tight text-white font-sans">
                  AWS <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-sky-200 to-amber-300">Intelligence</span>
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-sky-950/80 text-sky-300 border border-sky-500/30">
                  SIH 2026
                </span>
              </div>
              <p className="text-[10px] text-slate-400 tracking-wide font-mono hidden sm:block">
                Meteorological Telemetry Assurance
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection('overview')}
              className="text-sm font-medium text-slate-300 hover:text-sky-300 transition-colors cursor-pointer"
            >
              Overview
            </button>
            <button
              onClick={() => scrollToSection('technology')}
              className="text-sm font-medium text-slate-300 hover:text-sky-300 transition-colors cursor-pointer"
            >
              Technology
            </button>
            <button
              onClick={() => scrollToSection('monitoring')}
              className="text-sm font-medium text-slate-300 hover:text-sky-300 transition-colors cursor-pointer"
            >
              Monitoring
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="text-sm font-medium text-slate-300 hover:text-sky-300 transition-colors cursor-pointer"
            >
              About
            </button>
          </nav>

          {/* Right Action Button (Non-functional placeholder / Coming Soon) */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={onOpenDashboard}
              className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 via-indigo-600 to-slate-800 hover:from-sky-500 hover:via-indigo-500 hover:to-slate-700 text-white text-sm font-semibold border border-sky-400/40 shadow-[0_0_20px_rgba(56,189,248,0.25)] hover:shadow-[0_0_25px_rgba(56,189,248,0.45)] transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <span>Open Dashboard</span>
              <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 text-[9px] font-mono border border-amber-400/40">
                Soon
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-sky-200 transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onOpenDashboard}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold border border-sky-400/30"
            >
              <span>Dashboard</span>
              <span className="text-[9px] text-amber-300 font-mono">Soon</span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/70 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-sky-500/20 bg-[#0B132B]/95 backdrop-blur-xl px-4 pt-3 pb-5 space-y-3">
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => scrollToSection('overview')}
              className="text-left py-2 px-3 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-800/70 hover:text-sky-300"
            >
              Overview
            </button>
            <button
              onClick={() => scrollToSection('technology')}
              className="text-left py-2 px-3 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-800/70 hover:text-sky-300"
            >
              Technology
            </button>
            <button
              onClick={() => scrollToSection('monitoring')}
              className="text-left py-2 px-3 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-800/70 hover:text-sky-300"
            >
              Monitoring
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="text-left py-2 px-3 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-800/70 hover:text-sky-300"
            >
              About
            </button>
          </div>
          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={onOpenDashboard}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 via-indigo-600 to-slate-800 text-white text-sm font-semibold border border-sky-400/40 shadow-md"
            >
              <span>Open Dashboard</span>
              <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 text-[10px] font-mono">
                Coming Soon
              </span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
