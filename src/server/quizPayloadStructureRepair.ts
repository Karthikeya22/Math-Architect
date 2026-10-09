/**
 * Structural repair pass for quiz payloads. The AI occasionally emits a
 * question with the wrong number of options or a bad correctAnswerIndex.
 * Pre-existing behavior: surface "Question N must contain exactly 4 options."
 * which triggered a strict retry + fallback provider chain costing 15-45s
 * before failing the user with a hard error.
 *
 * This module instead repairs recoverable issues in place and drops only
 * the truly unsalvageable questions. Hard failure now requires the entire
 * questions array to be empty after repair — every other case keeps the
 * user moving with whatever the AI got right.
 *
 * Mirrors sanitizeQuizPayloadVisuals: never throws, mutates `payload` in
 * place, returns warnings for telemetry. Run this BEFORE
 * validateQuizPayload so structural validation almost never fires.
 */

export interface StructureRepairResult {
  /** Tagged warnings of the form "Q1: <message>" or "Quiz: <message>". */
  warnings: string[];
  /** True when at least one usable question remains. */
  hasUsableQuestions: boolean;
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null;

const coerceOptionString = (raw: unknown): string => {
  if (typeof raw === 'string') return raw;
  if (raw === null || raw === undefined) return '';
  if (typeof raw === 'number' || typeof raw === 'boolean') return String(raw);
  if (isObject(raw)) {
    const obj = raw as Record<string, unknown>;
    for (const k of ['text', 'label', 'value', 'option']) {
      if (typeof obj[k] === 'string' && (obj[k] as string).trim()) return obj[k] as string;
    }
  }
  try {
    return JSON.stringify(raw);
  } catch {
    return String(raw);
  }
};

const repairQuestion = (
  question: Record<string, unknown>,
  warnings: string[],
  prefix: string,
): boolean => {
  // Guard: must have non-empty stem text.
  const text = typeof question.text === 'string' ? question.text.trim() : '';
  if (!text) {
    warnings.push(`${prefix}: missing text — dropped.`);
    return false;
  }

  // Normalize options to an array of strings.
  let options: string[] = [];
  if (Array.isArray(question.options)) {
    options = (question.options as unknown[]).map(coerceOptionString).map((s) => s.trim());
  }

  // Drop empty/duplicate-only option sets.
  const nonEmpty = options.filter((s) => s.length > 0);
  if (nonEmpty.length === 0) {
    warnings.push(`${prefix}: no usable options — dropped.`);
    return false;
  }

  // Read and tentatively coerce correctAnswerIndex.
  let correctIdx = Number(question.correctAnswerIndex);
  if (!Number.isFinite(correctIdx)) correctIdx = -1;
  correctIdx = Math.trunc(correctIdx);

  // Identify the correct option string (if pointer is in-range), so we can
  // preserve it across length adjustments.
  const correctOptionString =
    correctIdx >= 0 && correctIdx < options.length ? options[correctIdx] : null;

  if (options.length > 4) {
    // Keep the correct option + first three distinct distractors.
    const result: string[] = [];
    if (correctOptionString) result.push(correctOptionString);
    for (const opt of options) {
      if (result.length >= 4) break;
      if (opt && !result.includes(opt)) result.push(opt);
    }
    while (result.length < 4) result.push(''); // pad if dedup left fewer than 4
    options = result;
    warnings.push(`${prefix}: trimmed ${question.options ? (question.options as unknown[]).length : 0} options down to 4.`);
  } else if (options.length < 4) {
    // Pad up to 4 — placeholder distractors are clearly empty so they render
    // as "(no option)" in the UI rather than confusing the student. Better
    // than dropping the entire question and asking the user to retry.
    while (options.length < 4) options.push('');
    warnings.push(`${prefix}: padded options to 4 (some entries are empty placeholders).`);
  }

  // If we lost the correct option during trim, restore by index search; else
  // clamp pointer into range.
  if (correctOptionString && options.includes(correctOptionString)) {
    question.correctAnswerIndex = options.indexOf(correctOptionString);
  } else {
    if (correctIdx < 0 || correctIdx > 3) {
      warnings.push(`${prefix}: correctAnswerIndex (${question.correctAnswerIndex}) out of range — defaulted to 0.`);
      question.correctAnswerIndex = 0;
    } else {
      question.correctAnswerIndex = correctIdx;
    }
  }

  question.options = options;
  return true;
};

export const repairQuizStructure = (payload: unknown): StructureRepairResult => {
  const warnings: string[] = [];
  if (!isObject(payload)) return { warnings, hasUsableQuestions: false };
  const p = payload as { questions?: unknown };
  if (!Array.isArray(p.questions) || p.questions.length === 0) {
    return { warnings, hasUsableQuestions: false };
  }

  const repaired: Record<string, unknown>[] = [];
  for (let i = 0; i < p.questions.length; i++) {
    const q = p.questions[i];
    if (!isObject(q)) {
      warnings.push(`Q${i + 1}: not an object — dropped.`);
      continue;
    }
    if (repairQuestion(q, warnings, `Q${i + 1}`)) {
      repaired.push(q);
    }
  }

  if (repaired.length === 0) {
    warnings.push('Quiz: no questions survived structural repair.');
    p.questions = [];
    return { warnings, hasUsableQuestions: false };
  }

  if (repaired.length !== p.questions.length) {
    warnings.push(
      `Quiz: dropped ${p.questions.length - repaired.length} of ${p.questions.length} questions during structural repair.`,
    );
  }

  p.questions = repaired;
  return { warnings, hasUsableQuestions: true };
};
