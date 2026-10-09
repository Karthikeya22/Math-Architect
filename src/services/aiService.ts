import { fetchQuestionMaterials } from './questionMaterialsService';
import { enforceStrictRewriteGrounding } from '../utils/strictRewriteGrounding';
import { buildAnalysisAttemptRows, buildQuestionDiagnostics, buildRoleAwareActions } from '../utils/analysisDiagnostics';
import { buildFigureHints } from '../utils/buildFigureHints';
import { normalizeQuizMathCopy } from '../utils/normalizeQuizMathCopy';
import { normalizeVisualSpec } from '../utils/visualSpec';
import { applyQuestionVisualReconcilers } from '../utils/reconcileVisualFromStem';
import { prepareQuestionVisualFields, renderPreparedDeterministicVisual } from '../utils/prepareQuestionVisual';
import { getPreferredVisualPolicy } from '../utils/standardVisualPreferences';
import { buildGeoGebraCommandsFromQuestion } from '../utils/buildGeoGebraCommandsFromQuestion';
import { generateGeoGebraImage, isGeoGebraVisualsEnabled } from './geogebraService';
import { REMEDIAL_DECK_SCHEMA, buildMissedQuestionDigest, buildRemedialDeckPrompt, normalizeRemedialDeck } from '../utils/remedialDeck';
import type { RemedialSlide, SolutionStep } from '../types';

type Schema = Record<string, any>;

const normalizeSolutionSteps = (raw: unknown): SolutionStep[] | undefined => {
  if (!Array.isArray(raw)) return undefined;
  const steps = raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      const title = normalizeQuizMathCopy(String(row.title || '')).trim();
      const body = normalizeQuizMathCopy(String(row.body || '')).trim();
      if (!title || !body) return null;
      const visualSpec = normalizeVisualSpec(row.visualSpec);
      return visualSpec ? { title, body, visualSpec } : { title, body };
    })
    .filter((step) => step !== null) as SolutionStep[];
  return steps.length >= 2 ? steps.slice(0, 5) : undefined;
};

type AiTask = "quiz" | "analysis" | "slides" | "image" | "vision";
type AiProvider = "gemini" | "openai" | "auto";

type GeneratePayload = {
  task: AiTask;
  provider?: AiProvider;
  model?: string;
  contents: any;
  config?: any;
  metadata?: Record<string, any>;
};

const Type = {
  OBJECT: "OBJECT",
  STRING: "STRING",
  ARRAY: "ARRAY",
  INTEGER: "INTEGER",
  NUMBER: "NUMBER",
  BOOLEAN: "BOOLEAN",
} as const;

const sourcePolicyPromptBlock = (sourcePolicy: string, retrievedCount: number): string => {
  if (sourcePolicy === "strict_rewrite_only") {
    return `
    **SOURCE POLICY (strict_rewrite_only):**
    - Every question must have sourceType "rewrite" or "bank" (never "novel").
    - When retrieved material count is ${retrievedCount} and greater than zero, each question MUST set providerItemId and sourceProvider to match one of the RETRIEVED MATERIALS rows exactly (same provider label and provider item id).
    - Stems and distractors are still authored by you, but must be faithful rewrites grounded in those materials (same skill intent, different surface wording).
    - Explanations use vocabulary and sentence length appropriate for TARGET AUDIENCE.
    - If retrieved material count is zero, use sourceType "rewrite", sourceProvider "NONE", and providerItemId "n/a", staying tightly aligned to the standard description only.`;
  }
  if (sourcePolicy === "ai_freedom") {
    return `
    **SOURCE POLICY (ai_freedom):**
    - Novel items are allowed; still prefer retrieved materials when they clearly fit.
    - Set sourceType to reflect provenance: "novel" when not grounded on a listed row.`;
  }
  return `
    **SOURCE POLICY (mixed_with_limits):**
    - Prefer "rewrite" or "bank" when a retrieved row clearly applies; cite providerItemId and sourceProvider.
    - Use "novel" only when the bank does not cover the sub-skill needed; keep standard-aligned.`;
};

