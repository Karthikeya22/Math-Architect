/**
 * Returns true if the question stem references a visual element the student
 * is meant to inspect — e.g. "look at the picture", "the array shown",
 * "on the number line". Used to gate auto-creation of a Gemini imagePrompt:
 * we only auto-fill imagePrompt when (a) the standard policy permits Gemini
 * fallback AND (b) the stem actually asks the student to look at something.
 *
 * Conservative on purpose: false negatives just mean "no auto-image" (still
 * better than a wrong image). False positives waste a Gemini call but the
 * server-side validators will catch any misalignment.
 */

const VISUAL_TRIGGER_PATTERNS: ReadonlyArray<RegExp> = [
  /\blook\s+at\s+(?:the|this|these)\b/,
  /\blook\s+at\s+the\s+dots\b/,
  /\bthe\s+(?:picture|image|figure|diagram|drawing|illustration|model|graph|chart|table)\b/,
  /\b(?:shown|pictured|displayed|drawn)\s+(?:above|below|here|in\s+the)/,
  /\bin\s+the\s+(?:picture|image|figure|diagram|drawing|illustration|model|graph|chart|table)\b/,
  /\bbelow\s+(?:is|are|shows|show)\b/,
  /\babove\s+(?:is|are|shows|show)\b/,
  /\bthe\s+(?:array|tape|fraction)\s+(?:shown|model|diagram|below|above)/,
  /\bthe\s+(?:bar|tape|number\s+line|coordinate\s+(?:plane|grid))\s+(?:shows|shown|below|above)/,
  /\bcount\s+the\b/,
  /\bwhich\s+(?:shape|figure|picture|model|diagram)\b/,
  /\bthe\s+(?:shaded|colored|filled)\s+(?:part|portion|region|area|section|sections)\b/,
  /\bthe\s+clock\s+(?:face|shows|hands?)\b/,
  /\bon\s+the\s+(?:number\s+line|coordinate\s+(?:plane|grid))\b/,
  /\bthe\s+(?:rectangle|triangle|square|circle|pentagon|hexagon|polygon|parallelogram|trapezoid)\s+shown\b/,
  /\bthe\s+(?:dots|counters|stars|apples|cubes|blocks|tiles|circles)\s+(?:shown|in)\b/,
  /\beach\s+(?:row|column|group|section)\s+(?:of|shows|contains)\b/,
];

const normalizeStem = (text: string): string =>
  String(text || '').toLowerCase().replace(/\s+/g, ' ').trim();

export const questionStemRequiresImage = (stem: string): boolean => {
  const normalized = normalizeStem(stem);
  if (!normalized) return false;
  return VISUAL_TRIGGER_PATTERNS.some((re) => re.test(normalized));
};
