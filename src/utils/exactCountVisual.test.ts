import { describe, expect, it } from 'vitest';
import {
  buildExactCountImagePrompt,
  extractColoredQuantityGroups,
  extractUncoloredAddendGroups,
  parseEnglishNumberPhrase,
  parseNumberWordFromStem,
  reconcileExactCountObjectsFromStem,
  reconcileWordPlaceValueFromStem,
  stemHasPlottableExactCounts,
} from './exactCountVisual';
import { applyQuestionVisualReconcilers } from './reconcileVisualFromStem';

describe('parseEnglishNumberPhrase', () => {
  it('parses forty-three', () => {
    expect(parseEnglishNumberPhrase('forty-three')).toBe(43);
  });

  it('parses seven thousand forty-two', () => {
    expect(parseEnglishNumberPhrase('seven thousand forty-two')).toBe(7042);
  });

  it('parses five thousand eight', () => {
    expect(parseEnglishNumberPhrase('five thousand eight')).toBe(5008);
  });
});

describe('extractColoredQuantityGroups', () => {
  it('finds two colored groups in a join-together stem', () => {
    expect(
      extractColoredQuantityGroups(
        'Sam has 3 red apples and 4 green apples. How many apples does Sam have in all?',
      ),
    ).toEqual([
      { count: 3, color: 'red' },
      { count: 4, color: 'green' },
    ]);
  });

  it('parses word-number colored groups', () => {
    expect(
      extractColoredQuantityGroups(
        'Mia has two red apples and three green apples. How many apples does Mia have?',
      ),
    ).toEqual([
      { count: 2, color: 'red' },
      { count: 3, color: 'green' },
    ]);
  });
});

describe('extractUncoloredAddendGroups', () => {
  it('finds two noun groups without color words', () => {
    expect(
      extractUncoloredAddendGroups(
        'Liam has 3 apples and 4 oranges. How many pieces of fruit does Liam have in all?',
      ),
    ).toEqual([
      { count: 3, color: 'red' },
      { count: 4, color: 'blue' },
    ]);
  });
});

describe('stemHasPlottableExactCounts', () => {
  it('is true for uncolored join-together stems', () => {
    expect(
      stemHasPlottableExactCounts(
        'Liam has 3 apples and 4 oranges. How many pieces of fruit does Liam have in all?',
      ),
    ).toBe(true);
  });
});

describe('reconcileExactCountObjectsFromStem', () => {
  it('builds a two-row array_model for colored addition stems', () => {
    const q = {
      text: 'Sam has 3 red apples and 4 green apples. How many apples does Sam have in all?',
      visualSpec: null as { visualType: string; gridRows?: number; values?: number[] } | null,
      imagePrompt: 'draw apples',
    };
    reconcileExactCountObjectsFromStem(q);
    expect(q.visualSpec?.visualType).toBe('array_model');
    expect(q.visualSpec?.gridRows).toBe(2);
    expect(q.imagePrompt).toBe('');
    const values = (q.visualSpec?.values || []).map(Number);
    expect(values.filter((v) => v >= 1).length).toBe(7);
  });

  it('builds a single-row array for conservation-of-number stems', () => {
    const q = {
      text: 'Sam counts 8 toy cars in a straight line. Then, he moves the cars into a circle. How many cars does Sam have now?',
      visualSpec: null as { visualType: string; gridCols?: number } | null,
      imagePrompt: 'cars',
    };
    reconcileExactCountObjectsFromStem(q);
    expect(q.visualSpec?.visualType).toBe('array_model');
    expect(q.visualSpec?.gridCols).toBe(8);
    expect(q.imagePrompt).toBe('');
  });

  it('overrides a wrong AI bar_chart visualType for colored addition', () => {
    const q = {
      text: 'Sam has 3 red apples and 4 green apples. How many apples does Sam have in all?',
      visualSpec: {
        visualType: 'bar_chart',
        categories: ['red', 'green'],
        values: [3, 4],
      } as { visualType: string; gridRows?: number; values?: number[] },
      imagePrompt: 'generic chart',
    };
    reconcileExactCountObjectsFromStem(q);
    expect(q.visualSpec?.visualType).toBe('array_model');
    expect(q.visualSpec?.gridRows).toBe(2);
    expect(q.imagePrompt).toBe('');
  });

  it('uses ten_frame for small single-count stems without line layout', () => {
    const q = {
      text: 'Mia has 6 stars. How many stars does Mia have?',
      visualSpec: { visualType: 'bar_chart', categories: ['stars'], values: [6] } as {
        visualType: string;
        values?: number[];
      },
      imagePrompt: 'stars',
    };
    reconcileExactCountObjectsFromStem(q);
    expect(q.visualSpec?.visualType).toBe('ten_frame');
    expect((q.visualSpec?.values || []).filter((v) => Number(v) >= 1).length).toBe(6);
    expect(q.imagePrompt).toBe('');
  });

  it('builds a single-row array for subtraction start counts', () => {
    const q = {
      text: 'There are 8 birds on a branch. 5 birds fly away. How many birds are left?',
      visualSpec: null as { visualType: string; gridCols?: number } | null,
      imagePrompt: 'birds flying',
    };
    reconcileExactCountObjectsFromStem(q);
    expect(q.visualSpec?.visualType).toBe('array_model');
    expect(q.visualSpec?.gridCols).toBe(8);
    expect(q.imagePrompt).toBe('');
  });
});

