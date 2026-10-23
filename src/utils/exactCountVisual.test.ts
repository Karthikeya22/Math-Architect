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

  it('does not treat a container rate as two addends', () => {
    expect(
      extractUncoloredAddendGroups(
        'A juice punch recipe requires 2 gallons of fruit juice. Leo has 5 containers of juice, and each container holds 3 quarts. How many quarts of juice will Leo have left over after making the punch?',
      ),
    ).toBeNull();
  });

  it('does not add counts with incompatible units', () => {
    expect(extractUncoloredAddendGroups('Mia has 5 containers and 3 quarts. How many in all?')).toBeNull();
    expect(extractUncoloredAddendGroups('Mia has 3 feet and 4 inches. How many in all?')).toBeNull();
  });
});

describe('fraction and geometry stems are not addend stories', () => {
  const fractionStem =
    'A square represents 1 whole. The square is divided horizontally into 3 equal rows, and 2 rows are shaded yellow. ' +
    'The square is also divided vertically into 5 equal columns, and 4 columns are shaded blue. The region where the ' +
    'yellow and blue shading overlaps is green. What multiplication equation represents the green overlapping region?';

  it('does not read structural nouns (rows/columns/equal) as objects', () => {
    expect(extractUncoloredAddendGroups('The square is divided into 3 equal rows and 5 equal columns.')).toBeNull();
  });

  it('extracts neither colored nor uncolored groups from the fraction stem', () => {
    expect(extractColoredQuantityGroups(fractionStem)).toBeNull();
    expect(extractUncoloredAddendGroups(fractionStem)).toBeNull();
  });

  it('leaves the fraction stem without a derived array_model spec', () => {
    const q: any = { text: fractionStem, visualSpec: null as any, imagePrompt: 'array model' };
    reconcileExactCountObjectsFromStem(q);
    expect(q.visualSpec).toBeFalsy();
    expect(q.imagePrompt).toBe('array model');
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

describe('reconcileExactCountObjectsFromStem on data displays (audit repros)', () => {
  it('keeps the model bar_chart for a bar-graph stem', () => {
    const spec = { visualType: 'bar_chart', categories: ['Amy', 'Ben', 'Cora', 'Dan'], values: [6, 9, 4, 7] };
    const q: any = {
      text: 'The bar graph shows the number of books read by four students: Amy read 6 books, Ben read 9 books, Cora read 4 books, and Dan read 7 books. How many more books did Ben read than Cora?',
      visualSpec: { ...spec },
    };
    reconcileExactCountObjectsFromStem(q);
    expect(q.visualSpec).toEqual(spec);
  });

  it.each([
    'A line plot shows the lengths of ribbons measured in whole inches: there are 3 ribbons that are 4 inches, 5 ribbons that are 5 inches, and 2 ribbons that are 6 inches. How many more ribbons are 5 inches than 6 inches?',
    'A school snack bar tracks fruit cups sold in a table: Apple has 18 sold, Banana has 24 sold, and Peach has 15 sold. How many more Banana cups than Peach cups were sold?',
  ])('does not invent a dot array for a data-display stem: %s', (text) => {
    const q: any = { text, visualSpec: null };
    reconcileExactCountObjectsFromStem(q);
    expect(q.visualSpec?.visualType).not.toBe('array_model');
  });
});

describe('reconcileExactCountObjectsFromStem', () => {
  it('builds a two-row array_model for colored addition stems', () => {
    const q: any = {
      text: 'Sam has 3 red apples and 4 green apples. How many apples does Sam have in all?',
      visualSpec: null as any,
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
    const q: any = {
      text: 'Sam counts 8 toy cars in a straight line. Then, he moves the cars into a circle. How many cars does Sam have now?',
      visualSpec: null as any,
      imagePrompt: 'cars',
    };
    reconcileExactCountObjectsFromStem(q);
    expect(q.visualSpec?.visualType).toBe('array_model');
    expect(q.visualSpec?.gridCols).toBe(8);
    expect(q.imagePrompt).toBe('');
  });

  it('overrides a wrong AI bar_chart visualType for colored addition', () => {
    const q: any = {
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
    const q: any = {
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
    const q: any = {
      text: 'There are 8 birds on a branch. 5 birds fly away. How many birds are left?',
      visualSpec: null as any,
      imagePrompt: 'birds flying',
    };
    reconcileExactCountObjectsFromStem(q);
    expect(q.visualSpec?.visualType).toBe('array_model');
    expect(q.visualSpec?.gridCols).toBe(8);
    expect(q.imagePrompt).toBe('');
  });

  it('does not build a counting visual for a rate/conversion stem', () => {
    const q: any = {
      text: 'A juice punch recipe requires 2 gallons of fruit juice. Leo has 5 containers of juice, and each container holds 3 quarts. How many quarts of juice will Leo have left over after making the punch?',
      visualSpec: null as any,
      imagePrompt: 'juice containers',
    };
    reconcileExactCountObjectsFromStem(q);
    expect(q.visualSpec).toBeFalsy();
  });

  it('does not build a counting visual when two units must be converted', () => {
    const q: any = {
      text: 'A recipe needs 2 gallons of milk. Leo has 5 quarts. How many quarts does he still need?',
      visualSpec: null as any,
      imagePrompt: 'milk',
    };
    reconcileExactCountObjectsFromStem(q);
    expect(q.visualSpec).toBeFalsy();
  });

  it('does not turn a rate/multiplication story into two addend rows', () => {
    const q: any = {
      text: 'A baker has 5 trays with 3 cookies on each tray. How many cookies are there in all?',
      visualSpec: null as any,
      imagePrompt: 'cookies',
    };
    reconcileExactCountObjectsFromStem(q);
    expect(q.visualSpec).toBeFalsy();
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

describe('reconcileWordPlaceValueFromStem on fractions (audit repro)', () => {
  it.each([
    'How is the fraction 7/2 written in numeral-word form?',
    'Which shows the fraction eleven eighths written in standard form?',
    'Two fraction bars are shown. In total, 5 thirds are shaded. How is this amount written in word form?',
  ])('does not draw ten-frames for: %s', (text) => {
    const q: any = { text, visualSpec: null };
    reconcileWordPlaceValueFromStem(q);
    expect(q.visualSpec).toBeNull();
  });
});

describe('reconcileWordPlaceValueFromStem', () => {
  it('builds four full ten-frames and three ones for forty-three', () => {
    const q: any = {
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
    const q: any = {
      text: 'What is the expanded form of the number seven thousand forty-two?',
      visualSpec: null as any,
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
    const q: any = {
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
    const q: any = {
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
