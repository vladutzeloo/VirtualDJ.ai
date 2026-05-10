import Anthropic from '@anthropic-ai/sdk';
import { getApiKey, markKeyUsed } from './apiKeyManager';

let clientInstance: Anthropic | null = null;
let clientInstanceKey: string | null = null;

/**
 * Returns a process-wide Anthropic client, rebuilt only when the resolved
 * key changes (e.g. after the user updates the Neural Vault). Throws a
 * descriptive error when no key is available so callers don't need to repeat
 * the same guard.
 */
export const getAnthropicClient = (): Anthropic => {
  const apiKey = getApiKey('anthropic');
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY is not set. Add it via the Neural Vault or your environment.',
    );
  }
  if (!clientInstance || clientInstanceKey !== apiKey) {
    clientInstance = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
    clientInstanceKey = apiKey;
  }
  markKeyUsed('anthropic');
  return clientInstance;
};
