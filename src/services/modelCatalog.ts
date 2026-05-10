/**
 * Model Catalog & Selector
 *
 * Static catalog of LLM models available per provider (id, label, context window,
 * capability hints) plus a small persistent store for the user's preferred model
 * per provider. Services read the preference via `getPreferredModel(provider)`
 * so the choice surfaces in `claudeAgentService`, `nvidiaService`, etc.
 *
 * Pricing for each model id is owned by `usageTracker.MODEL_PRICING` — keep the
 * two in sync when you add a model here.
 */

import type { ProviderId } from './apiKeyManager';

export type ModelCapability = 'chat' | 'json' | 'vision' | 'long-context' | 'reasoning' | 'image-gen';

export interface ModelEntry {
  id: string;
  provider: ProviderId;
  label: string;
  description: string;
  contextWindow: number;
  capabilities: ModelCapability[];
  /** True for the suggested default if the user hasn't picked one yet. */
  default?: boolean;
}

export const MODEL_CATALOG: ModelEntry[] = [
  // ─── Google Gemini ──────────────────────────────────────────────────────
  {
    id: 'gemini-3-flash-preview',
    provider: 'gemini',
    label: 'Gemini 3 Flash (preview)',
    description: 'Fastest Gemini tier with Google Search grounding — used for live track discovery.',
    contextWindow: 1_000_000,
    capabilities: ['chat', 'json', 'vision', 'long-context'],
    default: true,
  },
  {
    id: 'gemini-2.5-flash',
    provider: 'gemini',
    label: 'Gemini 2.5 Flash',
    description: 'Stable Flash tier — good fallback when 3 preview is unavailable.',
    contextWindow: 1_000_000,
    capabilities: ['chat', 'json', 'vision', 'long-context'],
  },
  {
    id: 'gemini-2.5-pro',
    provider: 'gemini',
    label: 'Gemini 2.5 Pro',
    description: 'Higher-quality reasoning. Slower and more expensive.',
    contextWindow: 2_000_000,
    capabilities: ['chat', 'json', 'vision', 'long-context', 'reasoning'],
  },
  {
    id: 'gemini-2.5-flash-image',
    provider: 'gemini',
    label: 'Gemini 2.5 Flash Image',
    description: 'Image generation endpoint (album art / avatars).',
    contextWindow: 32_000,
    capabilities: ['image-gen'],
  },

  // ─── Anthropic Claude ───────────────────────────────────────────────────
  {
    id: 'claude-sonnet-4-6',
    provider: 'anthropic',
    label: 'Claude Sonnet 4.6',
    description: 'Default for DJ skills — balanced quality and cost.',
    contextWindow: 200_000,
    capabilities: ['chat', 'json', 'vision', 'long-context', 'reasoning'],
    default: true,
  },
  {
    id: 'claude-opus-4-7',
    provider: 'anthropic',
    label: 'Claude Opus 4.7',
    description: 'Highest quality — use for crowd reads and tricky setlist work.',
    contextWindow: 200_000,
    capabilities: ['chat', 'json', 'vision', 'long-context', 'reasoning'],
  },
  {
    id: 'claude-haiku-4-5',
    provider: 'anthropic',
    label: 'Claude Haiku 4.5',
    description: 'Cheapest, fastest Claude tier — good for high-frequency hints.',
    contextWindow: 200_000,
    capabilities: ['chat', 'json', 'vision'],
  },

  // ─── Moonshot Kimi ──────────────────────────────────────────────────────
  {
    id: 'moonshot-v1-128k',
    provider: 'kimi',
    label: 'Kimi 128k',
    description: 'Long-context Moonshot for lyrics analysis or full-set planning.',
    contextWindow: 128_000,
    capabilities: ['chat', 'json', 'long-context'],
    default: true,
  },
  {
    id: 'moonshot-v1-32k',
    provider: 'kimi',
    label: 'Kimi 32k',
    description: 'Smaller context window, lower cost.',
    contextWindow: 32_000,
    capabilities: ['chat', 'json'],
  },

  // ─── OpenAI ─────────────────────────────────────────────────────────────
  {
    id: 'gpt-4o',
    provider: 'openai',
    label: 'GPT-4o',
    description: 'OpenAI flagship — multimodal chat.',
    contextWindow: 128_000,
    capabilities: ['chat', 'json', 'vision', 'reasoning'],
    default: true,
  },
  {
    id: 'gpt-4o-mini',
    provider: 'openai',
    label: 'GPT-4o mini',
    description: 'Cheap, fast OpenAI tier.',
    contextWindow: 128_000,
    capabilities: ['chat', 'json', 'vision'],
  },

  // ─── NVIDIA NIM ─────────────────────────────────────────────────────────
  {
    id: 'meta/llama-3.1-70b-instruct',
    provider: 'nvidia',
    label: 'Llama 3.1 70B Instruct',
    description: 'Default NVIDIA NIM model — solid general chat / JSON.',
    contextWindow: 128_000,
    capabilities: ['chat', 'json', 'long-context'],
    default: true,
  },
  {
    id: 'meta/llama-3.1-405b-instruct',
    provider: 'nvidia',
    label: 'Llama 3.1 405B Instruct',
    description: 'Strongest open Llama — slower, costlier credit burn.',
    contextWindow: 128_000,
    capabilities: ['chat', 'json', 'long-context', 'reasoning'],
  },
  {
    id: 'meta/llama-3.1-8b-instruct',
    provider: 'nvidia',
    label: 'Llama 3.1 8B Instruct',
    description: 'Cheap, fast NIM tier — good for short hints.',
    contextWindow: 128_000,
    capabilities: ['chat', 'json'],
  },
  {
    id: 'nvidia/nemotron-4-340b-instruct',
    provider: 'nvidia',
    label: 'Nemotron 4 340B Instruct',
    description: "NVIDIA's flagship instruct model.",
    contextWindow: 32_000,
    capabilities: ['chat', 'json', 'reasoning'],
  },
  {
    id: 'mistralai/mixtral-8x22b-instruct-v0.1',
    provider: 'nvidia',
    label: 'Mixtral 8×22B Instruct',
    description: 'Mistral MoE via NIM.',
    contextWindow: 64_000,
    capabilities: ['chat', 'json'],
  },
];

