/**
 * Shapes for Supabase `questions` and `question_attempts` inserts.
 * Supports:
 * - **Minimal** (telemetry-only columns from repo migrations)
 * - **Hybrid** (denormalized columns + per-question attempts for common Supabase layouts)
 *
 * Toggle with `SUPABASE_QUIZ_HYBRID_SCHEMA` (default: `true`). Set to `false` for migration-only DBs.
 */

/** Columns used by migration-only / narrow `questions` tables */
export const QUESTION_INSERT_KEYS_MINIMAL = [
  "session_id",
  "question_index",
  "question",
  "source_type",
  "generated_by_ai",
  "presented_difficulty",
  "generation_metadata",
] as const;

/** @deprecated use QUESTION_INSERT_KEYS_MINIMAL */
export const QUESTION_INSERT_KEYS = QUESTION_INSERT_KEYS_MINIMAL;

/** Extra columns many production DBs expect alongside session-scoped quiz rows */
export const QUESTION_INSERT_KEYS_HYBRID = [
  ...QUESTION_INSERT_KEYS_MINIMAL,
  "external_id",
  "source",
  "source_url",
  "license",
  "standard_code",
  "grade",
  "strand",
  "question_type",
  "question_text",
  "options",
  "correct_answer",
  "explanation",
  "difficulty",
  "tags",
  "image_url",
  "visual_intent",
  "metadata",
  "is_validated",
] as const;

export const QUESTION_ATTEMPT_INSERT_KEYS_MINIMAL = [
  "session_id",
  "user_id",
  "results",
  "score",
  "total",
  "adaptive_enabled",
  "adaptive_path",
  "attempt_metadata",
] as const;

/** @deprecated use QUESTION_ATTEMPT_INSERT_KEYS_MINIMAL */
export const QUESTION_ATTEMPT_INSERT_KEYS = QUESTION_ATTEMPT_INSERT_KEYS_MINIMAL;

/** One row per answered question (requires `question_id` FK to `questions`) */
export const QUESTION_ATTEMPT_DETAIL_KEYS_HYBRID = [
  "session_id",
  "question_id",
  "user_id",
  "standard_code",
  "selected_answer",
  "is_correct",
  "time_spent_seconds",
  "attempt_order",
  "completed_at",
  "results",
  "score",
  "total",
  "adaptive_enabled",
  "adaptive_path",
  "attempt_metadata",
] as const;

export type QuestionInsertRowMinimal = {
  session_id: string;
  question_index: number;
  question: Record<string, unknown>;
  source_type: string;
  generated_by_ai: boolean;
  presented_difficulty: string;
  generation_metadata: Record<string, unknown>;
};

export type QuestionAttemptInsertRowMinimal = {
  session_id: string;
  user_id: string | null;
  results: unknown[];
  score: number;
  total: number;
  adaptive_enabled: boolean;
  adaptive_path: unknown[];
  attempt_metadata: Record<string, unknown>;
};

export const isQuizHybridSchemaEnabled = (): boolean =>
  (process.env.SUPABASE_QUIZ_HYBRID_SCHEMA ?? "true").toLowerCase() !== "false";

export const assertExactKeys = <T extends Record<string, unknown>>(
  row: T,
  allowed: readonly string[],
  label: string
): void => {
  const keys = Object.keys(row).sort();
  const allowedSet = new Set(allowed);
  const extra = keys.filter((k) => !allowedSet.has(k));
  if (extra.length) {
    throw new Error(`${label}: unexpected keys: ${extra.join(", ")}`);
  }
  for (const k of allowed) {
    if (!(k in row)) {
      throw new Error(`${label}: missing required key: ${k}`);
    }
  }
};

