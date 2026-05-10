/**
 * NVIDIA NIM Service
 *
 * NVIDIA hosts an OpenAI-compatible chat completion endpoint at
 * https://integrate.api.nvidia.com/v1. Models include Llama 3.1, Nemotron,
 * Mixtral, Qwen and others — see https://build.nvidia.com.
 *
 * The browser calls the endpoint directly with the user's nvapi-* key.
 * As with the Anthropic browser-side client, this is gated behind the
 * Neural Vault and treated as user-authorized — never store a server-only
 * NVIDIA key in here.
 */

import { getApiKey, hasApiKey, markKeyUsed } from './apiKeyManager';
import { recordUsage } from './usageTracker';

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';

export const DEFAULT_NVIDIA_MODEL = 'meta/llama-3.1-70b-instruct';

export interface NvidiaChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface NvidiaChatOptions {
  model?: string;
  messages: NvidiaChatMessage[];
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  feature?: string;
}

interface NvidiaChatResponse {
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
  const key = getApiKey('nvidia');
  if (!key) {
    throw new Error(
      'NVIDIA_API_KEY is not set. Add it via the Neural Vault or your environment.',
    );
  }
  return key;
};

const stripJsonFences = (raw: string): string =>
  raw.trim().replace(/^```(?:json)?\s*|\s*```$/g, '');

export const isNvidiaConfigured = (): boolean => hasApiKey('nvidia');

export const runNvidiaChat = async ({
  model = DEFAULT_NVIDIA_MODEL,
  messages,
  temperature = 0.7,
  topP = 0.95,
  maxTokens = 1024,
  feature = 'nvidia:chat',
}: NvidiaChatOptions): Promise<{ text: string; raw: NvidiaChatResponse }> => {
  const apiKey = requireKey();

  const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
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
      `NVIDIA NIM request failed: ${response.status} ${response.statusText}${
        detail ? ` — ${detail.slice(0, 200)}` : ''
      }`,
    );
  }

  const data = (await response.json()) as NvidiaChatResponse;
  markKeyUsed('nvidia');

  const text = data.choices?.[0]?.message?.content?.trim() ?? '';

  recordUsage({
    provider: 'nvidia',
    model,
    feature,
    inputTokens: data.usage?.prompt_tokens ?? 0,
    outputTokens: data.usage?.completion_tokens ?? 0,
  });

  return { text, raw: data };
};

/**
 * Run an NVIDIA chat call expecting a JSON object response. Strips ```json
 * fences and parses defensively, mirroring the Claude/Gemini service style.
 */
export const runNvidiaJson = async <T = unknown>(
  options: NvidiaChatOptions,
): Promise<T> => {
  const { text } = await runNvidiaChat(options);
  const cleaned = stripJsonFences(text);
  try {
    return JSON.parse(cleaned) as T;
  } catch (err) {
    console.error('NVIDIA JSON parse error. Raw response:', text, err);
    throw new Error('The NVIDIA agent returned an invalid JSON response.');
  }
};
