import { describe, expect, it } from 'vitest';
import {
  applyQuestionVisualReconcilers,
  countDisplayStyle,
  extractFractionAreaModel,
  reconcileFractionAreaModelFromStem,
  reconcileFractionVisualFromStem,
  reconcileGeometricVisualFromStem,
  reconcilePlaceValueChartFromStem,
  reconcileTenFrameFromStem,
} from './reconcileVisualFromStem';

// Audit repros (MA.2/3.DP): "The bar graph shows..." items had no graph because the
// quiz model's spec cannot carry categories; build the display from the stem's pairs.
describe('data displays from the stem', () => {
  it('builds a bar_chart from "The bar graph shows" name-value pairs', () => {
    const q: any = {
      text: 'The bar graph shows the number of books read by four students: Maya read 6 books, Leo read 9 books, Sam read 4 books, and Zoe read 7 books. How many more books did Leo read than Sam?',
      visualSpec: { visualType: 'bar_chart', values: [6, 9, 4, 7] },
    };
    applyQuestionVisualReconcilers(q);
    expect(q.visualSpec).toMatchObject({ visualType: 'bar_chart', categories: ['Maya', 'Leo', 'Sam', 'Zoe'], values: [6, 9, 4, 7] });
  });

  it('builds a table for a table stem', () => {
    const q: any = {
      text: 'A table shows the number of apples picked: Liam picked 8 apples, Ava picked 5 apples, and Noah picked 7 apples. How many did Liam and Ava pick in all?',
      visualSpec: null,
    };
    applyQuestionVisualReconcilers(q);
    expect(q.visualSpec).toMatchObject({ visualType: 'table', columns: ['Name', 'Apples'], rows: [['Liam', '8'], ['Ava', '5'], ['Noah', '7']] });
  });

  it('builds a tally chart (not a table) for a tally stem', () => {
    const q: any = { text: 'A tally chart tracks favorite sports. Soccer has 7 tally marks. Basketball has 4 tally marks. How many more chose Soccer?', visualSpec: null };
    applyQuestionVisualReconcilers(q);
    expect(q.visualSpec).toMatchObject({ visualType: 'bar_chart', chartStyle: 'tally', categories: ['Soccer', 'Basketball'], values: [7, 4] });
  });

  it('leaves stems without a data display alone', () => {
    const q: any = { text: 'Maya read 6 books and Leo read 9 books. How many in all?', visualSpec: null };
    applyQuestionVisualReconcilers(q);
    expect(q.visualSpec?.visualType).not.toBe('bar_chart');
  });
});

const FRACTION_PRODUCT_STEM =
  'A square represents 1 whole. The square is divided horizontally into 3 equal rows, and 2 rows are shaded yellow. ' +
  'The square is also divided vertically into 5 equal columns, and 4 columns are shaded blue. The region where the ' +
  'yellow and blue shading overlaps is green. What multiplication equation represents the green overlapping region?';

describe('reconcileFractionAreaModelFromStem', () => {
  it('builds a 3x5 area model with 2 shaded rows and 4 shaded columns', () => {
    const q: any = { text: FRACTION_PRODUCT_STEM, visualSpec: null as any, imagePrompt: 'array model' };
    reconcileFractionAreaModelFromStem(q);
    expect(q.visualSpec).toEqual({
      visualType: 'area_model',
      gridRows: 3,
      gridCols: 5,
      highlightRows: 2,
      highlightCols: 4,
    });
    expect(q.imagePrompt).toBe('');
  });

  it('parses the explicit fraction-product form', () => {
    expect(extractFractionAreaModel('What is 2/3 x 4/5?')).toEqual({
      rows: 3,
      shadedRows: 2,
      cols: 5,
      shadedCols: 4,
    });
  });

  // Screenshot repro (MA.5.FR.2.2): got a 3/20 fraction strip instead of the 4 x 5 area model.
  it('parses "covers 3 of the 5 columns ... covered by both" wording', () => {
    expect(
      extractFractionAreaModel(
        'An area model is divided into 5 equal columns and 4 equal rows. Shading covers 3 of the 5 columns, and a crosshatch pattern covers 1 of the 4 rows. What fraction of the entire area model is covered by both shading and the crosshatch pattern?',
      ),
    ).toEqual({ rows: 4, shadedRows: 1, cols: 5, shadedCols: 3 });
  });

  it('replaces a model-sent fraction strip with the area model the stem describes', () => {
    const q: any = {
      text: 'An area model is divided into 5 equal columns and 4 equal rows. Shading covers 3 of the 5 columns, and a crosshatch pattern covers 1 of the 4 rows. What fraction of the entire area model is covered by both shading and the crosshatch pattern?',
      visualSpec: { visualType: 'fraction_bar', totalParts: 20, shadedParts: 3 },
    };
    reconcileFractionAreaModelFromStem(q);
    expect(q.visualSpec).toMatchObject({ visualType: 'area_model', gridRows: 4, gridCols: 5, highlightRows: 1, highlightCols: 3 });
  });

  it('parses "the product of 3/4 and 2/5"', () => {
    expect(extractFractionAreaModel('What is the product of 3/4 and 2/5?')).toEqual({ rows: 4, shadedRows: 3, cols: 5, shadedCols: 2 });
  });

  it('ignores partitioned shapes without a product/overlap context', () => {
    expect(
      extractFractionAreaModel('The square is divided into 3 equal rows and 5 equal columns.'),
    ).toBeNull();
  });

  it('takes precedence over the single-factor fraction reconciler', () => {
    const q: any = {
      text: FRACTION_PRODUCT_STEM,
      options: ['2/3 x 4/5 = 8/15', '2/3 x 4/5 = 8/8', '2/3 + 4/5 = 6/8', '2/5 x 3/1 = 6/20'],
      correctAnswerIndex: 0,
      visualSpec: null as any,
    };
    applyQuestionVisualReconcilers(q);
    expect(q.visualSpec?.visualType).toBe('area_model');
  });
});

