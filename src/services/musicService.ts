import { GoogleGenAI } from "@google/genai";
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
  title: string;
  artist: string;
  genre: string;
  agentLabel: string;
  confidence: number;
  tags: string[];
  releaseDate: string;
  previewUrl: string;
  imageUrl?: string;
  isLiked?: boolean;
  notes?: string;
  sources?: GroundingSource[];
}

const RECOMMENDATION_PROMPT = (genrePreference: string) => `You are a DJ-curation agent with live web access. Use Google Search to find REAL, currently-released ${genrePreference} tracks (prefer the last 24 months when possible). Verify titles, artists and release dates against the web.

For each of 5 tracks, assign a specialized AI Agent persona (e.g. "Bass Enhancer", "Vocal Refiner", "Harmonic Sync", "Sync Master", "Ambient Soul").

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

export const getTrackRecommendations = async (genrePreference: string): Promise<TrackRecommendation[]> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: RECOMMENDATION_PROMPT(genrePreference),
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text;
    const promptText = RECOMMENDATION_PROMPT(genrePreference);
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

    return parsed.map((rec: any) => ({
      title: String(rec.title ?? ""),
      artist: String(rec.artist ?? ""),
      genre: String(rec.genre ?? genrePreference),
      agentLabel: String(rec.agentLabel ?? "AUTO-CURATOR"),
      confidence: typeof rec.confidence === "number" ? rec.confidence : 0.85,
      tags: Array.isArray(rec.tags) ? rec.tags.map(String) : [],
      releaseDate: String(rec.releaseDate ?? ""),
      previewUrl: String(rec.previewUrl ?? ""),
      sources,
    }));
  } catch (error) {
    console.error("Gemini Error:", error);
    return [];
  }
};
