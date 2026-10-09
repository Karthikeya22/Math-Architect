import { describe, expect, it } from 'vitest';
import {
  buildCompareLengthImagePrompt,
  parseColoredBlockTrains,
  reconcileColoredBlockTrainsFromStem,
} from './compareLengthVisual';
import { renderPreparedDeterministicVisual } from './prepareQuestionVisual';

describe('compareLengthVisual', () => {
  it('builds a deterministic two-color block-train visual from the question copy', () => {
    const question = {
      text: 'Which train of blocks is shorter?',
      options: ['The red block train', 'The blue block train', 'They are the same length', 'The green block train'],
      correctAnswerIndex: 0,
      explanation: 'The red train has 3 blocks. The blue train has 5 blocks.',
      visualSpec: null as { visualType: string } | null,
      imagePrompt: 'rainbow trains',
    };
    reconcileColoredBlockTrainsFromStem(question);
    expect(question.visualSpec?.visualType).toBe('array_model');
    expect(question.visualSpec?.rowColors).toEqual(['red', 'blue']);
    expect(question.imagePrompt).toBe('');
    const svg = renderPreparedDeterministicVisual(question);
    expect(svg).toContain('<circle');
    expect(svg?.match(/fill="#dc2626"/g)?.length).toBe(3);
    expect(svg?.match(/fill="#2563eb"/g)?.length).toBe(5);
  });

  it('builds a strict Gemini prompt when colors and counts are known', () => {
    const prompt = buildCompareLengthImagePrompt({
      text: 'Which train of blocks is shorter?',
      options: ['The red block train', 'The blue block train'],
      explanation: 'The red train has 3 blocks. The blue train has 5 blocks.',
    });
    expect(prompt).toContain('exactly 3 solid red cubes');
    expect(prompt).toContain('exactly 5 solid blue cubes');
    expect(prompt).toContain('Use only red and blue');
  });

  it('parses two named trains from options and explanation', () => {
    const parsed = parseColoredBlockTrains({
      text: 'Which train of blocks is shorter?',
      options: ['The red block train', 'The blue block train'],
      explanation: 'The red train has 4 blocks. The blue train has 6 blocks.',
    });
    expect(parsed?.colors).toEqual(['red', 'blue']);
    expect(parsed?.counts).toEqual([4, 6]);
  });
});
