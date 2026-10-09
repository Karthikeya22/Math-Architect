import { describe, expect, it } from 'vitest';
import { isExactCountableVisualSpec } from './exactCountableVisual';
import { applyQuestionVisualReconcilers } from './reconcileVisualFromStem';
import { prefersDeterministicVisual } from './questionFocusedImagePrompt';

describe('isExactCountableVisualSpec', () => {
  it('accepts array_model with filled cells', () => {
    expect(
      isExactCountableVisualSpec({
        visualType: 'array_model',
        gridRows: 2,
        gridCols: 4,
        values: [1, 1, 1, 0, 1, 1, 1, 1],
      }),
    ).toBe(true);
  });

  it('rejects empty array_model', () => {
    expect(
      isExactCountableVisualSpec({
        visualType: 'array_model',
        gridRows: 2,
        gridCols: 4,
        values: [0, 0, 0, 0, 0, 0, 0, 0],
      }),
    ).toBe(false);
  });
});

describe('prefersDeterministicVisual for exact counts', () => {
  it('uses SVG for reconciled apple addition', () => {
    const q = {
      text: 'Sam has 3 red apples and 4 green apples. How many apples does Sam have in all?',
      options: ['6', '7', '8', '9'],
      correctAnswerIndex: 1,
      visualSpec: { visualType: 'ten_frame', values: Array(10).fill(0) },
      imagePrompt: 'draw fruit',
    };
    applyQuestionVisualReconcilers(q);
    expect(prefersDeterministicVisual(q)).toBe(true);
    expect(q.visualSpec?.visualType).toBe('array_model');
  });
});
