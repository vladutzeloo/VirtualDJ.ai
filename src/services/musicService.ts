import { GoogleGenAI } from "@google/genai";
import { searchAudiusTracks, type AudiusTrack } from "./audiusService";
import { getApiKey, markKeyUsed } from "./apiKeyManager";
import { recordUsage } from "./usageTracker";

let aiInstance: GoogleGenAI | null = null;
let aiInstanceKey: string | null = null;

function getAI() {
  const apiKey = getApiKey('gemini');
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set. Add it via the Neural Vault or your environment.");
  }
  if (!aiInstance || aiInstanceKey !== apiKey) {
    aiInstance = new GoogleGenAI({ apiKey });
    aiInstanceKey = apiKey;
  }
  markKeyUsed('gemini');
  return aiInstance;
}

const usageMetadataTokens = (response: any): { input: number; output: number } => {
  const meta = response?.usageMetadata ?? response?.response?.usageMetadata;
  return {
    input: Number(meta?.promptTokenCount ?? 0),
    output: Number(meta?.candidatesTokenCount ?? meta?.totalTokenCount ?? 0),
  };
};

const estimateTokens = (text: string) => Math.ceil((text || '').length / 4);

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface TrackRecommendation {
  id: string;
  title: string;
  artist: string;
  genre: string;
  agentLabel: string;
  confidence: number;
  tags: string[];
  releaseDate: string;
  previewUrl: string;
  /** Direct streamable audio URL (e.g. Audius). When set, the deck plays this in <audio>. */
  streamUrl?: string;
  /** Source label for UI badges (e.g. "Audius", "Gemini"). */
  source?: string;
  imageUrl?: string;
  isLiked?: boolean;
  isDisliked?: boolean;
  feedbackReason?: string;
  inPlaylist?: boolean;
  notes?: string;
  sources?: GroundingSource[];
}

export const makeTrackId = (title: string, artist: string): string =>
  `${title}::${artist}`.toLowerCase().replace(/\s+/g, '-').slice(0, 120);

const RECOMMENDATION_PROMPT = (
  genrePreference: string,
  agentBriefing?: string,
  weatherContext?: string,
) => `You are a DJ-curation agent with live web access. Use Google Search to find REAL, currently-released ${genrePreference} tracks (prefer the last 24 months when possible). Verify titles, artists and release dates against the web.

For each of 5 tracks, assign a specialized AI Agent persona (e.g. "Bass Enhancer", "Vocal Refiner", "Harmonic Sync", "Sync Master", "Ambient Soul").
${agentBriefing ? `\nBefore deciding which agent persona to assign, read the user's persona reputation briefing below and prefer agents the user has TRUSTED. Avoid reusing personas the user has flagged AVOID.\n\n${agentBriefing}\n` : ''}${weatherContext ? `\nAmbient context: it is currently ${weatherContext}. Lean the energy, mood and tempo of your picks into this vibe — sunny daytime calls for brighter, higher-energy tracks; rainy or night conditions favour moodier, slower, more atmospheric picks.\n` : ''}

