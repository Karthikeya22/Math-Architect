import { describe, expect, it } from 'vitest';
import type { Question } from '../types';
import { buildGeoGebraCommandsFromQuestion } from './buildGeoGebraCommandsFromQuestion';

const baseQuestion = (overrides: Partial<Question>): Question =>
  ({
    id: 'q1',
    text: 'Sample',
    options: ['A', 'B', 'C', 'D'],
    correctAnswerIndex: 0,
    explanation: '',
    animationDescription: '',
    difficulty: 'Medium',
    ...overrides,
  }) as Question;

describe('buildGeoGebraCommandsFromQuestion', () => {
  it('routes number_line specs', () => {
    const cmds = buildGeoGebraCommandsFromQuestion(
      baseQuestion({
        text: 'Which point is at 2?',
        visualSpec: { visualType: 'number_line', min: 0, max: 10, values: [2] },
      }),
    );
    expect(cmds?.some((c) => c.includes('axis = Segment'))).toBe(true);
  });

  it('shows fraction label only when fraction is given in stem', () => {
    const withLabel = buildGeoGebraCommandsFromQuestion(
      baseQuestion({
        text: 'What fraction is shaded?',
        options: ['1/4', '2/4', '3/4', '4/4'],
        correctAnswerIndex: 2,
        visualSpec: { visualType: 'fraction_bar', totalParts: 4, shadedParts: 3 },
      }),
    );
    expect(withLabel?.some((c) => c.includes('3/4'))).toBe(true);

    const withoutLabel = buildGeoGebraCommandsFromQuestion(
      baseQuestion({
        text: 'How many parts are shaded?',
        options: ['2', '3', '4', '5'],
        correctAnswerIndex: 1,
        visualSpec: { visualType: 'fraction_bar', totalParts: 4, shadedParts: 3 },
      }),
    );
    expect(withoutLabel?.some((c) => c.includes('fracLbl'))).toBe(false);
  });

  it('routes coordinate_plane function prompts', () => {
    const cmds = buildGeoGebraCommandsFromQuestion(
      baseQuestion({
        visualSpec: {
          visualType: 'coordinate_plane',
          prompt: 'f(x) = x^2',
          xMin: -5,
          xMax: 5,
          yMin: -2,
          yMax: 10,
        },
      }),
    );
    expect(cmds?.some((c) => c.includes('f(x)'))).toBe(true);
  });

  it('routes coordinate_plane polygon points', () => {
    const cmds = buildGeoGebraCommandsFromQuestion(
      baseQuestion({
        visualSpec: {
          visualType: 'coordinate_plane',
          xMin: -5,
          xMax: 2,
          yMin: -6,
          yMax: 2,
          points: [
            { x: -3, y: -1, label: 'J' },
            { x: -1, y: -1, label: 'K' },
            { x: -1, y: -4, label: 'L' },
            { x: -3, y: -4, label: 'M' },
          ],
        },
      }),
    );
    expect(cmds?.some((c) => c.includes('Polygon'))).toBe(true);
    expect(cmds?.some((c) => c.includes('P0'))).toBe(true);
  });

  it('routes array_model exact counts', () => {
    const cmds = buildGeoGebraCommandsFromQuestion(
      baseQuestion({
        visualSpec: {
          visualType: 'array_model',
          gridRows: 1,
          gridCols: 5,
          values: [1, 1, 1, 1, 1],
          rowColors: ['blue'],
        },
      }),
    );
    expect(cmds?.some((c) => c.includes('cell0'))).toBe(true);
  });

  it('returns null for unsupported visual types', () => {
    expect(
      buildGeoGebraCommandsFromQuestion(
        baseQuestion({ visualSpec: { visualType: 'ten_frame', values: Array(10).fill(0) } }),
      ),
    ).toBeNull();
  });
});
