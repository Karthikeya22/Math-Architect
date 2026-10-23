import { GeometricShapeName, VisualFigure, isSolidShape } from '../types';
import { reconcileColoredBlockTrainsFromStem } from './compareLengthVisual';
import { reconcileSceneImageFromStem } from './questionFocusedImagePrompt';
import { reconcilePartPartWholeFromStem } from './partPartWholeVisual';
import { coerceTenFrameAdditionVisualSpec, reconcileTenFrameAdditionFromStem } from './tenFrameAdditionVisual';
import { questionStemRequiresImage } from './questionStemRequiresImage';
import {
  reconcileExactCountObjectsFromStem,
  reconcileWordPlaceValueFromStem,
} from './exactCountVisual';
import { reconcileCoordinatePlaneFromStem } from './reconcileCoordinatePlaneFromStem';
import {
  normalizeTenFrameCells,
  parseFilledDotsCountFromStem,
  reconcileBlocksMissingAddendToTen,
  reconcileMakeTenQuestion,
  reconcilePlaceValueTeensFromStem,
} from './reconcileMakeTenQuestion';

type QuestionVisualFields = {
  text?: string;
  options?: string[];
  correctAnswerIndex?: number;
  visualIntent?: string;
  visualSpec?: {
    visualType?: string;
    title?: string;
    shapeName?: string;
    shapes?: string[];
    figures?: VisualFigure[];
    sideLabels?: string[];
    angleLabels?: string[];
    shapeWidth?: number;
    shapeHeight?: number;
    values?: unknown[];
    totalParts?: number;
    shadedParts?: number;
    gridRows?: number;
    gridCols?: number;
    highlightRows?: number;
    highlightCols?: number;
    min?: number;
    max?: number;
    tickStep?: number;
    columns?: string[];
    rows?: string[][];
    xLabel?: string;
    categories?: string[];
    chartStyle?: 'pictures' | 'tally';
    iconUnit?: number;
  } | null;
  imagePrompt?: string;
};

const STEM_SHAPE_FORMS: ReadonlyArray<{ name: GeometricShapeName; pattern: RegExp }> = [
  { name: 'right_triangle', pattern: /\bright[\s-]triangles?\b/i },
  { name: 'triangle', pattern: /(?<!right[\s-])\btriangles?\b/i },
  { name: 'square', pattern: /\bsquares?\b/i },
  { name: 'rectangle', pattern: /\brectangles?\b/i },
  { name: 'parallelogram', pattern: /\bparallelograms?\b/i },
  { name: 'trapezoid', pattern: /\btrapezoids?\b/i },
  { name: 'pentagon', pattern: /\bpentagons?\b/i },
  { name: 'hexagon', pattern: /\bhexagons?\b/i },
  { name: 'cube', pattern: /\bcubes?\b/i },
  { name: 'triangular_prism', pattern: /\btriangular[\s-]?prisms?\b/i },
  { name: 'rectangular_prism', pattern: /\brectangular[\s-]?prisms?\b|\bprisms?\b/i },
  { name: 'sphere', pattern: /\bspheres?\b/i },
  { name: 'cylinder', pattern: /\bcylinders?\b/i },
  { name: 'cone', pattern: /\bcones?\b/i },
  { name: 'pyramid', pattern: /\bpyramids?\b/i },
];

/**
 * Unit and operation phrases that contain shape words but are not shapes.
 * Masking happens before shape extraction so "square inches" never becomes a
 * square and "square root" never becomes a square.
 */
const NON_SHAPE_PHRASES: ReadonlyArray<RegExp> = [
  /\bsquare\s+(?:inches?|feet|foot|units?|centimeters?|meters?|millimeters?|kilometers?|yards?|miles?|cm|mm|km|ft|in|yd|mi)\b/gi,
  /\bsquare\s+roots?\b/gi,
  /\bperfect\s+squares?\b/gi,
  /\bsquare\s+numbers?\b/gi,
  /\bsquare[-\s]shaped\b/gi,
];

export const maskNonShapePhrases = (text: string): string => {
  let out = String(text || '');
  for (const pattern of NON_SHAPE_PHRASES) {
    out = out.replace(pattern, (match) => ' '.repeat(match.length));
  }
  return out;
};

const SHAPE_MENTION_RE =
  /\b(triangular[\s-]?prisms?|rectangular[\s-]?prisms?|right[\s-]?triangles?|triangles?|squares?|rectangles?|parallelograms?|trapezoids?|pentagons?|hexagons?|cubes?|prisms?|spheres?|cylinders?|cones?|pyramids?)\b/gi;

