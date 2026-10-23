import type { FigureCoverage, VisualFigure, VisualSpec } from "../../types.ts";
import { questionStemRequiresImage } from "../../utils/questionStemRequiresImage.ts";
import { isDeterministicVisualSpecType } from "../../utils/visualSpec.ts";
import type { ItemClaim } from "./itemClaim.ts";
import { extractGivenQuantities } from "./givenQuantities.ts";
import { isMeasuringInstrument } from "./instruments.ts";
import type { FigureInput } from "./types.ts";

export type FigureFamily =
  | "dimensioned_rectangles"
  | "named_shapes"
  | "geometric_shape"
  | "fraction_bar"
  | "fraction_circle"
  | "number_line"
  | "array_model"
  | "area_model"
  | "ten_frame"
  | "bar_model"
  | "clock_face"
  | "line_plot"
  | "bar_chart"
  | "table"
  | "coordinate_plane"
  | "illustration"
  | "none";

export type FigureMeasurementKind =
  | "length"
  | "width"
  | "height"
  | "area"
  | "perimeter"
  | "angle"
  | "volume"
  | "time"
  | "value";

export type FigureMeasurement = {
  entityId?: string;
  kind: FigureMeasurementKind;
  value?: number;
  unit?: string;
  /** Exact text drawn in the figure. */
  label: string;
  /** Internal value used for scale; never drawn. */
  derived?: boolean;
};

export type FigureContract = {
  required: boolean;
  family: FigureFamily;
  entities: Array<{ id?: string; shape: string; nameLabel?: string }>;
  givenLabels: string[];
  measurements: FigureMeasurement[];
  mustShow: string[];
  mustNotShow: string[];
  /** Item prints a measurement scale, so tick numerals/unit marks are given data. */
  instrumentScale: boolean;
  altText: string;
  reason: string;
};

const SHAPE_WORDS =
  /\b(?:triangle|triangular|right[\s-]triangle|square|rectangle|rectangular|parallelogram|trapezoid|pentagon|hexagon|polygon|circle|circular|cube|cuboid|prism|cylinder|cylindrical|cone|conical|pyramid|pyramidal|sphere|spherical|hemisphere)\b/i;
const MEASUREMENT_WORDS =
  /\b(?:length|width|height|area|perimeter|volume|radius|diameter|circumference|angle|base|side)\b/i;

const clean = (value: unknown): string => String(value ?? "").replace(/\s+/g, " ").trim();

const unique = (values: string[]): string[] => {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const trimmed = clean(value);
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
};

const parseMeasurement = (label: string): { value?: number; unit?: string } => {
  const text = clean(label);
  const match = text.match(/(-?\d+(?:\.\d+)?)\s*([a-zA-Z%°].*)?$/);
  if (!match) return { unit: undefined };
  const value = Number(match[1]);
  return {
    value: Number.isFinite(value) ? value : undefined,
    unit: match[2] ? match[2].trim() : undefined,
  };
};

const familyForSpec = (spec: VisualSpec | null | undefined): FigureFamily => {
  if (!spec?.visualType) return "none";
  switch (spec.visualType) {
    case "geometric_shape":
      if (Array.isArray(spec.figures) && spec.figures.length > 0) {
        const allRectangles = spec.figures.every((figure) => figure.shape === "rectangle");
        return allRectangles ? "dimensioned_rectangles" : "named_shapes";
      }
      return "geometric_shape";
    case "fraction_bar":
    case "fraction_circle":
    case "number_line":
    case "array_model":
    case "area_model":
    case "ten_frame":
    case "bar_model":
    case "clock_face":
    case "line_plot":
    case "bar_chart":
    case "table":
    case "coordinate_plane":
      return spec.visualType;
    default:
      return isDeterministicVisualSpecType(spec.visualType) ? "geometric_shape" : "illustration";
  }
};

const entityFromFigure = (figure: VisualFigure) => ({
  id: clean(figure.id),
  shape: figure.shape,
  nameLabel: clean(figure.nameLabel) || undefined,
});

