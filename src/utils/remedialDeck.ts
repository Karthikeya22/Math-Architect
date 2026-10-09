import type { RemedialSlide, RemedialSlideLayout, RemedialVocabEntry } from '../types';

export const SLIDE_LAYOUTS: readonly RemedialSlideLayout[] = [
  'gap_overview',
  'concept',
  'model',
  'worked_example',
  'mistake_fix',
  'try_it',
];

export const SLIDE_LAYOUT_LABELS: Record<RemedialSlideLayout, string> = {
  gap_overview: 'Where we got stuck',
  concept: 'Big idea',
  model: 'See it',
  worked_example: 'Worked example',
  mistake_fix: 'Common mistake',
  try_it: 'Your turn',
};

/** Decks saved before structured slides had five untyped slides in this order. */
const LEGACY_LAYOUT_ORDER: readonly RemedialSlideLayout[] = ['concept', 'model', 'worked_example', 'mistake_fix', 'try_it'];

export const resolveSlideLayout = (slide: { layout?: string }, index: number): RemedialSlideLayout =>
  slide.layout && (SLIDE_LAYOUTS as readonly string[]).includes(slide.layout)
    ? (slide.layout as RemedialSlideLayout)
    : LEGACY_LAYOUT_ORDER[index % LEGACY_LAYOUT_ORDER.length];

export const isLegacySlide = (slide: { layout?: string; keyPoints?: string[] }): boolean =>
  !slide.layout && !(slide.keyPoints && slide.keyPoints.length);

/** Lower index wins when the deck asks for more pictures than MAX_ILLUSTRATED_SLIDES. */
const ILLUSTRATION_PRIORITY: readonly RemedialSlideLayout[] = [
  'model',
  'concept',
  'worked_example',
  'mistake_fix',
  'gap_overview',
  'try_it',
];

const MAX_ILLUSTRATED_SLIDES = 3;
const MAX_KEY_POINTS = 4;
const MAX_TALKING_POINTS = 6;
const MAX_VOCAB = 4;
const MAX_STEPS = 5;
const MAX_MISSED_IN_PROMPT = 6;

export type MissedQuestion = {
  number: number;
  text: string;
  studentAnswer: string;
  correctAnswer: string;
  explanation: string;
};

type QuestionLike = { text?: string; options?: string[]; correctAnswerIndex?: number; explanation?: string };
type ResultLike = { questionIndex?: number; selectedOptionIndex?: number; isCorrect?: boolean };
type GapLike = { gapType?: string; description?: string; misconception?: string; relatedQuestions?: number[] };
type StandardLike = {
  code: string;
  grade: string;
  description?: string;
  clarifications?: string[];
  purposeAndStrategies?: string[];
  misconceptions?: string[];
};
type AnalysisLike = { identifiedGaps?: GapLike[]; summary?: string; teacherActions?: string[] };

const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const textList = (value: unknown, max: number): string[] =>
  Array.isArray(value) ? value.map(text).filter(Boolean).slice(0, max) : [];

export const buildMissedQuestionDigest = (
  questions: QuestionLike[] | undefined,
  results: ResultLike[] | undefined,
): MissedQuestion[] => {
  if (!Array.isArray(questions) || !Array.isArray(results)) return [];
  const missed: MissedQuestion[] = [];
  results.forEach((result, order) => {
    if (!result || result.isCorrect) return;
    const index = typeof result.questionIndex === 'number' ? result.questionIndex : order;
    const question = questions[index];
    if (!question) return;
    const options = Array.isArray(question.options) ? question.options : [];
    missed.push({
      number: index + 1,
      text: text(question.text),
      studentAnswer: text(options[result.selectedOptionIndex ?? -1]) || '(no answer)',
      correctAnswer: text(options[question.correctAnswerIndex ?? -1]),
      explanation: text(question.explanation),
    });
  });
  return missed;
};

const bulletList = (items: string[] | undefined, max = 5): string =>
  (items || []).map(text).filter(Boolean).slice(0, max).map((item) => `- ${item}`).join('\n') || '- none';

