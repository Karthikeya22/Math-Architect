import { describe, expect, it } from 'vitest';
import {
  hasUsableImageDataUrl,
  hasUsableQuizFigure,
  hasUsableSvgMarkup,
} from './hasUsableQuizFigure';

describe('hasUsableQuizFigure', () => {
  it('rejects empty or non-image payloads', () => {
    expect(hasUsableImageDataUrl('')).toBe(false);
    expect(hasUsableImageDataUrl('   ')).toBe(false);
    expect(hasUsableImageDataUrl('not-an-image')).toBe(false);
    expect(hasUsableSvgMarkup('')).toBe(false);
    expect(hasUsableSvgMarkup('<div></div>')).toBe(false);
    expect(hasUsableQuizFigure({})).toBe(false);
    expect(hasUsableQuizFigure({ visual: '   ' })).toBe(false);
  });

  it('accepts data URLs and real SVG markup', () => {
    expect(hasUsableImageDataUrl('data:image/png;base64,abc')).toBe(true);
    expect(hasUsableSvgMarkup('<svg viewBox="0 0 10 10"></svg>')).toBe(true);
    expect(
      hasUsableQuizFigure({
        generatedImageBase64: 'data:image/jpeg;base64,SU1H',
      }),
    ).toBe(true);
    expect(hasUsableQuizFigure({ visual: '<svg xmlns="http://www.w3.org/2000/svg"></svg>' })).toBe(
      true,
    );
  });

  it('hides figures flagged for review or below full label coverage', () => {
    expect(
      hasUsableQuizFigure({
        visual: '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
        figureStatus: 'needs_review',
      }),
    ).toBe(false);
    expect(
      hasUsableQuizFigure({
        visual: '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
        figureCoverage: { pct: 80 },
      }),
    ).toBe(false);
    expect(
      hasUsableQuizFigure({
        visual: '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
        figureCoverage: { pct: 100 },
      }),
    ).toBe(true);
    expect(
      hasUsableQuizFigure({
        visual: '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
        figureCoverage: { pct: 100, missing: ['9 inches'] },
      }),
    ).toBe(false);
  });
});
