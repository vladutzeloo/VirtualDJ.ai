/**
 * LLM Checker
 *
 * Sends a tiny live ping to each provider's currently-preferred model so the
 * Vault can show "key + model actually works" status with latency. Each ping
 * is a minimal completion (1–2 tokens out) so cost stays at a fraction of a
 * cent. Results are persisted in localStorage keyed by provider.
 *
 * Calls go through the same code paths as production traffic — we reuse
 * `runDjSkill` style fetches but with the smallest possible body.
 */

import { GoogleGenAI } from '@google/genai';
import type { ProviderId } from './apiKeyManager';
import { getApiKey, hasApiKey, markKeyUsed, PROVIDERS } from './apiKeyManager';
import { getAnthropicClient } from './anthropicClient';
import { getPreferredModel } from './modelCatalog';
import { recordUsage } from './usageTracker';

export interface CheckResult {
  provider: ProviderId;
  model: string;
  ok: boolean;
  latencyMs: number;
  timestamp: number;
  sample?: string;
  error?: string;
}

const STORAGE_KEY = 'vdj.vault.checkResults.v1';

type ResultMap = Partial<Record<ProviderId, CheckResult>>;

const readResults = (): ResultMap => {
  if (typeof localStorage === 'undefined') return {};
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as ResultMap;
  } catch {
    return {};
  }
};

const writeResults = (map: ResultMap): void => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  notify();
};

type Listener = () => void;
const listeners = new Set<Listener>();
const notify = () => listeners.forEach((l) => l());

export const subscribeCheckResults = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getLastCheckResult = (provider: ProviderId): CheckResult | undefined =>
  readResults()[provider];

export const getAllCheckResults = (): ResultMap => readResults();

const PING_PROMPT = 'Reply with the single word: pong';
const PING_FEATURE = 'vault:check';

const truncate = (text: string, max = 80): string =>
  text.length <= max ? text : text.slice(0, max - 1) + '…';

// ─── Per-provider ping implementations ─────────────────────────────────────

const pingAnthropic = async (model: string): Promise<string> => {
  const client = getAnthropicClient();
  const response = await client.messages.create({
    model,
    max_tokens: 16,
    system: 'You are a health-check responder. Reply with one word.',
    messages: [{ role: 'user', content: PING_PROMPT }],
  });
  recordUsage({
    provider: 'anthropic',
    model,
    feature: PING_FEATURE,
    inputTokens: response.usage?.input_tokens ?? 0,
    outputTokens: response.usage?.output_tokens ?? 0,
  });
  const block = response.content.find((b) => b.type === 'text');
  return block && 'text' in block ? block.text.trim() : '';
};

const pingGemini = async (model: string): Promise<string> => {
  const apiKey = getApiKey('gemini');
  if (!apiKey) throw new Error('No Gemini key configured.');
  // Image-only models can't do chat — substitute the catalog default.
  const chatModel = model.includes('image') ? 'gemini-3-flash-preview' : model;
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: chatModel,
    contents: PING_PROMPT,
  });
  markKeyUsed('gemini');
  const meta = (response as any)?.usageMetadata;
  recordUsage({
    provider: 'gemini',
    model: chatModel,
    feature: PING_FEATURE,
    inputTokens: Number(meta?.promptTokenCount ?? 0),
    outputTokens: Number(meta?.candidatesTokenCount ?? 0),
  });
  const text =
    (response as any)?.text ??
    (response as any)?.response?.text?.() ??
    '';
  return typeof text === 'string' ? text.trim() : String(text ?? '').trim();
};

const pingOpenAICompatible = async (
  baseUrl: string,
  apiKey: string,
  model: string,
  provider: ProviderId,
): Promise<string> => {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are a health-check responder. Reply with one word.' },
        { role: 'user', content: PING_PROMPT },
      ],
      max_tokens: 16,
      temperature: 0,
      stream: false,
    }),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`${response.status} ${response.statusText}${detail ? ` — ${truncate(detail, 160)}` : ''}`);
  }
  const data = await response.json();
  markKeyUsed(provider);
  recordUsage({
    provider,
    model,
    feature: PING_FEATURE,
    inputTokens: Number(data?.usage?.prompt_tokens ?? 0),
    outputTokens: Number(data?.usage?.completion_tokens ?? 0),
  });
  return String(data?.choices?.[0]?.message?.content ?? '').trim();
};

const pingNvidia = async (model: string): Promise<string> => {
  const apiKey = getApiKey('nvidia');
  if (!apiKey) throw new Error('No NVIDIA key configured.');
  return pingOpenAICompatible('https://integrate.api.nvidia.com/v1', apiKey, model, 'nvidia');
};

const pingKimi = async (model: string): Promise<string> => {
  const apiKey = getApiKey('kimi');
  if (!apiKey) throw new Error('No Kimi key configured.');
  return pingOpenAICompatible('https://api.moonshot.ai/v1', apiKey, model, 'kimi');
};

const pingOpenAI = async (model: string): Promise<string> => {
  const apiKey = getApiKey('openai');
  if (!apiKey) throw new Error('No OpenAI key configured.');
  return pingOpenAICompatible('https://api.openai.com/v1', apiKey, model, 'openai');
};

// ─── Public API ────────────────────────────────────────────────────────────

export const checkProvider = async (provider: ProviderId): Promise<CheckResult> => {
  const model = getPreferredModel(provider);
  const start = performance.now();

  if (!hasApiKey(provider)) {
    const result: CheckResult = {
      provider,
      model,
      ok: false,
      latencyMs: 0,
      timestamp: Date.now(),
      error: `${PROVIDERS[provider].name} key is missing.`,
    };
    const map = readResults();
    map[provider] = result;
    writeResults(map);
    return result;
  }

  try {
    let sample: string;
    switch (provider) {
      case 'anthropic':
        sample = await pingAnthropic(model);
        break;
      case 'gemini':
        sample = await pingGemini(model);
        break;
      case 'nvidia':
        sample = await pingNvidia(model);
        break;
      case 'kimi':
        sample = await pingKimi(model);
        break;
      case 'openai':
        sample = await pingOpenAI(model);
        break;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
    const latencyMs = Math.round(performance.now() - start);
    const result: CheckResult = {
      provider,
      model,
      ok: true,
      latencyMs,
      timestamp: Date.now(),
      sample: truncate(sample || '(empty response)'),
    };
    const map = readResults();
    map[provider] = result;
    writeResults(map);
    return result;
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - start);
    const result: CheckResult = {
      provider,
      model,
      ok: false,
      latencyMs,
      timestamp: Date.now(),
      error: truncate(err?.message ?? String(err) ?? 'Unknown error', 200),
    };
    const map = readResults();
    map[provider] = result;
    writeResults(map);
    return result;
  }
};

/** Run checks for every provider that currently has a configured key. */
export const checkAllConfigured = async (): Promise<CheckResult[]> => {
  const providers = (Object.keys(PROVIDERS) as ProviderId[]).filter(hasApiKey);
  return Promise.all(providers.map(checkProvider));
};

export const clearCheckResults = (): void => writeResults({});