const singularShapeWord = (raw: string): GeometricShapeName | null => {
  const word = raw.toLowerCase();
  if (/^right/.test(word)) return 'right_triangle';
  if (/^triangular/.test(word)) return 'triangular_prism';
  if (/^rectangular/.test(word)) return 'rectangular_prism';
  if (/^triangles?$/.test(word)) return 'triangle';
  if (/^squares?$/.test(word)) return 'square';
  if (/^rectangles?$/.test(word)) return 'rectangle';
  if (/^parallelograms?$/.test(word)) return 'parallelogram';
  if (/^trapezoids?$/.test(word)) return 'trapezoid';
  if (/^pentagons?$/.test(word)) return 'pentagon';
  if (/^hexagons?$/.test(word)) return 'hexagon';
  if (/^cubes?$/.test(word)) return 'cube';
  if (/^prisms?$/.test(word)) return 'rectangular_prism';
  if (/^spheres?$/.test(word)) return 'sphere';
  if (/^cylinders?$/.test(word)) return 'cylinder';
  if (/^cones?$/.test(word)) return 'cone';
  if (/^pyramids?$/.test(word)) return 'pyramid';
  return null;
};

const shapeDisplayName = (shape: GeometricShapeName): string => {
  const names: Record<GeometricShapeName, string> = {
    triangle: 'Triangle',
    right_triangle: 'Right triangle',
    square: 'Square',
    rectangle: 'Rectangle',
    parallelogram: 'Parallelogram',
    trapezoid: 'Trapezoid',
    pentagon: 'Pentagon',
    hexagon: 'Hexagon',
    cube: 'Cube',
    rectangular_prism: 'Rectangular prism',
    triangular_prism: 'Triangular prism',
    sphere: 'Sphere',
    cylinder: 'Cylinder',
    cone: 'Cone',
    pyramid: 'Pyramid',
  };
  return names[shape] || 'Shape';
};

export type NamedShapeMention = {
  shape: GeometricShapeName;
  id?: string;
  nameLabel?: string;
  index: number;
};

/**
 * Extract shape mentions with their entity labels.
 * "Rectangle A and Rectangle B" -> two mentions (A, B).
 * "Rectangles A and B" -> two mentions (A, B).
 * "square inches" -> no mention.
 */
export const extractNamedShapeMentions = (text: string): NamedShapeMention[] => {
  const masked = maskNonShapePhrases(text);
  const mentions: NamedShapeMention[] = [];
  const seen = new Set<string>();

  const push = (shape: GeometricShapeName, id: string | undefined, index: number, instance = 0) => {
    const key = `${shape}:${id || ''}:${id ? '' : instance}`;
    if (seen.has(key)) return;
    seen.add(key);
    mentions.push({
      shape,
      id,
      nameLabel: id ? `${shapeDisplayName(shape)} ${id}` : undefined,
      index,
    });
  };

  const wordToCount = (raw: string): number => {
    const word = raw.toLowerCase();
    if (/^\d+$/.test(word)) return Math.max(1, Math.min(6, Number(word)));
    const values: Record<string, number> = {
      one: 1,
      a: 1,
      an: 1,
      two: 2,
      three: 3,
      four: 4,
      five: 5,
      six: 6,
    };
    return values[word] || 1;
  };

  const countBefore = (position: number): number => {
    const before = masked.slice(Math.max(0, position - 24), position);
    const match = before.match(/\b(one|two|three|four|five|six|\d{1,2})\s+$/i);
    return match ? wordToCount(match[1]) : 1;
  };

  for (const match of masked.matchAll(SHAPE_MENTION_RE)) {
    const raw = match[1];
    const shape = singularShapeWord(raw);
    if (!shape) continue;
    const index = match.index ?? 0;
    const end = index + match[0].length;
    const after = masked.slice(end);

    const idMatch = after.match(/^[ \t]+([A-Z]{1,3}|\d{1,2})(?![A-Za-z0-9])/);
    const id = idMatch ? idMatch[1] : undefined;
    const isPlural = /s$/i.test(raw.trim());

    // "Rectangles A and B" / "Rectangles A, B, and C" (plural only).
    const listMatch = isPlural
      ? /^[ \t]+((?:\b[A-Z]\b[ \t]*(?:,|and)[ \t]*)+\b[A-Z]\b)/.exec(after)
      : null;
    if (listMatch) {
      const ids = listMatch[1].match(/\b[A-Z]\b/g) || [];
      if (ids.length >= 2) {
        ids.forEach((entry) => push(shape, entry, index));
        continue;
      }
    }

    if (!id && isPlural) {
      const count = countBefore(index);
      for (let instance = 0; instance < count; instance++) {
        push(shape, undefined, index, instance);
      }
    } else {
      push(shape, id, index);
    }
  }

  const namedShapes = new Set(mentions.filter((mention) => mention.id).map((mention) => mention.shape));
  return mentions
    .filter((mention) => mention.id || !namedShapes.has(mention.shape))
    .sort((a, b) => a.index - b.index);
};

export const extractOrderedShapeNamesFromText = (text: string): GeometricShapeName[] => {
  const out: GeometricShapeName[] = [];
  const seen = new Set<GeometricShapeName>();
  for (const mention of extractNamedShapeMentions(text)) {
    if (seen.has(mention.shape)) continue;
    seen.add(mention.shape);
    out.push(mention.shape);
  }
  return out;
};

