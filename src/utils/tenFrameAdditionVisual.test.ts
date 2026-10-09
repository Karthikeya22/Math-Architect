import { describe, expect, it } from 'vitest';
import { renderPreparedDeterministicVisual } from './prepareQuestionVisual';
import { applyQuestionVisualReconcilers } from './reconcileVisualFromStem';
import {
  buildTenFrameAdditionArrayValues,
  extractTenFrameAdditionOperands,
  reconcileTenFrameAdditionFromStem,
} from './tenFrameAdditionVisual';
import { prefersDeterministicVisual } from './questionFocusedImagePrompt';

describe('extractTenFrameAdditionOperands', () => {
  it('parses two addends from a ten-frame addition stem', () => {
    expect(
      extractTenFrameAdditionOperands('Look at the dots in the ten-frame. What is 4 + 5?'),
    ).toEqual({ first: 4, second: 5 });
  });
});

describe('buildTenFrameAdditionArrayValues', () => {
  it('uses a 2 by 5 grid with the exact addend counts', () => {
    const layout = buildTenFrameAdditionArrayValues({ first: 4, second: 5 });
    expect(layout.gridRows).toBe(2);
    expect(layout.gridCols).toBe(5);
    expect(layout.values.filter((value) => value >= 1).length).toBe(9);
    expect(layout.values.slice(0, 5).filter((value) => value >= 1).length).toBe(4);
    expect(layout.values.slice(5).filter((value) => value >= 1).length).toBe(5);
  });
});

describe('reconcileTenFrameAdditionFromStem', () => {
  it('builds a deterministic array_model instead of sending the item to image generation', () => {
    const question = {
      text: 'Look at the dots in the ten-frame. What is 4 + 5?',
      options: ['7', '8', '9', '10'],
      correctAnswerIndex: 2,
      visualSpec: { visualType: 'ten_frame', values: [1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0] },
      imagePrompt: 'draw dots',
    };
    applyQuestionVisualReconcilers(question);
    expect(question.visualSpec?.visualType).toBe('array_model');
    expect(question.visualSpec?.gridRows).toBe(2);
    expect(question.visualSpec?.gridCols).toBe(5);
    expect(question.visualSpec?.rowColors).toEqual(['red', 'blue']);
    expect(question.imagePrompt).toBe('');
    expect(prefersDeterministicVisual(question)).toBe(true);
    const svg = renderPreparedDeterministicVisual(question);
    expect(svg).toContain('<circle');
    expect((svg?.match(/<circle/g) || []).length).toBe(9);
  });
});
