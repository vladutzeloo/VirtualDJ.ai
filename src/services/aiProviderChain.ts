/**
 * AI Provider Chain
 *
 * Tries cloud providers first (NVIDIA NIM → Moonshot Kimi) and falls back
 * to a local OpenAI-compatible LLM (Ollama / LM Studio / llama.cpp). Each
 * link in the chain has its own service module; this file just
 * orchestrates which one to call and surfaces a unified error if
 * everything fails.
 *
 * Callers (DJ skills, preference agent, etc.) build a system+user message
 * pair and let the chain pick a provider. Per-call provider pinning is
 * available via the `prefer` option for testing.
 */

import { hasApiKey } from './apiKeyManager';
import { runNvidiaChat, DEFAULT_NVIDIA_MODEL } from './nvidiaService';
import { runKimiChat, DEFAULT_KIMI_MODEL } from './kimiService';
import {
  runLocalLlmChat,
  hasLocalLlmConfig,
  getLocalLlmConfig,
} from './localLlmService';

export type AiProviderId = 'nvidia' | 'kimi' | 'local';

export interface AiChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiChainOptions {
  messages: AiChatMessage[];
  feature: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  /** Restrict the chain to a single provider (mostly for diagnostics). */
  prefer?: AiProviderId;
}

export interface AiChainResult {
  text: string;
  provider: AiProviderId;
  model: string;
}

interface ChainProvider {
  id: AiProviderId;
  available: () => boolean;
  resolveModel: () => string;
  run: (opts: AiChainOptions) => Promise<{ text: string }>;
}

const PROVIDERS: ChainProvider[] = [
  {
    id: 'nvidia',
    available: () => hasApiKey('nvidia'),
    resolveModel: () => DEFAULT_NVIDIA_MODEL,
    run: (opts) =>
      runNvidiaChat({
        messages: opts.messages,
        temperature: opts.temperature,
        topP: opts.topP,
        maxTokens: opts.maxTokens,
        feature: opts.feature,
      }).then((r) => ({ text: r.text })),
  },
  {
    id: 'kimi',
    available: () => hasApiKey('kimi'),
    resolveModel: () => DEFAULT_KIMI_MODEL,
    run: (opts) =>
      runKimiChat({
        messages: opts.messages,
        temperature: opts.temperature,
        topP: opts.topP,
        maxTokens: opts.maxTokens,
        feature: opts.feature,
      }).then((r) => ({ text: r.text })),
  },
  {
    id: 'local',
    available: () => hasLocalLlmConfig(),
    resolveModel: () => getLocalLlmConfig().model,
    run: (opts) =>
      runLocalLlmChat({
        messages: opts.messages,
        temperature: opts.temperature,
        topP: opts.topP,
        maxTokens: opts.maxTokens,
        feature: opts.feature,
      }).then((r) => ({ text: r.text })),
  },
];

const stripJsonFences = (raw: string): string =>
  raw.trim().replace(/^```(?:json)?\s*|\s*```$/g, '');

const formatChainError = (
  errors: Array<{ provider: AiProviderId; error: unknown }>,
): string => {
  if (errors.length === 0) {
    return (
      'No AI provider is configured. Add an NVIDIA or Kimi key in the Neural Vault, ' +
      'or run a local OpenAI-compatible LLM (Ollama, LM Studio, llama.cpp) and set its endpoint.'
    );
  }
  const formatted = errors
    .map(
      ({ provider, error }) =>
        `${provider}: ${error instanceof Error ? error.message : String(error)}`,
    )
    .join(' | ');
  return `All AI providers failed. ${formatted}`;
};

/**
 * Run a chat completion against the first available provider. Cloud
 * providers are tried in order; if none are configured (or all fail), the
 * local LLM is used. Throws with a combined diagnostic if every link
 * fails.
 */
export const runAiChat = async (options: AiChainOptions): Promise<AiChainResult> => {
  const candidates = options.prefer
    ? PROVIDERS.filter((p) => p.id === options.prefer)
    : PROVIDERS;

  const errors: Array<{ provider: AiProviderId; error: unknown }> = [];

  for (const provider of candidates) {
    if (!provider.available()) continue;
    try {
      const { text } = await provider.run(options);
      return { text, provider: provider.id, model: provider.resolveModel() };
    } catch (error) {
      console.warn(`[ai-chain] ${provider.id} failed, trying next provider`, error);
      errors.push({ provider: provider.id, error });
    }
  }

  throw new Error(formatChainError(errors));
};

/**
 * Run a chat completion expecting a JSON response. Strips ```json fences
 * before parsing, mirroring the per-provider helpers.
 */
export const runAiJson = async <T = unknown>(
  options: AiChainOptions,
): Promise<{ data: T; provider: AiProviderId; model: string }> => {
  const result = await runAiChat(options);
  const cleaned = stripJsonFences(result.text);
  try {
    return { data: JSON.parse(cleaned) as T, provider: result.provider, model: result.model };
  } catch (err) {
    console.error(
      `[ai-chain] ${result.provider} returned malformed JSON. Raw:`,
      result.text,
      err,
    );
    throw new Error(`The ${result.provider} agent returned an invalid JSON response.`);
  }
};

/** True when at least one link in the chain is configured. */
export const isAiChainConfigured = (): boolean =>
  PROVIDERS.some((p) => p.available());
