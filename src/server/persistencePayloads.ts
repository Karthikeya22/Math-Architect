import type { GapAnalysis, RemedialSlide } from "../types.ts";

/** Row shape for `gap_analyses` insert (matches Supabase column names). */
export const toGapAnalysisInsertRow = (args: {
  userId: string;
  sessionId: string | null;
  standardCode: string;
  analysis: GapAnalysis;
}): Record<string, unknown> => ({
  user_id: args.userId,
  session_id: args.sessionId,
  standard_code: args.standardCode,
  summary: args.analysis.summary,
  confidence_score: args.analysis.confidenceScore,
  identified_gaps: args.analysis.identifiedGaps,
  sub_skills: args.analysis.subSkills,
});

export const remedialSlidesToJson = (slides: RemedialSlide[]): unknown => slides;

export type SessionCompletePatch = {
  score: number;
  total: number;
  completedAtIso: string;
  extraMetadata?: Record<string, unknown>;
};

/**
 * Merge server-side completion fields into `quiz_sessions.metadata` (jsonb).
 * Preserves existing keys unless overwritten by `extraMetadata`.
 */
export const mergeQuizSessionMetadataForComplete = (
  existing: Record<string, unknown> | null | undefined,
  patch: SessionCompletePatch
): Record<string, unknown> => {
  const base = existing && typeof existing === "object" ? { ...existing } : {};
  return {
    ...base,
    ...(patch.extraMetadata || {}),
    attemptCompletedAt: patch.completedAtIso,
    attemptScore: patch.score,
    attemptTotal: patch.total,
  };
};
