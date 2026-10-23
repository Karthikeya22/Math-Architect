import type { FigureFamily } from "../figureContract.ts";
import type { VisualType } from "../../../types.ts";

/**
 * A figure skeleton is the deterministic template a standard's questions are
 * expected to instantiate (e.g. "fraction area model", "coordinate plane").
 * The catalog is keyed by FigureFamily so every one of the 642 standards gets
 * exactly one recommended skeleton from its matrix family.
 *
 * `fallback` describes what happens when a generated question cannot be
 * instantiated from the skeleton:
 *   - deterministic: measured/mathematical — never substitute AI pixels.
 *   - ai_prompt: real-world illustration — generate from the question via prompt.
 *   - none: the standard does not need a figure.
 */
export type SkeletonFallback = "deterministic" | "ai_prompt" | "none";

export type FigureSkeleton = {
  id: string;
  family: FigureFamily;
  label: string;
  visualType: VisualType | null;
  deterministic: boolean;
  aiAllowed: boolean;
  /** How a generated question is recognised as belonging to this skeleton. */
  matchHint: string;
  /** What to draw when the question fits the family but no stored template does. */
  promptGuide: string;
  fallback: SkeletonFallback;
};

export const FIGURE_SKELETONS: Readonly<Record<FigureFamily, FigureSkeleton>> = {
  dimensioned_rectangles: {
    id: "dimensioned_rectangle",
    family: "dimensioned_rectangles",
    label: "Named rectangle with given side/area labels",
    visualType: "geometric_shape",
    deterministic: true,
    aiAllowed: false,
    matchHint: "Stem names a rectangle/square and gives length, width, perimeter or area.",
    promptGuide: "",
    fallback: "deterministic",
  },
  named_shapes: {
    id: "named_shapes",
    family: "named_shapes",
    label: "One or more named 2D/3D figures",
    visualType: "geometric_shape",
    deterministic: true,
    aiAllowed: false,
    matchHint: "Stem names shapes (or the standard classifies them) and asks to identify/compare.",
    promptGuide: "",
    fallback: "deterministic",
  },
  geometric_shape: {
    id: "geometric_shape",
    family: "geometric_shape",
    label: "Shape diagram with side/angle/measure labels",
    visualType: "geometric_shape",
    deterministic: true,
    aiAllowed: false,
    matchHint: "Stem references a shape attribute, angle, side, area, perimeter or volume.",
    promptGuide: "",
    fallback: "deterministic",
  },
  fraction_bar: {
    id: "fraction_bar",
    family: "fraction_bar",
    label: "Partitioned strip with shaded parts",
    visualType: "fraction_bar",
    deterministic: true,
    aiAllowed: false,
    matchHint: "Stem references a single fraction, numerator/denominator or equivalent fraction.",
    promptGuide: "",
    fallback: "deterministic",
  },
  fraction_circle: {
    id: "fraction_circle",
    family: "fraction_circle",
    label: "Partitioned circle with shaded sectors",
    visualType: "fraction_circle",
    deterministic: true,
    aiAllowed: false,
    matchHint: "Stem references a fraction circle, pie or sector model.",
    promptGuide: "",
    fallback: "deterministic",
  },
  number_line: {
    id: "number_line",
    family: "number_line",
    label: "Tick-marked number line with marks",
    visualType: "number_line",
    deterministic: true,
    aiAllowed: false,
    matchHint: "Stem references a number line, a point, or a jump.",
    promptGuide: "",
    fallback: "deterministic",
  },
  array_model: {
    id: "count_groups_array",
    family: "array_model",
    label: "Rows of equal groups (count/join/compare)",
    visualType: "array_model",
    deterministic: true,
    aiAllowed: false,
    matchHint: "Stem counts or joins concrete groups, or describes rows of objects.",
    promptGuide: "",
    fallback: "deterministic",
  },
  area_model: {
    id: "area_model_product",
    family: "area_model",
    label: "Grid area model (fraction product or partial products)",
    visualType: "area_model",
    deterministic: true,
    aiAllowed: false,
    matchHint:
      "Stem multiplies fractions (a/b × c/d) or decomposes a product into an area/partial-products grid.",
    promptGuide: "",
    fallback: "deterministic",
  },
  ten_frame: {
    id: "ten_frame",
    family: "ten_frame",
    label: "Ten-frame with filled counters",
    visualType: "ten_frame",
    deterministic: true,
    aiAllowed: false,
    matchHint: "Stem references a ten-frame, counters, or making ten.",
    promptGuide: "",
    fallback: "deterministic",
  },
  bar_model: {
    id: "part_part_whole_bar",
    family: "bar_model",
    label: "Part-part-whole / tape diagram",
    visualType: "bar_model",
    deterministic: true,
    aiAllowed: false,
    matchHint: "Stem gives parts and a whole, or a tape/bar relationship.",
    promptGuide: "",
    fallback: "deterministic",
  },
  clock_face: {
    id: "clock_face",
    family: "clock_face",
    label: "Analog clock at a given time",
    visualType: "clock_face",
    deterministic: true,
    aiAllowed: false,
    matchHint: "Stem gives or asks for a time on an analog clock.",
    promptGuide: "",
    fallback: "deterministic",
  },
  line_plot: {
    id: "line_plot",
    family: "line_plot",
    label: "Line plot / dot plot",
    visualType: "line_plot",
    deterministic: true,
    aiAllowed: false,
    matchHint: "Stem references a line plot, dot plot, or repeated measurements.",
    promptGuide: "",
    fallback: "deterministic",
  },
  bar_chart: {
    id: "categorical_bar_chart",
    family: "bar_chart",
    label: "Categorical bar chart",
    visualType: "bar_chart",
    deterministic: true,
    aiAllowed: false,
    matchHint: "Stem references categorical data, a bar graph, or a frequency table.",
    promptGuide: "",
    fallback: "deterministic",
  },
  table: {
    id: "data_table",
    family: "table",
    label: "Rows/columns data table",
    visualType: "table",
    deterministic: true,
    aiAllowed: false,
    matchHint: "Stem references a table, place-value chart, or input/output table.",
    promptGuide: "",
    fallback: "deterministic",
  },
  coordinate_plane: {
    id: "coordinate_plane",
    family: "coordinate_plane",
    label: "Coordinate plane with plotted points/lines",
    visualType: "coordinate_plane",
    deterministic: true,
    aiAllowed: false,
    matchHint: "Stem references coordinates, a graph, slope, intercept, or a plotted relationship.",
    promptGuide: "",
    fallback: "deterministic",
  },
  illustration: {
    id: "illustration_scene",
    family: "illustration",
    label: "Real-world illustration (AI prompt)",
    visualType: null,
    deterministic: false,
    aiAllowed: true,
    matchHint: "Stem describes a real-world scene, object, or story with no measurable model.",
    promptGuide:
      "Draw the scene the stem describes. Include exactly the quantities, objects and relationships named in the question. Do not add text labels, numbers, option letters, or the answer.",
    fallback: "ai_prompt",
  },
  none: {
    id: "no_figure",
    family: "none",
    label: "No figure",
    visualType: null,
    deterministic: false,
    aiAllowed: false,
    matchHint: "The stem is purely symbolic; a picture would be decorative.",
    promptGuide: "",
    fallback: "none",
  },
};

/** Code-level overrides where the family default is not the best skeleton. */
export const SKELETON_OVERRIDES: Readonly<Record<string, string>> = {
  // Fraction multiplication is an area model even when the standard text only
  // says "multiply a fraction by a fraction".
  "MA.5.FR.2.2": "area_model_product",
};

export const skeletonForFamily = (family: FigureFamily): FigureSkeleton =>
  FIGURE_SKELETONS[family] ?? FIGURE_SKELETONS.none;

export const skeletonForStandard = (code: string, family: FigureFamily): FigureSkeleton => {
  const overrideId = SKELETON_OVERRIDES[String(code || "").trim()];
  if (overrideId) {
    const match = Object.values(FIGURE_SKELETONS).find((skeleton) => skeleton.id === overrideId);
    if (match) return match;
  }
  return skeletonForFamily(family);
};

export const allSkeletons = (): FigureSkeleton[] => Object.values(FIGURE_SKELETONS);
