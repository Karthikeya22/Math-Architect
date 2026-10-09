import type { Question, VisualSpec } from '../types';
import { isFractionReferencedInQuestion } from '../server/visualSpecAnswerAlignment';
import { normalizeVisualTypeToken } from './visualSpec';
import {
  buildArrayModelCommands,
  buildCoordinatePointsCommands,
  buildFractionBarCommands,
  buildFractionCircleCommands,
  buildFunctionGraphCommands,
  buildGeometricCompareCommands,
  buildGeometricShapeCommands,
  buildNumberLineCommands,
  buildPlaceValueTableCommands,
  buildTenFrameCommands,
  looksLikeFunctionExpression,
} from './geogebraCommands';
import { isExactCountableVisualSpec } from './exactCountableVisual';

const PLACE_VALUE_HEADERS = ['thousands', 'hundreds', 'tens', 'ones'];

const parseMarkedValues = (spec: VisualSpec): number[] => {
  if (!Array.isArray(spec.values)) return [];
  return spec.values
    .map((v) => (typeof v === 'number' ? v : Number(v)))
    .filter((n) => Number.isFinite(n));
};

const fractionShowLabel = (question: Question, spec: VisualSpec): boolean => {
  const shaded = Number(spec.shadedParts);
  const total = Number(spec.totalParts);
  if (!Number.isFinite(shaded) || !Number.isFinite(total)) return false;
  return isFractionReferencedInQuestion(
    {
      text: String(question.text || ''),
      options: Array.isArray(question.options) ? question.options.map(String) : [],
      correctAnswerIndex: Number(question.correctAnswerIndex),
    },
    shaded,
    total,
  );
};

const extractPlaceValueNumber = (question: Question, spec: VisualSpec): number | null => {
  const rowDigits = Array.isArray(spec.rows) && spec.rows[0] ? spec.rows[0] : null;
  if (rowDigits) {
    const joined = rowDigits.map((cell) => String(cell).replace(/\D/g, '')).join('');
    const n = Number(joined);
    if (Number.isFinite(n)) return n;
  }
  const corpus = `${question.text || ''} ${(question.options || [])[question.correctAnswerIndex ?? -1] || ''}`;
  const match = corpus.match(/\b\d{1,4}\b/);
  if (match) return Number(match[0]);
  return null;
};

const isPlaceValueTable = (spec: VisualSpec): boolean => {
  const cols = (spec.columns || []).map((c) => String(c).toLowerCase().trim());
  if (cols.length !== 4) return false;
  return cols.every((c, i) => c.includes(PLACE_VALUE_HEADERS[i]));
};

export const buildGeoGebraCommandsFromQuestion = (question: Question): string[] | null => {
  const spec = question.visualSpec;
  if (!spec?.visualType) return null;

  const visualType = normalizeVisualTypeToken(spec.visualType) || String(spec.visualType).trim();

  if (visualType === 'number_line') {
    const min = Number(spec.min);
    const max = Number(spec.max);
    if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
    const cmds = buildNumberLineCommands(min, max, parseMarkedValues(spec));
    return cmds.length ? cmds : null;
  }

  if (visualType === 'fraction_bar' || visualType === 'fraction_circle') {
    const total = Number(spec.totalParts);
    const shaded = Number(spec.shadedParts);
    if (!Number.isFinite(total) || !Number.isFinite(shaded)) return null;
    const showLabel = fractionShowLabel(question, spec);
    const cmds =
      visualType === 'fraction_circle'
        ? buildFractionCircleCommands(total, shaded, showLabel)
        : buildFractionBarCommands(total, shaded, showLabel);
    return cmds.length ? cmds : null;
  }

  if (visualType === 'geometric_shape') {
    const shapes = Array.isArray(spec.shapes) ? spec.shapes.map(String).filter(Boolean) : [];
    if (shapes.length >= 2) {
      const cmds = buildGeometricCompareCommands(shapes);
      return cmds.length ? cmds : null;
    }
    if (spec.shapeName) {
      const sideLabels = Array.isArray(spec.sideLabels) ? spec.sideLabels.map(String) : undefined;
      const cmds = buildGeometricShapeCommands(String(spec.shapeName), undefined, sideLabels);
      return cmds.length ? cmds : null;
    }
    return null;
  }

  if (visualType === 'function_graph') {
    const prompt = String(spec.prompt || '').trim();
    const xMin = Number.isFinite(spec.xMin) ? Number(spec.xMin) : -10;
    const xMax = Number.isFinite(spec.xMax) ? Number(spec.xMax) : 10;
    if (!prompt) return null;
    const cmds = buildFunctionGraphCommands(prompt, xMin, xMax);
    return cmds.length ? cmds : null;
  }

  if (visualType === 'coordinate_plane') {
    const prompt = String(spec.prompt || '').trim();
    const xMin = Number.isFinite(spec.xMin) ? Number(spec.xMin) : -10;
    const xMax = Number.isFinite(spec.xMax) ? Number(spec.xMax) : 10;
    const yMin = Number.isFinite(spec.yMin) ? Number(spec.yMin) : -10;
    const yMax = Number.isFinite(spec.yMax) ? Number(spec.yMax) : 10;

    if (prompt && looksLikeFunctionExpression(prompt)) {
      const cmds = buildFunctionGraphCommands(prompt, xMin, xMax);
      return cmds.length ? cmds : null;
    }

    const points = Array.isArray(spec.points)
      ? spec.points
          .map((p) => ({
            x: Number(p.x),
            y: Number(p.y),
            label: p.label ? String(p.label) : undefined,
          }))
          .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
      : [];

    if (points.length) {
      const cmds = buildCoordinatePointsCommands(points, xMin, xMax, yMin, yMax);
      return cmds.length ? cmds : null;
    }

    return null;
  }

  if (visualType === 'table' && isPlaceValueTable(spec)) {
    const n = extractPlaceValueNumber(question, spec);
    if (n === null) return null;
    const cmds = buildPlaceValueTableCommands(n);
    return cmds.length ? cmds : null;
  }

  if (visualType === 'array_model' && isExactCountableVisualSpec(spec)) {
    const rows = Number(spec.gridRows);
    const cols = Number(spec.gridCols);
    const values = Array.isArray(spec.values) ? spec.values.map((v) => Number(v)) : [];
    const rowColors = Array.isArray(spec.rowColors) ? spec.rowColors.map(String) : undefined;
    const cmds = buildArrayModelCommands(rows, cols, values, rowColors);
    return cmds.length ? cmds : null;
  }

  if (visualType === 'ten_frame' && isExactCountableVisualSpec(spec)) {
    const values = Array.isArray(spec.values) ? spec.values.map((v) => Number(v)) : [];
    const ones = Number.isFinite(spec.onesCount) ? Number(spec.onesCount) : 0;
    const cmds = buildTenFrameCommands(values, ones);
    return cmds.length ? cmds : null;
  }

  return null;
};
