/**
 * Webhook Service
 *
 * Outgoing event webhooks. Users register HTTPS endpoints in the Neural Vault
 * and the app POSTs JSON when DJ events happen (track played, like/dislike,
 * recommendations received, etc.).
 *
 * Storage is local-only (mirrors apiKeyManager). Each webhook may have an
 * optional shared secret; when set, requests carry an `X-VDJ-Signature` header
 * containing the HMAC-SHA256 of the raw body, GitHub-style (`sha256=<hex>`).
 *
 * Delivery is fire-and-forget from the caller's perspective: `dispatch(...)`
 * returns immediately and the actual HTTP work runs in the background, with
 * retries on transient failures and a rolling delivery log surfaced in the
 * Vault UI.
 */

export const WEBHOOK_EVENTS = [
  'track.played',
  'track.paused',
  'track.liked',
  'track.disliked',
  'track.added_to_playlist',
  'track.deployed',
  'recommendations.received',
  'search.completed',
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export const EVENT_LABELS: Record<WebhookEvent, string> = {
  'track.played': 'Track played',
  'track.paused': 'Track paused',
  'track.liked': 'Track liked',
  'track.disliked': 'Track disliked',
  'track.added_to_playlist': 'Added to playlist',
  'track.deployed': 'Track deployed to deck',
  'recommendations.received': 'AI recommendations received',
  'search.completed': 'Search completed',
};

export interface WebhookConfig {
  id: string;
  url: string;
  label?: string;
  events: WebhookEvent[];
  enabled: boolean;
  /** Optional shared secret used to sign request bodies with HMAC-SHA256. */
  secret?: string;
  createdAt: number;
  lastDeliveryAt?: number;
  lastStatus?: number;
  lastError?: string;
  failureCount: number;
  successCount: number;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: WebhookEvent;
  url: string;
  timestamp: number;
  status?: number;
  ok: boolean;
  attempts: number;
  durationMs: number;
  error?: string;
}

const HOOKS_KEY = 'vdj.webhooks.v1';
const DELIVERIES_KEY = 'vdj.webhooks.deliveries.v1';
const MAX_DELIVERIES = 100;
const MAX_BODY_PREVIEW = 512;
const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [400, 1200, 3000];

type Listener = () => void;
const listeners = new Set<Listener>();
const notify = () => listeners.forEach((l) => l());

export const subscribeWebhooks = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const readHooks = (): WebhookConfig[] => {
  if (typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem(HOOKS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as WebhookConfig[]) : [];
  } catch {
    return [];
  }
};

const writeHooks = (hooks: WebhookConfig[]): void => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(HOOKS_KEY, JSON.stringify(hooks));
  notify();
};

const readDeliveries = (): WebhookDelivery[] => {
  if (typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem(DELIVERIES_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as WebhookDelivery[]) : [];
  } catch {
    return [];
  }
};

const writeDeliveries = (events: WebhookDelivery[]): void => {
  if (typeof localStorage === 'undefined') return;
  const trimmed = events.length > MAX_DELIVERIES ? events.slice(-MAX_DELIVERIES) : events;
  localStorage.setItem(DELIVERIES_KEY, JSON.stringify(trimmed));
  notify();
};

const recordDelivery = (delivery: WebhookDelivery): void => {
  writeDeliveries([...readDeliveries(), delivery]);
};

export const listWebhooks = (): WebhookConfig[] => readHooks();
export const listDeliveries = (): WebhookDelivery[] => readDeliveries();

export const clearDeliveries = (): void => writeDeliveries([]);

const newId = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const isValidHttpUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
};

export interface AddWebhookInput {
  url: string;
  label?: string;
  events: WebhookEvent[];
  secret?: string;
  enabled?: boolean;
}

export const addWebhook = (input: AddWebhookInput): WebhookConfig => {
  if (!isValidHttpUrl(input.url)) {
    throw new Error('Webhook URL must be a valid http(s) URL.');
  }
  if (!input.events.length) {
    throw new Error('Pick at least one event to subscribe to.');
  }
  const hook: WebhookConfig = {
    id: newId(),
    url: input.url.trim(),
    label: input.label?.trim() || undefined,
    events: [...input.events],
    enabled: input.enabled ?? true,
    secret: input.secret?.trim() || undefined,
    createdAt: Date.now(),
    failureCount: 0,
    successCount: 0,
  };
  writeHooks([...readHooks(), hook]);
  return hook;
};

export const updateWebhook = (id: string, patch: Partial<AddWebhookInput> & { enabled?: boolean }): void => {
  const hooks = readHooks();
  const idx = hooks.findIndex((h) => h.id === id);
  if (idx === -1) return;
  const next: WebhookConfig = { ...hooks[idx] };
  if (patch.url !== undefined) {
    if (!isValidHttpUrl(patch.url)) throw new Error('Webhook URL must be a valid http(s) URL.');
    next.url = patch.url.trim();
  }
  if (patch.label !== undefined) next.label = patch.label.trim() || undefined;
  if (patch.events !== undefined) {
    if (!patch.events.length) throw new Error('Pick at least one event to subscribe to.');
    next.events = [...patch.events];
  }
  if (patch.secret !== undefined) next.secret = patch.secret.trim() || undefined;
  if (patch.enabled !== undefined) next.enabled = patch.enabled;
  hooks[idx] = next;
  writeHooks(hooks);
};

