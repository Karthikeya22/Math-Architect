import { describe, expect, it } from 'vitest';
import { STANDARD_VISUAL_POLICY_OVERRIDES } from '../utils/standardVisualPreferences';
import { sanitizeQuizPayloadVisuals } from './quizPayloadSanitizer';

const baseQuestion = (overrides: Record<string, unknown>) => ({
  text: 'Which is greater, 7 or 9?',
  options: ['7', '9', '8', '10'],
  correctAnswerIndex: 1,
  ...overrides,
});

describe('sanitizeQuizPayloadVisuals', () => {
  it('returns no warnings for an empty payload', () => {
    expect(sanitizeQuizPayloadVisuals({}).warnings).toEqual([]);
    expect(sanitizeQuizPayloadVisuals(null).warnings).toEqual([]);
    expect(sanitizeQuizPayloadVisuals({ questions: [] }).warnings).toEqual([]);
  });

  it('repairs short ten_frame values before validation', () => {
    const payload = {
      standardCode: 'MA.K.NSO.1.1',
      questions: [
        baseQuestion({
          text: 'There are 3 dots in the ten frame. How many more dots are needed to make 10?',
          options: ['7', '8', '9', '10'],
          correctAnswerIndex: 0,
          visualSpec: { visualType: 'ten_frame', values: [1, 2, 3] },
        }),
      ],
    };
    const { warnings } = sanitizeQuizPayloadVisuals(payload);
    expect(warnings).toEqual([]);
    const vs = (payload.questions[0] as { visualSpec?: { values?: number[] } }).visualSpec;
    expect(vs?.values?.length).toBe(10);
    expect(vs?.values?.filter((value) => value >= 1).length).toBe(3);
  });

  it('repairs a misaligned fraction visualSpec from the stem', () => {
    const payload = {
      standardCode: 'MA.4.FR.2.1',
      questions: [
        baseQuestion({
          text: 'Which bar shows 3/5 shaded?',
          options: ['3/5', '2/5', '1/5', '4/5'],
          correctAnswerIndex: 0,
          visualSpec: { visualType: 'fraction_bar', totalParts: 5, shadedParts: 2 },
        }),
      ],
    };
    const { warnings } = sanitizeQuizPayloadVisuals(payload);
    expect(warnings).toEqual([]);
    const vs = (payload.questions[0] as { visualSpec?: { totalParts?: number; shadedParts?: number } }).visualSpec;
    expect(vs?.totalParts).toBe(5);
    expect(vs?.shadedParts).toBe(3);
  });

  it('strips imagePrompt when a standard override forbids Gemini fallback', () => {
    STANDARD_VISUAL_POLICY_OVERRIDES['MA.4.FR.2.1'] = {
      preferredTypes: ['fraction_bar'],
      forbidGeminiFallback: true,
    };
    const payload = {
      standardCode: 'MA.4.FR.2.1',
      questions: [
        baseQuestion({
          imagePrompt: 'Draw 3/5 shaded bar.',
          visualIntent: 'See the bar.',
        }),
      ],
    };
    const { warnings } = sanitizeQuizPayloadVisuals(payload);
    expect(warnings.length).toBe(1);
    expect(warnings[0]).toMatch(/Policy: imagePrompt forbidden/);
    expect((payload.questions[0] as Record<string, unknown>).imagePrompt).toBe('');
    delete STANDARD_VISUAL_POLICY_OVERRIDES['MA.4.FR.2.1'];
  });

  it('strips disallowed visualType per standard policy', () => {
    const payload = {
      standardCode: 'MA.5.GR.1.1',
      questions: [
        baseQuestion({
          text: 'Which clock shows 3:15?',
          options: ['A', 'B', 'C', 'D'],
          correctAnswerIndex: 0,
          visualSpec: { visualType: 'clock_face', hour: 3, minute: 15 },
        }),
      ],
    };
    const { warnings } = sanitizeQuizPayloadVisuals(payload);
    expect(warnings.some((w) => /Policy: visualType "clock_face" not allowed/.test(w))).toBe(true);
    expect((payload.questions[0] as Record<string, unknown>).visualSpec).toBeUndefined();
  });

  it('keeps a valid deterministic visualSpec untouched', () => {
    const payload = {
      standardCode: 'MA.4.FR.2.1',
      questions: [
        baseQuestion({
          text: 'Which bar shows 3/8 shaded?',
          options: ['3/8', '2/8', '1/8', '4/8'],
          correctAnswerIndex: 0,
          visualSpec: { visualType: 'fraction_bar', totalParts: 8, shadedParts: 3 },
        }),
      ],
    };
    const { warnings } = sanitizeQuizPayloadVisuals(payload);
    expect(warnings).toEqual([]);
    expect((payload.questions[0] as Record<string, unknown>).visualSpec).toBeDefined();
  });

  it('handles multiple questions and tags warnings per index', () => {
    const payload = {
      standardCode: 'MA.4.FR.2.1',
      questions: [
        baseQuestion({
          text: 'Which bar shows 3/5 shaded?',
          options: ['3/5', '2/5', '1/5', '4/5'],
          correctAnswerIndex: 0,
          visualSpec: { visualType: 'fraction_bar', totalParts: 5, shadedParts: 2 },
        }),
        baseQuestion({
          text: 'Which bar shows 1/4 shaded?',
          options: ['1/4', '2/4', '3/4', '4/4'],
          correctAnswerIndex: 0,
          visualSpec: { visualType: 'fraction_bar', totalParts: 4, shadedParts: 1 },
        }),
        baseQuestion({
          imagePrompt: 'Draw a fraction.',
          visualIntent: '',
        }),
      ],
    };
    const { warnings } = sanitizeQuizPayloadVisuals(payload);
    expect(warnings.some((w) => w.startsWith('Q1:'))).toBe(false);
    expect(warnings.every((w) => !w.startsWith('Q2:'))).toBe(true);
    expect(warnings.some((w) => w.startsWith('Q3:'))).toBe(true);
  });

  it('sanitizes leaking figureHints and falls back to safe templates', () => {
    const payload = {
      standardCode: 'MA.K.DP.1.1',
      questions: [
        baseQuestion({
          text: 'Which pile has more blocks?',
          options: ['Red pile', 'Blue pile', 'They are the same', 'Neither'],
          correctAnswerIndex: 0,
          figureHints: ['Pick Red pile.', 'There are 5 red blocks.'],
          visualSpec: {
            visualType: 'array_model',
            gridRows: 2,
            values: [1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
            rowColors: ['red', 'blue'],
          },
          visual: '<svg></svg>',
        }),
      ],
    };
    sanitizeQuizPayloadVisuals(payload);
    const hints = (payload.questions[0] as { figureHints?: string[] }).figureHints;
    expect(hints?.length).toBeGreaterThan(0);
    expect(hints?.join(' ').toLowerCase()).not.toMatch(/red pile/);
    expect(hints?.join(' ')).not.toMatch(/\b5\b/);
  });

  it('strips imagePrompt that lacks visualIntent', () => {
    const payload = {
      standardCode: 'MA.K.AR.1.1',
      questions: [baseQuestion({ imagePrompt: 'Draw something.' })],
    };
    const { warnings } = sanitizeQuizPayloadVisuals(payload);
    expect(warnings.length).toBe(1);
    expect(warnings[0]).toMatch(/visualIntent/);
    expect((payload.questions[0] as Record<string, unknown>).imagePrompt).toBe('');
  });

  it('allows ten_frame for MA.K.AR.1.1 (K–2 AR policy includes ten_frame)', () => {
    const payload = {
      standardCode: 'MA.K.AR.1.1',
      questions: [
        baseQuestion({
          text: 'The ten frame shows 7 dots. How many more to make 10?',
          options: ['1', '2', '3', '4'],
          correctAnswerIndex: 2,
          visualSpec: {
            visualType: 'ten_frame',
            values: [1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
          },
        }),
      ],
    };
    const { warnings } = sanitizeQuizPayloadVisuals(payload);
    expect(warnings.filter((w) => /Policy:/.test(w))).toEqual([]);
    expect((payload.questions[0] as Record<string, unknown>).visualSpec).toBeDefined();
  });

  it('strips a generic image prompt', () => {
    const payload = {
      standardCode: 'MA.K.AR.1.1',
      questions: [
        baseQuestion({
          imagePrompt: 'A classroom of students working at desks with books.',
          visualIntent: 'Look at the scene.',
        }),
      ],
    };
    const { warnings } = sanitizeQuizPayloadVisuals(payload);
    expect(warnings.some((w) => /Generic/.test(w))).toBe(true);
    expect((payload.questions[0] as Record<string, unknown>).imagePrompt).toBe('');
  });

  it('does not throw on non-array questions', () => {
    expect(() => sanitizeQuizPayloadVisuals({ questions: 'oops' })).not.toThrow();
    expect(() => sanitizeQuizPayloadVisuals({ questions: [null, undefined] })).not.toThrow();
  });
});
