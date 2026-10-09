import type { Question, VisualSpec } from '../types';

export type FigureHintGradeBand = 'K' | 'G12' | 'G35' | 'G68' | 'HS';

const MAX_FIGURE_HINTS = 3;
const MAX_HINT_CHARS = 160;

export const resolveFigureHintGradeBand = (grade: string | null | undefined): FigureHintGradeBand => {
  const raw = String(grade ?? '').trim().toLowerCase();
  if (!raw) return 'G35';
  if (raw === 'k' || raw.includes('kindergarten')) return 'K';
  if (raw === '912' || raw.includes('high school') || raw.includes('9-12')) return 'HS';
  const numMatch = raw.match(/\d+/);
  if (numMatch) {
    const n = Number.parseInt(numMatch[0], 10);
    if (n >= 9) return 'HS';
    if (n >= 6) return 'G68';
    if (n >= 3) return 'G35';
    if (n >= 1) return 'G12';
  }
  return 'G35';
};

const trimHint = (line: string): string => line.trim().replace(/\s+/g, ' ').slice(0, MAX_HINT_CHARS);

export const normalizeFigureHints = (hints: unknown): string[] => {
  if (!Array.isArray(hints)) return [];
  const out: string[] = [];
  for (const item of hints) {
    if (typeof item !== 'string') continue;
    const trimmed = trimHint(item);
    if (!trimmed) continue;
    out.push(trimmed);
    if (out.length >= MAX_FIGURE_HINTS) break;
  }
  return out;
};

const collectLeakNumbers = (question: Pick<Question, 'visualSpec' | 'options' | 'correctAnswerIndex'>): Set<string> => {
  const nums = new Set<string>();
  const vs = question.visualSpec;
  if (vs && Array.isArray(vs.values)) {
    for (const value of vs.values) {
      if (typeof value === 'number' && Number.isFinite(value)) nums.add(String(value));
    }
    const filled = vs.values.filter((value) => value >= 1).length;
    if (filled > 0) nums.add(String(filled));
  }
  if (typeof vs?.onesCount === 'number' && Number.isFinite(vs.onesCount)) nums.add(String(vs.onesCount));
  if (typeof vs?.shadedParts === 'number' && Number.isFinite(vs.shadedParts)) nums.add(String(vs.shadedParts));
  if (typeof vs?.totalParts === 'number' && Number.isFinite(vs.totalParts)) nums.add(String(vs.totalParts));
  return nums;
};

const hintLeaksAnswer = (
  hint: string,
  question: Pick<Question, 'options' | 'correctAnswerIndex' | 'visualSpec'>,
): boolean => {
  const lower = hint.toLowerCase();
  const options = Array.isArray(question.options) ? question.options.map(String) : [];
  const correctIdx =
    typeof question.correctAnswerIndex === 'number' && Number.isFinite(question.correctAnswerIndex)
      ? question.correctAnswerIndex
      : -1;
  const correctOption = correctIdx >= 0 && correctIdx < options.length ? options[correctIdx].trim() : '';
  if (correctOption.length >= 3 && lower.includes(correctOption.toLowerCase())) return true;
  if (/\b(option|choice)\s+[a-d]\b/i.test(hint)) return true;
  if (/\b(?:there are|has|have)\s+\d+\b/i.test(hint)) return true;
  if (/\b\d+\s+(?:blocks?|dots?|red|blue)\b/i.test(hint)) return true;
  for (const num of collectLeakNumbers(question)) {
    if (num.length > 0 && new RegExp(`\\b${num.replace('.', '\\.')}\\b`).test(hint)) return true;
  }
  return false;
};

export const sanitizeFigureHints = (
  hints: string[],
  question: Pick<Question, 'options' | 'correctAnswerIndex' | 'visualSpec'>,
): string[] =>
  normalizeFigureHints(hints).filter((hint) => !hintLeaksAnswer(hint, question));

const colorLabel = (color: string): string => color.trim().toLowerCase();

