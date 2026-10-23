import { describe, expect, it } from "vitest";
import { applyLcMathStandardsAlignment } from "./mathStandardsAlignment";

describe("applyLcMathStandardsAlignment", () => {
  it("attaches reports in shadow mode without dropping questions", async () => {
    const payload: any = {
      standardCode: "MA.3.NSO.1.1",
      questions: [
        {
          question: "What is 2 + 2?",
          options: ["3", "4", "5", "6"],
          correctAnswerIndex: 1,
        },
      ],
    };

    const { report, dropped } = await applyLcMathStandardsAlignment({
      payload,
      statementCode: "MA.3.NSO.1.1",
      env: { LC_EVAL_MODE: "shadow" },
      evaluateQuestion: async () => ({
        aligned_count: 1,
        total_count: 4,
        learning_components: [
          {
            identifier: "a",
            description: "Add within 10",
            aligned: true,
            feedback: "ok",
          },
        ],
      }),
    });

    expect(dropped).toBe(0);
    expect(report?.mode).toBe("shadow");
    expect(payload.questions).toHaveLength(1);
    expect(payload.questions[0]._lcAlignment.ratio).toBe(0.25);
    expect(payload._lcAlignment.questions).toHaveLength(1);
  });

  it("drops weak questions in fail mode", async () => {
    const payload = {
      standardCode: "MA.3.NSO.1.1",
      questions: [
        {
          question: "Weak item",
          options: ["1", "2", "3", "4"],
          correctAnswerIndex: 0,
        },
        {
          question: "Strong item",
          options: ["1", "2", "3", "4"],
          correctAnswerIndex: 1,
        },
      ],
    };

    let call = 0;
    const { dropped } = await applyLcMathStandardsAlignment({
      payload,
      statementCode: "MA.3.NSO.1.1",
      env: { LC_EVAL_MODE: "fail", LC_ALIGN_MIN_RATIO: "0.5" },
      evaluateQuestion: async () => {
        call += 1;
        if (call === 1) {
          return { aligned_count: 1, total_count: 4, learning_components: [] };
        }
        return { aligned_count: 3, total_count: 4, learning_components: [] };
      },
    });

    expect(dropped).toBe(1);
    expect(payload.questions).toHaveLength(1);
    expect(payload.questions[0].question).toBe("Strong item");
  });

  it("no-ops when mode is off", async () => {
    const payload = { questions: [{ question: "x", options: ["a", "b", "c", "d"], correctAnswerIndex: 0 }] };
    const { report } = await applyLcMathStandardsAlignment({
      payload,
      statementCode: "MA.K.NSO.1.1",
      env: { LC_EVAL_MODE: "off" },
      evaluateQuestion: async () => {
        throw new Error("should not run");
      },
    });
    expect(report).toBeNull();
  });
});