export const toQuestionInsertRow = (
  args: {
    sessionId: string;
    questionIndex: number;
    cleaned: Record<string, unknown>;
    standard: { code: string; grade: string };
    strandCode: string | null;
    gradeToken: string | null;
    config: { sourcePolicy?: string | null };
    promptVersionFromMeta?: string | null;
  },
  options?: { hybridDb?: boolean }
): Record<string, unknown> => {
  const hybrid = options?.hybridDb ?? isQuizHybridSchemaEnabled();
  const cleaned = args.cleaned;
  const sourceType =
    cleaned.sourceType === "bank" || cleaned.sourceType === "rewrite" || cleaned.sourceType === "novel"
      ? (cleaned.sourceType as string)
      : "novel";
  const visualSpec = cleaned.visualSpec as { visualType?: string } | undefined;
  const visualType =
    visualSpec && typeof visualSpec === "object" ? String(visualSpec.visualType || "") || null : null;
  const sanitizationWarnings = Array.isArray(
    (cleaned as { _sanitizationWarnings?: unknown })._sanitizationWarnings
  )
    ? ((cleaned as { _sanitizationWarnings?: string[] })._sanitizationWarnings as string[])
    : [];
  const generation_metadata: Record<string, unknown> = {
    prompt_version: cleaned.promptVersion ?? args.promptVersionFromMeta ?? null,
    source_policy: args.config.sourcePolicy ?? null,
    source_provider: cleaned.sourceProvider ?? "UNKNOWN",
    provider_item_id: cleaned.providerItemId ?? null,
    standard_code: String(args.standard.code),
    standard_grade_label: String(args.standard.grade),
    grade_token: args.gradeToken,
    strand_code: args.strandCode,
    visual_path: typeof cleaned.visualPath === "string" ? cleaned.visualPath : null,
    visual_type: visualType,
    geogebra_available: Boolean(cleaned.geogebraImageBase64),
    sanitization_warnings: sanitizationWarnings.length > 0 ? sanitizationWarnings : null,
  };

  const question: Record<string, unknown> = {
    ...cleaned,
    tags: [
      "ai_generated",
      `standard:${String(args.standard.code)}`,
      `grade:${String(args.gradeToken || args.standard.grade)}`,
      `strand:${String(args.strandCode || "")}`,
      `difficulty:${String((cleaned.difficulty as string) || "unknown")}`,
    ].filter(Boolean),
    metadata: {
      origin: "ai_generated",
      standard_code: String(args.standard.code),
      standard_grade_label: String(args.standard.grade),
      grade_token: args.gradeToken,
      strand_code: args.strandCode,
      question_index: args.questionIndex,
      correct_answer_index:
        typeof cleaned.correctAnswerIndex === "number" ? cleaned.correctAnswerIndex : null,
    },
  };

  const base: Record<string, unknown> = {
    session_id: args.sessionId,
    question_index: args.questionIndex,
    question,
    source_type: sourceType,
    generated_by_ai: typeof cleaned.generatedByAi === "boolean" ? cleaned.generatedByAi : true,
    presented_difficulty: String((cleaned.difficulty as string) || "unknown"),
    generation_metadata,
  };

  if (!hybrid) {
    assertExactKeys(base, QUESTION_INSERT_KEYS_MINIMAL, "QuestionInsertRow");
    return base;
  }

  const opts = Array.isArray(cleaned.options) ? (cleaned.options as string[]) : null;
  const correctIdx = typeof cleaned.correctAnswerIndex === "number" ? cleaned.correctAnswerIndex : -1;
  const correct_answer =
    opts && correctIdx >= 0 && correctIdx < opts.length ? String(opts[correctIdx] ?? "") : null;
  const questionText = typeof cleaned.text === "string" && cleaned.text.trim() ? String(cleaned.text) : " ";

  const row: Record<string, unknown> = {
    ...base,
    external_id: cleaned.id != null ? String(cleaned.id) : null,
    source: sourceType === "bank" ? "item_bank" : "ai_quiz",
    source_url: null,
    license: null,
    standard_code: String(args.standard.code),
    grade: String(args.standard.grade),
    strand: args.strandCode != null ? String(args.strandCode) : null,
    question_type: "multiple_choice",
    question_text: questionText,
    options: opts,
    correct_answer,
    explanation: cleaned.explanation != null ? String(cleaned.explanation) : null,
    difficulty: cleaned.difficulty != null ? String(cleaned.difficulty) : null,
    tags: question.tags as string[],
    image_url: null,
    visual_intent: cleaned.visualIntent != null ? String(cleaned.visualIntent) : null,
    metadata: question.metadata,
    is_validated: false,
  };

  assertExactKeys(row, QUESTION_INSERT_KEYS_HYBRID, "QuestionInsertRowHybrid");
  return row;
};

