import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set. Please provide it in the environment.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
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
}

export const getTrackRecommendations = async (genrePreference: string): Promise<TrackRecommendation[]> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Recommend 5 ${genrePreference} tracks for a DJ set. For each track, assign a specialized AI Agent (like 'Bass Enhancer', 'Vocal Refiner', 'Harmonic Sync'). 
      Include a release date and a mock preview URL (soundcloud or youtube format).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              artist: { type: Type.STRING },
              genre: { type: Type.STRING },
              agentLabel: { type: Type.STRING, description: "The AI Agent persona assigned to this track type" },
              confidence: { type: Type.NUMBER },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
              releaseDate: { type: Type.STRING },
              previewUrl: { type: Type.STRING }
            },
            required: ["title", "artist", "genre", "agentLabel", "releaseDate", "previewUrl"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Error:", error);
    return [];
  }
};