const STRICT_REWRITE_RETRY_TAIL = `
    GROUNDING_RETRY (previous JSON failed validation):
    - Set sourceType to "rewrite" or "bank" only (never "novel").
    - Set sourceProvider and providerItemId to EXACTLY match one line from RETRIEVED MATERIALS (same spelling as the [PROVIDER] and id=... tokens in that list; trim only surrounding whitespace).
`;

const questionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    text: { type: Type.STRING },
    options: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Must contain exactly 4 options",
    },
    correctAnswerIndex: { type: Type.INTEGER, description: "0-3" },
    explanation: { type: Type.STRING },
    solutionSteps: {
      type: Type.ARRAY,
      description:
        "3-5 student-facing solution steps with title, body, and optional visualSpec for intermediate figure states. Do not reveal the final answer in step 1. feedbackGuidance is for teachers only.",
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          body: { type: Type.STRING },
          visualSpec: {
            type: Type.OBJECT,
            properties: {
              visualType: { type: Type.STRING },
              values: { type: Type.ARRAY, items: { type: Type.INTEGER } },
              shapeName: { type: Type.STRING },
              shapes: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
          },
        },
        required: ["title", "body"],
      },
    },
    animationDescription: { type: Type.STRING },
    visualIntent: {
      type: Type.STRING,
      description:
        "One sentence: what the student should look at in the figure to solve the question.",
    },
    figureHints: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        "When a visual is required: 1-3 short imperative lines for students on how to read the figure. Never reveal counts, totals, or the correct option.",
    },
    visualSpec: {
      type: Type.OBJECT,
      description:
        "Optional backup drawing for countable models only: ten_frame, number_line, fraction_bar, array_model, area_model, fraction_circle, bar_model, clock_face, line_plot, table, bar_chart—each with the fields required for that visualType.",
      properties: {
        visualType: { type: Type.STRING },
        values: { type: Type.ARRAY, items: { type: Type.INTEGER } },
        shapeName: { type: Type.STRING },
        shapes: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
    },
    imagePrompt: {
      type: Type.STRING,
      description:
        "Optional one-sentence note to the figure designer about what the figure should show, using only facts from the stem. Never the answer or the correct option.",
    },
    difficulty: {
      type: Type.STRING,
      enum: ["Easy", "Medium", "Hard"],
      description: "The difficulty level of this specific question",
    },
    sourceType: {
      type: Type.STRING,
      enum: ["bank", "rewrite", "novel"],
      description: "Question provenance for telemetry.",
    },
    sourceProvider: {
      type: Type.STRING,
      description: "Provider for grounded questions, e.g. IXL or CPALMS_MFAS.",
    },
    providerItemId: {
      type: Type.STRING,
      description: "Provider-native item id used as retrieval evidence when grounded.",
    },
    generatedByAi: {
      type: Type.BOOLEAN,
      description: "Whether this question text was generated by AI.",
    },
    promptVersion: { type: Type.STRING },
    feedbackGuidance: {
      type: Type.OBJECT,
      properties: {
        misconceptionSignal: { type: Type.STRING },
        strategyTip: { type: Type.STRING },
        tieredNextStep: { type: Type.STRING },
      },
    },
  },
  required: [
    "id",
    "text",
    "options",
    "correctAnswerIndex",
    "explanation",
    "animationDescription",
    "difficulty",
  ],
};

/** Client + per-attempt ceiling for quiz image generation (OpenAI raster is often 30–90s). */
const resolveImageClientTimeoutMs = (): number => {
  const raw = (typeof import.meta.env?.VITE_IMAGE_GEN_TIMEOUT_MS === 'string'
    ? import.meta.env.VITE_IMAGE_GEN_TIMEOUT_MS
    : '') as string;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 120_000;
};

const resolveGenRequestTimeoutMs = (task: AiTask): number => {
  if (task === 'image') {
    return resolveImageClientTimeoutMs();
  }
  if (task === 'quiz' || task === 'slides') {
    const raw = (typeof import.meta.env?.VITE_QUIZ_GEN_TIMEOUT_MS === 'string'
      ? import.meta.env.VITE_QUIZ_GEN_TIMEOUT_MS
      : '') as string;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 360_000;
  }
  const raw = (typeof import.meta.env?.VITE_GENAI_REQUEST_TIMEOUT_MS === 'string'
    ? import.meta.env.VITE_GENAI_REQUEST_TIMEOUT_MS
    : '') as string;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 120_000;
};

