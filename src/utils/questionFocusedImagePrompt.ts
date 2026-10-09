import { parseColoredBlockTrains } from './compareLengthVisual';
import { isExactCountableVisualSpec } from './exactCountableVisual';
import { stemHasPlottableExactCounts } from './exactCountVisual';
import { extractPartPartWholeFromText } from './partPartWholeVisual';
import { isTenFrameAdditionQuestion } from './tenFrameAdditionVisual';

type QuestionLike = {
  text?: string;
  options?: string[];
  correctAnswerIndex?: number;
  explanation?: string;
  visualIntent?: string;
  visualSpec?: {
    visualType?: string;
    shapeName?: string;
    shapes?: string[];
    gridRows?: number;
    gridCols?: number;
    values?: unknown[];
    rowColors?: string[];
    totalParts?: number;
    shadedParts?: number;
  } | null;
  imagePrompt?: string;
};

const SCENE_WORD_PROBLEM_PATTERN =
  /\b(ladder|wall|ground|floor|roof|ramp|flagpole|building|tree|shadow|pole|fence|bridge|river|boat|path|road|height of|feet away|feet up|meters away|meters up|hypotenuse|pythagor|right angle|right-angle|right triangle)\b/i;

export const isSceneWordProblem = (text: string): boolean =>
  SCENE_WORD_PROBLEM_PATTERN.test(String(text || ''));

export type RightTriangleScene = {
  legA: number;
  legB: number;
  verticalLabel: string;
  horizontalLabel: string;
  hypotenuseLabel: string;
};

export const extractRightTriangleScene = (text: string): RightTriangleScene | null => {
  const stem = String(text || '');
  const lower = stem.toLowerCase();
  if (!/\b(ladder|wall|ground|floor|flagpole|building|tree|pole|roof|ramp)\b/.test(lower)) return null;
  if (!/\b(right angle|right-angle|right triangle|hypotenuse|pythagor|vertical|against a wall|up the wall)\b/.test(lower)) {
    if (!/\bladder\b/.test(lower) || !/\bwall\b/.test(lower)) return null;
  }

  const awayMatch = stem.match(/\b(\d+(?:\.\d+)?)\s*(?:feet|foot|meters?)\s+away\b/i);
  const heightMatch = stem.match(
    /\b(?:height of|reaches a height of|reaches)\s*(?:a height of\s*)?(\d+(?:\.\d+)?)\s*(?:feet|foot|meters?)\b/i,
  );
  const upMatch = stem.match(/\b(\d+(?:\.\d+)?)\s*(?:feet|foot|meters?)\s+up(?:\s+the wall)?\b/i);
  const legA = awayMatch ? Number(awayMatch[1]) : NaN;
  const legB = heightMatch ? Number(heightMatch[1]) : upMatch ? Number(upMatch[1]) : NaN;
  if (!Number.isFinite(legA) || !Number.isFinite(legB)) return null;

  return {
    legA,
    legB,
    verticalLabel: 'wall',
    horizontalLabel: 'ground',
    hypotenuseLabel: /\bladder\b/i.test(stem) ? 'ladder' : 'slant side',
  };
};

const SEQUENCE_QUESTION_TRIGGER =
  /\b(pattern|next number|skip[-\s]?count(?:ing)?|counting by)\b/i;

export const isSequenceQuestion = (text: string): boolean =>
  SEQUENCE_QUESTION_TRIGGER.test(String(text || ''));

const extractStemIntegers = (stem: string): number[] =>
  (stem.match(/\b\d+\b/g) || []).map((token) => Number(token)).filter((n) => Number.isFinite(n));

/** Sequence labels from the stem, excluding "counting by N" / "skip count by N" literals. */
const extractSequenceNumbers = (stem: string): number[] => {
  const scrubbed = stem
    .replace(/\bcounting by\s+\d+\b/gi, '')
    .replace(/\bskip[-\s]?count(?:ing)?\s+(?:by\s+)?\d+\b/gi, '');
  return extractStemIntegers(scrubbed);
};

const inferSequenceSkipBy = (stem: string, numbers: number[]): number => {
  if (numbers.length >= 2) {
    const step = numbers[1] - numbers[0];
    if (Number.isFinite(step) && step > 0) return step;
  }
  const countingBy = stem.match(/\bcounting by\s+(\d+)\b/i);
  if (countingBy) return Number(countingBy[1]);
  const skipBy = stem.match(/\bskip[-\s]?count(?:ing)?\s+(?:by\s+)?(\d+)\b/i);
  if (skipBy) return Number(skipBy[1]);
  return 1;
};

