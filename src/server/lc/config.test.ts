import { describe, expect, it } from "vitest";
import { Provider } from "@learning-commons/evaluators";
import { isLcAlignmentConfigured, resolveLcAlignLlm } from "./config";

describe("resolveLcAlignLlm", () => {
  it("prefers Anthropic when present", () => {
    const llm = resolveLcAlignLlm({
      ANTHROPIC_API_KEY: "a",
      OPENAI_API_KEY: "o",
      GEMINI_API_KEY: "g",
    });
    expect(llm?.label).toBe("anthropic-default");
    expect(llm?.modelOverride).toBeUndefined();
  });

  it("falls back to OpenAI override without Anthropic", () => {
    const llm = resolveLcAlignLlm({
      OPENAI_API_KEY: "o",
      OPENAI_ANALYSIS_MODEL: "gpt-5.4-mini",
      GEMINI_API_KEY: "g",
    });
    expect(llm?.label).toBe("openai-override");
    expect(llm?.modelOverride).toEqual({
      provider: Provider.OpenAI,
      model: "gpt-5.4-mini",
    });
  });

  it("falls back to Gemini when only Google key exists", () => {
    const llm = resolveLcAlignLlm({ GEMINI_API_KEY: "g", GEMINI_TEXT_MODEL: "gemini-3-flash-preview" });
    expect(llm?.label).toBe("gemini-override");
    expect(llm?.modelOverride?.provider).toBe(Provider.Google);
  });

  it("honors LC_ALIGN_PROVIDER=gemini", () => {
    const llm = resolveLcAlignLlm({
      LC_ALIGN_PROVIDER: "gemini",
      ANTHROPIC_API_KEY: "a",
      OPENAI_API_KEY: "o",
      GEMINI_API_KEY: "g",
    });
    expect(llm?.label).toBe("gemini-override");
  });

  it("alignment configured needs LC key plus any LLM", () => {
    expect(isLcAlignmentConfigured({ LEARNING_COMMONS_API_KEY: "lc", OPENAI_API_KEY: "o" })).toBe(true);
    expect(isLcAlignmentConfigured({ OPENAI_API_KEY: "o" })).toBe(false);
  });
});