export const buildRemedialDeckPrompt = ({
  standard,
  analysis,
  missed,
}: {
  standard: StandardLike;
  analysis: AnalysisLike;
  missed: MissedQuestion[];
}): string => {
  const gaps = (analysis.identifiedGaps || [])
    .map((gap, i) => {
      const misconception = text(gap.misconception);
      return `Gap ${i + 1} (${text(gap.gapType) || 'Unknown'}): ${text(gap.description)}${misconception ? `\n  Student thinking: ${misconception}` : ''}`;
    })
    .join('\n');

  const missedBlock = missed.length
    ? missed
        .slice(0, MAX_MISSED_IN_PROMPT)
        .map(
          (q) =>
            `Q${q.number}: ${q.text}\n  Student chose: ${q.studentAnswer}\n  Correct answer: ${q.correctAnswer}${q.explanation ? `\n  Why: ${q.explanation}` : ''}`,
        )
        .join('\n')
    : 'No individual answers available. Work from the gaps above.';

  return `You are an experienced ${standard.grade} math interventionist writing a short reteach deck that a teacher will project and talk through with one student or a small group.

STANDARD: ${standard.code} (${standard.grade})
${text(standard.description)}
Clarifications:
${bulletList(standard.clarifications)}
Teaching strategies that work for this standard:
${bulletList(standard.purposeAndStrategies)}
Known misconceptions:
${bulletList(standard.misconceptions)}

DIAGNOSED GAPS:
${gaps || 'No gaps listed.'}
${text(analysis.summary) ? `Summary: ${text(analysis.summary)}` : ''}

QUESTIONS THE STUDENT MISSED:
${missedBlock}

WRITE EXACTLY 6 SLIDES, in this order, one per layout:
1. gap_overview - "Where we got stuck". Name what went wrong in the student's own answers (quote one wrong choice) without blame. keyPoints: what we will fix today.
2. concept - the big idea that repairs the main gap, in one plain sentence plus 2-3 supporting points.
3. model - a concrete model (for example a fraction bar, number line, array or diagram) that makes the big idea visible. Describe the picture in visualDescription.
4. worked_example - a fully worked problem with new numbers (never reuse a quiz question). Fill workedExample with the problem, 2-5 short steps and the answer.
5. mistake_fix - put the student's actual wrong method next to the correct one. Fill misconception: wrong (the wrong work, shown as math), why (why it is wrong, one sentence) and fix (the correct work).
6. try_it - one practice problem with new numbers in checkQuestion (prompt and answer) and a 1-2 point takeaway in keyPoints.

COPY RULES (the slides are projected, so less is more):
- title: a claim the student should remember, at most 8 words (for example "Fifths stay fifths when you add"). Not a topic label.
- subtitle: at most 12 words, optional.
- keyPoints: 2-4 points, each at most 14 words, written to the student at a ${standard.grade} reading level. Every point must match the numbers on its own slide. On worked_example, mistake_fix and try_it slides use only 1-2 keyPoints, a rule to remember, never a copy of the steps, the wrong/fix work or the problem.
- talkingPoints: 3-5 sentences the teacher says or asks out loud. Include at least one question to ask the student and what a correct reply sounds like. Refer to the student's real answers where it helps.
- gapAddressed: a short name (at most 8 words) for the gap from DIAGNOSED GAPS that this slide repairs. Every slide must address one of the listed gaps.
- vocabulary: 0-3 terms with a meaning a ${standard.grade} student understands.
- visualDescription: for concept, model and worked_example slides, one or two sentences describing a teaching picture with exact numbers (for example "A bar split into 5 equal parts with 3 parts shaded"). For other slides use an empty string. The picture must not contain the answer to the try_it problem.
- Write fractions as 3/8 and mixed numbers as 2 1/4. Use only math that is correct; check every number.
- Use the same numbers and wording consistently across slides.

Return JSON matching the schema exactly.`;
};

const STRING = { type: 'STRING' } as const;
const STRING_ARRAY = { type: 'ARRAY', items: STRING } as const;

export const REMEDIAL_DECK_SCHEMA = {
  type: 'OBJECT',
  properties: {
    slides: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          layout: { type: 'STRING', enum: [...SLIDE_LAYOUTS] },
          title: STRING,
          subtitle: STRING,
          gapAddressed: STRING,
          keyPoints: STRING_ARRAY,
          workedExample: {
            type: 'OBJECT',
            properties: { problem: STRING, steps: STRING_ARRAY, answer: STRING },
            required: ['problem', 'steps', 'answer'],
          },
          misconception: {
            type: 'OBJECT',
            properties: { wrong: STRING, why: STRING, fix: STRING },
            required: ['wrong', 'why', 'fix'],
          },
          checkQuestion: {
            type: 'OBJECT',
            properties: { prompt: STRING, answer: STRING },
            required: ['prompt', 'answer'],
          },
          talkingPoints: STRING_ARRAY,
          vocabulary: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: { term: STRING, meaning: STRING },
              required: ['term', 'meaning'],
            },
          },
          visualDescription: STRING,
        },
        required: ['layout', 'title', 'gapAddressed', 'keyPoints', 'talkingPoints', 'vocabulary', 'visualDescription'],
      },
    },
  },
  required: ['slides'],
} as const;

