/**
 * Live Weather API Service
 * Fetches real, live meteorological surface observations using Open-Meteo API
 * (Free, open-access, zero-key, high-precision WMO synoptic grid).
 */

export interface HourlyForecastPoint {
  time: string;
  temperature: number;
  humidity: number;
}

export interface LiveWeatherData {
  temperature: number; // °C
  apparentTemperature: number; // °C
  humidity: number; // %
  pressure: number; // hPa
  windSpeed: number; // km/h
  windDirection: number; // degrees
  windCompass: string; // e.g. "NW", "SSW"
  precipitation: number; // mm
  weatherCode: number;
  weatherCondition: string; // e.g. "Clear sky", "Light Rain"
  weatherCategory: 'clear' | 'clouds' | 'rain' | 'storm' | 'snow' | 'fog';
  timestamp: string; // Formatted API response timestamp
  rawTimestamp: string;
  timezone: string;
  hourlyForecast: HourlyForecastPoint[];
  source: string;
}

/**
 * Converts wind azimuth in degrees to 16-point cardinal compass direction
 */
export function getCompassDirection(degrees: number): string {
  const directions = [
    'N', 'NNE', 'NE', 'ENE',
    'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW',
    'W', 'WNW', 'NW', 'NNW',
  ];
  const index = Math.round(((degrees % 360) / 22.5)) % 16;
  return directions[index];
}

/**
 * Maps WMO Weather interpretation codes (WW) to human-readable labels and categories
 */
export function getWeatherConditionFromWMO(code: number): {
  condition: string;
  category: LiveWeatherData['weatherCategory'];
} {
  switch (code) {
    case 0:
      return { condition: 'Clear Sky', category: 'clear' };
    case 1:
      return { condition: 'Mainly Clear', category: 'clear' };
    case 2:
      return { condition: 'Partly Cloudy', category: 'clouds' };
    case 3:
      return { condition: 'Overcast', category: 'clouds' };
    case 45:
      return { condition: 'Fog', category: 'fog' };
    case 48:
      return { condition: 'Depositing Rime Fog', category: 'fog' };
    case 51:
      return { condition: 'Light Drizzle', category: 'rain' };
    case 53:
      return { condition: 'Moderate Drizzle', category: 'rain' };
    case 55:
      return { condition: 'Dense Drizzle', category: 'rain' };
    case 56:
    case 57:
      return { condition: 'Freezing Drizzle', category: 'rain' };
    case 61:
      return { condition: 'Slight Rain', category: 'rain' };
    case 62:
    case 63:
      return { condition: 'Moderate Rain', category: 'rain' };
    case 65:
      return { condition: 'Heavy Rain', category: 'rain' };
    case 66:
    case 67:
      return { condition: 'Freezing Rain', category: 'rain' };
    case 71:
      return { condition: 'Slight Snow Fall', category: 'snow' };
    case 73:
      return { condition: 'Moderate Snow Fall', category: 'snow' };
    case 75:
      return { condition: 'Heavy Snow Fall', category: 'snow' };
    case 77:
      return { condition: 'Snow Grains', category: 'snow' };
    case 80:
      return { condition: 'Slight Rain Showers', category: 'rain' };
    case 81:
      return { condition: 'Moderate Rain Showers', category: 'rain' };
    case 82:
      return { condition: 'Violent Rain Showers', category: 'rain' };
    case 85:
    case 86:
      return { condition: 'Snow Showers', category: 'snow' };
    case 95:
      return { condition: 'Thunderstorm', category: 'storm' };
    case 96:
    case 99:
      return { condition: 'Thunderstorm with Hail', category: 'storm' };
    default:
      return { condition: 'Atmospheric Conditions', category: 'clouds' };
  }
}

/**
 * Formats API ISO timestamp into human-readable Indian Standard Time or local station time
 */
