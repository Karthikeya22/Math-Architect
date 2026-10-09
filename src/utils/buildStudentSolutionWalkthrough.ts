import type { Question, SolutionStep, VisualSpec } from '../types';
import { parseColoredBlockTrains } from './compareLengthVisual';
import { countFilledTenFrame, normalizeTenFrameCells } from './reconcileMakeTenQuestion';
import { extractTenFrameAdditionOperands } from './tenFrameAdditionVisual';

const ADDITION_STEM =
  /\b(add|plus|in all|altogether|total|how many|sum|combine|together)\b|\+/i;
const COMPARE_STEM = /\b(longer|shorter|more|fewer|compare|greater|less)\b/i;

const colorLabel = (name: string): string => {
  const lower = name.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

const countArrayRow = (spec: VisualSpec, rowIndex: number): number => {
  const rows = Number.isFinite(spec.gridRows) ? Math.floor(Number(spec.gridRows)) : 1;
  const cols = Number.isFinite(spec.gridCols) ? Math.floor(Number(spec.gridCols)) : 1;
  const raw = Array.isArray(spec.values) ? spec.values : [];
  let count = 0;
  for (let col = 0; col < cols; col++) {
    const idx = rowIndex * cols + col;
    const v = raw[idx];
    const n = typeof v === 'number' ? v : Number(v);
    if (Number.isFinite(n) && n >= 1) count++;
  }
  return count;
};

const cloneSpec = (spec: VisualSpec): VisualSpec => JSON.parse(JSON.stringify(spec)) as VisualSpec;

const arrayRowValues = (
  spec: VisualSpec,
  rowIndex: number,
  filled: boolean,
): number[] => {
  const rows = Number.isFinite(spec.gridRows) ? Math.floor(Number(spec.gridRows)) : 1;
  const cols = Number.isFinite(spec.gridCols) ? Math.floor(Number(spec.gridCols)) : 1;
  const raw = Array.isArray(spec.values) ? spec.values : [];
  const out: number[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const idx = row * cols + col;
      const source = raw[idx];
      const n = typeof source === 'number' ? source : Number(source);
      if (row === rowIndex) {
        out.push(filled && Number.isFinite(n) && n >= 1 ? 1 : 0);
      } else {
        out.push(0);
      }
    }
  }
  return out;
};

const isValidAiSteps = (steps: SolutionStep[] | undefined): steps is SolutionStep[] =>
  Array.isArray(steps) && steps.length >= 2 && steps.every((s) => s.title?.trim() && s.body?.trim());

const buildArrayModelAdditionSteps = (
  question: Question,
  spec: VisualSpec,
): SolutionStep[] | null => {
  const rows = Number.isFinite(spec.gridRows) ? Math.floor(Number(spec.gridRows)) : 0;
  if (rows < 2) return null;

  const rowColors = (spec.rowColors || []).map((c) => String(c).toLowerCase());
  const counts = [0, 1].map((row) => countArrayRow(spec, row));
  if (!counts.some((c) => c > 0)) return null;

  const color0 = rowColors[0] ? colorLabel(rowColors[0]) : 'First group';
  const color1 = rowColors[1] ? colorLabel(rowColors[1]) : 'Second group';
  const total = counts[0] + counts[1];
  const correctText =
    question.options[question.correctAnswerIndex] != null
      ? String(question.options[question.correctAnswerIndex])
      : String(total);

  const base = cloneSpec(spec);
  return [
    {
      title: `Count the ${color0} row`,
      body: `Look at the top row. Count each dot one by one. There are ${counts[0]} dots in the ${color0.toLowerCase()} row.`,
      visualSpec: { ...base, values: arrayRowValues(spec, 0, true), title: `Step 1: ${counts[0]} dots` },
    },
    {
      title: `Count the ${color1} row`,
      body: `Now look at the bottom row. Count each dot. There are ${counts[1]} dots in the ${color1.toLowerCase()} row.`,
      visualSpec: { ...base, values: arrayRowValues(spec, 1, true), title: `Step 2: ${counts[1]} dots` },
    },
    {
      title: 'Put the groups together',
      body: `Add the two groups: ${counts[0]} + ${counts[1]} = ${total}. You can count all the dots in the picture to check.`,
      visualSpec: { ...base, title: `Step 3: ${total} dots in all` },
    },
    {
      title: 'Pick the answer',
      body: `The number that matches ${total} is ${correctText}. Choose that option.`,
    },
  ];
};

