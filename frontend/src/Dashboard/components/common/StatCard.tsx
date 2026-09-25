import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  statusColor?: 'emerald' | 'amber' | 'rose' | 'sky' | 'indigo' | 'teal' | 'red';
  variant?: string;
  changeText?: string;
  subtext?: string;
  badge?: string;
  trend?: { value: number; isPositive: boolean; label: string };
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  unit,
  icon: Icon,
  statusColor = 'sky',
  variant,
  changeText,
  subtext,
  badge,
  trend,
}) => {
  const normalizedVariant = variant === 'red' ? 'rose' : variant;
  const effectiveColor = (normalizedVariant || statusColor) as
    | 'emerald'
    | 'amber'
    | 'rose'
    | 'sky'
    | 'indigo'
    | 'teal';

  const colorStyles = {
    emerald: {
      border: 'border-emerald-200 hover:border-emerald-400',
      iconBox: 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-2xs',
      gradient: 'bg-white',
      hoverGlow: 'hover:shadow-md hover:shadow-emerald-500/10',
      accentText: 'text-emerald-700',
    },
    amber: {
      border: 'border-amber-200 hover:border-amber-400',
      iconBox: 'bg-amber-50 border-amber-200 text-amber-700 shadow-2xs',
      gradient: 'bg-white',
      hoverGlow: 'hover:shadow-md hover:shadow-amber-500/10',
      accentText: 'text-amber-700',
    },
    rose: {
      border: 'border-red-200 hover:border-red-400',
      iconBox: 'bg-red-50 border-red-200 text-red-700 shadow-2xs',
      gradient: 'bg-white',
      hoverGlow: 'hover:shadow-md hover:shadow-red-500/10',
      accentText: 'text-red-700',
    },
    sky: {
      border: 'border-sky-200 hover:border-sky-400',
      iconBox: 'bg-sky-50 border-sky-200 text-sky-700 shadow-2xs',
      gradient: 'bg-white',
      hoverGlow: 'hover:shadow-md hover:shadow-sky-500/10',
      accentText: 'text-sky-700',
    },
    indigo: {
      border: 'border-blue-200 hover:border-blue-400',
      iconBox: 'bg-blue-50 border-blue-200 text-blue-700 shadow-2xs',
      gradient: 'bg-white',
      hoverGlow: 'hover:shadow-md hover:shadow-blue-500/10',
      accentText: 'text-blue-700',
    },
    teal: {
      border: 'border-teal-200 hover:border-teal-400',
      iconBox: 'bg-teal-50 border-teal-200 text-teal-700 shadow-2xs',
      gradient: 'bg-white',
      hoverGlow: 'hover:shadow-md hover:shadow-teal-500/10',
      accentText: 'text-teal-700',
    },
  }[effectiveColor] || {
    border: 'border-sky-200 hover:border-sky-400',
    iconBox: 'bg-sky-50 border-sky-200 text-sky-700 shadow-2xs',
    gradient: 'bg-white',
    hoverGlow: 'hover:shadow-md hover:shadow-sky-500/10',
    accentText: 'text-sky-700',
  };

  return (
    <div
      className={`rounded-2xl ${colorStyles.gradient} border ${colorStyles.border} ${colorStyles.hoverGlow} p-5 transition-all duration-300 transform hover:-translate-y-0.5 select-none relative overflow-hidden shadow-xs`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </span>
        <div className={`p-2.5 rounded-xl border ${colorStyles.iconBox} transition-transform group-hover:scale-105`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2 mb-2">
        <div className="flex items-baseline gap-1.5">
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
            {value}
          </div>
          {unit && (
            <span className="text-xs font-mono text-slate-500 font-semibold">{unit}</span>
          )}
        </div>
        {badge && (
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700">
            {badge}
          </span>
        )}
      </div>

      {(trend || subtext || changeText) && (
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-2.5 border-t border-slate-100">
          {trend ? (
            <span className={trend.isPositive ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold'}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}% {trend.label}
            </span>
          ) : (
            <span className="text-slate-600">{changeText}</span>
          )}
          {subtext && <span className="text-slate-500 truncate max-w-[150px]">{subtext}</span>}
        </div>
      )}
    </div>
  );
};
