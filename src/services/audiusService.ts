// Audius — free, open-source music streaming. Public discovery API, no auth required.
// Docs: https://docs.audius.org/api/
//
// Flow:
//   1. Bootstrap from https://api.audius.co to find healthy discovery providers.
//   2. Hit any provider's /v1/tracks/search?query=...&app_name=... for results.
//   3. Stream from /v1/tracks/{id}/stream?app_name=... (302 → CDN, CORS-friendly).

const APP_NAME = 'VirtualDJai';
const BOOTSTRAP_URL = 'https://api.audius.co';
const FALLBACK_HOST = 'https://discoveryprovider.audius.co';

let cachedHosts: string[] | null = null;

async function getHosts(): Promise<string[]> {
  if (cachedHosts && cachedHosts.length) return cachedHosts;
  try {
    const res = await fetch(BOOTSTRAP_URL, { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json?.data) && json.data.length) {
        cachedHosts = json.data.filter((h: unknown): h is string => typeof h === 'string');
        if (cachedHosts!.length) return cachedHosts!;
      }
    }
  } catch {
    // fall through to default host
  }
  cachedHosts = [FALLBACK_HOST];
  return cachedHosts;
}

async function audiusFetch<T = any>(path: string): Promise<T | null> {
  const hosts = await getHosts();
  let lastErr: unknown;
  for (const host of hosts.slice(0, 3)) {
    const sep = path.includes('?') ? '&' : '?';
    const url = `${host}${path}${sep}app_name=${APP_NAME}`;
    try {
      const res = await fetch(url);
      if (res.ok) return (await res.json()) as T;
      lastErr = new Error(`HTTP ${res.status} from ${host}`);
    } catch (err) {
      lastErr = err;
    }
  }
  if (lastErr) console.warn('Audius request failed:', lastErr);
  return null;
}

export interface AudiusTrack {
  id: string;
  title: string;
  artist: string;
  genre: string;
  tags: string[];
  durationSec: number;
  streamUrl: string;
  artworkUrl?: string;
  permalink?: string;
  playCount?: number;
}

function pickArtwork(artwork: Record<string, string> | null | undefined): string | undefined {
  if (!artwork) return undefined;
  return artwork['480x480'] || artwork['1000x1000'] || artwork['150x150'];
}

function tagsFromString(raw: unknown): string[] {
  if (typeof raw !== 'string' || !raw.trim()) return [];
  return raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .slice(0, 6);
}

async function buildStreamUrl(id: string): Promise<string> {
  const hosts = await getHosts();
  const host = hosts[0] || FALLBACK_HOST;
  return `${host}/v1/tracks/${id}/stream?app_name=${APP_NAME}`;
}

export async function searchAudiusTracks(query: string, limit = 12): Promise<AudiusTrack[]> {
  const q = query.trim();
  if (!q) return [];
  const data = await audiusFetch<{ data: any[] }>(`/v1/tracks/search?query=${encodeURIComponent(q)}&limit=${limit}`);
  const items = Array.isArray(data?.data) ? data!.data : [];
  const hosts = await getHosts();
  const host = hosts[0] || FALLBACK_HOST;
  return items
    .filter(t => t && t.id)
    .slice(0, limit)
    .map((t: any): AudiusTrack => ({
      id: String(t.id),
      title: String(t.title ?? 'Untitled'),
      artist: String(t.user?.name ?? t.user?.handle ?? 'Unknown Artist'),
      genre: String(t.genre ?? 'Unknown'),
      tags: tagsFromString(t.tags),
      durationSec: typeof t.duration === 'number' ? t.duration : 0,
      streamUrl: `${host}/v1/tracks/${t.id}/stream?app_name=${APP_NAME}`,
      artworkUrl: pickArtwork(t.artwork),
      permalink: typeof t.permalink === 'string' ? `https://audius.co${t.permalink}` : undefined,
      playCount: typeof t.play_count === 'number' ? t.play_count : undefined,
    }));
}

export async function getAudiusStreamUrl(trackId: string): Promise<string> {
  return buildStreamUrl(trackId);
}

// Surface the API as available even before any search runs (used for UI badges).
export const AUDIUS_SOURCE_LABEL = 'Audius';
