import React from 'react';
import { LucideIcon } from 'lucide-react';
import { StatMetric } from '../types';

interface StatCardProps {
  metric: StatMetric;
  icon: LucideIcon;
}

export const StatCard: React.FC<StatCardProps> = ({ metric, icon: Icon }) => {
  const getBadgeStyle = (type?: string) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-950/50 text-emerald-400 border-emerald-500/30';
      case 'warning':
        return 'bg-amber-950/50 text-amber-400 border-amber-500/30';
      case 'info':
        return 'bg-cyan-950/50 text-cyan-400 border-cyan-500/30';
      default:
        return 'bg-slate-800/60 text-slate-300 border-slate-700/50';
    }
  };

  return (
    <div className="dashboard-card p-5 select-none">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono font-medium uppercase tracking-wider text-slate-400">
          {metric.title}
        </span>
        <div className="p-2 rounded-lg bg-slate-800/70 border border-slate-700/60 text-cyan-400">
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2 mb-2">
        <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
          {metric.value}
        </div>
        {metric.badge && (
          <span
            className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${getBadgeStyle(
              metric.statusType
            )}`}
          >
            {metric.badge}
          </span>
        )}
      </div>

      {metric.helperText && (
        <p className="text-xs text-slate-400 font-normal leading-relaxed">
          {metric.helperText}
        </p>
      )}
    </div>
  );
};
