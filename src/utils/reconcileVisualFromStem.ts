import { GeometricShapeName } from '../types';
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
    shapeName?: string;
    shapes?: string[];
    values?: unknown[];
    totalParts?: number;
    shadedParts?: number;
    min?: number;
    max?: number;
    tickStep?: number;
    columns?: string[];
    rows?: string[][];
    xLabel?: string;
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
];

export const extractOrderedShapeNamesFromText = (text: string): GeometricShapeName[] => {
  const matches: Array<{ name: GeometricShapeName; index: number }> = [];
  const seen = new Set<GeometricShapeName>();
  for (const { name, pattern } of STEM_SHAPE_FORMS) {
    const match = pattern.exec(text);
    if (!match || seen.has(name)) continue;
    seen.add(name);
    matches.push({ name, index: match.index });
  }
  return matches.sort((a, b) => a.index - b.index).map((entry) => entry.name);
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

  const intMatch = stem.match(/\b(\d{1,6})\b/);
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

export const reconcileGeometricVisualFromStem = (question: QuestionVisualFields): void => {
  const corpus = stemCorpus(question);
  const shapes = extractOrderedShapeNamesFromText(corpus);
  if (!shapes.length) return;

  const vs = question.visualSpec;
  if (vs?.visualType && vs.visualType !== 'geometric_shape') return;

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

export const applyQuestionVisualReconcilers = (question: QuestionVisualFields): void => {
  reconcileWordPlaceValueFromStem(question);
  reconcileExactCountObjectsFromStem(question);
  reconcileCoordinatePlaneFromStem(question);
  reconcilePartPartWholeFromStem(question);
  reconcileTenFrameAdditionFromStem(question);
  coerceTenFrameAdditionVisualSpec(question);
  reconcileBlocksMissingAddendToTen(question);
  reconcileMakeTenQuestion(question);
  reconcilePlaceValueTeensFromStem(question);
  reconcileColoredBlockTrainsFromStem(question);
  reconcileFractionVisualFromStem(question);
  reconcileTenFrameFromStem(question);
  reconcileGeometricVisualFromStem(question);
  reconcilePlaceValueChartFromStem(question);
  reconcileNumberLineFromStem(question);
  reconcileDecimalTableFromStem(question);
  reconcileSceneImageFromStem(question);
};
