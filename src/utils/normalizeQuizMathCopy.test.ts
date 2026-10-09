import { describe, expect, it } from 'vitest';
import { normalizeQuizMathCopy } from './normalizeQuizMathCopy';
import { renderRichMathHtml } from './renderRichMathHtml';

describe('normalizeQuizMathCopy', () => {
  it('repairs mojibake placeholders in missing-factor equations', () => {
    expect(normalizeQuizMathCopy('What number makes the equation true? 6 !! ⊥ = 42')).toContain(
      '$6 \\times \\square = 42$',
    );
  });

  it('wraps bare latex times equations', () => {
    expect(normalizeQuizMathCopy('Solve 6 \\times ? = 42')).toBe('Solve $6 \\times \\square = 42$');
  });

  it('closes a single unmatched dollar delimiter', () => {
    expect(normalizeQuizMathCopy('What number makes the equation true? $6 \\times 7 = 42')).toBe(
      'What number makes the equation true? $6 \\times 7 = 42$',
    );
  });

  it('rewrites empty frac and dfrac to a square placeholder', () => {
    expect(normalizeQuizMathCopy(String.raw`Find \frac{}{} of the set.`)).toBe(
      'Find $\\square$ of the set.',
    );
    expect(normalizeQuizMathCopy(String.raw`Find \dfrac{}{} of the set.`)).toBe(
      'Find $\\square$ of the set.',
    );
  });

  it('flattens incomplete frac braces to a/b', () => {
    expect(normalizeQuizMathCopy(String.raw`Compute \frac{3}{8 plus one.`)).toBe(
      'Compute $3/8$ plus one.',
    );
  });

  it('rewrites literal [/] blank-fraction markers', () => {
    expect(normalizeQuizMathCopy('The missing part is [/].')).toBe('The missing part is $\\square$.');
  });

  it('leaves valid frac unchanged aside from dollar balancing', () => {
    expect(normalizeQuizMathCopy(String.raw`Solve \frac{3}{8}.`)).toBe(String.raw`Solve \frac{3}{8}.`);
  });

  it('collapses double-escaped latex commands', () => {
    expect(normalizeQuizMathCopy(String.raw`What is \\frac{3}{4} of 12?`)).toBe(
      String.raw`What is \frac{3}{4} of 12?`,
    );
  });

  it('converts \\( \\) and \\[ \\] delimiters to dollar math', () => {
    expect(normalizeQuizMathCopy(String.raw`Evaluate \( \frac{1}{2} \)`)).toBe(
      String.raw`Evaluate $ \frac{1}{2} $`,
    );
    expect(normalizeQuizMathCopy(String.raw`\[ x^2 \]`)).toBe(String.raw`$$ x^2 $$`);
  });

  it('rewrites blank bracket placeholders to a square', () => {
    expect(normalizeQuizMathCopy('The blank is [ ].')).toBe('The blank is $\\square$.');
    expect(normalizeQuizMathCopy('The blank is [_].')).toBe('The blank is $\\square$.');
  });

  it('strips \\left and \\right sizing commands', () => {
    expect(normalizeQuizMathCopy(String.raw`\left(\frac{1}{2}\right)`)).toBe(
      String.raw`(\frac{1}{2})`,
    );
  });

  it('wraps a bare \\square token for KaTeX', () => {
    expect(normalizeQuizMathCopy(String.raw`Fill in \square`)).toBe('Fill in $\\square$');
  });
});

describe('renderRichMathHtml with normalized quiz copy', () => {
  it('renders repaired missing-factor equations with KaTeX', () => {
    const html = renderRichMathHtml('What number makes the equation true? 6 !! ⊥ = 42');
    expect(html).toContain('katex');
    expect(html).not.toContain('⊥');
    expect(html).not.toContain('!!');
  });
});
