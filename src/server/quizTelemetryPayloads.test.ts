import { beforeAll, describe, expect, it } from "vitest";
import {
  assertExactKeys,
  buildPerQuestionAttemptRows,
  formatSelectedAnswerForAttempt,
  toQuestionAttemptInsertRow,
  toQuestionInsertRow,
  QUESTION_ATTEMPT_INSERT_KEYS,
  QUESTION_INSERT_KEYS,
  QUESTION_INSERT_KEYS_HYBRID,
} from "./quizTelemetryPayloads";

beforeAll(() => {
  process.env.SUPABASE_QUIZ_HYBRID_SCHEMA = "false";
});

describe("toQuestionInsertRow", () => {
  it("produces only schema keys and embeds denormalized fields in jsonb", () => {
    const row = toQuestionInsertRow({
      sessionId: "550e8400-e29b-41d4-a716-446655440000",
      questionIndex: 0,
      cleaned: {
        id: "q1",
        text: "What is 2+2?",
        options: ["1", "2", "3", "4"],
        correctAnswerIndex: 3,
        explanation: "Because math.",
        animationDescription: "none",
        difficulty: "Easy",
        sourceType: "rewrite",
        sourceProvider: "IXL",
        providerItemId: "skill-1",
        generatedByAi: true,
        promptVersion: "v1",
      },
      standard: { code: "MA.4.NSO.1", grade: "Grade 4" },
      strandCode: "NSO",
      gradeToken: "4",
      config: { sourcePolicy: "strict_rewrite_only" },
      promptVersionFromMeta: "adaptive-v1",
    });
    expect(Object.keys(row).sort()).toEqual([...QUESTION_INSERT_KEYS].sort());
    expect(row.question_index).toBe(0);
    expect((row.question as { text?: string }).text).toBe("What is 2+2?");
    const genMeta = row.generation_metadata as { source_provider?: string; standard_code?: string };
    expect(genMeta.source_provider).toBe("IXL");
    expect(genMeta.standard_code).toBe("MA.4.NSO.1");
  });

  it("throws if caller adds unexpected keys to insert row", () => {
    const row = toQuestionInsertRow({
      sessionId: "550e8400-e29b-41d4-a716-446655440000",
      questionIndex: 0,
      cleaned: {
        id: "q1",
        text: "T",
        options: ["a", "b", "c", "d"],
        correctAnswerIndex: 0,
        explanation: "e",
        animationDescription: "a",
        difficulty: "Medium",
      },
      standard: { code: "MA.1.NSO.1", grade: "Grade 1" },
      strandCode: null,
      gradeToken: "1",
      config: {},
      promptVersionFromMeta: null,
    });
    expect(() =>
      assertExactKeys(
        { ...row, extraColumn: 1 } as unknown as Record<string, unknown>,
        QUESTION_INSERT_KEYS,
        "test"
      )
    ).toThrow(/unexpected keys/);
  });

  it("hybrid mode adds denormalized columns when hybridDb is true", () => {
    const row = toQuestionInsertRow(
      {
        sessionId: "550e8400-e29b-41d4-a716-446655440000",
        questionIndex: 1,
        cleaned: {
          id: "client-q-9",
          text: "Pick one",
          options: ["A", "B", "C", "D"],
          correctAnswerIndex: 2,
          explanation: "C is right",
          animationDescription: "none",
          difficulty: "Hard",
          sourceType: "novel",
          visualIntent: "number line",
        },
        standard: { code: "MA.5.NSO.1", grade: "Grade 5" },
        strandCode: "NSO",
        gradeToken: "5",
        config: { sourcePolicy: "ai_freedom" },
        promptVersionFromMeta: "v2",
      },
      { hybridDb: true }
    );
    expect(Object.keys(row).sort()).toEqual([...QUESTION_INSERT_KEYS_HYBRID].sort());
    expect(row.standard_code).toBe("MA.5.NSO.1");
    expect(row.question_text).toBe("Pick one");
    expect(row.correct_answer).toBe("C");
    expect(row.external_id).toBe("client-q-9");
  });
});