const buildArrayModelCompareSteps = (
  question: Question,
  spec: VisualSpec,
): SolutionStep[] | null => {
  const trains = parseColoredBlockTrains(question);
  const counts =
    trains?.counts ??
    [countArrayRow(spec, 0), countArrayRow(spec, 1)].filter((_, i) => i < 2);
  if (counts.length < 2 || counts.some((c) => c <= 0)) return null;

  const colors = trains?.colors ?? (spec.rowColors || []).map(String);
  const label0 = colors[0] ? colorLabel(colors[0]) : 'First train';
  const label1 = colors[1] ? colorLabel(colors[1]) : 'Second train';
  const longerIdx = counts[0] >= counts[1] ? 0 : 1;
  const correctText = String(question.options[question.correctAnswerIndex] ?? '');

  const base = cloneSpec(spec);
  return [
    {
      title: `Count the ${label0}`,
      body: `Count the blocks in the ${label0.toLowerCase()} row. There are ${counts[0]} blocks.`,
      visualSpec: { ...base, values: arrayRowValues(spec, 0, true), title: `${counts[0]} blocks` },
    },
    {
      title: `Count the ${label1}`,
      body: `Count the blocks in the ${label1.toLowerCase()} row. There are ${counts[1]} blocks.`,
      visualSpec: { ...base, values: arrayRowValues(spec, 1, true), title: `${counts[1]} blocks` },
    },
    {
      title: 'Compare the rows',
      body:
        counts[0] === counts[1]
          ? `Both rows have ${counts[0]} blocks. They are the same length.`
          : `${counts[longerIdx]} is more than ${counts[1 - longerIdx]}. The ${(colors[longerIdx] ? colorLabel(colors[longerIdx]) : longerIdx === 0 ? label0 : label1).toLowerCase()} row is longer.`,
      visualSpec: base,
    },
    {
      title: 'Choose your answer',
      body: correctText
        ? `The answer that matches what you found is ${correctText}.`
        : 'Pick the option that matches your comparison.',
    },
  ];
};

const buildTenFrameSteps = (question: Question, spec: VisualSpec): SolutionStep[] | null => {
  const cells = normalizeTenFrameCells(Array.isArray(spec.values) ? spec.values : []);
  const filled = countFilledTenFrame(cells);
  const empty = Math.max(0, 10 - filled);
  const operands = extractTenFrameAdditionOperands(String(question.text || ''));
  const correctText = String(question.options[question.correctAnswerIndex] ?? '');

  const partialCells = (count: number): number[] => {
    const out = Array(10).fill(0);
    for (let i = 0; i < Math.min(count, 10); i++) out[i] = 1;
    return out;
  };

  if (operands && operands.first + operands.second <= 10) {
    const total = operands.first + operands.second;
    return [
      {
        title: 'Start with the first group',
        body: `The ten-frame shows ${operands.first} dots for the first number.`,
        visualSpec: { ...cloneSpec(spec), values: partialCells(operands.first), title: `${operands.first} dots` },
      },
      {
        title: 'Add the second group',
        body: `Add ${operands.second} more dots. Count on: ${operands.first} + ${operands.second} = ${total}.`,
        visualSpec: { ...cloneSpec(spec), values: partialCells(total), title: `${total} dots` },
      },
      {
        title: 'Find the answer',
        body: `There are ${total} dots in all. The correct choice is ${correctText || total}.`,
        visualSpec: cloneSpec(spec),
      },
    ];
  }

  if (filled > 0 && empty > 0) {
    return [
      {
        title: 'Count the filled dots',
        body: `Count every dot in the ten-frame. There are ${filled} filled dots.`,
        visualSpec: { ...cloneSpec(spec), values: partialCells(filled) },
      },
      {
        title: 'Count the empty spaces',
        body: `There are ${empty} empty spaces left in the ten-frame.`,
        visualSpec: cloneSpec(spec),
      },
      {
        title: 'Use what you know',
        body: correctText
          ? `Put it together to choose ${correctText}.`
          : question.explanation || 'Use the ten-frame to decide which option is correct.',
        visualSpec: cloneSpec(spec),
      },
    ];
  }

  return [
    {
      title: 'Count the dots',
      body: `Count each dot in the ten-frame. There are ${filled} dots.`,
      visualSpec: cloneSpec(spec),
    },
    {
      title: 'Match your count',
      body: correctText
        ? `Your count should match ${correctText}.`
        : question.explanation || 'Pick the option that matches your count.',
    },
  ];
};

