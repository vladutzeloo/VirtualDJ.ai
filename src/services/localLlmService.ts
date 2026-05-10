/**
 * Local LLM Service
 *
 * Talks to any OpenAI-compatible chat completions endpoint running locally
 * (Ollama, LM Studio, llama.cpp server, vLLM, text-generation-webui, …).
 * Endpoint config lives in localStorage so the user can point the app at
 * whatever stack they prefer from the Neural Vault.
 *
 * Model selection goes through the unified `modelCatalog` store (same UI
 * as the cloud providers); the model id used for `'local'` is whatever
 * `getPreferredModel('local')` returns. The optional Bearer token (only
 * needed for vLLM and similar setups that require auth) is stored
 * alongside the cloud provider keys via `apiKeyManager`. Only the base
 * URL — the one piece of state without a cloud analogue — lives here.
 *
 * This is the bottom rung of the AI provider chain: when no cloud provider
 * is configured (or all of them fail) we fall back here so the app keeps
 * working offline.
 */

import { getApiKey } from './apiKeyManager';
import { getPreferredModel } from './modelCatalog';
import { recordUsage } from './usageTracker';

const STORAGE_KEY = 'vdj.local-llm.config.v1';

export interface LocalLlmConfig {
  baseUrl: string;
}

export const DEFAULT_LOCAL_LLM_CONFIG: LocalLlmConfig = {
  // Ollama's OpenAI-compatible endpoint. LM Studio: http://localhost:1234/v1
  // llama.cpp server: http://localhost:8080/v1, vLLM: http://localhost:8000/v1
  baseUrl: 'http://localhost:11434/v1',
};

type Listener = () => void;
const listeners = new Set<Listener>();
const notify = () => listeners.forEach((l) => l());

export const subscribeLocalLlm = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getLocalLlmConfig = (): LocalLlmConfig => {
  if (typeof localStorage === 'undefined') return { ...DEFAULT_LOCAL_LLM_CONFIG };
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { ...DEFAULT_LOCAL_LLM_CONFIG };
  try {
    const parsed = JSON.parse(raw) as Partial<LocalLlmConfig>;
    return {
      baseUrl: parsed.baseUrl?.trim() || DEFAULT_LOCAL_LLM_CONFIG.baseUrl,
    };
  } catch {
    return { ...DEFAULT_LOCAL_LLM_CONFIG };
  }
};

export const setLocalLlmConfig = (next: Partial<LocalLlmConfig>): void => {
  if (typeof localStorage === 'undefined') return;
  const merged: LocalLlmConfig = {
    baseUrl: next.baseUrl?.trim() || getLocalLlmConfig().baseUrl,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  notify();
};

export const clearLocalLlmConfig = (): void => {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  notify();
};

export const hasLocalLlmConfig = (): boolean => {
  // We always have defaults pointing at Ollama, so this returns true so the
  // chain attempts the call. The fetch will fail fast if the user hasn't
  // started a local server, and the chain will surface that error.
  return Boolean(getLocalLlmConfig().baseUrl);
};

export interface LocalLlmChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LocalLlmChatOptions {
  model?: string;
  messages: LocalLlmChatMessage[];
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  feature?: string;
}

interface LocalChatResponse {
  choices?: Array<{
    message?: { role: string; content: string };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

const stripJsonFences = (raw: string): string =>
  raw.trim().replace(/^```(?:json)?\s*|\s*```$/g, '');

const joinUrl = (baseUrl: string, path: string): string =>
  `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;

export const runLocalLlmChat = async ({
  model,
  messages,
  temperature = 0.7,
  topP = 0.95,
  maxTokens = 1024,
  feature = 'local-llm:chat',
}: LocalLlmChatOptions): Promise<{ text: string; raw: LocalChatResponse }> => {
  const cfg = getLocalLlmConfig();
  const resolvedModel = model ?? getPreferredModel('local');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  const bearer = getApiKey('local');
  if (bearer) headers.Authorization = `Bearer ${bearer}`;

  let response: Response;
  try {
    response = await fetch(joinUrl(cfg.baseUrl, '/chat/completions'), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: resolvedModel,
        messages,
        temperature,
        top_p: topP,
        max_tokens: maxTokens,
        stream: false,
      }),
    });
  } catch (err) {
    throw new Error(
      `Local LLM unreachable at ${cfg.baseUrl}. Start your local server (Ollama, LM Studio, llama.cpp) ` +
        `or update the endpoint in the Neural Vault. (${err instanceof Error ? err.message : String(err)})`,
    );
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(
      `Local LLM request failed: ${response.status} ${response.statusText}${
        detail ? ` — ${detail.slice(0, 200)}` : ''
      }`,
    );
  }

  const data = (await response.json()) as LocalChatResponse;
  const text = data.choices?.[0]?.message?.content?.trim() ?? '';

  recordUsage({
    provider: 'local',
    model: resolvedModel,
    feature,
    inputTokens: data.usage?.prompt_tokens ?? 0,
    outputTokens: data.usage?.completion_tokens ?? 0,
  });

  return { text, raw: data };
};

export const runLocalLlmJson = async <T = unknown>(
  options: LocalLlmChatOptions,
): Promise<T> => {
  const { text } = await runLocalLlmChat(options);
  const cleaned = stripJsonFences(text);
  try {
    return JSON.parse(cleaned) as T;
  } catch (err) {
    console.error('Local LLM JSON parse error. Raw response:', text, err);
    throw new Error('The local LLM returned an invalid JSON response.');
  }
};
