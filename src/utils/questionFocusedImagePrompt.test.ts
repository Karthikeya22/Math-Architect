import { describe, expect, it } from 'vitest';
import { applyQuestionVisualReconcilers } from './reconcileVisualFromStem';
import {
  buildQuestionFocusedImagePrompt,
  extractRightTriangleScene,
  prefersDeterministicVisual,
} from './questionFocusedImagePrompt';

describe('extractRightTriangleScene', () => {
  it('parses ladder, wall, and leg measurements from the stem', () => {
    expect(
      extractRightTriangleScene(
        'A ladder is placed against a vertical wall. The base of the ladder is 5 feet away from the wall, and the ladder reaches a height of 12 feet up the wall. What is the length of the ladder?',
      ),
    ).toEqual({
      legA: 5,
      legB: 12,
      verticalLabel: 'wall',
      horizontalLabel: 'ground',
      hypotenuseLabel: 'ladder',
    });
  });
});

describe('buildQuestionFocusedImagePrompt', () => {
  it('uses grouped-object labels for skip-counting / pattern stems', () => {
    const prompt = buildQuestionFocusedImagePrompt(
      {
        text: 'Mia is counting by 2. She has groups showing 2, 4, 6, and 8. What is the next number in the pattern?',
      },
      'Grade 2',
    );
    expect(prompt).toMatch(/exactly 2 identical objects/i);
    expect(prompt).toMatch(/2, 4, 6, 8/i);
    expect(prompt).toMatch(/\?/);
    expect(prompt).toMatch(/5 groups/i);
    expect(prompt).not.toMatch(/Generate one educational image/i);
  });

  it('asks for a right triangle with the given wall and ground measurements', () => {
    const prompt = buildQuestionFocusedImagePrompt(
      {
        text: 'A ladder is placed against a vertical wall. The base of the ladder is 5 feet away from the wall, and the ladder reaches a height of 12 feet up the wall. What is the length of the ladder?',
      },
      'Grade 8',
    );
    expect(prompt).toMatch(/right triangle/i);
    expect(prompt).toMatch(/5/);
    expect(prompt).toMatch(/12/);
    expect(prompt).toMatch(/ladder/i);
    expect(prompt).toMatch(/wall/i);
  });
});

describe('reconcileSceneImageFromStem', () => {
  it('replaces a generic geometric_shape with a scene-focused image prompt', () => {
    const question = {
      text: 'A ladder is placed against a vertical wall. The base of the ladder is 5 feet away from the wall, and the ladder reaches a height of 12 feet up the wall. What is the length of the ladder?',
      visualSpec: { visualType: 'geometric_shape', shapeName: 'triangle' },
      imagePrompt: '',
    };
    applyQuestionVisualReconcilers(question);
    expect(question.visualSpec).toBeUndefined();
    expect(question.imagePrompt).toMatch(/right triangle/i);
    expect(prefersDeterministicVisual(question)).toBe(false);
  });
});
