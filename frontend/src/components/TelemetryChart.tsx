import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Area,
  ComposedChart
} from 'recharts';

interface TelemetryChartProps {
  title: string;
  parameter: 'Temperature' | 'Pressure' | 'Humidity';
  unit: string;
  data: { time: string; observed: number; expected: number; isAnomaly?: boolean }[];
  currentValue: number;
  expectedValue: number;
  normalRange: [number, number];
  color?: string;
  anomalyDetected?: boolean;
}

export const TelemetryChart: React.FC<TelemetryChartProps> = ({
  title,
  parameter,
  unit,
  data,
  currentValue,
  expectedValue,
  normalRange,
  color = '#0284C7',
  anomalyDetected = false
}) => {
  const deviation = Number((currentValue - expectedValue).toFixed(1));
  const hasAnomaly = anomalyDetected || Math.abs(deviation) > (parameter === 'Temperature' ? 5 : (parameter === 'Pressure' ? 12 : 20));

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col h-full shadow-xs">
      {/* Header with KPI and Deviation */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-[11px] uppercase font-sans tracking-wide text-slate-500 font-semibold">{title}</span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className={`font-mono text-2xl font-bold ${hasAnomaly ? 'text-red-600' : 'text-slate-900'}`}>
              {currentValue} {unit}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Expected: {expectedValue} {unit}
            </span>
          </div>
        </div>

        <div className="text-right">
          <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold ${
            hasAnomaly
              ? 'bg-red-50 text-red-700 border border-red-200'
              : (Math.abs(deviation) > 2 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200')
          }`}>
            <span>{deviation > 0 ? `+${deviation}` : deviation} {unit}</span>
          </div>
          <span className="block text-[10px] text-slate-400 font-sans mt-0.5">
            {hasAnomaly ? 'Threshold Breach' : 'Regional Baseline'}
          </span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="flex-1 w-full min-h-[120px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={`gradient-${parameter}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={hasAnomaly ? '#EF4444' : color} stopOpacity={0.2}/>
                <stop offset="95%" stopColor={hasAnomaly ? '#EF4444' : color} stopOpacity={0.0}/>
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />

            <XAxis
              dataKey="time"
              stroke="#94A3B8"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#E2E8F0' }}
            />

            <YAxis
              stroke="#94A3B8"
              fontSize={10}
              domain={['auto', 'auto']}
              tickLine={false}
              axisLine={{ stroke: '#E2E8F0' }}
            />

            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white border border-slate-200 p-2.5 rounded-lg shadow-lg font-sans text-xs text-slate-800">
                      <p className="font-semibold text-slate-500 mb-1">{label}</p>
                      <p className="font-mono text-cyan-700 font-bold">
                        Observed: {payload[0]?.value} {unit}
                      </p>
                      {payload[1] && (
                        <p className="font-mono text-slate-500">
                          Expected: {payload[1]?.value} {unit}
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Expected baseline envelope */}
            <Line
              type="monotone"
              dataKey="expected"
              stroke="#94A3B8"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              dot={false}
              name="Expected"
            />

            {/* Observed telemetry curve */}
            <Area
              type="monotone"
              dataKey="observed"
              stroke={hasAnomaly ? '#DC2626' : color}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#gradient-${parameter})`}
              name="Observed"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
