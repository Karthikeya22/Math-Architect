import { describe, expect, it } from 'vitest';
import { buildStudentSolutionWalkthrough } from './buildStudentSolutionWalkthrough';
import type { Question } from '../types';

const baseQuestion = (overrides: Partial<Question>): Question => ({
  id: 'q1',
  text: 'How many dots in all?',
  options: ['8', '9', '10', '7'],
  correctAnswerIndex: 1,
  explanation: 'If you have 4 dots and add 5 more, you have 9 dots in total.',
  animationDescription: 'none',
  difficulty: 'Easy',
  ...overrides,
});

describe('buildStudentSolutionWalkthrough', () => {
  it('builds array_model addition steps for two colored rows', () => {
    const question = baseQuestion({
      text: 'How many dots are there in all on the ten-frame?',
      visualSpec: {
        visualType: 'array_model',
        gridRows: 2,
        gridCols: 5,
        rowColors: ['red', 'blue'],
        values: [1, 1, 1, 1, 0, 1, 1, 1, 1, 1],
      },
    });
    const steps = buildStudentSolutionWalkthrough(question);
    expect(steps.length).toBeGreaterThanOrEqual(3);
    expect(steps[0].title).toMatch(/red/i);
    expect(steps[0].body).toMatch(/4/);
    expect(steps[1].body).toMatch(/5/);
    expect(steps[2].body).toMatch(/9/);
    expect(steps[0].visualSpec?.values?.filter((v) => v >= 1).length).toBe(4);
  });

  it('prefers deterministic walkthrough over AI solutionSteps when visualSpec is trusted', () => {
    const question = baseQuestion({
      text: 'Sam has 3 red apples and 4 green apples. How many apples does Sam have in all?',
      solutionSteps: [
        { title: 'Use the number line', body: 'Start at 8 on the number line.' },
        { title: 'Jump back', body: 'Move backward.' },
      ],
      visualSpec: {
        visualType: 'array_model',
        gridRows: 2,
        gridCols: 4,
        rowColors: ['red', 'green'],
        values: [1, 1, 1, 0, 1, 1, 1, 1],
      },
    });
    const steps = buildStudentSolutionWalkthrough(question);
    expect(steps[0].title).toMatch(/red/i);
    expect(steps[0].visualSpec).toBeTruthy();
    expect(steps.some((s) => s.body.includes('9'))).toBe(true);
  });

  it('uses AI solutionSteps when no deterministic visual walkthrough applies', () => {
    const question = baseQuestion({
      solutionSteps: [
        { title: 'Step A', body: 'First.' },
        { title: 'Step B', body: 'Second.' },
      ],
    });
    const steps = buildStudentSolutionWalkthrough(question);
    expect(steps).toHaveLength(2);
    expect(steps[0].title).toBe('Step A');
  });

  it('builds ten_frame steps from filled cells', () => {
    const question = baseQuestion({
      text: 'How many dots are in the ten-frame?',
      visualSpec: {
        visualType: 'ten_frame',
        values: [1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
      },
    });
    const steps = buildStudentSolutionWalkthrough(question);
    expect(steps.length).toBeGreaterThanOrEqual(2);
    expect(steps.some((s) => s.body.includes('7'))).toBe(true);
  });

  it('falls back to explanation sentences', () => {
    const question = baseQuestion({
      explanation: 'Count the red row. Add the blue row. The total is nine.',
      visualSpec: undefined,
    });
    const steps = buildStudentSolutionWalkthrough(question);
    expect(steps.length).toBeGreaterThanOrEqual(2);
  });
});