const arrayModelHints = (spec: VisualSpec, band: FigureHintGradeBand): string[] => {
  const colors = Array.isArray(spec.rowColors) ? spec.rowColors.map(colorLabel).filter(Boolean) : [];
  if (colors.length >= 2) {
    const [first, second] = colors;
    if (band === 'K') {
      return [
        `Find the ${first} row and the ${second} row.`,
        `Match one ${first} dot to one ${second} dot.`,
        'See which row has dots left over.',
      ];
    }
    if (band === 'G12') {
      return [
        `Look at the ${first} row and the ${second} row.`,
        'Match one dot from each row until one row runs out.',
        'Compare which row is longer.',
      ];
    }
    return [
      `Identify the ${first} and ${second} rows in the array model.`,
      'Use one-to-one matching to compare the two groups.',
      'Decide which group has more based on the picture.',
    ];
  }
  if (band === 'K' || band === 'G12') {
    return ['Look at each row in the picture.', 'Count or match the dots in each row.', 'Compare the rows.'];
  }
  return ['Read each row in the array model.', 'Compare the quantities shown in each row.'];
};

const tenFrameHints = (spec: VisualSpec, band: FigureHintGradeBand): string[] => {
  const hasOnes = typeof spec.onesCount === 'number' && spec.onesCount > 0;
  if (band === 'K') {
    return hasOnes
      ? ['Count the dots in the ten-frame.', 'Count the extra dots beside it.', 'Put the groups together in your head.']
      : ['Count the dots in the ten-frame.', 'Think about how many more you need to fill it.'];
  }
  if (band === 'G12') {
    return hasOnes
      ? ['Count the filled ten-frame.', 'Count the extra ones shown beside it.', 'Combine the groups to answer.']
      : ['Count how many dots are in the ten-frame.', 'Use the frame to help you solve.'];
  }
  return hasOnes
    ? ['Use the full ten-frame and the extra ones shown.', 'Treat the frame as one group and the extras as another.']
    : ['Use the ten-frame to count or compare the dots shown.'];
};

const numberLineHints = (band: FigureHintGradeBand): string[] => {
  if (band === 'K' || band === 'G12') {
    return ['Find the starting number on the line.', 'Move in the direction the question describes.', 'See where you land.'];
  }
  if (band === 'G35') {
    return ['Read the tick marks on the number line.', 'Follow the jumps or intervals in order.', 'Locate the point the question asks about.'];
  }
  return ['Identify the scale and starting value.', 'Track each interval or jump on the number line.', 'Read the position that matches the question.'];
};

const fractionHints = (band: FigureHintGradeBand): string[] => {
  if (band === 'K' || band === 'G12') {
    return ['Look at the equal parts in the shape.', 'See which parts are shaded.', 'Compare the shaded part to the whole.'];
  }
  if (band === 'G35') {
    return ['Count the equal parts in the whole.', 'Count how many parts are shaded.', 'Match the shaded parts to the question.'];
  }
  return ['Identify the total equal parts and the shaded parts.', 'Relate the shaded portion to the whole in the figure.'];
};

const barModelHints = (band: FigureHintGradeBand): string[] => {
  if (band === 'K' || band === 'G12') {
    return ['Look at each part of the bar.', 'See what each part stands for.', 'Use the parts to answer the question.'];
  }
  if (band === 'G35') {
    return ['Read the label on each bar segment.', 'Notice which parts are shaded or grouped.', 'Compare the parts shown.'];
  }
  return ['Interpret each segment label in the tape diagram.', 'Use segment lengths to compare the quantities shown.'];
};

const tableOrChartHints = (spec: VisualSpec, band: FigureHintGradeBand): string[] => {
  const hasCategories = Array.isArray(spec.categories) && spec.categories.length > 0;
  if (band === 'K' || band === 'G12') {
    return hasCategories
      ? ['Read each row or bar in the picture.', 'Find the names and how many each shows.', 'Compare the amounts.']
      : ['Read the labels in the table or chart.', 'Find the numbers for each group.', 'Compare the groups.'];
  }
  if (band === 'G35') {
    return ['Read the category labels and values.', 'Match each label to its amount in the figure.', 'Compare the values the question asks about.'];
  }
  return ['Read axis labels, categories, and units if shown.', 'Extract the values needed from the display.', 'Compare or combine the values as the stem describes.'];
};

