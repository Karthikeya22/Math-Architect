import { isExactCountableVisualSpec } from './exactCountableVisual';
import type { VisualSpec } from '../types';

type QuestionVisualFields = {
  text?: string;
  visualIntent?: string;
  visualSpec?: VisualSpec | null;
  imagePrompt?: string;
};

const blocksExactCountReconcile = (visualType: string | undefined): boolean =>
  visualType === 'geometric_shape' || visualType === 'coordinate_plane';

const COLOR_NAMES = ['red', 'green', 'blue', 'yellow', 'orange', 'purple'] as const;
type ColorName = (typeof COLOR_NAMES)[number];

export type ColoredQuantityGroup = {
  count: number;
  color: ColorName;
};

const WORD_TO_NUM: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
};

const COUNT_WORD_PATTERN = Object.keys(WORD_TO_NUM).join('|');

/** Parse phrases like "seven thousand forty-two" or "five thousand eight". */
export const parseEnglishNumberPhrase = (phrase: string): number | null => {
  const tokens = String(phrase || '')
    .toLowerCase()
    .replace(/-/g, ' ')
    .replace(/,/g, '')
    .split(/\s+/)
    .filter((t) => t && t !== 'and');
  if (!tokens.length) return null;

  let total = 0;
  let current = 0;
  for (const tok of tokens) {
    if (tok === 'thousand') {
      current = (current || 1) * 1000;
      total += current;
      current = 0;
      continue;
    }
    if (tok === 'hundred') {
      current = (current || 1) * 100;
      continue;
    }
    const n = WORD_TO_NUM[tok];
    if (n === undefined) return null;
    current += n;
  }
  const result = total + current;
  return Number.isInteger(result) && result >= 0 && result <= 999_999 ? result : null;
};

const COMPOUND_ONES =
  'one|two|three|four|five|six|seven|eight|nine';
const COMPOUND_TENS =
  'twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety';
const TEEN_WORDS =
  'eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen';

