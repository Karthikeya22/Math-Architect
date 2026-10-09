const BLOCK_TRAIN_COLORS = [
  'red',
  'blue',
  'green',
  'yellow',
  'purple',
  'orange',
] as const;

export type BlockTrainColor = (typeof BLOCK_TRAIN_COLORS)[number];

export const BLOCK_TRAIN_COLOR_HEX: Record<BlockTrainColor, string> = {
  red: '#dc2626',
  blue: '#2563eb',
  green: '#16a34a',
  yellow: '#ca8a04',
  purple: '#7c3aed',
  orange: '#ea580c',
};

type QuestionLike = {
  text?: string;
  options?: string[];
  correctAnswerIndex?: number;
  explanation?: string;
};

const questionCorpus = (question: QuestionLike): string => {
  const options = Array.isArray(question.options) ? question.options.map(String) : [];
  return [question.text, ...options, question.explanation]
    .filter((part) => typeof part === 'string' && part.trim())
    .join(' ');
};

export const extractNamedBlockTrainColors = (text: string): BlockTrainColor[] => {
  const lower = String(text || '').toLowerCase();
  const found: BlockTrainColor[] = [];
  for (const color of BLOCK_TRAIN_COLORS) {
    if (!new RegExp(`\\b${color}\\b`).test(lower)) continue;
    if (!/\btrain\b/.test(lower) && !/\bblocks?\b/.test(lower)) continue;
    found.push(color);
  }
  return found;
};

const parseBlockCountForColor = (corpus: string, color: BlockTrainColor): number | null => {
  const sentences = corpus.split(/(?<=[.!?])\s+/);
  for (const sentence of sentences) {
    if (!new RegExp(`\\b${color}\\b`, 'i').test(sentence)) continue;
    const patterns = [
      new RegExp(`\\b${color}\\s+train[^.]{0,40}?\\b(\\d+)\\s+blocks?\\b`, 'i'),
      new RegExp(`\\b(\\d+)\\s+${color}\\s+blocks?\\b`, 'i'),
      new RegExp(`\\b${color}\\b[^.]{0,40}?\\b(\\d+)\\s+blocks?\\b`, 'i'),
    ];
    for (const pattern of patterns) {
      const match = sentence.match(pattern);
      if (!match) continue;
      const count = Number(match[1]);
      if (Number.isFinite(count) && count >= 1 && count <= 12) return count;
    }
  }
  return null;
};

const inferRowCountsFromArraySpec = (visualSpec: {
  gridRows?: number;
  gridCols?: number;
  values?: unknown[];
}): number[] | null => {
  const rows = Number(visualSpec.gridRows);
  const cols = Number(visualSpec.gridCols);
  const values = Array.isArray(visualSpec.values) ? visualSpec.values : [];
  if (!Number.isInteger(rows) || !Number.isInteger(cols) || rows < 1 || cols < 1) return null;
  const counts: number[] = [];
  for (let row = 0; row < rows; row++) {
    let filled = 0;
    for (let col = 0; col < cols; col++) {
      const value = Number(values[row * cols + col]);
      if (Number.isFinite(value) && value >= 1) filled += 1;
    }
    counts.push(filled);
  }
  return counts.some((count) => count > 0) ? counts : null;
};

export const parseColoredBlockTrains = (
  question: QuestionLike & {
    visualSpec?: { gridRows?: number; gridCols?: number; values?: unknown[] } | null;
  },
): { colors: BlockTrainColor[]; counts: number[] } | null => {
  const colorCorpus = questionCorpus({
    text: question.text,
    options: question.options,
  });
  const countCorpus = [question.text, question.explanation].filter(Boolean).join(' ');
  const colors = extractNamedBlockTrainColors(colorCorpus);
  if (colors.length < 2) return null;

  const selected = colors.slice(0, 2);
  const counts = selected.map((color) => parseBlockCountForColor(countCorpus, color));
  if (counts.some((count) => count === null)) {
    const blockCounts = [...countCorpus.matchAll(/\b(\d+)\s+blocks?\b/gi)]
      .map((match) => Number(match[1]))
      .filter((count) => Number.isFinite(count) && count >= 1 && count <= 12);
    if (blockCounts.length >= 2) {
      return { colors: selected, counts: [blockCounts[0], blockCounts[1]] };
    }
    const inferred = question.visualSpec ? inferRowCountsFromArraySpec(question.visualSpec) : null;
    if (inferred && inferred.length >= 2) {
      return { colors: selected, counts: inferred.slice(0, 2) };
    }
    return null;
  }

  return { colors: selected, counts: counts as number[] };
};

export const buildArrayModelValuesForTrains = (counts: number[]): { gridCols: number; values: number[] } => {
  const gridCols = Math.max(...counts, 1);
  const values: number[] = [];
  for (const count of counts) {
    for (let col = 0; col < gridCols; col++) {
      values.push(col < count ? 1 : 0);
    }
  }
  return { gridCols, values };
};

export const buildCompareLengthImagePrompt = (question: QuestionLike): string | null => {
  const trains = parseColoredBlockTrains(question);
  if (!trains) return null;
  const [firstColor, secondColor] = trains.colors;
  const [firstCount, secondCount] = trains.counts;
  return [
    `Draw exactly two horizontal rows of unit cubes on a plain white background.`,
    `Top row: exactly ${firstCount} solid ${firstColor} cubes touching in a line.`,
    `Bottom row: exactly ${secondCount} solid ${secondColor} cubes touching in a line.`,
    `Use only ${firstColor} and ${secondColor}. No other colors, no text, no labels, no extra objects.`,
    `Question context: ${String(question.text || '').trim()}`,
  ].join(' ');
};

export const reconcileColoredBlockTrainsFromStem = (question: {
  text?: string;
  options?: string[];
  correctAnswerIndex?: number;
  explanation?: string;
  visualSpec?: {
    visualType?: string;
    gridRows?: number;
    gridCols?: number;
    values?: unknown[];
    rowColors?: string[];
    rowLabels?: string[];
  } | null;
  imagePrompt?: string;
  visualIntent?: string;
}): void => {
  const trains = parseColoredBlockTrains(question);
  if (!trains) return;

  const { gridCols, values } = buildArrayModelValuesForTrains(trains.counts);
  question.visualSpec = {
    visualType: 'array_model',
    gridRows: trains.counts.length,
    gridCols,
    values,
    rowColors: [...trains.colors],
    rowLabels: trains.colors.map((color) => `${color} train`),
  };
  question.imagePrompt = '';
  if (!question.visualIntent) {
    question.visualIntent = `Compare the lengths of the ${trains.colors[0]} and ${trains.colors[1]} block trains.`;
  }
};
