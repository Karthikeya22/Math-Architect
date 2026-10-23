import { describe, expect, it } from 'vitest';
import { buildVerifierPrompt, verdictFromRaw } from './figureVerifier.ts';

const BRIEF = {
  needsFigure: true,
  skipReason: '',
  figureType: 'diagram' as const,
  subject: 'Ruler with a pencil above it',
  mustShow: ['a 0-10 cm ruler', 'a pencil aligned with the ruler'],
  labels: [],
  layout: 'Wide landscape.',
  mustNotShow: [],
};

describe('buildVerifierPrompt', () => {
  it('allows printed scale numerals when the figure shows a measuring instrument', () => {
    const prompt = buildVerifierPrompt(
      {
        kind: 'question',
        grade: '4',
        standardCode: 'MA.4.M.1.1',
        text: 'The ruler below shows a pencil. What is the length of the pencil in centimeters?',
        options: ['4 centimeters', '5 centimeters', '6 centimeters', '7 centimeters'],
        correctAnswerIndex: 2,
      },
      BRIEF,
    );

    expect(prompt).toContain('instrument scale');
    expect(prompt).toContain('not part of the instrument scale');
  });

  it('keeps the strict no-text rule for ordinary diagrams', () => {
    const prompt = buildVerifierPrompt(
      {
        kind: 'question',
        grade: '5',
        standardCode: 'MA.5.GR.3.2',
        text: 'A cube has side lengths of 4 inches. What is its volume?',
        options: ['12 cubic inches', '16 cubic inches', '64 cubic inches', '48 cubic inches'],
        correctAnswerIndex: 2,
      },
      { ...BRIEF, subject: 'Cube with a labeled side', mustShow: ['a cube', 'a side labeled 4 inches'] },
    );

    expect(prompt).not.toContain('instrument scale');
  });
});

describe('verdictFromRaw', () => {
  it('keeps the exact visible text the verifier read', () => {
    const verdict = verdictFromRaw(
      {
        observed: 'A rectangle labeled Rectangle A with 9 inches on top.',
        visibleText: ['Rectangle A', '9 inches'],
        matchesBrief: true,
        quantitiesCorrect: true,
        relationshipsCorrect: true,
        labelsCorrect: true,
        revealsAnswer: false,
        hasExtraOrGarbledText: false,
        issues: [],
      },
      'question',
    );

    expect(verdict.pass).toBe(true);
    expect(verdict.visibleText).toEqual(['Rectangle A', '9 inches']);
  });

  it('normalizes and drops blank visible-text entries', () => {
    const verdict = verdictFromRaw(
      {
        observed: 'A figure.',
        visibleText: ['  Rectangle   A ', '', null, '4 inches'],
        matchesBrief: true,
        quantitiesCorrect: true,
        relationshipsCorrect: true,
        labelsCorrect: true,
        revealsAnswer: false,
        hasExtraOrGarbledText: false,
        issues: [],
      },
      'question',
    );

    expect(verdict.visibleText).toEqual(['Rectangle A', '4 inches']);
  });

  it('returns an empty visible-text array when the provider omits it', () => {
    const verdict = verdictFromRaw(
      {
        observed: 'A figure.',
        matchesBrief: true,
        quantitiesCorrect: true,
        relationshipsCorrect: true,
        labelsCorrect: true,
        revealsAnswer: false,
        hasExtraOrGarbledText: false,
        issues: [],
      },
      'question',
    );

    expect(verdict.visibleText).toEqual([]);
  });
});
