import Anthropic from '@anthropic-ai/sdk';
import type { TrackRecommendation } from './musicService';
import { getApiKey, markKeyUsed } from './apiKeyManager';
import { recordUsage } from './usageTracker';

let clientInstance: Anthropic | null = null;
let clientInstanceKey: string | null = null;

const getClient = (): Anthropic => {
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

export interface FeedbackEntry {
  id: string;
  title: string;
  artist: string;
  genre: string;
  tags: string[];
  reason?: string;
  verdict: 'liked' | 'disliked';
}

export interface TasteProfile {
  summary: string;
  loved_traits: string[];
  rejected_traits: string[];
  next_move: string;
  search_seed: string;
  per_track: { id: string; verdict: 'liked' | 'disliked'; why: string }[];
}

const SYSTEM_PROMPT = `You are a senior DJ A&R analyst. The user has rated tracks as liked or disliked,
sometimes with a short note. Your job is to explain WHY those choices fit together and what to play next.

Reply ONLY with a single JSON object (no prose, no markdown fences) of this exact shape:
{
  "summary": string (1-2 sentences describing the user's current taste),
  "loved_traits": string[] (3-5 short phrases: production traits, BPM bands, moods, eras, regions, instruments),
  "rejected_traits": string[] (1-4 short phrases the user is steering away from),
  "next_move": string (one concrete suggestion for the next track or transition),
  "search_seed": string (a 3-6 word query to feed back into a music search),
  "per_track": [
    { "id": string, "verdict": "liked" | "disliked", "why": string (one short sentence explaining the inferred reason) }
  ]
}

Be specific and musically literate (mention BPM ranges, key vibes, production elements). If a user note is provided
for a track, weight it heavily in your "why" for that track.`;

const buildUserPayload = (entries: FeedbackEntry[]): string => {
  return JSON.stringify({ feedback: entries }, null, 2);
};

export const analyzePreferences = async (
  feedback: FeedbackEntry[],
  model = 'claude-sonnet-4-6',
  agentBriefing?: string,
): Promise<TasteProfile> => {
  if (feedback.length === 0) {
    return {
      summary: 'No ratings yet. Like or dislike tracks to teach the agent your taste.',
      loved_traits: [],
      rejected_traits: [],
      next_move: 'Like a few tracks to seed the recommendation loop.',
      search_seed: '',
      per_track: [],
    };
  }

  const client = getClient();
  const system = agentBriefing
    ? `${SYSTEM_PROMPT}\n\nThe user has also rated the AI agent personas themselves. Weight TRUSTED personas' previous picks more heavily and discount AVOID personas when summarising taste.\n\n${agentBriefing}`
    : SYSTEM_PROMPT;
  const response = await client.messages.create({
    model,
    max_tokens: 1024,
    system,
    messages: [{ role: 'user', content: buildUserPayload(feedback) }],
  });

  recordUsage({
    provider: 'anthropic',
    model,
    feature: 'claude:preference-agent',
    inputTokens: response.usage?.input_tokens ?? 0,
    outputTokens: response.usage?.output_tokens ?? 0,
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  const raw = textBlock && 'text' in textBlock ? textBlock.text.trim() : '';
  const cleaned = raw.replace(/^```(?:json)?\s*|\s*```$/g, '');

  try {
    const parsed = JSON.parse(cleaned) as TasteProfile;
    return {
      summary: String(parsed.summary ?? ''),
      loved_traits: Array.isArray(parsed.loved_traits) ? parsed.loved_traits.map(String) : [],
      rejected_traits: Array.isArray(parsed.rejected_traits) ? parsed.rejected_traits.map(String) : [],
      next_move: String(parsed.next_move ?? ''),
      search_seed: String(parsed.search_seed ?? ''),
      per_track: Array.isArray(parsed.per_track)
        ? parsed.per_track.map((t: any) => ({
            id: String(t.id ?? ''),
            verdict: t.verdict === 'disliked' ? 'disliked' : 'liked',
            why: String(t.why ?? ''),
          }))
        : [],
    };
  } catch (err) {
    console.error('Preference agent parse error. Raw response:', raw, err);
    throw new Error('The preference agent returned an invalid response.');
  }
};

export const tracksToFeedback = (tracks: TrackRecommendation[]): FeedbackEntry[] =>
  tracks
    .filter((t) => t.isLiked || t.isDisliked)
    .map((t) => ({
      id: t.id,
      title: t.title,
      artist: t.artist,
      genre: t.genre,
      tags: t.tags ?? [],
      reason: t.feedbackReason,
      verdict: t.isLiked ? 'liked' : 'disliked',
    }));
