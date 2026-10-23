import { describe, expect, it } from "vitest";
import { buildItemClaim } from "./itemClaim.ts";

describe("buildItemClaim", () => {
  it("locks keyed answer text and repaired visualSpec for a question", () => {
    const claim = buildItemClaim({
      kind: "question",
      grade: "Grade 1",
      standardCode: "MA.1.NSO.1.1",
      text: "How many counters are shown?",
      options: ["6", "7", "8", "9"],
      correctAnswerIndex: 2,
      visualIntent: "Show 8 counters on a ten frame.",
      visualSpec: {
        visualType: "ten_frame",
        values: [1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
      },
    });
    expect(claim.correctAnswerText).toBe("8");
    expect(claim.visualSpec?.visualType).toBe("ten_frame");
    expect(claim.visualClass).toBe("exact");
    expect(claim.mustShow.some((s) => s.includes("8"))).toBe(true);
  });

  it("builds a slide claim from title and visual description", () => {
    const claim = buildItemClaim({
      kind: "slide",
      grade: "Grade 3",
      title: "Equal shares",
      visualDescription: "A classroom scene with students sharing pizza.",
    });
    expect(claim.stemText).toBe("Equal shares");
    expect(claim.visualClass).toBe("illustration");
  });
});
