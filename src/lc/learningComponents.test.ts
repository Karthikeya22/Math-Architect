import { describe, expect, it } from "vitest";
import { getLcLearningComponentsForCode, formatLcLearningComponentsForPrompt } from "./learningComponents";

describe("lc learningComponents", () => {
  it("returns empty list when enrichment has no row", () => {
    expect(getLcLearningComponentsForCode("MA.DOES.NOT.EXIST")).toEqual([]);
    expect(formatLcLearningComponentsForPrompt("MA.DOES.NOT.EXIST")).toBe("");
  });
});