Return ONLY a single JSON array (no prose, no markdown fences) of 5 objects with this exact shape:
[
  {
    "title": string,
    "artist": string,
    "genre": string,
    "agentLabel": string,
    "confidence": number between 0 and 1,
    "tags": string[],
    "releaseDate": string (YYYY or YYYY-MM-DD),
    "previewUrl": string (a real youtube.com or soundcloud.com URL for the track if you can find one, otherwise a plausible search URL)
  }
]`;

function extractJsonArray(raw: string): unknown {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced ? fenced[1] : raw).trim();
  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf("[");
    const end = candidate.lastIndexOf("]");
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(candidate.slice(start, end + 1));
    }
    throw new Error("Model did not return parseable JSON");
  }
}

export const getTrackRecommendations = async (
  genrePreference: string,
  agentBriefing?: string,
  weatherContext?: string,
): Promise<TrackRecommendation[]> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: RECOMMENDATION_PROMPT(genrePreference, agentBriefing, weatherContext),
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text;
    const promptText = RECOMMENDATION_PROMPT(genrePreference, agentBriefing, weatherContext);
    const reported = usageMetadataTokens(response);
    recordUsage({
      provider: 'gemini',
      model: 'gemini-3-flash-preview',
      feature: 'track-recommendations',
      inputTokens: reported.input || estimateTokens(promptText),
      outputTokens: reported.output || estimateTokens(text ?? ''),
    });
    if (!text) return [];

    const parsed = extractJsonArray(text);
    if (!Array.isArray(parsed)) return [];

    const groundingChunks =
      response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    const sources: GroundingSource[] = groundingChunks
      .map((c: any) => c?.web)
      .filter((w: any) => w?.uri)
      .map((w: any) => ({ uri: w.uri as string, title: (w.title as string) ?? w.uri }));

    return parsed.map((rec: any) => {
      const title = String(rec.title ?? "");
      const artist = String(rec.artist ?? "");
      return {
        id: makeTrackId(title, artist),
        title,
        artist,
        genre: String(rec.genre ?? genrePreference),
        agentLabel: String(rec.agentLabel ?? "AUTO-CURATOR"),
        confidence: typeof rec.confidence === "number" ? rec.confidence : 0.85,
        tags: Array.isArray(rec.tags) ? rec.tags.map(String) : [],
        releaseDate: String(rec.releaseDate ?? ""),
        previewUrl: String(rec.previewUrl ?? ""),
        source: 'Gemini',
        sources,
      };
    });
  } catch (error) {
    console.error("Gemini Error:", error);
    return [];
  }
};

const AGENT_BY_GENRE: Array<{ match: RegExp; label: string }> = [
  { match: /bass|dnb|drum/i, label: 'BASS ENHANCER' },
  { match: /house|tech|techno/i, label: 'SYNC MASTER' },
  { match: /hip[\s-]?hop|rap|trap/i, label: 'RHYTHM REFINER' },
  { match: /ambient|chill|lofi|lo-fi/i, label: 'AMBIENT SOUL' },
  { match: /vocal|pop|r&b|rnb/i, label: 'VOCAL REFINER' },
  { match: /electronic|edm|synth/i, label: 'HARMONIC SYNC' },
  { match: /rock|metal|punk/i, label: 'DISTORTION CORE' },
  { match: /jazz|funk|soul/i, label: 'GROOVE ARCHIVIST' },
];

function pickAgentLabel(track: AudiusTrack, fallbackIndex: number): string {
  const haystack = `${track.genre} ${track.tags.join(' ')}`;
  for (const { match, label } of AGENT_BY_GENRE) {
    if (match.test(haystack)) return label;
  }
  const rotation = ['AUTO-CURATOR', 'NEURAL SCOUT', 'CRATE DIGGER', 'WAVEFORM SAGE'];
  return rotation[fallbackIndex % rotation.length];
}

function audiusToRecommendation(track: AudiusTrack, index: number, queryGenre: string): TrackRecommendation {
  return {
    id: makeTrackId(track.title, track.artist),
    title: track.title,
    artist: track.artist,
    genre: track.genre && track.genre !== 'Unknown' ? track.genre : queryGenre,
    agentLabel: pickAgentLabel(track, index),
    confidence: 0.92,
    tags: track.tags.slice(0, 3),
    releaseDate: '',
    previewUrl: track.permalink ?? track.streamUrl,
    streamUrl: track.streamUrl,
    source: 'Audius',
    imageUrl: track.artworkUrl,
  };
}

/**
 * Search the free Audius music library for playable tracks.
 * Falls back to the Gemini curation agent if Audius returns nothing
 * (e.g. offline, or no matches). Audius results have `streamUrl` set so
 * the deck can play them directly.
 */
export const searchPlayableTracks = async (
  query: string,
  limit = 8,
  agentBriefing?: string,
  weatherContext?: string,
): Promise<TrackRecommendation[]> => {
  try {
    const audius = await searchAudiusTracks(query, limit);
    if (audius.length > 0) {
      return audius.map((t, i) => audiusToRecommendation(t, i, query));
    }
  } catch (err) {
    console.warn('Audius search failed, falling back to Gemini:', err);
  }
  return getTrackRecommendations(query, agentBriefing, weatherContext);
};
