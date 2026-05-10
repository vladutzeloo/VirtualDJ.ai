/**
 * Moonshot Kimi Service
 *
 * Moonshot exposes an OpenAI-compatible chat completion endpoint at
 * https://api.moonshot.ai/v1. Models include moonshot-v1-32k and
 * moonshot-v1-128k — see https://platform.moonshot.ai/docs.
 *
 * This sits between NVIDIA and the local LLM in the provider chain: when
 * NVIDIA is unavailable but the user has a Kimi key, we use it before
 * falling back to whatever they're running locally.
 */

import { getApiKey, hasApiKey, markKeyUsed } from './apiKeyManager';
import { recordUsage } from './usageTracker';

const KIMI_BASE_URL = 'https://api.moonshot.ai/v1';

export const DEFAULT_KIMI_MODEL = 'moonshot-v1-32k';

export interface KimiChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface KimiChatOptions {
  model?: string;
  messages: KimiChatMessage[];
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  feature?: string;
}

interface KimiChatResponse {
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

const requireKey = (): string => {
  const key = getApiKey('kimi');
  if (!key) {
    throw new Error(
      'KIMI_API_KEY is not set. Add it via the Neural Vault or your environment.',
    );
  }
  return key;
};

const stripJsonFences = (raw: string): string =>
  raw.trim().replace(/^```(?:json)?\s*|\s*```$/g, '');

export const isKimiConfigured = (): boolean => hasApiKey('kimi');

export const runKimiChat = async ({
  model = DEFAULT_KIMI_MODEL,
  messages,
  temperature = 0.7,
  topP = 0.95,
  maxTokens = 1024,
  feature = 'kimi:chat',
}: KimiChatOptions): Promise<{ text: string; raw: KimiChatResponse }> => {
  const apiKey = requireKey();

  const response = await fetch(`${KIMI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      top_p: topP,
      max_tokens: maxTokens,
      stream: false,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(
      `Moonshot Kimi request failed: ${response.status} ${response.statusText}${
        detail ? ` — ${detail.slice(0, 200)}` : ''
      }`,
    );
  }

  const data = (await response.json()) as KimiChatResponse;
  markKeyUsed('kimi');

  const text = data.choices?.[0]?.message?.content?.trim() ?? '';

  recordUsage({
    provider: 'kimi',
    model,
    feature,
    inputTokens: data.usage?.prompt_tokens ?? 0,
    outputTokens: data.usage?.completion_tokens ?? 0,
  });

  return { text, raw: data };
};

export const runKimiJson = async <T = unknown>(
  options: KimiChatOptions,
): Promise<T> => {
  const { text } = await runKimiChat(options);
  const cleaned = stripJsonFences(text);
  try {
    return JSON.parse(cleaned) as T;
  } catch (err) {
    console.error('Kimi JSON parse error. Raw response:', text, err);
    throw new Error('The Kimi agent returned an invalid JSON response.');
  }
};
