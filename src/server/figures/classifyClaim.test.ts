import { describe, expect, it } from "vitest";
import { classifyClaim } from "./classifyClaim.ts";

describe("classifyClaim", () => {
  it("classifies a renderable ten_frame as exact", () => {
    expect(
      classifyClaim({
        kind: "question",
        stemText: "How many?",
        visualSpec: {
          visualType: "ten_frame",
          values: [1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
        },
      }),
    ).toBe("exact");
  });

  it("classifies coordinate_plane as geometric when renderable", () => {
    expect(
      classifyClaim({
        kind: "question",
        stemText: "Plot the point.",
        visualSpec: {
          visualType: "coordinate_plane",
          xMin: -5,
          xMax: 5,
          yMin: -5,
          yMax: 5,
          points: [{ x: 2, y: 3, label: "A" }],
        },
      }),
    ).toBe("geometric");
  });

  it("classifies decorative intent without a spec as illustration", () => {
    expect(
      classifyClaim({
        kind: "question",
        stemText: "Which tool measures length?",
        visualIntent: "A simple cartoon scene of a classroom desk.",
      }),
    ).toBe("illustration");
  });

  it("returns none for count stems without a usable visualSpec", () => {
    expect(
      classifyClaim({
        kind: "question",
        stemText: "How many stars are in the box?",
        visualIntent: "Count the stars.",
      }),
    ).toBe("none");
  });
});
