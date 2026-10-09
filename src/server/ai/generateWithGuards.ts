import { sanitizeQuizPayloadVisuals } from "../quizPayloadSanitizer.ts";
import { repairQuizStructure } from "../quizPayloadStructureRepair.ts";
import { applyQuestionVisualReconcilers } from "../../utils/reconcileVisualFromStem.ts";
import { normalizeRemedialDeck } from "../../utils/remedialDeck.ts";
import {
  getDefaultProviderForTask,
  isFallbackEnabled,
  resolveDefaultModel,
  resolveProviderTimeoutMs,
  withProviderTimeout,
} from "./config.ts";
import { callGeminiProvider } from "./geminiProvider.ts";
import { callOpenAIProvider } from "./openaiProvider.ts";
import type { AiTask, GenerateRequest, GenerateResponse, ProviderName } from "./types.ts";

/**
 * Hard-fail-only validator. Triggers the strict-retry chain in
 * generateWithGuards. Reserved for things a regeneration can fix —
 * structural shape, missing options, bad answer index. Visual-only
 * issues are handled by sanitizeQuizPayloadVisuals (soft-fail) so we
 * don't pay 30-50s of retry latency for what is purely a presentation
 * problem the renderer can simply skip.
 */
const validateQuizPayload = (payload: any): { ok: boolean; error?: string } => {
  if (!payload || !Array.isArray(payload.questions) || payload.questions.length === 0) {
    return { ok: false, error: "Quiz response missing questions array." };
  }

  for (const [index, question] of payload.questions.entries()) {
    if (!Array.isArray(question.options) || question.options.length !== 4) {
      return { ok: false, error: `Question ${index + 1} must contain exactly 4 options.` };
    }
    if (
      typeof question.correctAnswerIndex !== "number" ||
      question.correctAnswerIndex < 0 ||
      question.correctAnswerIndex > 3
    ) {
      return { ok: false, error: `Question ${index + 1} has invalid correctAnswerIndex.` };
    }
  }

  return { ok: true };
};

/** Runs after `repairIfSlides`, so only a deck with no usable slide at all fails. */
const validateSlidePayload = (payload: any): { ok: boolean; error?: string } => {
  if (!payload || !Array.isArray(payload.slides) || payload.slides.length === 0) {
    return { ok: false, error: "Slides response missing slides array." };
  }
  return { ok: true };
};

const validateAnalysisPayload = (payload: any): { ok: boolean; error?: string } => {
  if (!payload?.standardCode || !Array.isArray(payload.identifiedGaps)) {
    return { ok: false, error: "Analysis response missing required fields." };
  }
  return { ok: true };
};

const cleanJsonResponse = (text: string): string => {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return text.substring(start, end + 1);
  }
  return text.trim();
};

const validateStructuredText = (
  task: AiTask,
  text: string | null
): { ok: boolean; error?: string } => {
  if (task === "image") return { ok: true };
  if (task === "vision") return { ok: true };
  if (!text) return { ok: false, error: "Empty text response from model." };
  let parsed: any;
  try {
    parsed = JSON.parse(cleanJsonResponse(text));
  } catch {
    return { ok: false, error: "Model did not return valid JSON." };
  }

  if (task === "quiz") return validateQuizPayload(parsed);
  if (task === "analysis") return validateAnalysisPayload(parsed);
  if (task === "slides") return validateSlidePayload(parsed);
  return { ok: true };
};

const createStricterContents = (originalContents: any, task: AiTask): any => {
  const strictTail = "\n\nSTRICT MODE: Return valid JSON only matching schema exactly.";

  if (typeof originalContents === "string") {
    return `${originalContents}${strictTail}`;
  }
  if (originalContents?.parts && Array.isArray(originalContents.parts)) {
    return {
      ...originalContents,
      parts: [...originalContents.parts, { text: strictTail }],
    };
  }
  return originalContents;
};

const resolveProviderAndModel = (request: GenerateRequest): { provider: ProviderName; model: string } => {
  const provider =
    request.provider && request.provider !== "auto"
      ? request.provider
      : getDefaultProviderForTask(request.task);
  const model = request.model || resolveDefaultModel(request.task, provider);
  return { provider, model };
};

