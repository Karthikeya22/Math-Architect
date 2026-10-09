import { GoogleGenAI } from "@google/genai";
import type { GenerateRequest, GenerateResponse } from "./types.ts";

export const callGeminiProvider = async (
  apiKey: string,
  req: GenerateRequest,
  model: string
): Promise<GenerateResponse> => {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model,
    contents: req.contents,
    config: req.config,
  });
  return {
    text: response.text ?? null,
    candidates: response.candidates ?? [],
    provider: "gemini",
    model,
  };
};
