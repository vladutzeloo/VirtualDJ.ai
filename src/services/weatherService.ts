/**
 * Weather Service
 *
 * Pulls current conditions from Open-Meteo (no API key required) so the DJ
 * agents can flavour recommendations based on real-world ambience.
 *
 * Two endpoints are used:
 *   - https://geocoding-api.open-meteo.com/v1/search   (city → lat/lon)
 *   - https://api.open-meteo.com/v1/forecast           (lat/lon → conditions)
 *
 * Both are public, free, and CORS-enabled. Last reading + chosen location
 * are cached in localStorage so the chip renders instantly on reload.
 */

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';

const LOCATION_KEY = 'vdj.weather.location.v1';
const READING_KEY = 'vdj.weather.reading.v1';

/** Maximum age for a cached reading before we refetch on resume. */
const READING_TTL_MS = 15 * 60 * 1000;

export interface WeatherLocation {
  name: string;
  country?: string;
  lat: number;
  lon: number;
  timezone?: string;
  source: 'geolocation' | 'geocode' | 'manual';
}

export interface WeatherReading {
  location: WeatherLocation;
  tempC: number;
  feelsLikeC?: number;
  windKph: number;
  humidity?: number;
  isDay: boolean;
  code: number;
  description: string;
  fetchedAt: number;
}

type Listener = () => void;
const listeners = new Set<Listener>();
const notify = () => listeners.forEach((l) => l());

export const subscribeWeather = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const safeRead = <T>(key: string): T | null => {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const safeWrite = (key: string, value: unknown): void => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
};

export const getStoredLocation = (): WeatherLocation | null =>
  safeRead<WeatherLocation>(LOCATION_KEY);

export const getStoredReading = (): WeatherReading | null =>
  safeRead<WeatherReading>(READING_KEY);

const setStoredLocation = (loc: WeatherLocation): void => {
  safeWrite(LOCATION_KEY, loc);
  notify();
};

const setStoredReading = (reading: WeatherReading): void => {
  safeWrite(READING_KEY, reading);
  notify();
};

export const clearWeather = (): void => {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(LOCATION_KEY);
  localStorage.removeItem(READING_KEY);
  notify();
};

// Open-Meteo WMO weather code → short description.
// https://open-meteo.com/en/docs#weathervariables
const WEATHER_CODES: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mostly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Rime fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  56: 'Freezing drizzle',
  57: 'Heavy freezing drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  66: 'Freezing rain',
  67: 'Heavy freezing rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Light showers',
  81: 'Showers',
  82: 'Violent showers',
  85: 'Snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm w/ hail',
  99: 'Severe thunderstorm',
};

export const describeCode = (code: number): string =>
  WEATHER_CODES[code] ?? 'Unknown conditions';

/** Loose category used to nudge AI track selection. */
export type WeatherMood =
  | 'sunny'
  | 'cloudy'
  | 'rainy'
  | 'snowy'
  | 'stormy'
  | 'foggy'
  | 'night';

export const moodFor = (reading: WeatherReading): WeatherMood => {
  if (!reading.isDay) return 'night';
  const c = reading.code;
  if (c === 0 || c === 1) return 'sunny';
  if (c === 2 || c === 3) return 'cloudy';
  if (c === 45 || c === 48) return 'foggy';
  if (c >= 95) return 'stormy';
  if (c >= 71 && c <= 86) return c >= 80 && c <= 82 ? 'rainy' : 'snowy';
  if (c >= 51 && c <= 67) return 'rainy';
  return 'cloudy';
};

/** A short string that reads naturally inside an LLM prompt. */
export const summarizeForPrompt = (reading: WeatherReading): string => {
  const place = reading.location.name + (reading.location.country ? `, ${reading.location.country}` : '');
  const temp = `${Math.round(reading.tempC)}°C`;
  const part = reading.isDay ? 'daytime' : 'night';
  return `${reading.description.toLowerCase()}, ${temp} (${part}) in ${place}`;
};

interface OpenMeteoCurrent {
  temperature_2m: number;
  apparent_temperature?: number;
  relative_humidity_2m?: number;
  wind_speed_10m: number;
  weather_code: number;
  is_day: number;
}

interface OpenMeteoForecastResponse {
  current?: OpenMeteoCurrent;
  timezone?: string;
  error?: boolean;
  reason?: string;
}

export const fetchWeather = async (location: WeatherLocation): Promise<WeatherReading> => {
  const params = new URLSearchParams({
    latitude: String(location.lat),
    longitude: String(location.lon),
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,is_day,weather_code,wind_speed_10m',
    wind_speed_unit: 'kmh',
    timezone: 'auto',
  });
  const res = await fetch(`${FORECAST_URL}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Open-Meteo returned ${res.status}`);
  }
  const json = (await res.json()) as OpenMeteoForecastResponse;
  if (json.error || !json.current) {
    throw new Error(json.reason ?? 'Open-Meteo returned no current data.');
  }
  const c = json.current;
  const fullLocation: WeatherLocation = { ...location, timezone: json.timezone ?? location.timezone };
  const reading: WeatherReading = {
    location: fullLocation,
    tempC: c.temperature_2m,
    feelsLikeC: c.apparent_temperature,
    windKph: c.wind_speed_10m,
    humidity: c.relative_humidity_2m,
    isDay: c.is_day === 1,
    code: c.weather_code,
    description: describeCode(c.weather_code),
    fetchedAt: Date.now(),
  };
  setStoredLocation(fullLocation);
  setStoredReading(reading);
  return reading;
};

interface GeocodeResult {
  name: string;
  country?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

interface GeocodeResponse {
  results?: GeocodeResult[];
}

export const geocodeCity = async (query: string): Promise<WeatherLocation[]> => {
  const params = new URLSearchParams({
    name: query,
    count: '5',
    language: 'en',
    format: 'json',
  });
  const res = await fetch(`${GEOCODE_URL}?${params.toString()}`);
  if (!res.ok) throw new Error(`Open-Meteo geocode returned ${res.status}`);
  const json = (await res.json()) as GeocodeResponse;
  return (json.results ?? []).map((r) => ({
    name: r.name,
    country: r.country,
    lat: r.latitude,
    lon: r.longitude,
    timezone: r.timezone,
    source: 'geocode' as const,
  }));
};

export const getBrowserLocation = (): Promise<WeatherLocation> =>
  new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation not available in this browser.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          name: 'Current location',
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          source: 'geolocation',
        }),
      (err) => reject(new Error(err.message || 'Geolocation request failed.')),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60_000 },
    );
  });

/**
 * Resolve the best available reading: cached if fresh, otherwise refetch
 * against the stored location. Returns null when no location has ever been
 * set and the browser denies / lacks geolocation.
 */
export const refreshIfStale = async (): Promise<WeatherReading | null> => {
  const cached = getStoredReading();
  if (cached && Date.now() - cached.fetchedAt < READING_TTL_MS) return cached;
  const location = getStoredLocation();
  if (!location) return cached;
  try {
    return await fetchWeather(location);
  } catch {
    return cached;
  }
};
