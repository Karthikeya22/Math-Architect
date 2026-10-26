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
  cube: ['cube'],
  rectangular_prism: ['rectangular prism', 'prism'],
  triangular_prism: ['triangular prism'],
  sphere: ['sphere'],
  cylinder: ['cylinder'],
  cone: ['cone'],
  pyramid: ['pyramid'],
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
  // Plurals count ("2 identical squares" names a square).
  const re = new RegExp(`(?:^|\\W)${escaped}(?:e?s)?(?:\\W|$)`);
  return re.test(corpus);
};

/** Whole part W of a mixed number "W n/d" or decimal "W.xx" (W >= 1) whose fractional part equals `part`. */
const mixedNumberWholeFor = (corpus: string, part: number): number | null => {
  for (const m of corpus.matchAll(/(\d+)\s+(\d+)\s*\/\s*(\d+)/g)) {
    const [w, n, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
    if (w >= 1 && d > 0 && Math.abs(n / d - part) < 1e-6) return w;
  }
  for (const m of corpus.matchAll(/(?<![\d/])(\d+)\.(\d+)/g)) {
    const w = Number(m[1]);
    if (w >= 1 && Math.abs(Number(`0.${m[2]}`) - part) < 1e-6) return w;
  }
  return null;
};

const checkFractionAlignment = (
  spec: Record<string, unknown>,
  corpus: string,
  type: 'fraction_bar' | 'fraction_circle',
): string | null => {
  const total = Number(spec.totalParts);
  const shaded = Number(spec.shadedParts);
  if (!Number.isFinite(total) || !Number.isFinite(shaded)) return null;
  // One bar showing n/d for "2 n/d" (or 2.07, 2.4) teaches the wrong value: the wholes are missing.
  if (total > 0 && mixedNumberWholeFor(corpus, shaded / total) !== null) {
    return `${type} shows only ${shaded}/${total}; the question's mixed number also has whole parts the figure omits.`;
  }
  const fractions = extractFractionPairs(corpus);
  // "product of 3/4 and 2/5": one strip shows one factor, not the product (needs an area model).
  if (/\b(?:product|multiply|multiplied|times|area)\b|×/.test(corpus) && new Set(fractions.map((f) => `${f.n}/${f.d}`)).size >= 2) {
    return `${type} can show only one fraction, but the stem asks for a product of fractions.`;
  }
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
  const range = corpus.includes('number line') ? corpus.match(/from (-?\d+(?:\.\d+)?) to (-?\d+(?:\.\d+)?)/) : null;
  if (range && (Number(spec.min) !== Number(range[1]) || Number(spec.max) !== Number(range[2]))) {
    return `number_line range ${spec.min} to ${spec.max} differs from the stem's ${range[1]} to ${range[2]}.`;
  }
  if (!values.length) {
    return /\bpoints?\b/.test(corpus) ? 'number_line has no marked point but the stem places one.' : null;
  }
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

/** Drawn lines, folds, overlaps and relative positions: no geometric_shape spec can show these. */
const SHAPE_SPEC_CANNOT_SHOW =
  /\blines? (?:is |are )?(?:drawn|goes|go|through|from|down|across)\b|\bdashed\b|\bfold(?:ed)? along\b|\bdiagonals?\b|\boverlap|\bon (?:the )?top\b|\b(?:rests?|sits?|stacked|placed) (?:directly )?on\b|\b(?:beside|behind|next to|in front of)\b|\b(?:above|below|under) the\b/;
/** Tilings and grids: labelled figures can stand in, a bare outline cannot. */
const OUTLINE_CANNOT_SHOW = /\btiles?\b|\b(?:rows|columns) of\b/;

const STEM_MEASUREMENT =
  /\b(\d+(?:\.\d+)?)\s+(inches|inch|feet|foot|ft|yards?|meters?|centimeters?|cm|millimeters?|mm|kilometers?|km|miles?|units?)\b/g;

const checkGeometricShapeAlignment = (spec: Record<string, unknown>, corpus: string, stem: string): string | null => {
  const figures = Array.isArray(spec.figures) ? spec.figures : [];
  if (SHAPE_SPEC_CANNOT_SHOW.test(stem)) {
    return 'geometric_shape cannot draw the lines, folds, overlaps or positions this stem describes.';
  }
  // "Which/what shape ...?": drawing the answer's shape gives it away — as the only shape, or as one
  // the stem never names (two squares drawn as square + rectangle).
  const single = String(spec.shapeName || '').trim();
  if (/\b(?:which|what)(?: \w+){0,2} (?:shapes?|solids?|figures?)\b/.test(stem)) {
    const correct = corpus.slice(stem.length);
    const drawn = [
      single,
      ...(Array.isArray(spec.shapes) ? spec.shapes : []),
      ...figures.map((f) => (f && typeof f === 'object' ? (f as Record<string, unknown>).shape : '')),
    ].map((s) => String(s || '').trim()).filter(Boolean);
    for (const name of drawn) {
      const forms = SHAPE_NAME_FORMS[name] || [name];
      const inAnswer = forms.some((form) => corpusContainsPhrase(correct, form));
      const inStem = forms.some((form) => corpusContainsPhrase(stem, form));
      if (inAnswer && (drawn.length === 1 || !inStem)) {
        return `geometric_shape draws the ${name}, which is the answer.`;
      }
    }
  }
  if (!figures.length && OUTLINE_CANNOT_SHOW.test(stem)) {
    return 'geometric_shape is a bare outline, but the stem describes tiles or rows it cannot draw.';
  }
  if (figures.length) {
    // Every length the stem gives must be labelled, or the student cannot use the figure.
    const labels = figures
      .flatMap((raw) => (raw && typeof raw === 'object' && Array.isArray((raw as Record<string, unknown>).dimensions)
        ? ((raw as Record<string, unknown>).dimensions as unknown[]) : []))
      .map((d) => normalizeText(String((d as Record<string, unknown>)?.label ?? '')))
      .join(' | ');
    for (const m of stem.matchAll(STEM_MEASUREMENT)) {
      if (!new RegExp(`(?:^|\\D)${m[1].replace('.', '\\.')}(?:\\D|$)`).test(labels)) {
        return `geometric_shape is missing the stem measurement "${m[0]}".`;
      }
    }
    for (const raw of figures) {
      if (!raw || typeof raw !== 'object') continue;
      const figure = raw as Record<string, unknown>;
      const shapeName = String(figure.shape || '').trim();
      if (shapeName) {
        const forms = SHAPE_NAME_FORMS[shapeName] || [shapeName];
        if (!forms.some((form) => corpusContainsPhrase(corpus, form))) {
          return `geometric_shape "${shapeName}" not referenced in stem or correct option.`;
        }
      }
      const nameLabel = String(figure.nameLabel || '').trim();
      if (nameLabel && !corpusContainsPhrase(corpus, nameLabel)) {
        return `geometric_shape label "${nameLabel}" not referenced in stem or correct option.`;
      }
      for (const dimensionRaw of Array.isArray(figure.dimensions) ? figure.dimensions : []) {
        if (!dimensionRaw || typeof dimensionRaw !== 'object') continue;
        const label = String((dimensionRaw as Record<string, unknown>).label || '').trim();
        if (label && !corpusContainsPhrase(corpus, label)) {
          return `geometric_shape dimension "${label}" not referenced in stem or correct option.`;
        }
      }
      const areaLabel = String(figure.areaLabel || '').trim();
      if (areaLabel && !corpusContainsPhrase(corpus, areaLabel)) {
        return `geometric_shape area label "${areaLabel}" not referenced in stem or correct option.`;
      }
    }
    return null;
  }

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
  const nums = values.map(Number).filter(Number.isFinite);
  // Axis the stem states ("labeled from 5 to 9"): every data point must sit on it.
  const range = corpus.match(/from (-?\d+(?:\.\d+)?) to (-?\d+(?:\.\d+)?)/);
  if (range && nums.some((n) => n < Number(range[1]) || n > Number(range[2]))) {
    return `line_plot values fall outside the stem's axis ${range[1]} to ${range[2]}.`;
  }
  // Counts the stem states ("Above 6, there are 4 Xs" / "4 dots at 6"): the plot must have exactly that many.
  const expected = new Map<number, number>();
  for (const m of corpus.matchAll(/\babove (-?\d+(?:\.\d+)?),? there (?:are|is) (\d+) (?:x|xs|dots?|marks?)\b/g)) {
    expected.set(Number(m[1]), Number(m[2]));
  }
  for (const m of corpus.matchAll(/\b(\d+) (?:x|xs|dots?|marks?) (?:at|above|over) (-?\d+(?:\.\d+)?)/g)) {
    expected.set(Number(m[2]), Number(m[1]));
  }
  for (const [value, count] of expected) {
    const got = nums.filter((n) => n === value).length;
    if (got !== count) return `line_plot has ${got} mark(s) at ${value}; the stem says ${count}.`;
  }
  return null;
};

const STRUCTURAL_TABLE_COLUMNS =
  /^(?:thousands?|ten[-\s]?thousands?|hundred[-\s]?thousands?|millions?|hundreds?|tens?|ones?|tenths?|hundredths?|thousandths?|ten[-\s]?thousandths?|number|numbers|value|values|digit|digits|word form|standard form|expanded form|place|place value|category|categories|frequency|tally|tallies|item|items|data|input|output|x|y|total|count|name|day|days|time|student|students|color|colour|shape|fraction|decimal|percent|hours?|minutes?|miles?|inches?|centimeters?|cm|units?)$/i;

/** "Tickets Sold" is fine when the stem says "tickets sold" in other words: every word (or its plural) appears. */
const corpusContainsAllWords = (corpus: string, phrase: string): boolean =>
  normalizeText(phrase)
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3)
    .every((w) => new RegExp(`\\b${w.replace(/s$/, '')}(?:s|es)?\\b`).test(corpus));

const checkTableAlignment = (spec: Record<string, unknown>, corpus: string): string | null => {
  const columns = (Array.isArray(spec.columns) ? spec.columns : []) as unknown[];
  // Only the row-label corner may be blank (audit: two empty headers read as missing labels).
  if (columns.filter((c) => !String(c).trim()).length > 1) return 'table has more than one blank column header.';
  // A place-value chart only belongs on a place-value question (audit: one appeared on a function item).
  if (
    columns.some((c) => /^(?:ones|tenths|hundredths|thousandths)$/i.test(String(c).trim())) &&
    !/\b(?:place|digits?|value of the|ones|tens|hundreds|thousands|tenths|hundredths|thousandths|expanded|standard form|word form|decimal)\b/.test(corpus)
  ) {
    return 'place value table on a question that is not about place value.';
  }
  for (const raw of columns) {
    const col = String(raw).trim();
    if (!col) continue;
    // Column headers that name the structure of the display (place-value
    // houses, "Number", "Word form", ...) are given framing, not answer data.
    if (STRUCTURAL_TABLE_COLUMNS.test(col)) continue;
    if (!corpusContainsPhrase(corpus, col) && !corpusContainsAllWords(corpus, col)) {
      return `table column "${col}" not referenced in stem or correct option.`;
    }
  }
  // A place-value chart for "the 5 in 0.05 vs the 5 in 5.0" must show both numbers.
  const rows = Array.isArray(spec.rows) ? spec.rows : [];
  // Word cells must come from the stem (audit: the model once wrote "-2 ancient? wait no" into a cell).
  for (const cell of rows.flat().map((c) => String(c).trim())) {
    if (/[a-z]{3,}/i.test(cell) && !corpusContainsPhrase(corpus, cell) && !corpusContainsAllWords(corpus, cell)) {
      return `table cell "${cell}" not referenced in stem or correct option.`;
    }
  }
  const isPlaceValue = columns.some((c) => /^(?:ones|tenths|hundredths|thousandths)$/i.test(String(c).trim()));
  const decimals = new Set(corpus.match(/\b\d+\.\d+\b/g) || []);
  if (isPlaceValue && decimals.size >= 2 && rows.length < decimals.size) {
    return `place-value table shows ${rows.length} row(s) but the stem compares both numbers (${[...decimals].join(', ')}).`;
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

export const NAMED_MODELS: Array<[string, RegExp, string[]]> = [
  ['number line', /\bnumber line\b/, ['number_line', 'line_plot']],
  ['ten-frame', /\bten[- ]frames?\b/, ['ten_frame']],
  ['clock', /\bclock\b/, ['clock_face']],
  ['coordinate plane', /\bcoordinate (?:plane|grid)\b/, ['coordinate_plane']],
  // Screenshot repro: a 3/20 strip (the answer) stood in for a 4 x 5 area model.
  ['area model', /\barea model\b/, ['area_model']],
];

export const validateVisualSpecAgainstQuestion = (q: QuestionLite): string | null => {
  if (!q || !q.visualSpec || typeof q.visualSpec !== 'object') return null;
  const spec = q.visualSpec as Record<string, unknown>;
  const visualType = String(spec.visualType || '').trim();
  if (!visualType) return null;
  const corpus = buildEvidenceCorpus(q);

  // Join/separate stories ("4 cars, gets 3 more", "6 birds, 2 fly away"): a single group of
  // counters shows only the start, so the figure misstates the problem (LC judged these wrong).
  const stem = normalizeText(q.text);
  const oneGroup =
    (visualType === 'ten_frame' && !(Number(spec.onesCount) > 0) && !(Number(spec.tensCount) > 0)) ||
    (visualType === 'array_model' && (Number(spec.gridRows) || 1) === 1);
  const storyNumbers = new Set(stem.match(/\b\d+\b/g) || []);
  const figureIsTheQuestion = /\bten[- ]?frames?\b|\bmake (?:a )?(?:10|ten)\b/.test(stem);
  if (oneGroup && !figureIsTheQuestion && storyNumbers.size >= 2 && /\b(?:more|gives?|gave|gets?|got|eats?|ate|fl(?:y|ies|ew) away|takes? away|took|left|joins?|in all|altogether)\b/.test(stem)) {
    return `${visualType} shows one group, but the story joins or separates two groups.`;
  }

  // A stem that names its model must get that model, not a look-alike with the same numbers.
  for (const [name, re, allowed] of NAMED_MODELS) {
    if (re.test(corpus) && !allowed.includes(visualType)) {
      return `stem is about a ${name} but the figure is a ${visualType}.`;
    }
  }

  switch (visualType) {
    case 'fraction_bar':
      return checkFractionAlignment(spec, corpus, 'fraction_bar');
    case 'fraction_circle':
      return checkFractionAlignment(spec, corpus, 'fraction_circle');
    case 'ten_frame':
      return checkTenFrameAlignment(spec, corpus);
    case 'number_line': {
      // A line that stops before (or starts after) a plain-number answer cannot show how to reach it.
      const raw = String(q.options[q.correctAnswerIndex] ?? '').trim();
      const answer = raw ? Number(raw) : NaN;
      const [min, max] = [Number(spec.min), Number(spec.max)];
      if (Number.isFinite(answer) && Number.isFinite(min) && Number.isFinite(max) && (answer < min || answer > max)) {
        return `number_line ${min} to ${max} does not reach the answer ${answer}.`;
      }
      return checkNumberLineAlignment(spec, corpus);
    }
    case 'array_model':
      return checkArrayModelAlignment(spec, corpus);
    case 'area_model':
      return checkAreaModelAlignment(spec, corpus);
    case 'coordinate_plane':
      return checkCoordinatePlaneAlignment(spec, corpus);
    case 'geometric_shape':
      return checkGeometricShapeAlignment(spec, corpus, normalizeText(q.text));
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