const stemCorpus = (question: QuestionVisualFields): string => {
  const options = Array.isArray(question.options) ? question.options : [];
  const idx = Number(question.correctAnswerIndex);
  const correct =
    Number.isInteger(idx) && idx >= 0 && idx < options.length ? String(options[idx]) : '';
  return `${String(question.text || '')} ${correct}`.trim();
};

const extractFractionPair = (text: string): { shaded: number; total: number } | null => {
  const slash = text.match(/\b(\d+)\s*\/\s*(\d+)\b/);
  if (slash) {
    const shaded = Number(slash[1]);
    const total = Number(slash[2]);
    if (Number.isFinite(shaded) && Number.isFinite(total) && total > 0 && shaded >= 0 && shaded <= total) {
      return { shaded, total };
    }
  }
  const words = text.match(/\b(\d+)\s+(?:out of|over)\s+(\d+)\b/i);
  if (words) {
    const shaded = Number(words[1]);
    const total = Number(words[2]);
    if (Number.isFinite(shaded) && Number.isFinite(total) && total > 0 && shaded >= 0 && shaded <= total) {
      return { shaded, total };
    }
  }

  // Conservative word fractions (no numeric a/b in the corpus) for deterministic SVG routing.
  if (!/\b\d+\s*\/\s*\d+\b/.test(text)) {
    const wordPatterns: Array<{ re: RegExp; shaded: number; total: number }> = [
      { re: /\bthree\s+fourths\b|\bthree\s+quarters\b/i, shaded: 3, total: 4 },
      { re: /\btwo\s+thirds\b/i, shaded: 2, total: 3 },
      { re: /\bone\s+half\b|\ba\s+half\b|\bone-half\b/i, shaded: 1, total: 2 },
      { re: /\bone\s+third\b|\ba\s+third\b/i, shaded: 1, total: 3 },
      {
        re: /\bone\s+fourth\b|\ba\s+fourth\b|\bone\s+quarter\b|\ba\s+quarter\b/i,
        shaded: 1,
        total: 4,
      },
    ];
    for (const { re, shaded, total } of wordPatterns) {
      if (re.test(text)) return { shaded, total };
    }
  }

  return null;
};

export type FractionAreaModel = { rows: number; shadedRows: number; cols: number; shadedCols: number };

/**
 * Recognize a fraction-multiplication area model (a/b × c/d) and return the
 * grid + shaded ranges. Handles both the explicit equation form and the prose
 * form ("divided into 3 equal rows, and 2 rows are shaded yellow … 5 equal
 * columns, and 4 columns are shaded blue … overlaps is green").
 */
export const extractFractionAreaModel = (text: string): FractionAreaModel | null => {
  const stem = String(text || '');
  if (!stem) return null;
  const inRange = (n: number): boolean => Number.isInteger(n) && n >= 1 && n <= 8;

  const pair =
    stem.match(/(\d+)\s*\/\s*(\d+)\s*(?:×|x|\*|times)\s*(\d+)\s*\/\s*(\d+)/i) ??
    stem.match(/\bproduct of\s+(\d+)\s*\/\s*(\d+)\s+and\s+(\d+)\s*\/\s*(\d+)/i);
  if (pair) {
    const shadedRows = Number(pair[1]);
    const rows = Number(pair[2]);
    const shadedCols = Number(pair[3]);
    const cols = Number(pair[4]);
    if (
      inRange(rows) &&
      inRange(cols) &&
      shadedRows >= 1 &&
      shadedRows <= rows &&
      shadedCols >= 1 &&
      shadedCols <= cols
    ) {
      return { rows, shadedRows, cols, shadedCols };
    }
  }

  // Prose form requires an explicit product/overlap context so a plain
  // partitioned-shape item is not turned into an area model.
  if (!/\boverlap\w*\b|\bproduct\b|\btimes\b|\bmultiply\w*\b|\bcovered by both\b|\bboth\b[^.?!]*\band\b|\d\s*[×x*]\s*\d/i.test(stem)) return null;

  const rowsM = stem.match(/(\d+)\s+equal\s+rows?\b/i);
  const colsM = stem.match(/(\d+)\s+equal\s+columns?\b/i);
  if (!rowsM || !colsM) return null;
  const rows = Number(rowsM[1]);
  const cols = Number(colsM[1]);
  if (!inRange(rows) || !inRange(cols)) return null;
  // "2 rows are shaded" or "covers 1 of the 4 rows".
  const shadedRows =
    stem.match(/(\d+)\s+rows?\s+(?:are|is)\s+shaded/i)?.[1] ?? stem.match(/(\d+)\s+of\s+the\s+\d+\s+rows\b/i)?.[1];
  const shadedCols =
    stem.match(/(\d+)\s+columns?\s+(?:are|is)\s+shaded/i)?.[1] ?? stem.match(/(\d+)\s+of\s+the\s+\d+\s+columns\b/i)?.[1];
  const sr = shadedRows ? Number(shadedRows) : rows;
  const sc = shadedCols ? Number(shadedCols) : cols;
  if (sr < 1 || sr > rows || sc < 1 || sc > cols) return null;
  return { rows, shadedRows: sr, cols, shadedCols: sc };
};

