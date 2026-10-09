import { describe, expect, it } from 'vitest';
import { processQuizSvg } from './processQuizSvg';

describe('processQuizSvg', () => {
  it('strips fixed sizing from the root svg only', () => {
    const out = processQuizSvg(
      '<svg width="400" height="200" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="40" height="30"/></svg>',
    );
    expect(out).not.toMatch(/<svg[^>]*\swidth="400"/);
    expect(out).not.toMatch(/<svg[^>]*\sheight="200"/);
    expect(out).toContain('<rect x="0" y="0" width="40" height="30"/>');
  });

  it('adds a viewBox and aspect ratio when missing', () => {
    const out = processQuizSvg('<svg><circle r="4"/></svg>');
    expect(out).toContain('viewBox="0 0 400 250"');
    expect(out).toContain('preserveAspectRatio="xMidYMid meet"');
  });

  it('removes markdown code fences', () => {
    expect(processQuizSvg('```svg\n<svg viewBox="0 0 1 1"></svg>\n```')).not.toContain('```');
  });

  it('returns null for empty input', () => {
    expect(processQuizSvg(undefined)).toBeNull();
  });
});
