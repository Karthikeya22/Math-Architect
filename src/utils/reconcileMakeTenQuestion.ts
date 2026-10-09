/**
 * Keeps ten-frame "making 10" MC items consistent: visual cells → correct option → explanation.
 */

import { normalizeVisualTypeToken } from './visualSpec';

const TEN_FRAME_CELLS = 10;

const normalizeQuestionVisualType = (question: {
  visualSpec?: { visualType?: string; values?: unknown[] } | null;
}): void => {
  const vs = question.visualSpec;
  if (!vs || typeof vs !== 'object') return;
  const normalized = normalizeVisualTypeToken(vs.visualType);
  if (normalized) vs.visualType = normalized;
};

/** Parse a leading integer from an option string (e.g. "3", "3 apples"). */
export const parseLeadingInteger = (option: string): number | null => {
  const m = String(option || '').trim().match(/^(-?\d+)/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
};

/** Normalize raw cell values to 0 (empty) or 1 (filled). */
export const normalizeTenFrameCells = (values: unknown[]): number[] => {
  const out: number[] = [];
  for (let i = 0; i < TEN_FRAME_CELLS; i++) {
    const v = values[i];
    const n = typeof v === 'number' ? v : Number(v);
    if (!Number.isFinite(n)) {
      out.push(0);
      continue;
    }
    out.push(n >= 1 || n > 0 ? 1 : 0);
  }
  return out;
};

export const countFilledTenFrame = (cells: number[]): number =>
  cells.reduce((sum, c) => sum + (c >= 1 ? 1 : 0), 0);

/** Parse how many dots/counters the stem says are already in a ten-frame. */
export const parseFilledDotsCountFromStem = (text: string): number | null => {
  const stem = String(text || '');
  const patterns = [
    /\b(?:there\s+are|showing|has|have)\s+(\d+)\s+(?:dots?|counters?)\b/i,
    /\b(\d+)\s+(?:dots?|counters?)\s+(?:in|on)\s+the\s+ten[-\s]?frame\b/i,
    /\bten[-\s]?frame[^.]{0,80}?\b(\d+)\s+(?:dots?|counters?)\b/i,
  ];
  for (const pattern of patterns) {
    const match = stem.match(pattern);
    if (!match) continue;
    const count = Number(match[1]);
    if (Number.isFinite(count) && count >= 0 && count <= TEN_FRAME_CELLS) return count;
  }
  return null;
};

const coerceMangledTenFrameVisualSpec = (question: {
  visualSpec?: { visualType?: string; values?: unknown[] } | null;
}): void => {
  const vs = question.visualSpec;
  if (!vs || typeof vs !== 'object') return;
  const visualType = String(vs.visualType || '').trim();
  const match = visualType.match(/^ten_frame(?:values)?\s*:?\s*\[([01,\s]+)\]/i);
  if (!match) return;
  const rawValues = match[1]
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  vs.visualType = 'ten_frame';
  vs.values = normalizeTenFrameCells(rawValues);
};

const inferTenFrameValuesFromStem = (question: {
  text?: string;
  visualSpec?: { visualType?: string; values?: unknown[] } | null;
}): void => {
  const vs = question.visualSpec;
  if (!vs || vs.visualType !== 'ten_frame') return;
  const raw = Array.isArray(vs.values) ? vs.values : [];
  if (raw.length === TEN_FRAME_CELLS) return;
  const filled = parseFilledDotsCountFromStem(question.text || '');
  if (filled === null) return;
  vs.values = Array.from({ length: TEN_FRAME_CELLS }, (_, index) => (index < filled ? 1 : 0));
};

/**
 * If visualSpec is a mis-tagged line_plot with 10 binary values, treat as ten_frame.
 */
export const coerceMisclassifiedTenFrameSpec = (question: {
  text?: string;
  visualSpec?: { visualType?: string; values?: unknown[] } | null;
}): void => {
  const stem = String(question.text || '').toLowerCase();
  if (!stem.includes('ten') || !stem.includes('frame')) return;
  const vs = question.visualSpec;
  if (!vs || vs.visualType !== 'line_plot') return;
  const vals = vs.values;
  if (!Array.isArray(vals) || vals.length !== TEN_FRAME_CELLS) return;
  const numeric = vals.map((v) => (typeof v === 'number' ? v : Number(v)));
  if (!numeric.every((n) => Number.isFinite(n) && (n === 0 || n === 1))) return;
  vs.visualType = 'ten_frame';
};

/**
 * Apply deterministic math for standard ten-frame "how many more to make 10" items.
 */
export const reconcileMakeTenQuestion = (question: {
  text?: string;
  options?: string[];
  correctAnswerIndex?: number;
  explanation?: string;
  visualSpec?: {
    visualType?: string;
    values?: unknown[];
  } | null;
}): void => {
  coerceMisclassifiedTenFrameSpec(question);
  coerceMangledTenFrameVisualSpec(question);
  normalizeQuestionVisualType(question);
  inferTenFrameValuesFromStem(question);

  const stem = String(question.text || '').toLowerCase();
  const vs = question.visualSpec;
  if (!vs || vs.visualType !== 'ten_frame') return;

  const wantsMakeTen =
    stem.includes('make 10') ||
    stem.includes('make ten') ||
    stem.includes('fill the ten-frame') ||
    stem.includes('fill the ten frame') ||
    (stem.includes('ten-frame') && stem.includes('how many more')) ||
    (/\bdots?\b/.test(stem) && /\bhow many more\b/.test(stem));

  if (!wantsMakeTen) return;

  const raw = Array.isArray(vs.values) ? vs.values : [];
  const cells = normalizeTenFrameCells(raw);
  vs.values = cells;

  const filled = countFilledTenFrame(cells);
  const need = Math.max(0, TEN_FRAME_CELLS - filled);

  const options = Array.isArray(question.options) ? question.options : [];
  let bestIdx = -1;
  for (let i = 0; i < options.length; i++) {
    const n = parseLeadingInteger(options[i]);
    if (n === need) {
      bestIdx = i;
      break;
    }
  }

  if (bestIdx >= 0 && bestIdx <= 3) {
    question.correctAnswerIndex = bestIdx;
  }

  question.explanation = `There are ${filled} dots in the ten-frame. You need ${need} more to fill the ten-frame and make 10.`;
};

/** Stem asks for a total of 10 blocks (word problem), not ten-frame dot vocabulary. */
const stemSeeksTenBlocksInAll = (text: string): boolean => {
  const t = text.toLowerCase();
  return (
    /\b10\s+blocks?\s+in\s+all\b/.test(t) ||
    /\bto have\s+10\s+blocks?\b/.test(t) ||
    /\bhave\s+10\s+blocks?\s+in\s+all\b/.test(t) ||
    /\b10\s+blocks?\s+total\b/.test(t)
  );
};

/**
 * Parse starting count from "has 4 red blocks" / "4 red blocks" style stems.
 */
export const parseStartingBlockCountFromStem = (text: string): number | null => {
  const hasHave = text.match(
    /\b(?:has|have)\s+(\d+)\s+(?:red\s+|blue\s+|green\s+|yellow\s+)?blocks?\b/i,
  );
  if (hasHave) {
    const n = Number(hasHave[1]);
    return Number.isFinite(n) && n >= 0 && n <= 10 ? n : null;
  }
  const leading = text.match(/\b(\d+)\s+(?:red\s+|blue\s+|green\s+|yellow\s+)?blocks?\b/i);
  if (leading) {
    const n = Number(leading[1]);
    return Number.isFinite(n) && n >= 0 && n <= 10 ? n : null;
  }
  return null;
};

/**
 * K–2 "missing addend to 10" with **blocks** wording: force a 10-slot ten_frame from the stem
 * so the figure cannot show 8 boxes when the goal is 10 (fixes bad imagePrompt layouts).
 */
export const reconcileBlocksMissingAddendToTen = (question: {
  text?: string;
  options?: string[];
  correctAnswerIndex?: number;
  explanation?: string;
  visualSpec?: { visualType?: string; values?: unknown[] } | null;
  imagePrompt?: string;
}): void => {
  const text = String(question.text || '');
  const lower = text.toLowerCase();

  if (/ten[-\s]frame/.test(lower) && /\bdots?\b/.test(lower)) return;
  if (!/\bblocks?\b/.test(lower)) return;
  if (!stemSeeksTenBlocksInAll(text)) return;
  if (!/\bhow many more\b/i.test(text) && !/\bneed\b.*\b10\b/i.test(text)) return;

  const start = parseStartingBlockCountFromStem(text);
  if (start === null) return;

  const need = TEN_FRAME_CELLS - start;
  const cells = Array.from({ length: TEN_FRAME_CELLS }, (_, i) => (i < start ? 1 : 0));

  question.visualSpec = {
    visualType: 'ten_frame',
    values: cells,
  };
  question.imagePrompt = '';

  const options = Array.isArray(question.options) ? question.options : [];
  let bestIdx = -1;
  for (let i = 0; i < options.length; i++) {
    if (parseLeadingInteger(options[i]) === need) {
      bestIdx = i;
      break;
    }
  }
  if (bestIdx >= 0 && bestIdx <= 3) {
    question.correctAnswerIndex = bestIdx;
  }

  question.explanation = `The story starts with ${start} blocks. To have 10 blocks in all, you need ${need} more blocks. Count empty slots in the ten-frame to check.`;
};

/** Parse a teen total (10–20) from stems about 1 ten and some ones. */
export const parseTeenPlaceValueTotalFromStem = (text: string): number | null => {
  const stem = String(text || '');
  const patterns = [
    /\b(?:the\s+)?number\s+(\d{1,2})\b/i,
    /\b(\d{1,2})\s+is\s+made\s+of\b/i,
  ];
  for (const pattern of patterns) {
    const match = stem.match(pattern);
    if (!match) continue;
    const total = Number(match[1]);
    if (Number.isFinite(total) && total >= 10 && total <= 20) return total;
  }
  const onesMatch = stem.match(/\bmade\s+of\s+1\s+ten\s+and\s+(\d{1,2})\s+ones?\b/i);
  if (onesMatch) {
    const ones = Number(onesMatch[1]);
    if (Number.isFinite(ones) && ones >= 0 && ones <= 10) return 10 + ones;
  }
  if (/\b(?:1|one)\s+ten\b/i.test(stem) && /\bhow\s+many\s+ones?\b/i.test(stem)) {
    const explicit = stem.match(/\bnumber\s+(\d{1,2})\b/i);
    if (explicit) {
      const total = Number(explicit[1]);
      if (Number.isFinite(total) && total >= 10 && total <= 20) return total;
    }
  }
  return null;
};

const stemDescribesTeenPlaceValue = (text: string): boolean => {
  const lower = String(text || '').toLowerCase();
  return (
    /\b(?:1|one)\s+ten\b/.test(lower) ||
    /\bten\s+and\b/.test(lower) ||
    /\bmade\s+of\b/.test(lower) ||
    /\blook\s+at\s+the\s+dots\b/.test(lower)
  );
};

/**
 * K NSO teens (10–20): force a full ten-frame plus loose ones dots so
 * "look at the dots" items still render when Gemini fallback is forbidden.
 */
export const reconcilePlaceValueTeensFromStem = (question: {
  text?: string;
  options?: string[];
  correctAnswerIndex?: number;
  explanation?: string;
  visualSpec?: { visualType?: string; values?: unknown[]; onesCount?: number } | null;
  imagePrompt?: string;
}): void => {
  const text = String(question.text || '');
  if (!stemDescribesTeenPlaceValue(text)) return;

  const total = parseTeenPlaceValueTotalFromStem(text);
  if (total === null) return;

  const ones = total % 10;
  const vs = question.visualSpec;
  if (vs?.visualType === 'ten_frame' && Number(vs.onesCount) === ones) {
    const raw = Array.isArray(vs.values) ? vs.values : [];
    if (raw.length === TEN_FRAME_CELLS && countFilledTenFrame(normalizeTenFrameCells(raw)) === TEN_FRAME_CELLS) {
      return;
    }
  }

  question.visualSpec = {
    visualType: 'ten_frame',
    values: Array.from({ length: TEN_FRAME_CELLS }, () => 1),
    onesCount: ones,
  };
  question.imagePrompt = '';

  const options = Array.isArray(question.options) ? question.options : [];
  let bestIdx = -1;
  for (let i = 0; i < options.length; i++) {
    const n = parseLeadingInteger(options[i]);
    if (n === ones) {
      bestIdx = i;
      break;
    }
    if (/\bones?\b/i.test(String(options[i] || '')) && n === ones) {
      bestIdx = i;
      break;
    }
  }
  if (bestIdx >= 0 && bestIdx <= 3) {
    question.correctAnswerIndex = bestIdx;
  }

  if (!question.explanation || !String(question.explanation).trim()) {
    question.explanation = `The number ${total} is made of 1 ten and ${ones} ones. Count the full ten-frame and the extra ones dots.`;
  }
};