const measurementsFromFigure = (figure: VisualFigure): FigureMeasurement[] => {
  const out: FigureMeasurement[] = [];
  for (const dimension of Array.isArray(figure.dimensions) ? figure.dimensions : []) {
    const label = clean(dimension?.label);
    if (!label) continue;
    const parsed = parseMeasurement(label);
    out.push({
      entityId: clean(figure.id) || undefined,
      kind:
        dimension.side === "top" || dimension.side === "bottom" ? "length" : "width",
      value: parsed.value,
      unit: parsed.unit,
      label,
    });
  }
  const area = clean(figure.areaLabel);
  if (area) {
    const parsed = parseMeasurement(area);
    out.push({
      entityId: clean(figure.id) || undefined,
      kind: "area",
      value: parsed.value,
      unit: parsed.unit,
      label: area,
    });
  }
  return out;
};

const hasMeasuredGeometry = (text: string): boolean =>
  SHAPE_WORDS.test(text) && (MEASUREMENT_WORDS.test(text) || /\b\d+(?:\.\d+)?\s*(?:in|ft|cm|m|mm|km|yd|mi|inches?|feet|foot|centimeters?|meters?|units?|degrees?|°)\b/i.test(text));

const buildAltText = (entities: FigureContract["entities"], labels: string[]): string => {
  if (!entities.length && !labels.length) return "Math diagram for this question.";
  const entityText = entities
    .map((entity) => entity.nameLabel || entity.shape)
    .filter(Boolean)
    .join(" and ");
  const labelText = labels.length ? ` Labels: ${labels.join(", ")}.` : "";
  return `${entityText ? `Diagram of ${entityText}.` : "Math diagram."}${labelText}`.trim();
};

/**
 * Build the contract a figure must satisfy. This is the single source of truth
 * for both the deterministic SVG path and the AI raster gate.
 */