const buildFractionSteps = (question: Question, spec: VisualSpec): SolutionStep[] | null => {
  const total = Number(spec.totalParts);
  const shaded = Number(spec.shadedParts);
  if (!Number.isFinite(total) || !Number.isFinite(shaded) || total < 1) return null;

  const correctText = String(question.options[question.correctAnswerIndex] ?? '');
  const base = cloneSpec(spec);

  return [
    {
      title: 'Name the parts',
      body: `The shape is split into ${total} equal parts. Each part is one piece of the whole.`,
      visualSpec: { ...base, shadedParts: 0, title: `${total} equal parts` },
    },
    {
      title: 'Count the shaded parts',
      body: `Count the parts that are shaded. There are ${shaded} shaded parts out of ${total}.`,
      visualSpec: base,
    },
    {
      title: 'Connect to the answer',
      body: correctText
        ? `The answer ${correctText} matches ${shaded} out of ${total} parts.`
        : question.explanation || `Think about ${shaded} out of ${total} equal parts.`,
    },
  ];
};

const buildFallbackSteps = (question: Question): SolutionStep[] => {
  const explanation = String(question.explanation || '').trim();
  const sentences = explanation
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8);

  const correctText = String(question.options[question.correctAnswerIndex] ?? '');

  if (sentences.length >= 2) {
    return sentences.slice(0, 4).map((body, idx) => ({
      title: idx === 0 ? 'Read the problem' : idx === sentences.length - 1 ? 'Check your answer' : `Step ${idx + 1}`,
      body,
      ...(idx === sentences.length - 1 && question.visualSpec ? { visualSpec: question.visualSpec } : {}),
    }));
  }

  const steps: SolutionStep[] = [
    {
      title: 'Understand the question',
      body: question.text || 'Read the question carefully.',
    },
    {
      title: 'Work it out',
      body: explanation || 'Use the figure and what you know to solve the problem.',
    },
  ];

  if (correctText) {
    steps.push({
      title: 'The answer',
      body: `The correct choice is ${correctText}. ${explanation}`.trim(),
      ...(question.visualSpec ? { visualSpec: question.visualSpec } : {}),
    });
  }

  return steps;
};

const buildSingleRowArraySteps = (question: Question, spec: VisualSpec): SolutionStep[] | null => {
  const count = countArrayRow(spec, 0);
  if (count <= 0) return null;
  const correctText = String(question.options[question.correctAnswerIndex] ?? '');
  const base = cloneSpec(spec);
  const stem = String(question.text || '');
  const isSubtract = /\b(fly|flies|left|remain|take away|subtract)\b/i.test(stem);
  if (isSubtract) {
    return [
      {
        title: 'Count at the start',
        body: `Count each object in the row. There are ${count} at the start.`,
        visualSpec: base,
      },
      {
        title: 'Think about what changes',
        body: 'Some leave or are taken away. Subtract that amount from the starting count.',
        visualSpec: base,
      },
      {
        title: 'Choose the answer',
        body: correctText
          ? `The correct choice is ${correctText}.`
          : question.explanation || 'Pick the option that matches how many are left.',
        visualSpec: base,
      },
    ];
  }
  return [
    {
      title: 'Count the objects',
      body: `Count each object one time. There are ${count} in the picture.`,
      visualSpec: base,
    },
    {
      title: 'Choose the answer',
      body: correctText
        ? `The correct choice is ${correctText}.`
        : question.explanation || 'Pick the option that matches your count.',
      visualSpec: base,
    },
  ];
};