const runProvider = async (
  provider: ProviderName,
  request: GenerateRequest,
  model: string
): Promise<GenerateResponse> => {
  const timeoutMs = resolveProviderTimeoutMs(request.task);
  const label = `${provider} ${request.task} (${model})`;

  if (provider === "openai") {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY is not configured.");
    return withProviderTimeout(
      callOpenAIProvider(key, request, model),
      timeoutMs,
      label
    );
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not configured.");
  return withProviderTimeout(
    callGeminiProvider(key, request, model),
    timeoutMs,
    label
  );
};

export const generateWithGuards = async (request: GenerateRequest): Promise<GenerateResponse> => {
  const { provider, model } = resolveProviderAndModel(request);
  const fallbackProvider: ProviderName = provider === "gemini" ? "openai" : "gemini";
  const fallbackEnabled = request.metadata?.disableFallback ? false : isFallbackEnabled();

  /**
   * Quiz post-processing pipeline. Runs in this order so the user only ever
   * sees a hard error when nothing usable came back:
   *   1. Structural repair (pad/trim options, clamp correctAnswerIndex,
   *      drop unrecoverable questions). Replaces what used to be hard
   *      "Question N must contain exactly 4 options" failures that ate
   *      15-45s of strict-retry + provider-fallback latency.
   *   2. Visual sanitization (strip bad visualSpec / imagePrompt without
   *      invalidating the question — wrong picture should not waste an AI
   *      call).
   * Both passes are non-throwing and mutate the parsed payload in place,
   * then re-serialize back into resp.text so downstream validators see the
   * cleaned-up version.
   */
  const sanitizeIfQuiz = (resp: GenerateResponse): GenerateResponse => {
    if (request.task !== "quiz" || !resp.text) return resp;
    try {
      const parsed = JSON.parse(cleanJsonResponse(resp.text));
      const metaCode =
        typeof request.metadata?.standardCode === "string"
          ? request.metadata.standardCode.trim()
          : "";
      if (metaCode && (!parsed.standardCode || !String(parsed.standardCode).trim())) {
        parsed.standardCode = metaCode;
      }
      const { warnings: structureWarnings } = repairQuizStructure(parsed);
      if (structureWarnings.length > 0) {
        console.warn(
          `[quiz-structure-repair] applied ${structureWarnings.length} repair(s) without retry:`,
          structureWarnings
        );
      }
      if (Array.isArray(parsed.questions)) {
        for (const question of parsed.questions) {
          if (!question || typeof question !== "object") continue;
          applyQuestionVisualReconcilers(question);
        }
      }
      const { warnings: visualWarnings } = sanitizeQuizPayloadVisuals(parsed);
      if (visualWarnings.length > 0) {
        console.warn(
          `[quiz-sanitize] stripped ${visualWarnings.length} visual issue(s) without retry:`,
          visualWarnings
        );
      }
      resp.text = JSON.stringify(parsed);
    } catch {
      // If text is not parseable JSON, validateStructuredText below will catch it.
    }
    return resp;
  };

  const repairIfSlides = (resp: GenerateResponse): GenerateResponse => {
    if (request.task !== "slides" || !resp.text) return resp;
    try {
      const slides = normalizeRemedialDeck(JSON.parse(cleanJsonResponse(resp.text)));
      resp.text = JSON.stringify({ slides });
    } catch {
      // If text is not parseable JSON, validateStructuredText below will catch it.
    }
    return resp;
  };

  const repair = (resp: GenerateResponse): GenerateResponse => repairIfSlides(sanitizeIfQuiz(resp));

  const attemptOnce = async (currentProvider: ProviderName, currentModel: string, withStrictRetry = true) => {
    const initial = await runProvider(currentProvider, request, currentModel);
    console.log(`[attemptOnce] provider=${currentProvider} model=${currentModel} text length=${initial.text?.length}`);
    // Repair FIRST so structural fixes run before validation rejects.
    // Avoids the strict-retry chain when AI emits 3 or 5 options instead of
    // 4 — repair pads/trims and the validator then sees a clean payload.
    const sanitized = repair(initial);
    const validation = validateStructuredText(request.task, sanitized.text);
    if (!validation.ok) {
      console.warn(`[attemptOnce] validation failed:`, validation.error);
      console.log(`[attemptOnce] problematic text:`, sanitized.text);
    }
    if (validation.ok || request.task === "image") return sanitized;

    if (!withStrictRetry || request.metadata?.disableStrictRetry) {
      throw new Error(validation.error || "Validation failed.");
    }

    const strictReq: GenerateRequest = {
      ...request,
      contents: createStricterContents(request.contents, request.task),
    };
    const strictAttempt = await runProvider(currentProvider, strictReq, currentModel);
    const strictSanitized = repair(strictAttempt);
    const strictValidation = validateStructuredText(request.task, strictSanitized.text);
    if (!strictValidation.ok) {
      throw new Error(strictValidation.error || "Validation failed after strict retry.");
    }
    return strictSanitized;
  };

  try {
    return await attemptOnce(provider, model);
  } catch (primaryError) {
    if (!fallbackEnabled) throw primaryError;
    const fallbackModel = resolveDefaultModel(request.task, fallbackProvider);
    return attemptOnce(fallbackProvider, fallbackModel, false);
  }
};
