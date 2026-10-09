import { describe, expect, it } from 'vitest';
import {
  buildFractionBarCommands,
  buildFunctionGraphCommands,
  buildGeometricCompareCommands,
  buildNumberLineCommands,
  buildPlaceValueTableCommands,
  looksLikeFunctionExpression,
} from './geogebraCommands';

describe('geogebraCommands', () => {
  it('builds a number line with axis and ticks', () => {
    const cmds = buildNumberLineCommands(0, 5, [2]);
    expect(cmds.some((c) => c.includes('axis = Segment'))).toBe(true);
    expect(cmds.some((c) => c.includes('mark0'))).toBe(true);
    expect(cmds.some((c) => c.includes('ZoomIn'))).toBe(true);
  });

  it('builds fraction bar segments', () => {
    const cmds = buildFractionBarCommands(4, 3, true);
    expect(cmds.filter((c) => c.startsWith('seg')).length).toBeGreaterThanOrEqual(4);
    expect(cmds.some((c) => c.includes('3/4'))).toBe(true);
  });

  it('builds function graph with expression', () => {
    const cmds = buildFunctionGraphCommands('x^2', -5, 5);
    expect(cmds.some((c) => c.includes('f(x) = x^2'))).toBe(true);
    expect(cmds.some((c) => c.includes('ZoomIn'))).toBe(true);
  });

  it('builds geometric compare layout', () => {
    const cmds = buildGeometricCompareCommands(['triangle', 'square']);
    expect(cmds.some((c) => c.includes('g0'))).toBe(true);
    expect(cmds.some((c) => c.includes('g1'))).toBe(true);
  });

  it('builds place value table labels', () => {
    const cmds = buildPlaceValueTableCommands(3047);
    expect(cmds.some((c) => c.includes('Thousands'))).toBe(true);
    expect(cmds.some((c) => c.includes('"3"'))).toBe(true);
  });

  it('detects function-like prompts', () => {
    expect(looksLikeFunctionExpression('f(x) = 2x + 1')).toBe(true);
    expect(looksLikeFunctionExpression('y = x^2')).toBe(true);
    expect(looksLikeFunctionExpression('plain text')).toBe(false);
  });
});