/** Parse number words in stems (e.g. quoted 'forty-three', number word forty-three). */
export const parseNumberWordFromStem = (stem: string): number | null => {
  const text = String(stem || '');

  for (const match of text.matchAll(/[''"]([^'"]+)[''"]/g)) {
    const parsed = parseEnglishNumberPhrase(match[1]);
    if (parsed !== null) return parsed;
  }

  const numberWordQuoted = text.match(/\bnumber\s+word\s+[''"]([^'"]+)[''"]/i);
  if (numberWordQuoted) {
    const parsed = parseEnglishNumberPhrase(numberWordQuoted[1]);
    if (parsed !== null) return parsed;
  }

  const largeNumber = extractWordNumberFromStem(text);
  if (largeNumber !== null && largeNumber >= 100) return largeNumber;

  const compound = text.match(
    new RegExp(`\\b(${COMPOUND_TENS})[-\\s](${COMPOUND_ONES})\\b`, 'i'),
  );
  if (compound) {
    const parsed = parseEnglishNumberPhrase(`${compound[1]} ${compound[2]}`);
    if (parsed !== null) return parsed;
  }

  const teen = text.match(new RegExp(`\\b(${TEEN_WORDS})\\b`, 'i'));
  if (teen) {
    const n = WORD_TO_NUM[teen[1].toLowerCase()];
    if (n !== undefined) return n;
  }

  const numberWordBare = text.match(
    /\bnumber\s+word\s+([a-z]+(?:\s*[-\s]\s*[a-z]+)?)/i,
  );
  if (numberWordBare) {
    const parsed = parseEnglishNumberPhrase(numberWordBare[1]);
    if (parsed !== null) return parsed;
  }

  return largeNumber ?? extractWordNumberFromStem(text);
};

const extractWordNumberFromStem = (stem: string): number | null => {
  const thousandMatch = stem.match(
    /\b((?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)(?:\s+|-)?(?:thousand|hundred)(?:\s+|-)?(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)?(?:\s+|-)?(?:one|two|three|four|five|six|seven|eight|nine)?)\b/i,
  );
  if (thousandMatch) {
    const parsed = parseEnglishNumberPhrase(thousandMatch[1]);
    if (parsed !== null) return parsed;
  }
  const hundredOnly = stem.match(
    /\b((?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)(?:\s+|-)?hundred(?:\s+|-)?(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)?)\b/i,
  );
  if (hundredOnly) {
    const parsed = parseEnglishNumberPhrase(hundredOnly[1]);
    if (parsed !== null) return parsed;
  }
  return null;
};

const parseCountToken = (token: string): number | null => {
  const digits = Number(token);
  if (Number.isInteger(digits) && digits >= 1 && digits <= 20) return digits;
  const word = WORD_TO_NUM[String(token || '').toLowerCase()];
  if (word !== undefined && word >= 1 && word <= 20) return word;
  return null;
};

export const extractColoredQuantityGroups = (text: string): ColoredQuantityGroup[] | null => {
  const stem = String(text || '');
  const groups: ColoredQuantityGroup[] = [];
  const seen = new Set<string>();

  const digitPattern = new RegExp(
    `\\b(\\d{1,2}|${Object.keys(WORD_TO_NUM).join('|')})\\s+(${COLOR_NAMES.join('|')})\\b`,
    'gi',
  );
  for (const match of stem.matchAll(digitPattern)) {
    const count = parseCountToken(match[1]);
    const color = String(match[2]).toLowerCase() as ColorName;
    if (count === null) continue;
    const key = `${color}:${count}`;
    if (seen.has(key)) continue;
    seen.add(key);
    groups.push({ count, color });
  }

  // "2 red apples and 3 green apples" — object between count and color
  const objectPattern = new RegExp(
    `\\b(\\d{1,2}|${Object.keys(WORD_TO_NUM).join('|')})\\s+(${COLOR_NAMES.join('|')})\\s+\\w+`,
    'gi',
  );
  for (const match of stem.matchAll(objectPattern)) {
    const count = parseCountToken(match[1]);
    const color = String(match[2]).toLowerCase() as ColorName;
    if (count === null) continue;
    const key = `${color}:${count}`;
    if (seen.has(key)) continue;
    seen.add(key);
    groups.push({ count, color });
  }

  if (groups.length < 2) return null;
  if (
    !/\b(and|in all|altogether|total|how many|plus|more|fewer|left|together)\b/i.test(stem)
  ) {
    return null;
  }
  return groups;
};

const UNCOLORED_ADDEND_COLORS: ColorName[] = ['red', 'blue', 'green', 'yellow', 'orange', 'purple'];

const MEASUREMENT_NOUNS = new Set([
  'feet',
  'foot',
  'meter',
  'meters',
  'metre',
  'metres',
  'inch',
  'inches',
  'yard',
  'yards',
  'cm',
  'mm',
]);

const SCENE_MEASUREMENT_STEM =
  /\b(ladder|wall|ground|floor|roof|hypotenuse|pythagor|right angle|right-angle|right triangle|feet away|meters away)\b/i;

const extractCountNounFromSegment = (segment: string): { count: number; noun: string } | null => {
  const seg = String(segment || '');
  const pattern = new RegExp(
    `\\b(\\d{1,2}|${COUNT_WORD_PATTERN})\\s+(?:(?:${COLOR_NAMES.join('|')})\\s+)?([a-z][a-z'-]*)\\b`,
    'gi',
  );
  const matches = [...seg.matchAll(pattern)];
  if (!matches.length) return null;
  const last = matches[matches.length - 1];
  const count = parseCountToken(last[1]);
  const noun = String(last[2] || '').toLowerCase();
  if (count === null || !noun) return null;
  if (COLOR_NAMES.includes(noun as ColorName)) return null;
  if (MEASUREMENT_NOUNS.has(noun)) return null;
  return { count, noun };
};

/** "3 apples and 4 oranges" (no color words) → colored rows for deterministic SVG. */
export const extractUncoloredAddendGroups = (text: string): ColoredQuantityGroup[] | null => {
  const stem = String(text || '');
  if (extractColoredQuantityGroups(stem)) return null;
  if (SCENE_MEASUREMENT_STEM.test(stem)) return null;
  if (!/\b(and|plus|altogether|in all|how many|total|together)\b/i.test(stem)) return null;

  const pairMatch = stem.match(
    new RegExp(
      `\\b(\\d{1,2}|${COUNT_WORD_PATTERN})\\s+(?!${COLOR_NAMES.join('|')}\\b)([a-z][a-z'-]*)\\s+(?:and|plus)\\s+(\\d{1,2}|${COUNT_WORD_PATTERN})\\s+(?!${COLOR_NAMES.join('|')}\\b)([a-z][a-z'-]*)`,
      'i',
    ),
  );
  if (pairMatch) {
    const countA = parseCountToken(pairMatch[1]);
    const countB = parseCountToken(pairMatch[3]);
    if (countA !== null && countB !== null) {
      return [
        { count: countA, color: UNCOLORED_ADDEND_COLORS[0] },
        { count: countB, color: UNCOLORED_ADDEND_COLORS[1] },
      ];
    }
  }

  const segments = stem.split(/\s+and\s+/i);
  if (segments.length < 2) return null;

  const parsed = segments
    .slice(0, 4)
    .map((seg) => extractCountNounFromSegment(seg))
    .filter((entry): entry is { count: number; noun: string } => entry !== null);
  if (parsed.length < 2) return null;
  if (parsed.every((entry) => entry.noun === parsed[0].noun) && MEASUREMENT_NOUNS.has(parsed[0].noun)) {
    return null;
  }

  return parsed.map((entry, index) => ({
    count: entry.count,
    color: UNCOLORED_ADDEND_COLORS[index % UNCOLORED_ADDEND_COLORS.length],
  }));
};

export const stemHasPlottableExactCounts = (text: string): boolean => {
  const stem = String(text || '');
  return (
    extractColoredQuantityGroups(stem) !== null ||
    extractUncoloredAddendGroups(stem) !== null ||
    extractSubtractionStartCount(stem) !== null ||
    extractSingleCountGroup(stem) !== null
  );
};

export const extractSubtractionStartCount = (text: string): number | null => {
  const stem = String(text || '');
  if (!/\b(fly|flies|flew|left|remain|remaining|take away|taken away|subtract)\b/i.test(stem)) {
    return null;
  }
  const thereAre = stem.match(/\b(?:there are|are)\s+(\d{1,2})\b/i);
  if (thereAre) {
    const n = Number(thereAre[1]);
    if (Number.isInteger(n) && n >= 1 && n <= 20) return n;
  }
  const onBranch = stem.match(/\b(\d{1,2})\s+\w+\s+on\s+a?\s*\w+/i);
  if (onBranch) {
    const n = Number(onBranch[1]);
    if (Number.isInteger(n) && n >= 1 && n <= 20) return n;
  }
  return null;
};

export const extractSingleCountGroup = (text: string): number | null => {
  const stem = String(text || '');
  const countContext =
    /\b(count each|how many|count the|counts?\s+\d|in all|in a line|in a circle|straight line|has\s+\d|have\s+\d)\b/i.test(
      stem,
    ) || /\bcounts?\s+(?:one|two|three|four|five|six|seven|eight|nine|ten)\b/i.test(stem);
  if (!countContext) return null;

  const tryToken = (raw: string): number | null => parseCountToken(raw);

  const countsVerb = stem.match(/\bcounts?\s+(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten)\b/i);
  if (countsVerb) {
    const n = tryToken(countsVerb[1]);
    if (n !== null) return n;
  }

  const hasCount = stem.match(
    /\b(?:has|have)\s+(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten)\b/i,
  );
  if (hasCount) {
    const n = tryToken(hasCount[1]);
    if (n !== null) return n;
  }

  const colored = stem.match(
    /\b(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:red|green|blue|yellow|orange|purple)\b/i,
  );
  if (colored) {
    const n = tryToken(colored[1]);
    if (n !== null) return n;
  }

  const inLine = stem.match(
    /\b(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten)\s+\w+\s+in\s+a?\s*(?:straight\s+)?line\b/i,
  );
  if (inLine) {
    const n = tryToken(inLine[1]);
    if (n !== null) return n;
  }

  const thereAre = stem.match(
    /\b(?:there are|are)\s+(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten)\b/i,
  );
  if (thereAre) {
    const n = tryToken(thereAre[1]);
    if (n !== null) return n;
  }

  const shown = stem.match(
    /\b(?:shows?|showing|picture|image|diagram)\s+(?:of\s+)?(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten)\b/i,
  );
  if (shown) {
    const n = tryToken(shown[1]);
    if (n !== null) return n;
  }

  return null;
};

const buildArrayModelValues = (groups: ColoredQuantityGroup[]): {
  gridRows: number;
  gridCols: number;
  values: number[];
  rowColors: string[];
} => {
  const gridRows = groups.length;
  const gridCols = Math.max(...groups.map((g) => g.count), 1);
  const values: number[] = [];
  for (const group of groups) {
    for (let col = 0; col < gridCols; col++) {
      values.push(col < group.count ? 1 : 0);
    }
  }
  return {
    gridRows,
    gridCols,
    values,
    rowColors: groups.map((g) => g.color),
  };
};

const buildSingleRowArray = (count: number, color = 'blue'): {
  gridRows: number;
  gridCols: number;
  values: number[];
  rowColors: string[];
} => {
  const gridCols = Math.min(Math.max(count, 1), 20);
  return {
    gridRows: 1,
    gridCols,
    values: Array.from({ length: gridCols }, (_, i) => (i < count ? 1 : 0)),
    rowColors: [color],
  };
};

export const buildExactCountImagePrompt = (
  question: QuestionVisualFields,
  grade: string,
): string | null => {
  const spec = question.visualSpec;
  if (!isExactCountableVisualSpec(spec)) return null;

  const stem = String(question.text || '').trim();
  if (spec?.visualType === 'ten_frame') {
    const tens = Number.isFinite(spec.tensCount) ? Math.floor(Number(spec.tensCount)) : 0;
    const ones = Number.isFinite(spec.onesCount) ? Math.floor(Number(spec.onesCount)) : 0;
    if (tens > 1) {
      return [
        `Draw exactly ${tens} full ten-frames in a row (each with 10 blue dots) and exactly ${ones} extra blue ones dots on a plain white background.`,
        'No digit labels and do not show the answer numeral.',
        `Question: "${stem}"`,
      ].join(' ');
    }
    const filled = (spec.values || []).filter((value) => Number(value) >= 1).length;
    return [
      `Draw exactly ${filled} identical blue dots in a standard ten-frame (two rows of five) on a plain white background.`,
      ones > 0 ? `Add exactly ${ones} extra blue ones dots beside the frame.` : '',
      'No digit labels, no extra objects, and do not show the answer.',
      `Question: "${stem}"`,
    ]
      .filter(Boolean)
      .join(' ');
  }

  if (spec?.visualType === 'array_model') {
    const rows = Number(spec.gridRows);
    const cols = Number(spec.gridCols);
    const rowColors = (spec.rowColors || []).map(String).filter(Boolean);
    const values = Array.isArray(spec.values) ? spec.values.map((v) => Number(v)) : [];
    if (!Number.isInteger(rows) || !Number.isInteger(cols) || rows < 1 || cols < 1) return null;

    const rowLines: string[] = [];
    for (let row = 0; row < rows; row++) {
      const slice = values.slice(row * cols, (row + 1) * cols);
      const count = slice.filter((v) => v >= 1).length;
      const color = rowColors[row] || 'blue';
      rowLines.push(`Row ${row + 1}: exactly ${count} solid ${color} circles — no more, no fewer`);
    }

    return [
      `Create a ${grade} counting or joining illustration on a plain white background.`,
      rowLines.join('. '),
      'Do not add decorative objects, equations, or answer labels.',
      `The picture must match this question exactly: "${stem}"`,
    ].join(' ');
  }

  return null;
};

export const reconcileExactCountObjectsFromStem = (question: QuestionVisualFields): void => {
  const stem = String(question.text || '');
  const vs = question.visualSpec;
  if (blocksExactCountReconcile(vs?.visualType)) return;

  const coloredGroups = extractColoredQuantityGroups(stem) ?? extractUncoloredAddendGroups(stem);
  if (coloredGroups) {
    const { gridRows, gridCols, values, rowColors } = buildArrayModelValues(coloredGroups);
    question.visualSpec = {
      visualType: 'array_model',
      gridRows,
      gridCols,
      values,
      rowColors,
      title: coloredGroups.map((g) => `${g.count} ${g.color}`).join(' + '),
    };
    question.imagePrompt = '';
    if (!question.visualIntent) {
      question.visualIntent = 'Count each colored group in the picture, then add them together.';
    }
    return;
  }

  const startCount = extractSubtractionStartCount(stem);
  if (startCount !== null) {
    const { gridRows, gridCols, values, rowColors } = buildSingleRowArray(startCount, 'blue');
    question.visualSpec = {
      visualType: 'array_model',
      gridRows,
      gridCols,
      values,
      rowColors,
      title: `${startCount} to start`,
    };
    question.imagePrompt = '';
    if (!question.visualIntent) {
      question.visualIntent = 'Count how many there are at the start before any fly away or are taken away.';
    }
    return;
  }

  const singleCount = extractSingleCountGroup(stem);
  if (singleCount !== null) {
    const prefersLineLayout = /\b(?:straight\s+)?line\b|\bcircle\b|\bmove(?:s|d)?\s+the\b/i.test(stem);
    const useTenFrame = singleCount <= 10 && !prefersLineLayout;
    if (useTenFrame) {
      question.visualSpec = {
        visualType: 'ten_frame',
        values: Array.from({ length: 10 }, (_, i) => (i < singleCount ? 1 : 0)),
      };
    } else {
      const { gridRows, gridCols, values, rowColors } = buildSingleRowArray(singleCount);
      question.visualSpec = {
        visualType: 'array_model',
        gridRows,
        gridCols,
        values,
        rowColors,
        title: `Count: ${singleCount}`,
      };
    }
    question.imagePrompt = '';
    if (!question.visualIntent) {
      question.visualIntent = 'Count each object in the picture one time.';
    }
  }
};

export const reconcileWordPlaceValueFromStem = (question: QuestionVisualFields): void => {
  const stem = String(question.text || '');
  const trigger =
    /\bplace value\b|\bexpanded form\b|\bstandard form\b|\bword form\b|\bnumber\s+word\b|\bwritten in\b|\bdigit\b/i;
  if (!trigger.test(stem)) return;
  if (/\b\d+\.\d+\b/.test(stem)) return;

  const prefersWordNumber =
    /\bnumber\s+word\b|\bstandard\s+form\b|\bword\s+form\b/i.test(stem);

  let n: number | null = null;
  if (prefersWordNumber) {
    n = parseNumberWordFromStem(stem);
  }
  if (n === null) {
    const digitMatch = stem.replace(/,/g, '').match(/\b(\d{1,6})\b/);
    if (digitMatch) {
      const candidate = Number(digitMatch[1]);
      if (Number.isInteger(candidate) && candidate >= 0 && candidate <= 999_999) {
        n = candidate;
      }
    }
  }
  if (n === null) {
    n = parseNumberWordFromStem(stem);
  }
  if (n === null) return;

  if (blocksExactCountReconcile(question.visualSpec?.visualType)) return;

  if (n <= 9) {
    question.visualSpec = {
      visualType: 'ten_frame',
      values: Array.from({ length: 10 }, (_, index) => (index < n ? 1 : 0)),
    };
    question.imagePrompt = '';
    if (!question.visualIntent) {
      question.visualIntent = 'Count the dots in the ten-frame to match the number word.';
    }
    return;
  }

  if (n <= 99) {
    const tens = Math.floor(n / 10);
    const ones = n % 10;
    question.visualSpec = {
      visualType: 'ten_frame',
      values: Array.from({ length: 10 }, () => 1),
      tensCount: tens,
      onesCount: ones,
    };
    question.imagePrompt = '';
    if (!question.visualIntent) {
      question.visualIntent =
        'Count each full ten-frame as one ten, then count the extra ones dots, to write the number in standard form.';
    }
    return;
  }

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