describe("toQuestionAttemptInsertRow", () => {
  it("produces one aggregate attempt row", () => {
    const results = [
      { questionIndex: 0, questionId: "a", isCorrect: true, timeTaken: 1.2 },
    ];
    const perQuestion = [{ questionIndex: 0, isCorrect: true }];
    const row = toQuestionAttemptInsertRow({
      sessionId: "550e8400-e29b-41d4-a716-446655440000",
      userId: "user-1",
      results,
      score: 1,
      total: 1,
      adaptiveEnabled: false,
      adaptivePath: [],
      attemptMetadata: { questionCount: 1, perQuestion },
    });
    expect(Object.keys(row).sort()).toEqual([...QUESTION_ATTEMPT_INSERT_KEYS].sort());
    expect(row.results).toEqual(results);
    expect(row.attempt_metadata.userId).toBe("user-1");
    expect((row.attempt_metadata as { perQuestion?: unknown[] }).perQuestion).toEqual(perQuestion);
  });
});

describe("buildPerQuestionAttemptRows", () => {
  it("builds one row per result with question_id from index map", () => {
    const map = new Map<number, string>([
      [0, "11111111-1111-4111-8111-111111111111"],
      [1, "22222222-2222-4222-8222-222222222222"],
    ]);
    const rows = buildPerQuestionAttemptRows({
      sessionId: "550e8400-e29b-41d4-a716-446655440000",
      standardCode: "MA.4.NSO.1",
      userId: null,
      results: [
        { questionIndex: 0, selectedOptionIndex: 1, isCorrect: true, timeTaken: 2.4 },
        { questionIndex: 1, selectedOptionIndex: 0, isCorrect: false, timeTaken: 5 },
      ],
      adaptiveEnabled: true,
      adaptivePath: [{ from: "Easy", to: "Medium", reason: "x", changed: true }],
      attemptMetadata: { client: "vitest" },
      questionIdsByIndex: map,
    });
    expect(rows).toHaveLength(2);
    expect(rows[0].question_id).toBe("11111111-1111-4111-8111-111111111111");
    expect(rows[0].user_id).toBe("anonymous");
    expect(rows[1].score).toBe(0);
    expect(rows[1].total).toBe(1);
  });

  it("uses option label in selected_answer when options map provided", () => {
    const map = new Map<number, string>([[0, "11111111-1111-4111-8111-111111111111"]]);
    const opts = new Map<number, unknown>([[0, ["Alpha", "Beta", "Gamma", "Delta"]]]);
    const rows = buildPerQuestionAttemptRows({
      sessionId: "550e8400-e29b-41d4-a716-446655440000",
      standardCode: "MA.4.NSO.1",
      userId: "u1",
      results: [{ questionIndex: 0, selectedOptionIndex: 2, isCorrect: true, timeTaken: 1 }],
      adaptiveEnabled: false,
      adaptivePath: [],
      attemptMetadata: null,
      questionIdsByIndex: map,
      optionsByQuestionIndex: opts,
    });
    expect(rows[0].selected_answer).toBe("Gamma");
  });

  it("throws when question index is missing from map", () => {
    expect(() =>
      buildPerQuestionAttemptRows({
        sessionId: "550e8400-e29b-41d4-a716-446655440000",
        standardCode: null,
        userId: "u1",
        results: [{ questionIndex: 99, isCorrect: true, timeTaken: 1 }],
        adaptiveEnabled: false,
        adaptivePath: [],
        attemptMetadata: null,
        questionIdsByIndex: new Map([[0, "11111111-1111-4111-8111-111111111111"]]),
      })
    ).toThrow(/question_index=99/);
  });
});

describe("formatSelectedAnswerForAttempt", () => {
  it("falls back to optionIndex prefix when options missing", () => {
    expect(
      formatSelectedAnswerForAttempt({ selectedOptionIndex: 1 } as Record<string, unknown>, null)
    ).toBe("optionIndex:1");
  });
});
