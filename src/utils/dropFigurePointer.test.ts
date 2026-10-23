import { describe, expect, it } from 'vitest';
import { dropFigurePointer } from './dropFigurePointer';

describe('dropFigurePointer', () => {
  it('drops a bare pointer sentence', () => {
    expect(dropFigurePointer('Look at the number line. A jump starts at 0 and lands on 8. What is 8 + 6?')).toBe(
      'A jump starts at 0 and lands on 8. What is 8 + 6?',
    );
  });

  it('keeps a pointer that carries detail', () => {
    const stem = 'Look at the rectangle with four dashed lines: Line A goes down the middle. Which is a line of symmetry?';
    expect(dropFigurePointer(stem)).toBe(stem);
  });

  it('keeps stems without a pointer', () => {
    expect(dropFigurePointer('What is 8 + 6?')).toBe('What is 8 + 6?');
  });
});
