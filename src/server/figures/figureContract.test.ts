import { describe, expect, it } from 'vitest';
import { buildFigureContract } from './figureContract';
import { buildItemClaim } from './itemClaim';
import type { FigureInput } from './types';

const contractFor = (input: FigureInput) => buildFigureContract(input, buildItemClaim(input));

describe('buildFigureContract measured geometry detection', () => {
  it('requires a figure for adjective shape forms with measurements', () => {
    const contract = contractFor({
      kind: 'question',
      grade: '4',
      standardCode: 'MA.4.M.1.1',
      text: 'A rectangular garden has a length of 12 meters and a width of 5 meters. What is the area?',
      options: ['17 square meters', '34 square meters', '60 square meters', '120 square meters'],
      correctAnswerIndex: 2,
    });

    expect(contract.required).toBe(true);
    expect(contract.reason).toContain('measured geometry');
  });

  it('requires a figure for triangular and circular measurements', () => {
    const triangular = contractFor({
      kind: 'question',
      grade: '5',
      standardCode: 'MA.5.GR.3.2',
      text: 'A triangular prism has a base area of 6 square inches and a height of 10 inches. What is its volume?',
      options: ['16 cubic inches', '30 cubic inches', '60 cubic inches', '120 cubic inches'],
      correctAnswerIndex: 2,
    });
    const circular = contractFor({
      kind: 'question',
      grade: '7',
      standardCode: 'MA.7.GR.1.3',
      text: 'A circular pool has a radius of 4 feet. What is its circumference?',
      options: ['4π feet', '8π feet', '16π feet', '32π feet'],
      correctAnswerIndex: 1,
    });

    expect(triangular.required).toBe(true);
    expect(circular.required).toBe(true);
  });

  it('treats printed instrument numerals as given data, not answer leakage', () => {
    const contract = contractFor({
      kind: 'question',
      grade: '4',
      standardCode: 'MA.4.M.1.1',
      text: 'The ruler below shows a pencil. What is the length of the pencil in centimeters?',
      options: ['4 centimeters', '5 centimeters', '6 centimeters', '7 centimeters'],
      correctAnswerIndex: 2,
    });

    expect(contract.required).toBe(true);
    expect(contract.instrumentScale).toBe(true);
    expect(contract.mustNotShow).not.toContain('6');
  });

  it('keeps numeric answer leakage checks for non-instrument figures', () => {
    const contract = contractFor({
      kind: 'question',
      grade: '5',
      standardCode: 'MA.5.GR.3.2',
      text: 'A cube has side lengths of 4 inches. What is its volume?',
      options: ['12 cubic inches', '16 cubic inches', '64 cubic inches', '48 cubic inches'],
      correctAnswerIndex: 2,
    });

    expect(contract.instrumentScale).toBe(false);
    expect(contract.mustNotShow).toContain('64');
  });

  // Audit repro: a bar model of "a total of 84" was rejected for showing 84,
  // because the correct option "7n = 84; n = 12" also contains it.
  it('does not treat numbers the stem gives as answer leaks', () => {
    const contract = contractFor({
      kind: 'question',
      grade: '6',
      standardCode: 'MA.6.AR.2.3',
      text: 'A bar model represents a total value of 84 divided into 7 equal sections, each labeled n. Which equation and solution are correct?',
      options: ['7n = 84; n = 12', 'n + 7 = 84; n = 77', '84n = 7; n = 12', '7 + n = 84; n = 91'],
      correctAnswerIndex: 0,
    });

    expect(contract.mustNotShow).not.toContain('84');
    expect(contract.mustNotShow).toContain('12');
  });

  it('requires a value-matched figure for a symbolic stem that gives quantities', () => {
    const contract = contractFor({
      kind: 'question',
      grade: '4',
      standardCode: 'MA.4.NSO.2.1',
      text: 'What is 24 divided by 6?',
      options: ['3', '4', '5', '6'],
      correctAnswerIndex: 1,
    });

    expect(contract.required).toBe(true);
    expect(contract.family).toBe('none');
  });
});
