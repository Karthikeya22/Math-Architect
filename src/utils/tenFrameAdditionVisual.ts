import { normalizeTenFrameCells } from './reconcileMakeTenQuestion';

type QuestionVisualFields = {
  text?: string;
  visualIntent?: string;
  visualSpec?: {
    visualType?: string;
    gridRows?: number;
    gridCols?: number;
    values?: unknown[];
    rowColors?: string[];
  } | null;
  imagePrompt?: string;
};

export type TenFrameAdditionOperands = {
  first: number;
  second: number;
};

export const extractTenFrameAdditionOperands = (text: string): TenFrameAdditionOperands | null => {
  const stem = String(text || '');
  const lower = stem.toLowerCase();
  if (!/\bten[-\s]?frame\b/.test(lower)) return null;
  if (/\b\d+\s*\+\s*\d+\s*=/.test(stem)) return null;

  const match = stem.match(/\b(\d+)\s*\+\s*(\d+)\b/);
  if (!match) return null;

  const first = Number(match[1]);
  const second = Number(match[2]);
  if (![first, second].every((value) => Number.isInteger(value) && value >= 0 && value <= 10)) return null;
  return { first, second };
};

export const buildTenFrameAdditionArrayValues = (
  operands: TenFrameAdditionOperands,
): { gridRows: number; gridCols: number; values: number[] } => {
  const gridCols = 5;
  const gridRows = 2;
  const values: number[] = [];
  for (const count of [operands.first, operands.second]) {
    for (let col = 0; col < gridCols; col++) {
      values.push(col < count ? 1 : 0);
    }
  }
  return { gridRows, gridCols, values };
};

export const reconcileTenFrameAdditionFromStem = (question: QuestionVisualFields): void => {
  const operands = extractTenFrameAdditionOperands(String(question.text || ''));
  if (!operands) return;

  const { gridRows, gridCols, values } = buildTenFrameAdditionArrayValues(operands);
  question.visualSpec = {
    visualType: 'array_model',
    gridRows,
    gridCols,
    values,
    rowColors: ['red', 'blue'],
  };
  question.imagePrompt = '';
  if (!question.visualIntent) {
    question.visualIntent = 'Count the dots in each row of the ten-frame and add the groups.';
  }
};

export const isTenFrameAdditionQuestion = (text: string): boolean =>
  extractTenFrameAdditionOperands(text) !== null;

export const coerceTenFrameAdditionVisualSpec = (question: QuestionVisualFields): void => {
  const operands = extractTenFrameAdditionOperands(String(question.text || ''));
  if (!operands) return;
  const vs = question.visualSpec;
  if (!vs || typeof vs !== 'object') {
    reconcileTenFrameAdditionFromStem(question);
    return;
  }

  const visualType = String(vs.visualType || '').trim();
  if (visualType === 'ten_frame') {
    const cells = normalizeTenFrameCells(Array.isArray(vs.values) ? vs.values : []);
    const filled = cells.filter((value) => value >= 1).length;
    if (filled !== operands.first + operands.second) {
      reconcileTenFrameAdditionFromStem(question);
    }
    return;
  }

  if (visualType !== 'array_model') return;

  const rows = Number(vs.gridRows);
  const cols = Number(vs.gridCols);
  const expected = buildTenFrameAdditionArrayValues(operands);
  const values = Array.isArray(vs.values) ? vs.values.map((value) => Number(value)) : [];
  const rowColors = Array.isArray(vs.rowColors) ? vs.rowColors.map(String) : [];
  const countsMatch =
    rows === expected.gridRows &&
    cols === expected.gridCols &&
    values.length === expected.values.length &&
    expected.values.every((value, index) => (Number.isFinite(values[index]) ? Number(values[index]) : 0) === value);
  if (!countsMatch || rowColors.length < 2) {
    reconcileTenFrameAdditionFromStem(question);
  }
};