describe('reconcilePlaceValueChartFromStem', () => {
  it('charts the whole comma-formatted number when expanding it', () => {
    const q: any = { text: 'What is 5,803 written in expanded form?', visualSpec: null };
    reconcilePlaceValueChartFromStem(q);

    expect(q.visualSpec).toEqual({
      visualType: 'table',
      columns: ['Thousands', 'Hundreds', 'Tens', 'Ones'],
      rows: [['5', '8', '0', '3']],
    });
  });

  it('does not print the answer for a standard-form task', () => {
    const q: any = {
      text: 'What is 4,000 + 60 + 8 written in standard form?',
      visualSpec: { visualType: 'table', columns: ['Thousands', 'Ones'], rows: [['4', '8']] },
    };
    reconcilePlaceValueChartFromStem(q);

    expect(q.visualSpec).toBeUndefined();
  });

  it('drops an answer-filled chart for a word-form task', () => {
    const q: any = {
      text: 'What is the standard form of seven thousand twenty-four?',
      visualSpec: { visualType: 'table', columns: ['Thousands', 'Ones'], rows: [['7', '4']] },
    };
    reconcilePlaceValueChartFromStem(q);

    expect(q.visualSpec).toBeUndefined();
  });
});

describe('reconcileFractionVisualFromStem', () => {
  it('builds a fraction_bar from the stem and correct option', () => {
    const q: any = {
      text: 'Which bar shows 3/8 shaded?',
      options: ['3/8', '2/8', '1/8', '4/8'],
      correctAnswerIndex: 0,
      visualSpec: null as any,
      imagePrompt: 'draw a bar',
    };
    reconcileFractionVisualFromStem(q);
    expect(q.visualSpec?.visualType).toBe('fraction_bar');
    expect(q.visualSpec?.totalParts).toBe(8);
    expect(q.visualSpec?.shadedParts).toBe(3);
    expect(q.imagePrompt).toBe('');
  });

  it('builds a fraction_bar from common word fractions when no numeric fraction literal is present', () => {
    const q: any = {
      text: 'Which bar shows one half shaded?',
      options: ['A', 'B', 'C', 'D'],
      correctAnswerIndex: 0,
      visualSpec: null as any,
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
    const q: any = {
      text: 'There are 7 dots in the ten frame. How many more dots are needed to make 10?',
      options: ['3', '4', '5', '6'],
      correctAnswerIndex: 0,
      visualSpec: null as any,
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
    const q: any = {
      text: 'Look at the triangle and the square. How are they alike?',
      options: ['Both have 3 sides', 'Both have 4 sides', 'Both are circles', 'Both are red'],
      correctAnswerIndex: 0,
      visualSpec: null as any,
      imagePrompt: 'draw shapes',
    };
    reconcileGeometricVisualFromStem(q);
    expect(q.visualSpec?.visualType).toBe('geometric_shape');
    expect(q.visualSpec?.shapes).toEqual(['triangle', 'square']);
    expect(q.imagePrompt).toBe('');
  });

  it('does not treat a unit phrase as a shape', () => {
    const q: any = {
      text: 'A rectangle has an area of 36 square inches. What is its length?',
      options: ['6 inches', '9 inches', '12 inches', '36 inches'],
      correctAnswerIndex: 0,
      visualSpec: null as any,
      imagePrompt: '',
    };
    reconcileGeometricVisualFromStem(q);
    expect(q.visualSpec?.shapes ?? []).not.toContain('square');
    expect(q.visualSpec?.shapeName).not.toBe('square');
  });

  it('keeps named figures, given dimensions, and area labels for Rectangle A and B', () => {
    const q: any = {
      text: 'Rectangle A has a length of 9 inches and a width of 4 inches. Rectangle B has a length of 12 inches. Both rectangles have an area of 36 square inches. Which statement is true?',
      options: [
        'Rectangle A has a greater area than Rectangle B',
        'Rectangle B has a greater perimeter than Rectangle A',
        'Both rectangles have the same perimeter',
        'Rectangle A and Rectangle B have the same length',
      ],
      correctAnswerIndex: 1,
      visualSpec: null as any,
      imagePrompt: '',
    };
    reconcileGeometricVisualFromStem(q);
    const figures = q.visualSpec?.figures ?? [];
    expect(figures).toHaveLength(2);
    const [a, b] = figures;
    expect(a?.id).toBe('A');
    expect(a?.nameLabel).toBe('Rectangle A');
    expect(a?.width).toBe(9);
    expect(a?.height).toBe(4);
    expect(a?.dimensions).toEqual([
      { side: 'top', label: '9 inches' },
      { side: 'right', label: '4 inches' },
    ]);
    expect(a?.areaLabel).toBe('36 square inches');
    expect(b?.id).toBe('B');
    expect(b?.width).toBe(12);
    expect(b?.height).toBe(3);
    expect(b?.dimensions).toEqual([{ side: 'top', label: '12 inches' }]);
  });

  it('builds a measured cube figure from "side lengths" phrasing', () => {
    const q: any = {
      text: 'A cube has side lengths of 4 inches. What is its volume?',
      options: ['12 cubic inches', '16 cubic inches', '64 cubic inches', '48 cubic inches'],
      correctAnswerIndex: 2,
      visualSpec: null as any,
      imagePrompt: '',
    };
    reconcileGeometricVisualFromStem(q);
    const figures = q.visualSpec?.figures ?? [];
    expect(figures).toHaveLength(1);
    expect(figures[0]?.shape).toBe('cube');
    expect(figures[0]?.width).toBe(4);
    expect(figures[0]?.height).toBe(4);
    expect(figures[0]?.dimensions).toEqual([{ side: 'top', label: '4 inches' }]);
  });

  it('labels a rectangle when only one side is given', () => {
    const q: any = {
      text: 'A rectangle has a side of 5 inches and an area of 20 square inches. What is the missing side length?',
      options: ['2 inches', '3 inches', '4 inches', '5 inches'],
      correctAnswerIndex: 2,
      visualSpec: null as any,
      imagePrompt: '',
    };
    reconcileGeometricVisualFromStem(q);
    const figures = q.visualSpec?.figures ?? [];
    expect(figures).toHaveLength(1);
    expect(figures[0]?.width).toBe(5);
    expect(figures[0]?.height).toBe(4);
    expect(figures[0]?.dimensions).toEqual([{ side: 'top', label: '5 inches' }]);
  });

  it('builds a cylinder figure with radius and height labels', () => {
    const q: any = {
      text: 'Find the volume of a cylinder with a radius of 3 inches and a height of 10 inches.',
      options: ['30 cubic inches', '90 cubic inches', '300 cubic inches', '900 cubic inches'],
      correctAnswerIndex: 1,
      visualSpec: null as any,
      imagePrompt: '',
    };
    reconcileGeometricVisualFromStem(q);
    const figures = q.visualSpec?.figures ?? [];
    expect(figures).toHaveLength(1);
    expect(figures[0]?.shape).toBe('cylinder');
    expect(figures[0]?.width).toBe(6);
    expect(figures[0]?.height).toBe(10);
    expect(figures[0]?.dimensions).toEqual([
      { side: 'top', label: '3 inches' },
      { side: 'right', label: '10 inches' },
    ]);
  });
});

describe('ten-frame addition reconciliation', () => {
  it('replaces a mismatched generated layout with a 2x5 array model', () => {
    const q: any = {
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
    const q: any = {
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
    const q: any = {
      text: 'Look at the dots. The number 14 is made of 1 ten and how many ones?',
      options: ['4 ones', '1 one', '10 ones', '14 ones'],
      correctAnswerIndex: 3,
      visualSpec: null as any,
      imagePrompt: 'draw dots',
    };
    applyQuestionVisualReconcilers(q);
    expect(q.visualSpec?.visualType).toBe('ten_frame');
    expect(q.visualSpec?.onesCount).toBe(4);
    expect(q.correctAnswerIndex).toBe(0);
  });
});

describe('countDisplayStyle', () => {
  it('picks up the picture-graph icon the stem names', () => {
    expect(countDisplayStyle('A picture graph shows favorite colors where each star equals 1 vote.')).toEqual({
      chartStyle: 'pictures',
      iconUnit: 1,
      iconShape: 'star',
    });
    expect(countDisplayStyle('In the pictograph, each smiley face stands for 2 students.')?.iconShape).toBe('smiley');
    expect(countDisplayStyle('In the picture graph, each apple stands for 1 vote.')?.iconShape).toBeUndefined();
  });
});

it('keeps the default icon when rows use different icons (2026-10-26 MA.1.DP.1.2 audit)', () => {
  expect(
    countDisplayStyle('A picture graph shows shapes drawn on a poster. Each picture stands for 1 shape. There are 6 star pictures and 4 circle pictures.')?.iconShape,
  ).toBeUndefined();
});
