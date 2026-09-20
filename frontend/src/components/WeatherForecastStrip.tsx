import React, { useState } from 'react';
import {
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudFog,
  Wind,
  Droplets,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { Station, DailyForecastDay, HourlyForecastHour } from '../types';

interface WeatherForecastStripProps {
  station: Station | null;
  onOpenDeepDive?: (param: 'temperature' | 'rainfall' | 'wind' | 'humidity') => void;
}

function getWeatherIcon(code: number, className = "w-5 h-5") {
  if (code === 0) return <Sun className={`${className} text-amber-500`} />;
  if (code === 1 || code === 2) return <CloudSun className={`${className} text-amber-400`} />;
  if (code === 3) return <Cloud className={`${className} text-slate-400`} />;
  if (code === 45 || code === 48) return <CloudFog className={`${className} text-slate-400`} />;
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return <CloudRain className={`${className} text-blue-500`} />;
  if ([95, 96, 99].includes(code)) return <CloudLightning className={`${className} text-purple-500`} />;
  return <Sun className={`${className} text-amber-500`} />;
}

export const WeatherForecastStrip: React.FC<WeatherForecastStripProps> = ({
  station,
  onOpenDeepDive
}) => {
  const [activeTab, setActiveTab] = useState<'hourly' | 'daily'>('hourly');

  if (!station) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-slate-400 text-sm">
        Select a station on the map or rankings panel to view genuine 24-hour and 5-day forecasts.
      </div>
    );
  }

  const hourlyList: HourlyForecastHour[] = station.hourly_forecast || [];
  const dailyList: DailyForecastDay[] = station.daily_forecast || [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden font-sans">
      {/* Forecast Header */}
      <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                {station.name}, {station.state}
              </h3>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {station.id}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Live Forecast Engine — Open-Meteo Model (IST)
            </p>
          </div>
        </div>

        {/* Tab switcher: 24h Hourly vs 5-Day Outlook */}
        <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('hourly')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'hourly'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>24-Hour Forecast</span>
          </button>
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'daily'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>5-Day Outlook</span>
          </button>
        </div>
      </div>

      {/* Hourly View (Horizontal Scrollable Strip) */}
      {activeTab === 'hourly' && (
        <div className="p-4">
          <div className="flex items-center justify-between mb-3 text-xs text-slate-500">
            <span className="font-medium text-slate-700">Hourly Telemetry Predictions (Next 24 Hours)</span>
            <span className="text-[11px] text-slate-400">Scroll horizontally →</span>
          </div>

          {hourlyList.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              Hourly forecast telemetry synchronizing from Open-Meteo...
            </div>
          ) : (
            <div className="flex items-stretch gap-2.5 overflow-x-auto pb-2 pt-1 scrollbar-thin">
              {hourlyList.map((hourItem, idx) => {
                const isCurrentHour = idx === 0;
                return (
                  <div
                    key={idx}
                    className={`min-w-[105px] flex-shrink-0 flex flex-col items-center justify-between p-3 rounded-xl border transition-all text-center ${
                      isCurrentHour
                        ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/20 shadow-xs'
                        : 'bg-slate-50/60 border-slate-200/80 hover:bg-white hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    <span className="text-[11px] font-bold text-slate-700 font-mono">
                      {isCurrentHour ? 'NOW' : hourItem.hour}
                    </span>

                    <div className="my-2 flex flex-col items-center">
                      {getWeatherIcon(hourItem.weather_code, "w-6 h-6")}
                      <span className="text-[9px] text-slate-500 mt-1 font-medium truncate max-w-[90px]" title={hourItem.condition}>
                        {hourItem.condition}
                      </span>
                    </div>

                    <div className="text-base font-bold text-slate-900 font-mono">
                      {hourItem.temperature !== null ? `${hourItem.temperature}°` : '--'}
                    </div>

                    <div className="w-full mt-2 pt-2 border-t border-slate-200/70 flex flex-col gap-1 text-[10px] text-slate-500">
                      <div className="flex items-center justify-center gap-1 text-blue-600 font-medium">
                        <Droplets className="w-3 h-3" />
                        <span>{hourItem.precip_probability}%</span>
                      </div>
                      {hourItem.wind_speed !== null && (
                        <div className="flex items-center justify-center gap-1 text-slate-400 text-[9px]">
                          <Wind className="w-2.5 h-2.5" />
                          <span>{hourItem.wind_speed} km/h</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Daily View (5-Day Cards with Temperature Range Bar) */}
      {activeTab === 'daily' && (
        <div className="p-4">
          <div className="mb-3 text-xs text-slate-500 flex items-center justify-between">
            <span className="font-medium text-slate-700">Multi-Day Meteorological Projection</span>
            <span className="text-[11px] text-slate-400">Min / Max Range & Precipitation Chance</span>
          </div>

          {dailyList.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              Daily outlook synchronizing from Open-Meteo...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {dailyList.slice(0, 5).map((dayItem, idx) => {
                const dateObj = new Date(dayItem.date);
                const dayName = idx === 0 ? 'Today' : idx === 1 ? 'Tomorrow' : dateObj.toLocaleDateString('en-IN', { weekday: 'short' });
                const formattedDate = dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                      idx === 0
                        ? 'bg-blue-50/60 border-blue-300 ring-2 ring-blue-500/15 shadow-xs'
                        : 'bg-slate-50/60 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    {/* Day Header */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">
                          {dayName}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formattedDate}
                        </span>
                      </div>
                      <div className="p-1 rounded-lg bg-white border border-slate-200 shadow-2xs">
                        {getWeatherIcon(dayItem.weather_code, "w-5 h-5")}
                      </div>
                    </div>

                    {/* Condition text */}
                    <div className="py-2 text-[11px] font-medium text-slate-600 truncate" title={dayItem.condition}>
                      {dayItem.condition}
                    </div>

                    {/* Temperature Range Bar */}
                    <div className="bg-white rounded-lg p-2 border border-slate-200/80 my-1">
                      <div className="flex items-center justify-between text-xs font-mono font-bold">
                        <span className="text-blue-600 flex items-center gap-0.5">
                          <TrendingDown className="w-3 h-3 text-blue-500" />
                          {dayItem.temp_min !== null ? `${dayItem.temp_min}°` : '--'}
                        </span>
                        <span className="text-slate-300 text-[10px]">to</span>
                        <span className="text-orange-600 flex items-center gap-0.5">
                          {dayItem.temp_max !== null ? `${dayItem.temp_max}°` : '--'}
                          <TrendingUp className="w-3 h-3 text-orange-500" />
                        </span>
                      </div>

                      {/* Visual temperature progress bar */}
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden flex">
                        <div className="bg-gradient-to-r from-blue-400 via-amber-400 to-orange-500 h-full rounded-full w-full opacity-85"></div>
                      </div>
                    </div>

                    {/* Rain & Wind indicators */}
                    <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-[10px] text-slate-500">
                      <div className="flex items-center gap-1 text-blue-600 font-medium">
                        <Droplets className="w-3 h-3" />
                        <span>{dayItem.precip_probability}%</span>
                        {dayItem.precipitation_sum > 0 && (
                          <span className="text-slate-400">({dayItem.precipitation_sum}mm)</span>
                        )}
                      </div>
                      {dayItem.wind_speed_max !== null && (
                        <div className="flex items-center gap-1 text-slate-400">
                          <Wind className="w-2.5 h-2.5" />
                          <span>{dayItem.wind_speed_max} km/h</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
