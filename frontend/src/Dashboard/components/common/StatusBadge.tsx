import React from 'react';
import { StationStatus } from '../../types/dashboard.types';

interface StatusBadgeProps {
  status: StationStatus;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showDot = true,
}) => {
  const getColors = () => {
    switch (status) {
      case 'NORMAL':
        return {
          bg: 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.15)]',
          dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]',
        };
      case 'WARNING':
        return {
          bg: 'bg-amber-500/15 border-amber-500/35 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.15)]',
          dot: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]',
        };
      case 'ANOMALY':
        return {
          bg: 'bg-rose-500/20 border-rose-500/40 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.25)]',
          dot: 'bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.7)]',
        };
      case 'OFFLINE':
      default:
        return {
          bg: 'bg-slate-800/60 border-slate-700/60 text-slate-400',
          dot: 'bg-slate-400',
        };
    }
  };

  const style = getColors();

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3.5 py-1.5',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-mono font-semibold border backdrop-blur-md ${style.bg} ${sizeClasses}`}
    >
      {showDot && (
        <span className="relative flex h-2 w-2 shrink-0">
          {status === 'ANOMALY' || status === 'NORMAL' ? (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${style.dot}`}
            />
          ) : null}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${style.dot}`} />
        </span>
      )}
      <span>{status}</span>
    </span>
  );
};
