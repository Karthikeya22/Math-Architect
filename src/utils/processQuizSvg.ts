/** Normalize AI or deterministic SVG for responsive quiz display. */
export const processQuizSvg = (svgString: string | undefined): string | null => {
  if (!svgString) return null;
  let processed = svgString;

  processed = processed.replace(/```(?:xml|svg|html)?\n?/gi, '').replace(/```/g, '').trim();

  if (!processed.includes('viewBox') && processed.includes('<svg')) {
    processed = processed.replace('<svg', '<svg viewBox="0 0 400 250"');
  }

  if (!processed.includes('preserveAspectRatio')) {
    processed = processed.replace('<svg', '<svg preserveAspectRatio="xMidYMid meet"');
  }

  processed = processed.replace(/<svg\b[^>]*>/i, (tag) => tag.replace(/\s(width|height)=["'][^"']*["']/g, ''));

  processed = processed.replace(
    '<svg',
    '<svg style="width: 100%; height: auto; max-height: min(40dvh, 14rem); color: var(--accent);"',
  );

  if (!processed.includes('stroke=') && !processed.includes('fill=')) {
    processed = processed.replace(/<path /g, '<path stroke="currentColor" fill="none" strokeWidth="2" ');
  }

  return processed;
};
