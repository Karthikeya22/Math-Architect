/**
 * True when a quiz question has a figure payload worth showing in the UI.
 * Empty strings, whitespace SVG stubs, and failed image slots stay hidden.
 */
export function hasUsableImageDataUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  return /^data:image\//i.test(trimmed) && trimmed.includes(',');
}

export function hasUsableSvgMarkup(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  return /<svg[\s>]/i.test(trimmed);
}

export function hasUsableQuizFigure(question: {
  generatedImageBase64?: string | null;
  visual?: string | null;
  figureStatus?: string | null;
  figureCoverage?: { pct?: number | null; missing?: string[] | null } | null;
} | null | undefined): boolean {
  if (!question) return false;
  if (question.figureStatus === 'needs_review' || question.figureStatus === 'rejected') return false;
  const coverage = question.figureCoverage;
  if (coverage) {
    if (Number.isFinite(Number(coverage.pct)) && Number(coverage.pct) < 100) return false;
    if (Array.isArray(coverage.missing) && coverage.missing.length > 0) return false;
  }
  return (
    hasUsableImageDataUrl(question.generatedImageBase64) ||
    hasUsableSvgMarkup(question.visual)
  );
}
