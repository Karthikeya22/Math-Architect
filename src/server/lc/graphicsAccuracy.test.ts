import { describe, expect, it } from "vitest";
import { buildLcGraphicsClaim, checkLcGraphicsAccuracy } from "./graphicsAccuracy";

describe("checkLcGraphicsAccuracy", () => {
  it("skips when mode is off", async () => {
    const verdict = await checkLcGraphicsAccuracy({
      imageBase64: "AAAA",
      mimeType: "image/png",
      claim: "shows 3 dots",
      env: { LC_EVAL_MODE: "off" },
    });
    expect(verdict.skipped).toBe(true);
    expect(verdict.pass).toBe(true);
  });

  it("shadow mode never fails the figure", async () => {
    const verdict = await checkLcGraphicsAccuracy({
      imageBase64: "AAAA",
      mimeType: "image/jpeg",
      claim: "shows 3 dots",
      env: { LC_EVAL_MODE: "shadow", LC_GRAPHICS_ENABLED: "true", GEMINI_API_KEY: "x" },
      evaluate: async () => ({ is_correct: false, basis: "Contradicted", reasoning: "wrong count" }),
    });
    expect(verdict.pass).toBe(true);
    expect(verdict.issues[0]).toMatch(/Contradicted/);
  });

  it("fail mode rejects incorrect graphics", async () => {
    const verdict = await checkLcGraphicsAccuracy({
      imageBase64: "AAAA",
      mimeType: "image/jpeg",
      claim: "shows 3 dots",
      env: { LC_EVAL_MODE: "fail", LC_GRAPHICS_ENABLED: "true", GEMINI_API_KEY: "x" },
      evaluate: async () => ({ is_correct: false, basis: "Contradicted", reasoning: "wrong count" }),
    });
    expect(verdict.pass).toBe(false);
  });

  it("forceFail rejects incorrect graphics even when env mode is shadow", async () => {
    const verdict = await checkLcGraphicsAccuracy({
      imageBase64: "AAAA",
      mimeType: "image/jpeg",
      claim: "shows 3 dots",
      forceFail: true,
      env: { LC_EVAL_MODE: "shadow", LC_GRAPHICS_ENABLED: "true", GEMINI_API_KEY: "x" },
      evaluate: async () => ({ is_correct: false, basis: "Contradicted", reasoning: "wrong count" }),
    });
    expect(verdict.pass).toBe(false);
  });
});

describe("buildLcGraphicsClaim", () => {
  it("uses question+answer form when available", () => {
    const claim = buildLcGraphicsClaim({
      kind: "question",
      text: "How many apples?",
      correctAnswer: "9",
    });
    expect(claim.toLowerCase()).toContain("apple");
    expect(claim).toContain("9");
  });
});