const generateContentViaServerOnce = async (payload: GeneratePayload) => {
  const controller = new AbortController();
  const timeoutMs = resolveGenRequestTimeoutMs(payload.task);
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch("/api/genai/generate-content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(`AI service request timed out after ${timeoutMs}ms.`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    let message = `AI service request failed (HTTP ${res.status}).`;
    try {
      const data = await res.json();
      if (typeof data?.error === 'string' && data.error.trim()) {
        message = data.error.trim();
      }
    } catch {
      // Non-JSON error body — keep the HTTP status message above.
    }
    const err = new Error(message) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  return res.json();
};

const generateContentViaServer = async (payload: GeneratePayload) =>
  generateContentViaServerOnce(payload);

export type FigureStatus = 'verified' | 'unverified' | 'rejected' | 'skipped' | 'error';

export type FigureResponse = {
  status: FigureStatus;
  image?: string;
  attempts: number;
  issues: string[];
};

const FIGURE_STATUSES: readonly FigureStatus[] = ['verified', 'unverified', 'rejected', 'skipped', 'error'];

/** Brief + up to two renders + two vision checks, so this is well above a single image call. */
const resolveFigureClientTimeoutMs = (): number => {
  const raw = (typeof import.meta.env?.VITE_FIGURE_TIMEOUT_MS === 'string'
    ? import.meta.env.VITE_FIGURE_TIMEOUT_MS
    : '') as string;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 300_000;
};

/** Never throws: transport failures come back as `status: 'error'` so callers pick a fallback. */
export const requestFigure = async (
  path: '/api/figures/question' | '/api/figures/slide',
  body: unknown,
): Promise<FigureResponse> => {
  const controller = new AbortController();
  const timeoutMs = resolveFigureClientTimeoutMs();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data: any = await res.json().catch(() => null);
    if (!res.ok || !data || !FIGURE_STATUSES.includes(data.status)) {
      const message = typeof data?.error === 'string' && data.error.trim()
        ? data.error.trim()
        : `Figure request failed (HTTP ${res.status}).`;
      return { status: 'error', attempts: 0, issues: [message] };
    }
    return {
      status: data.status,
      image: typeof data.image === 'string' && data.image.startsWith('data:image/') ? data.image : undefined,
      attempts: Number.isFinite(Number(data.attempts)) ? Number(data.attempts) : 0,
      issues: Array.isArray(data.issues) ? data.issues.map(String) : [],
    };
  } catch (error) {
    const message = error instanceof DOMException && error.name === 'AbortError'
      ? `Figure request timed out after ${timeoutMs}ms.`
      : error instanceof Error ? error.message : String(error);
    return { status: 'error', attempts: 0, issues: [message] };
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Each figure is a brief, one or two gpt-image renders and a vision check on
 * the server, so a modest fan-out keeps the OpenAI image rate limit happy.
 */
const FIGURE_CONCURRENCY = (() => {
  const raw = (typeof import.meta.env?.VITE_FIGURE_CONCURRENCY === 'string'
    ? import.meta.env.VITE_FIGURE_CONCURRENCY
    : '') as string;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 1 && n <= 16 ? Math.floor(n) : 6;
})();

const runWithConcurrency = async <T,>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<void>,
): Promise<void> => {
  if (items.length === 0) return;
  const cap = Math.max(1, Math.min(limit, items.length));
  let next = 0;
  const workers = Array.from({ length: cap }, async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      await fn(items[i], i);
    }
  });
  await Promise.all(workers);
};

const runWithConcurrencyMap = async <T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> => {
  const results = new Array<R>(items.length);
  await runWithConcurrency(items, limit, async (item, index) => {
    results[index] = await fn(item, index);
  });
  return results;
};