export const removeWebhook = (id: string): void => {
  writeHooks(readHooks().filter((h) => h.id !== id));
};

export const clearAllWebhooks = (): void => writeHooks([]);

const updateHookStats = (id: string, ok: boolean, status: number | undefined, error?: string): void => {
  const hooks = readHooks();
  const idx = hooks.findIndex((h) => h.id === id);
  if (idx === -1) return;
  const next: WebhookConfig = { ...hooks[idx] };
  next.lastDeliveryAt = Date.now();
  next.lastStatus = status;
  next.lastError = ok ? undefined : error;
  if (ok) next.successCount += 1;
  else next.failureCount += 1;
  hooks[idx] = next;
  writeHooks(hooks);
};

const toHex = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, '0');
  }
  return out;
};

const sign = async (body: string, secret: string): Promise<string> => {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    // Browser does not expose SubtleCrypto (e.g. http context). Skip signing.
    return '';
  }
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(body));
  return `sha256=${toHex(sig)}`;
};

export interface WebhookEnvelope<T = unknown> {
  event: WebhookEvent;
  occurredAt: string;
  source: 'virtualdj.ai';
  data: T;
}

const buildEnvelope = <T>(event: WebhookEvent, data: T): WebhookEnvelope<T> => ({
  event,
  occurredAt: new Date().toISOString(),
  source: 'virtualdj.ai',
  data,
});

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const deliverOnce = async (
  hook: WebhookConfig,
  body: string,
  event: WebhookEvent,
  deliveryId: string,
): Promise<{ ok: boolean; status?: number; error?: string }> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-VDJ-Event': event,
    'X-VDJ-Delivery': deliveryId,
  };
  if (hook.secret) {
    const signature = await sign(body, hook.secret);
    if (signature) headers['X-VDJ-Signature'] = signature;
  }
  try {
    const res = await fetch(hook.url, {
      method: 'POST',
      headers,
      body,
      // Don't send cookies/credentials cross-origin; webhooks rely on the
      // shared secret signature instead.
      credentials: 'omit',
      keepalive: true,
      mode: 'cors',
    });
    if (!res.ok) {
      let detail = `HTTP ${res.status}`;
      try {
        const text = await res.text();
        if (text) detail += ` — ${text.slice(0, MAX_BODY_PREVIEW)}`;
      } catch {
        /* ignore body read errors */
      }
      return { ok: false, status: res.status, error: detail };
    }
    return { ok: true, status: res.status };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? String(err) };
  }
};

const isRetryableStatus = (status?: number): boolean => {
  if (status === undefined) return true; // network failure
  if (status === 408 || status === 425 || status === 429) return true;
  return status >= 500 && status < 600;
};

const deliverToHook = async <T>(
  hook: WebhookConfig,
  event: WebhookEvent,
  data: T,
): Promise<void> => {
  const envelope = buildEnvelope(event, data);
  const body = JSON.stringify(envelope);
  const deliveryId = newId();
  const startedAt = Date.now();
  let attempts = 0;
  let result: { ok: boolean; status?: number; error?: string } = { ok: false };

  while (attempts < MAX_RETRIES) {
    attempts += 1;
    result = await deliverOnce(hook, body, event, deliveryId);
    if (result.ok || !isRetryableStatus(result.status)) break;
    if (attempts < MAX_RETRIES) {
      await sleep(RETRY_DELAYS_MS[attempts - 1] ?? 3000);
    }
  }

  recordDelivery({
    id: deliveryId,
    webhookId: hook.id,
    event,
    url: hook.url,
    timestamp: startedAt,
    status: result.status,
    ok: result.ok,
    attempts,
    durationMs: Date.now() - startedAt,
    error: result.ok ? undefined : result.error,
  });
  updateHookStats(hook.id, result.ok, result.status, result.error);
};

/**
 * Fan-out an event to every enabled webhook subscribed to it. Returns
 * immediately; HTTP work continues in the background. Safe to call from any
 * UI handler — failures never throw.
 */
export const dispatch = <T>(event: WebhookEvent, data: T): void => {
  const hooks = readHooks().filter((h) => h.enabled && h.events.includes(event));
  if (hooks.length === 0) return;
  for (const hook of hooks) {
    // Intentionally not awaited.
    void deliverToHook(hook, event, data).catch(() => {
      /* deliverToHook records its own errors */
    });
  }
};

/**
 * Send a synthetic `recommendations.received` ping to a single webhook so the
 * user can verify the endpoint accepts the payload. Returns the delivery
 * record once finished.
 */
export const testWebhook = async (id: string): Promise<WebhookDelivery | null> => {
  const hook = readHooks().find((h) => h.id === id);
  if (!hook) return null;
  const data = {
    test: true,
    message: 'VirtualDJ.AI webhook test ping',
  };
  await deliverToHook(hook, 'recommendations.received', data);
  return [...readDeliveries()].reverse().find((d) => d.webhookId === id) ?? null;
};