export const buildFigureContract = (input: FigureInput, claim: ItemClaim): FigureContract => {
  const spec = claim.visualSpec ?? null;
  const figures: VisualFigure[] = Array.isArray(spec?.figures) ? spec!.figures! : [];
  const legacyShapes =
    figures.length > 0
      ? []
      : Array.isArray(spec?.shapes) && spec!.shapes!.length > 0
        ? spec!.shapes!.map((shape) => ({ shape, nameLabel: undefined }))
        : spec?.shapeName
          ? [{ shape: spec.shapeName, nameLabel: undefined }]
          : [];

  const entities = figures.length
    ? figures.map(entityFromFigure)
    : legacyShapes.map((entry) => ({ id: undefined, shape: entry.shape, nameLabel: undefined }));

  const measurements = figures.flatMap(measurementsFromFigure);

  const givenLabels = unique([
    ...entities.map((entity) => entity.nameLabel || ""),
    ...measurements.map((measurement) => measurement.label),
    ...(spec?.title ? [spec.title] : []),
    ...(figures.length === 0
      ? [
          ...(Array.isArray(spec?.sideLabels) ? spec!.sideLabels! : []),
          ...(Array.isArray(spec?.angleLabels) ? spec!.angleLabels! : []),
        ]
      : []),
  ]);

  const stem = input.kind === "question" ? input.text : input.title;
  const visualIntent = input.kind === "question" ? input.visualIntent : input.visualDescription;
  const stemRequiresVisual = questionStemRequiresImage(stem);
  const measuredGeometry = hasMeasuredGeometry(`${stem} ${visualIntent || ""}`);
  const instrumentScale = isMeasuringInstrument(`${stem} ${visualIntent || ""}`);
  const asksToReadScale =
    instrumentScale &&
    /\b(?:shown|below|above|reads?|indicates?|what is the|how much|how many|measure)\b/i.test(
      `${stem} ${visualIntent || ""}`,
    );
  const givenQuantities = input.kind === "question" ? extractGivenQuantities(stem) : [];
  const wordNumberForm =
    input.kind === "question" &&
    /\bstandard\s+form\b/i.test(stem) &&
    /\b(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million|billion)\b/i.test(
      stem,
    );

  const required =
    claim.visualClass !== "none" ||
    figures.length > 0 ||
    stemRequiresVisual ||
    measuredGeometry ||
    asksToReadScale ||
    givenQuantities.length > 0 ||
    wordNumberForm;

  const correctAnswerText =
    input.kind === "question" && Number.isInteger(input.correctAnswerIndex) && Array.isArray(input.options)
      ? clean(input.options[Number(input.correctAnswerIndex)])
      : "";
  // Numbers the stem states are given data: drawing them reveals nothing.
  const givenValues = new Set([
    ...measurements
      .map((measurement) => measurement.value)
      .filter((value): value is number => Number.isFinite(value))
      .map((value) => String(value).replace(/,/g, "")),
    ...(String(stem || "").match(/\d[\d,]*(?:\.\d+)?/g) || []).map((value) => value.replace(/,/g, "")),
  ]);
  const normalizeNumber = (value: string) => value.replace(/,/g, "");
  const rawAnswerNumbers = correctAnswerText.match(/\d[\d,]*(?:\.\d+)?/g) || [];
  const answerNumbers = unique(
    rawAnswerNumbers
      .flatMap((value) => [value, normalizeNumber(value)])
      .filter((value) => !givenValues.has(normalizeNumber(value))),
  );

  // A printed measurement scale legitimately shows numerals, including the one
  // that is the answer (reading the ruler IS the task). Those ticks are given
  // data; only text that states the answer outright is a leak, which the figure
  // verifier checks separately via `revealsAnswer`.
  const mustNotShow = unique([
    ...(instrumentScale ? [] : answerNumbers),
    ...claim.mustNotShow,
  ]);

  const family = claim.visualClass === "illustration" ? "illustration" : familyForSpec(spec);
  const reason = required
    ? measuredGeometry
      ? "Stem gives measured geometry or asks the student to read a visual."
      : stemRequiresVisual
        ? "Stem refers to a figure, diagram, or display."
        : "A deterministic visual model is attached to the item."
    : "No figure is needed for this item; a faithful figure would add nothing or reveal the answer.";

  return {
    required,
    family,
    entities,
    givenLabels,
    measurements,
    mustShow: unique([...claim.mustShow, ...givenLabels]),
    mustNotShow,
    instrumentScale,
    altText: buildAltText(entities, givenLabels),
    reason,
  };
};

const normalizeForMatch = (value: string): string =>
  String(value ?? "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/(\d),(?=\d{3}(?:\D|$))/g, "$1")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

/**
 * Compare the contract against text actually drawn (SVG <text> nodes) or read
 * from a raster. Missing labels or leaked answers make the figure unpublishable.
 */
export const checkContractCoverage = (
  contract: FigureContract,
  visibleText: string | string[],
): FigureCoverage => {
  const haystack = normalizeForMatch(
    Array.isArray(visibleText) ? visibleText.join("\n") : visibleText,
  );
  const required = unique(contract.givenLabels);
  const present = required.filter((label) => haystack.includes(normalizeForMatch(label)));
  const missing = required.filter((label) => !haystack.includes(normalizeForMatch(label)));
  const leaks = unique(contract.mustNotShow).filter((label) => {
    const normalized = normalizeForMatch(label);
    return normalized.length >= 2 && haystack.includes(normalized);
  });
  const total = required.length;
  const pct = leaks.length > 0 ? 0 : total === 0 ? 100 : Math.round((present.length / total) * 100);
  return { required, present, missing, leaks, pct };
};

/** Extract text nodes from SVG markup for coverage checks. */
export const extractSvgText = (svg: string): string[] => {
  const out: string[] = [];
  const re = /<text\b[^>]*>([\s\S]*?)<\/text>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(String(svg || "")))) {
    const text = match[1]
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/\s+/g, " ")
      .trim();
    if (text) out.push(text);
  }
  return out;
};