export function formatApiTimestamp(isoString: string): string {
  if (!isoString) return 'Real-time API Ingest';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      return isoString.replace('T', ' ');
    }
    const timeStr = date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const dateStr = date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    return `${dateStr} • ${timeStr} IST`;
  } catch {
    return isoString;
  }
}

/**
 * Fetches real weather data from Open-Meteo for the given latitude and longitude.
 * Validates coordinates, handles network errors, and formats into LiveWeatherData.
 */
export async function fetchLiveWeather(
  latitude: number,
  longitude: number,
  signal?: AbortSignal
): Promise<LiveWeatherData> {
  if (
    typeof latitude !== 'number' ||
    typeof longitude !== 'number' ||
    isNaN(latitude) ||
    isNaN(longitude)
  ) {
    throw new Error('Invalid station coordinates provided for weather query.');
  }

  // Open-Meteo Forecast endpoint with current conditions & 24h hourly forecast
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude.toFixed(4)}&longitude=${longitude.toFixed(4)}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,surface_pressure,wind_speed_10m,wind_direction_10m,weather_code&hourly=temperature_2m,relative_humidity_2m&timezone=Asia%2FKolkata&forecast_days=2`;

  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(`Weather service returned HTTP ${response.status}: ${response.statusText || 'Unable to fetch data'}`);
  }

  const data = await response.json();

  if (!data || !data.current) {
    throw new Error('Weather API returned an empty or malformed payload.');
  }

  const current = data.current;
  const { condition, category } = getWeatherConditionFromWMO(current.weather_code ?? 0);
  const compass = getCompassDirection(current.wind_direction_10m ?? 0);

  // Extract next 24 hourly points
  const hourlyTimes: string[] = data.hourly?.time || [];
  const hourlyTemps: number[] = data.hourly?.temperature_2m || [];
  const hourlyHums: number[] = data.hourly?.relative_humidity_2m || [];

  // Find index closest to current time or take first 24 points
  const currentTimeStr = current.time;
  let startIndex = 0;
  if (currentTimeStr && hourlyTimes.length > 0) {
    const foundIdx = hourlyTimes.findIndex((t) => t >= currentTimeStr);
    if (foundIdx !== -1) {
      startIndex = Math.max(0, foundIdx - 4); // Include past 4 hours and next 20 hours
    }
  }

  const hourlyForecast: HourlyForecastPoint[] = [];
  const count = Math.min(24, hourlyTimes.length - startIndex);
  for (let i = 0; i < count; i++) {
    const idx = startIndex + i;
    const rawTime = hourlyTimes[idx];
    const hourPart = rawTime ? rawTime.split('T')[1]?.slice(0, 5) || rawTime : `${i}:00`;
    hourlyForecast.push({
      time: hourPart,
      temperature: Math.round((hourlyTemps[idx] ?? 0) * 10) / 10,
      humidity: Math.round(hourlyHums[idx] ?? 0),
    });
  }

  return {
    temperature: Math.round((current.temperature_2m ?? 0) * 10) / 10,
    apparentTemperature: Math.round((current.apparent_temperature ?? current.temperature_2m ?? 0) * 10) / 10,
    humidity: Math.round(current.relative_humidity_2m ?? 0),
    pressure: Math.round((current.surface_pressure ?? 1013.25) * 10) / 10,
    windSpeed: Math.round((current.wind_speed_10m ?? 0) * 10) / 10,
    windDirection: Math.round(current.wind_direction_10m ?? 0),
    windCompass: compass,
    precipitation: Math.round((current.precipitation ?? 0) * 10) / 10,
    weatherCode: current.weather_code ?? 0,
    weatherCondition: condition,
    weatherCategory: category,
    timestamp: formatApiTimestamp(current.time),
    rawTimestamp: current.time,
    timezone: data.timezone || 'Asia/Kolkata',
    hourlyForecast,
    source: 'Open-Meteo Global Synoptic Grid (Live External API)',
  };
}
