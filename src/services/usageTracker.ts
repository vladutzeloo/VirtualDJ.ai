/**
 * Usage Tracker
 *
 * Records token consumption per provider/model and computes running cost.
 * Pricing is in USD per 1,000,000 tokens. Update the table when providers
 * change their published rates.
 */

import type { ProviderId } from './apiKeyManager';

export interface ModelPricing {
  provider: ProviderId;
  model: string;
  inputPerMTok: number;
  outputPerMTok: number;
  imagePerCall?: number;
}

// Pricing snapshot — keep public USD/MTok rates here. Where vendor rates are
// not yet published, conservative placeholders are used and clearly labelled.
export const MODEL_PRICING: Record<string, ModelPricing> = {
  // Google Gemini
  'gemini-3-flash-preview': { provider: 'gemini', model: 'gemini-3-flash-preview', inputPerMTok: 0.3, outputPerMTok: 2.5 },
  'gemini-2.5-flash-image': { provider: 'gemini', model: 'gemini-2.5-flash-image', inputPerMTok: 0.3, outputPerMTok: 2.5, imagePerCall: 0.039 },
  'gemini-2.5-flash': { provider: 'gemini', model: 'gemini-2.5-flash', inputPerMTok: 0.3, outputPerMTok: 2.5 },
  'gemini-2.5-pro': { provider: 'gemini', model: 'gemini-2.5-pro', inputPerMTok: 1.25, outputPerMTok: 10 },

  // Anthropic Claude
  'claude-opus-4-7': { provider: 'anthropic', model: 'claude-opus-4-7', inputPerMTok: 15, outputPerMTok: 75 },
  'claude-sonnet-4-6': { provider: 'anthropic', model: 'claude-sonnet-4-6', inputPerMTok: 3, outputPerMTok: 15 },
  'claude-haiku-4-5': { provider: 'anthropic', model: 'claude-haiku-4-5', inputPerMTok: 1, outputPerMTok: 5 },

  // Moonshot Kimi
  'moonshot-v1-128k': { provider: 'kimi', model: 'moonshot-v1-128k', inputPerMTok: 2, outputPerMTok: 5 },
  'moonshot-v1-32k': { provider: 'kimi', model: 'moonshot-v1-32k', inputPerMTok: 1.2, outputPerMTok: 3 },

  // OpenAI
  'gpt-4o': { provider: 'openai', model: 'gpt-4o', inputPerMTok: 2.5, outputPerMTok: 10 },
  'gpt-4o-mini': { provider: 'openai', model: 'gpt-4o-mini', inputPerMTok: 0.15, outputPerMTok: 0.6 },
  'whisper-1': { provider: 'openai', model: 'whisper-1', inputPerMTok: 0, outputPerMTok: 0 },
};

export const lookupPricing = (provider: ProviderId, model: string): ModelPricing => {
  const exact = MODEL_PRICING[model];
  if (exact) return exact;
  // Fallback: pick the cheapest model from the provider so a missing rate
  // doesn't produce a wildly inflated estimate.
  const fallback = Object.values(MODEL_PRICING)
    .filter((p) => p.provider === provider)
    .sort((a, b) => a.inputPerMTok - b.inputPerMTok)[0];
  return fallback ?? { provider, model, inputPerMTok: 0, outputPerMTok: 0 };
};

export interface UsageEvent {
  id: string;
  timestamp: number;
  provider: ProviderId;
  model: string;
  feature: string;
  inputTokens: number;
  outputTokens: number;
  imageCalls?: number;
  costUsd: number;
}

const STORAGE_KEY = 'vdj.vault.usage.v1';
const MAX_EVENTS = 500;

type Listener = () => void;
const listeners = new Set<Listener>();
const notify = () => listeners.forEach((l) => l());

export const subscribeUsage = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const readEvents = (): UsageEvent[] => {
  if (typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as UsageEvent[]) : [];
  } catch {
    return [];
  }
};

const writeEvents = (events: UsageEvent[]): void => {
  if (typeof localStorage === 'undefined') return;
  const trimmed = events.length > MAX_EVENTS ? events.slice(-MAX_EVENTS) : events;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  notify();
};

export interface RecordParams {
  provider: ProviderId;
  model: string;
  feature: string;
  inputTokens?: number;
  outputTokens?: number;
  imageCalls?: number;
}

const estimateTokens = (text: string): number => Math.ceil(text.length / 4);

export const recordUsage = (params: RecordParams): UsageEvent => {
  const pricing = lookupPricing(params.provider, params.model);
  const inputTokens = Math.max(0, params.inputTokens ?? 0);
  const outputTokens = Math.max(0, params.outputTokens ?? 0);
  const imageCalls = params.imageCalls ?? 0;
  const costUsd =
    (inputTokens / 1_000_000) * pricing.inputPerMTok +
    (outputTokens / 1_000_000) * pricing.outputPerMTok +
    imageCalls * (pricing.imagePerCall ?? 0);

  const event: UsageEvent = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    provider: params.provider,
    model: params.model,
    feature: params.feature,
    inputTokens,
    outputTokens,
    imageCalls,
    costUsd,
  };

  writeEvents([...readEvents(), event]);
  return event;
};

export const recordUsageFromText = (
  base: Omit<RecordParams, 'inputTokens' | 'outputTokens'>,
  inputText: string,
  outputText: string,
): UsageEvent =>
  recordUsage({
    ...base,
    inputTokens: estimateTokens(inputText),
    outputTokens: estimateTokens(outputText),
  });

export interface ProviderTotals {
  provider: ProviderId;
  inputTokens: number;
  outputTokens: number;
  imageCalls: number;
  calls: number;
  costUsd: number;
}

export interface UsageSummary {
  events: UsageEvent[];
  totalCostUsd: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalImageCalls: number;
  byProvider: Record<ProviderId, ProviderTotals>;
}

const emptyTotals = (provider: ProviderId): ProviderTotals => ({
  provider,
  inputTokens: 0,
  outputTokens: 0,
  imageCalls: 0,
  calls: 0,
  costUsd: 0,
});

export const getUsage = (): UsageSummary => {
  const events = readEvents();
  const summary: UsageSummary = {
    events,
    totalCostUsd: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalImageCalls: 0,
    byProvider: {
      gemini: emptyTotals('gemini'),
      anthropic: emptyTotals('anthropic'),
      kimi: emptyTotals('kimi'),
      openai: emptyTotals('openai'),
    },
  };

  for (const e of events) {
    summary.totalCostUsd += e.costUsd;
    summary.totalInputTokens += e.inputTokens;
    summary.totalOutputTokens += e.outputTokens;
    summary.totalImageCalls += e.imageCalls ?? 0;
    const bucket = summary.byProvider[e.provider];
    if (!bucket) continue;
    bucket.calls += 1;
    bucket.inputTokens += e.inputTokens;
    bucket.outputTokens += e.outputTokens;
    bucket.imageCalls += e.imageCalls ?? 0;
    bucket.costUsd += e.costUsd;
  }
  return summary;
};

export const clearUsage = (): void => writeEvents([]);

export const formatUsd = (n: number): string => {
  if (n === 0) return '$0.00';
  if (n < 0.01) return `$${n.toFixed(5)}`;
  if (n < 1) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(2)}`;
};

export const formatTokens = (n: number): string => {
  if (n < 1_000) return `${n}`;
  if (n < 1_000_000) return `${(n / 1_000).toFixed(1)}k`;
  return `${(n / 1_000_000).toFixed(2)}M`;
};
