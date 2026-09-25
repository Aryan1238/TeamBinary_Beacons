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
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
          dot: 'bg-emerald-500',
        };
      case 'WARNING':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-700',
          dot: 'bg-amber-500',
        };
      case 'ANOMALY':
        return {
          bg: 'bg-red-50 border-red-200 text-red-700',
          dot: 'bg-red-500',
        };
      case 'OFFLINE':
      default:
        return {
          bg: 'bg-slate-100 border-slate-200 text-slate-600',
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
