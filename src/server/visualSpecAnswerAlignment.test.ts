import { describe, expect, it } from 'vitest';
import { validateVisualSpecAgainstQuestion } from './visualSpecAnswerAlignment';

const q = (text: string, visualSpec: unknown, correct = 'placeholder') => ({
  text,
  options: [correct, 'a', 'b', 'c'],
  correctAnswerIndex: 0,
  visualSpec,
});

describe('validateVisualSpecAgainstQuestion', () => {
  it('passes when visualSpec is missing', () => {
    expect(validateVisualSpecAgainstQuestion(q('foo', undefined))).toBeNull();
  });

  it('passes when visualType is unknown', () => {
    expect(
      validateVisualSpecAgainstQuestion(q('foo', { visualType: 'mystery' })),
    ).toBeNull();
  });

  describe('fraction_bar', () => {
    it('passes when stem references N/M', () => {
      expect(
        validateVisualSpecAgainstQuestion(
          q('Which bar shows 3/8 shaded?', {
            visualType: 'fraction_bar',
            totalParts: 8,
            shadedParts: 3,
          }),
        ),
      ).toBeNull();
    });

    it('passes when stem uses "N out of M"', () => {
      expect(
        validateVisualSpecAgainstQuestion(
          q('What is 5 out of 6 of the bar?', {
            visualType: 'fraction_bar',
            totalParts: 6,
            shadedParts: 5,
          }),
        ),
      ).toBeNull();
    });

    it('passes via decimal equivalence', () => {
      expect(
        validateVisualSpecAgainstQuestion(
          q('Which bar shows 0.6 shaded?', {
            visualType: 'fraction_bar',
            totalParts: 5,
            shadedParts: 3,
          }),
        ),
      ).toBeNull();
    });

    it('passes via unicode fraction in the stem', () => {
      expect(
        validateVisualSpecAgainstQuestion(
          q('Which bar shows ½ shaded?', {
            visualType: 'fraction_bar',
            totalParts: 2,
            shadedParts: 1,
          }),
        ),
      ).toBeNull();
    });

    it('rejects when stem fraction differs from spec', () => {
      const result = validateVisualSpecAgainstQuestion(
        q('Which bar shows 3/5 shaded?', {
          visualType: 'fraction_bar',
          totalParts: 5,
          shadedParts: 2,
        }),
      );
      expect(result).toMatch(/fraction_bar/);
    });

    it('uses the correct option as evidence (not distractors)', () => {
      const question = {
        text: 'Pick the matching bar.',
        options: ['shows 3/8', 'shows 5/8', 'shows 1/4', 'shows 7/8'],
        correctAnswerIndex: 0,
        visualSpec: {
          visualType: 'fraction_bar',
          totalParts: 8,
          shadedParts: 3,
        },
      };
      expect(validateVisualSpecAgainstQuestion(question)).toBeNull();
    });

    it('does not let a distractor fraction false-pass the spec', () => {
      const question = {
        text: 'Pick the matching bar.',
        options: ['shows 3/8', 'shows 5/8', 'shows 1/4', 'shows 7/8'],
        correctAnswerIndex: 0,
        visualSpec: {
          visualType: 'fraction_bar',
          totalParts: 8,
          shadedParts: 5,
        },
      };
      const result = validateVisualSpecAgainstQuestion(question);
      expect(result).toMatch(/fraction_bar/);
    });
  });

  describe('fraction_circle', () => {
    it('passes when stem references N/M', () => {
      expect(
        validateVisualSpecAgainstQuestion(
          q('Which circle shows 1/4 shaded?', {
            visualType: 'fraction_circle',
            totalParts: 4,
            shadedParts: 1,
          }),
        ),
      ).toBeNull();
    });

    it('rejects when shaded count differs', () => {
      const result = validateVisualSpecAgainstQuestion(
        q('Which circle shows 1/4 shaded?', {
          visualType: 'fraction_circle',
          totalParts: 4,
          shadedParts: 3,
        }),
      );
      expect(result).toMatch(/fraction_circle/);
    });
  });

  describe('ten_frame', () => {
    it('passes when filled count appears in stem', () => {
      expect(
        validateVisualSpecAgainstQuestion(
          q('How many counters are shown? There are 7.', {
            visualType: 'ten_frame',
            values: [1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
          }),
        ),
      ).toBeNull();
    });

    it('passes when filled count appears only in correct option', () => {
      const question = {
        text: 'How many counters are shown?',
        options: ['7', '4', '8', '3'],
        correctAnswerIndex: 0,
        visualSpec: {
          visualType: 'ten_frame',
          values: [1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
        },
      };
      expect(validateVisualSpecAgainstQuestion(question)).toBeNull();
    });

    it('rejects when count appears in distractor only', () => {
      const question = {
        text: 'How many counters are shown?',
        options: ['10', '4', '8', '3'],
        correctAnswerIndex: 0,
        visualSpec: {
          visualType: 'ten_frame',
          values: [1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
        },
      };
      const result = validateVisualSpecAgainstQuestion(question);
      expect(result).toMatch(/ten_frame/);
    });
  });

  describe('number_line', () => {
    it('passes when each marked value appears in stem', () => {
      expect(
        validateVisualSpecAgainstQuestion(
          q('Mark 3 and 7 on the number line.', {
            visualType: 'number_line',
            min: 0,
            max: 10,
            values: [3, 7],
          }),
        ),
      ).toBeNull();
    });

    it('rejects when a marked value is unrelated to the stem', () => {
      const result = validateVisualSpecAgainstQuestion(
        q('Mark 3 and 7 on the number line.', {
          visualType: 'number_line',
          min: 0,
          max: 10,
          values: [3, 9],
        }),
      );
      expect(result).toMatch(/number_line value 9/);
    });
  });

  describe('array_model', () => {
    it('passes when both dimensions appear in stem', () => {
      expect(
        validateVisualSpecAgainstQuestion(
          q('Show a 3 by 4 array of stars.', {
            visualType: 'array_model',
            gridRows: 3,
            gridCols: 4,
          }),
        ),
      ).toBeNull();
    });

    it('passes when product appears in stem', () => {
      expect(
        validateVisualSpecAgainstQuestion(
          q('Use 12 counters to model the product.', {
            visualType: 'array_model',
            gridRows: 3,
            gridCols: 4,
          }),
        ),
      ).toBeNull();
    });

    it('rejects when neither dimension nor product appears', () => {
      const result = validateVisualSpecAgainstQuestion(
        q('Use the array to model.', {
          visualType: 'array_model',
          gridRows: 3,
          gridCols: 4,
        }),
      );
      expect(result).toMatch(/array_model/);
    });
  });

  describe('area_model', () => {
    it('passes when row/col labels appear in stem', () => {
      expect(
        validateVisualSpecAgainstQuestion(
          q('Use the area model to find 23 × 47. Decompose 23 as 20 and 3, and 47 as 40 and 7.', {
            visualType: 'area_model',
            gridRows: 2,
            gridCols: 2,
            rowLabels: ['20', '3'],
            colLabels: ['40', '7'],
          }),
        ),
      ).toBeNull();
    });

    it('rejects when a label is missing from stem/correct option', () => {
      const result = validateVisualSpecAgainstQuestion(
        q('Use the area model to find 23 × 47.', {
          visualType: 'area_model',
          gridRows: 2,
          gridCols: 2,
          rowLabels: ['20', '5'],
          colLabels: ['40', '7'],
        }),
      );
      expect(result).toMatch(/area_model/);
    });
  });

  describe('coordinate_plane', () => {
    it('passes when point pair appears in stem', () => {
      expect(
        validateVisualSpecAgainstQuestion(
          q('Plot the point (2, 3).', {
            visualType: 'coordinate_plane',
            xMin: -5,
            xMax: 5,
            yMin: -5,
            yMax: 5,
            points: [{ x: 2, y: 3 }],
          }),
        ),
      ).toBeNull();
    });

    it('passes when both coordinates appear separately in stem', () => {
      expect(
        validateVisualSpecAgainstQuestion(
          q('The point has x = 2 and y = 3.', {
            visualType: 'coordinate_plane',
            xMin: -5,
            xMax: 5,
            yMin: -5,
            yMax: 5,
            points: [{ x: 2, y: 3 }],
          }),
        ),
      ).toBeNull();
    });

    it('rejects when a plotted point is unrelated', () => {
      const result = validateVisualSpecAgainstQuestion(
        q('Plot the point (2, 3).', {
          visualType: 'coordinate_plane',
          xMin: -5,
          xMax: 5,
          yMin: -5,
          yMax: 5,
          points: [{ x: 2, y: 3 }, { x: -4, y: -4 }],
        }),
      );
      expect(result).toMatch(/coordinate_plane/);
    });
  });

  describe('geometric_shape', () => {
    it('passes when shape name appears in stem', () => {
      expect(
        validateVisualSpecAgainstQuestion(
          q('A triangle has three equal sides.', {
            visualType: 'geometric_shape',
            shapeName: 'triangle',
          }),
        ),
      ).toBeNull();
    });

    it('passes when "right triangle" two-word form appears', () => {
      expect(
        validateVisualSpecAgainstQuestion(
          q('A right triangle has one 90 degree angle.', {
            visualType: 'geometric_shape',
            shapeName: 'right_triangle',
          }),
        ),
      ).toBeNull();
    });

    it('rejects when shape name is absent', () => {
      const result = validateVisualSpecAgainstQuestion(
        q('Pick the figure with three sides.', {
          visualType: 'geometric_shape',
          shapeName: 'triangle',
        }),
      );
      expect(result).toMatch(/geometric_shape/);
    });

    it('passes when each compared shape appears in the stem', () => {
      expect(
        validateVisualSpecAgainstQuestion(
          q('Look at the triangle and the square. How are they alike?', {
            visualType: 'geometric_shape',
            shapes: ['triangle', 'square'],
          }),
        ),
      ).toBeNull();
    });
  });

  describe('bar_model', () => {
    it('passes when each labeled segment appears in stem', () => {
      expect(
        validateVisualSpecAgainstQuestion(
          q('Sam has 12 marbles and gets 12 more.', {
            visualType: 'bar_model',
            segmentLabels: ['12', '12', '?'],
          }),
        ),
      ).toBeNull();
    });

    it('rejects when a segment label is unrelated', () => {
      const result = validateVisualSpecAgainstQuestion(
        q('Sam has 12 marbles and gets 12 more.', {
          visualType: 'bar_model',
          segmentLabels: ['12', '15', '?'],
        }),
      );
      expect(result).toMatch(/bar_model/);
    });
  });

  describe('clock_face', () => {
    it('passes when H:MM appears in stem', () => {
      expect(
        validateVisualSpecAgainstQuestion(
          q('What time does the clock show? 3:15', {
            visualType: 'clock_face',
            hour: 3,
            minute: 15,
          }),
        ),
      ).toBeNull();
    });

    it("passes when the stem says \"o'clock\" and minute is 0", () => {
      expect(
        validateVisualSpecAgainstQuestion(
          q("The clock shows 4 o'clock.", {
            visualType: 'clock_face',
            hour: 4,
            minute: 0,
          }),
        ),
      ).toBeNull();
    });

    it('rejects when stem time differs', () => {
      const result = validateVisualSpecAgainstQuestion(
        q('What time does the clock show? 3:15', {
          visualType: 'clock_face',
          hour: 3,
          minute: 30,
        }),
      );
      expect(result).toMatch(/clock_face/);
    });
  });

  describe('bar_chart', () => {
    it('passes when categories appear in stem', () => {
      expect(
        validateVisualSpecAgainstQuestion(
          q('Pets owned: dogs 4, cats 2, fish 3.', {
            visualType: 'bar_chart',
            categories: ['dogs', 'cats', 'fish'],
            values: [4, 2, 3],
            xLabel: 'pet',
            yLabel: 'count',
          }),
        ),
      ).toBeNull();
    });

    it('rejects when a category is unrelated', () => {
      const result = validateVisualSpecAgainstQuestion(
        q('Pets owned: dogs 4, cats 2, fish 3.', {
          visualType: 'bar_chart',
          categories: ['dogs', 'cats', 'rabbits'],
          values: [4, 2, 3],
          xLabel: 'pet',
          yLabel: 'count',
        }),
      );
      expect(result).toMatch(/bar_chart/);
    });
  });

  describe('table', () => {
    it('passes when each column header appears in stem', () => {
      expect(
        validateVisualSpecAgainstQuestion(
          q('Practice minutes by day: Day, Minutes.', {
            visualType: 'table',
            columns: ['Day', 'Minutes'],
            rows: [['Monday', '20']],
          }),
        ),
      ).toBeNull();
    });

    it('rejects when a column header is unrelated', () => {
      const result = validateVisualSpecAgainstQuestion(
        q('Practice minutes by day.', {
          visualType: 'table',
          columns: ['Year', 'Profit'],
          rows: [['2024', '20']],
        }),
      );
      expect(result).toMatch(/table/);
    });
  });

  describe('line_plot', () => {
    it('passes when xLabel appears and at least one value', () => {
      expect(
        validateVisualSpecAgainstQuestion(
          q('Books read: 2 students read 5 books.', {
            visualType: 'line_plot',
            xLabel: 'books',
            values: [5, 5, 5],
          }),
        ),
      ).toBeNull();
    });

    it('rejects when xLabel is unrelated', () => {
      const result = validateVisualSpecAgainstQuestion(
        q('Books read.', {
          visualType: 'line_plot',
          xLabel: 'temperature',
          values: [5],
        }),
      );
      expect(result).toMatch(/line_plot/);
    });
  });
});
