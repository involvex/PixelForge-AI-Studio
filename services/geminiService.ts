import process from "node:process";
import { GoogleGenAI } from "@google/genai";
import type { AspectRatio, ImageSize } from "../types.ts";

// Helper to get AI instance with error handling
const getAI = () => {
  const apiKey =
    process.env.API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    console.error("Gemini API key not found in environment variables");
    throw new Error("Gemini API key is required but not configured");
  }

  return new GoogleGenAI({ apiKey });
};

// Network error detection
const isNetworkError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return (
      error.message.includes("NetworkError") ||
      error.message.includes("Failed to fetch") ||
      error.message.includes("ECONNABORTED") ||
      error.message.includes("ETIMEDOUT")
    );
  }
  return false;
};

// API key error detection
const isAPIKeyError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return (
      error.message.includes("API key") ||
      error.message.includes("authentication") ||
      error.message.includes("401") ||
      error.message.includes("403")
    );
  }
  return false;
};

/**
 * Generate a new image (sprite/asset) using gemini-3-pro-image-preview
 */
export const generateAsset = async (
  prompt: string,
  aspectRatio: AspectRatio,
  imageSize: ImageSize,
  style: string = "pixel art",
  negativePrompt?: string,
  seed?: number,
): Promise<string> => {
  try {
    const ai = getAI();

    // Check network connectivity first
    if (!navigator.onLine) {
      throw new Error(
        "No internet connection. Please check your network and try again.",
      );
    }

    // Construct a rich prompt based on inputs
    const finalPrompt = `${style} style. ${prompt}.${negativePrompt ? ` Exclude: ${negativePrompt}.` : ""}`;

    const config: Record<string, unknown> = {
      imageConfig: {
        aspectRatio: aspectRatio,
        imageSize: imageSize,
      },
    };

    if (seed !== undefined && seed !== null) {
      config.seed = seed;
    }

    // Using gemini-3-pro-image-preview for high quality generation
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: {
        parts: [{ text: finalPrompt }],
      },
      config: config,
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated");
  } catch (error) {
    console.error("Generate Asset Error:", error);

    // Enhanced error handling
    if (isNetworkError(error)) {
      throw new Error(
        "Network error: Please check your internet connection and try again.",
      );
    } else if (isAPIKeyError(error)) {
      throw new Error(
        "Authentication error: Invalid API key or insufficient permissions.",
      );
    } else if (error instanceof Error && error.message.includes("quota")) {
      throw new Error(
        "API quota exceeded. Please try again later or check your API plan.",
      );
    } else {
      throw new Error(
        `Failed to generate asset: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
};

/**
 * Edit an existing image using gemini-2.5-flash-image
 */
export const editAsset = async (
  base64Image: string,
  prompt: string,
  seed?: number,
): Promise<string> => {
  try {
    const ai = getAI();

    // Check network connectivity
    if (!navigator.onLine) {
      throw new Error(
        "No internet connection. Please check your network and try again.",
      );
    }

    // Extract actual base64 data if it contains the prefix
    const data = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

    const config: Record<string, unknown> = {};

    if (seed !== undefined && seed !== null) {
      config.seed = seed;
    }
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/png",
              data: data,
            },
          },
          { text: `Maintain pixel art style. ${prompt}` },
        ],
      },
      config: config,
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No edited image returned");
  } catch (error) {
    console.error("Edit Asset Error:", error);

    // Enhanced error handling
    if (isNetworkError(error)) {
      throw new Error(
        "Network error: Please check your internet connection and try again.",
      );
    } else if (isAPIKeyError(error)) {
      throw new Error(
        "Authentication error: Invalid API key or insufficient permissions.",
      );
    } else if (error instanceof Error && error.message.includes("quota")) {
      throw new Error(
        "API quota exceeded. Please try again later or check your API plan.",
      );
    } else {
      throw new Error(
        `Failed to edit asset: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
};

/**
 * Search for inspiration using gemini-2.5-flash with Google Search
 */
export const searchInspiration = async (
  query: string,
): Promise<{ text: string; urls: Array<{ title: string; uri: string }> }> => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: query,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "No results found.";

    const chunks =
      response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const urls = chunks
      .filter(chunk => chunk.web?.uri)
      .map(chunk => ({
        title: chunk.web?.title || "Source",
        uri: chunk.web?.uri || "",
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
export const analyzeAsset = async (
  base64Image: string,
  prompt: string,
): Promise<string> => {
  try {
    const ai = getAI();
    const data = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/png",
              data: data,
            },
          },
          {
            text:
              prompt ||
              "Analyze this pixel art. Describe the style, color palette, and suggest improvements.",
          },
        ],
      },
      config: {
        thinkingConfig: { thinkingBudget: 1024 }, // Use thinking for deeper analysis
      },
    });

    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Analysis Error:", error);
    throw error;
  }
};
