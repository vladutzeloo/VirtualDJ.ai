import { GoogleGenAI } from "@google/genai";
import { getAgentImage } from "../constants/agentImages";
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

const estimateTokens = (text: string) => Math.ceil((text || '').length / 4);

// Image-gen models don't accept the googleSearch tool, so we run a short
// search-grounded text pass first to gather real visual cues, then feed
// those cues into the image prompt.
const enrichWithWebContext = async (subject: string, hint: string): Promise<string> => {
  try {
    const ai = getAI();
    const prompt = `Search the web for visual references for: ${subject}. Context: ${hint}. Reply with a single short comma-separated list (max 20 words) of concrete visual descriptors only — no sentences, no preamble.`;
    const res = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] },
    });
    const out = (res.text ?? "").replace(/\n+/g, " ").trim();
    recordUsage({
      provider: 'gemini',
      model: 'gemini-3-flash-preview',
      feature: 'visual-context',
      inputTokens: estimateTokens(prompt),
      outputTokens: estimateTokens(out),
    });
    return out;
  } catch {
    return "";
  }
};

export const generateTrackArtwork = async (title: string, artist: string, genre: string): Promise<string | null> => {
  try {
    const ai = getAI();
    const webCues = await enrichWithWebContext(
      `the track "${title}" by "${artist}"`,
      `${genre} album cover art direction`,
    );

    const prompt = `A highly stylized, futuristic digital art piece for a music album cover.
    Title: "${title}" by "${artist}".
    Genre: ${genre}.
    ${webCues ? `Real-world visual references: ${webCues}.` : ""}
    Style: Cyberpunk, vibrant neon colors, dark background, technical grid patterns, professional DJ visual aesthetics.
    No text, just the abstract visual representation of the sound.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: prompt,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
        }
      },
    });

    recordUsage({
      provider: 'gemini',
      model: 'gemini-2.5-flash-image',
      feature: 'track-artwork',
      inputTokens: estimateTokens(prompt),
      outputTokens: 0,
      imageCalls: 1,
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return getAgentImage(genre);
  } catch (error) {
    console.error("Image Generation Error:", error);
    return getAgentImage(genre);
  }
};

export const generateAgentAvatar = async (agentName: string, role: string): Promise<string | null> => {
  try {
    const ai = getAI();
    const prompt = `A professional, high-concept headshot of a futuristic digital entity/AI agent.
    Name: "${agentName}". Role: "${role}".
    Aesthetic: Sleek, humanoid but robotic, glowing circuitry, minimalist fashion, high-end photography lighting.
    Colors: Charcoal black, crisp white, and an accent color related to "${role}".
    Professional character design, 8k resolution, cinematic focus.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: { aspectRatio: "1:1" }
      },
    });

    recordUsage({
      provider: 'gemini',
      model: 'gemini-2.5-flash-image',
      feature: 'agent-avatar',
      inputTokens: estimateTokens(prompt),
      outputTokens: 0,
      imageCalls: 1,
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return getAgentImage(agentName);
  } catch (error) {
    console.error("Agent Avatar Error:", error);
    return getAgentImage(agentName);
  }
};
