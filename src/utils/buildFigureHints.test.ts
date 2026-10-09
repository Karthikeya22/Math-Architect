import { describe, expect, it } from 'vitest';
import {
  buildFigureHints,
  figureHintPanelTitle,
  normalizeFigureHints,
  resolveFigureHintsForQuestion,
  sanitizeFigureHints,
} from './buildFigureHints';

describe('buildFigureHints', () => {
  it('builds K compare-length hints without leaking counts', () => {
    const hints = buildFigureHints(
      {
        text: 'Which pile has more blocks?',
        options: ['Red pile', 'Blue pile', 'They are the same', 'Neither'],
        correctAnswerIndex: 0,
        visualSpec: {
          visualType: 'array_model',
          gridRows: 2,
          values: [1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
          rowColors: ['red', 'blue'],
        },
      },
      'K',
    );
    expect(hints.length).toBeGreaterThan(0);
    expect(hints.length).toBeLessThanOrEqual(3);
    expect(hints.join(' ').toLowerCase()).toMatch(/red/);
    expect(hints.join(' ').toLowerCase()).toMatch(/blue/);
    expect(hints.join(' ')).not.toMatch(/\b5\b/);
    expect(hints.join(' ')).not.toMatch(/\b3\b/);
    expect(hints.join(' ').toLowerCase()).not.toMatch(/red pile/);
  });

  it('builds teen ten-frame hints without stating the teen total', () => {
    const hints = buildFigureHints(
      {
        text: 'How many dots are shown?',
        options: ['12', '13', '14', '15'],
        correctAnswerIndex: 1,
        visualSpec: {
          visualType: 'ten_frame',
          values: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
          onesCount: 3,
        },
      },
      'Grade 1',
    );
    expect(hints.length).toBeGreaterThan(0);
    expect(hints.join(' ')).not.toMatch(/\b13\b/);
  });

  it('builds fraction hints without naming the correct option', () => {
    const hints = buildFigureHints(
      {
        text: 'Which bar shows 3/5 shaded?',
        options: ['3/5', '2/5', '1/5', '4/5'],
        correctAnswerIndex: 0,
        visualSpec: {
          visualType: 'fraction_bar',
          totalParts: 5,
          shadedParts: 3,
        },
      },
      '4',
    );
    expect(hints.length).toBeGreaterThan(0);
    expect(hints.join(' ')).not.toMatch(/3\/5/);
    expect(hints.join(' ')).not.toMatch(/\b3\b/);
    expect(hints.join(' ')).not.toMatch(/\b5\b/);
  });

  it('prefers sanitized figureHints when present', () => {
    const hints = resolveFigureHintsForQuestion(
      {
        figureHints: ['  Read each row. ', 'Match dots one to one. '],
        text: 'Which has more?',
        options: ['A', 'B', 'C', 'D'],
        correctAnswerIndex: 0,
        visualSpec: { visualType: 'array_model', rowColors: ['red', 'blue'] },
      },
      'K',
    );
    expect(hints).toEqual(['Read each row.', 'Match dots one to one.']);
  });

  it('strips hints that echo the correct option', () => {
    const hints = sanitizeFigureHints(
      ['Pick Red pile because it has more.', 'Match the rows.'],
      {
        options: ['Red pile', 'Blue pile', 'Same', 'Neither'],
        correctAnswerIndex: 0,
        visualSpec: { visualType: 'array_model', values: [1, 1, 1] },
      },
    );
    expect(hints).toEqual(['Match the rows.']);
  });

  it('normalizes hint count and whitespace', () => {
    expect(normalizeFigureHints(['  one  ', '', 'two', 'three', 'four'])).toEqual(['one', 'two', 'three']);
  });

  it('uses shorter panel title for early grades', () => {
    expect(figureHintPanelTitle('Kindergarten')).toBe('Hints');
    expect(figureHintPanelTitle('Grade 5')).toBe('How to use this picture');
  });
});
