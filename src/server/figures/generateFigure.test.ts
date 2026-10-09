import { describe, expect, it } from 'vitest';
import type { GenerateRequest, GenerateResponse } from '../ai/types';
import { composeFigureImagePrompt, normalizeFigureBrief } from './figureBrief';
import { generateFigure } from './generateFigure';
import type { FigureInput } from './types';

const QUESTION: FigureInput = {
  kind: 'question',
  grade: 'Kindergarten',
  standardCode: 'MA.K.NSO.1.1',
  text: 'Count the stars in the box. How many stars are there?',
  options: ['7', '8', '9', '10'],
  correctAnswerIndex: 1,
  visualIntent: 'Count the stars.',
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
  it('returns a verified data URL when the reviewer passes the first render', async () => {
    const { generate, requests } = scripted([PASS]);
    const result = await generateFigure(QUESTION, generate, {});
    expect(result.status).toBe('verified');
    expect(result.image).toBe('data:image/jpeg;base64,SU1H');
    expect(result.attempts).toBe(1);
    expect(requests.map((r) => r.task)).toEqual(['figure_brief', 'image', 'vision']);
  });

  it('sends the vision reviewer the actual image bytes', async () => {
    const { generate, requests } = scripted([PASS]);
    await generateFigure(QUESTION, generate, {});
    const vision = requests.find((r) => r.task === 'vision')!;
    expect(vision.contents.parts[0].inlineData).toEqual({ mimeType: 'image/jpeg', data: 'SU1H' });
  });

  it('retries once with the reviewer issues and passes', async () => {
    const fail = { ...PASS, quantitiesCorrect: false, issues: ['Draw exactly 8 stars; the image has 9.'] };
    const { generate, requests } = scripted([fail, PASS]);
    const result = await generateFigure(QUESTION, generate, {});
    expect(result.status).toBe('verified');
    expect(result.attempts).toBe(2);
    const prompts = imagePrompts(requests);
    expect(prompts[0]).not.toContain('reviewer rejected');
    expect(prompts[1]).toContain('Draw exactly 8 stars; the image has 9.');
  });

  it('rejects and returns no image when both renders fail review', async () => {
    const fail = { ...PASS, matchesBrief: false, issues: ['Unrelated classroom scene.'] };
    const { generate } = scripted([fail, fail]);
    const result = await generateFigure(QUESTION, generate, {});
    expect(result.status).toBe('rejected');
    expect(result.image).toBeUndefined();
    expect(result.issues).toEqual(['Unrelated classroom scene.']);
  });

  it('rejects a figure that reveals the answer even if everything else is right', async () => {
    const leak = { ...PASS, revealsAnswer: true, issues: [] };
    const { generate } = scripted([leak, leak]);
    const result = await generateFigure(QUESTION, generate, {});
    expect(result.status).toBe('rejected');
    expect(result.issues).toEqual(['Figure reveals the answer.']);
  });

  it('does not treat revealsAnswer as a failure for lesson slides', async () => {
    const { generate } = scripted([{ ...PASS, revealsAnswer: true }]);
    const result = await generateFigure(
      { kind: 'slide', grade: 'Grade 4', title: 'Add fifths', visualDescription: 'A fraction strip.' },
      generate,
      {},
    );
    expect(result.status).toBe('verified');
  });

  it('skips the render when the director says a figure would add nothing or leak the answer', async () => {
    const { generate, requests } = scripted([], { ...BRIEF, needsFigure: false, skipReason: 'Pure computation.' });
    const result = await generateFigure(QUESTION, generate, {});
    expect(result.status).toBe('skipped');
    expect(result.issues).toEqual(['Pure computation.']);
    expect(requests.some((r) => r.task === 'image')).toBe(false);
  });

  it('rejects instead of passing when the reviewer itself fails', async () => {
    const generate = async (request: GenerateRequest): Promise<GenerateResponse> => {
      if (request.task === 'figure_brief') return text(BRIEF);
      if (request.task === 'image') return image();
      throw new Error('OpenAI text error: 503');
    };
    const result = await generateFigure(QUESTION, generate, {});
    expect(result.status).toBe('rejected');
    expect(result.image).toBeUndefined();
  });

  it('returns unverified images only when verification is switched off', async () => {
    const { generate, requests } = scripted([]);
    const result = await generateFigure(QUESTION, generate, { FIGURE_VERIFY: 'false' });
    expect(result.status).toBe('unverified');
    expect(requests.some((r) => r.task === 'vision')).toBe(false);
  });
});

describe('composeFigureImagePrompt', () => {
  const brief = normalizeFigureBrief(BRIEF);

  it('describes the drawable elements instead of pasting the question sentence', () => {
    const prompt = composeFigureImagePrompt(brief, QUESTION);
    expect(prompt).toContain('exactly 8 yellow stars');
    expect(prompt).not.toContain('How many stars are there?');
  });

  it('forbids all text when the brief has no labels and lists labels verbatim otherwise', () => {
    expect(composeFigureImagePrompt(brief, QUESTION)).toContain('No words, numbers or letters anywhere');
    const labelled = composeFigureImagePrompt({ ...brief, labels: ['l', '(4x + 10)°'] }, QUESTION);
    expect(labelled).toContain('"l", "(4x + 10)°"');
  });
});
