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
  } | null;
  imagePrompt?: string;
};

export type LabeledCoordinate = { label: string; x: number; y: number };

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

export const reconcileCoordinatePlaneFromStem = (question: QuestionVisualFields): void => {
  const stem = String(question.text || '');
  if (!stem) return;

  const coords = extractLabeledCoordinatesFromText(stem);
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
    title: coords.length >= 3 ? 'Coordinate plane' : undefined,
  };
  question.imagePrompt = '';
};
