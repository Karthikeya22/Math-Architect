import type { AiTask, ProviderName } from "./types.ts";

const OPENAI_DEFAULT_MODELS: Record<AiTask, string> = {
  quiz: "gpt-5.4",
  analysis: "gpt-5.4-mini",
  slides: "gpt-5.5",
  image: "gpt-image-2",
  vision: "gpt-5.4-mini",
  figure_brief: "gpt-5.4-mini",
};

const GEMINI_DEFAULT_MODELS: Record<AiTask, string> = {
  quiz: "gemini-3-flash-preview",
  analysis: "gemini-3-flash-preview",
  slides: "gemini-3-flash-preview",
  image: "gemini-2.5-flash-image",
  vision: "gemini-3-flash-preview",
  figure_brief: "gemini-3-flash-preview",
};

const envValue = (env: NodeJS.ProcessEnv, key: string): string => String(env[key] || "").trim();

/**
 * Per-task model, resolved at call time so `.env` changes apply after a restart without import-order issues.
 * OpenAI precedence: `OPENAI_<TASK>_MODEL`, then `OPENAI_TEXT_MODEL` / `OPENAI_IMAGE_MODEL`, then the built-in default.
 */
export const resolveDefaultModel = (
  task: AiTask,
  provider: ProviderName,
  env: NodeJS.ProcessEnv = process.env,
): string => {
  if (provider === "openai") {
    const perTask = envValue(env, `OPENAI_${task.toUpperCase()}_MODEL`);
    if (perTask) return perTask;
    const family = envValue(env, task === "image" ? "OPENAI_IMAGE_MODEL" : "OPENAI_TEXT_MODEL");
    return family || OPENAI_DEFAULT_MODELS[task];
  }
  const family = envValue(env, task === "image" ? "GEMINI_IMAGE_MODEL" : "GEMINI_TEXT_MODEL");
  return family || GEMINI_DEFAULT_MODELS[task];
};

export const isFallbackEnabled = (env: NodeJS.ProcessEnv = process.env) =>
  (env.AI_FALLBACK_ENABLED || "false").toLowerCase() === "true";

export const resolveProviderTimeoutMs = (task: AiTask): number => {
  if (task === "quiz" || task === "slides") {
    const raw = process.env.GENAI_QUIZ_TIMEOUT_MS ?? process.env.GENAI_PROVIDER_TIMEOUT_MS;
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return n;
    return 300_000;
  }
  if (task === "image") {
    const imageRaw = process.env.GENAI_IMAGE_TIMEOUT_MS ?? process.env.GENAI_PROVIDER_TIMEOUT_MS;
    const imageN = Number(imageRaw);
    if (Number.isFinite(imageN) && imageN > 0) return imageN;
    return 180_000;
  }
  const raw = process.env.GENAI_PROVIDER_TIMEOUT_MS;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 120_000;
};

export const withProviderTimeout = async <T>(
  promise: Promise<T>,
  ms: number,
  label: string
): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`${label} timed out after ${ms}ms`)),
          ms
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

export const getDefaultProviderForTask = (
  task: AiTask,
  env: NodeJS.ProcessEnv = process.env,
): ProviderName => {
  const byTask = {
    quiz: env.AI_PROVIDER_QUIZ,
    analysis: env.AI_PROVIDER_ANALYSIS,
    slides: env.AI_PROVIDER_SLIDES,
    image: env.AI_PROVIDER_IMAGES,
    vision: env.AI_PROVIDER_VISION ?? env.AI_PROVIDER_ANALYSIS,
    figure_brief: env.AI_PROVIDER_VISION ?? env.AI_PROVIDER_ANALYSIS,
  }[task];
  if (String(byTask || "").trim().toLowerCase() === "gemini") return "gemini";
  return "openai";
};
