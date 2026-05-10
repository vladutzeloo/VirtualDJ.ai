/**
 * API Key Manager
 *
 * Stores provider API keys client-side, lightly obfuscated (XOR + base64) using a
 * device-bound salt. This is NOT a security boundary — the real protection is the
 * WebAuthn-gated Vault UI in Vault.tsx. The encoding only prevents a casual peek
 * in localStorage from leaking secrets.
 */

export type ProviderId = 'gemini' | 'anthropic' | 'kimi' | 'openai' | 'nvidia';

export interface ProviderMeta {
  id: ProviderId;
  name: string;
  shortName: string;
  envVar: string;
  consoleUrl: string;
  keyPrefix?: string;
  description: string;
}

export const PROVIDERS: Record<ProviderId, ProviderMeta> = {
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    shortName: 'Gemini',
    envVar: 'GEMINI_API_KEY',
    consoleUrl: 'https://aistudio.google.com/app/apikey',
    keyPrefix: 'AIza',
    description: 'Music discovery, search grounding, and album art generation.',
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic Claude',
    shortName: 'Claude',
    envVar: 'ANTHROPIC_API_KEY',
    consoleUrl: 'https://console.anthropic.com/settings/keys',
    keyPrefix: 'sk-ant-',
    description: 'DJ skills: setlist curator, crowd reader, mix coach.',
  },
  kimi: {
    id: 'kimi',
    name: 'Moonshot Kimi',
    shortName: 'Kimi',
    envVar: 'KIMI_API_KEY',
    consoleUrl: 'https://platform.moonshot.ai/console/api-keys',
    keyPrefix: 'sk-',
    description: 'OpenAI-compatible Moonshot endpoint for long-context lyrics analysis.',
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    shortName: 'OpenAI',
    envVar: 'OPENAI_API_KEY',
    consoleUrl: 'https://platform.openai.com/api-keys',
    keyPrefix: 'sk-',
    description: 'Optional drop-in for Whisper transcription and GPT mixing tips.',
  },
  nvidia: {
    id: 'nvidia',
    name: 'NVIDIA NIM',
    shortName: 'NVIDIA',
    envVar: 'NVIDIA_API_KEY',
    consoleUrl: 'https://build.nvidia.com/explore/discover',
    keyPrefix: 'nvapi-',
    description: 'NVIDIA NIM inference (Llama, Nemotron, Mixtral) via OpenAI-compatible endpoint.',
  },
};

const STORAGE_KEY = 'vdj.vault.keys.v1';
const SALT_KEY = 'vdj.vault.salt.v1';

const getSalt = (): string => {
  if (typeof localStorage === 'undefined') return 'static-fallback-salt';
  let salt = localStorage.getItem(SALT_KEY);
  if (!salt) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    salt = btoa(String.fromCharCode(...bytes));
    localStorage.setItem(SALT_KEY, salt);
  }
  return salt;
};

const xorEncode = (plaintext: string, salt: string): string => {
  let out = '';
  for (let i = 0; i < plaintext.length; i++) {
    out += String.fromCharCode(plaintext.charCodeAt(i) ^ salt.charCodeAt(i % salt.length));
  }
  return btoa(unescape(encodeURIComponent(out)));
};

const xorDecode = (encoded: string, salt: string): string => {
  try {
    const raw = decodeURIComponent(escape(atob(encoded)));
    let out = '';
    for (let i = 0; i < raw.length; i++) {
      out += String.fromCharCode(raw.charCodeAt(i) ^ salt.charCodeAt(i % salt.length));
    }
    return out;
  } catch {
    return '';
  }
};

export interface StoredKey {
  provider: ProviderId;
  ciphertext: string;
  addedAt: number;
  lastUsedAt?: number;
  label?: string;
}

type KeyMap = Partial<Record<ProviderId, StoredKey>>;

const readAll = (): KeyMap => {
  if (typeof localStorage === 'undefined') return {};
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as KeyMap;
  } catch {
    return {};
  }
};

const writeAll = (map: KeyMap): void => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  notify();
};

type Listener = () => void;
const listeners = new Set<Listener>();
const notify = () => listeners.forEach((l) => l());

export const subscribe = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const envFallback = (provider: ProviderId): string | undefined => {
  if (typeof process === 'undefined' || !process.env) return undefined;
  const key = process.env[PROVIDERS[provider].envVar];
  return key && key !== `MY_${PROVIDERS[provider].envVar}` ? key : undefined;
};

