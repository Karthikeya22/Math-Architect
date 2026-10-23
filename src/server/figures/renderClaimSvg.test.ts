import { describe, expect, it } from "vitest";
import { canRenderClaimSvg, renderClaimSvg } from "./renderClaimSvg.ts";

describe("renderClaimSvg", () => {
  it("renders a ten_frame fixture", () => {
    const svg = renderClaimSvg({
      visualType: "ten_frame",
      values: [1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
    });
    expect(svg).toMatch(/<svg/i);
    expect(canRenderClaimSvg({
      visualType: "ten_frame",
      values: [1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
    })).toBe(true);
  });

  it("renders a fraction_bar fixture", () => {
    const svg = renderClaimSvg({
      visualType: "fraction_bar",
      totalParts: 4,
      shadedParts: 3,
    });
    expect(svg).toMatch(/<svg/i);
  });

  it("returns null for an invalid ten_frame", () => {
    expect(
      renderClaimSvg({
        visualType: "ten_frame",
        values: [1, 0, 1],
      }),
    ).toBeNull();
  });
});
