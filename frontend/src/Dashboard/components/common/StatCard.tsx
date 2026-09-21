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
      border: 'border-emerald-500/30 hover:border-emerald-400/60',
      iconBox: 'bg-gradient-to-br from-emerald-500/25 to-emerald-600/10 border-emerald-400/30 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.2)]',
      gradient: 'from-[#102422]/70 via-[#0e1a2b]/80 to-[#0a101f]/90',
      hoverGlow: 'hover:shadow-[0_8px_30px_rgba(52,211,153,0.12)]',
      accentText: 'text-emerald-400',
    },
    amber: {
      border: 'border-amber-500/30 hover:border-amber-400/60',
      iconBox: 'bg-gradient-to-br from-amber-500/25 to-amber-600/10 border-amber-400/30 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.2)]',
      gradient: 'from-[#231b12]/70 via-[#0e172a]/80 to-[#0a101f]/90',
      hoverGlow: 'hover:shadow-[0_8px_30px_rgba(251,191,36,0.12)]',
      accentText: 'text-amber-400',
    },
    rose: {
      border: 'border-rose-500/35 hover:border-rose-400/70',
      iconBox: 'bg-gradient-to-br from-rose-500/25 to-rose-600/10 border-rose-400/35 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.2)]',
      gradient: 'from-[#25131a]/70 via-[#0e1628]/80 to-[#0a101f]/90',
      hoverGlow: 'hover:shadow-[0_8px_30px_rgba(244,63,94,0.14)]',
      accentText: 'text-rose-400',
    },
    sky: {
      border: 'border-sky-500/30 hover:border-sky-400/60',
      iconBox: 'bg-gradient-to-br from-sky-500/25 to-sky-600/10 border-sky-400/30 text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.2)]',
      gradient: 'from-[#111e38]/70 via-[#0e162a]/80 to-[#0a101f]/90',
      hoverGlow: 'hover:shadow-[0_8px_30px_rgba(56,189,248,0.12)]',
      accentText: 'text-sky-400',
    },
    indigo: {
      border: 'border-indigo-500/30 hover:border-indigo-400/60',
      iconBox: 'bg-gradient-to-br from-indigo-500/25 to-indigo-600/10 border-indigo-400/30 text-indigo-300 shadow-[0_0_12px_rgba(129,140,248,0.2)]',
      gradient: 'from-[#1a1736]/70 via-[#0f162c]/80 to-[#0a101f]/90',
      hoverGlow: 'hover:shadow-[0_8px_30px_rgba(129,140,248,0.12)]',
      accentText: 'text-indigo-400',
    },
    teal: {
      border: 'border-teal-500/30 hover:border-teal-400/60',
      iconBox: 'bg-gradient-to-br from-teal-500/25 to-teal-600/10 border-teal-400/30 text-teal-300 shadow-[0_0_12px_rgba(45,212,191,0.2)]',
      gradient: 'from-[#0f2326]/70 via-[#0e172a]/80 to-[#0a101f]/90',
      hoverGlow: 'hover:shadow-[0_8px_30px_rgba(45,212,191,0.12)]',
      accentText: 'text-teal-400',
    },
  }[effectiveColor] || {
    border: 'border-sky-500/30 hover:border-sky-400/60',
    iconBox: 'bg-gradient-to-br from-sky-500/25 to-sky-600/10 border-sky-400/30 text-sky-300',
    gradient: 'from-[#111e38]/70 via-[#0e162a]/80 to-[#0a101f]/90',
    hoverGlow: 'hover:shadow-[0_8px_30px_rgba(56,189,248,0.12)]',
    accentText: 'text-sky-400',
  };

  return (
    <div
      className={`rounded-2xl bg-gradient-to-b ${colorStyles.gradient} border ${colorStyles.border} ${colorStyles.hoverGlow} p-5 transition-all duration-300 transform hover:-translate-y-0.5 select-none backdrop-blur-md relative overflow-hidden`}
    >
      {/* Top subtle shine line */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300">
          {label}
        </span>
        <div className={`p-2.5 rounded-xl border ${colorStyles.iconBox} transition-transform group-hover:scale-105`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2 mb-2">
        <div className="flex items-baseline gap-1.5">
          <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
            {value}
          </div>
          {unit && (
            <span className="text-xs font-mono text-slate-400 font-semibold">{unit}</span>
          )}
        </div>
        {badge && (
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-700/80 text-slate-300">
            {badge}
          </span>
        )}
      </div>

      {(trend || subtext || changeText) && (
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2.5 border-t border-slate-800/60">
          {trend ? (
            <span className={trend.isPositive ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}% {trend.label}
            </span>
          ) : (
            <span className="text-slate-300">{changeText}</span>
          )}
          {subtext && <span className="text-slate-400 truncate max-w-[150px]">{subtext}</span>}
        </div>
      )}
    </div>
  );
};
