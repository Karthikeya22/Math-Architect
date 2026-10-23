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

    // Live repro: stem says 0 to 1 with a point at 6/10; figure drew a bare 0-10 line.
    const ZERO_TO_ONE =
      'A number line from 0 to 1 is divided into 10 equal parts. A point is placed at the 6th mark from 0, representing the fraction 6/10. What decimal represents this same location?';

    it('rejects a range that differs from the one the stem states', () => {
      expect(
        validateVisualSpecAgainstQuestion(
          q(ZERO_TO_ONE, { visualType: 'number_line', min: 0, max: 10, values: [0.6] }, '0.6'),
        ),
      ).toMatch(/range/);
    });

    it('rejects a line with no marked point when the stem places one', () => {
      expect(
        validateVisualSpecAgainstQuestion(q(ZERO_TO_ONE, { visualType: 'number_line', min: 0, max: 1 }, '0.6')),
      ).toMatch(/point/);
    });

    // Audit repro: 0-8 line for "8 + 6 = ?" cannot show the jump to 14.
    it('rejects a line that stops before the numeric answer', () => {
      expect(
        validateVisualSpecAgainstQuestion(
          q('Look at the number line. A jump starts at 0 and lands on 8. A second jump moves forward 6 more units. What is 8 + 6?', {
            visualType: 'number_line', min: 0, max: 8, values: [0, 8],
          }, '14'),
        ),
      ).toMatch(/answer/);
    });

    it('passes when range and point match the stem', () => {
      expect(
        validateVisualSpecAgainstQuestion(
          q(ZERO_TO_ONE, { visualType: 'number_line', min: 0, max: 1, values: [0.6] }, '0.6'),
        ),
      ).toBeNull();
    });
  });

  describe('named model', () => {
    // Live repro: number-line stem got a 6/10 fraction bar and a "count the shaded parts" walkthrough.
    it('rejects a fraction bar when the stem is about a number line', () => {
      expect(
        validateVisualSpecAgainstQuestion(
          q(
            'A number line from 0 to 1 is divided into 10 equal parts. A point is marked at 6/10. Which decimal is it?',
            { visualType: 'fraction_bar', totalParts: 10, shadedParts: 6 },
            '0.6',
          ),
        ),
      ).toMatch(/number line/);
    });

    it('passes a ten_frame for a ten-frame stem', () => {
      expect(
        validateVisualSpecAgainstQuestion(
          q('How many dots are on the ten-frame?', { visualType: 'ten_frame', values: [1, 1, 1, 0, 0, 0, 0, 0, 0, 0] }, '3'),
        ),
      ).toBeNull();
    });
  });

  describe('mixed numbers', () => {
    it('rejects a fraction bar that shows only the fractional part of a mixed number', () => {
      expect(
        validateVisualSpecAgainstQuestion(
          q('Which decimal is equivalent to the mixed number 2 7/100?', {
            visualType: 'fraction_bar',
            totalParts: 100,
            shadedParts: 7,
          }, '2.07'),
        ),
      ).toMatch(/whole/);
    });

    it('rejects 4/10 shaded for 2.4', () => {
      expect(
        validateVisualSpecAgainstQuestion(
          q('Which fraction is equivalent to 2.4?', { visualType: 'fraction_bar', totalParts: 10, shadedParts: 4 }, '2 4/10'),
        ),
      ).toMatch(/whole/);
    });

    it('still passes a plain fraction', () => {
      expect(
        validateVisualSpecAgainstQuestion(
          q('What fraction of the bar is shaded?', { visualType: 'fraction_bar', totalParts: 10, shadedParts: 4 }, '4/10'),
        ),
      ).toBeNull();
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

  describe('geometric_shape audit repros', () => {
    // A bare outline cannot draw lines, tiles, folds or where shapes sit relative to each other.
    it.each([
      ['A rectangle has four different lines drawn on it. Which line is a line of symmetry for the rectangle?', { shapeName: 'rectangle' }],
      ['A triangle has two equal sides. A straight line is drawn from the top point straight down to the middle of the bottom edge. What does this line represent?', { shapeName: 'triangle' }],
      ['A rectangular classroom rug is covered with 1-foot square carpet tiles. There are 5 columns of square tiles. What is the area?', { shapeName: 'square' }],
      ['A toy sphere rests on top of a big wooden cube. Where is the toy sphere compared to the cube?', { shapes: ['sphere', 'cube'] }],
    ])('rejects a bare outline for: %s', (text, fields) => {
      expect(validateVisualSpecAgainstQuestion(q(text, { visualType: 'geometric_shape', ...fields }))).toMatch(/cannot draw|outline/);
    });

    it('rejects labelled figures when the stem is about overlapping tiles', () => {
      expect(
        validateVisualSpecAgainstQuestion(
          q('Jordan covers a rectangle with unit-square tiles. He places some tiles so their edges lie on top of other tiles, overlapping them. He claims the area is 16 square units. Why is he incorrect?', {
            visualType: 'geometric_shape',
            figures: [{ shape: 'rectangle', areaLabel: '16 square units' }],
          }),
        ),
      ).toMatch(/cannot draw/);
    });

    it('rejects side-by-side shapes for "rests directly on the upper face"', () => {
      expect(
        validateVisualSpecAgainstQuestion(
          q('A wooden block shaped like a cube sits on a table. A ball shaped like a sphere rests directly on the upper flat face of the cube. Which phrase describes the position of the sphere?', {
            visualType: 'geometric_shape', shapes: ['cube', 'sphere'],
          }),
        ),
      ).toMatch(/cannot draw/);
    });

    // Audit repro: "Which shape belongs in the box?" (answer: Cube) showed only a cube.
    it('rejects a single shape that is the answer to "which shape"', () => {
      expect(
        validateVisualSpecAgainstQuestion(
          q('Maya puts shapes that have only flat faces into a box. Which shape belongs in the box?', { visualType: 'geometric_shape', shapeName: 'cube' }, 'Cube'),
        ),
      ).toMatch(/answer/);
    });

    it('still passes a bare outline for a plain shape question', () => {
      expect(
        validateVisualSpecAgainstQuestion(q('Leo sorts a sphere, a cone, a cylinder, and a cube. Which shape cannot roll?', {
          visualType: 'geometric_shape', shapes: ['sphere', 'cone', 'cylinder', 'cube'],
        })),
      ).toBeNull();
    });

    it('rejects a figure missing a measurement the stem gives', () => {
      expect(
        validateVisualSpecAgainstQuestion(
          q('A triangle has side lengths of 13 inches, 14 inches, and 15 inches. The height to the 14-inch base is 12 inches. What is the area?', {
            visualType: 'geometric_shape',
            figures: [{ shape: 'triangle', dimensions: [{ side: 'left', label: '13 inches' }, { side: 'right', label: '13 inches' }] }],
          }),
        ),
      ).toMatch(/14 inches/);
    });

    it('passes when every stem measurement is labelled', () => {
      expect(
        validateVisualSpecAgainstQuestion(
          q('A triangle has a base of 12 inches and a height of 8 inches. What is the area?', {
            visualType: 'geometric_shape',
            figures: [{ shape: 'triangle', dimensions: [{ side: 'bottom', label: '12 inches' }, { side: 'height', label: '8 inches' }] }],
          }),
        ),
      ).toBeNull();
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
          q('Practice minutes by day: Day, Minutes. On Monday she practiced 20 minutes.', {
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

    it('allows standard place-value column houses as display framing', () => {
      expect(
        validateVisualSpecAgainstQuestion(
          q(
            'What is 5,803 written in expanded form?',
            {
              visualType: 'table',
              columns: ['Thousands', 'Hundreds', 'Tens', 'Ones'],
              rows: [['5', '8', '0', '3']],
            },
            '5,000 + 800 + 3',
          ),
        ),
      ).toBeNull();
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

describe('area model stems (screenshot repro)', () => {
  it('rejects a fraction strip when the stem describes an area model', () => {
    expect(
      validateVisualSpecAgainstQuestion({
        text: 'An area model is divided into 5 equal columns and 4 equal rows. Shading covers 3 of the 5 columns, and a crosshatch pattern covers 1 of the 4 rows. What fraction is covered by both?',
        options: ['3/20', '4/9', '3/9', '4/20'],
        correctAnswerIndex: 0,
        visualSpec: { visualType: 'fraction_bar', totalParts: 20, shadedParts: 3 },
      }),
    ).toMatch(/area model/);
  });
});

describe('Option 1 audit repros', () => {
  const q2 = (text: string, visualSpec: unknown, correct = 'x') => ({ text, options: [correct, 'a', 'b', 'c'], correctAnswerIndex: 0, visualSpec });

  it('accepts table headers built from the stem words', () => {
    expect(validateVisualSpecAgainstQuestion(q2(
      'A frequency table lists the number of tickets sold for four school carnival games. Ring Toss sold 36 tickets and Duck Pond sold 28 tickets. How many more?',
      { visualType: 'table', columns: ['Carnival Game', 'Tickets Sold'], rows: [['Ring Toss', '36'], ['Duck Pond', '28']] },
    ))).toBeNull();
  });

  it('still rejects an invented table header', () => {
    expect(validateVisualSpecAgainstQuestion(q2(
      'A table lists tickets sold: Ring Toss sold 36 tickets and Duck Pond sold 28 tickets. How many more?',
      { visualType: 'table', columns: ['Prizes Won', 'Tickets'], rows: [['Ring Toss', '36']] },
    ))).toMatch(/Prizes Won/);
  });

  const RIBBONS = 'A line plot shows ribbon lengths. A number line is labeled from 5 to 9. Above 5, there are 2 Xs. Above 6, there are 4 Xs. Above 7, there are 3 Xs. Above 8, there are 5 Xs. Above 9, there is 1 X. How many more ribbons are 6 or 7 inches long than 8 inches long?';

  it('rejects a line plot that plots the counts instead of the data', () => {
    expect(validateVisualSpecAgainstQuestion(q2(RIBBONS, { visualType: 'line_plot', values: [2, 4, 3, 5, 1] }, '2 ribbons'))).toMatch(/line_plot/);
  });

  it('accepts the line plot the stem describes', () => {
    const values = [5, 5, 6, 6, 6, 6, 7, 7, 7, 8, 8, 8, 8, 8, 9];
    expect(validateVisualSpecAgainstQuestion(q2(RIBBONS, { visualType: 'line_plot', min: 5, max: 9, values }, '2 ribbons'))).toBeNull();
  });

  it('accepts "N dots at V" wording', () => {
    expect(validateVisualSpecAgainstQuestion(q2(
      'A line plot shows goals scored: 2 dots at 0 goals, 3 dots at 1 goal, and 1 dot at 4 goals. What is the range?',
      { visualType: 'line_plot', min: 0, max: 4, values: [0, 0, 1, 1, 1, 4] }, '4',
    ))).toBeNull();
  });

  it('rejects a single fraction strip for a product of two fractions', () => {
    expect(validateVisualSpecAgainstQuestion(q2('What is the product of 3/4 and 2/5?', { visualType: 'fraction_bar', totalParts: 4, shadedParts: 3 }, '6/20'))).toMatch(/product/);
  });

  it('rejects a one-row place-value chart when the stem compares two numbers', () => {
    expect(validateVisualSpecAgainstQuestion(q2(
      'How does the value of the digit 5 in the number 0.05 compare to the value of the digit 5 in the number 5.0?',
      { visualType: 'table', columns: ['Ones', 'Tenths', 'Hundredths', 'Thousandths'], rows: [['0', '0', '5', '0']] },
    ))).toMatch(/both numbers/);
  });
});

describe('fraction area worded as area (live repro)', () => {
  it('rejects a single strip for the area of a 3/4 by 2/5 rectangle', () => {
    expect(
      validateVisualSpecAgainstQuestion({
        text: 'A rectangular garden bed measures 3/4 yard long and 2/5 yard wide. What is the area of the garden bed?',
        options: ['3/10 square yard', '5/9', '1/2', '3/5'],
        correctAnswerIndex: 0,
        visualSpec: { visualType: 'fraction_bar', totalParts: 4, shadedParts: 3 },
      }),
    ).toMatch(/product/);
  });
});

describe('table cells must come from the stem (audit: model junk in a cell)', () => {
  it('rejects a cell of words the stem never uses', () => {
    expect(
      validateVisualSpecAgainstQuestion({
        text: 'The function f(x) passes through the points (-2, -5), (0, -1), (2, 3). A transformation g(x) = 3f(x). What is g(2)?',
        options: ['9', '3', '6', '-15'],
        correctAnswerIndex: 0,
        visualSpec: { visualType: 'table', columns: ['x', 'f(x)'], rows: [['-2 ancient? wait no', '-5'], ['0', '-1']] },
      }),
    ).toMatch(/cell/);
  });
});

describe('figure audit round 2', () => {
  const q3 = (text: string, visualSpec: unknown, correct = 'x') => ({ text, options: [correct, 'a', 'b', 'c'], correctAnswerIndex: 0, visualSpec });

  it.each([
    ['Mia has 4 toy cars on the rug. Her brother gives her 3 more toy cars. How many toy cars does Mia have now?', { visualType: 'ten_frame', values: [1, 1, 1, 1, 0, 0, 0, 0, 0, 0] }, '7'],
    ['Leo has 5 red apples in a basket. He eats 2 of the apples. How many apples are left?', { visualType: 'ten_frame', values: [1, 1, 1, 1, 1, 0, 0, 0, 0, 0] }, '3'],
    ['There are 6 birds sitting on a fence. Then, 2 of the birds fly away. Which equation shows how many birds are left?', { visualType: 'array_model', gridRows: 1, gridCols: 6, values: [1, 1, 1, 1, 1, 1], rowColors: ['blue'] }, '6 - 2 = 4'],
  ])('rejects a one-group counting figure for a join/separate story: %s', (text, spec, ans) => {
    expect(validateVisualSpecAgainstQuestion(q3(text, spec, ans))).toMatch(/one group/);
  });

  it('still accepts a counting figure that is the whole question', () => {
    expect(validateVisualSpecAgainstQuestion(q3('How many dots are in the ten-frame?', { visualType: 'ten_frame', values: [1, 1, 1, 1, 1, 1, 1, 0, 0, 0] }, '7'))).toBeNull();
  });

  it('rejects a place-value chart on a question that is not about place value', () => {
    expect(validateVisualSpecAgainstQuestion(q3(
      'A function f(x) has a vertex at (0, 0) and passes through (1, 2) and (2, 8). What is g(1) if g(x) = f(x) + 0.5?',
      { visualType: 'table', columns: ['Ones', 'Tenths', 'Hundredths', 'Thousandths'], rows: [['0', '5', '0', '0']] }, '2.5',
    ))).toMatch(/place value/);
  });

  it('rejects a table with more than one blank header', () => {
    expect(validateVisualSpecAgainstQuestion(q3(
      'A group packs 120 granola bars and 180 juice boxes into care packages. What is the greatest number of packages?',
      { visualType: 'table', columns: ['', '', 'Granola bars'], rows: [['a', 'b', '120']] }, '60',
    ))).toMatch(/blank/);
  });
});

describe('plural shape names (audit round 2)', () => {
  it('accepts "squares" for a square', () => {
    expect(validateVisualSpecAgainstQuestion({ text: 'Maya puts 2 identical squares together. Which shape has 4 equal sides?', options: ['square', 'a', 'b', 'c'], correctAnswerIndex: 1, visualSpec: { visualType: 'geometric_shape', shapes: ['square', 'square'] } })).toBeNull();
  });
});
