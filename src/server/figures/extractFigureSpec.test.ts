import { describe, expect, it } from 'vitest';
import type { GenerateRequest, GenerateResponse } from '../ai/types';
import { extractFigureSpec } from './extractFigureSpec';
import { generateFigure } from './generateFigure';
import type { QuestionFigureInput } from './types';

const reply = (body: unknown): GenerateResponse => ({
  text: JSON.stringify(body),
  candidates: [],
  provider: 'gemini',
  model: 'gemini-3-flash-preview',
});

/** Answers the spec-extraction call with `spec`; any other model call fails the test. */
const extractor = (spec: unknown) => {
  const requests: GenerateRequest[] = [];
  const generate = async (request: GenerateRequest): Promise<GenerateResponse> => {
    requests.push(request);
    if (request.metadata?.purpose === 'figure_spec') return reply(spec);
    throw new Error(`unexpected call: ${request.task}`);
  };
  return { generate, requests };
};

const ENV = { LC_EVAL_MODE: 'off' };

const AREA: QuestionFigureInput = {
  kind: 'question',
  grade: 'Grade 5',
  standardCode: 'MA.5.FR.2.2',
  text: 'An area model is divided into 5 equal columns and 4 equal rows. Shading covers 3 of the 5 columns, and a crosshatch pattern covers 1 of the 4 rows. What fraction of the entire area model is covered by both shading and the crosshatch pattern?',
  options: ['3/20', '4/9', '3/9', '4/20'],
  correctAnswerIndex: 0,
  // What the quiz model actually sent in the screenshot: a strip of the answer.
  visualSpec: { visualType: 'fraction_bar', totalParts: 20, shadedParts: 3 },
};

const BAR: QuestionFigureInput = {
  kind: 'question',
  grade: 'Grade 2',
  standardCode: 'MA.2.DP.1.2',
  text: 'The bar graph shows the number of books read: Maya read 8 books, Leo read 5 books, and Sam read 3 books. How many more books did Maya read than Leo?',
  options: ['3', '5', '8', '13'],
  correctAnswerIndex: 0,
  visualSpec: { visualType: 'bar_chart', values: [8, 5, 3] },
};

const LINE: QuestionFigureInput = {
  kind: 'question',
  grade: 'Grade 4',
  standardCode: 'MA.4.FR.1.2',
  text: 'A number line from 0 to 1 is divided into 10 equal parts. A point is plotted at 6/10. Which decimal names the point?',
  options: ['0.06', '0.6', '6.0', '0.16'],
  correctAnswerIndex: 1,
};

describe('extractFigureSpec', () => {
  it('turns the screenshot area-model stem into the area model it describes', async () => {
    const { generate } = extractor({ fits: true, gridRows: 4, gridCols: 5, highlightRows: 1, highlightCols: 3 });
    expect(await extractFigureSpec(AREA, generate, ENV)).toMatchObject({
      visualType: 'area_model', gridRows: 4, gridCols: 5, highlightRows: 1, highlightCols: 3,
    });
  });

  it('asks for the type the stem names, not the strip the quiz model sent', async () => {
    const { generate, requests } = extractor({ fits: true, gridRows: 4, gridCols: 5, highlightRows: 1, highlightCols: 3 });
    await extractFigureSpec(AREA, generate, ENV);
    expect(Object.keys(requests[0].config.responseSchema.properties)).toContain('highlightRows');
  });

  it('asks for a line plot when a line-plot stem also says "number line"', async () => {
    const { generate, requests } = extractor({ fits: true, min: 5, max: 9, tickStep: 1, values: [5, 6], xLabel: '' });
    await extractFigureSpec({ ...BAR, standardCode: 'MA.3.DP.1.2', text: 'A line plot shows ribbon lengths. A number line is labeled from 5 to 9. Above 5, there are 2 Xs.', visualSpec: { visualType: 'line_plot' } }, generate, ENV);
    expect(requests).toHaveLength(1);
    expect(String(requests[0].contents)).toMatch(/line plot/);
  });

  it('asks for an area model for a product of two fractions', async () => {
    const { generate, requests } = extractor({ fits: false });
    await extractFigureSpec({ ...AREA, text: 'What is the product of 3/4 and 2/5?', options: ['6/20', '5/9', '1/2', '3/5'] }, generate, ENV);
    expect(String(requests[0].contents)).toMatch(/area model/);
  });

  it('asks for an area model for the area of a fraction-by-fraction rectangle', async () => {
    const { generate, requests } = extractor({ fits: false });
    await extractFigureSpec({ ...AREA, text: 'A rectangular garden bed measures 3/4 yard long and 2/5 yard wide. What is the area of the garden bed?' }, generate, ENV);
    expect(String(requests[0].contents)).toMatch(/area model/);
  });

  it('draws a tally stem as tally marks, not a number table', async () => {
    const { generate, requests } = extractor({ fits: true, categories: ['Dogs', 'Birds'], values: [5, 3], xLabel: '', yLabel: '', tickStep: 1 });
    const spec = await extractFigureSpec({ ...BAR, standardCode: 'MA.1.DP.1.2', text: 'A tally chart records pets seen at a park. Dogs has 5 tally marks. Birds has 3 tally marks. How many pets in all?', visualSpec: { visualType: 'table' } }, generate, ENV);
    expect(String(requests[0].contents)).toMatch(/bar chart/);
    expect(spec).toMatchObject({ visualType: 'bar_chart', chartStyle: 'tally' });
  });

  it('draws "each picture stands for 2 votes" as a picture graph with that key', async () => {
    const { generate } = extractor({ fits: true, categories: ['Apples', 'Bananas'], values: [6, 4], xLabel: '', yLabel: 'votes', tickStep: 2 });
    const spec = await extractFigureSpec({ ...BAR, standardCode: 'MA.1.DP.1.2', text: 'A class votes on favorite fruits. Each picture stands for 2 votes. Apples have 6 votes and Bananas have 4 votes. How many more votes did Apples get?', visualSpec: { visualType: 'table' } }, generate, ENV);
    expect(spec).toMatchObject({ visualType: 'bar_chart', chartStyle: 'pictures', iconUnit: 2 });
  });

  it('asks for the display title the question names', async () => {
    const { generate, requests } = extractor({ fits: true, title: 'Favorite Fruits', categories: ['Apples', 'Pears'], values: [8, 5], xLabel: '', yLabel: '', tickStep: 0 });
    const spec = await extractFigureSpec({ ...BAR, text: 'A bar graph titled Favorite Fruits shows Apples has 8 votes and Pears has 5 votes. How many more?' }, generate, ENV);
    expect(Object.keys(requests[0].config.responseSchema.properties)).toContain('title');
    expect(spec?.title).toBe('Favorite Fruits');
  });

  it.each([
    ['fits:false', { fits: false, gridRows: 4, gridCols: 5, highlightRows: 1, highlightCols: 3 }],
    ['empty reply', null],
  ])('returns null on %s', async (_label, spec) => {
    const { generate } = extractor(spec);
    expect(await extractFigureSpec(AREA, generate, ENV)).toBeNull();
  });

  it('returns null without calling the model for an unsupported figure', async () => {
    const { generate, requests } = extractor({ fits: true });
    const clock: QuestionFigureInput = { ...BAR, standardCode: 'MA.3.M.2.1', text: 'The clock shows 4:15. What time is it?', visualSpec: { visualType: 'clock_face' } };
    expect(await extractFigureSpec(clock, generate, ENV)).toBeNull();
    expect(requests).toHaveLength(0);
  });

  it('is off when FIGURE_SPEC_EXTRACT=false', async () => {
    const { generate, requests } = extractor({ fits: true });
    expect(await extractFigureSpec(AREA, generate, { ...ENV, FIGURE_SPEC_EXTRACT: 'false' })).toBeNull();
    expect(requests).toHaveLength(0);
  });

  it('survives a thrown model error', async () => {
    const generate = async (): Promise<GenerateResponse> => { throw new Error('boom'); };
    expect(await extractFigureSpec(AREA, generate, ENV)).toBeNull();
  });
});

