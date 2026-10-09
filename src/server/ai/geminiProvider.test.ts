import { beforeEach, describe, expect, it, vi } from "vitest";

const { generateContent } = vi.hoisted(() => ({
  generateContent: vi.fn(),
}));

vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn(function GoogleGenAI(this: { models: { generateContent: typeof generateContent } }) {
    this.models = { generateContent };
  }),
}));

import { GoogleGenAI } from "@google/genai";
import { callGeminiProvider } from "./geminiProvider";

describe("callGeminiProvider", () => {
  beforeEach(() => {
    generateContent.mockReset();
    vi.mocked(GoogleGenAI).mockClear();
  });

  it("constructs GoogleGenAI and calls models.generateContent with model, contents, and config", async () => {
    generateContent.mockResolvedValue({
      text: "pong",
      candidates: [{ content: { parts: [{ text: "pong" }] } }],
    });

    const result = await callGeminiProvider(
      "test-key",
      {
        task: "vision",
        contents: "Reply with pong",
        config: { temperature: 0 },
      },
      "gemini-3-flash-preview"
    );

    expect(GoogleGenAI).toHaveBeenCalledWith({ apiKey: "test-key" });
    expect(generateContent).toHaveBeenCalledWith({
      model: "gemini-3-flash-preview",
      contents: "Reply with pong",
      config: { temperature: 0 },
    });
    expect(result).toEqual({
      text: "pong",
      candidates: [{ content: { parts: [{ text: "pong" }] } }],
      provider: "gemini",
      model: "gemini-3-flash-preview",
    });
  });
});