export const generateQuiz = async (standard: any, config: any): Promise<any> => {
  // Per-stage timing instrumented to console.info so the next slow run prints
  // exact wall-clock breakdown. Cheap (one log line per stage) and only on the
  // happy path. Read in DevTools → Console as `[quiz-timing] …`.
  const t0 = performance.now();
  const stage = (label: string, since: number) => {
    const ms = Math.round(performance.now() - since);
    console.info(`[quiz-timing] ${label}: ${ms}ms`);
    return performance.now();
  };

  const countToGenerate = config.questionCount;
  const configuredBatchSize = Number(
    (typeof import.meta.env?.VITE_QUIZ_TEXT_BATCH_SIZE === 'string'
      ? import.meta.env.VITE_QUIZ_TEXT_BATCH_SIZE
      : '') as string,
  );
  const quizTextBatchSize = Math.max(
    1,
    Math.min(
      countToGenerate,
      Number.isFinite(configuredBatchSize) && configuredBatchSize > 0
        ? Math.floor(configuredBatchSize)
        : Math.min(3, countToGenerate),
    ),
  );
  const configuredBatchConcurrency = Number(
    (typeof import.meta.env?.VITE_QUIZ_TEXT_BATCH_CONCURRENCY === 'string'
      ? import.meta.env.VITE_QUIZ_TEXT_BATCH_CONCURRENCY
      : '') as string,
  );
  const quizTextBatchConcurrency = Math.max(
    1,
    Math.min(
      4,
      Number.isFinite(configuredBatchConcurrency) && configuredBatchConcurrency > 0
        ? Math.floor(configuredBatchConcurrency)
        : 3,
    ),
  );
  const promptVersion = 'adaptive-v1';
  const sourcePolicy = config.sourcePolicy || 'mixed_with_limits';
  const adaptiveLabel = config.adaptiveEnabled
    ? `Enabled (${config.adaptivePolicy || 'hybrid_guardrails'})`
    : 'Disabled';
  const contextClarifications = (standard.clarifications || []).slice(0, 4).join('\n- ');
  const contextPurpose = (standard.purposeAndStrategies || []).slice(0, 4).join('\n- ');
  const contextMisconceptions = (standard.misconceptions || []).slice(0, 4).join('\n- ');
  const contextTieredInstruction = (standard.tieredInstruction || []).slice(0, 4).join('\n- ');

  // ai_freedom never reads question_materials, so the call is pure latency.
  // Skip it; otherwise issue the fetch immediately so it overlaps the rest of
  // prompt prep (catch-all to empty so we never hard-fail on a missing bank).
  const tMaterials = performance.now();
  const materialsPromise =
    sourcePolicy === 'ai_freedom'
      ? Promise.resolve({ standardId: standard.code, materials: [] as any[] })
      : fetchQuestionMaterials({
          standardCode: standard.code,
          grade: standard.grade,
          limit: 10,
        }).catch(() => ({ standardId: standard.code, materials: [] as any[] }));

  const retrievedMaterials = await materialsPromise;
  stage(`materials fetch (${retrievedMaterials.materials.length} rows)`, tMaterials);
  const materialContext = retrievedMaterials.materials
    .slice(0, 6)
    .map(
      (material: any, idx: number) =>
        `${idx + 1}. [${material.provider}] id=${material.provider_item_id} title=${material.title} hint=${material.difficulty_hint || 'Medium'} desc=${material.description || ''}`
    )
    .join('\n');

  const visualPolicy = getPreferredVisualPolicy(standard.code);
  const visualPolicyBlock = visualPolicy.preferredTypes.length
    ? `- For ${standard.code}, a visualSpec must use one of: ${visualPolicy.preferredTypes.join(', ')}.`
    : '';

  const buildQuizPrompt = (
    retryExtra: string,
    policyForThisPass: string,
    questionsInBatch: number,
    batchStartIndex: number,
  ) => `
    You are an expert K-12 Mathematics Standards curriculum designer.

    TARGET AUDIENCE: ${standard.grade} Student
    SUBJECT: Mathematics

    Create ${questionsInBatch} multiple-choice question(s) for:
    Topic/Standard: ${standard.code}
    Description: ${standard.description}

    STANDARD CONTEXT:
    Clarifications:
    - ${contextClarifications || 'None provided'}
    Purpose And Strategies:
    - ${contextPurpose || 'None provided'}
    Common Misconceptions:
    - ${contextMisconceptions || 'None provided'}
    Tiered Instruction Supports:
    - ${contextTieredInstruction || 'None provided'}

    **CONFIGURATION:**
    - Difficulty: ${config.difficulty}
    - Count: ${questionsInBatch}
    - Batch: questions ${batchStartIndex + 1}-${batchStartIndex + questionsInBatch} of ${countToGenerate} total
    - Adaptive Mode: ${adaptiveLabel}
    - Adaptive Start Difficulty: ${config.startDifficulty || config.difficulty}
    - Source Policy: ${policyForThisPass}
    - Prompt Version: ${promptVersion}
    - Retrieved Material Count: ${retrievedMaterials.materials.length}

    RETRIEVED MATERIALS (grounding context):
    ${materialContext || 'No retrieved materials available for this standard.'}

    ${sourcePolicyPromptBlock(policyForThisPass, retrievedMaterials.materials.length)}

    **CRITICAL CONSISTENCY RULES:**
    1. Option coherence: correct answer must be in options.
    2. Distractors should be plausible student mistakes grounded in misconceptions when available.
    3. Grade-level safety and curriculum alignment are mandatory.
    4. Include feedbackGuidance fields for each question (teacher/diagnostic only — not shown to students).
    5. Prefer using retrieved materials whenever possible; cite sourceProvider/providerItemId when grounded.
    6. Set sourceType for each question according to source policy.
    7. If sourceType is "bank", generatedByAi should be "false". Otherwise use "true".
    8. Explanations: vocabulary and length must match TARGET AUDIENCE (${standard.grade}); avoid jargon above that band.
    9. Include solutionSteps (3-5 items): each has a short title and body that walks a ${standard.grade} student through solving the problem step by step. Use visualSpec on steps when a partial figure helps (e.g. count one group before showing both). Step bodies must not name the correct option letter until the final step.

    **VISUAL RULES:**
    A separate figure designer draws each question's picture from the question text alone, so the stem must state every quantity, label and position the picture needs.
    - visualIntent: one sentence on what the student should look at in the figure.
    - figureHints: 1-3 short imperative lines on how a ${standard.grade} student reads the figure. Never reveal counts, totals or the correct option.
    - imagePrompt (optional): one sentence on what the figure should show, using only facts from the stem.
    - visualSpec (optional): only for countable models (ten_frame, fraction_bar, fraction_circle, array_model, number_line, bar_chart, line_plot, table); it is a backup drawing, so its numbers must match the stem exactly.
    ${visualPolicyBlock}
    ${retryExtra}

    Return JSON matching schema exactly.
  `;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      standardCode: { type: Type.STRING },
      questions: { type: Type.ARRAY, items: questionSchema },
    },
    required: ["standardCode", "questions"],
  };

  const normalizeQuizQuestions = (parsed: any) =>
    (parsed.questions || []).map((question: any, idx: number) => {
      const normalized = {
        ...question,
        text: normalizeQuizMathCopy(String(question.text || '')),
        options: Array.isArray(question.options)
          ? question.options.map((option: unknown) => normalizeQuizMathCopy(String(option ?? '')))
          : question.options,
        explanation: normalizeQuizMathCopy(String(question.explanation || '')),
        solutionSteps: normalizeSolutionSteps(question.solutionSteps),
        id: question.id || `${standard.code}-${idx + 1}`,
        sourceType: question.sourceType || 'novel',
        sourceProvider: question.sourceProvider || 'UNKNOWN',
        providerItemId: question.providerItemId || '',
        generatedByAi: typeof question.generatedByAi === 'boolean' ? question.generatedByAi : true,
        promptVersion: question.promptVersion || promptVersion,
        imagePrompt: typeof question.imagePrompt === 'string' ? question.imagePrompt : '',
        visualIntent: typeof question.visualIntent === 'string' ? question.visualIntent : '',
        visualSpec: normalizeVisualSpec(question.visualSpec),
        feedbackGuidance: {
          misconceptionSignal: question.feedbackGuidance?.misconceptionSignal || '',
          strategyTip: question.feedbackGuidance?.strategyTip || '',
          tieredNextStep: question.feedbackGuidance?.tieredNextStep || '',
        },
      };
      applyQuestionVisualReconcilers(normalized);
      const hintQuestion = {
        text: normalized.text,
        visualSpec: normalized.visualSpec,
        visualIntent: normalized.visualIntent,
        options: normalized.options,
        correctAnswerIndex: normalized.correctAnswerIndex,
      };
      const figureHints = buildFigureHints(hintQuestion, standard.grade);
      return {
        ...normalized,
        figureHints,
      };
    });

  let response: any;
  let parsed: any;
  let normalizedQuestions: any[] = [];

  const tQuiz = performance.now();

  /**
   * Effective policy used for the current pass. Starts as the user-selected
   * `sourcePolicy`; if pass 0 fails strict-rewrite grounding, pass 1
   * downgrades to `mixed_with_limits` rather than burning another strict
   * pass that empirically tends to fail the same way. This trades a
   * "Rewrite Only mode: question N ..." hard error (10-30s wasted) for a
   * working quiz the user can immediately use, with the downgrade surfaced
   * in `providerMetadata` for observability.
   */
  let effectiveSourcePolicy = sourcePolicy;
  let sourcePolicyDowngradeReason: string | null = null;

  for (let pass = 0; pass < 2; pass++) {
    const useStrictRetryTail =
      pass > 0 && effectiveSourcePolicy === "strict_rewrite_only" && retrievedMaterials.materials.length > 0;
    const retryExtra = useStrictRetryTail ? STRICT_REWRITE_RETRY_TAIL : "";
    normalizedQuestions = [];
    const batchJobs: Array<{ batchStart: number; questionsInBatch: number }> = [];
    for (let batchStart = 0; batchStart < countToGenerate; batchStart += quizTextBatchSize) {
      batchJobs.push({
        batchStart,
        questionsInBatch: Math.min(quizTextBatchSize, countToGenerate - batchStart),
      });
    }
    const batchResults = await runWithConcurrencyMap(
      batchJobs,
      quizTextBatchConcurrency,
      async ({ batchStart, questionsInBatch }) => {
        const prompt = buildQuizPrompt(
          retryExtra,
          effectiveSourcePolicy,
          questionsInBatch,
          batchStart,
        );
        const batchResponse = await generateContentViaServer({
          task: "quiz",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema,
          },
          metadata: {
            standardCode: standard.code,
            grade: standard.grade,
            adaptiveEnabled: Boolean(config.adaptiveEnabled),
            adaptivePolicy: config.adaptivePolicy || 'hybrid_guardrails',
            sourcePolicy: effectiveSourcePolicy,
            originalSourcePolicy: sourcePolicy,
            promptVersion,
            retrievedMaterialCount: retrievedMaterials.materials.length,
            strictRewritePass: pass,
            sourcePolicyDowngraded: effectiveSourcePolicy !== sourcePolicy,
            disableStrictRetry: true,
            // One provider call per batch — server structure repair handles bad JSON;
            // fallback can chain two 60–120s calls inside one HTTP request and trip the client timeout.
            disableFallback: true,
            quizBatchStart: batchStart,
            quizBatchCount: questionsInBatch,
          },
        });
        if (!batchResponse.text) throw new Error("No response from AI");
        const batchParsed = JSON.parse(batchResponse.text);
        return {
          batchStart,
          response: batchResponse,
          parsed: batchParsed,
          questions: normalizeQuizQuestions(batchParsed),
        };
      },
    );
    batchResults.sort((a, b) => a.batchStart - b.batchStart);
    response = batchResults[batchResults.length - 1]?.response;
    parsed = batchResults[batchResults.length - 1]?.parsed;
    for (const batch of batchResults) {
      normalizedQuestions.push(...batch.questions);
    }
    for (const q of normalizedQuestions) {
      applyQuestionVisualReconcilers(q);
    }
    try {
      enforceStrictRewriteGrounding(effectiveSourcePolicy, retrievedMaterials.materials, normalizedQuestions);
      break;
    } catch (err) {
      // Auto-downgrade: pass 0 of strict_rewrite_only that doesn't ground
      // gets one more attempt under mixed_with_limits, which has no
      // grounding requirement and is overwhelmingly more likely to succeed
      // than a second strict pass.
      if (
        pass === 0 &&
        effectiveSourcePolicy === "strict_rewrite_only" &&
        retrievedMaterials.materials.length > 0
      ) {
        const reason = err instanceof Error ? err.message : String(err);
        console.warn(
          `[strict-rewrite-downgrade] grounding failed on pass 0; downgrading to mixed_with_limits for pass 1 (reason: ${reason})`
        );
        effectiveSourcePolicy = "mixed_with_limits";
        sourcePolicyDowngradeReason = reason;
        break;
      }
      throw err;
    }
  }

  stage(`AI quiz call (${normalizedQuestions.length} questions, policy=${effectiveSourcePolicy})`, tQuiz);

  if (normalizedQuestions.length > 0) {
    const tImages = performance.now();
    const attachGeoGebraVisual = async (question: any): Promise<void> => {
      if (!isGeoGebraVisualsEnabled()) return;
      try {
        const ggbCommands = buildGeoGebraCommandsFromQuestion(question);
        if (!ggbCommands?.length) return;
        const ggbImage = await generateGeoGebraImage(ggbCommands);
        if (ggbImage) {
          question.geogebraImageBase64 = `data:image/png;base64,${ggbImage}`;
        }
      } catch {
        /* fall through — primary visual unchanged */
      }
    };

    const processQuestion = async (question: any) => {
      try {
        prepareQuestionVisualFields(question);
        question.visual = '';

        const figure = await requestFigure('/api/figures/question', {
          grade: standard.grade,
          standardCode: standard.code,
          question: {
            text: question.text,
            options: question.options,
            correctAnswerIndex: question.correctAnswerIndex,
            visualIntent: question.visualIntent,
            imagePrompt: question.imagePrompt,
          },
        });
        question.figureStatus = figure.status;
        question.figureIssues = figure.issues;

        if (figure.image && (figure.status === 'verified' || figure.status === 'unverified')) {
          question.generatedImageBase64 = figure.image;
          question.visualPath = figure.attempts > 1 ? 'openai_image_retry' : 'openai_image';
          return;
        }

        if (figure.status === 'skipped') {
          question.visualPath = 'figure_skipped';
          question.figureHints = [];
          return;
        }

        console.warn(
          `[figure] ${figure.status} for "${String(question.text || '').slice(0, 80)}": ${figure.issues.join(' | ')}`,
        );
        const fallbackSvg = renderPreparedDeterministicVisual(question);
        if (fallbackSvg) {
          question.visual = fallbackSvg;
          question.visualPath = 'fallback_svg';
          return;
        }
        question.visualPath = 'figure_rejected';
        question.figureHints = [];
      } finally {
        await attachGeoGebraVisual(question);
      }
    };

    await runWithConcurrency(normalizedQuestions, FIGURE_CONCURRENCY, processQuestion);
    stage(`figures (${normalizedQuestions.length} questions, concurrency=${FIGURE_CONCURRENCY})`, tImages);
  }
  stage('TOTAL generateQuiz', t0);

  return {
    standardCode: parsed.standardCode,
    questions: normalizedQuestions,
    config,
    providerMetadata: {
      provider: response.provider,
      model: response.model,
      usage: response.usage || {},
      promptVersion,
      sourcePolicy: effectiveSourcePolicy,
      originalSourcePolicy: sourcePolicy,
      sourcePolicyDowngraded: effectiveSourcePolicy !== sourcePolicy,
      sourcePolicyDowngradeReason,
    },
  };
};

