import type { VisualSpec } from '../types';
import type { ItemClaim } from '../server/figures/itemClaim';
import {
  buildFigureContract,
  checkContractCoverage,
  extractSvgText,
} from '../server/figures/figureContract';
import { classifyClaim } from '../server/figures/classifyClaim';
import { renderDeterministicVisualSvg } from './visualSpec';

export type VerifiedVisualResult = {
  /** SVG only when every declared label is actually drawn and nothing leaks. */
  svg: string | null;
  coveragePct: number | null;
  reason: 'verified' | 'not_required' | 'not_renderable' | 'incomplete';
};

/**
 * Render a deterministic spec only when its own contract is satisfied.
 *
 * Used by solution-step and slide surfaces that receive a spec directly rather
 * than going through the server figure pipeline. This never runs the question
 * reconcilers: the spec is rendered as given, and any label the renderer fails
 * to draw suppresses the figure instead of publishing a partial one.
 */
export const renderVerifiedVisualSvg = (
  spec: VisualSpec | null | undefined,
  stem: string,
  grade = '',
): VerifiedVisualResult => {
  if (!spec) return { svg: null, coveragePct: null, reason: 'not_renderable' };

  const svg = renderDeterministicVisualSvg(spec);
  if (!svg) return { svg: null, coveragePct: null, reason: 'not_renderable' };

  const text = String(stem || '');
  const claim: ItemClaim = {
    kind: 'question',
    grade,
    stemText: text,
    options: [],
    visualSpec: spec,
    visualClass: classifyClaim({ kind: 'question', stemText: text, visualSpec: spec }),
    mustShow: [],
    mustNotShow: [],
  };
  const input = {
    kind: 'question' as const,
    grade,
    text,
    options: [] as string[],
    correctAnswerIndex: -1,
    visualSpec: spec,
  };
  const contract = buildFigureContract(input, claim);
  if (!contract.required) {
    return { svg, coveragePct: 100, reason: 'not_required' };
  }

  const coverage = checkContractCoverage(contract, extractSvgText(svg));
  if (coverage.pct === 100 && !coverage.leaks?.length) {
    return { svg, coveragePct: 100, reason: 'verified' };
  }
  return { svg: null, coveragePct: coverage.pct, reason: 'incomplete' };
};