/**
 * Build a deterministic area model for fraction multiplication before the
 * single-factor fraction reconciler runs. This is the MA.5.FR.2.2 skeleton.
 */
export const reconcileFractionAreaModelFromStem = (question: QuestionVisualFields): void => {
  // A stem that spells out rows x columns wins over a model-sent strip (which just shows the product).
  if (question.visualSpec?.visualType === 'area_model') return;
  const model = extractFractionAreaModel(String(question.text || ''));
  if (!model) return;

  question.visualSpec = {
    visualType: 'area_model',
    gridRows: model.rows,
    gridCols: model.cols,
    highlightRows: model.shadedRows,
    highlightCols: model.shadedCols,
  };
  question.imagePrompt = '';
  if (!question.visualIntent) {
    question.visualIntent =
      'Shaded rows show the first fraction, shaded columns show the second, and the green overlap is the product.';
  }
};

export const reconcileFractionVisualFromStem = (question: QuestionVisualFields): void => {
  const corpus = stemCorpus(question);
  const pair = extractFractionPair(corpus);
  if (!pair) return;

  const vs = question.visualSpec;
  if (vs?.visualType === 'fraction_bar' || vs?.visualType === 'fraction_circle') {
    vs.totalParts = pair.total;
    vs.shadedParts = pair.shaded;
    question.imagePrompt = '';
    return;
  }
  if (vs?.visualType) return;

  question.visualSpec = {
    visualType: /\bcircle\b/i.test(corpus) ? 'fraction_circle' : 'fraction_bar',
    totalParts: pair.total,
    shadedParts: pair.shaded,
  };
  question.imagePrompt = '';
};

export const reconcileTenFrameFromStem = (question: QuestionVisualFields): void => {
  const text = String(question.text || '');
  const lower = text.toLowerCase();
  if (!/\bten[-\s]?frame\b/.test(lower) && !/\bdots?\b/.test(lower)) return;

  const filled = parseFilledDotsCountFromStem(text);
  if (filled === null) return;

  const vs = question.visualSpec;
  if (vs?.visualType && vs.visualType !== 'ten_frame') return;

  question.visualSpec = {
    visualType: 'ten_frame',
    values: normalizeTenFrameCells(
      Array.isArray(vs?.values) ? vs.values : Array.from({ length: 10 }, (_, index) => (index < filled ? 1 : 0)),
    ),
  };
  question.imagePrompt = '';
};

const PLACE_VALUE_CHART_TRIGGER =
  /\bplace value\b|\bexpanded form\b|\bthousands\b|\bhundreds\b|\bdigit\b|\bstandard form\b|\bword form\b|\bvalue of the\b/i;

/** Thousands → Ones digit chart from the first whole number up to 6 digits in the stem. */
export const reconcilePlaceValueChartFromStem = (question: QuestionVisualFields): void => {
  const stem = String(question.text || '');
  if (!PLACE_VALUE_CHART_TRIGGER.test(stem)) return;
  if (/\b\d+\.\d+\b/.test(stem)) return;

  // When the task is to produce standard form, the answer is the number itself.
  // A filled place-value chart would print it, so let the value-matched figure
  // (or the prompt path) show the given expanded/word form instead.
  const asksForStandardForm =
    /\b(?:standard\s+form|write\s+(?:it|the\s+number|this\s+number)\s+as\s+a\s+number|written\s+as\s+a\s+number)\b/i.test(
      stem,
    );
  if (asksForStandardForm) {
    if (question.visualSpec?.visualType === 'table') {
      question.visualSpec = undefined;
    }
    return;
  }
  // An expression such as "4,000 + 60 + 8" has no single given number to chart.
  if (/\d[\d,]*\s*[+\-×÷*/]\s*\d/.test(stem)) return;

  const intMatch = stem.replace(/,/g, '').match(/\b(\d{1,6})\b/);
  if (!intMatch) return;

  const n = Number(intMatch[1]);
  if (!Number.isInteger(n) || n < 0 || n > 999_999) return;

  const vs = question.visualSpec;
  if (vs?.visualType && vs.visualType !== 'table') return;

  const thousands = Math.floor(n / 1000);
  const hundreds = Math.floor((n % 1000) / 100);
  const tens = Math.floor((n % 100) / 10);
  const ones = n % 10;

  question.visualSpec = {
    visualType: 'table',
    columns: ['Thousands', 'Hundreds', 'Tens', 'Ones'],
    rows: [[String(thousands), String(hundreds), String(tens), String(ones)]],
  };
  question.imagePrompt = '';
  if (!question.visualIntent) {
    question.visualIntent = 'Use the place-value chart to see each digit of the number by place.';
  }
};