const buildDeterministicVisualWalkthrough = (question: Question): SolutionStep[] | null => {
  const spec = question.visualSpec;
  const stem = String(question.text || '');

  if (spec?.visualType === 'array_model') {
    const rows = Number.isFinite(spec.gridRows) ? Math.floor(Number(spec.gridRows)) : 0;
    const hasRowColors = Array.isArray(spec.rowColors) && spec.rowColors.length >= 2;
    if (rows >= 2 && hasRowColors) {
      const isCompare = COMPARE_STEM.test(stem) && !ADDITION_STEM.test(stem);
      const addition = buildArrayModelAdditionSteps(question, spec);
      const compare = buildArrayModelCompareSteps(question, spec);
      if (isCompare && compare) return compare;
      if (addition) return addition;
      if (compare) return compare;
    }
    if (rows === 1) {
      const singleRow = buildSingleRowArraySteps(question, spec);
      if (singleRow) return singleRow;
    }
  }

  if (spec?.visualType === 'ten_frame') {
    const tenSteps = buildTenFrameSteps(question, spec);
    if (tenSteps) return tenSteps;
  }

  if (spec?.visualType === 'fraction_bar' || spec?.visualType === 'fraction_circle') {
    const fracSteps = buildFractionSteps(question, spec);
    if (fracSteps) return fracSteps;
  }

  if (spec?.visualType === 'table') {
    const tableSteps = buildTablePlaceValueSteps(question, spec);
    if (tableSteps) return tableSteps;
  }

  if (spec?.visualType === 'number_line') {
    const lineSteps = buildNumberLineSteps(question, spec);
    if (lineSteps) return lineSteps;
  }

  return null;
};

const buildTablePlaceValueSteps = (question: Question, spec: VisualSpec): SolutionStep[] | null => {
  const columns = (spec.columns || []).map(String);
  const rows = spec.rows || [];
  if (!columns.length || !rows.length) return null;
  const digits = rows[0] || [];
  const correctText = String(question.options[question.correctAnswerIndex] ?? '');
  const base = cloneSpec(spec);
  return [
    {
      title: 'Read each place',
      body: `The chart shows ${columns.join(', ')}. Read the digit in each column.`,
      visualSpec: base,
    },
    {
      title: 'Build the number',
      body: `Put the digits together: ${digits.join('') !== digits.join(', ') ? digits.join(', ') : digits.join(' ')}.`,
      visualSpec: base,
    },
    {
      title: 'Choose the answer',
      body: correctText
        ? `The correct choice is ${correctText}.`
        : question.explanation || 'Pick the option that matches the place-value chart.',
      visualSpec: base,
    },
  ];
};

const buildNumberLineSteps = (question: Question, spec: VisualSpec): SolutionStep[] | null => {
  const min = Number(spec.min);
  const max = Number(spec.max);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
  const correctText = String(question.options[question.correctAnswerIndex] ?? '');
  const base = cloneSpec(spec);
  return [
    {
      title: 'Find the values on the line',
      body: `The number line runs from ${min} to ${max}. Locate the values named in the question.`,
      visualSpec: base,
    },
    {
      title: 'Use the distances',
      body: 'Compare how far apart the values are to decide which number matches the question.',
      visualSpec: base,
    },
    {
      title: 'Choose the answer',
      body: correctText
        ? `The correct choice is ${correctText}.`
        : question.explanation || 'Pick the option that matches what you found on the number line.',
    },
  ];
};

export const buildStudentSolutionWalkthrough = (question: Question): SolutionStep[] => {
  const deterministic = buildDeterministicVisualWalkthrough(question);
  if (deterministic) return deterministic;

  if (isValidAiSteps(question.solutionSteps)) {
    return question.solutionSteps.slice(0, 5);
  }

  return buildFallbackSteps(question);
};