export const toVocabEntries = (value: unknown): RemedialVocabEntry[] => {
  if (!Array.isArray(value)) return [];
  const entries: RemedialVocabEntry[] = [];
  for (const item of value) {
    if (typeof item === 'string') {
      if (item.trim()) entries.push({ term: item.trim(), meaning: '' });
    } else if (item && typeof item === 'object') {
      const term = text((item as { term?: unknown }).term);
      if (term) entries.push({ term, meaning: text((item as { meaning?: unknown }).meaning) });
    }
  }
  return entries;
};

const normalizeLayout = (value: unknown, index: number): RemedialSlideLayout => {
  if (typeof value === 'string' && (SLIDE_LAYOUTS as readonly string[]).includes(value)) {
    return value as RemedialSlideLayout;
  }
  return SLIDE_LAYOUTS[index] ?? 'concept';
};

const normalizeWorkedExample = (value: any): RemedialSlide['workedExample'] => {
  const problem = text(value?.problem);
  const steps = textList(value?.steps, MAX_STEPS);
  if (!problem || steps.length === 0) return undefined;
  return { problem, steps, answer: text(value?.answer) };
};

const normalizeMisconception = (value: any): RemedialSlide['misconception'] => {
  const wrong = text(value?.wrong);
  const fix = text(value?.fix);
  if (!wrong || !fix) return undefined;
  return { wrong, why: text(value?.why), fix };
};

const normalizeCheckQuestion = (value: any): RemedialSlide['checkQuestion'] => {
  const prompt = text(value?.prompt);
  if (!prompt) return undefined;
  return { prompt, answer: text(value?.answer) };
};

/**
 * Repairs a model-written deck into renderable slides instead of rejecting it:
 * fixes layouts and numbering, trims lists, drops half-filled blocks and caps
 * how many slides ask for a picture. Safe to run more than once.
 */
export const normalizeRemedialDeck = (
  raw: unknown,
  options: { gapLabels?: string[] } = {},
): RemedialSlide[] => {
  const list: any[] = Array.isArray(raw) ? raw : Array.isArray((raw as any)?.slides) ? (raw as any).slides : [];
  const fallbackGap = text(options.gapLabels?.[0]);

  const slides: RemedialSlide[] = list
    .filter((slide) => slide && typeof slide === 'object' && text(slide.title))
    .map((slide, index) => {
      const keyPoints = textList(slide.keyPoints, MAX_KEY_POINTS);
      const legacyContent = text(slide.content);
      const normalized: RemedialSlide = {
        slideNumber: index + 1,
        layout: normalizeLayout(slide.layout, index),
        title: text(slide.title),
        content: legacyContent || keyPoints.map((point) => `- ${point}`).join('\n'),
        keyPoints,
        talkingPoints: textList(slide.talkingPoints, MAX_TALKING_POINTS),
        vocabulary: toVocabEntries(slide.vocabulary).slice(0, MAX_VOCAB),
        visualDescription: text(slide.visualDescription),
        gapAddressed: text(slide.gapAddressed) || fallbackGap,
      };
      const subtitle = text(slide.subtitle);
      if (subtitle) normalized.subtitle = subtitle;
      const workedExample = normalizeWorkedExample(slide.workedExample);
      if (workedExample) normalized.workedExample = workedExample;
      const misconception = normalizeMisconception(slide.misconception);
      if (misconception) normalized.misconception = misconception;
      const checkQuestion = normalizeCheckQuestion(slide.checkQuestion);
      if (checkQuestion) normalized.checkQuestion = checkQuestion;
      const imagePrompt = text(slide.imagePrompt);
      if (imagePrompt) normalized.imagePrompt = imagePrompt;
      if (typeof slide.generatedImageBase64 === 'string' && slide.generatedImageBase64) {
        normalized.generatedImageBase64 = slide.generatedImageBase64;
      }
      if (typeof slide.imageStatus === 'string') normalized.imageStatus = slide.imageStatus;
      return normalized;
    });

  const illustrated = slides
    .filter((slide) => slide.visualDescription)
    .sort(
      (a, b) =>
        ILLUSTRATION_PRIORITY.indexOf(a.layout!) - ILLUSTRATION_PRIORITY.indexOf(b.layout!) ||
        a.slideNumber - b.slideNumber,
    );
  for (const slide of illustrated.slice(MAX_ILLUSTRATED_SLIDES)) {
    slide.visualDescription = '';
  }

  return slides;
};