export const getApiKey = (provider: ProviderId): string | undefined => {
  const stored = readAll()[provider];
  if (stored?.ciphertext) {
    const decoded = xorDecode(stored.ciphertext, getSalt());
    if (decoded) return decoded;
  }
  return envFallback(provider);
};

export const hasApiKey = (provider: ProviderId): boolean => Boolean(getApiKey(provider));

export const getKeySource = (provider: ProviderId): 'vault' | 'env' | 'missing' => {
  if (readAll()[provider]?.ciphertext) return 'vault';
  if (envFallback(provider)) return 'env';
  return 'missing';
};

export const setApiKey = (provider: ProviderId, key: string, label?: string): void => {
  const trimmed = key.trim();
  if (!trimmed) return;
  const map = readAll();
  map[provider] = {
    provider,
    ciphertext: xorEncode(trimmed, getSalt()),
    addedAt: map[provider]?.addedAt ?? Date.now(),
    lastUsedAt: map[provider]?.lastUsedAt,
    label,
  };
  writeAll(map);
};

export const removeApiKey = (provider: ProviderId): void => {
  const map = readAll();
  delete map[provider];
  writeAll(map);
};

export const markKeyUsed = (provider: ProviderId): void => {
  const map = readAll();
  if (!map[provider]) return;
  map[provider]!.lastUsedAt = Date.now();
  writeAll(map);
};

export interface KeyPreview {
  provider: ProviderId;
  meta: ProviderMeta;
  source: 'vault' | 'env' | 'missing';
  masked: string;
  fingerprint: string;
  addedAt?: number;
  lastUsedAt?: number;
  label?: string;
}

const fingerprint = (key: string): string => {
  // Short non-reversible visual fingerprint so users can verify which key is loaded
  // without revealing the full secret.
  let h = 5381;
  for (let i = 0; i < key.length; i++) h = ((h << 5) + h + key.charCodeAt(i)) | 0;
  const positive = (h >>> 0).toString(16).padStart(8, '0');
  return positive.slice(0, 4) + '·' + positive.slice(4, 8);
};

const mask = (key: string): string => {
  if (!key) return '';
  if (key.length <= 8) return '••••' + key.slice(-2);
  return key.slice(0, 4) + '••••••••••••' + key.slice(-4);
};

export const previewKey = (provider: ProviderId): KeyPreview => {
  const meta = PROVIDERS[provider];
  const source = getKeySource(provider);
  const key = getApiKey(provider) ?? '';
  const stored = readAll()[provider];
  return {
    provider,
    meta,
    source,
    masked: key ? mask(key) : '',
    fingerprint: key ? fingerprint(key) : '',
    addedAt: stored?.addedAt,
    lastUsedAt: stored?.lastUsedAt,
    label: stored?.label,
  };
};

export const previewAll = (): KeyPreview[] =>
  (Object.keys(PROVIDERS) as ProviderId[]).map(previewKey);

export interface ImportReport {
  imported: ProviderId[];
  skipped: { provider: string; reason: string }[];
}

/**
 * Bulk import keys from a .env-style blob. Lines look like
 *   GEMINI_API_KEY=AIza...
 *   ANTHROPIC_API_KEY="sk-ant-..."
 * Quoted values, comments (# ...), and blank lines are tolerated.
 */
export const importFromEnvBlob = (blob: string): ImportReport => {
  const report: ImportReport = { imported: [], skipped: [] };
  const lines = blob.split(/\r?\n/);
  const envToProvider = new Map<string, ProviderId>(
    (Object.keys(PROVIDERS) as ProviderId[]).map((p) => [PROVIDERS[p].envVar, p]),
  );

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const name = line.slice(0, eq).trim().replace(/^export\s+/, '');
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!value || /^MY_/.test(value)) continue;

    const provider = envToProvider.get(name);
    if (!provider) {
      report.skipped.push({ provider: name, reason: 'Unknown variable' });
      continue;
    }
    setApiKey(provider, value, 'imported');
    report.imported.push(provider);
  }
  return report;
};

export const exportAsEnvBlob = (): string => {
  const lines: string[] = [];
  for (const provider of Object.keys(PROVIDERS) as ProviderId[]) {
    const key = getApiKey(provider);
    if (!key) continue;
    lines.push(`${PROVIDERS[provider].envVar}="${key}"`);
  }
  return lines.join('\n');
};

export const clearAllKeys = (): void => {
  writeAll({});
};