export const buildSequencePatternImagePrompt = (question: QuestionLike, grade: string): string | null => {
  const stem = String(question.text || '').trim();
  if (!isSequenceQuestion(stem)) return null;

  const numbers = extractSequenceNumbers(stem);
  if (numbers.length < 2) return null;

  const skipBy = inferSequenceSkipBy(stem, numbers);
  const labels = numbers.map(String).join(', ');

  return [
    `Show a row of groups of objects for this ${grade} skip-counting or pattern question.`,
    `Each group contains exactly ${skipBy} identical objects (not the cumulative total across groups).`,
    `Label the groups in order: ${labels}, then a final group marked with a large "?".`,
    `Draw exactly ${numbers.length + 1} groups — no extra groups before or after.`,
    'Plain white background. No equations, no number lines, no answer value.',
    `Question: "${stem}"`,
  ].join(' ');
};

export const buildRightTriangleScenePrompt = (scene: RightTriangleScene, question: QuestionLike): string => {
  const unit = /\bmeters?\b/i.test(String(question.text || '')) ? 'meters' : 'feet';
  return [
    'Draw one clean schematic right triangle for this exact math word problem on a plain white background.',
    `The vertical leg is a ${scene.verticalLabel} labeled ${scene.legB} ${unit}.`,
    `The horizontal leg is the ${scene.horizontalLabel} labeled ${scene.legA} ${unit} from the wall to the base of the ${scene.hypotenuseLabel}.`,
    `The hypotenuse is a ${scene.hypotenuseLabel}.`,
    'Mark the right angle only where the wall meets the ground.',
    'Do not label the hypotenuse length or show the answer.',
    `Question: ${String(question.text || '').trim()}`,
  ].join(' ');
};

export const buildQuestionFocusedImagePrompt = (question: QuestionLike, grade: string): string => {
  const stem = String(question.text || '').trim();
  const intent = String(question.visualIntent || '').trim();
  const rightTriangle = extractRightTriangleScene(stem);
  if (rightTriangle) {
    return buildRightTriangleScenePrompt(rightTriangle, question);
  }

  const sequencePrompt = buildSequencePatternImagePrompt(question, grade);
  if (sequencePrompt) return sequencePrompt;

  return [
    `Generate one educational image that illustrates only this ${grade} math question.`,
    'Focus on the exact objects, measurements, positions, and relationships named in the question.',
    'Use a plain white background and a clear schematic or concrete scene that matches the stem.',
    'Show only facts already given in the question. Do not reveal the answer or the correct option.',
    intent ? `Student focus: ${intent}` : '',
    `Question: "${stem}"`,
  ]
    .filter(Boolean)
    .join(' ');
};

export const prefersDeterministicVisual = (question: QuestionLike): boolean => {
  const text = String(question.text || '');
  if (isTenFrameAdditionQuestion(text)) return true;
  if (parseColoredBlockTrains(question)) return true;
  if (isExactCountableVisualSpec(question.visualSpec)) return true;
  if (stemHasPlottableExactCounts(text)) return true;
  if (extractPartPartWholeFromText(text)) return false;
  if (isSceneWordProblem(text)) return false;

  const vs = question.visualSpec;
  if (!vs?.visualType) return false;

  switch (vs.visualType) {
    case 'fraction_bar':
    case 'fraction_circle':
    case 'ten_frame':
    case 'number_line':
    case 'clock_face':
    case 'line_plot':
    case 'table':
    case 'bar_chart':
    case 'coordinate_plane':
    case 'bar_model':
    case 'area_model':
      return true;
    case 'array_model':
      return (
        isTenFrameAdditionQuestion(text) ||
        Boolean(parseColoredBlockTrains(question)) ||
        isExactCountableVisualSpec(vs)
      );
    case 'geometric_shape':
      return Array.isArray(vs.shapes) && vs.shapes.length >= 2;
    default:
      return false;
  }
};

export const reconcileSceneImageFromStem = (question: QuestionLike): void => {
  const text = String(question.text || '');
  if (isTenFrameAdditionQuestion(text)) return;
  if (extractPartPartWholeFromText(text)) return;
  if (stemHasPlottableExactCounts(text) || isExactCountableVisualSpec(question.visualSpec)) return;
  if (!isSceneWordProblem(text) && !extractRightTriangleScene(text)) return;

  question.imagePrompt = buildQuestionFocusedImagePrompt(question, 'math');
  delete question.visualSpec;
  if (!question.visualIntent) {
    question.visualIntent = 'Use the picture to identify the relationship in the word problem.';
  }
};
