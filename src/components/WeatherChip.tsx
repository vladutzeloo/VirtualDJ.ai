import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sun,
  Moon,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudFog,
  CloudLightning,
  Wind,
  MapPin,
  Search,
  X,
  Loader2,
  RefreshCcw,
} from 'lucide-react';
import {
  WeatherReading,
  WeatherLocation,
  fetchWeather,
  geocodeCity,
  getBrowserLocation,
  getStoredLocation,
  getStoredReading,
  moodFor,
  refreshIfStale,
  subscribeWeather,
} from '../services/weatherService';

const REFRESH_INTERVAL_MS = 15 * 60 * 1000;

interface WeatherChipProps {
  theme: 'dark' | 'light';
  onReading?: (reading: WeatherReading | null) => void;
}

export const WeatherChip = ({ theme, onReading }: WeatherChipProps) => {
  const [reading, setReading] = useState<WeatherReading | null>(() => getStoredReading());
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<WeatherLocation[]>([]);
  const [searching, setSearching] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  // Bootstrap: refresh stale reading on mount, then on an interval.
  useEffect(() => {
    let cancelled = false;
    refreshIfStale().then((r) => {
      if (!cancelled && r) setReading(r);
    });
    const interval = window.setInterval(() => {
      refreshIfStale().then((r) => {
        if (!cancelled && r) setReading(r);
      });
    }, REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const unsub = subscribeWeather(() => setReading(getStoredReading()));
    return unsub;
  }, []);

  useEffect(() => {
    onReading?.(reading);
  }, [reading, onReading]);

  // Close popover on outside click.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!popoverRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [open]);

  const useCurrentLocation = async () => {
    setError(null);
    setLoading(true);
    try {
      const loc = await getBrowserLocation();
      const r = await fetchWeather(loc);
      setReading(r);
    } catch (e: any) {
      setError(e?.message ?? 'Could not get current location.');
    } finally {
      setLoading(false);
    }
  };

  const runSearch = async (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }
    setSearching(true);
    setError(null);
    try {
      const hits = await geocodeCity(trimmed);
      setResults(hits);
    } catch (e: any) {
      setError(e?.message ?? 'Search failed.');
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Debounce city search.
  useEffect(() => {
    const handle = window.setTimeout(() => {
      void runSearch(query);
    }, 300);
    return () => window.clearTimeout(handle);
  }, [query]);

  const pickLocation = async (loc: WeatherLocation) => {
    setError(null);
    setLoading(true);
    try {
      const r = await fetchWeather(loc);
      setReading(r);
      setOpen(false);
      setQuery('');
      setResults([]);
    } catch (e: any) {
      setError(e?.message ?? 'Could not load weather for that location.');
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    const loc = reading?.location ?? getStoredLocation();
    if (!loc) return;
    setLoading(true);
    try {
      const r = await fetchWeather(loc);
      setReading(r);
    } catch (e: any) {
      setError(e?.message ?? 'Refresh failed.');
    } finally {
      setLoading(false);
    }
  };

  const Icon = useMemo(() => (reading ? iconFor(reading) : Cloud), [reading]);
  const accent = reading ? accentFor(reading) : 'text-slate-400';

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 px-3 h-8 rounded-full border transition ${
          theme === 'dark'
            ? 'bg-white/[0.04] border-white/10 hover:bg-white/[0.08]'
            : 'bg-slate-100 border-slate-200 hover:bg-slate-200'
        }`}
        title={reading ? `${reading.description} in ${reading.location.name}` : 'Set location for weather context'}
      >
        <Icon className={`w-3.5 h-3.5 ${accent}`} />
        {reading ? (
          <span className="text-[10px] font-mono font-black tracking-widest text-slate-200">
            {Math.round(reading.tempC)}°
          </span>
        ) : (
          <span className="text-[9px] font-mono font-black tracking-widest uppercase text-slate-500">
            Weather
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={popoverRef}
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className={`absolute right-0 mt-2 w-72 rounded-2xl border shadow-2xl z-[120] p-4 ${
              theme === 'dark'
                ? 'bg-[#0A0C10] border-white/10 text-white'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono font-black uppercase tracking-widest text-slate-500">
                Ambient Context
              </span>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-md text-slate-500 hover:bg-white/5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {reading && (
              <div className="flex items-center gap-3 pb-3 mb-3 border-b border-white/5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white/[0.04] ${accent}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-display font-black tracking-tight truncate">
                    {Math.round(reading.tempC)}° · {reading.description}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 truncate">
                    {reading.location.name}
                    {reading.location.country ? `, ${reading.location.country}` : ''}
                    {' · '}
                    <Wind className="inline w-2.5 h-2.5 mx-0.5" />
                    {Math.round(reading.windKph)} km/h
                  </div>
                </div>
                <button
                  onClick={refresh}
                  className="p-2 rounded-md text-slate-500 hover:text-jarvis-accent-cyan hover:bg-white/5"
                  title="Refresh"
                >
                  <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            )}

            <button
              onClick={useCurrentLocation}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 h-9 rounded-lg bg-jarvis-accent-cyan/10 border border-jarvis-accent-cyan/30 text-jarvis-accent-cyan text-[10px] font-mono font-black uppercase tracking-widest disabled:opacity-40"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
              Use current location
            </button>

            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search city…"
                className={`w-full h-9 pl-9 pr-3 rounded-lg border bg-transparent font-mono text-xs focus:outline-none focus:ring-2 ${
                  theme === 'dark'
                    ? 'border-white/10 text-white focus:ring-jarvis-accent-cyan/40'
                    : 'border-slate-200 text-slate-900 focus:ring-jarvis-accent-cyan/30'
                }`}
              />
            </div>

            {searching && (
              <div className="mt-2 text-[10px] font-mono text-slate-500 flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin" /> Searching…
              </div>
            )}

            {results.length > 0 && (
              <div className="mt-2 max-h-44 overflow-y-auto custom-scrollbar space-y-1">
                {results.map((r) => (
                  <button
                    key={`${r.lat}-${r.lon}`}
                    onClick={() => pickLocation(r)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-[11px] font-mono text-slate-200 truncate">{r.name}</div>
                      <div className="text-[9px] font-mono text-slate-500 truncate">
                        {r.country ?? '—'} · {r.lat.toFixed(2)}, {r.lon.toFixed(2)}
                      </div>
                    </div>
                    <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {error && (
              <p className="mt-2 text-[10px] font-mono text-red-400">{error}</p>
            )}

            <p className="mt-3 text-[9px] font-mono text-slate-600 leading-relaxed">
              Powered by Open-Meteo. Stored locally, used to nudge AI track recommendations toward the
              current vibe ({reading ? moodFor(reading) : '—'}).
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const iconFor = (reading: WeatherReading) => {
  if (!reading.isDay) return Moon;
  const c = reading.code;
  if (c === 0 || c === 1) return Sun;
  if (c === 2 || c === 3) return Cloud;
  if (c === 45 || c === 48) return CloudFog;
  if (c >= 95) return CloudLightning;
  if (c >= 71 && c <= 86 && !(c >= 80 && c <= 82)) return CloudSnow;
  if ((c >= 51 && c <= 67) || (c >= 80 && c <= 82)) return CloudRain;
  return Cloud;
};

const accentFor = (reading: WeatherReading): string => {
  if (!reading.isDay) return 'text-indigo-300';
  switch (moodFor(reading)) {
    case 'sunny':
      return 'text-amber-300';
    case 'cloudy':
      return 'text-slate-300';
    case 'rainy':
      return 'text-sky-300';
    case 'snowy':
      return 'text-cyan-200';
    case 'stormy':
      return 'text-fuchsia-300';
    case 'foggy':
      return 'text-slate-400';
    default:
      return 'text-slate-300';
  }
};
