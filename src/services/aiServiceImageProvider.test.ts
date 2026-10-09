import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateQuiz } from './aiService';

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const STANDARD = {
  code: 'MA.8.GR.1.2',
  description: 'Apply the Pythagorean Theorem.',
  grade: 'Grade 8',
  clarifications: [],
  examples: [],
  purposeAndStrategies: [],
  misconceptions: [],
  tieredInstruction: [],
};

const QUIZ_CONFIG = {
  questionCount: 1,
  difficulty: 'Medium',
  questionTypes: [],
  focusAreas: [],
  adaptiveEnabled: false,
  sourcePolicy: 'ai_freedom',
} as const;

const LADDER_QUESTION = {
  id: 'q1',
  text: 'A ladder leans against a wall. The foot of the ladder is 6 feet from the wall and the top reaches 8 feet up the wall. How long is the ladder?',
  options: ['9 ft', '10 ft', '12 ft', '14 ft'],
  correctAnswerIndex: 1,
  explanation: 'Use the Pythagorean theorem.',
  solutionSteps: [
    { title: 'Identify', body: 'The wall and ground form a right angle.' },
    { title: 'Setup', body: 'Legs are 6 ft and 8 ft.' },
    { title: 'Solve', body: 'The ladder is 10 feet.' },
  ],
  animationDescription: '',
  visualIntent: 'Use the right triangle in the picture.',
  figureHints: ['Find the 6 ft and 8 ft legs.', 'The ladder is the hypotenuse.'],
  imagePrompt: 'Ladder against a wall, 6 ft from the wall, 8 ft up.',
  difficulty: 'Medium',
  sourceType: 'novel',
  sourceProvider: 'UNKNOWN',
  providerItemId: '',
  generatedByAi: true,
};

const FRACTION_BAR_QUESTION = {
  ...LADDER_QUESTION,
  text: 'What fraction of the bar is shaded?',
  options: ['1/4', '2/4', '3/4', '4/4'],
  correctAnswerIndex: 2,
  visualIntent: 'Count shaded parts.',
  figureHints: ['Count the shaded parts.'],
  imagePrompt: '',
  visualSpec: { visualType: 'fraction_bar', totalParts: 4, shadedParts: 3 },
};

const FAKE_IMAGE = `data:image/jpeg;base64,${Buffer.from('fake jpeg').toString('base64')}`;

type FigureReply = { status: number; body: unknown };

const installFetch = (question: unknown, figureReply: FigureReply, extra?: (url: string) => Response | null) => {
  const calls: Array<{ url: string; body: any }> = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const body = JSON.parse(String(init?.body || '{}'));
      calls.push({ url, body });
      const extraResponse = extra?.(url);
      if (extraResponse) return extraResponse;
      if (url.includes('/api/figures/question')) return jsonResponse(figureReply.body, figureReply.status);
      if (body.task === 'quiz') {
        return jsonResponse({
          text: JSON.stringify({ standardCode: STANDARD.code, questions: [question] }),
          provider: 'openai',
          model: 'gpt-5.4',
        });
      }
      throw new Error(`Unexpected request: ${url} ${body.task || ''}`);
    }),
  );
  return calls;
};

