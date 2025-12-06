import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";
import { AspectRatio, ImageSize } from "../types";

// Helper to get AI instance
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generate a new image (sprite/asset) using gemini-3-pro-image-preview
 */
export const generateAsset = async (
  prompt: string,
  aspectRatio: AspectRatio,
  imageSize: ImageSize,
  style: string = 'pixel art',
  negativePrompt?: string,
  seed?: number
): Promise<string> => {
  try {
    const ai = getAI();
    
    // Construct a rich prompt based on inputs
    const finalPrompt = `${style} style. ${prompt}.${negativePrompt ? ` Exclude: ${negativePrompt}.` : ''}`;

    const config: any = {
      imageConfig: {
        aspectRatio: aspectRatio,
        imageSize: imageSize
      }
    };

    if (seed !== undefined && seed !== null) {
      config.seed = seed;
    }

    // Using gemini-3-pro-image-preview for high quality generation
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: finalPrompt }]
      },
      config: config
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated");
  } catch (error) {
    console.error("Generate Asset Error:", error);
    throw error;
  }
};

/**
 * Edit an existing image using gemini-2.5-flash-image
 */
export const editAsset = async (
  base64Image: string,
  prompt: string,
  seed?: number
): Promise<string> => {
  try {
    const ai = getAI();
    // Extract actual base64 data if it contains the prefix
    const data = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

    const config: any = {};
    if (seed !== undefined && seed !== null) {
        config.seed = seed;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: data
            }
          },
          { text: `Maintain pixel art style. ${prompt}` }
        ]
      },
      config: config
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No edited image returned");
  } catch (error) {
    console.error("Edit Asset Error:", error);
    throw error;
  }
};

/**
 * Search for inspiration using gemini-2.5-flash with Google Search
 */
export const searchInspiration = async (query: string): Promise<{ text: string, urls: Array<{title: string, uri: string}> }> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text || "No results found.";
    
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const urls = chunks
      .filter((chunk: any) => chunk.web?.uri)
      .map((chunk: any) => ({
        title: chunk.web.title || "Source",
        uri: chunk.web.uri
      }));

    return { text, urls };
  } catch (error) {
    console.error("Search Error:", error);
    throw error;
  }
};

/**
 * Analyze the current canvas using gemini-3-pro-preview
 */
export const analyzeAsset = async (base64Image: string, prompt: string): Promise<string> => {
  try {
    const ai = getAI();
    const data = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: data
            }
          },
          { text: prompt || "Analyze this pixel art. Describe the style, color palette, and suggest improvements." }
        ]
      },
      config: {
        thinkingConfig: { thinkingBudget: 1024 } // Use thinking for deeper analysis
      }
    });

    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Analysis Error:", error);
    throw error;
  }
};