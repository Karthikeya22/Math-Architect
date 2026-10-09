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
  geogebraImageBase64?: string | null;
  visual?: string | null;
} | null | undefined): boolean {
  if (!question) return false;
  return (
    hasUsableImageDataUrl(question.generatedImageBase64) ||
    hasUsableImageDataUrl(question.geogebraImageBase64) ||
    hasUsableSvgMarkup(question.visual)
  );
}
