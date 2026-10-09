import { describe, expect, it } from 'vitest';
import { renderPreparedDeterministicVisual } from './prepareQuestionVisual';

describe('renderPreparedDeterministicVisual', () => {
  it('renders compared geometric figures after stem reconciliation', () => {
    const question = {
      text: 'Look at the triangle and the square. How are they alike?',
      options: ['Both have 3 sides', 'Both have 4 sides', 'Both are circles', 'Both are red'],
      correctAnswerIndex: 0,
      visualSpec: null as { visualType: string; shapes?: string[] } | null,
    };
    const svg = renderPreparedDeterministicVisual(question);
    expect(svg).toContain('<polygon');
    expect((svg?.match(/<polygon/g) || []).length).toBe(2);
    expect(question.visualSpec?.shapes).toEqual(['triangle', 'square']);
  });

  it('normalizes hyphenated visual types before rendering', () => {
    const question = {
      text: 'Which bar shows 3/8 shaded?',
      options: ['3/8', '2/8', '1/8', '4/8'],
      correctAnswerIndex: 0,
      visualSpec: {
        visualType: 'fraction-bar',
        totalParts: 8,
        shadedParts: 3,
      },
    };
    const svg = renderPreparedDeterministicVisual(question);
    expect(svg).toContain('<svg');
    expect(question.visualSpec?.visualType).toBe('fraction_bar');
  });
});