describe('generateFigure with spec extraction', () => {
  it('publishes the extracted area model and returns the spec it drew', async () => {
    const { generate } = extractor({ fits: true, gridRows: 4, gridCols: 5, highlightRows: 1, highlightCols: 3 });
    const result = await generateFigure(AREA, generate, ENV);
    expect(result.status).toBe('verified');
    expect(result.visualPath).toBe('deterministic_svg');
    expect(result.visualSpec).toMatchObject({ visualType: 'area_model', gridRows: 4, gridCols: 5 });
  });

  it('publishes a bar chart with the stem categories', async () => {
    const { generate } = extractor({ fits: true, categories: ['Maya', 'Leo', 'Sam'], values: [8, 5, 3], xLabel: 'Student', yLabel: 'Books read' });
    const result = await generateFigure(BAR, generate, ENV);
    expect(result.status).toBe('verified');
    expect(result.svg).toContain('>Leo</text>');
  });

  // Labelling every tenth would print the answer (0.6) under the point; label only whole numbers.
  it('publishes a 0-1 number line with the given point and only 0 and 1 labelled', async () => {
    const { generate } = extractor({ fits: true, min: 0, max: 1, tickStep: 0.1, values: [0.6] });
    const result = await generateFigure(LINE, generate, ENV);
    expect(result.status).toBe('verified');
    expect(result.svg).toContain('>1</text>');
    expect(result.svg).not.toContain('>0.6</text>');
  });

  it('publishes a table from the stem rows', async () => {
    const { generate } = extractor({ fits: true, columns: ['Pet', 'Votes'], rows: [['Dog', '12'], ['Cat', '8'], ['Bird', '4']] });
    const result = await generateFigure(
      { ...BAR, text: 'A tally table shows votes for a class pet: Dog has 12 votes, Cat has 8 votes, and Bird has 4 votes. How many more votes did Dog get than Cat?', options: ['4', '8', '12', '20'], visualSpec: { visualType: 'table' } },
      generate,
      ENV,
    );
    expect(result.status).toBe('verified');
    expect(result.svg).toContain('>Dog</text>');
  });

  // Line plots from the model usually have no axis title; the renderer must not require one.
  it('publishes a line plot without an axis label', async () => {
    const { generate } = extractor({ fits: true, min: 0, max: 4, tickStep: 1, values: [0, 1, 1, 2, 2, 2, 4], xLabel: '' });
    const result = await generateFigure(
      { ...BAR, standardCode: 'MA.6.DP.1.4', grade: 'Grade 6', text: 'A line plot shows goals scored: 1 dot at 0, 2 dots at 1, 3 dots at 2, and 1 dot at 4. What is the range of the data?', options: ['4', '3', '2', '7'], visualSpec: { visualType: 'line_plot' } },
      generate,
      ENV,
    );
    expect(result.status).toBe('verified');
  });

  it('rejects an extraction that disagrees with the stem and falls back', async () => {
    // Wrong range: the stem says 0 to 1.
    const { generate } = extractor({ fits: true, min: 0, max: 10, tickStep: 1, values: [6] });
    const result = await generateFigure(LINE, generate, ENV);
    expect(result.visualSpec).toBeUndefined();
    expect(result.svg ?? '').not.toContain('>10</text>');
  });
});
