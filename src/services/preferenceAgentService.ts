import type { TrackRecommendation } from './musicService';
import { runAiJson } from './aiProviderChain';

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

  const system = agentBriefing
    ? `${SYSTEM_PROMPT}\n\nThe user has also rated the AI agent personas themselves. Weight TRUSTED personas' previous picks more heavily and discount AVOID personas when summarising taste.\n\n${agentBriefing}`
    : SYSTEM_PROMPT;

  const { data: parsed } = await runAiJson<Partial<TasteProfile>>({
    feature: 'preference-agent',
    maxTokens: 1024,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: buildUserPayload(feedback) },
    ],
  });

  return {
    summary: String(parsed.summary ?? ''),
    loved_traits: Array.isArray(parsed.loved_traits) ? parsed.loved_traits.map(String) : [],
    rejected_traits: Array.isArray(parsed.rejected_traits)
      ? parsed.rejected_traits.map(String)
      : [],
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
