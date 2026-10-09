import { describe, expect, it } from 'vitest';
import {
  buildPartPartWholeImagePrompt,
  extractPartPartWholeFromText,
  questionPrefersGeneratedImage,
  reconcilePartPartWholeFromStem,
} from './partPartWholeVisual';

describe('extractPartPartWholeFromText', () => {
  it('parses an addition fact from the stem', () => {
    expect(extractPartPartWholeFromText('If you know that 7 + 3 = 10, what is 10 - 7?')).toEqual({
      partA: 7,
      partB: 3,
      total: 10,
    });
  });
});

describe('buildPartPartWholeImagePrompt', () => {
  it('describes the whole and two colored parts', () => {
    const prompt = buildPartPartWholeImagePrompt(
      { text: 'If you know that 7 + 3 = 10, what is 10 - 7?' },
      'Grade 1',
    );
    expect(prompt).toMatch(/10/);
    expect(prompt).toMatch(/7/);
    expect(prompt).toMatch(/3/);
    expect(prompt).toMatch(/green/i);
    expect(prompt).toMatch(/blue/i);
    expect(prompt).toMatch(/red/i);
  });
});

describe('reconcilePartPartWholeFromStem', () => {
  it('replaces a weak visualSpec with a concrete image prompt', () => {
    const question = {
      text: 'If you know that 7 + 3 = 10, what is 10 - 7?',
      visualSpec: { visualType: 'ten_frame' },
      imagePrompt: '',
    };
    reconcilePartPartWholeFromStem(question);
    expect(question.visualSpec).toBeUndefined();
    expect(question.imagePrompt).toMatch(/part-part-whole/i);
    expect(questionPrefersGeneratedImage(question)).toBe(true);
  });
});
