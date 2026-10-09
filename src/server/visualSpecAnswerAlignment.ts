/**
 * Semantic alignment between a question's visualSpec and the question stem +
 * correct answer option. This catches "schema-valid but value-wrong" specs
 * (e.g. stem says 3/5, spec says totalParts=5/shadedParts=2) before the user
 * ever sees them. Fires after the schema-level validateQuestionVisualSpec.
 *
 * Distractor options are intentionally NOT used as evidence; only the stem and
 * the correct option count, so a distractor depicting a different value can't
 * false-pass the check.
 *
 * v1 limitations (documented):
 * - Only digit-form numbers are matched. Word forms ("two-thirds", "twenty")
 *   are not parsed; future v1.1 if needed.
 * - Unicode fraction glyphs (½, ¾) are normalized into N/M form before parsing.
 */

export interface QuestionLite {
  text: string;
  options: string[];
  correctAnswerIndex: number;
  visualSpec?: unknown;
}

const UNICODE_FRACTION_MAP: Record<string, string> = {
  '½': '1/2',
  '⅓': '1/3',
  '⅔': '2/3',
  '¼': '1/4',
  '¾': '3/4',
  '⅕': '1/5',
  '⅖': '2/5',
  '⅗': '3/5',
  '⅘': '4/5',
  '⅙': '1/6',
  '⅚': '5/6',
  '⅛': '1/8',
  '⅜': '3/8',
  '⅝': '5/8',
  '⅞': '7/8',
};

const SHAPE_NAME_FORMS: Record<string, string[]> = {
  triangle: ['triangle'],
  right_triangle: ['right triangle', 'right-triangle'],
  square: ['square'],
  rectangle: ['rectangle'],
  parallelogram: ['parallelogram'],
  trapezoid: ['trapezoid', 'trapezium'],
  pentagon: ['pentagon'],
  hexagon: ['hexagon'],
};

const normalizeText = (text: string): string => {
  let out = String(text || '');
  for (const [glyph, replacement] of Object.entries(UNICODE_FRACTION_MAP)) {
    if (out.includes(glyph)) out = out.split(glyph).join(` ${replacement} `);
  }
  return out.toLowerCase().replace(/\s+/g, ' ').trim();
};

/** Stem + correct-option corpus, as a single normalized lowercase string. */
const buildEvidenceCorpus = (q: QuestionLite): string => {
  const correctOption =
    Number.isInteger(q.correctAnswerIndex) &&
    q.correctAnswerIndex >= 0 &&
    q.correctAnswerIndex < q.options.length
      ? q.options[q.correctAnswerIndex]
      : '';
  return normalizeText(`${q.text} ${correctOption}`);
};

/** All numeric tokens (integers and decimals) in the corpus. */
const extractNumericTokens = (corpus: string): Set<string> => {
  const out = new Set<string>();
  const matches = corpus.match(/-?\d+(?:\.\d+)?/g) || [];
  for (const m of matches) {
    out.add(m);
    if (m.includes('.')) {
      const trimmed = m.replace(/\.?0+$/, '');
      if (trimmed && trimmed !== '-') out.add(trimmed);
    }
  }
  return out;
};

/** Parses N/M, "N out of M", "N over M" into fraction tuples. */
const extractFractionPairs = (corpus: string): Array<{ n: number; d: number }> => {
  const out: Array<{ n: number; d: number }> = [];
  const slashRe = /(\d+)\s*\/\s*(\d+)/g;
  for (const m of corpus.matchAll(slashRe)) {
    const n = Number(m[1]);
    const d = Number(m[2]);
    if (Number.isFinite(n) && Number.isFinite(d) && d > 0) out.push({ n, d });
  }
  const wordRe = /(\d+)\s+(?:out of|over)\s+(\d+)/g;
  for (const m of corpus.matchAll(wordRe)) {
    const n = Number(m[1]);
    const d = Number(m[2]);
    if (Number.isFinite(n) && Number.isFinite(d) && d > 0) out.push({ n, d });
  }
  return out;
};

/** Parses "(x, y)" or "(x,y)" coordinate pairs. */
const extractCoordinatePairs = (corpus: string): Array<{ x: number; y: number }> => {
  const out: Array<{ x: number; y: number }> = [];
  const re = /\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/g;
  for (const m of corpus.matchAll(re)) {
    const x = Number(m[1]);
    const y = Number(m[2]);
    if (Number.isFinite(x) && Number.isFinite(y)) out.push({ x, y });
  }
  return out;
};