const NUMBER_LINE_TRIGGER =
  /\bnumber line\b|\bon the number line\b|\bmark on\b|\bpoint on\b/i;

const extractNumericLiteralsFromStem = (stem: string): number[] => {
  const normalized = stem.replace(/,/g, '');
  const out: number[] = [];
  for (const m of normalized.matchAll(/\b\d+(?:\.\d+)?\b/g)) {
    const v = Number(m[0]);
    if (Number.isFinite(v)) out.push(v);
  }
  return out;
};

const inferNumberLineTickStep = (min: number, max: number): number => {
  const span = max - min;
  if (!(span > 0)) return 1;
  const bothInt = Number.isInteger(min) && Number.isInteger(max) && Number.isInteger(span);
  if (span <= 24 && bothInt) return 1;
  if (span <= 200) return Math.max(1, Math.round(span / 12));
  const rough = span / 15;
  const pow10 = 10 ** Math.floor(Math.log10(Math.max(rough, 1)));
  return Math.max(pow10, Math.round(rough / pow10) * pow10);
};

/** Number line spanning numeric literals in the stem; does not mark any answer position. */
export const reconcileNumberLineFromStem = (question: QuestionVisualFields): void => {
  const stem = String(question.text || '');
  if (!NUMBER_LINE_TRIGGER.test(stem)) return;

  let nums = extractNumericLiteralsFromStem(stem);
  nums = [...new Set(nums)];
  if (nums.length === 0) return;

  let min = Math.min(...nums);
  let max = Math.max(...nums);
  if (min === max) {
    const pad = Math.abs(min) >= 100 ? Math.round(Math.abs(min) * 0.05) : 10;
    min -= Math.max(1, pad);
    max += Math.max(1, pad);
  }

  const vs = question.visualSpec;
  if (vs?.visualType && vs.visualType !== 'number_line') return;

  const tickStep = inferNumberLineTickStep(min, max);

  question.visualSpec = {
    visualType: 'number_line',
    min,
    max,
    tickStep,
    xLabel: 'Number line',
  };
  question.imagePrompt = '';
  if (!question.visualIntent) {
    question.visualIntent = 'Use the number line to locate or compare the values mentioned in the question.';
  }
};

/** Decimal place-value table (ones through thousandths) from the first decimal literal in the stem. */
export const reconcileDecimalTableFromStem = (question: QuestionVisualFields): void => {
  const stem = String(question.text || '');
  if (!/\b\d+\.\d+\b/.test(stem)) return;
  if (!/\b(?:place\b|value of|expanded|which\s+digit)\b/i.test(stem)) return;

  const decMatch = stem.match(/\b\d+\.\d+\b/);
  if (!decMatch) return;

  const raw = decMatch[0];
  const [wholePart, fracPartRaw = ''] = raw.split('.');
  const fracDigits = (fracPartRaw.replace(/\D/g, '') + '000').slice(0, 3);

  const vs = question.visualSpec;
  if (vs?.visualType && vs.visualType !== 'table') return;

  question.visualSpec = {
    visualType: 'table',
    columns: ['Ones', 'Tenths', 'Hundredths', 'Thousandths'],
    rows: [[wholePart, fracDigits[0] ?? '0', fracDigits[1] ?? '0', fracDigits[2] ?? '0']],
  };
  question.imagePrompt = '';
  if (!question.visualIntent) {
    question.visualIntent = 'Use the table to read each digit of the decimal by place (ones and tenths through thousandths).';
  }
};

const UNIT_PATTERN =
  '(?:square\\s+[a-zA-Z]+|sq\\.?\\s*[a-zA-Z.]+|cubic\\s+[a-zA-Z]+|inches?|feet|foot|ft|in|centimeters?|cm|meters?|m|millimeters?|mm|yards?|yd|miles?|mi|units?)';

type ParsedMeasurement = { value: number; label: string } | null;

const parseKeywordMeasurement = (clause: string, keyword: string): ParsedMeasurement => {
  // Keywords may be a single word or an alternation fragment (e.g. "radius|radii").
  // The trailing s? tolerates plurals such as "side lengths" and "widths".
  const re = new RegExp(
    `\\b(?:${keyword})s?\\b[^.\\n\\d]{0,40}?(\\d+(?:\\.\\d+)?)\\s*(${UNIT_PATTERN})?`,
    'i',
  );
  const match = clause.match(re);
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value)) return null;
  const unit = match[2] ? match[2].trim() : '';
  return { value, label: `${match[1]}${unit ? ` ${unit}` : ''}` };
};

