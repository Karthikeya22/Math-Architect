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

/** A published figure; figure-based steps are only allowed when one is on screen. */
const SHOWN: Partial<Question> = { visual: '<svg viewBox="0 0 10 10"></svg>', figureStatus: 'verified' };

const AI_STEPS = [
  { title: 'Split the number', body: '2 7/100 is 2 wholes and 7 hundredths.' },
  { title: 'Write the decimal', body: '7 hundredths is 0.07, so 2 7/100 = 2.07.' },
];

describe('buildStudentSolutionWalkthrough', () => {
  it('builds array_model addition steps for two colored rows', () => {
    const question = baseQuestion({
      ...SHOWN,
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
      ...SHOWN,
      text: 'Sam has 3 red apples and 4 green apples. How many apples does Sam have in all?',
      correctAnswerIndex: 3,
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
    expect(steps.some((s) => s.body.includes('7'))).toBe(true);
  });

  it('does not turn a unit-conversion problem into dot addition', () => {
    const question = baseQuestion({
      text: 'A juice punch recipe requires 2 gallons of fruit juice. Leo has 5 containers of juice, and each container holds 3 quarts. How many quarts of juice will Leo have left over after making the punch?',
      options: ['7 quarts', '8 quarts', '9 quarts', '15 quarts'],
      correctAnswerIndex: 0,
      explanation:
        'Leo has 5 × 3 = 15 quarts. The recipe needs 2 gallons = 8 quarts. 15 − 8 = 7 quarts left.',
      visualSpec: {
        visualType: 'array_model',
        gridRows: 2,
        gridCols: 5,
        rowColors: ['red', 'blue'],
        values: [1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
      },
    });
    const steps = buildStudentSolutionWalkthrough(question);
    const body = steps.map((step) => `${step.title} ${step.body}`).join(' ');
    expect(body).not.toMatch(/5 \+ 3 = 8/);
    expect(body).not.toMatch(/8 is 7 quarts/);
    expect(body).toMatch(/15/);
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
      ...SHOWN,
      text: 'How many dots are in the ten-frame?',
      correctAnswerIndex: 3,
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

  // Live repros (MA.4.FR.1.2): figure/explanation described a different problem.
  const MIXED = {
    text: 'Which decimal is equivalent to the mixed number 2 7/100?',
    options: ['2.7', '2.07', '0.27', '2.70'],
    correctAnswerIndex: 1,
    explanation: '2 7/100 means 2 wholes and 7 hundredths. 7 hundredths is 0.07, so the decimal is 2.07.',
    visualSpec: { visualType: 'fraction_bar' as const, totalParts: 100, shadedParts: 7 },
  };

  it('never describes a shaded shape when no figure was published', () => {
    const steps = buildStudentSolutionWalkthrough(baseQuestion({ ...MIXED, figureStatus: 'needs_review', visual: '' }));
    const body = steps.map((s) => `${s.title} ${s.body}`).join(' ');
    expect(body).not.toMatch(/shaded|shape is split/i);
    expect(steps.every((s) => !s.visualSpec)).toBe(true);
    expect(body).toMatch(/2\.07/);
  });

  it('does not explain 2 7/100 as "7 out of 100 parts" even with a figure shown', () => {
    const steps = buildStudentSolutionWalkthrough(baseQuestion({ ...MIXED, ...SHOWN, solutionSteps: AI_STEPS }));
    expect(steps.map((s) => s.body).join(' ')).not.toMatch(/matches 7 out of 100/);
    expect(steps[0].title).toBe('Split the number');
  });

  it('keeps the fraction script when the shaded fraction is the answer', () => {
    const steps = buildStudentSolutionWalkthrough(
      baseQuestion({
        ...SHOWN,
        text: 'What fraction of the bar is shaded?',
        options: ['3/8', '5/8', '3/5', '8/3'],
        correctAnswerIndex: 0,
        visualSpec: { visualType: 'fraction_bar', totalParts: 8, shadedParts: 3 },
      }),
    );
    expect(steps[1].title).toBe('Count the shaded parts');
  });

  it('does not use the reasoning-free number-line script', () => {
    const steps = buildStudentSolutionWalkthrough(
      baseQuestion({
        ...SHOWN,
        text: 'A number line from 0 to 1 is divided into 10 equal parts. A point is at the 6th mark. What decimal is it?',
        options: ['0.06', '0.6', '6.0', '0.16'],
        correctAnswerIndex: 1,
        solutionSteps: [
          { title: 'Find each part', body: 'Each of the 10 parts is 1/10, or 0.1.' },
          { title: 'Count to the point', body: '6 parts is 6/10, which is 0.6.' },
        ],
        visualSpec: { visualType: 'number_line', min: 0, max: 1, values: [0.6] },
      }),
    );
    expect(steps.map((s) => s.body).join(' ')).not.toMatch(/runs from/);
    expect(steps[0].title).toBe('Find each part');
  });

  it('uses reasoning steps over the read-the-chart script for a place-value table', () => {
    const steps = buildStudentSolutionWalkthrough(
      baseQuestion({
        ...SHOWN,
        text: 'In the number 8.381, how does the value of the 8 in the ones place compare to the value of the 8 in the hundredths place?',
        options: ['10 times', '1/10', '100 times', '1/100'],
        correctAnswerIndex: 2,
        solutionSteps: [
          { title: 'Find each value', body: 'The 8 in the ones place is 8. The 8 in the hundredths place is 0.08.' },
          { title: 'Compare', body: 'The ones place is two places left of the hundredths place, so it is 10 x 10 = 100 times the value.' },
        ],
        visualSpec: { visualType: 'table', columns: ['Ones', 'Tenths', 'Hundredths', 'Thousandths'], rows: [['8', '3', '8', '1']] },
      }),
    );
    expect(steps[0].title).toBe('Find each value');
    expect(steps.map((s) => s.body).join(' ')).not.toMatch(/Put the digits together/);
  });

  it.each([
    ['How is the fraction 7/2 written in numeral-word form?', '7 halves', { visualType: 'ten_frame', values: [1, 1, 1, 1, 1, 1, 1, 0, 0, 0] }],
    ['A line plot shows 3 ribbons that are 4 inches. How many more ribbons are 5 inches?', '2 ribbons', { visualType: 'array_model', gridRows: 1, gridCols: 3, values: [1, 1, 1], rowColors: ['blue'] }],
  ])('does not run a counting script whose count is not the answer: %s', (text, answer, visualSpec) => {
    const steps = buildStudentSolutionWalkthrough(
      baseQuestion({ ...SHOWN, text, options: [answer, 'x', 'y', 'z'], correctAnswerIndex: 0, explanation: 'Reason about the question. Then choose.', visualSpec: visualSpec as never }),
    );
    expect(steps.map((s) => s.body).join(' ')).not.toMatch(/dots|Count each object/);
  });

  it('drops AI step figures when no figure was published', () => {
    const steps = buildStudentSolutionWalkthrough(
      baseQuestion({
        solutionSteps: AI_STEPS.map((s) => ({ ...s, visualSpec: { visualType: 'fraction_bar', totalParts: 100, shadedParts: 7 } })),
      }),
    );
    expect(steps.every((s) => !s.visualSpec)).toBe(true);
  });
});

describe('fallback steps without a figure (audit)', () => {
  it('drops sentences that point at a picture that is not shown', () => {
    const steps = buildStudentSolutionWalkthrough(
      baseQuestion({
        text: 'You want to solve 11 - 7 = ___. You can think 7 + ___ = 11.',
        options: ['4', '3', '5', '18'],
        correctAnswerIndex: 0,
        explanation: 'Look at the number line shown. Start at 7 and count up to 11. That is 4 jumps, so 11 - 7 = 4.',
        figureStatus: 'needs_review',
        visual: '',
      }),
    );
    const text = steps.map((s) => s.body).join(' ');
    expect(text).not.toMatch(/look at the|shown/i);
    expect(text).toMatch(/count up to 11/);
  });
});
