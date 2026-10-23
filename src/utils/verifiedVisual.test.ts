import { describe, expect, it } from 'vitest';
import type { VisualSpec } from '../types';
import { renderVerifiedVisualSvg } from './verifiedVisual';

describe('renderVerifiedVisualSvg', () => {
  it('returns no svg when there is no spec', () => {
    expect(renderVerifiedVisualSvg(null, 'Find the area.')).toEqual({
      svg: null,
      coveragePct: null,
      reason: 'not_renderable',
    });
  });

  it('renders a complete labeled rectangle figure', () => {
    const spec: VisualSpec = {
      visualType: 'geometric_shape',
      figures: [
        {
          shape: 'rectangle',
          nameLabel: 'Rectangle A',
          width: 9,
          height: 4,
          dimensions: [
            { side: 'top', label: '9 inches' },
            { side: 'right', label: '4 inches' },
          ],
          areaLabel: '36 square inches',
        },
      ],
    };
    const result = renderVerifiedVisualSvg(spec, 'Rectangle A has a length of 9 inches and a width of 4 inches.');
    expect(result.svg).toContain('<svg');
    expect(result.svg).toContain('Rectangle A');
    expect(result.svg).toContain('9 inches');
    expect(result.coveragePct).toBe(100);
    expect(result.reason).toBe('verified');
  });

  it('suppresses a figure when the renderer cannot draw every declared label', () => {
    const spec: VisualSpec = {
      visualType: 'geometric_shape',
      figures: [
        { shape: 'rectangle', nameLabel: 'A', width: 2, height: 2 },
        { shape: 'rectangle', nameLabel: 'B', width: 2, height: 2 },
        { shape: 'rectangle', nameLabel: 'C', width: 2, height: 2 },
        { shape: 'rectangle', nameLabel: 'D', width: 2, height: 2 },
        { shape: 'rectangle', nameLabel: 'E', width: 2, height: 2 },
      ],
    };
    const result = renderVerifiedVisualSvg(spec, 'Compare the five rectangles.');
    expect(result.svg).toBeNull();
    expect(result.reason).not.toBe('verified');
  });
});