export const analyzeGaps = async (standard: any, questions: any[], results: any[]): Promise<any> => {
  const attemptRows = buildAnalysisAttemptRows({
    standardCode: standard.code,
    questions,
    results,
  });
  const diagnostics = buildQuestionDiagnostics({
    standard,
    attemptRows,
  });

  const detailedAnalysis = attemptRows
    .map((row) => {
      const q = questions[row.questionIndex] ?? questions[row.attemptOrder - 1];
      return `Q${row.attemptOrder} [${row.difficultyPresented}]: ${q?.text || 'Unknown question'}\n(Selected: ${row.selectedOptionText}, Correct: ${Boolean(row.isCorrect)}, ErrorType: ${diagnostics[row.attemptOrder - 1]?.errorType || 'unknown'}, Misconception: ${diagnostics[row.attemptOrder - 1]?.misconception || 'none'})`;
    })
    .join("\n");

  const prompt = `
    Analyze student performance for Florida Standard ${standard.code}.
    Grade Level: ${standard.grade}
    Clarifications: ${(standard.clarifications || []).slice(0, 5).join(' | ') || 'N/A'}
    Purpose And Strategies: ${(standard.purposeAndStrategies || []).slice(0, 5).join(' | ') || 'N/A'}
    Common Misconceptions: ${(standard.misconceptions || []).slice(0, 5).join(' | ') || 'N/A'}
    Tiered Instruction: ${(standard.tieredInstruction || []).slice(0, 5).join(' | ') || 'N/A'}

    PERFORMANCE DATA:
    ${detailedAnalysis}

    Return JSON with:
    - identified gaps,
    - sub-skills,
    - confidence score,
    - summary.
  `;

  const gapSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      gapType: { type: Type.STRING, enum: ["Conceptual", "Procedural", "Computational", "Unknown"] },
      description: { type: Type.STRING },
      relatedQuestions: { type: Type.ARRAY, items: { type: Type.INTEGER } },
      misconception: { type: Type.STRING },
    },
    required: ["gapType", "description", "relatedQuestions"],
  };

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      standardCode: { type: Type.STRING },
      identifiedGaps: { type: Type.ARRAY, items: gapSchema },
      subSkills: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            correctCount: { type: Type.INTEGER },
            totalCount: { type: Type.INTEGER },
          },
        },
      },
      confidenceScore: { type: Type.INTEGER },
      summary: { type: Type.STRING },
    },
    required: ["standardCode", "identifiedGaps", "subSkills", "confidenceScore", "summary"],
  };

  const response = await generateContentViaServer({
    task: "analysis",
    contents: prompt,
    config: { responseMimeType: "application/json", responseSchema },
    metadata: {
      standardCode: standard.code,
      grade: standard.grade,
    },
  });

  if (!response.text) throw new Error("No response from AI");
  const parsed = JSON.parse(response.text);
  const roleAware = buildRoleAwareActions(diagnostics);
  return {
    ...parsed,
    attemptRows,
    questionDiagnostics: diagnostics,
    studentActions: roleAware.studentActions,
    teacherActions: roleAware.teacherActions,
    reliabilityFlags: roleAware.reliabilityFlags,
  };
};

