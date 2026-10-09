import { describe, expect, it } from "vitest";
import { mergeQuizSessionMetadataForComplete, toGapAnalysisInsertRow } from "./persistencePayloads";
import { GapType, type GapAnalysis } from "../types.ts";

describe("toGapAnalysisInsertRow", () => {
  it("maps GapAnalysis to gap_analyses columns", () => {
    const analysis: GapAnalysis = {
      standardCode: "MA.4.NSO.1",
      identifiedGaps: [
        { gapType: GapType.Unknown, description: "insufficient data", relatedQuestions: [] },
      ],
      subSkills: [],
      confidenceScore: 0.72,
      summary: "Student needs work on fractions.",
    };
    const row = toGapAnalysisInsertRow({
      userId: "guest_000001",
      sessionId: "550e8400-e29b-41d4-a716-446655440000",
      standardCode: "MA.4.NSO.1",
      analysis,
    });
    expect(row.user_id).toBe("guest_000001");
    expect(row.session_id).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(row.standard_code).toBe("MA.4.NSO.1");
    expect(row.summary).toBe("Student needs work on fractions.");
    expect(row.confidence_score).toBe(0.72);
    expect(Array.isArray(row.identified_gaps)).toBe(true);
    expect(row.sub_skills).toEqual([]);
  });
});

describe("mergeQuizSessionMetadataForComplete", () => {
  it("merges attempt fields into metadata", () => {
    const merged = mergeQuizSessionMetadataForComplete({ prior: true }, {
      score: 4,
      total: 5,
      completedAtIso: "2026-05-05T12:00:00.000Z",
      extraMetadata: { questionCount: 5 },
    });
    expect(merged.prior).toBe(true);
    expect(merged.questionCount).toBe(5);
    expect(merged.attemptScore).toBe(4);
    expect(merged.attemptTotal).toBe(5);
    expect(merged.attemptCompletedAt).toBe("2026-05-05T12:00:00.000Z");
  });
});
