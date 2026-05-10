import { GoogleGenAI } from "@google/genai";
import { getAgentImage } from "../constants/agentImages";

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

export const generateTrackArtwork = async (title: string, artist: string, genre: string): Promise<string | null> => {
  try {
    const ai = getAI();
    const prompt = `A highly stylized, futuristic digital art piece for a music album cover. 
    Title: "${title}" by "${artist}". 
    Genre: ${genre}. 
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
