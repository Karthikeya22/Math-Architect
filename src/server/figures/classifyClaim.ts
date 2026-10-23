import type { VisualSpec } from "../../types.ts";
import { isDeterministicVisualSpecType } from "../../utils/visualSpec.ts";
import { canRenderClaimSvg } from "./renderClaimSvg.ts";

export type VisualClass = "exact" | "geometric" | "illustration" | "none";

const GEOMETRIC_TYPES = new Set(["coordinate_plane", "geometric_shape", "shape_diagram"]);

export type ClaimClassificationInput = {
  kind: "question" | "slide";
  stemText: string;
  visualIntent?: string;
  visualSpec?: VisualSpec | null;
};

const looksLikeIllustration = (intent: string): boolean => {
  const t = intent.toLowerCase();
  if (!t.trim()) return false;
  if (/\b(count|ten[- ]?frame|array|fraction|number line|bar chart|grid|dots|counters)\b/.test(t)) {
    return false;
  }
  return /\b(scene|illustration|picture of|photo|cartoon|story)\b/.test(t);
};

/**
 * Decide how the figure must be produced from the locked claim fields.
 * Renderable deterministic specs win; otherwise illustration only when clearly decorative.
 */
export const classifyClaim = (input: ClaimClassificationInput): VisualClass => {
  const spec = input.visualSpec ?? null;
  if (spec && isDeterministicVisualSpecType(spec.visualType) && canRenderClaimSvg(spec)) {
    return GEOMETRIC_TYPES.has(spec.visualType) ? "geometric" : "exact";
  }

  const intent = String(input.visualIntent || "").trim();
  if (looksLikeIllustration(intent)) return "illustration";

  // Slides without a deterministic spec default to illustration (decorative lesson art).
  if (input.kind === "slide" && intent) return "illustration";

  // Question with a non-empty visual intent but no SVG path: still try illustration
  // only when the intent does not imply exact countable math.
  if (input.kind === "question" && intent && !/\b(how many|count the|exactly)\b/i.test(input.stemText)) {
    if (!/\b(count|ten[- ]?frame|array|fraction|shaded)\b/i.test(intent)) {
      return "illustration";
    }
  }

  return "none";
};
