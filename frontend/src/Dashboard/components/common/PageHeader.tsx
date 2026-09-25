import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  subtitle?: string;
  badgeText?: string;
  badge?: string;
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  subtitle,
  badgeText,
  badge,
  children
}) => {
  const displayDesc = subtitle || description || '';
  const displayBadge = badge || badgeText || 'SIMULATED DATA';

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200/90 mb-6">
      <div>
        <div className="flex items-center gap-2.5 mb-1.5">
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 font-sans">
            {title}
          </h1>
          <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-mono font-semibold tracking-wider">
            {displayBadge}
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
          {displayDesc}
        </p>
      </div>

      {children && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {children}
        </div>
      )}
    </div>
  );
};