/** Parses "H:MM", "H:MM AM/PM", "H o'clock" into times. */
const extractClockTimes = (corpus: string): Array<{ hour: number; minute: number }> => {
  const out: Array<{ hour: number; minute: number }> = [];
  const hmRe = /(\d{1,2}):(\d{2})/g;
  for (const m of corpus.matchAll(hmRe)) {
    const h = Number(m[1]);
    const min = Number(m[2]);
    if (Number.isInteger(h) && h >= 0 && h <= 23 && Number.isInteger(min) && min >= 0 && min <= 59) {
      out.push({ hour: h, minute: min });
    }
  }
  const oclockRe = /(\d{1,2})\s*(?:o'?clock|o clock)/g;
  for (const m of corpus.matchAll(oclockRe)) {
    const h = Number(m[1]);
    if (Number.isInteger(h) && h >= 0 && h <= 23) out.push({ hour: h, minute: 0 });
  }
  return out;
};

/** True if a number appears in the corpus as a digit token, or matches any fraction's decimal. */
const corpusContainsNumber = (corpus: string, value: number, fractions?: Array<{ n: number; d: number }>): boolean => {
  if (!Number.isFinite(value)) return false;
  const tokens = extractNumericTokens(corpus);
  if (tokens.has(String(value))) return true;
  if (Number.isInteger(value) && tokens.has(`${value}.0`)) return true;
  if (!Number.isInteger(value)) {
    const rounded = Number(value.toFixed(2));
    if (tokens.has(String(rounded))) return true;
  }
  if (fractions) {
    for (const f of fractions) {
      if (Math.abs(f.n / f.d - value) < 1e-2) return true;
    }
  }
  return false;
};

/** Whole-word substring match against the corpus. */
const corpusContainsPhrase = (corpus: string, phrase: string): boolean => {
  const target = normalizeText(phrase);
  if (!target) return false;
  const escaped = target.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  const re = new RegExp(`(?:^|\\W)${escaped}(?:\\W|$)`);
  return re.test(corpus);
};

const checkFractionAlignment = (
  spec: Record<string, unknown>,
  corpus: string,
  type: 'fraction_bar' | 'fraction_circle',
): string | null => {
  const total = Number(spec.totalParts);
  const shaded = Number(spec.shadedParts);
  if (!Number.isFinite(total) || !Number.isFinite(shaded)) return null;
  const fractions = extractFractionPairs(corpus);
  if (fractions.some((f) => f.n === shaded && f.d === total)) return null;
  const decimal = total > 0 ? shaded / total : NaN;
  if (Number.isFinite(decimal) && corpusContainsNumber(corpus, Number(decimal.toFixed(4)))) return null;
  if (shaded === 0 && (corpus.includes('zero') || corpusContainsNumber(corpus, 0))) return null;
  if (shaded === total && (corpus.includes('whole') || corpus.includes('all') || corpus.includes('one whole'))) {
    return null;
  }
  return `${type} shadedParts/totalParts (${shaded}/${total}) not referenced in stem or correct option.`;
};

const checkTenFrameAlignment = (spec: Record<string, unknown>, corpus: string): string | null => {
  const values = Array.isArray(spec.values) ? spec.values : [];
  const filled = values.reduce((sum: number, v) => sum + (Number(v) >= 1 ? 1 : 0), 0);
  const onesCount = Number.isFinite(Number(spec.onesCount)) ? Math.floor(Number(spec.onesCount)) : 0;
  const tensCount = Number.isFinite(Number(spec.tensCount)) ? Math.floor(Number(spec.tensCount)) : 0;
  if (tensCount > 0) {
    const total = tensCount * 10 + onesCount;
    if (corpusContainsNumber(corpus, total)) return null;
    if (/\bnumber\s+word\b|\bstandard\s+form\b|\bword\s+form\b/.test(corpus)) return null;
    if (corpusContainsNumber(corpus, tensCount) && corpusContainsNumber(corpus, onesCount)) return null;
  }
  if (corpusContainsNumber(corpus, filled)) return null;
  if (onesCount > 0 && corpusContainsNumber(corpus, onesCount)) return null;
  if (onesCount > 0 && corpusContainsNumber(corpus, filled + onesCount)) return null;
  if (filled === 10 && (corpus.includes('1 ten') || corpus.includes('one ten'))) return null;
  return `ten_frame filled count (${filled}) not referenced in stem or correct option.`;
};

const checkNumberLineAlignment = (spec: Record<string, unknown>, corpus: string): string | null => {
  const values = Array.isArray(spec.values) ? spec.values : [];
  if (!values.length) return null;
  const fractions = extractFractionPairs(corpus);
  for (const v of values) {
    const n = Number(v);
    if (!Number.isFinite(n)) continue;
    if (!corpusContainsNumber(corpus, n, fractions)) {
      return `number_line value ${n} not referenced in stem or correct option.`;
    }
  }
  return null;
};

const checkArrayModelAlignment = (spec: Record<string, unknown>, corpus: string): string | null => {
  const r = Number(spec.gridRows);
  const c = Number(spec.gridCols);
  if (!Number.isInteger(r) || !Number.isInteger(c)) return null;

  const rowColors = Array.isArray(spec.rowColors) ? spec.rowColors.map(String) : [];
  if (rowColors.length >= 2) {
    for (const color of rowColors) {
      if (!corpusContainsPhrase(corpus, color)) {
        return `array_model row color "${color}" not referenced in stem or correct option.`;
      }
    }
    const values = Array.isArray(spec.values) ? spec.values : [];
    const filledByRow: number[] = [];
    for (let row = 0; row < r; row++) {
      let filled = 0;
      for (let col = 0; col < c; col++) {
        const value = Number(values[row * c + col]);
        if (Number.isFinite(value) && value >= 1) filled += 1;
      }
      filledByRow.push(filled);
    }
    if (filledByRow.some((count) => corpusContainsNumber(corpus, count))) return null;
  }

  if (corpusContainsNumber(corpus, r) && corpusContainsNumber(corpus, c)) return null;
  if (corpusContainsNumber(corpus, r * c)) return null;
  if (corpusContainsPhrase(corpus, `${r} by ${c}`) || corpusContainsPhrase(corpus, `${r}x${c}`)) {
    return null;
  }
  return `array_model dimensions (${r}×${c}) not referenced in stem or correct option.`;
};

const checkAreaModelAlignment = (spec: Record<string, unknown>, corpus: string): string | null => {
  const labels = [
    ...((Array.isArray(spec.rowLabels) ? spec.rowLabels : []) as unknown[]),
    ...((Array.isArray(spec.colLabels) ? spec.colLabels : []) as unknown[]),
  ];
  for (const raw of labels) {
    const label = String(raw).trim();
    if (!label) continue;
    const num = Number(label);
    if (Number.isFinite(num)) {
      if (!corpusContainsNumber(corpus, num)) {
        return `area_model row/col label "${label}" not referenced in stem or correct option.`;
      }
    } else if (!corpusContainsPhrase(corpus, label)) {
      return `area_model row/col label "${label}" not referenced in stem or correct option.`;
    }
  }
  return null;
};

const checkCoordinatePlaneAlignment = (spec: Record<string, unknown>, corpus: string): string | null => {
  const points = Array.isArray(spec.points) ? spec.points : [];
  if (!points.length) return null;
  const pairs = extractCoordinatePairs(corpus);
  for (const p of points) {
    if (!p || typeof p !== 'object') continue;
    const x = Number((p as { x?: unknown }).x);
    const y = Number((p as { y?: unknown }).y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    const matchesPair = pairs.some((pp) => Math.abs(pp.x - x) < 1e-6 && Math.abs(pp.y - y) < 1e-6);
    if (matchesPair) continue;
    if (corpusContainsNumber(corpus, x) && corpusContainsNumber(corpus, y)) continue;
    return `coordinate_plane point (${x}, ${y}) not referenced in stem or correct option.`;
  }
  return null;
};

const checkGeometricShapeAlignment = (spec: Record<string, unknown>, corpus: string): string | null => {
  const shapes = (Array.isArray(spec.shapes) ? spec.shapes : [])
    .map((entry) => String(entry).trim())
    .filter(Boolean);
  if (shapes.length >= 2) {
    for (const shapeName of shapes) {
      const forms = SHAPE_NAME_FORMS[shapeName] || [shapeName];
      if (!forms.some((form) => corpusContainsPhrase(corpus, form))) {
        return `geometric_shape "${shapeName}" not referenced in stem or correct option.`;
      }
    }
    return null;
  }

  const shapeName = String(spec.shapeName || '').trim();
  if (!shapeName) return null;
  const forms = SHAPE_NAME_FORMS[shapeName] || [shapeName];
  if (!forms.some((form) => corpusContainsPhrase(corpus, form))) {
    return `geometric_shape "${shapeName}" not referenced in stem or correct option.`;
  }
  return null;
};

const checkBarModelAlignment = (spec: Record<string, unknown>, corpus: string): string | null => {
  const labels = (Array.isArray(spec.segmentLabels) ? spec.segmentLabels : []) as unknown[];
  for (const raw of labels) {
    const label = String(raw).trim();
    if (!label || label === '?') continue;
    const num = Number(label);
    if (Number.isFinite(num)) {
      if (!corpusContainsNumber(corpus, num)) {
        return `bar_model segment label "${label}" not referenced in stem or correct option.`;
      }
    } else if (!corpusContainsPhrase(corpus, label)) {
      return `bar_model segment label "${label}" not referenced in stem or correct option.`;
    }
  }
  return null;
};

const checkClockFaceAlignment = (spec: Record<string, unknown>, corpus: string): string | null => {
  const hour = Number(spec.hour);
  const minute = Number(spec.minute);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
  const times = extractClockTimes(corpus);
  const hour12 = ((hour % 12) + 12) % 12 || 12;
  if (times.some((t) => (t.hour === hour || t.hour % 12 === hour % 12) && t.minute === minute)) {
    return null;
  }
  if (minute === 0) {
    if (corpusContainsPhrase(corpus, `${hour12} o'clock`) || corpusContainsPhrase(corpus, `${hour12} oclock`)) {
      return null;
    }
  }
  return `clock_face time ${hour}:${String(minute).padStart(2, '0')} not referenced in stem or correct option.`;
};

const checkBarChartAlignment = (spec: Record<string, unknown>, corpus: string): string | null => {
  const categories = (Array.isArray(spec.categories) ? spec.categories : []) as unknown[];
  for (const raw of categories) {
    const cat = String(raw).trim();
    if (!cat) continue;
    const num = Number(cat);
    if (Number.isFinite(num)) {
      if (!corpusContainsNumber(corpus, num)) {
        return `bar_chart category "${cat}" not referenced in stem or correct option.`;
      }
    } else if (!corpusContainsPhrase(corpus, cat)) {
      return `bar_chart category "${cat}" not referenced in stem or correct option.`;
    }
  }
  const values = (Array.isArray(spec.values) ? spec.values : []) as unknown[];
  if (values.length) {
    const anyMatches = values.some((v) => {
      const n = Number(v);
      return Number.isFinite(n) && corpusContainsNumber(corpus, n);
    });
    if (!anyMatches) {
      return 'bar_chart values do not appear in stem or correct option.';
    }
  }
  return null;
};

const checkLinePlotAlignment = (spec: Record<string, unknown>, corpus: string): string | null => {
  const xLabel = typeof spec.xLabel === 'string' ? spec.xLabel.trim() : '';
  if (xLabel && !corpusContainsPhrase(corpus, xLabel)) {
    return `line_plot xLabel "${xLabel}" not referenced in stem or correct option.`;
  }
  const values = (Array.isArray(spec.values) ? spec.values : []) as unknown[];
  if (values.length) {
    const anyMatches = values.some((v) => {
      const n = Number(v);
      return Number.isFinite(n) && corpusContainsNumber(corpus, n);
    });
    if (!anyMatches) {
      return 'line_plot values do not appear in stem or correct option.';
    }
  }
  return null;
};

const checkTableAlignment = (spec: Record<string, unknown>, corpus: string): string | null => {
  const columns = (Array.isArray(spec.columns) ? spec.columns : []) as unknown[];
  for (const raw of columns) {
    const col = String(raw).trim();
    if (!col) continue;
    if (!corpusContainsPhrase(corpus, col)) {
      return `table column "${col}" not referenced in stem or correct option.`;
    }
  }
  return null;
};

/** True when shaded/total appears in the stem or correct option (safe to show as a given label). */
export const isFractionReferencedInQuestion = (
  q: QuestionLite,
  shaded: number,
  total: number,
): boolean => {
  const corpus = buildEvidenceCorpus(q);
  return (
    checkFractionAlignment({ totalParts: total, shadedParts: shaded }, corpus, 'fraction_bar') === null
  );
};

export const validateVisualSpecAgainstQuestion = (q: QuestionLite): string | null => {
  if (!q || !q.visualSpec || typeof q.visualSpec !== 'object') return null;
  const spec = q.visualSpec as Record<string, unknown>;
  const visualType = String(spec.visualType || '').trim();
  if (!visualType) return null;
  const corpus = buildEvidenceCorpus(q);

  switch (visualType) {
    case 'fraction_bar':
      return checkFractionAlignment(spec, corpus, 'fraction_bar');
    case 'fraction_circle':
      return checkFractionAlignment(spec, corpus, 'fraction_circle');
    case 'ten_frame':
      return checkTenFrameAlignment(spec, corpus);
    case 'number_line':
      return checkNumberLineAlignment(spec, corpus);
    case 'array_model':
      return checkArrayModelAlignment(spec, corpus);
    case 'area_model':
      return checkAreaModelAlignment(spec, corpus);
    case 'coordinate_plane':
      return checkCoordinatePlaneAlignment(spec, corpus);
    case 'geometric_shape':
      return checkGeometricShapeAlignment(spec, corpus);
    case 'bar_model':
      return checkBarModelAlignment(spec, corpus);
    case 'clock_face':
      return checkClockFaceAlignment(spec, corpus);
    case 'bar_chart':
      return checkBarChartAlignment(spec, corpus);
    case 'line_plot':
      return checkLinePlotAlignment(spec, corpus);
    case 'table':
      return checkTableAlignment(spec, corpus);
    default:
      return null;
  }
};
