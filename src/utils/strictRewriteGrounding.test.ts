import { describe, expect, it } from "vitest";
import {
  buildMaterialKeySet,
  enforceStrictRewriteGrounding,
  materialCompositeKey,
} from "./strictRewriteGrounding";

describe("materialCompositeKey", () => {
  it("normalizes provider casing and trims ids", () => {
    expect(materialCompositeKey("  ixl  ", " skill-1 ")).toBe("IXL::skill-1");
  });
});

describe("enforceStrictRewriteGrounding", () => {
  const materials = [{ provider: "IXL", provider_item_id: "A" }];

  it("accepts matching keys with different provider casing", () => {
    expect(() =>
      enforceStrictRewriteGrounding("strict_rewrite_only", materials, [
        { sourceType: "rewrite", sourceProvider: "ixl", providerItemId: "A" },
      ])
    ).not.toThrow();
  });

  it("rejects novel", () => {
    expect(() =>
      enforceStrictRewriteGrounding("strict_rewrite_only", materials, [
        { sourceType: "novel", sourceProvider: "IXL", providerItemId: "A" },
      ])
    ).toThrow(/novel/);
  });

  it("rejects wrong composite", () => {
    expect(() =>
      enforceStrictRewriteGrounding("strict_rewrite_only", materials, [
        { sourceType: "rewrite", sourceProvider: "IXL", providerItemId: "B" },
      ])
    ).toThrow(/not in the retrieved materials/);
  });

  it("no-op when not strict policy", () => {
    enforceStrictRewriteGrounding("mixed_with_limits", materials, [
      { sourceType: "novel", sourceProvider: "X", providerItemId: "Y" },
    ]);
    expect(buildMaterialKeySet(materials).has("IXL::A")).toBe(true);
  });
});
