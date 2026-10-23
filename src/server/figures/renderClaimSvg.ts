import type { VisualSpec } from "../../types.ts";
import { isDeterministicVisualSpecType, renderDeterministicVisualSvg } from "../../utils/visualSpec.ts";
import { validateQuestionVisualSpec } from "../visualSpecValidation.ts";

/** True when the spec validates and the SVG renderer can emit markup. */
export const canRenderClaimSvg = (spec: VisualSpec | null | undefined): boolean =>
  Boolean(renderClaimSvg(spec));

/**
 * Validate + render a deterministic SVG from a claim visualSpec.
 * Returns null when the spec is missing, invalid, or non-deterministic.
 */
export const renderClaimSvg = (spec: VisualSpec | null | undefined): string | null => {
  if (!spec || !isDeterministicVisualSpecType(spec.visualType)) return null;
  const error = validateQuestionVisualSpec(spec);
  if (error) return null;
  const svg = renderDeterministicVisualSvg(spec);
  if (!svg || !/<svg[\s>]/i.test(svg)) return null;
  return svg;
};