describe('generateQuiz figures', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('sends each question to the verified figure endpoint and uses the returned image', async () => {
    vi.spyOn(console, 'info').mockImplementation(() => {});
    const calls = installFetch(LADDER_QUESTION, {
      status: 200,
      body: { status: 'verified', image: FAKE_IMAGE, attempts: 1, issues: [], elapsedMs: 10 },
    });

    const quiz = await generateQuiz(STANDARD, QUIZ_CONFIG);
    const figureCall = calls.find((c) => c.url.includes('/api/figures/question'));

    expect(figureCall?.body.grade).toBe('Grade 8');
    expect(figureCall?.body.standardCode).toBe(STANDARD.code);
    expect(figureCall?.body.question.text).toBe(LADDER_QUESTION.text);
    expect(figureCall?.body.question.options).toEqual(LADDER_QUESTION.options);
    expect(figureCall?.body.question.correctAnswerIndex).toBe(1);
    expect(calls.some((c) => c.body.task === 'image' || c.body.task === 'vision')).toBe(false);

    const q = quiz.questions[0];
    expect(q.generatedImageBase64).toBe(FAKE_IMAGE);
    expect(q.visual).toBe('');
    expect(q.visualPath).toBe('openai_image');
    expect(q.figureStatus).toBe('verified');
  });

  it('marks images that needed a second render as retries', async () => {
    vi.spyOn(console, 'info').mockImplementation(() => {});
    installFetch(LADDER_QUESTION, {
      status: 200,
      body: { status: 'verified', image: FAKE_IMAGE, attempts: 2, issues: [], elapsedMs: 10 },
    });

    const quiz = await generateQuiz(STANDARD, QUIZ_CONFIG);
    expect(quiz.questions[0].visualPath).toBe('openai_image_retry');
  });

  it('falls back to the deterministic SVG when the figure is rejected and a visualSpec exists', async () => {
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    installFetch(FRACTION_BAR_QUESTION, {
      status: 200,
      body: { status: 'rejected', attempts: 2, issues: ['Wrong number of parts.'], elapsedMs: 10 },
    });

    const quiz = await generateQuiz(STANDARD, QUIZ_CONFIG);
    const q = quiz.questions[0];
    expect(q.generatedImageBase64).toBeUndefined();
    expect(q.visual).toMatch(/^<svg/);
    expect(q.visualPath).toBe('fallback_svg');
    expect(q.figureStatus).toBe('rejected');
    expect(q.figureIssues).toEqual(['Wrong number of parts.']);
  });

  it('shows no figure when the figure is rejected and nothing else can be drawn', async () => {
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    installFetch(LADDER_QUESTION, {
      status: 200,
      body: { status: 'rejected', attempts: 2, issues: ['Ladder touches the wall at 6 ft.'], elapsedMs: 10 },
    });

    const quiz = await generateQuiz(STANDARD, QUIZ_CONFIG);
    const q = quiz.questions[0];
    expect(q.generatedImageBase64).toBeUndefined();
    expect(q.visual || '').toBe('');
    expect(q.visualPath).toBe('figure_rejected');
    expect(q.figureHints).toEqual([]);
  });

  it('draws nothing when the figure director decides a figure would not help', async () => {
    vi.spyOn(console, 'info').mockImplementation(() => {});
    installFetch(FRACTION_BAR_QUESTION, {
      status: 200,
      body: { status: 'skipped', attempts: 0, issues: ['A figure would reveal the answer.'], elapsedMs: 10 },
    });

    const quiz = await generateQuiz(STANDARD, QUIZ_CONFIG);
    const q = quiz.questions[0];
    expect(q.visual || '').toBe('');
    expect(q.generatedImageBase64).toBeUndefined();
    expect(q.visualPath).toBe('figure_skipped');
    expect(q.figureHints).toEqual([]);
  });

  it('treats a failing figure endpoint like a rejection', async () => {
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    installFetch(FRACTION_BAR_QUESTION, { status: 500, body: { error: 'boom' } });

    const quiz = await generateQuiz(STANDARD, QUIZ_CONFIG);
    const q = quiz.questions[0];
    expect(q.visualPath).toBe('fallback_svg');
    expect(q.figureStatus).toBe('error');
  });

  it('attaches GeoGebra PNG without changing primary visual path', async () => {
    vi.stubEnv('VITE_GEOGEBRA_VISUALS_ENABLED', 'true');
    vi.spyOn(console, 'info').mockImplementation(() => {});
    installFetch(
      FRACTION_BAR_QUESTION,
      { status: 200, body: { status: 'verified', image: FAKE_IMAGE, attempts: 1, issues: [], elapsedMs: 10 } },
      (url) =>
        url.includes('/api/geogebra/render')
          ? jsonResponse({ base64: Buffer.from('ggb-png').toString('base64') })
          : null,
    );

    const quiz = await generateQuiz(STANDARD, QUIZ_CONFIG);
    expect(quiz.questions[0].visualPath).toBe('openai_image');
    expect(quiz.questions[0].geogebraImageBase64).toMatch(/^data:image\/png;base64,/);
  });
});
