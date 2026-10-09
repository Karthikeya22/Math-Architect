import type { Quiz, QuizConfig, QuizResult, Standard } from '../types';

const truncateBody = (text: string, max = 600): string =>
  text.length <= max ? text : `${text.slice(0, max)}…`;

const MAX_TELEMETRY_VISUAL_CHARS = 50_000;

/** Drop base64 images and huge SVGs so POST /api/ai-quiz-generations stays under body limits. */
const quizForTelemetry = (quiz: Quiz): Quiz => ({
  ...quiz,
  questions: quiz.questions.map((q) => {
    const next = { ...q };
    delete (next as { generatedImageBase64?: string }).generatedImageBase64;
    if (typeof next.visual === "string" && next.visual.length > MAX_TELEMETRY_VISUAL_CHARS) {
      delete (next as { visual?: string }).visual;
    }
    return next;
  }),
});

export type LogGenerationResult = {
  generationId: string | null;
  error?: string;
  status?: number;
};

export type LogAttemptResult = {
  ok: boolean;
  error?: string;
  status?: number;
};

export const logAiQuizGeneration = async (payload: {
  userId: string | null;
  standard: Standard;
  config: QuizConfig;
  quiz: Quiz;
  providerMetadata?: Record<string, unknown>;
  sessionMetadata?: Record<string, unknown>;
}): Promise<LogGenerationResult> => {
  const res = await fetch('/api/ai-quiz-generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: payload.userId,
      standard: payload.standard,
      config: payload.config,
      quiz: quizForTelemetry(payload.quiz),
      providerMetadata: payload.providerMetadata ?? null,
      sessionMetadata: payload.sessionMetadata ?? null,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    const body = truncateBody(text);
    console.error('[telemetry] logAiQuizGeneration failed', { status: res.status, body });
    const friendly =
      res.status === 413
        ? "HTTP 413: request body too large (quiz telemetry). Server JSON limit or strip oversized fields."
        : `HTTP ${res.status}: ${body}`;
    return { generationId: null, error: friendly, status: res.status };
  }

  const data = (await res.json()) as { generationId?: string; sessionId?: string };
  return { generationId: data.generationId ?? data.sessionId ?? null };
};

export const logAiQuizAttempt = async (
  generationId: string,
  results: QuizResult[],
  userId?: string | null,
  telemetry?: {
    adaptiveEnabled?: boolean;
    adaptivePath?: Array<{ from: string; to: string; reason: string; changed: boolean }>;
    attemptMetadata?: Record<string, unknown>;
  }
): Promise<LogAttemptResult> => {
  const res = await fetch(`/api/ai-quiz-generations/${encodeURIComponent(generationId)}/attempt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      results,
      userId: userId ?? null,
      adaptiveEnabled: telemetry?.adaptiveEnabled ?? false,
      adaptivePath: telemetry?.adaptivePath ?? [],
      attemptMetadata: telemetry?.attemptMetadata ?? null,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    const body = truncateBody(text);
    console.error('[telemetry] logAiQuizAttempt failed', { status: res.status, body });
    return { ok: false, error: `HTTP ${res.status}: ${body}`, status: res.status };
  }
  return { ok: true };
};
