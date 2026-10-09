import { describe, expect, it } from 'vitest';
import { applyQuestionVisualReconcilers } from './reconcileVisualFromStem';
import {
  extractLabeledCoordinatesFromText,
  reconcileCoordinatePlaneFromStem,
} from './reconcileCoordinatePlaneFromStem';
import { prefersDeterministicVisual } from './questionFocusedImagePrompt';

describe('extractLabeledCoordinatesFromText', () => {
  it('parses rectangle vertices', () => {
    const pts = extractLabeledCoordinatesFromText(
      'Rectangle JKLM has vertices J(-3, -1), K(-1, -1), L(-1, -4), and M(-3, -4).',
    );
    expect(pts).toHaveLength(4);
    expect(pts.find((p) => p.label === 'J')).toEqual({ label: 'J', x: -3, y: -1 });
    expect(pts.find((p) => p.label === 'L')).toEqual({ label: 'L', x: -1, y: -4 });
  });

  it('parses a single labeled vertex', () => {
    expect(
      extractLabeledCoordinatesFromText(
        'Square PQRS has a vertex P at (4, -8). If the square is dilated by a scale factor of 0.5 centered at the origin, what are the coordinates of vertex P\'?',
      ),
    ).toEqual([{ label: 'P', x: 4, y: -8 }]);
  });
});

describe('reconcileCoordinatePlaneFromStem', () => {
  it('builds coordinate_plane and clears imagePrompt', () => {
    const q = {
      text: 'Rectangle JKLM has vertices J(-3, -1), K(-1, -1), L(-1, -4), and M(-3, -4). If the rectangle is reflected across the y-axis, what are the coordinates of vertex L\'?',
      visualSpec: { visualType: 'geometric_shape', shapeName: 'rectangle' },
      imagePrompt: 'Draw a rectangle on a white background',
    };
    reconcileCoordinatePlaneFromStem(q);
    expect(q.visualSpec?.visualType).toBe('coordinate_plane');
    expect(q.visualSpec?.points).toHaveLength(4);
    expect(q.imagePrompt).toBe('');
    expect(q.visualSpec?.xMin).toBeLessThanOrEqual(-3);
    expect(q.visualSpec?.xMax).toBeGreaterThanOrEqual(0);
  });

  it('prefers deterministic SVG after full reconciler pass', () => {
    const q = {
      text: 'Rectangle JKLM has vertices J(-3, -1), K(-1, -1), L(-1, -4), and M(-3, -4).',
      options: ['(1, -4)', '(-1, 4)', '(1, 4)', '(-4, -1)'],
      correctAnswerIndex: 0,
      visualSpec: null as { visualType: string } | null,
      imagePrompt: 'generic rectangle',
    };
    applyQuestionVisualReconcilers(q);
    expect(q.visualSpec?.visualType).toBe('coordinate_plane');
    expect(prefersDeterministicVisual(q)).toBe(true);
    expect(q.imagePrompt).toBe('');
  });
});
