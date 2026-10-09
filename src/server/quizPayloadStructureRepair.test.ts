import { describe, expect, it } from 'vitest';
import { repairQuizStructure } from './quizPayloadStructureRepair';

const baseQuestion = (overrides: Record<string, unknown> = {}) => ({
  text: 'What is 2 + 2?',
  options: ['1', '2', '3', '4'],
  correctAnswerIndex: 3,
  ...overrides,
});

describe('repairQuizStructure', () => {
  it('returns no warnings for a clean payload', () => {
    const payload = { questions: [baseQuestion()] };
    const { warnings, hasUsableQuestions } = repairQuizStructure(payload);
    expect(warnings).toEqual([]);
    expect(hasUsableQuestions).toBe(true);
    expect(payload.questions).toHaveLength(1);
  });

  it('marks empty payloads as unusable without throwing', () => {
    expect(repairQuizStructure(null).hasUsableQuestions).toBe(false);
    expect(repairQuizStructure({}).hasUsableQuestions).toBe(false);
    expect(repairQuizStructure({ questions: [] }).hasUsableQuestions).toBe(false);
  });

  it('pads options to 4 when AI emits only 3', () => {
    const payload = {
      questions: [
        baseQuestion({
          options: ['1', '2', '3'],
          correctAnswerIndex: 2,
        }),
      ],
    };
    const { warnings, hasUsableQuestions } = repairQuizStructure(payload);
    expect(hasUsableQuestions).toBe(true);
    expect(payload.questions[0].options).toHaveLength(4);
    expect(payload.questions[0].options).toEqual(['1', '2', '3', '']);
    expect(payload.questions[0].correctAnswerIndex).toBe(2);
    expect(warnings.some((w) => /Q1: padded options/.test(w))).toBe(true);
  });

  it('trims options to 4 while preserving the correct option', () => {
    const payload = {
      questions: [
        baseQuestion({
          options: ['a', 'b', 'c', 'd', 'e'],
          correctAnswerIndex: 4, // points at 'e'
        }),
      ],
    };
    const { warnings, hasUsableQuestions } = repairQuizStructure(payload);
    expect(hasUsableQuestions).toBe(true);
    expect(payload.questions[0].options).toHaveLength(4);
    expect((payload.questions[0].options as string[])).toContain('e');
    const idx = payload.questions[0].correctAnswerIndex as number;
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(idx).toBeLessThanOrEqual(3);
    expect((payload.questions[0].options as string[])[idx]).toBe('e');
    expect(warnings.some((w) => /Q1: trimmed/.test(w))).toBe(true);
  });

  it('clamps an out-of-range correctAnswerIndex to 0 with a warning', () => {
    const payload = {
      questions: [baseQuestion({ correctAnswerIndex: 7 })],
    };
    const { warnings, hasUsableQuestions } = repairQuizStructure(payload);
    expect(hasUsableQuestions).toBe(true);
    expect(payload.questions[0].correctAnswerIndex).toBe(0);
    expect(warnings.some((w) => /Q1: correctAnswerIndex/.test(w))).toBe(true);
  });

  it('handles a missing/non-numeric correctAnswerIndex by defaulting to 0', () => {
    const payload = {
      questions: [baseQuestion({ correctAnswerIndex: 'two' })],
    };
    const { warnings, hasUsableQuestions } = repairQuizStructure(payload);
    expect(hasUsableQuestions).toBe(true);
    expect(payload.questions[0].correctAnswerIndex).toBe(0);
    expect(warnings.some((w) => /Q1: correctAnswerIndex/.test(w))).toBe(true);
  });

  it('coerces non-string options (numbers, objects with text)', () => {
    const payload = {
      questions: [
        baseQuestion({
          options: [3, 4, { text: 'five' }, 6],
          correctAnswerIndex: 2,
        }),
      ],
    };
    const { hasUsableQuestions } = repairQuizStructure(payload);
    expect(hasUsableQuestions).toBe(true);
    expect(payload.questions[0].options).toEqual(['3', '4', 'five', '6']);
  });

  it('drops a question with no usable text', () => {
    const payload = {
      questions: [baseQuestion({ text: '   ' }), baseQuestion()],
    };
    const { warnings, hasUsableQuestions } = repairQuizStructure(payload);
    expect(hasUsableQuestions).toBe(true);
    expect(payload.questions).toHaveLength(1);
    expect(warnings.some((w) => /Q1: missing text/.test(w))).toBe(true);
    expect(warnings.some((w) => /Quiz: dropped 1 of 2/.test(w))).toBe(true);
  });

  it('drops a question whose options array has nothing usable', () => {
    const payload = {
      questions: [baseQuestion({ options: ['', '', null, undefined] }), baseQuestion()],
    };
    const { warnings, hasUsableQuestions } = repairQuizStructure(payload);
    expect(hasUsableQuestions).toBe(true);
    expect(payload.questions).toHaveLength(1);
    expect(warnings.some((w) => /Q1: no usable options/.test(w))).toBe(true);
  });

  it('returns hasUsableQuestions=false when EVERY question is unrecoverable', () => {
    const payload = {
      questions: [
        baseQuestion({ text: '' }),
        baseQuestion({ options: [] }),
      ],
    };
    const { warnings, hasUsableQuestions } = repairQuizStructure(payload);
    expect(hasUsableQuestions).toBe(false);
    expect(warnings.some((w) => /no questions survived/.test(w))).toBe(true);
  });

  it('drops non-object questions defensively', () => {
    const payload = {
      questions: [null, 'not a question', baseQuestion()],
    };
    const { warnings, hasUsableQuestions } = repairQuizStructure(payload);
    expect(hasUsableQuestions).toBe(true);
    expect(payload.questions).toHaveLength(1);
    expect(warnings.some((w) => /Q1: not an object/.test(w))).toBe(true);
    expect(warnings.some((w) => /Q2: not an object/.test(w))).toBe(true);
  });

  it('does not warn when no repair was needed', () => {
    const payload = {
      questions: [
        baseQuestion(),
        baseQuestion({ text: 'Pick the smallest', correctAnswerIndex: 0 }),
      ],
    };
    const { warnings } = repairQuizStructure(payload);
    expect(warnings).toEqual([]);
  });
});
