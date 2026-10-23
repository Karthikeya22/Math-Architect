import type { ItemClaim } from "./itemClaim.ts";
import { renderBalanceSvg } from "./renderBalanceSvg.ts";
import { renderClockSvg } from "./renderClockSvg.ts";
import { renderCylinderSvg } from "./renderCylinderSvg.ts";
import { renderProtractorSvg } from "./renderProtractorSvg.ts";
import { renderRulerSvg } from "./renderRulerSvg.ts";
import { renderThermometerSvg } from "./renderThermometerSvg.ts";

/**
 * Deterministic renderers for scale-reading items. Image models approximate
 * tick positions, which changes the answer, so these instruments are drawn
 * instead of generated. Returns null when the item is not a supported reading.
 */
export const renderInstrumentSvg = (claim: ItemClaim): string | null =>
  renderRulerSvg(claim) ??
  renderThermometerSvg(claim) ??
  renderCylinderSvg(claim) ??
  renderBalanceSvg(claim) ??
  renderProtractorSvg(claim) ??
  renderClockSvg(claim);