export const generateRemedialSlides = async (
  standard: any,
  analysis: any,
  questions: any[] = [],
  results: any[] = [],
): Promise<RemedialSlide[]> => {
  const missed = buildMissedQuestionDigest(questions, results);
  const gapLabels = (analysis?.identifiedGaps || [])
    .map((gap: any) => String(gap?.description || '').trim())
    .filter(Boolean);

  const response = await generateContentViaServer({
    task: "slides",
    contents: buildRemedialDeckPrompt({ standard, analysis: analysis || {}, missed }),
    config: { responseMimeType: "application/json", responseSchema: REMEDIAL_DECK_SCHEMA },
    metadata: {
      standardCode: standard.code,
      grade: standard.grade,
      missedQuestionCount: missed.length,
      disableFallback: true,
    },
  });

  if (!response.text) throw new Error("No response from AI");
  const slides = normalizeRemedialDeck(JSON.parse(response.text), { gapLabels });
  if (slides.length === 0) throw new Error("The AI returned no usable slides.");

  await runWithConcurrency(slides, FIGURE_CONCURRENCY, async (slide) => {
    if (!slide.visualDescription) {
      slide.imageStatus = 'none';
      return;
    }
    const figure = await requestFigure('/api/figures/slide', {
      grade: standard.grade,
      standardCode: standard.code,
      slide: {
        title: slide.title,
        keyPoints: slide.keyPoints,
        visualDescription: slide.visualDescription,
        imagePrompt: slide.imagePrompt,
      },
    });
    slide.imageStatus = figure.status;
    if (figure.image && (figure.status === 'verified' || figure.status === 'unverified')) {
      slide.generatedImageBase64 = figure.image;
    } else {
      console.warn(`[figure] slide ${slide.slideNumber} ${figure.status}: ${figure.issues.join(' | ')}`);
    }
  });

  return slides;
};
