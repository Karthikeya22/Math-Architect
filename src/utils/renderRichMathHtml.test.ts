import { describe, expect, it } from 'vitest';
import { renderRichMathHtml, toPlainMathText } from './renderRichMathHtml';

describe('toPlainMathText', () => {
  it('turns TeX fractions and operators into readable text', () => {
    expect(toPlainMathText('$\\frac{3}{8} + \\frac{4}{8} = \\dfrac{7}{8}$')).toBe('3/8 + 4/8 = 7/8');
    expect(toPlainMathText('$6 \\times 4 \\div 2$')).toBe('6 × 4 ÷ 2');
  });

  it('leaves plain fractions and mixed numbers alone', () => {
    expect(toPlainMathText('7/4 = 1 3/4')).toBe('7/4 = 1 3/4');
  });
});

describe('renderRichMathHtml', () => {
  it('renders scientific notation segments with KaTeX', () => {
    const html = renderRichMathHtml('Stores 9.9 * 10^{15} bytes.');
    expect(html).toContain('katex');
    expect(html).toContain('Stores');
    expect(html).not.toContain('* 10^{15}');
  });

  it('handles sqrt and frac', () => {
    const html = renderRichMathHtml(String.raw`Solve \sqrt{12} and \frac{1}{2}.`);
    expect(html).toContain('katex');
  });

  it('preserves plain text between math chunks', () => {
    const html = renderRichMathHtml('From 3 * 10^3 to 9 * 10^{2}.');
    expect(html).toMatch(/From|to/);
    expect(html).toContain('katex');
  });

  it('renders trig identities from plain ascii (sin^2(theta))', () => {
    const html = renderRichMathHtml('sin^2(theta) + cos^2(theta) = 1');
    expect(html).toContain('katex');
    expect(html).not.toContain('sin^2(theta)');
  });

  it('renders simple fractions in traces (2/5)', () => {
    const html = renderRichMathHtml('selected 2/5 vs 4/5');
    expect(html).toContain('katex');
  });

  it('does not treat plain integer arithmetic as math', () => {
    const html = renderRichMathHtml('Section 1 - 2 overview');
    expect(html).not.toContain('katex');
    expect(html).toContain('Section 1 - 2 overview');
  });

  it('falls back to plain math text when KaTeX cannot parse a segment', () => {
    const html = renderRichMathHtml(String.raw`$ \frac{3}{ `);
    expect(html).not.toMatch(/\\\\frac/);
    expect(html).toMatch(/3/);
  });

  it('does not render empty-fraction junk as [/]', () => {
    const html = renderRichMathHtml(String.raw`Find \frac{}{} of the set.`);
    expect(html).not.toContain('[/]');
    expect(html).toContain('katex');
  });

  it('renders dfrac/tfrac like frac', () => {
    const html = renderRichMathHtml(String.raw`\dfrac{2}{3} + \tfrac{1}{3}`);
    expect(html).toContain('katex');
    expect(html.replace(/<annotation[\s\S]*?<\/annotation>/g, '')).not.toMatch(/\\d?frac/);
  });

  it('renders \\( nested frac exponents \\) without leaking delimiters', () => {
    const html = renderRichMathHtml(String.raw`Which equals \(16^{-\frac{3}{4}}\)?`);
    expect(html).toContain('katex');
    const visible = html.replace(/<annotation[\s\S]*?<\/annotation>/g, '');
    expect(visible).not.toContain('\\(');
    expect(visible).not.toContain('\\)');
    expect(visible).not.toMatch(/\\frac/);
  });

  it('renders double-escaped frac without a stray backslash', () => {
    const html = renderRichMathHtml(String.raw`What is \\frac{3}{4} of 12?`);
    const visible = html.replace(/<annotation[\s\S]*?<\/annotation>/g, '');
    expect(html).toContain('katex');
    expect(visible).not.toMatch(/\\frac/);
    expect(visible).not.toMatch(/(?:^|[^\\])\\(?![a-zA-Z])/);
  });

  it('renders blank brackets and bare square as KaTeX square', () => {
    expect(renderRichMathHtml('Pick [ ].')).toContain('katex');
    expect(renderRichMathHtml(String.raw`Fill \square`)).toContain('katex');
    expect(renderRichMathHtml('Pick [ ].')).not.toContain('[ ]');
  });

  it('renders simple variable powers like s^2', () => {
    const html = renderRichMathHtml('Area = s^2');
    expect(html).toContain('katex');
    expect(html).not.toContain('s^2');
  });
});
