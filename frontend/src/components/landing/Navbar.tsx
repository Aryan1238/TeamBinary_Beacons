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
          ? 'bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs'
          : 'bg-white/80 backdrop-blur-xs border-b border-slate-200/70'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand Logo & Name */}
          <div
            className="flex items-center gap-3 cursor-pointer group select-none"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 shadow-2xs group-hover:border-sky-400 transition-colors">
              <CloudSun className="w-5 h-5 text-sky-600" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg sm:text-xl tracking-tight text-slate-900 font-sans">
                  AWS <span className="text-sky-600">Intelligence</span>
                </span>
              </div>
              <p className="text-[10px] text-slate-500 tracking-wide font-mono hidden sm:block">
                Meteorological Telemetry Assurance
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection('overview')}
              className="text-sm font-medium text-slate-600 hover:text-sky-700 transition-colors cursor-pointer"
            >
              Overview
            </button>
            <button
              onClick={() => scrollToSection('technology')}
              className="text-sm font-medium text-slate-600 hover:text-sky-700 transition-colors cursor-pointer"
            >
              Technology
            </button>
            <button
              onClick={() => scrollToSection('monitoring')}
              className="text-sm font-medium text-slate-600 hover:text-sky-700 transition-colors cursor-pointer"
            >
              Monitoring
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="text-sm font-medium text-slate-600 hover:text-sky-700 transition-colors cursor-pointer"
            >
              About
            </button>
          </nav>

          {/* Right Action Button */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={onOpenDashboard}
              className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold shadow-xs transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <span>Open Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5 text-white transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onOpenDashboard}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold"
            >
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white/95 backdrop-blur-xl px-4 pt-3 pb-5 space-y-3">
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => scrollToSection('overview')}
              className="text-left py-2 px-3 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-sky-700"
            >
              Overview
            </button>
            <button
              onClick={() => scrollToSection('technology')}
              className="text-left py-2 px-3 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-sky-700"
            >
              Technology
            </button>
            <button
              onClick={() => scrollToSection('monitoring')}
              className="text-left py-2 px-3 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-sky-700"
            >
              Monitoring
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="text-left py-2 px-3 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-sky-700"
            >
              About
            </button>
          </div>
          <div className="pt-2 border-t border-slate-200">
            <button
              onClick={onOpenDashboard}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold shadow-xs"
            >
              <span>Open Dashboard</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
