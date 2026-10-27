import { Provider, type ModelOverride } from "@learning-commons/evaluators";

export type LcEvalMode = "off" | "shadow" | "fail";

const envValue = (env: NodeJS.ProcessEnv, key: string): string =>
  String(env[key] || "").trim();

export const resolveLcEvalMode = (env: NodeJS.ProcessEnv = process.env): LcEvalMode => {
  const raw = envValue(env, "LC_EVAL_MODE").toLowerCase();
  if (raw === "off" || raw === "fail" || raw === "shadow") return raw;
  return "shadow";
};

export const resolveLcAlignMinRatio = (env: NodeJS.ProcessEnv = process.env): number => {
  const n = Number(env.LC_ALIGN_MIN_RATIO);
  if (Number.isFinite(n) && n >= 0 && n <= 1) return n;
  return 0.5;
};

export const isLcGraphicsEnabled = (env: NodeJS.ProcessEnv = process.env): boolean =>
  envValue(env, "LC_GRAPHICS_ENABLED").toLowerCase() !== "false";

export const resolveLearningCommonsApiKey = (env: NodeJS.ProcessEnv = process.env): string =>
  envValue(env, "LEARNING_COMMONS_API_KEY");

export const resolveAnthropicApiKey = (env: NodeJS.ProcessEnv = process.env): string =>
  envValue(env, "ANTHROPIC_API_KEY");

export const resolveOpenAiApiKey = (env: NodeJS.ProcessEnv = process.env): string =>
  envValue(env, "OPENAI_API_KEY");

/** Graphics Accuracy SDK expects googleApiKey; reuse GEMINI_API_KEY when GOOGLE_API_KEY is unset. */
export const resolveGoogleApiKey = (env: NodeJS.ProcessEnv = process.env): string =>
  envValue(env, "GOOGLE_API_KEY") || envValue(env, "GEMINI_API_KEY");

/**
 * Math Standards Alignment defaults to Anthropic (validated). Prefer that when present;
 * otherwise override to OpenAI or Gemini so the platform can run without an Anthropic key.
 * LC notes non-default models may be less accurate.
 */
export type LcAlignLlmConfig = {
  anthropicApiKey?: string;
  openaiApiKey?: string;
  googleApiKey?: string;
  modelOverride?: ModelOverride;
  label: string;
};

export const resolveLcAlignLlm = (env: NodeJS.ProcessEnv = process.env): LcAlignLlmConfig | null => {
  const prefer = envValue(env, "LC_ALIGN_PROVIDER").toLowerCase(); // anthropic|openai|gemini|google
  const overrideModel = envValue(env, "LC_ALIGN_MODEL");
  const anthropic = resolveAnthropicApiKey(env);
  const openai = resolveOpenAiApiKey(env);
  const google = resolveGoogleApiKey(env);

  const useAnthropic = () =>
    anthropic
      ? { anthropicApiKey: anthropic, label: "anthropic-default" }
      : null;
  const useOpenAi = () =>
    openai
      ? {
          openaiApiKey: openai,
          modelOverride: {
            provider: Provider.OpenAI,
            model:
              overrideModel ||
              envValue(env, "OPENAI_ANALYSIS_MODEL") ||
              envValue(env, "OPENAI_TEXT_MODEL") ||
              "gpt-5.4-mini",
          },
          label: "openai-override",
        }
      : null;
  const useGoogle = () =>
    google
      ? {
          googleApiKey: google,
          modelOverride: {
            provider: Provider.Google,
            model: overrideModel || envValue(env, "GEMINI_TEXT_MODEL") || "gemini-3-flash-preview",
          },
          label: "gemini-override",
        }
      : null;

  if (prefer === "anthropic") return useAnthropic();
  if (prefer === "openai") return useOpenAi() || useAnthropic() || useGoogle();
  if (prefer === "gemini" || prefer === "google") return useGoogle() || useAnthropic() || useOpenAi();

  // Platform default is Gemini-first; keep OpenAI as last resort so a stale key
  // does not win over a working GEMINI_API_KEY.
  return useAnthropic() || useGoogle() || useOpenAi();
};

export const isLcAlignmentConfigured = (env: NodeJS.ProcessEnv = process.env): boolean =>
  Boolean(resolveLearningCommonsApiKey(env) && resolveLcAlignLlm(env));

export const isLcGraphicsConfigured = (env: NodeJS.ProcessEnv = process.env): boolean =>
  Boolean(resolveGoogleApiKey(env));