export const getModelsForProvider = (provider: ProviderId): ModelEntry[] =>
  MODEL_CATALOG.filter((m) => m.provider === provider);

export const getModel = (id: string): ModelEntry | undefined =>
  MODEL_CATALOG.find((m) => m.id === id);

export const getDefaultModel = (provider: ProviderId): ModelEntry => {
  const list = getModelsForProvider(provider);
  return list.find((m) => m.default) ?? list[0];
};

// ─── Preferred model store ──────────────────────────────────────────────────

const PREFS_KEY = 'vdj.vault.modelPrefs.v1';

type PrefMap = Partial<Record<ProviderId, string>>;

const readPrefs = (): PrefMap => {
  if (typeof localStorage === 'undefined') return {};
  const raw = localStorage.getItem(PREFS_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as PrefMap;
  } catch {
    return {};
  }
};

const writePrefs = (map: PrefMap): void => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(PREFS_KEY, JSON.stringify(map));
  notify();
};

type Listener = () => void;
const listeners = new Set<Listener>();
const notify = () => listeners.forEach((l) => l());

export const subscribeModelPrefs = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/**
 * Returns the user's preferred model for a provider, falling back to the
 * provider's default when nothing is stored or the stored id is unknown.
 */
export const getPreferredModel = (provider: ProviderId): string => {
  const stored = readPrefs()[provider];
  if (stored && getModel(stored)?.provider === provider) return stored;
  return getDefaultModel(provider).id;
};

export const setPreferredModel = (provider: ProviderId, modelId: string): void => {
  const entry = getModel(modelId);
  if (!entry || entry.provider !== provider) {
    throw new Error(`Model ${modelId} is not registered for provider ${provider}`);
  }
  const map = readPrefs();
  map[provider] = modelId;
  writePrefs(map);
};

export const resetPreferredModel = (provider: ProviderId): void => {
  const map = readPrefs();
  delete map[provider];
  writePrefs(map);
};

export const getAllPreferredModels = (): Record<ProviderId, string> => ({
  gemini: getPreferredModel('gemini'),
  anthropic: getPreferredModel('anthropic'),
  kimi: getPreferredModel('kimi'),
  openai: getPreferredModel('openai'),
  nvidia: getPreferredModel('nvidia'),
});