describe('parseNumberWordFromStem', () => {
  it('parses quoted forty-three in a standard-form stem', () => {
    expect(
      parseNumberWordFromStem(
        "How do you write the number word 'forty-three' in standard form?",
      ),
    ).toBe(43);
  });

  it('parses seven thousand forty-two without truncating to 42', () => {
    expect(
      parseNumberWordFromStem('What is the expanded form of the number seven thousand forty-two?'),
    ).toBe(7042);
  });
});

describe('reconcileWordPlaceValueFromStem', () => {
  it('builds four full ten-frames and three ones for forty-three', () => {
    const q = {
      text: "How do you write the number word 'forty-three' in standard form?",
      visualSpec: { visualType: 'array_model', gridRows: 2, gridCols: 5, values: [1, 1, 0, 0, 0, 1, 1, 0, 0, 0] },
      imagePrompt: 'wrong picture',
    };
    reconcileWordPlaceValueFromStem(q);
    expect(q.visualSpec?.visualType).toBe('ten_frame');
    expect(q.visualSpec?.tensCount).toBe(4);
    expect(q.visualSpec?.onesCount).toBe(3);
    expect(q.imagePrompt).toBe('');
  });

  it('builds a four-column place-value table from word numbers', () => {
    const q = {
      text: 'What is the expanded form of the number seven thousand forty-two?',
      visualSpec: null as { visualType: string; columns?: string[]; rows?: string[][] } | null,
      imagePrompt: 'chart',
    };
    reconcileWordPlaceValueFromStem(q);
    expect(q.visualSpec?.visualType).toBe('table');
    expect(q.visualSpec?.columns).toEqual(['Thousands', 'Hundreds', 'Tens', 'Ones']);
    expect(q.visualSpec?.rows).toEqual([['7', '0', '4', '2']]);
    expect(q.imagePrompt).toBe('');
  });
});

describe('buildExactCountImagePrompt', () => {
  it('lists exact per-row counts for array_model', () => {
    const q = {
      text: 'Sam has 3 red apples and 4 green apples. How many apples does Sam have in all?',
      visualSpec: {
        visualType: 'array_model',
        gridRows: 2,
        gridCols: 4,
        values: [1, 1, 1, 0, 1, 1, 1, 1],
        rowColors: ['red', 'green'],
      },
    };
    const prompt = buildExactCountImagePrompt(q, 'Grade 1');
    expect(prompt).toContain('Row 1: exactly 3 solid red circles');
    expect(prompt).toContain('Row 2: exactly 4 solid green circles');
  });
});

describe('applyQuestionVisualReconcilers integration', () => {
  it('routes apple addition through deterministic array_model', () => {
    const q = {
      text: 'Sam has 3 red apples and 4 green apples. How many apples does Sam have in all?',
      options: ['6', '7', '8', '9'],
      correctAnswerIndex: 1,
      visualSpec: { visualType: 'ten_frame', values: [1, 1, 0, 0, 0, 0, 0, 0, 0, 0] },
      imagePrompt: 'wrong',
    };
    applyQuestionVisualReconcilers(q);
    expect(q.visualSpec?.visualType).toBe('array_model');
    expect(q.imagePrompt).toBe('');
  });
});