const coordinateHints = (band: FigureHintGradeBand): string[] => {
  if (band === 'G35') {
    return ['Read the numbers on each axis.', 'Find the point or line in the grid.', 'Use the coordinates to answer.'];
  }
  if (band === 'G68') {
    return ['Identify the scale on each axis.', 'Locate the plotted points or lines.', 'Read coordinates carefully before answering.'];
  }
  return ['Interpret axes, scale, and plotted objects.', 'Use the graph to support the relationship in the stem.'];
};

const geometricHints = (band: FigureHintGradeBand): string[] => {
  if (band === 'K' || band === 'G12') {
    return ['Look at the shape in the picture.', 'Find the sides or corners the question mentions.', 'Use the labels to help you.'];
  }
  if (band === 'G35') {
    return ['Read the labels on the figure.', 'Notice equal sides, angles, or measures shown.', 'Use the diagram before you calculate.'];
  }
  return ['Read all given labels and markings on the diagram.', 'Identify the objects and relationships referenced in the stem.'];
};

const clockHints = (band: FigureHintGradeBand): string[] => {
  if (band === 'K' || band === 'G12') {
    return ['Look at the short hand and the long hand.', 'Read the hour first, then the minutes.', 'Match the clock to the question.'];
  }
  return ['Read the hour and minute hands on the clock face.', 'Use the tick marks for minutes if shown.'];
};

const genericHints = (band: FigureHintGradeBand, visualIntent?: string): string[] => {
  const trimmedIntent = typeof visualIntent === 'string' ? trimHint(visualIntent) : '';
  if (trimmedIntent && trimmedIntent.length <= MAX_HINT_CHARS) {
    return [trimmedIntent];
  }
  if (band === 'K' || band === 'G12') {
    return ['Look at the picture.', 'Find what the question asks you to compare or count.', 'Use the picture to choose your answer.'];
  }
  if (band === 'G35') {
    return ['Study the figure before you answer.', 'Match details in the picture to the question.', 'Use the display to compare the quantities or categories.'];
  }
  return ['Interpret the figure before computing.', 'Use labels, scale, and structure shown in the display.'];
};

export const buildFigureHints = (
  question: Pick<Question, 'text' | 'visualSpec' | 'visualIntent' | 'options' | 'correctAnswerIndex'>,
  grade: string | null | undefined,
): string[] => {
  const band = resolveFigureHintGradeBand(grade);
  const spec = question.visualSpec;
  if (!spec || typeof spec.visualType !== 'string') {
    return sanitizeFigureHints(genericHints(band, question.visualIntent), question);
  }

  const visualType = spec.visualType.trim().toLowerCase();
  let hints: string[] = [];
  switch (visualType) {
    case 'array_model':
      hints = arrayModelHints(spec, band);
      break;
    case 'ten_frame':
      hints = tenFrameHints(spec, band);
      break;
    case 'number_line':
    case 'line_plot':
      hints = numberLineHints(band);
      break;
    case 'fraction_bar':
    case 'fraction_circle':
      hints = fractionHints(band);
      break;
    case 'bar_model':
    case 'area_model':
      hints = barModelHints(band);
      break;
    case 'table':
    case 'bar_chart':
      hints = tableOrChartHints(spec, band);
      break;
    case 'coordinate_plane':
      hints = coordinateHints(band);
      break;
    case 'geometric_shape':
      hints = geometricHints(band);
      break;
    case 'clock_face':
      hints = clockHints(band);
      break;
    default:
      hints = genericHints(band, question.visualIntent);
      break;
  }

  return sanitizeFigureHints(normalizeFigureHints(hints), question);
};

export const resolveFigureHintsForQuestion = (
  question: Pick<Question, 'figureHints' | 'text' | 'visualSpec' | 'visualIntent' | 'options' | 'correctAnswerIndex'>,
  grade: string | null | undefined,
): string[] => {
  const fromField = sanitizeFigureHints(normalizeFigureHints(question.figureHints), question);
  if (fromField.length > 0) return fromField;
  return buildFigureHints(question, grade);
};

export const figureHintPanelTitle = (grade: string | null | undefined): string => {
  const band = resolveFigureHintGradeBand(grade);
  return band === 'K' || band === 'G12' ? 'Hints' : 'How to use this picture';
};
