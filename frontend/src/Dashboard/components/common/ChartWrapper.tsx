import React from 'react';

interface ChartWrapperProps {
  title: string;
  subtitle?: string;
  badge?: string;
  controls?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  height?: string | number;
}

export const ChartWrapper: React.FC<ChartWrapperProps> = ({
  title,
  subtitle,
  badge,
  controls,
  children,
  className = '',
  height = 320,
}) => {
  return (
    <div className={`p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-[#111a31]/90 via-[#0e1628]/85 to-[#090e1c]/95 border border-slate-800/80 backdrop-blur-md shadow-xl flex flex-col relative overflow-hidden ${className}`}>
      {/* Top subtle ambient shine */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-sky-400/20 to-transparent pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="font-bold text-white text-base tracking-tight">{title}</h3>
            {badge && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30 shadow-[0_0_10px_rgba(56,189,248,0.15)]">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
          )}
        </div>
        {controls && (
          <div className="flex items-center gap-2 shrink-0">
            {controls}
          </div>
        )}
      </div>

      <div style={{ height: typeof height === 'number' ? `${height}px` : height }} className="w-full relative">
        {children}
      </div>
    </div>
  );
};
