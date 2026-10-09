import { describe, expect, it } from 'vitest';
import { questionStemRequiresImage } from './questionStemRequiresImage';

describe('questionStemRequiresImage', () => {
  describe('positive triggers', () => {
    it.each([
      'Look at the picture below.',
      'The picture shows 3 apples.',
      'Count the dots shown above.',
      'Which shape has 4 equal sides?',
      'On the number line, what value is marked?',
      'On the coordinate plane, plot (2, 3).',
      'The bar shown represents 3/8.',
      'The tape diagram shown helps you solve this problem.',
      'The shaded part of the rectangle is what fraction?',
      "The clock face shows 3:15.",
      'Below is a graph of the data.',
      'In the figure above, find the missing angle.',
      'The triangle shown has sides labeled a, b, c.',
      'Each row of the array shows 4 stars.',
      'Which figure has rotational symmetry?',
    ])('returns true for: "%s"', (stem) => {
      expect(questionStemRequiresImage(stem)).toBe(true);
    });
  });

  describe('negative (text-only) stems', () => {
    it.each([
      'Which is greater, 7 or 9?',
      'What is 25 + 17?',
      'Tom has 3 apples and gets 2 more. How many does he have?',
      'Solve for x: 2x + 5 = 11.',
      'Round 387 to the nearest hundred.',
      'A car travels 60 miles in 1 hour. How far in 3 hours?',
      'Write the fraction 3/8 as a decimal.',
      '',
      '   ',
    ])('returns false for: "%s"', (stem) => {
      expect(questionStemRequiresImage(stem)).toBe(false);
    });
  });

  it('is case insensitive', () => {
    expect(questionStemRequiresImage('LOOK AT THE PICTURE BELOW.')).toBe(true);
    expect(questionStemRequiresImage('look At THE Picture below.')).toBe(true);
  });

  it('handles extra whitespace / newlines', () => {
    expect(
      questionStemRequiresImage('Look\n  at\n  the\n  picture\n  below.'),
    ).toBe(true);
  });
});
