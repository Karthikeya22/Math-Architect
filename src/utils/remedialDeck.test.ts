import { describe, expect, it } from 'vitest';
import {
  REMEDIAL_DECK_SCHEMA,
  buildMissedQuestionDigest,
  buildRemedialDeckPrompt,
  normalizeRemedialDeck,
  toVocabEntries,
} from './remedialDeck';
import {
  FIXTURE_ANALYSIS,
  FIXTURE_QUESTIONS,
  FIXTURE_RESULTS,
  FIXTURE_STANDARD,
} from '../dev/remedialFixtures';

describe('buildMissedQuestionDigest', () => {
  it('keeps only missed questions with the student answer and the correct answer', () => {
    const missed = buildMissedQuestionDigest(FIXTURE_QUESTIONS, FIXTURE_RESULTS);
    expect(missed).toHaveLength(3);
    expect(missed[0]).toMatchObject({
      number: 1,
      text: FIXTURE_QUESTIONS[0].text,
      studentAnswer: FIXTURE_QUESTIONS[0].options[FIXTURE_RESULTS[0].selectedOptionIndex],
      correctAnswer: FIXTURE_QUESTIONS[0].options[FIXTURE_QUESTIONS[0].correctAnswerIndex],
    });
  });

  it('returns nothing when there are no results', () => {
    expect(buildMissedQuestionDigest(FIXTURE_QUESTIONS, undefined)).toEqual([]);
  });
});

describe('buildRemedialDeckPrompt', () => {
  const prompt = buildRemedialDeckPrompt({
    standard: FIXTURE_STANDARD,
    analysis: FIXTURE_ANALYSIS,
    missed: buildMissedQuestionDigest(FIXTURE_QUESTIONS, FIXTURE_RESULTS),
  });

  it('grounds the deck in the named gaps and the questions the student missed', () => {
    for (const gap of FIXTURE_ANALYSIS.identifiedGaps) expect(prompt).toContain(gap.description);
    expect(prompt).toContain(FIXTURE_QUESTIONS[1].text);
    expect(prompt).toContain(`Student chose: ${FIXTURE_QUESTIONS[1].options[FIXTURE_RESULTS[1].selectedOptionIndex]}`);
  });

  it('spells out the six-slide blueprint and the copy rules', () => {
    for (const layout of ['gap_overview', 'concept', 'model', 'worked_example', 'mistake_fix', 'try_it']) {
      expect(prompt).toContain(layout);
    }
    expect(prompt).toMatch(/new numbers/i);
    expect(prompt).toMatch(/talkingPoints/);
    expect(prompt).toContain(FIXTURE_STANDARD.grade);
  });
});

describe('REMEDIAL_DECK_SCHEMA', () => {
  it('requires the teacher script and gap link on every slide', () => {
    const slide = REMEDIAL_DECK_SCHEMA.properties.slides.items;
    expect(slide.required).toEqual(
      expect.arrayContaining(['layout', 'title', 'gapAddressed', 'keyPoints', 'talkingPoints', 'visualDescription']),
    );
  });
});

describe('normalizeRemedialDeck', () => {
  const gapLabels = ['Adds the denominators', 'Mixed numbers'];

  it('repairs layout, numbering, list lengths and the legacy content field', () => {
    const slides = normalizeRemedialDeck(
      {
        slides: [
          {
            layout: 'nonsense',
            title: '  Where we got stuck  ',
            keyPoints: ['One', '', 'Two', 'Three', 'Four', 'Five'],
            talkingPoints: ['Ask what the bottom number means.'],
            vocabulary: ['denominator', { term: 'numerator', meaning: 'the top number' }],
            visualDescription: '',
          },
          { title: '' },
          { layout: 'concept', title: 'Same size parts', keyPoints: ['Fifths stay fifths.'] },
        ],
      },
      { gapLabels },
    );

    expect(slides).toHaveLength(2);
    expect(slides.map((s) => s.slideNumber)).toEqual([1, 2]);
    expect(slides[0].layout).toBe('gap_overview');
    expect(slides[0].title).toBe('Where we got stuck');
    expect(slides[0].keyPoints).toEqual(['One', 'Two', 'Three', 'Four']);
    expect(slides[0].content).toBe('- One\n- Two\n- Three\n- Four');
    expect(slides[0].vocabulary).toEqual([
      { term: 'denominator', meaning: '' },
      { term: 'numerator', meaning: 'the top number' },
    ]);
    expect(slides[1].gapAddressed).toBe('Adds the denominators');
    expect(slides[1].talkingPoints).toEqual([]);
  });

  it('drops half-filled structured blocks', () => {
    const [slide] = normalizeRemedialDeck({
      slides: [
        {
          layout: 'worked_example',
          title: 'Try 3/7 + 2/7',
          workedExample: { problem: '3/7 + 2/7', steps: [], answer: '5/7' },
          misconception: { wrong: '5/14', why: '', fix: '' },
          checkQuestion: { prompt: '', answer: '1' },
        },
      ],
    });
    expect(slide.workedExample).toBeUndefined();
    expect(slide.misconception).toBeUndefined();
    expect(slide.checkQuestion).toBeUndefined();
  });

  it('keeps at most three illustrated slides, preferring the model and concept slides', () => {
    const layouts = ['gap_overview', 'concept', 'model', 'worked_example', 'mistake_fix', 'try_it'];
    const slides = normalizeRemedialDeck({
      slides: layouts.map((layout) => ({ layout, title: layout, visualDescription: `Picture for ${layout}` })),
    });
    const illustrated = slides.filter((s) => s.visualDescription).map((s) => s.layout);
    expect(illustrated).toEqual(['concept', 'model', 'worked_example']);
  });

  it('is idempotent', () => {
    const once = normalizeRemedialDeck({
      slides: [
        {
          layout: 'mistake_fix',
          title: 'Keep the bottom number',
          keyPoints: ['Add tops only.'],
          misconception: { wrong: '2/5 + 1/5 = 3/10', why: 'Added the bottoms.', fix: '2/5 + 1/5 = 3/5' },
          talkingPoints: ['Ask: are the parts still fifths?'],
          vocabulary: [{ term: 'denominator', meaning: 'how many equal parts' }],
          gapAddressed: 'Adds the denominators',
          visualDescription: 'Two fifths bars',
        },
      ],
    });
    expect(normalizeRemedialDeck(once)).toEqual(once);
  });

  it('accepts a bare array', () => {
    expect(normalizeRemedialDeck([{ title: 'Hello' }])).toHaveLength(1);
  });
});

describe('toVocabEntries', () => {
  it('reads both the legacy string list and the new term/meaning list', () => {
    expect(toVocabEntries(['sum', { term: 'addend', meaning: 'a number being added' }, '', { term: '' }])).toEqual([
      { term: 'sum', meaning: '' },
      { term: 'addend', meaning: 'a number being added' },
    ]);
  });
});
