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
    <div className={`p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col relative overflow-hidden ${className}`}>
      {/* Top subtle ambient shine */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-sky-400/30 to-transparent pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="font-bold text-slate-900 text-base tracking-tight">{title}</h3>
            {badge && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-sky-50 text-sky-700 border border-sky-200 shadow-xs">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
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
