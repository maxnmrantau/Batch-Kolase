
import { GoogleGenAI, Type } from "@google/genai";
import { Photo, AIAnalysis } from "../types";

export const analyzePhotos = async (photos: Photo[]): Promise<AIAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // We send the first few images to analyze the "theme"
  const samplePhotos = photos.slice(0, 3);
  
  const parts = samplePhotos.map(p => ({
    inlineData: {
      data: p.base64.split(',')[1],
      mimeType: 'image/jpeg'
    }
  }));

  const prompt = "Analyze these images and suggest a beautiful title, a theme (e.g. Vacation, Foodie, Family), the emotional vibe, and a hex color palette that complements these photos for a collage.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { 
        parts: [...parts, { text: prompt }] 
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            theme: { type: Type.STRING },
            vibe: { type: Type.STRING },
            colorPalette: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            }
          },
          required: ["title", "theme", "vibe", "colorPalette"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return {
      title: result.title || "Koleksi Saya",
      theme: result.theme || "General",
      vibe: result.vibe || "Happy",
      colorPalette: result.colorPalette || ["#ffffff", "#000000"]
    };
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      title: "Koleksi Kenangan",
      theme: "Classic",
      vibe: "Nostalgic",
      colorPalette: ["#f1f5f9", "#475569"]
    };
  }
};
