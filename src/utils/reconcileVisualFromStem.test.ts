import { describe, expect, it } from 'vitest';
import {
  applyQuestionVisualReconcilers,
  reconcileFractionVisualFromStem,
  reconcileGeometricVisualFromStem,
  reconcileTenFrameFromStem,
} from './reconcileVisualFromStem';

describe('reconcileFractionVisualFromStem', () => {
  it('builds a fraction_bar from the stem and correct option', () => {
    const q = {
      text: 'Which bar shows 3/8 shaded?',
      options: ['3/8', '2/8', '1/8', '4/8'],
      correctAnswerIndex: 0,
      visualSpec: null as { visualType: string; totalParts?: number; shadedParts?: number } | null,
      imagePrompt: 'draw a bar',
    };
    reconcileFractionVisualFromStem(q);
    expect(q.visualSpec?.visualType).toBe('fraction_bar');
    expect(q.visualSpec?.totalParts).toBe(8);
    expect(q.visualSpec?.shadedParts).toBe(3);
    expect(q.imagePrompt).toBe('');
  });

  it('builds a fraction_bar from common word fractions when no numeric fraction literal is present', () => {
    const q = {
      text: 'Which bar shows one half shaded?',
      options: ['A', 'B', 'C', 'D'],
      correctAnswerIndex: 0,
      visualSpec: null as { visualType: string; totalParts?: number; shadedParts?: number } | null,
      imagePrompt: 'draw a bar',
    };
    reconcileFractionVisualFromStem(q);
    expect(q.visualSpec?.visualType).toBe('fraction_bar');
    expect(q.visualSpec?.totalParts).toBe(2);
    expect(q.visualSpec?.shadedParts).toBe(1);
    expect(q.imagePrompt).toBe('');
  });
});

describe('reconcileTenFrameFromStem', () => {
  it('creates a ten_frame when the stem states a dot count', () => {
    const q = {
      text: 'There are 7 dots in the ten frame. How many more dots are needed to make 10?',
      options: ['3', '4', '5', '6'],
      correctAnswerIndex: 0,
      visualSpec: null as { visualType: string; values?: number[] } | null,
      imagePrompt: 'draw dots',
    };
    reconcileTenFrameFromStem(q);
    expect(q.visualSpec?.visualType).toBe('ten_frame');
    expect(q.visualSpec?.values?.filter((value) => value >= 1).length).toBe(7);
    expect(q.imagePrompt).toBe('');
  });
});

describe('reconcileGeometricVisualFromStem', () => {
  it('builds a multi-shape geometric_shape when the stem compares two figures', () => {
    const q = {
      text: 'Look at the triangle and the square. How are they alike?',
      options: ['Both have 3 sides', 'Both have 4 sides', 'Both are circles', 'Both are red'],
      correctAnswerIndex: 0,
      visualSpec: null as { visualType: string; shapes?: string[] } | null,
      imagePrompt: 'draw shapes',
    };
    reconcileGeometricVisualFromStem(q);
    expect(q.visualSpec?.visualType).toBe('geometric_shape');
    expect(q.visualSpec?.shapes).toEqual(['triangle', 'square']);
    expect(q.imagePrompt).toBe('');
  });
});

describe('ten-frame addition reconciliation', () => {
  it('replaces a mismatched generated layout with a 2x5 array model', () => {
    const q = {
      text: 'Look at the dots in the ten-frame. What is 4 + 5?',
      options: ['7', '8', '9', '10'],
      correctAnswerIndex: 2,
      visualSpec: {
        visualType: 'array_model',
        gridRows: 2,
        gridCols: 6,
        values: [1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1],
        rowColors: ['blue', 'yellow'],
      },
      imagePrompt: 'draw dots',
    };
    applyQuestionVisualReconcilers(q);
    expect(q.visualSpec?.gridCols).toBe(5);
    expect(q.visualSpec?.rowColors).toEqual(['red', 'blue']);
    expect(q.imagePrompt).toBe('');
  });
});

describe('applyQuestionVisualReconcilers', () => {
  it('routes number-word forty-three to four ten-frames and three ones', () => {
    const q = {
      text: "How do you write the number word 'forty-three' in standard form?",
      options: ['34', '403', '43', '40'],
      correctAnswerIndex: 2,
      visualSpec: { visualType: 'bar_chart', categories: ['A', 'B'], values: [3, 4] },
      imagePrompt: 'generic chart',
    };
    applyQuestionVisualReconcilers(q);
    expect(q.visualSpec?.visualType).toBe('ten_frame');
    expect(q.visualSpec?.tensCount).toBe(4);
    expect(q.visualSpec?.onesCount).toBe(3);
    expect(q.imagePrompt).toBe('');
  });

  it('keeps teen place-value visuals ahead of generic ten-frame inference', () => {
    const q = {
      text: 'Look at the dots. The number 14 is made of 1 ten and how many ones?',
      options: ['4 ones', '1 one', '10 ones', '14 ones'],
      correctAnswerIndex: 3,
      visualSpec: null as { visualType: string; values?: number[]; onesCount?: number } | null,
      imagePrompt: 'draw dots',
    };
    applyQuestionVisualReconcilers(q);
    expect(q.visualSpec?.visualType).toBe('ten_frame');
    expect(q.visualSpec?.onesCount).toBe(4);
    expect(q.correctAnswerIndex).toBe(0);
  });
});
