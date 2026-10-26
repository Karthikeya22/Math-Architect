import type { CoordinatePoint } from '../types';

type QuestionVisualFields = {
  text?: string;
  visualSpec?: {
    visualType?: string;
    points?: CoordinatePoint[];
    xMin?: number;
    xMax?: number;
    yMin?: number;
    yMax?: number;
    xTickStep?: number;
    yTickStep?: number;
    title?: string;
    connect?: 'polygon' | 'lines' | 'none';
  } | null;
  imagePrompt?: string;
};

export type LabeledCoordinate = { label: string; x: number; y: number };

const COORDINATE_CONTEXT =
  /\b(?:plot|graph|graphed|point|points|coordinate|coordinates|passes?\s+through|passing\s+through|vertex|vertices|located\s+at|lies\s+at|at\s+the\s+points?)\b/i;

/**
 * Parse bare coordinate pairs such as "(3, -2)" when the stem talks about
 * plotting or passing through points. Labeled pairs are handled separately so
 * "A(3, -2)" never gets counted twice. Returns [] without a plot/graph cue to
 * avoid treating answer intervals or option text as points.
 */
export const extractBareCoordinatesFromText = (text: string): LabeledCoordinate[] => {
  const stem = String(text || '');
  if (!COORDINATE_CONTEXT.test(stem)) return [];
  const found: LabeledCoordinate[] = [];
  const seen = new Set<string>();
  for (const match of stem.matchAll(/\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/g)) {
    const x = Number(match[1]);
    const y = Number(match[2]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    const key = `${x}:${y}`;
    if (seen.has(key)) continue;
    seen.add(key);
    found.push({ label: '', x, y });
  }
  return found;
};

/** Labeled + bare coordinates, labeled first and de-duplicated by position. */
export const extractAllCoordinatesFromText = (text: string): LabeledCoordinate[] => {
  const labeled = extractLabeledCoordinatesFromText(text);
  const out: LabeledCoordinate[] = [...labeled];
  const seen = new Set(labeled.map((point) => `${point.x}:${point.y}`));
  for (const point of extractBareCoordinatesFromText(text)) {
    const key = `${point.x}:${point.y}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(point);
  }
  return out;
};

/** Parse J(-3, -1), P at (4, -8), etc. Skips primed labels (J', P'). */
export const extractLabeledCoordinatesFromText = (text: string): LabeledCoordinate[] => {
  const stem = String(text || '');
  const found: LabeledCoordinate[] = [];
  const seen = new Set<string>();

  const patterns = [
    /\b([A-Z])\s+at\s*\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/gi,
    /\b([A-Z])\s*\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/gi,
    /\bvertex\s+([A-Z])\s+at\s*\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/gi,
  ];

  for (const re of patterns) {
    for (const match of stem.matchAll(re)) {
      const label = String(match[1] || '').trim();
      if (!label || label.includes("'")) continue;
      const x = Number(match[2]);
      const y = Number(match[3]);
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      const key = `${label}:${x}:${y}`;
      if (seen.has(key)) continue;
      seen.add(key);
      found.push({ label, x, y });
    }
  }

  return found;
};

const computeBounds = (
  points: LabeledCoordinate[],
  includeOrigin: boolean,
): { xMin: number; xMax: number; yMin: number; yMax: number } => {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  if (includeOrigin) {
    xs.push(0);
    ys.push(0);
  }
  let xMin = Math.min(...xs);
  let xMax = Math.max(...xs);
  let yMin = Math.min(...ys);
  let yMax = Math.max(...ys);
  const padX = Math.max(2, (xMax - xMin) * 0.25);
  const padY = Math.max(2, (yMax - yMin) * 0.25);
  if (xMax === xMin) {
    xMin -= 2;
    xMax += 2;
  } else {
    xMin -= padX;
    xMax += padX;
  }
  if (yMax === yMin) {
    yMin -= 2;
    yMax += 2;
  } else {
    yMin -= padY;
    yMax += padY;
  }
  return {
    xMin: Math.floor(xMin),
    xMax: Math.ceil(xMax),
    yMin: Math.floor(yMin),
    yMax: Math.ceil(yMax),
  };
};

/** Join points only when the stem says they form a figure or lie on a line; otherwise plot dots. */
export const connectionFromStem = (stem: string, count: number): 'polygon' | 'lines' | 'none' => {
  if (
    count >= 3 &&
    /\b(?:vertex|vertices|polygon|triangle|quadrilateral|rectangle|square|parallelogram|trapezoid|rhombus|kite|pentagon|hexagon|area|perimeter)\b/i.test(stem)
  ) {
    return 'polygon';
  }
  if (/\b(?:pass(?:es|ing)?\s+through|line\s+(?:through|connecting|segment)|segment|slope|graph\s+of)\b/i.test(stem)) return 'lines';
  return 'none';
};

export const reconcileCoordinatePlaneFromStem = (question: QuestionVisualFields): void => {
  const stem = String(question.text || '');
  if (!stem) return;

  const coords = extractAllCoordinatesFromText(stem);
  if (coords.length < 1) return;

  const vs = question.visualSpec;
  if (
    vs?.visualType &&
    vs.visualType !== 'coordinate_plane' &&
    vs.visualType !== 'geometric_shape' &&
    vs.visualType !== 'none'
  ) {
    return;
  }

  const includeOrigin = /\b(origin|dilat|scale factor|reflected|reflection|across the\s+[xy]-?axis)\b/i.test(
    stem,
  );

  const bounds = computeBounds(coords, includeOrigin);
  const points: CoordinatePoint[] = coords.map((c) => ({
    x: c.x,
    y: c.y,
    label: c.label,
  }));

  question.visualSpec = {
    visualType: 'coordinate_plane',
    ...bounds,
    xTickStep: 1,
    yTickStep: 1,
    points,
    connect: connectionFromStem(stem, points.length),
    title: coords.length >= 3 ? 'Coordinate plane' : undefined,
  };
  question.imagePrompt = '';
};
