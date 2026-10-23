import { describe, expect, it } from 'vitest';
import { generateFigure } from './generateFigure';
import { renderInstrumentSvg } from './renderInstrumentSvg';
import { buildItemClaim } from './itemClaim';
import type { FigureInput } from './types';

const THERMOMETER: FigureInput = {
  kind: 'question',
  grade: '3',
  standardCode: 'MA.3.M.1.1',
  text: 'The thermometer below shows the temperature outside. What is the temperature in degrees Celsius?',
  options: ['30 degrees Celsius', '35 degrees Celsius', '37 degrees Celsius', '40 degrees Celsius'],
  correctAnswerIndex: 2,
};

const CYLINDER: FigureInput = {
  kind: 'question',
  grade: '4',
  standardCode: 'MA.4.M.1.1',
  text: 'The graduated cylinder below shows the amount of water in a beaker. How much water is in the cylinder?',
  options: ['150 milliliters', '200 milliliters', '250 milliliters', '300 milliliters'],
  correctAnswerIndex: 2,
};

const BALANCE: FigureInput = {
  kind: 'question',
  grade: '3',
  standardCode: 'MA.3.M.1.2',
  text: 'The pan balance below shows an object and some weights. What is the mass of the object?',
  options: ['250 grams', '300 grams', '350 grams', '400 grams'],
  correctAnswerIndex: 2,
};

const PROTRACTOR: FigureInput = {
  kind: 'question',
  grade: '4',
  standardCode: 'MA.4.GR.1.2',
  text: 'The protractor below shows an angle. What is the measure of the angle?',
  options: ['45 degrees', '90 degrees', '135 degrees', '180 degrees'],
  correctAnswerIndex: 0,
};

const CLOCK: FigureInput = {
  kind: 'question',
  grade: '2',
  standardCode: 'MA.2.M.2.1',
  text: 'The clock below shows the time Mia started reading. What time is shown on the clock?',
  options: ['3:45', '4:15', '4:45', '5:15'],
  correctAnswerIndex: 0,
};

const neverGenerate = async () => {
  throw new Error('image model must not be called for scale-reading items');
};

describe('renderInstrumentSvg', () => {
  it('renders a thermometer with the liquid ending on the reading', () => {
    const svg = renderInstrumentSvg(buildItemClaim(THERMOMETER));

    expect(svg).toContain('<svg');
    expect(svg).toContain('aria-label="A thermometer reading 37 °C"');
    expect(svg).toContain('>35</text>');
    expect(svg).toContain('>40</text>');
    expect(svg).toContain('>°C</text>');
  });

  it('renders a graduated cylinder with the level on the reading', () => {
    const svg = renderInstrumentSvg(buildItemClaim(CYLINDER));

    expect(svg).toContain('<svg');
    expect(svg).toContain('aria-label="A graduated cylinder reading 250 mL"');
    expect(svg).toContain('>250</text>');
    expect(svg).toContain('>mL</text>');
  });

  it('returns null for items without a supported instrument', () => {
    expect(
      renderInstrumentSvg(
        buildItemClaim({
          kind: 'question',
          grade: '5',
          text: 'A cube has side lengths of 4 inches. What is its volume?',
          options: ['16', '64', '48', '12'],
          correctAnswerIndex: 1,
        }),
      ),
    ).toBeNull();
  });

  it('renders a pan balance whose weights sum to the reading', () => {
    const svg = renderInstrumentSvg(
      buildItemClaim({
        kind: 'question',
        grade: '3',
        text: 'The pan balance below shows an object and some weights. What is the mass of the object?',
        options: ['250 grams', '300 grams', '350 grams', '400 grams'],
        correctAnswerIndex: 2,
      }),
    );

    expect(svg).toContain('<svg');
    expect(svg).toContain('200 g');
    expect(svg).toContain('100 g');
    expect(svg).toContain('50 g');
  });

  it('renders a protractor with a ray at the reading', () => {
    const svg = renderInstrumentSvg(
      buildItemClaim({
        kind: 'question',
        grade: '4',
        text: 'The protractor below shows an angle. What is the measure of the angle?',
        options: ['45 degrees', '90 degrees', '135 degrees', '180 degrees'],
        correctAnswerIndex: 0,
      }),
    );

    expect(svg).toContain('<svg');
    expect(svg).toContain('aria-label="A protractor with a ray drawn at 45 degrees"');
    expect(svg).toContain('>40</text>');
    expect(svg).toContain('>50</text>');
  });

  it('renders an analog clock at the reading', () => {
    const svg = renderInstrumentSvg(
      buildItemClaim({
        kind: 'question',
        grade: '2',
        text: 'The clock below shows the time Mia started reading. What time is shown on the clock?',
        options: ['3:45', '4:15', '4:45', '5:15'],
        correctAnswerIndex: 0,
      }),
    );

    expect(svg).toContain('<svg');
    expect(svg).toContain('aria-label="An analog clock showing 3:45"');
    expect(svg).toContain('>12</text>');
  });

  it('leaves elapsed-time items to the prompt path', () => {
    const svg = renderInstrumentSvg(
      buildItemClaim({
        kind: 'question',
        grade: '3',
        text: 'The clock below shows when Mia started. What time will it be in 30 minutes?',
        options: ['3:45', '4:15', '4:45', '5:15'],
        correctAnswerIndex: 0,
      }),
    );

    expect(svg).toBeNull();
  });
});

describe('generateFigure scale-reading path', () => {
  it.each([
    ['thermometer', THERMOMETER],
    ['graduated cylinder', CYLINDER],
    ['pan balance', BALANCE],
    ['protractor', PROTRACTOR],
    ['clock', CLOCK],
  ])('publishes the %s deterministically', async (_label, input) => {
    const result = await generateFigure(input, neverGenerate, {});

    expect(result.status).toBe('verified');
    expect(result.visualPath).toBe('deterministic_svg');
    expect(result.svg).toContain('<svg');
    expect(result.attempts).toBe(0);
  });
});
