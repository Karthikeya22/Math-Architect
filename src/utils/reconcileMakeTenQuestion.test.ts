import { describe, expect, it } from 'vitest';
import {
  coerceMisclassifiedTenFrameSpec,
  normalizeTenFrameCells,
  parseFilledDotsCountFromStem,
  parseTeenPlaceValueTotalFromStem,
  reconcileBlocksMissingAddendToTen,
  reconcileMakeTenQuestion,
  reconcilePlaceValueTeensFromStem,
} from './reconcileMakeTenQuestion';

describe('normalizeTenFrameCells', () => {
  it('pads to 10 cells with zeros', () => {
    expect(normalizeTenFrameCells([1, 1, 1])).toEqual([1, 1, 1, 0, 0, 0, 0, 0, 0, 0]);
  });
});

describe('coerceMisclassifiedTenFrameSpec', () => {
  it('converts mis-tagged line_plot with 10 binary values when stem mentions ten-frame', () => {
    const q = {
      text: 'Look at the dots in the ten-frame. How many more to make 10?',
      visualSpec: {
        visualType: 'line_plot' as const,
        values: [1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
      },
    };
    coerceMisclassifiedTenFrameSpec(q);
    expect(q.visualSpec?.visualType).toBe('ten_frame');
  });
});

describe('parseFilledDotsCountFromStem', () => {
  it('reads the filled dot count from common kindergarten stems', () => {
    expect(
      parseFilledDotsCountFromStem('There are 7 dots in the ten frame. How many more dots are needed to make 10?'),
    ).toBe(7);
  });
});

describe('reconcileMakeTenQuestion', () => {
  it('repairs mangled ten_frame visualType strings emitted by the model', () => {
    const q = {
      text: 'There are 7 dots on the ten frame. How many more dots do you need to make 10?',
      options: ['2', '3', '4', '5'],
      correctAnswerIndex: 1,
      explanation: 'Wrong explanation.',
      visualSpec: {
        visualType: 'ten_frameValues:[1,1,1,1,1,1,1,0,0,0]',
      },
    };
    reconcileMakeTenQuestion(q);
    expect(q.visualSpec?.visualType).toBe('ten_frame');
    expect(q.visualSpec?.values?.filter((value: number) => value >= 1).length).toBe(7);
  });

  it('infers ten-frame cells from the stem when the model omits values', () => {
    const q = {
      text: 'There are 7 dots in the ten frame. How many more dots are needed to make 10?',
      options: ['2', '3', '4', '5'],
      correctAnswerIndex: 1,
      explanation: 'Wrong explanation.',
      visualSpec: {
        visualType: 'ten_frame' as const,
      },
    };
    reconcileMakeTenQuestion(q);
    expect(q.visualSpec?.values?.filter((value: number) => value >= 1).length).toBe(7);
    expect(q.correctAnswerIndex).toBe(1);
    expect(q.explanation).toContain('7 dots');
    expect(q.explanation).toContain('3 more');
  });

  it('aligns answer key and explanation with ten-frame cells', () => {
    const q = {
      text: 'How many more dots do you need to make 10?',
      options: ['1', '2', '3', '4'],
      correctAnswerIndex: 1,
      explanation: 'Wrong explanation.',
      visualSpec: {
        visualType: 'ten_frame' as const,
        values: [1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      },
    };
    reconcileMakeTenQuestion(q);
    expect(q.correctAnswerIndex).toBe(0);
    expect(q.explanation).toContain('9 dots');
    expect(q.explanation).toContain('1 more');
  });
});

describe('reconcilePlaceValueTeensFromStem', () => {
  it('parses teen totals from place-value stems', () => {
    expect(
      parseTeenPlaceValueTotalFromStem(
        'Look at the dots. The number 14 is made of 1 ten and how many ones?',
      ),
    ).toBe(14);
  });

  it('builds a full ten-frame plus ones dots for teen place-value items', () => {
    const q = {
      text: 'Look at the dots. The number 14 is made of 1 ten and how many ones?',
      options: ['4 ones', '1 one', '10 ones', '14 ones'],
      correctAnswerIndex: 3,
      explanation: '',
      imagePrompt: 'draw dots',
      visualSpec: null as { visualType: string; values: number[]; onesCount?: number } | null,
    };
    reconcilePlaceValueTeensFromStem(q);
    expect(q.visualSpec?.visualType).toBe('ten_frame');
    expect(q.visualSpec?.values?.filter((v: number) => v >= 1).length).toBe(10);
    expect(q.visualSpec?.onesCount).toBe(4);
    expect(q.correctAnswerIndex).toBe(0);
    expect(q.imagePrompt).toBe('');
  });
});

describe('reconcileBlocksMissingAddendToTen', () => {
  it('forces ten_frame from stem and sets answer for blocks-to-10 word problems', () => {
    const q = {
      text: 'Sarah has 4 red blocks. How many more blocks does she need to have 10 blocks in all?',
      options: ['4', '5', '6', '7'],
      correctAnswerIndex: 0,
      explanation: 'wrong',
      imagePrompt: 'a strip of 8 boxes',
      visualSpec: null as { visualType: string; values: number[] } | null,
    };
    reconcileBlocksMissingAddendToTen(q);
    expect(q.visualSpec?.visualType).toBe('ten_frame');
    expect(q.visualSpec?.values?.filter((v: number) => v >= 1).length).toBe(4);
    expect(q.correctAnswerIndex).toBe(2);
    expect(q.imagePrompt).toBe('');
    expect(q.explanation).toContain('6');
  });
});
