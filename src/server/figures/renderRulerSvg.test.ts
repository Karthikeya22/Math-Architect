import { describe, expect, it } from 'vitest';
import { buildItemClaim } from './itemClaim';
import { renderRulerSvg } from './renderRulerSvg';
import { generateFigure } from './generateFigure';
import type { FigureInput } from './types';

const RULER_QUESTION: FigureInput = {
  kind: 'question',
  grade: '4',
  standardCode: 'MA.4.M.1.1',
  text: 'The ruler below shows a pencil. What is the length of the pencil in centimeters?',
  options: ['4 centimeters', '5 centimeters', '6 centimeters', '7 centimeters'],
  correctAnswerIndex: 2,
};

describe('renderRulerSvg', () => {
  it('puts the object tip exactly on the reading tick', () => {
    const svg = renderRulerSvg(buildItemClaim(RULER_QUESTION));

    expect(svg).toBeTruthy();
    // Ruler spans x=80..820 over 0..10; the 6 cm tick is at 80 + 0.6*740 = 524.
    expect(svg).toContain('L 524.00');
    expect(svg).toContain('>6</text>');
    expect(svg).toContain('>cm</text>');
  });

  it('returns null for non-ruler items', () => {
    const svg = renderRulerSvg(
      buildItemClaim({
        kind: 'question',
        grade: '5',
        text: 'A cube has side lengths of 4 inches. What is its volume?',
        options: ['16', '64', '48', '12'],
        correctAnswerIndex: 1,
      }),
    );

    expect(svg).toBeNull();
  });
});

describe('generateFigure ruler path', () => {
  it('publishes the deterministic ruler without calling an image model', async () => {
    const generate = async () => {
      throw new Error('image model must not be called for ruler items');
    };

    const result = await generateFigure(RULER_QUESTION, generate, {});

    expect(result.status).toBe('verified');
    expect(result.visualPath).toBe('deterministic_svg');
    expect(result.svg).toContain('<svg');
    expect(result.attempts).toBe(0);
  });
});
