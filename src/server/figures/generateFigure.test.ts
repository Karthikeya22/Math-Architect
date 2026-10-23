import { describe, expect, it } from 'vitest';
import type { GenerateRequest, GenerateResponse } from '../ai/types';
import { composeFigureImagePrompt, normalizeFigureBrief } from './figureBrief';
import { generateFigure } from './generateFigure';
import type { FigureInput } from './types';

/** Illustration-class item (AI path). Exact countable stems omit AI when no SVG. */
const QUESTION: FigureInput = {
  kind: 'question',
  grade: 'Kindergarten',
  standardCode: 'MA.K.NSO.1.1',
  text: 'Which picture shows a group of friends sharing?',
  options: ['A picnic', 'A blank page', 'A ruler', 'A calendar'],
  correctAnswerIndex: 0,
  visualIntent: 'A simple cartoon scene of children at a picnic.',
};

const EXACT_QUESTION: FigureInput = {
  kind: 'question',
  grade: 'Kindergarten',
  standardCode: 'MA.K.NSO.1.1',
  text: 'How many counters are on the ten frame?',
  options: ['6', '7', '8', '9'],
  correctAnswerIndex: 2,
  visualIntent: 'Show 8 counters on a ten frame.',
  visualSpec: {
    visualType: 'ten_frame',
    values: [1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
  },
};

const SOLID_QUESTION: FigureInput = {
  kind: 'question',
  grade: 'Grade 5',
  standardCode: 'MA.5.GR.3.2',
  text: 'A cube has side lengths of 4 inches. What is its volume?',
  options: ['12 cubic inches', '16 cubic inches', '64 cubic inches', '48 cubic inches'],
  correctAnswerIndex: 2,
  visualIntent: 'Show a cube with a side length of 4 inches.',
  visualSpec: {
    visualType: 'geometric_shape',
    figures: [
      { shape: 'cube', width: 4, height: 4, dimensions: [{ side: 'top', label: '4 inches' }] },
    ],
  },
};

const BRIEF = {
  needsFigure: true,
  skipReason: '',
  figureType: 'illustration',
  subject: 'Stars inside a box',
  mustShow: ['exactly 8 yellow stars, not touching', 'one simple blue rectangular box around them'],
  labels: [],
  layout: 'Stars spread evenly inside a wide box.',
  mustNotShow: ['the number 8', 'option letters'],
};

const PASS = {
  observed: '8 stars in a box',
  visibleText: [],
  matchesBrief: true,
  quantitiesCorrect: true,
  relationshipsCorrect: true,
  labelsCorrect: true,
  revealsAnswer: false,
  hasExtraOrGarbledText: false,
  issues: [],
};

const text = (body: unknown): GenerateResponse => ({
  text: JSON.stringify(body),
  candidates: [],
  provider: 'openai',
  model: 'gpt-5.4-mini',
});

const image = (): GenerateResponse => ({
  text: null,
  candidates: [{ content: { parts: [{ inlineData: { mimeType: 'image/jpeg', data: 'SU1H' } }] } }],
  provider: 'openai',
  model: 'gpt-image-2',
});

const scripted = (verdicts: unknown[], brief: unknown = BRIEF) => {
  const requests: GenerateRequest[] = [];
  let verdictIndex = 0;
  const generate = async (request: GenerateRequest): Promise<GenerateResponse> => {
    requests.push(request);
    if (request.task === 'figure_brief') return text(brief);
    if (request.task === 'image') return image();
    if (request.task === 'vision') return text(verdicts[verdictIndex++]);
    throw new Error(`unexpected task ${request.task}`);
  };
  return { generate, requests };
};

const imagePrompts = (requests: GenerateRequest[]) =>
  requests.filter((r) => r.task === 'image').map((r) => String(r.contents.parts[0].text));

describe('generateFigure', () => {
  it('returns deterministic SVG for exact claims without calling the image model', async () => {
    const { generate, requests } = scripted([PASS]);
    const result = await generateFigure(EXACT_QUESTION, generate, { LC_EVAL_MODE: 'off' });
    expect(result.status).toBe('verified');
    expect(result.svg).toMatch(/<svg/i);
    expect(result.image).toBeUndefined();
    expect(result.visualPath).toBe('deterministic_svg');
    expect(result.attempts).toBe(0);
    expect(requests.some((r) => r.task === 'image')).toBe(false);
  });

  it('renders a solid cube deterministically at 100% coverage without AI', async () => {
    const { generate, requests } = scripted([PASS]);
    const result = await generateFigure(SOLID_QUESTION, generate, { LC_EVAL_MODE: 'off' });
    expect(result.status).toBe('verified');
    expect(result.svg).toMatch(/<svg/i);
    expect(result.svg).toContain('4 inches');
    expect(result.coverage?.pct).toBe(100);
    expect(result.image).toBeUndefined();
    expect(result.visualPath).toBe('deterministic_svg');
    expect(requests.some((r) => r.task === 'image')).toBe(false);
  });

  it('omits AI for count stems that lack both a renderable visualSpec and a figure trigger', async () => {
    const { generate, requests } = scripted([PASS]);
    const result = await generateFigure(
      {
        kind: 'question',
        grade: 'Kindergarten',
        text: 'How many stars are in the box?',
        options: ['7', '8'],
        correctAnswerIndex: 1,
        visualIntent: 'Count the stars.',
      },
      generate,
      { LC_EVAL_MODE: 'off', FIGURE_EVERY_QUESTION: 'false' },
    );
    expect(result.status).toBe('skipped');
    expect(result.image).toBeUndefined();
    expect(result.svg).toBeUndefined();
    expect(requests.some((r) => r.task === 'image')).toBe(false);
  });

  it('returns a verified data URL when the reviewer passes the first render', async () => {
    const { generate, requests } = scripted([PASS]);
    const result = await generateFigure(QUESTION, generate, { LC_EVAL_MODE: 'off' });
    expect(result.status).toBe('verified');
    expect(result.image).toBe('data:image/jpeg;base64,SU1H');
    expect(result.attempts).toBe(1);
    expect(requests.map((r) => r.task)).toEqual(['figure_brief', 'image', 'vision']);
  });

  it('sends the vision reviewer the actual image bytes', async () => {
    const { generate, requests } = scripted([PASS]);
    await generateFigure(QUESTION, generate, { LC_EVAL_MODE: 'off' });
    const vision = requests.find((r) => r.task === 'vision')!;
    expect(vision.contents.parts[0].inlineData).toEqual({ mimeType: 'image/jpeg', data: 'SU1H' });
  });

  it('retries once with the reviewer issues and passes', async () => {
    const fail = { ...PASS, quantitiesCorrect: false, issues: ['Draw exactly 8 stars; the image has 9.'] };
    const { generate, requests } = scripted([fail, PASS]);
    const result = await generateFigure(QUESTION, generate, { LC_EVAL_MODE: 'off' });
    expect(result.status).toBe('verified');
    expect(result.attempts).toBe(2);
    const prompts = imagePrompts(requests);
    expect(prompts[0]).not.toContain('reviewer rejected');
    expect(prompts[1]).toContain('Draw exactly 8 stars; the image has 9.');
  });

  it('flags for review and returns no image when both renders fail review', async () => {
    const fail = { ...PASS, matchesBrief: false, issues: ['Unrelated classroom scene.'] };
    const { generate } = scripted([fail, fail]);
    const result = await generateFigure(QUESTION, generate, { LC_EVAL_MODE: 'off' });
    expect(result.status).toBe('needs_review');
    expect(result.image).toBeUndefined();
    expect(result.issues).toEqual(['Unrelated classroom scene.']);
  });

  it('flags a figure that reveals the answer even if everything else is right', async () => {
    const leak = { ...PASS, revealsAnswer: true, issues: [] };
    const { generate } = scripted([leak, leak]);
    const result = await generateFigure(QUESTION, generate, { LC_EVAL_MODE: 'off' });
    expect(result.status).toBe('needs_review');
    expect(result.issues).toEqual(['Figure reveals the answer.']);
  });

  it('does not treat revealsAnswer as a failure for lesson slides', async () => {
    const { generate } = scripted([{ ...PASS, revealsAnswer: true }]);
    const result = await generateFigure(
      { kind: 'slide', grade: 'Grade 4', title: 'Add fifths', visualDescription: 'A fraction strip.' },
      generate,
      { LC_EVAL_MODE: 'off' },
    );
    expect(result.status).toBe('verified');
  });

  // Boxes of the stem's numbers ("0.5 × 0.05 = ?" for a comparison item) looked
  // matched to the contract but explained nothing; omit instead.
  it.each([
    ['What is 2 + 2?', ['3', '4'], 1],
    ['What is 2 6/100 written as a decimal?', ['2.06', '2.6', '2.60', '0.26'], 0],
    [
      'A snail traveled 0.5 meter in the morning and 0.05 meter in the afternoon. How many times as far did it travel in the morning?',
      ['10 times', '100 times', '1/10 as far', '5 times'],
      0,
    ],
  ])('omits the figure for a numeric stem with no math model: %s', async (text, options, correctAnswerIndex) => {
    const { generate, requests } = scripted([], { ...BRIEF, needsFigure: false, skipReason: 'Pure computation.' });
    const result = await generateFigure(
      { kind: 'question', grade: 'Grade 4', text, options, correctAnswerIndex },
      generate,
      { LC_EVAL_MODE: 'off', FIGURE_EVERY_QUESTION: 'false' },
    );
    // Either way the student gets the text-only item.
    expect(['skipped', 'needs_review']).toContain(result.status);
    expect(result.svg).toBeUndefined();
    expect(requests.some((r) => r.task === 'image')).toBe(false);
  });

  it('skips the render when a stem gives nothing a figure could show', async () => {
    const { generate, requests } = scripted([], { ...BRIEF, needsFigure: false, skipReason: 'Pure concept.' });
    const result = await generateFigure(
      {
        kind: 'question',
        grade: 'Grade 4',
        text: 'Explain why the sum of two even numbers is always even.',
        options: ['Because even numbers can be paired', 'Because odd numbers are larger'],
        correctAnswerIndex: 0,
      },
      generate,
      { LC_EVAL_MODE: 'off', FIGURE_EVERY_QUESTION: 'false' },
    );
    expect(result.status).toBe('skipped');
    expect(result.issues.length).toBeGreaterThan(0);
    expect(requests.some((r) => r.task === 'image')).toBe(false);
  });

  // Audit repros: keyword reconcilers drew a ten-frame for "7/2 in word form" (FR)
  // and a dot row for a line-plot question (DP).
  it.each([
    ['MA.3.FR.1.3', 'How is the fraction 7/2 written in numeral-word form?', ['7 halves', '2 sevenths'], { visualType: 'ten_frame', values: [1, 1, 1, 1, 1, 1, 1, 0, 0, 0] }],
    ['MA.3.DP.1.2', 'A line plot shows 3 ribbons that are 4 inches long. How many ribbons are 4 inches?', ['3', '4'], { visualType: 'array_model', gridRows: 1, gridCols: 3, values: [1, 1, 1] }],
  ])('rejects a figure type the standard does not use (%s)', async (standardCode, text, options, visualSpec) => {
    const { generate, requests } = scripted([]);
    const result = await generateFigure(
      { kind: 'question', grade: 'Grade 3', standardCode, text, options, correctAnswerIndex: 0, visualSpec: visualSpec as never },
      generate,
      { LC_EVAL_MODE: 'off', FIGURE_EVERY_QUESTION: 'false' },
    );
    expect(result.status).toBe('needs_review');
    expect(result.issues.join(' ')).toMatch(/standard/);
    expect(requests.some((r) => r.task === 'image')).toBe(false);
  });

  it('keeps a ten-frame for a K counting standard', async () => {
    const { generate } = scripted([]);
    const result = await generateFigure(EXACT_QUESTION, generate, { LC_EVAL_MODE: 'off' });
    expect(result.status).toBe('verified');
  });

  it('flags for review instead of passing when the reviewer itself fails', async () => {
    const generate = async (request: GenerateRequest): Promise<GenerateResponse> => {
      if (request.task === 'figure_brief') return text(BRIEF);
      if (request.task === 'image') return image();
      throw new Error('OpenAI text error: 503');
    };
    const result = await generateFigure(QUESTION, generate, { LC_EVAL_MODE: 'off' });
    expect(result.status).toBe('needs_review');
    expect(result.image).toBeUndefined();
  });

  it('renders a complete deterministic figure for named measured rectangles', async () => {
    const { generate, requests } = scripted([]);
    const result = await generateFigure(
      {
        kind: 'question',
        grade: 'Grade 4',
        standardCode: 'MA.4.GR.2.2',
        text: 'Rectangle A has a length of 9 inches and a width of 4 inches. Rectangle B has a length of 12 inches. Both rectangles have an area of 36 square inches. Which statement is true?',
        options: [
          'Rectangle A has a greater area than Rectangle B',
          'Rectangle B has a greater perimeter than Rectangle A',
          'Both rectangles have the same perimeter',
          'Rectangle A and Rectangle B have the same length',
        ],
        correctAnswerIndex: 1,
      },
      generate,
      { LC_EVAL_MODE: 'off' },
    );
    expect(result.status).toBe('verified');
    expect(result.visualPath).toBe('deterministic_svg');
    expect(result.coverage?.pct).toBe(100);
    expect(result.svg).toContain('Rectangle A');
    expect(result.svg).toContain('9 inches');
    expect(result.svg).toContain('Rectangle B');
    expect(result.svg).toContain('12 inches');
    expect(result.svg).toContain('36 square inches');
    expect(requests.some((r) => r.task === 'image')).toBe(false);
  });

  it('returns unverified images only when verification is switched off', async () => {
    const { generate, requests } = scripted([]);
    const result = await generateFigure(QUESTION, generate, { FIGURE_VERIFY: 'false' });
    expect(result.status).toBe('unverified');
    expect(requests.some((r) => r.task === 'vision')).toBe(false);
  });

  it('renders a deterministic area model for a fraction-product stem without a supplied spec', async () => {
    const { generate, requests } = scripted([]);
    const result = await generateFigure(
      {
        kind: 'question',
        grade: 'Grade 5',
        standardCode: 'MA.5.FR.2.2',
        text: 'A square represents 1 whole. The square is divided horizontally into 3 equal rows, and 2 rows are shaded yellow. The square is also divided vertically into 5 equal columns, and 4 columns are shaded blue. The region where the yellow and blue shading overlaps is green. What multiplication equation represents the green overlapping region?',
        options: ['2/3 x 4/5 = 8/15', '2/3 x 4/5 = 8/8', '2/3 + 4/5 = 6/8', '2/5 x 3/1 = 6/20'],
        correctAnswerIndex: 0,
      },
      generate,
      { LC_EVAL_MODE: 'off' },
    );
    expect(result.status).toBe('verified');
    expect(result.visualPath).toBe('deterministic_svg');
    expect(result.svg).toContain('#86efac');
    expect(requests.some((r) => r.task === 'image')).toBe(false);
  });

  it('falls back to prompt generation from the question when no skeleton matches', async () => {
    const { generate, requests } = scripted([PASS]);
    const result = await generateFigure(
      {
        kind: 'question',
        grade: 'Grade 3',
        text: 'Look at the picture. Which object is longest?',
        options: ['pencil', 'book', 'eraser'],
        correctAnswerIndex: 0,
      },
      generate,
      { LC_EVAL_MODE: 'off' },
    );
    expect(result.status).toBe('verified');
    expect(result.image).toBe('data:image/jpeg;base64,SU1H');
    expect(result.visualPath).toBe('openai_image_fallback');
    expect(requests.map((r) => r.task)).toEqual(['figure_brief', 'image', 'vision']);
  });

  // The stem spells out the area model, so its exact model replaces the wrong array; the wrong one is never drawn.
  it('never renders a spec that disagrees with the stem', async () => {
    const { generate, requests } = scripted([]);
    const result = await generateFigure(
      {
        kind: 'question',
        grade: 'Grade 5',
        standardCode: 'MA.5.FR.2.2',
        text: 'A square represents 1 whole. The square is divided horizontally into 3 equal rows, and 2 rows are shaded yellow. The square is also divided vertically into 5 equal columns, and 4 columns are shaded blue. The region where the yellow and blue shading overlaps is green. What multiplication equation represents the green overlapping region?',
        options: ['2/3 x 4/5 = 8/15', '2/3 x 4/5 = 8/8', '2/3 + 4/5 = 6/8', '2/5 x 3/1 = 6/20'],
        correctAnswerIndex: 0,
        visualSpec: {
          visualType: 'array_model',
          gridRows: 3,
          gridCols: 5,
          values: [1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
          rowColors: ['red', 'blue', 'green'],
          title: '3 red + 5 blue + 4 green',
        },
      },
      generate,
      { LC_EVAL_MODE: 'off' },
    );
    expect(result.status).toBe('verified');
    expect(result.svg).not.toContain('3 red + 5 blue + 4 green');
    expect(result.image).toBeUndefined();
    expect(requests.some((r) => r.task === 'image')).toBe(false);
  });
});

describe('composeFigureImagePrompt', () => {
  const brief = normalizeFigureBrief(BRIEF);

  it('describes the drawable elements instead of pasting the question sentence', () => {
    const prompt = composeFigureImagePrompt(brief, QUESTION);
    expect(prompt).toContain('exactly 8 yellow stars');
    expect(prompt).not.toContain('Which picture shows a group of friends sharing?');
  });

  it('forbids all text when the brief has no labels and lists labels verbatim otherwise', () => {
    expect(composeFigureImagePrompt(brief, QUESTION)).toContain('No words, numbers or letters anywhere');
    const labelled = composeFigureImagePrompt({ ...brief, labels: ['l', '(4x + 10)°'] }, QUESTION);
    expect(labelled).toContain('"l", "(4x + 10)°"');
  });
});

// Product decision (2026-10-22): every question gets a picture; after two failed attempts it ships without one.
describe('every question gets an image', () => {
  const WORD = {
    kind: 'question' as const,
    grade: 'Grade 4',
    text: 'A baker makes 24 muffins and puts them into 6 boxes with the same number in each box. How many muffins are in each box?',
    options: ['4', '6', '18', '30'],
    correctAnswerIndex: 0,
  };

  it('draws a picture for a numeric word problem with no exact model', async () => {
    const { generate, requests } = scripted([PASS]);
    const result = await generateFigure(WORD, generate, { LC_EVAL_MODE: 'off' });
    expect(result.status).toBe('verified');
    expect(result.image).toBeTruthy();
    expect(requests.filter((r) => r.task === 'image')).toHaveLength(1);
  });

  it('ships without a picture after two failed attempts', async () => {
    const FAIL = { ...PASS, quantitiesCorrect: false, issues: ['wrong number of muffins'] };
    const { generate, requests } = scripted([FAIL, FAIL]);
    const result = await generateFigure(WORD, generate, { LC_EVAL_MODE: 'off' });
    expect(result.status).toBe('needs_review');
    expect(result.image).toBeUndefined();
    expect(requests.filter((r) => r.task === 'image')).toHaveLength(2);
  });
});

describe('every question gets an image: rejected specs and digital clocks (audit round 2)', () => {
  it('falls back to a verified picture when the attached spec is rejected', async () => {
    const { generate, requests } = scripted([PASS]);
    const result = await generateFigure(
      {
        kind: 'question',
        grade: 'Grade 1',
        standardCode: 'MA.1.GR.1.3',
        text: 'Maya puts 2 identical squares together side by side so their edges touch completely. What new shape does she make?',
        options: ['A rectangle', 'A triangle', 'A circle', 'A hexagon'],
        correctAnswerIndex: 0,
        visualSpec: { visualType: 'ten_frame', values: [1, 1, 0, 0, 0, 0, 0, 0, 0, 0] },
      },
      generate,
      { LC_EVAL_MODE: 'off' },
    );
    expect(result.status).toBe('verified');
    expect(result.image).toBeTruthy();
    expect(requests.filter((r) => r.task === 'image')).toHaveLength(1);
  });

  it('does not draw an analog clock for a digital-clock question', async () => {
    const { generate } = scripted([PASS]);
    const result = await generateFigure(
      { kind: 'question', grade: 'Grade 1', standardCode: 'MA.1.M.2.1', text: 'A class has art at half past 2. Which digital clock shows the time when art starts?', options: ['2:30', '3:30', '2:00', '12:30'], correctAnswerIndex: 0 },
      generate,
      { LC_EVAL_MODE: 'off' },
    );
    expect(result.visualPath).not.toBe('deterministic_svg');
  });
});