export const toQuestionAttemptInsertRow = (args: {
  sessionId: string;
  userId: string | null;
  results: unknown[];
  score: number;
  total: number;
  adaptiveEnabled: boolean;
  adaptivePath: unknown[];
  attemptMetadata: Record<string, unknown> | null;
}): QuestionAttemptInsertRowMinimal => {
  const attempt_metadata = {
    ...(args.attemptMetadata || {}),
    userId: args.userId,
  };
  const row: QuestionAttemptInsertRowMinimal = {
    session_id: args.sessionId,
    user_id: args.userId,
    results: args.results,
    score: args.score,
    total: args.total,
    adaptive_enabled: args.adaptiveEnabled,
    adaptive_path: args.adaptivePath,
    attempt_metadata,
  };
  assertExactKeys(row as unknown as Record<string, unknown>, QUESTION_ATTEMPT_INSERT_KEYS_MINIMAL, "QuestionAttemptInsertRow");
  return row;
};

export const formatSelectedAnswerForAttempt = (
  result: Record<string, unknown>,
  optionsJson: unknown
): string => {
  const idx = result?.selectedOptionIndex;
  if (typeof idx !== "number") return String(idx ?? "");
  const opts = Array.isArray(optionsJson) ? (optionsJson as unknown[]) : null;
  if (opts && idx >= 0 && idx < opts.length && opts[idx] != null) {
    return String(opts[idx]);
  }
  return `optionIndex:${idx}`;
};

export const buildPerQuestionAttemptRows = (args: {
  sessionId: string;
  standardCode: string | null;
  userId: string | null;
  results: unknown[];
  adaptiveEnabled: boolean;
  adaptivePath: unknown[];
  attemptMetadata: Record<string, unknown> | null;
  questionIdsByIndex: Map<number, string>;
  /** question_index -> options jsonb from `questions` row (for readable selected_answer). */
  optionsByQuestionIndex?: Map<number, unknown>;
}): Record<string, unknown>[] => {
  const userId = args.userId != null && String(args.userId).trim() !== "" ? String(args.userId) : "anonymous";
  const completedAt = new Date().toISOString();

  const perQuestion = args.results.map((result: unknown) => {
    const r = result as Record<string, unknown>;
    return {
      questionIndex: r?.questionIndex ?? null,
      questionId: r?.questionId ?? null,
      isCorrect: Boolean(r?.isCorrect),
      timeTakenSeconds:
        typeof r?.timeTaken === "number" ? Math.max(0, Math.round(r.timeTaken as number)) : 0,
      nextDifficulty: r?.nextDifficulty ?? null,
      adaptiveDecisionReason: r?.adaptiveDecisionReason ?? null,
      difficultyChanged: r?.difficultyChanged ?? null,
    };
  });

  const sharedAttemptMetadata: Record<string, unknown> = {
    ...(args.attemptMetadata || {}),
    userId: args.userId,
    perQuestion,
  };

  const rows: Record<string, unknown>[] = [];

  for (let i = 0; i < args.results.length; i++) {
    const r = args.results[i] as Record<string, unknown>;
    const qIdx = typeof r?.questionIndex === "number" ? (r.questionIndex as number) : -1;
    const questionId = args.questionIdsByIndex.get(qIdx);
    if (!questionId) {
      throw new Error(
        `Hybrid attempt: no questions.id for question_index=${qIdx}. Ensure quiz questions were persisted for this session.`
      );
    }

    const optionsJson = args.optionsByQuestionIndex?.get(qIdx);
    const selectedAnswer =
      optionsJson !== undefined
        ? formatSelectedAnswerForAttempt(r, optionsJson)
        : String(r?.selectedOptionIndex ?? "");

    const row: Record<string, unknown> = {
      session_id: args.sessionId,
      question_id: questionId,
      user_id: userId,
      standard_code: args.standardCode,
      selected_answer: selectedAnswer,
      is_correct: Boolean(r?.isCorrect),
      time_spent_seconds:
        typeof r?.timeTaken === "number" ? Math.max(0, Math.round(r.timeTaken as number)) : 0,
      attempt_order: i,
      completed_at: completedAt,
      results: [args.results[i]],
      score: Boolean(r?.isCorrect) ? 1 : 0,
      total: 1,
      adaptive_enabled: args.adaptiveEnabled,
      adaptive_path: args.adaptivePath,
      attempt_metadata: { ...sharedAttemptMetadata },
    };
    assertExactKeys(row, QUESTION_ATTEMPT_DETAIL_KEYS_HYBRID, `QuestionAttemptDetailRow[${i}]`);
    rows.push(row);
  }

  return rows;
};
