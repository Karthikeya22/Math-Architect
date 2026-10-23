import type { VisualType } from '../../../types.ts';
import type { FigureFamily } from '../figureContract.ts';
import { isDeterministicVisualSpecType } from '../../../utils/visualSpec.ts';

/**
 * One entry per FigureFamily. This is the single place that answers:
 *   - can this family be drawn deterministically?
 *   - which VisualSpec type does it render as?
 *   - when it cannot, is AI raster allowed?
 *
 * `generateFigure` still renders through `renderClaimSvg`; the registry is the
 * contract used by tests, the dev QA page, and the coverage scripts so a new
 * family cannot silently ship without a renderer decision.
 */
export type FigureFamilyHandler = {
  family: FigureFamily;
  /** Deterministic spec type that draws this family. */
  visualType?: VisualType;
  /** True when a deterministic spec can draw every valid instance. */
  deterministic: boolean;
  /** True when an AI raster illustration may be used (real-world scenes only). */
  aiAllowed: boolean;
  notes: string;
};

export const FIGURE_FAMILY_REGISTRY: Readonly<Record<FigureFamily, FigureFamilyHandler>> = {
  dimensioned_rectangles: {
    family: 'dimensioned_rectangles',
    visualType: 'geometric_shape',
    deterministic: true,
    aiAllowed: false,
    notes: 'Named rectangles with given side and area labels; derived sides are scale only.',
  },
  named_shapes: {
    family: 'named_shapes',
    visualType: 'geometric_shape',
    deterministic: true,
    aiAllowed: false,
    notes: '2D polygons and 3D solids, optionally side by side with name labels.',
  },
  geometric_shape: {
    family: 'geometric_shape',
    visualType: 'geometric_shape',
    deterministic: true,
    aiAllowed: false,
    notes: 'Shape diagrams, angle/side labels, and composite figures.',
  },
  fraction_bar: {
    family: 'fraction_bar',
    visualType: 'fraction_bar',
    deterministic: true,
    aiAllowed: false,
    notes: 'Partitioned strip with shaded parts.',
  },
  fraction_circle: {
    family: 'fraction_circle',
    visualType: 'fraction_circle',
    deterministic: true,
    aiAllowed: false,
    notes: 'Partitioned circle with shaded sectors.',
  },
  number_line: {
    family: 'number_line',
    visualType: 'number_line',
    deterministic: true,
    aiAllowed: false,
    notes: 'Tick-marked line spanning the given values; never marks the answer.',
  },
  array_model: {
    family: 'array_model',
    visualType: 'array_model',
    deterministic: true,
    aiAllowed: false,
    notes: 'Rows and columns of equal groups.',
  },
  area_model: {
    family: 'area_model',
    visualType: 'area_model',
    deterministic: true,
    aiAllowed: false,
    notes: 'Grid or rectangle decomposed into partial products.',
  },
  ten_frame: {
    family: 'ten_frame',
    visualType: 'ten_frame',
    deterministic: true,
    aiAllowed: false,
    notes: 'Ten-frame cells with filled counters.',
  },
  bar_model: {
    family: 'bar_model',
    visualType: 'bar_model',
    deterministic: true,
    aiAllowed: false,
    notes: 'Part-part-whole bars.',
  },
  clock_face: {
    family: 'clock_face',
    visualType: 'clock_face',
    deterministic: true,
    aiAllowed: false,
    notes: 'Analog clock hands for a given time.',
  },
  line_plot: {
    family: 'line_plot',
    visualType: 'line_plot',
    deterministic: true,
    aiAllowed: false,
    notes: 'Number line with stacked marks per value.',
  },
  bar_chart: {
    family: 'bar_chart',
    visualType: 'bar_chart',
    deterministic: true,
    aiAllowed: false,
    notes: 'Categorical bars with axis labels.',
  },
  table: {
    family: 'table',
    visualType: 'table',
    deterministic: true,
    aiAllowed: false,
    notes: 'Rows and columns of text/values.',
  },
  coordinate_plane: {
    family: 'coordinate_plane',
    visualType: 'coordinate_plane',
    deterministic: true,
    aiAllowed: false,
    notes: 'Axes, grid, and labeled points or plotted lines.',
  },
  illustration: {
    family: 'illustration',
    deterministic: false,
    aiAllowed: true,
    notes: 'Real-world scene; AI raster only, gated by the figure contract and verifier.',
  },
  none: {
    family: 'none',
    deterministic: false,
    aiAllowed: false,
    notes: 'No figure required for the stem.',
  },
};

export const getFigureFamilyHandler = (family: FigureFamily): FigureFamilyHandler =>
  FIGURE_FAMILY_REGISTRY[family];

export const visualTypeForFamily = (family: FigureFamily): VisualType | undefined =>
  FIGURE_FAMILY_REGISTRY[family].visualType;

/** Reverse lookup used by audits to attach a family to a rendered spec. */
const VISUAL_TYPE_TO_FAMILY: Readonly<Partial<Record<VisualType, FigureFamily>>> = {
  geometric_shape: 'geometric_shape',
  fraction_bar: 'fraction_bar',
  fraction_circle: 'fraction_circle',
  number_line: 'number_line',
  array_model: 'array_model',
  area_model: 'area_model',
  ten_frame: 'ten_frame',
  bar_model: 'bar_model',
  clock_face: 'clock_face',
  line_plot: 'line_plot',
  bar_chart: 'bar_chart',
  table: 'table',
  coordinate_plane: 'coordinate_plane',
};

export const familyForVisualType = (visualType: string | undefined): FigureFamily => {
  if (!visualType) return 'none';
  return VISUAL_TYPE_TO_FAMILY[visualType as VisualType] ?? 'none';
};

/**
 * Contract assertion used by tests and the coverage script: every family that
 * claims a visual type must be a deterministic spec type we can render.
 */
export const assertRegistryComplete = (): string[] => {
  const problems: string[] = [];
  for (const handler of Object.values(FIGURE_FAMILY_REGISTRY)) {
    if (handler.family === 'none' || handler.family === 'illustration') continue;
    if (!handler.visualType) {
      problems.push(`${handler.family} has no visualType`);
      continue;
    }
    if (!isDeterministicVisualSpecType(handler.visualType)) {
      problems.push(`${handler.family} -> ${handler.visualType} is not deterministic`);
    }
  }
  return problems;
};