const parseAdjectiveMeasurement = (clause: string, adjective: string): ParsedMeasurement => {
  const re = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(${UNIT_PATTERN})\\s+(?:${adjective})\\b`, 'i');
  const match = clause.match(re);
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value)) return null;
  return { value, label: `${match[1]} ${match[2].trim()}` };
};

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const sentencesFor = (text: string): string[] =>
  String(text || '')
    .split(/(?<=[.!?])\s+|\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

const clauseForMention = (corpus: string, mention: NamedShapeMention): string => {
  const sentences = sentencesFor(corpus);
  if (mention.nameLabel) {
    const label = escapeRegExp(mention.nameLabel);
    const byLabel = sentences.find((sentence) => new RegExp(`\\b${label}\\b`, 'i').test(sentence));
    if (byLabel) return byLabel;
  }
  const shapePattern = escapeRegExp(mention.shape.replace(/_/g, ' '));
  if (mention.id) {
    const byId = sentences.find(
      (sentence) =>
        new RegExp(`\\b${shapePattern}\\b`, 'i').test(sentence) &&
        new RegExp(`\\b${escapeRegExp(mention.id)}\\b`).test(sentence),
    );
    if (byId) return byId;
  }
  return sentences.find((sentence) => new RegExp(`\\b${shapePattern}\\b`, 'i').test(sentence)) || corpus;
};

type FigureMeasurements = {
  length?: ParsedMeasurement;
  width?: ParsedMeasurement;
  height?: ParsedMeasurement;
  area?: ParsedMeasurement;
  perimeter?: ParsedMeasurement;
  side?: ParsedMeasurement;
  radius?: ParsedMeasurement;
  diameter?: ParsedMeasurement;
  base?: ParsedMeasurement;
};

const readMeasurements = (corpus: string, mention: NamedShapeMention): FigureMeasurements => {
  const clause = clauseForMention(corpus, mention);
  return {
    length: parseKeywordMeasurement(clause, 'length') || parseAdjectiveMeasurement(clause, 'long'),
    width: parseKeywordMeasurement(clause, 'width') || parseAdjectiveMeasurement(clause, 'wide'),
    height:
      parseKeywordMeasurement(clause, 'height') ||
      parseAdjectiveMeasurement(clause, 'high') ||
      parseAdjectiveMeasurement(clause, 'tall'),
    area: parseKeywordMeasurement(clause, 'area'),
    perimeter: parseKeywordMeasurement(clause, 'perimeter'),
    side: parseKeywordMeasurement(clause, 'side|edge'),
    radius: parseKeywordMeasurement(clause, 'radius|radii'),
    diameter: parseKeywordMeasurement(clause, 'diameter'),
    base: parseKeywordMeasurement(clause, 'base'),
  };
};

const globalArea = (corpus: string): ParsedMeasurement => {
  const matches = [...corpus.matchAll(new RegExp(`\\barea\\b\\s*(?:of|is|are|=|:)?\\s*(\\d+(?:\\.\\d+)?)\\s*(${UNIT_PATTERN})?`, 'gi'))];
  for (const match of matches) {
    const value = Number(match[1]);
    if (!Number.isFinite(value)) continue;
    const unit = match[2] ? match[2].trim() : '';
    return { value, label: `${match[1]}${unit ? ` ${unit}` : ''}` };
  }
  return null;
};

const buildFigureFromMention = (
  corpus: string,
  mention: NamedShapeMention,
  fallbackArea: ParsedMeasurement,
): VisualFigure | null => {
  const measurements = readMeasurements(corpus, mention);
  const area = measurements.area || fallbackArea;
  const isRectangleLike = mention.shape === 'rectangle' || mention.shape === 'square';
  const hasSolidDims = Boolean(
    measurements.side || measurements.radius || measurements.diameter || measurements.base,
  );
  if (
    !mention.nameLabel &&
    !measurements.length &&
    !measurements.width &&
    !measurements.height &&
    !area &&
    !hasSolidDims
  ) {
    return null;
  }

  const figure: VisualFigure = {
    id: mention.id,
    shape: mention.shape,
    nameLabel: mention.nameLabel,
  };

  const dimensions: NonNullable<VisualFigure['dimensions']> = [];
  let horizontal = measurements.length?.value ?? measurements.width?.value ?? measurements.side?.value;
  let vertical = measurements.height?.value;
  const lengthLabel = measurements.length?.label;
  const widthLabel = measurements.width?.label;
  const heightLabel = measurements.height?.label;
  const sideLabel = measurements.side?.label;

  if (mention.shape === 'square') {
    const side = horizontal ?? vertical;
    if (side !== undefined) {
      figure.width = side;
      figure.height = side;
      if (lengthLabel) dimensions.push({ side: 'top', label: lengthLabel });
      else if (widthLabel) dimensions.push({ side: 'right', label: widthLabel });
      else if (heightLabel) dimensions.push({ side: 'right', label: heightLabel });
      else if (sideLabel) dimensions.push({ side: 'top', label: sideLabel });
    } else if (area) {
      const side = Math.sqrt(area.value);
      if (Number.isFinite(side) && side > 0) {
        figure.width = side;
        figure.height = side;
      }
    }
  } else if (mention.shape === 'rectangle') {
    if (horizontal !== undefined && vertical !== undefined) {
      figure.width = horizontal;
      figure.height = vertical;
    } else if (horizontal !== undefined && area) {
      figure.width = horizontal;
      figure.height = area.value / horizontal;
    } else if (vertical !== undefined && area) {
      figure.height = vertical;
      figure.width = area.value / vertical;
    } else {
      if (horizontal !== undefined) figure.width = horizontal;
      if (vertical !== undefined) figure.height = vertical;
    }
    if (lengthLabel) dimensions.push({ side: 'top', label: lengthLabel });
    else if (sideLabel) dimensions.push({ side: 'top', label: sideLabel });
    if (widthLabel) dimensions.push({ side: 'right', label: widthLabel });
    if (heightLabel) dimensions.push({ side: 'right', label: heightLabel });
  } else if (isSolidShape(mention.shape)) {
    const shape = mention.shape;
    const radiusValue = measurements.radius?.value;
    const diameterValue = measurements.diameter?.value;
    const radiusLabel = measurements.radius?.label;
    const diameterLabel = measurements.diameter?.label;
    const sideLabel = measurements.side?.label;
    const baseLabel = measurements.base?.label;

    if (shape === 'sphere') {
      const d = diameterValue ?? (radiusValue !== undefined ? radiusValue * 2 : undefined);
      if (d !== undefined) {
        figure.width = d;
        figure.height = d;
        const label = diameterLabel || radiusLabel;
        if (label) dimensions.push({ side: 'top', label });
      }
    } else if (shape === 'cylinder' || shape === 'cone') {
      const baseR = radiusValue ?? (diameterValue !== undefined ? diameterValue / 2 : undefined);
      if (baseR !== undefined) figure.width = baseR * 2;
      if (vertical !== undefined) figure.height = vertical;
      else if (horizontal !== undefined) figure.height = horizontal;
      if (!figure.width && figure.height) figure.width = figure.height * 0.7;
      const topLabel = radiusLabel || diameterLabel || baseLabel;
      if (topLabel) dimensions.push({ side: 'top', label: topLabel });
      if (heightLabel) dimensions.push({ side: 'right', label: heightLabel });
    } else if (shape === 'pyramid') {
      const baseVal = measurements.side?.value ?? measurements.base?.value ?? horizontal;
      if (baseVal !== undefined) figure.width = baseVal;
      if (vertical !== undefined) figure.height = vertical;
      else if (horizontal !== undefined && horizontal !== baseVal) figure.height = horizontal;
      if (!figure.width && figure.height) figure.width = figure.height;
      if (baseLabel) dimensions.push({ side: 'bottom', label: baseLabel });
      else if (sideLabel) dimensions.push({ side: 'bottom', label: sideLabel });
      if (heightLabel) dimensions.push({ side: 'right', label: heightLabel });
    } else if (shape === 'cube') {
      const s = measurements.side?.value ?? horizontal ?? vertical;
      if (s !== undefined) {
        figure.width = s;
        figure.height = s;
        const label = sideLabel || lengthLabel || widthLabel || heightLabel;
        if (label) dimensions.push({ side: 'top', label });
      }
    } else {
      // rectangular_prism / triangular_prism
      const prismWidth = measurements.side?.value ?? horizontal;
      if (prismWidth !== undefined) figure.width = prismWidth;
      if (vertical !== undefined) figure.height = vertical;
      else if (horizontal !== undefined && horizontal !== prismWidth) figure.height = horizontal;
      if (!figure.width && figure.height) figure.width = figure.height;
      if (lengthLabel) dimensions.push({ side: 'top', label: lengthLabel });
      else if (sideLabel) dimensions.push({ side: 'top', label: sideLabel });
      if (heightLabel) dimensions.push({ side: 'right', label: heightLabel });
    }
  } else {
    // Non-rectangles keep their names and any side labels, but no dimension lines.
    if (lengthLabel) dimensions.push({ side: 'top', label: lengthLabel });
    if (widthLabel) dimensions.push({ side: 'right', label: widthLabel });
    if (heightLabel) dimensions.push({ side: 'right', label: heightLabel });
  }

  if (dimensions.length) figure.dimensions = dimensions;
  if (area && isRectangleLike) figure.areaLabel = area.label;
  if (measurements.perimeter) {
    // Perimeter is a given label for non-area questions, but never draw it as an answer.
    figure.areaLabel = figure.areaLabel || measurements.perimeter.label;
  }

  return figure;
};

/**
 * Build full per-entity figures when the stem names or measures them.
 * Measurements are preserved as exact labels. Derived dimensions are used for
 * drawing scale only and never added as labels.
 */
export const reconcileGeometricVisualFromStem = (question: QuestionVisualFields): void => {
  const corpus = stemCorpus(question);
  const mentions = extractNamedShapeMentions(corpus);
  if (!mentions.length) return;

  const vs = question.visualSpec;
  if (vs?.visualType && vs.visualType !== 'geometric_shape') return;

  const fallbackArea = globalArea(corpus);
  const figures = mentions
    .map((mention) => buildFigureFromMention(corpus, mention, fallbackArea))
    .filter((figure): figure is VisualFigure => Boolean(figure));

  const hasFigureDetail = figures.some(
    (figure) =>
      Boolean(figure.nameLabel) ||
      Boolean(figure.dimensions?.length) ||
      Boolean(figure.areaLabel),
  );

  if (hasFigureDetail) {
    question.visualSpec = {
      ...(vs || {}),
      visualType: 'geometric_shape',
      figures,
    };
    question.imagePrompt = '';
    return;
  }

  const shapes = extractOrderedShapeNamesFromText(corpus);
  if (shapes.length >= 2) {
    question.visualSpec = {
      visualType: 'geometric_shape',
      shapes,
    };
    question.imagePrompt = '';
    return;
  }

  if (!questionStemRequiresImage(String(question.text || ''))) return;
  if (vs?.visualType === 'geometric_shape' && (vs.shapeName || (vs.shapes && vs.shapes.length))) return;

  question.visualSpec = {
    visualType: 'geometric_shape',
    shapeName: shapes[0],
  };
  question.imagePrompt = '';
};

const DATA_PAIR =
  /\b([A-Z][a-zA-Z]+(?: [A-Z][a-zA-Z]*)?) (?:has|have|had|read|found|picked|collected|sold|got|scored|saw|ate|earned|received|with)? ?(\d{1,4})(?: ([a-z]+))?/g;

/** Tally charts and picture graphs are drawn as tally marks / icons (bar_chart chartStyle), never a number table. */
export const countDisplayStyle = (stem: string): { chartStyle: 'pictures' | 'tally'; iconUnit?: number } | null => {
  if (/\btally\b/i.test(stem)) return { chartStyle: 'tally' };
  if (!/\b(?:picture graph|pictograph)\b|\beach (?:picture|symbol|icon)\b/i.test(stem)) return null;
  const unit = stem.match(/\beach (?:picture|symbol|icon|\w+) (?:stands for|represents|equals|is worth|=) (\d+)/i)?.[1];
  return { chartStyle: 'pictures', iconUnit: unit ? Number(unit) : 1 };
};

/**
 * "The bar graph shows ...: Maya read 6 books, Leo read 9 books" → bar_chart / table of
 * those pairs. The quiz model's spec cannot carry categories, so without this the item
 * talks about a graph that never appears.
 */
export const reconcileDataDisplayFromStem = (question: QuestionVisualFields): void => {
  const stem = String(question.text || '');
  const style = countDisplayStyle(stem);
  const kind = style || /\bbar (?:graph|chart)\b/i.test(stem) ? 'bar_chart' : /\btable\b/i.test(stem) ? 'table' : null;
  if (!kind) return;
  const pairs: Array<{ name: string; value: number; unit?: string }> = [];
  for (const m of stem.matchAll(DATA_PAIR)) {
    if (/^(?:The|A|An|On|In|How|What|Which|If)\b/.test(m[1])) continue;
    if (!pairs.some((p) => p.name === m[1])) pairs.push({ name: m[1], value: Number(m[2]), unit: m[3] });
  }
  if (pairs.length < 2) return;
  question.imagePrompt = '';
  if (kind === 'bar_chart') {
    question.visualSpec = { visualType: 'bar_chart', categories: pairs.map((p) => p.name), values: pairs.map((p) => p.value), ...style };
    return;
  }
  const unit = pairs[0].unit;
  question.visualSpec = {
    visualType: 'table',
    columns: ['Name', unit ? unit.charAt(0).toUpperCase() + unit.slice(1) : 'Number'],
    rows: pairs.map((p) => [p.name, String(p.value)]),
  };
};

export const applyQuestionVisualReconcilers = (question: QuestionVisualFields): void => {
  reconcileWordPlaceValueFromStem(question as never);
  reconcileExactCountObjectsFromStem(question as never);
  reconcileCoordinatePlaneFromStem(question);
  reconcilePartPartWholeFromStem(question);
  reconcileTenFrameAdditionFromStem(question);
  coerceTenFrameAdditionVisualSpec(question);
  reconcileBlocksMissingAddendToTen(question);
  reconcileMakeTenQuestion(question);
  reconcilePlaceValueTeensFromStem(question);
  reconcileColoredBlockTrainsFromStem(question);
  reconcileFractionAreaModelFromStem(question);
  reconcileFractionVisualFromStem(question);
  reconcileTenFrameFromStem(question);
  reconcileGeometricVisualFromStem(question);
  reconcilePlaceValueChartFromStem(question);
  reconcileNumberLineFromStem(question);
  reconcileDecimalTableFromStem(question);
  reconcileSceneImageFromStem(question);
  // Last, so a stem that names its data display gets that display.
  reconcileDataDisplayFromStem(question);
};
