import { describe, expect, it } from 'vitest';
import { buildQuestionSceneImagePrompt, buildVisualSpecScenePrompt } from './buildQuestionImagePrompt';

describe('buildVisualSpecScenePrompt', () => {
  it('describes compared geometric figures', () => {
    const prompt = buildVisualSpecScenePrompt({
      visualType: 'geometric_shape',
      shapes: ['triangle', 'square'],
    });
    expect(prompt).toMatch(/triangle/i);
    expect(prompt).toMatch(/square/i);
  });
});

describe('buildQuestionSceneImagePrompt', () => {
  it('builds a part-part-whole prompt for related addition and subtraction facts', () => {
    const prompt = buildQuestionSceneImagePrompt(
      {
        text: 'If you know that 7 + 3 = 10, what is the answer to 10 - 7?',
        options: ['2', '3', '4', '17'],
        correctAnswerIndex: 1,
      },
      'Grade 1',
    );
    expect(prompt).toMatch(/green/i);
    expect(prompt).toMatch(/blue/i);
    expect(prompt).toMatch(/red/i);
  });

  it('builds a geometric compare prompt from the stem when no visualSpec is present', () => {
    const prompt = buildQuestionSceneImagePrompt(
      {
        text: 'Look at the triangle and the square. How are they alike?',
        options: ['Both have 3 sides', 'Both have 4 sides', 'Both are circles', 'Both are red'],
        correctAnswerIndex: 0,
      },
      'Kindergarten',
    );
    expect(prompt).toMatch(/triangle/i);
    expect(prompt).toMatch(/square/i);
    expect(prompt).not.toMatch(/Figure unavailable/i);
  });
});
