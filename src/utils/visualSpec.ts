import {
  CoordinatePoint,
  GeometricShapeName,
  VisualFigure,
  VisualSpec,
  isSolidShape,
} from '../types';
import { BLOCK_TRAIN_COLOR_HEX, type BlockTrainColor } from './compareLengthVisual';

const GEOMETRIC_SHAPE_NAMES: ReadonlyArray<GeometricShapeName> = [
  'triangle',
  'right_triangle',
  'square',
  'rectangle',
  'parallelogram',
  'trapezoid',
  'pentagon',
  'hexagon',
  'cube',
  'rectangular_prism',
  'triangular_prism',
  'sphere',
  'cylinder',
  'cone',
  'pyramid',
];

const esc = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const parseFiniteNumbers = (values: unknown): number[] =>
  Array.isArray(values)
    ? values
        .map((v) => (typeof v === 'number' ? v : Number(v)))
        .filter((n) => Number.isFinite(n))
    : [];

const parseTableRows = (rows: unknown): string[][] => {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((row) => Array.isArray(row))
    .map((row) => (row as unknown[]).map((cell) => String(cell)));
};

/** Discrete number line (ticks + optional highlights). min/max required; values = positions to mark with dots. */
const renderNumberLine = (spec: VisualSpec): string | null => {
  const min = Number.isFinite(spec.min) ? Number(spec.min) : NaN;
  const max = Number.isFinite(spec.max) ? Number(spec.max) : NaN;
  if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) return null;

  let step = Number.isFinite(spec.tickStep) && Number(spec.tickStep) > 0 ? Number(spec.tickStep) : 1;
  const span = max - min;
  let ticks: number[] = [];
  for (let t = min; t <= max + step * 0.0001; t += step) {
    ticks.push(t);
    if (ticks.length > 60) break;
  }
  if (ticks.length > 40) {
    step = span / 39;
    ticks = [];
    for (let i = 0; i < 40; i++) ticks.push(min + (span * i) / 39);
  }

  const width = 800;
  const height = 380;
  const axisY = 220;
  const left = 72;
  const right = width - 72;
  const axisSpan = Math.max(right - left, 1);
  const xAt = (v: number) => left + ((v - min) / Math.max(span, 1e-9)) * axisSpan;

  const marks = parseFiniteNumbers(spec.values).filter((v) => v >= min && v <= max);
  const uniqMarks = [...new Set(marks)];

  // Fractional steps (tenths, quarters): label whole numbers only, so a point's
  // value is counted from the ticks instead of printed under it (it is often the answer).
  const labelEveryTick = Number.isInteger(step);
  const tickSvg = ticks
    .map((tick) => {
      const x = xAt(tick);
      const value = Number(tick.toFixed(6));
      const label = labelEveryTick || Number.isInteger(value)
        ? `<text x="${x}" y="${axisY + 38}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="17" fill="#334155">${value}</text>`
        : '';
      return `<g>
        <line x1="${x}" y1="${axisY}" x2="${x}" y2="${axisY + 12}" stroke="#334155" stroke-width="2.5" />
        ${label}
      </g>`;
    })
    .join('');

  const dotSvg = uniqMarks
    .map((v) => {
      const x = xAt(v);
      return `<circle cx="${x}" cy="${axisY - 28}" r="11" fill="#2563eb" stroke="#1e40af" stroke-width="2" />`;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" rx="18" fill="#ffffff" />
    ${spec.title ? `<text x="50%" y="44" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="700" fill="#0f172a">${esc(spec.title)}</text>` : ''}
    <line x1="${left}" y1="${axisY}" x2="${right}" y2="${axisY}" stroke="#334155" stroke-width="4" stroke-linecap="round" />
    ${tickSvg}
    ${dotSvg}
    ${spec.xLabel ? `<text x="${(left + right) / 2}" y="${height - 22}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="600" fill="#0f172a">${esc(spec.xLabel)}</text>` : ''}
  </svg>`;
};

/** Single horizontal fraction bar: totalParts equal segments, first shadedParts shaded. */
const renderFractionBar = (spec: VisualSpec): string | null => {
  const total = Number.isFinite(spec.totalParts) ? Math.floor(Number(spec.totalParts)) : NaN;
  const shaded = Number.isFinite(spec.shadedParts) ? Math.floor(Number(spec.shadedParts)) : NaN;
  if (!Number.isFinite(total) || total < 1 || total > 48) return null;
  if (!Number.isFinite(shaded) || shaded < 0 || shaded > total) return null;

  const width = 800;
  const height = 380;
  const barX = 100;
  const barY = 200;
  const barW = 600;
  const barH = 56;
  const segW = barW / total;

  const segs: string[] = [];
  for (let i = 0; i < total; i++) {
    const fill = i < shaded ? '#2563eb' : '#f1f5f9';
    const stroke = '#334155';
    segs.push(
      `<rect x="${barX + i * segW}" y="${barY}" width="${segW}" height="${barH}" fill="${fill}" stroke="${stroke}" stroke-width="2" />`,
    );
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" rx="18" fill="#ffffff" />
    ${spec.title ? `<text x="50%" y="52" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="700" fill="#0f172a">${esc(spec.title)}</text>` : ''}
    ${segs.join('')}
  </svg>`;
};

/** Rectangular array (e.g. 3×4); values row-major 0 = empty, ≥1 = dot. */
const renderArrayModel = (spec: VisualSpec): string | null => {
  const r = Number.isFinite(spec.gridRows) ? Math.floor(Number(spec.gridRows)) : NaN;
  const c = Number.isFinite(spec.gridCols) ? Math.floor(Number(spec.gridCols)) : NaN;
  if (!Number.isFinite(r) || !Number.isFinite(c) || r < 1 || c < 1 || r * c > 120) return null;

  const raw = Array.isArray(spec.values) ? spec.values.map((v) => Number(v)) : [];
  const cells: number[] = [];
  const n = r * c;
  for (let i = 0; i < n; i++) {
    const v = raw[i];
    cells.push(Number.isFinite(v) && v >= 1 ? 1 : 0);
  }

  const width = 800;
  const height = 450;
  const cellSize = Math.min(72, Math.floor(520 / Math.max(c, r)));
  const gridLeft = (width - c * cellSize) / 2;
  const gridTop = spec.title ? 110 : 90;
  const dotR = Math.min(22, cellSize * 0.32);

  const rowColors = (spec.rowColors || []).map((color) => String(color).toLowerCase());
  const rects: string[] = [];
  const dots: string[] = [];
  let idx = 0;
  for (let row = 0; row < r; row++) {
    const rowColorName = rowColors[row] as BlockTrainColor | undefined;
    const rowFill =
      rowColorName && rowColorName in BLOCK_TRAIN_COLOR_HEX
        ? BLOCK_TRAIN_COLOR_HEX[rowColorName]
        : '#2563eb';
    for (let col = 0; col < c; col++) {
      const x0 = gridLeft + col * cellSize;
      const y0 = gridTop + row * cellSize;
      rects.push(
        `<rect x="${x0}" y="${y0}" width="${cellSize}" height="${cellSize}" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="2.5" />`,
      );
      if (cells[idx]) {
        const cx = x0 + cellSize / 2;
        const cy = y0 + cellSize / 2;
        dots.push(`<circle cx="${cx}" cy="${cy}" r="${dotR}" fill="${rowFill}" />`);
      }
      idx++;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" rx="18" fill="#ffffff" />
    ${spec.title ? `<text x="50%" y="56" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="700" fill="#0f172a">${esc(spec.title)}</text>` : ''}
    ${rects.join('')}
    ${dots.join('')}
  </svg>`;
};

/** Area model: gridRows × gridCols rectangle with optional outer labels (row/col) and inner cell text. */
const renderAreaModel = (spec: VisualSpec): string | null => {
  const r = Number.isFinite(spec.gridRows) ? Math.floor(Number(spec.gridRows)) : NaN;
  const c = Number.isFinite(spec.gridCols) ? Math.floor(Number(spec.gridCols)) : NaN;
  if (!Number.isFinite(r) || !Number.isFinite(c) || r < 1 || c < 1 || r > 8 || c > 8) return null;

  const rowLabels = (spec.rowLabels || []).map(String);
  const colLabels = (spec.colLabels || []).map(String);
  const cellLabels = (spec.cellLabels || []).map(String);

  const width = 800;
  const height = 460;
  const top = spec.title ? 100 : 70;
  const labelGutter = 56;
  const left = 130;
  const right = width - 70;
  const bottom = height - 60;
  const gridW = right - left;
  const gridH = bottom - top - labelGutter;
  const cellW = gridW / c;
  const cellH = gridH / r;

  const hr = Number.isFinite(spec.highlightRows)
    ? Math.max(0, Math.min(r, Math.floor(Number(spec.highlightRows))))
    : 0;
  const hc = Number.isFinite(spec.highlightCols)
    ? Math.max(0, Math.min(c, Math.floor(Number(spec.highlightCols))))
    : 0;
  const FILL_DEFAULT = '#eef2ff';
  const FILL_ROW = '#fde68a';
  const FILL_COL = '#93c5fd';
  const FILL_OVERLAP = '#86efac';

  const rects: string[] = [];
  const inner: string[] = [];
  let idx = 0;
  for (let row = 0; row < r; row++) {
    for (let col = 0; col < c; col++) {
      const x0 = left + col * cellW;
      const y0 = top + labelGutter + row * cellH;
      const inRow = row < hr;
      const inCol = col < hc;
      const fill =
        inRow && inCol ? FILL_OVERLAP : inRow ? FILL_ROW : inCol ? FILL_COL : FILL_DEFAULT;
      rects.push(
        `<rect x="${x0}" y="${y0}" width="${cellW}" height="${cellH}" fill="${fill}" stroke="#1e3a8a" stroke-width="2.5" />`,
      );
      const cellText = cellLabels[idx];
      if (cellText) {
        inner.push(
          `<text x="${x0 + cellW / 2}" y="${y0 + cellH / 2 + 8}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="600" fill="#1e293b">${esc(cellText)}</text>`,
        );
      }
      idx++;
    }
  }

  const colHeaders = colLabels
    .slice(0, c)
    .map(
      (label, i) =>
        `<text x="${left + i * cellW + cellW / 2}" y="${top + labelGutter - 18}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="700" fill="#0f172a">${esc(label)}</text>`,
    )
    .join('');

  const rowHeaders = rowLabels
    .slice(0, r)
    .map(
      (label, i) =>
        `<text x="${left - 18}" y="${top + labelGutter + i * cellH + cellH / 2 + 8}" text-anchor="end" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="700" fill="#0f172a">${esc(label)}</text>`,
    )
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" rx="18" fill="#ffffff" />
    ${spec.title ? `<text x="50%" y="56" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="700" fill="#0f172a">${esc(spec.title)}</text>` : ''}
    ${rects.join('')}
    ${colHeaders}
    ${rowHeaders}
    ${inner.join('')}
  </svg>`;
};

/** Fraction circle / pie chart: totalParts equal sectors, first shadedParts shaded. */
const renderFractionCircle = (spec: VisualSpec): string | null => {
  const total = Number.isFinite(spec.totalParts) ? Math.floor(Number(spec.totalParts)) : NaN;
  const shaded = Number.isFinite(spec.shadedParts) ? Math.floor(Number(spec.shadedParts)) : NaN;
  if (!Number.isFinite(total) || total < 1 || total > 24) return null;
  if (!Number.isFinite(shaded) || shaded < 0 || shaded > total) return null;

  const width = 800;
  const height = 460;
  const cx = width / 2;
  const cy = spec.title ? 250 : 230;
  const r = 160;

  const arcs: string[] = [];
  const sliceAngle = (2 * Math.PI) / total;
  for (let i = 0; i < total; i++) {
    const a0 = -Math.PI / 2 + i * sliceAngle;
    const a1 = a0 + sliceAngle;
    const x0 = cx + r * Math.cos(a0);
    const y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy + r * Math.sin(a1);
    const largeArc = sliceAngle > Math.PI ? 1 : 0;
    const fill = i < shaded ? '#2563eb' : '#f1f5f9';
    if (total === 1) {
      arcs.push(
        `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="#1e293b" stroke-width="2.5" />`,
      );
    } else {
      arcs.push(
        `<path d="M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${largeArc} 1 ${x1} ${y1} Z" fill="${fill}" stroke="#1e293b" stroke-width="2.5" />`,
      );
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" rx="18" fill="#ffffff" />
    ${spec.title ? `<text x="50%" y="56" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="700" fill="#0f172a">${esc(spec.title)}</text>` : ''}
    ${arcs.join('')}
  </svg>`;
};

const parseCoordinatePoints = (raw: unknown): CoordinatePoint[] => {
  if (!Array.isArray(raw)) return [];
  const out: CoordinatePoint[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const e = entry as { x?: unknown; y?: unknown; label?: unknown };
    const x = typeof e.x === 'number' ? e.x : Number(e.x);
    const y = typeof e.y === 'number' ? e.y : Number(e.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    const label = typeof e.label === 'string' ? e.label : undefined;
    out.push({ x, y, label });
  }
  return out;
};

/** Coordinate plane: rectangular grid with axes, ticks, optional plotted points (and labels). */
const renderCoordinatePlane = (spec: VisualSpec): string | null => {
  const xMin = Number.isFinite(spec.xMin) ? Number(spec.xMin) : -10;
  const xMax = Number.isFinite(spec.xMax) ? Number(spec.xMax) : 10;
  const yMin = Number.isFinite(spec.yMin) ? Number(spec.yMin) : -10;
  const yMax = Number.isFinite(spec.yMax) ? Number(spec.yMax) : 10;
  if (xMax <= xMin || yMax <= yMin) return null;
  const xStep = Number.isFinite(spec.xTickStep) && Number(spec.xTickStep) > 0 ? Number(spec.xTickStep) : 1;
  const yStep = Number.isFinite(spec.yTickStep) && Number(spec.yTickStep) > 0 ? Number(spec.yTickStep) : 1;
  if ((xMax - xMin) / xStep > 40 || (yMax - yMin) / yStep > 40) return null;

  const width = 800;
  const height = 540;
  const top = spec.title ? 90 : 60;
  const left = 80;
  const right = width - 60;
  const bottom = height - 60;
  const plotW = right - left;
  const plotH = bottom - top;
  const xAt = (v: number) => left + ((v - xMin) / (xMax - xMin)) * plotW;
  const yAt = (v: number) => bottom - ((v - yMin) / (yMax - yMin)) * plotH;

  const grid: string[] = [];
  for (let x = xMin; x <= xMax + xStep * 0.0001; x += xStep) {
    const px = xAt(x);
    grid.push(
      `<line x1="${px}" y1="${top}" x2="${px}" y2="${bottom}" stroke="#e2e8f0" stroke-width="1" />`,
    );
  }
  for (let y = yMin; y <= yMax + yStep * 0.0001; y += yStep) {
    const py = yAt(y);
    grid.push(
      `<line x1="${left}" y1="${py}" x2="${right}" y2="${py}" stroke="#e2e8f0" stroke-width="1" />`,
    );
  }

  const x0InRange = xMin <= 0 && xMax >= 0;
  const y0InRange = yMin <= 0 && yMax >= 0;
  const axes: string[] = [];
  if (y0InRange) {
    const py = yAt(0);
    axes.push(
      `<line x1="${left}" y1="${py}" x2="${right}" y2="${py}" stroke="#0f172a" stroke-width="2.5" />`,
    );
  }
  if (x0InRange) {
    const px = xAt(0);
    axes.push(
      `<line x1="${px}" y1="${top}" x2="${px}" y2="${bottom}" stroke="#0f172a" stroke-width="2.5" />`,
    );
  }

  const ticks: string[] = [];
  const axisY = y0InRange ? yAt(0) : bottom;
  for (let x = xMin; x <= xMax + xStep * 0.0001; x += xStep) {
    if (Math.abs(x) < 1e-9) continue;
    const px = xAt(x);
    const labelVal = Number.isInteger(x) ? x : Number(x.toFixed(2));
    ticks.push(
      `<text x="${px}" y="${axisY + 22}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="14" fill="#334155">${labelVal}</text>`,
    );
  }
  const axisX = x0InRange ? xAt(0) : left;
  for (let y = yMin; y <= yMax + yStep * 0.0001; y += yStep) {
    if (Math.abs(y) < 1e-9) continue;
    const py = yAt(y);
    const labelVal = Number.isInteger(y) ? y : Number(y.toFixed(2));
    ticks.push(
      `<text x="${axisX - 8}" y="${py + 5}" text-anchor="end" font-family="Inter, Arial, sans-serif" font-size="14" fill="#334155">${labelVal}</text>`,
    );
  }

  const points = parseCoordinatePoints(spec.points).filter(
    (p) => p.x >= xMin && p.x <= xMax && p.y >= yMin && p.y <= yMax,
  );
  const pointSvg = points
    .map((p) => {
      const cx = xAt(p.x);
      const cy = yAt(p.y);
      const labelText =
        p.label ||
        `(${Number.isInteger(p.x) ? p.x : Number(p.x.toFixed(2))}, ${Number.isInteger(p.y) ? p.y : Number(p.y.toFixed(2))})`;
      return `<g>
        <circle cx="${cx}" cy="${cy}" r="7" fill="#2563eb" stroke="#1e3a8a" stroke-width="2" />
        <text x="${cx + 12}" y="${cy - 12}" font-family="Inter, Arial, sans-serif" font-size="16" font-weight="600" fill="#1e3a8a">${esc(labelText)}</text>
      </g>`;
    })
    .join('');

  const connect = spec.connect ?? (points.length >= 3 ? 'polygon' : 'lines');
  const ptsAttr = (ps: CoordinatePoint[]) => ps.map((p) => `${xAt(p.x)},${yAt(p.y)}`).join(' ');
  const stroke = 'stroke="#2563eb" stroke-width="2.5" stroke-linejoin="round"';
  let polygonSvg = '';
  if (connect === 'polygon' && points.length >= 3) {
    polygonSvg = `<polyline points="${ptsAttr([...points, points[0]])}" fill="rgba(37, 99, 235, 0.12)" ${stroke} />`;
  } else if (connect !== 'none' && points.length >= 2) {
    const [a, b] = points;
    const collinear = points.every((p) => Math.abs((b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x)) < 1e-9);
    // Several points on one line: one segment end to end. Otherwise each consecutive pair is its own line.
    const segments = collinear
      ? [[...points].sort((p, q) => p.x - q.x || p.y - q.y)]
      : Array.from({ length: Math.floor(points.length / 2) }, (_, i) => points.slice(2 * i, 2 * i + 2));
    polygonSvg = segments.map((s) => `<polyline points="${ptsAttr(s)}" fill="none" ${stroke} />`).join('');
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" rx="18" fill="#ffffff" />
    ${spec.title ? `<text x="50%" y="50" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="700" fill="#0f172a">${esc(spec.title)}</text>` : ''}
    ${grid.join('')}
    ${axes.join('')}
    ${ticks.join('')}
    ${polygonSvg}
    ${pointSvg}
    ${spec.xLabel ? `<text x="${(left + right) / 2}" y="${height - 18}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="600" fill="#0f172a">${esc(spec.xLabel)}</text>` : ''}
    ${spec.yLabel ? `<text x="22" y="${(top + bottom) / 2}" transform="rotate(-90 22 ${(top + bottom) / 2})" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="600" fill="#0f172a">${esc(spec.yLabel)}</text>` : ''}
  </svg>`;
};

const polygonPoints = (
  shape: GeometricShapeName,
  cx: number,
  cy: number,
  size: number,
  aspect: number,
): Array<{ x: number; y: number }> => {
  if (shape === 'triangle') {
    const h = size * Math.sqrt(3) / 2;
    return [
      { x: cx, y: cy - h * 0.6 },
      { x: cx - size / 2, y: cy + h * 0.4 },
      { x: cx + size / 2, y: cy + h * 0.4 },
    ];
  }
  if (shape === 'right_triangle') {
    const w = size;
    const h = size * aspect;
    return [
      { x: cx - w / 2, y: cy + h / 2 },
      { x: cx + w / 2, y: cy + h / 2 },
      { x: cx - w / 2, y: cy - h / 2 },
    ];
  }
  if (shape === 'square') {
    const s = size;
    return [
      { x: cx - s / 2, y: cy - s / 2 },
      { x: cx + s / 2, y: cy - s / 2 },
      { x: cx + s / 2, y: cy + s / 2 },
      { x: cx - s / 2, y: cy + s / 2 },
    ];
  }
  if (shape === 'rectangle') {
    const w = size;
    const h = size * aspect;
    return [
      { x: cx - w / 2, y: cy - h / 2 },
      { x: cx + w / 2, y: cy - h / 2 },
      { x: cx + w / 2, y: cy + h / 2 },
      { x: cx - w / 2, y: cy + h / 2 },
    ];
  }
  if (shape === 'parallelogram') {
    const w = size;
    const h = size * aspect;
    const slant = size * 0.25;
    return [
      { x: cx - w / 2 + slant, y: cy - h / 2 },
      { x: cx + w / 2 + slant, y: cy - h / 2 },
      { x: cx + w / 2 - slant, y: cy + h / 2 },
      { x: cx - w / 2 - slant, y: cy + h / 2 },
    ];
  }
  if (shape === 'trapezoid') {
    const w = size;
    const h = size * aspect;
    const inset = size * 0.18;
    return [
      { x: cx - w / 2 + inset, y: cy - h / 2 },
      { x: cx + w / 2 - inset, y: cy - h / 2 },
      { x: cx + w / 2, y: cy + h / 2 },
      { x: cx - w / 2, y: cy + h / 2 },
    ];
  }
  const sides = shape === 'pentagon' ? 5 : 6;
  const pts: Array<{ x: number; y: number }> = [];
  const r = size / 2;
  const startAngle = -Math.PI / 2;
  for (let i = 0; i < sides; i++) {
    const a = startAngle + (2 * Math.PI * i) / sides;
    pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  }
  return pts;
};

const parseGeometricShapeNames = (spec: VisualSpec): GeometricShapeName[] => {
  const fromList = Array.isArray(spec.shapes)
    ? spec.shapes.filter((shape): shape is GeometricShapeName =>
        GEOMETRIC_SHAPE_NAMES.includes(shape as GeometricShapeName),
      )
    : [];
  if (fromList.length >= 2) return fromList.slice(0, 4);
  if (spec.shapeName && GEOMETRIC_SHAPE_NAMES.includes(spec.shapeName)) return [spec.shapeName];
  return [];
};

const renderGeometricShapePolygon = (
  shape: GeometricShapeName,
  cx: number,
  cy: number,
  baseSize: number,
  aspect: number,
): string => {
  const verts = polygonPoints(shape, cx, cy, baseSize, aspect);
  const pointsAttr = verts.map((p) => `${p.x},${p.y}`).join(' ');
  return `<polygon points="${pointsAttr}" fill="#dbeafe" stroke="#1e3a8a" stroke-width="3" stroke-linejoin="round" />`;
};

const SOLID_STROKE = 'stroke="#1e3a8a" stroke-width="3" stroke-linejoin="round"';
const SOLID_FRONT = '#dbeafe';
const SOLID_TOP = '#eff6ff';
const SOLID_SIDE = '#bfdbfe';

/**
 * Pseudo-3D solid rendering (front + top + right faces) so cube/prism/sphere/
 * cylinder/cone/pyramid standards get an honest figure. Purely deterministic.
 */
const solidShapeSvg = (
  shape: GeometricShapeName,
  cx: number,
  cy: number,
  width: number,
  height: number,
): string => {
  const w = Math.max(width, 12);
  const h = Math.max(height, 12);
  const d = Math.min(w, h) * 0.26;
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  const y0 = cy - h / 2;
  const y1 = cy + h / 2;
  const r = Math.min(w, h) / 2;

  if (shape === 'sphere') {
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${SOLID_FRONT}" ${SOLID_STROKE} />
      <ellipse cx="${cx - r * 0.32}" cy="${cy - r * 0.34}" rx="${r * 0.42}" ry="${r * 0.26}" fill="#ffffff" opacity="0.65" />`;
  }

  if (shape === 'cylinder') {
    const rx = w / 2;
    const ry = Math.max(6, h * 0.16);
    return `<rect x="${x0}" y="${y0 + ry}" width="${w}" height="${h - 2 * ry}" fill="${SOLID_FRONT}" ${SOLID_STROKE} />
      <ellipse cx="${cx}" cy="${y1 - ry}" rx="${rx}" ry="${ry}" fill="${SOLID_SIDE}" ${SOLID_STROKE} />
      <ellipse cx="${cx}" cy="${y0 + ry}" rx="${rx}" ry="${ry}" fill="${SOLID_TOP}" ${SOLID_STROKE} />`;
  }

  if (shape === 'cone') {
    const rx = w / 2;
    const ry = Math.max(6, h * 0.16);
    return `<path d="M ${cx} ${y0} L ${x1} ${y1 - ry} A ${rx} ${ry} 0 0 1 ${x0} ${y1 - ry} Z" fill="${SOLID_FRONT}" ${SOLID_STROKE} />
      <ellipse cx="${cx}" cy="${y1 - ry}" rx="${rx}" ry="${ry}" fill="${SOLID_TOP}" ${SOLID_STROKE} />`;
  }

  if (shape === 'pyramid') {
    const baseHalf = w / 2;
    const baseY = y1;
    const backY = y1 - h * 0.2;
    return `<polygon points="${cx},${y0} ${x1},${backY} ${cx},${baseY} ${x0},${backY}" fill="${SOLID_FRONT}" ${SOLID_STROKE} />
      <polygon points="${cx},${y0} ${x0},${backY} ${cx - baseHalf * 0.5},${backY + h * 0.06}" fill="${SOLID_SIDE}" ${SOLID_STROKE} />
      <polygon points="${cx},${y0} ${x1},${backY} ${cx + baseHalf * 0.5},${backY + h * 0.06}" fill="${SOLID_TOP}" ${SOLID_STROKE} />`;
  }

  // Prisms: cube, rectangular_prism, triangular_prism.
  // A cube's front face must be square whatever box the layout gives it (LC flagged a wide one as a prism).
  const side = Math.min(w, h);
  const frontW = (shape === 'cube' ? side : w) - d;
  const frontH = (shape === 'cube' ? side : h) - d;
  const fx = x0;
  const fy = y0 + d;
  const top = `<polygon points="${fx},${fy} ${fx + d},${y0} ${fx + frontW + d},${y0} ${fx + frontW},${fy}" fill="${SOLID_TOP}" ${SOLID_STROKE} />`;
  const right = `<polygon points="${fx + frontW},${fy} ${fx + frontW + d},${y0} ${fx + frontW + d},${y0 + frontH} ${fx + frontW},${y0 + frontH + d}" fill="${SOLID_SIDE}" ${SOLID_STROKE} />`;
  const front =
    shape === 'triangular_prism'
      ? `<polygon points="${fx},${fy + frontH} ${fx + frontW},${fy + frontH} ${fx + frontW / 2},${fy}" fill="${SOLID_FRONT}" ${SOLID_STROKE} />`
      : `<rect x="${fx}" y="${fy}" width="${frontW}" height="${frontH}" fill="${SOLID_FRONT}" ${SOLID_STROKE} />`;
  return top + right + front;
};

const DEFAULT_FIGURE_UNITS: Record<GeometricShapeName, { width: number; height: number }> = {
  triangle: { width: 6, height: 5 },
  right_triangle: { width: 6, height: 4 },
  square: { width: 5, height: 5 },
  rectangle: { width: 6, height: 4 },
  parallelogram: { width: 6, height: 4 },
  trapezoid: { width: 6, height: 4 },
  pentagon: { width: 5, height: 5 },
  hexagon: { width: 5, height: 5 },
  cube: { width: 5, height: 5 },
  rectangular_prism: { width: 6, height: 4 },
  triangular_prism: { width: 6, height: 5 },
  sphere: { width: 5, height: 5 },
  cylinder: { width: 4, height: 6 },
  cone: { width: 5, height: 6 },
  pyramid: { width: 6, height: 5 },
};

const figureDimensions = (figure: VisualFigure): { width: number; height: number; measured: boolean } => {
  const shape = GEOMETRIC_SHAPE_NAMES.includes(figure.shape) ? figure.shape : 'rectangle';
  const rawWidth = Number(figure.width);
  const rawHeight = Number(figure.height);
  const width = Number.isFinite(rawWidth) && rawWidth > 0 ? rawWidth : undefined;
  const height = Number.isFinite(rawHeight) && rawHeight > 0 ? rawHeight : undefined;
  if (shape === 'square') {
    const side = width ?? height ?? DEFAULT_FIGURE_UNITS.square.width;
    return { width: side, height: side, measured: width !== undefined || height !== undefined };
  }
  const fallback = DEFAULT_FIGURE_UNITS[shape];
  const outWidth = width ?? (height ? height / 0.7 : fallback.width);
  const outHeight = height ?? (width ? width * 0.7 : fallback.height);
  return { width: outWidth, height: outHeight, measured: width !== undefined || height !== undefined };
};

const figureVertices = (
  shape: GeometricShapeName,
  cx: number,
  cy: number,
  width: number,
  height: number,
): Array<{ x: number; y: number }> => {
  if (shape === 'triangle') {
    return [
      { x: cx, y: cy - height / 2 },
      { x: cx - width / 2, y: cy + height / 2 },
      { x: cx + width / 2, y: cy + height / 2 },
    ];
  }
  if (shape === 'right_triangle') {
    return [
      { x: cx - width / 2, y: cy + height / 2 },
      { x: cx + width / 2, y: cy + height / 2 },
      { x: cx - width / 2, y: cy - height / 2 },
    ];
  }
  if (shape === 'pentagon' || shape === 'hexagon') {
    return polygonPoints(shape, cx, cy, Math.max(width, height), height / Math.max(width, height));
  }
  return polygonPoints(shape, cx, cy, width, height / Math.max(width, 0.001));
};

type FigurePlacement = {
  figure: VisualFigure;
  shape: GeometricShapeName;
  widthUnits: number;
  heightUnits: number;
  measured: boolean;
};

/**
 * Render one or more named/measured figures on a shared scale.
 * Exact label text is drawn as SVG <text>, so the coverage gate can verify it.
 */
const renderFigureGroup = (spec: VisualSpec, figures: VisualFigure[]): string | null => {
  if (!figures.length || figures.length > 4) return null;

  const width = 900;
  const height = 600;
  const usableW = width - 140;
  const usableH = 360;
  const figureAreaTop = spec.title ? 150 : 125;
  const gapPx = figures.length > 1 ? 100 : 0;

  const placements: FigurePlacement[] = figures.map((figure) => {
    const shape = GEOMETRIC_SHAPE_NAMES.includes(figure.shape) ? figure.shape : 'rectangle';
    const dims = figureDimensions({ ...figure, shape });
    return {
      figure,
      shape,
      widthUnits: dims.width,
      heightUnits: dims.height,
      measured: dims.measured,
    };
  });

  const totalUnitsW = placements.reduce((sum, entry) => sum + entry.widthUnits, 0);
  const maxUnitsH = Math.max(...placements.map((entry) => entry.heightUnits), 0.001);
  const maxScaleW = (usableW - gapPx * (placements.length - 1)) / Math.max(totalUnitsW, 0.001);
  const maxScaleH = usableH / maxUnitsH;
  const scale = Math.min(maxScaleW, maxScaleH, 120);
  if (!Number.isFinite(scale) || scale <= 0) return null;

  const pixelWidths = placements.map((entry) => Math.max(entry.widthUnits * scale, 24));
  const pixelHeights = placements.map((entry) => Math.max(entry.heightUnits * scale, 24));
  const totalPixelW = pixelWidths.reduce((sum, value) => sum + value, 0) + gapPx * (placements.length - 1);
  let xCursor = (width - totalPixelW) / 2;

  const nameLabels: string[] = [];
  const shapesSvg: string[] = [];
  const dimensionSvg: string[] = [];
  const areaSvg: string[] = [];
  const angleSvg: string[] = [];

  placements.forEach((entry, index) => {
    const wPx = pixelWidths[index];
    const hPx = pixelHeights[index];
    const cx = xCursor + wPx / 2;
    const cy = figureAreaTop + (usableH - hPx) / 2;
    const x0 = cx - wPx / 2;
    const x1 = cx + wPx / 2;
    const y0 = cy - hPx / 2;
    const y1 = cy + hPx / 2;

    const verts = isSolidShape(entry.shape)
      ? []
      : figureVertices(entry.shape, cx, cy, wPx, hPx);
    if (isSolidShape(entry.shape)) {
      shapesSvg.push(solidShapeSvg(entry.shape, cx, cy, wPx, hPx));
    } else {
      const pointsAttr = verts.map((point) => `${point.x},${point.y}`).join(' ');
      shapesSvg.push(
        `<polygon points="${pointsAttr}" fill="#dbeafe" stroke="#1e3a8a" stroke-width="3" stroke-linejoin="round" />`,
      );
    }

    const nameLabel = String(entry.figure.nameLabel || (entry.figure.id ? `${entry.shape} ${entry.figure.id}` : '')).trim();
    if (nameLabel) {
      const topDimension = (entry.figure.dimensions || []).some((dimension) => dimension.side === 'top');
      const labelY = topDimension ? y0 - 58 : y0 - 22;
      nameLabels.push(
        `<text x="${cx}" y="${labelY}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="700" fill="#0f172a">${esc(nameLabel)}</text>`,
      );
    }

    const sideCounts = new Map<string, number>();
    for (const dimension of entry.figure.dimensions || []) {
      const label = String(dimension?.label || '').trim();
      if (!label) continue;
      const side = dimension.side;
      const sideIndex = sideCounts.get(side) || 0;
      sideCounts.set(side, sideIndex + 1);
      const extra = sideIndex * 30;
      if (side === 'top') {
        const y = y0 - 26 - extra;
        dimensionSvg.push(
          `<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="#475569" stroke-width="1.6" />`,
          `<line x1="${x0}" y1="${y0}" x2="${x0}" y2="${y}" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="4 3" />`,
          `<line x1="${x1}" y1="${y0}" x2="${x1}" y2="${y}" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="4 3" />`,
          `<text x="${cx}" y="${y - 10}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="600" fill="#0f172a">${esc(label)}</text>`,
        );
      } else if (side === 'right') {
        const x = x1 + 26 + extra;
        dimensionSvg.push(
          `<line x1="${x}" y1="${y0}" x2="${x}" y2="${y1}" stroke="#475569" stroke-width="1.6" />`,
          `<line x1="${x1}" y1="${y0}" x2="${x}" y2="${y0}" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="4 3" />`,
          `<line x1="${x1}" y1="${y1}" x2="${x}" y2="${y1}" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="4 3" />`,
          `<text x="${x + 10}" y="${cy + 6}" text-anchor="start" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="600" fill="#0f172a">${esc(label)}</text>`,
        );
      } else if (side === 'bottom') {
        const y = y1 + 26 + extra;
        dimensionSvg.push(
          `<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="#475569" stroke-width="1.6" />`,
          `<line x1="${x0}" y1="${y1}" x2="${x0}" y2="${y}" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="4 3" />`,
          `<line x1="${x1}" y1="${y1}" x2="${x1}" y2="${y}" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="4 3" />`,
          `<text x="${cx}" y="${y + 24}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="600" fill="#0f172a">${esc(label)}</text>`,
        );
      } else {
        const x = x0 - 26 - extra;
        dimensionSvg.push(
          `<line x1="${x}" y1="${y0}" x2="${x}" y2="${y1}" stroke="#475569" stroke-width="1.6" />`,
          `<line x1="${x0}" y1="${y0}" x2="${x}" y2="${y0}" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="4 3" />`,
          `<line x1="${x0}" y1="${y1}" x2="${x}" y2="${y1}" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="4 3" />`,
          `<text x="${x - 10}" y="${cy + 6}" text-anchor="end" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="600" fill="#0f172a">${esc(label)}</text>`,
        );
      }
    }

    const areaLabel = String(entry.figure.areaLabel || '').trim();
    if (areaLabel) {
      areaSvg.push(
        `<text x="${cx}" y="${cy + 6}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="600" fill="#1e3a8a">${esc(areaLabel)}</text>`,
      );
    }

    const angleLabels = (entry.figure.angleLabels || []).map(String).filter(Boolean);
    angleLabels.slice(0, verts.length).forEach((label, vertexIndex) => {
      const vertex = verts[vertexIndex];
      const dx = cx - vertex.x;
      const dy = cy - vertex.y;
      const len = Math.max(Math.hypot(dx, dy), 1);
      const inset = 26;
      angleSvg.push(
        `<text x="${vertex.x + (dx / len) * inset}" y="${vertex.y + (dy / len) * inset + 5}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="15" font-weight="600" fill="#1d4ed8">${esc(label)}</text>`,
      );
    });

    xCursor += wPx + gapPx;
  });

  const descParts = placements.map((entry) => {
    const labels = [
      entry.figure.nameLabel,
      ...(entry.figure.dimensions || []).map((dimension) => dimension.label),
      entry.figure.areaLabel,
    ].filter(Boolean);
    return labels.length ? labels.join(', ') : entry.shape;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
    <title>${esc(spec.title || 'Geometry diagram')}</title>
    <desc>${esc(descParts.join('; '))}</desc>
    <rect width="${width}" height="${height}" rx="18" fill="#ffffff" />
    ${spec.title ? `<text x="50%" y="56" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="700" fill="#0f172a">${esc(spec.title)}</text>` : ''}
    ${shapesSvg.join('')}
    ${dimensionSvg.join('')}
    ${areaSvg.join('')}
    ${angleSvg.join('')}
    ${nameLabels.join('')}
  </svg>`;
};

/** Geometric shape: named polygon with optional side and angle labels (clockwise from first vertex). */
const renderGeometricShape = (spec: VisualSpec): string | null => {
  if (Array.isArray(spec.figures) && spec.figures.length > 0) {
    return renderFigureGroup(spec, spec.figures);
  }

  const shapeList = parseGeometricShapeNames(spec);
  if (!shapeList.length) return null;

  const width = 800;
  const height = 480;
  const cy = spec.title ? 260 : 240;

  if (shapeList.length >= 2) {
    const count = shapeList.length;
    const margin = 90;
    const usable = width - margin * 2;
    const baseSize = Math.min(220, usable / count - 36);
    const polygons = shapeList
      .map((shape, index) => {
        const cx = margin + (usable * (index + 0.5)) / count;
        return isSolidShape(shape)
          ? solidShapeSvg(shape, cx, cy, baseSize, baseSize * 0.7)
          : renderGeometricShapePolygon(shape, cx, cy, baseSize, 0.7);
      })
      .join('');

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" rx="18" fill="#ffffff" />
    ${spec.title ? `<text x="50%" y="56" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="700" fill="#0f172a">${esc(spec.title)}</text>` : ''}
    ${polygons}
  </svg>`;
  }

  const shape = shapeList[0];
  const cx = width / 2;
  const baseSize = 280;

  let aspect = 0.7;
  if (Number.isFinite(spec.shapeWidth) && Number.isFinite(spec.shapeHeight)) {
    const w = Math.max(Number(spec.shapeWidth), 0.1);
    const h = Math.max(Number(spec.shapeHeight), 0.1);
    aspect = h / w;
  }
  aspect = Math.min(Math.max(aspect, 0.2), 1.6);

  const solid = isSolidShape(shape);
  const verts = solid ? [] : polygonPoints(shape, cx, cy, baseSize, aspect);
  const pointsAttr = verts.map((p) => `${p.x},${p.y}`).join(' ');
  const bodySvg = solid
    ? solidShapeSvg(shape, cx, cy, baseSize, baseSize * aspect)
    : `<polygon points="${pointsAttr}" fill="#dbeafe" stroke="#1e3a8a" stroke-width="3" stroke-linejoin="round" />`;

  const sideLabels = (spec.sideLabels || []).map(String);
  const angleLabels = (spec.angleLabels || []).map(String);

  const sideSvg = sideLabels
    .slice(0, verts.length)
    .map((label, i) => {
      const a = verts[i];
      const b = verts[(i + 1) % verts.length];
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.max(Math.hypot(dx, dy), 1);
      const offset = 22;
      const tx = mx + (dy / len) * offset;
      const ty = my - (dx / len) * offset;
      return `<text x="${tx}" y="${ty + 6}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="600" fill="#0f172a">${esc(label)}</text>`;
    })
    .join('');

  const angleSvg = angleLabels
    .slice(0, verts.length)
    .map((label, i) => {
      const v = verts[i];
      const dx = cx - v.x;
      const dy = cy - v.y;
      const len = Math.max(Math.hypot(dx, dy), 1);
      const inset = 28;
      const tx = v.x + (dx / len) * inset;
      const ty = v.y + (dy / len) * inset;
      return `<text x="${tx}" y="${ty + 5}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="16" font-weight="600" fill="#1d4ed8">${esc(label)}</text>`;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" rx="18" fill="#ffffff" />
    ${spec.title ? `<text x="50%" y="56" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="700" fill="#0f172a">${esc(spec.title)}</text>` : ''}
    ${bodySvg}
    ${sideSvg}
    ${angleSvg}
  </svg>`;
};

/** Tape diagram / bar model: ordered segments with optional weights (relative widths) and labels. */
const renderBarModel = (spec: VisualSpec): string | null => {
  const labels = (spec.segmentLabels || []).map(String);
  if (!labels.length || labels.length > 12) return null;

  const weightsRaw = Array.isArray(spec.segmentWeights) ? spec.segmentWeights : [];
  let weights = labels.map((_, i) => {
    const w = Number(weightsRaw[i]);
    return Number.isFinite(w) && w > 0 ? w : 1;
  });
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) weights = labels.map(() => 1);
  const sum = weights.reduce((a, b) => a + b, 0);

  const shadedRaw = Array.isArray(spec.segmentShaded) ? spec.segmentShaded : [];

  const width = 800;
  const height = 320;
  const top = spec.title ? 110 : 90;
  const left = 70;
  const right = width - 70;
  const barW = right - left;
  const barH = 90;

  const segs: string[] = [];
  let x = left;
  for (let i = 0; i < labels.length; i++) {
    const w = (weights[i] / sum) * barW;
    const isShaded = Number(shadedRaw[i]) >= 1;
    const fill = isShaded ? '#2563eb' : '#eff6ff';
    const textColor = isShaded ? '#ffffff' : '#0f172a';
    segs.push(
      `<g>
        <rect x="${x}" y="${top}" width="${w}" height="${barH}" fill="${fill}" stroke="#1e3a8a" stroke-width="2.5" />
        <text x="${x + w / 2}" y="${top + barH / 2 + 8}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="600" fill="${textColor}">${esc(labels[i])}</text>
      </g>`,
    );
    x += w;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" rx="18" fill="#ffffff" />
    ${spec.title ? `<text x="50%" y="56" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="700" fill="#0f172a">${esc(spec.title)}</text>` : ''}
    ${segs.join('')}
  </svg>`;
};

/** Analog clock: 12 hour ticks, hour and minute hands. hour 0-23 (mod 12), minute 0-59. */
const renderClockFace = (spec: VisualSpec): string | null => {
  const hourRaw = Number(spec.hour);
  const minuteRaw = Number(spec.minute);
  if (!Number.isFinite(hourRaw) || !Number.isFinite(minuteRaw)) return null;
  const hour = ((Math.floor(hourRaw) % 12) + 12) % 12;
  const minute = Math.max(0, Math.min(59, Math.floor(minuteRaw)));

  const width = 800;
  const height = 460;
  const cx = width / 2;
  const cy = spec.title ? 250 : 230;
  const r = 160;

  const ticks: string[] = [];
  const numbers: string[] = [];
  for (let i = 0; i < 12; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 6;
    const x1 = cx + (r - 10) * Math.cos(a);
    const y1 = cy + (r - 10) * Math.sin(a);
    const x2 = cx + r * Math.cos(a);
    const y2 = cy + r * Math.sin(a);
    ticks.push(
      `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#0f172a" stroke-width="3" />`,
    );
    const nx = cx + (r - 30) * Math.cos(a);
    const ny = cy + (r - 30) * Math.sin(a);
    const num = i === 0 ? 12 : i;
    numbers.push(
      `<text x="${nx}" y="${ny + 7}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="700" fill="#0f172a" stroke="#ffffff" stroke-width="5" paint-order="stroke">${num}</text>`,
    );
  }

  const minuteAngle = -Math.PI / 2 + (minute * Math.PI) / 30;
  const hourAngle = -Math.PI / 2 + ((hour + minute / 60) * Math.PI) / 6;

  const hourLen = r * 0.5;
  const minuteLen = r * 0.78;

  const hx = cx + hourLen * Math.cos(hourAngle);
  const hy = cy + hourLen * Math.sin(hourAngle);
  const mx = cx + minuteLen * Math.cos(minuteAngle);
  const my = cy + minuteLen * Math.sin(minuteAngle);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" rx="18" fill="#ffffff" />
    ${spec.title ? `<text x="50%" y="56" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="700" fill="#0f172a">${esc(spec.title)}</text>` : ''}
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffffff" stroke="#0f172a" stroke-width="4" />
    ${ticks.join('')}
    <line x1="${cx}" y1="${cy}" x2="${hx}" y2="${hy}" stroke="#0f172a" stroke-width="6" stroke-linecap="round" />
    <line x1="${cx}" y1="${cy}" x2="${mx}" y2="${my}" stroke="#1d4ed8" stroke-width="4" stroke-linecap="round" />
    ${numbers.join('')}
    <circle cx="${cx}" cy="${cy}" r="6" fill="#0f172a" />
  </svg>`;
};

const renderLinePlot = (spec: VisualSpec): string | null => {
  const values = parseFiniteNumbers(spec.values);
  // Axis title is optional (the quiz model rarely sends one), as for bar charts.
  if (!values.length) return null;
  const min = Number.isFinite(spec.min) ? Number(spec.min) : Math.min(...values);
  const max = Number.isFinite(spec.max) ? Number(spec.max) : Math.max(...values);
  if (!(max >= min)) return null;
  const tickStep = Number.isFinite(spec.tickStep) && Number(spec.tickStep) > 0 ? Number(spec.tickStep) : 1;
  const ticks: number[] = [];
  for (let t = min; t <= max; t += tickStep) ticks.push(t);
  if (!ticks.length) return null;

  const width = 800;
  const height = 450;
  const chartLeft = 84;
  const chartRight = width - 54;
  const axisY = 330;
  const span = Math.max(max - min, 1);
  const xFor = (v: number) => chartLeft + ((v - min) / span) * (chartRight - chartLeft);
  const counts = new Map<number, number>();
  values.forEach((v) => counts.set(v, (counts.get(v) || 0) + 1));

  const xMarks = Array.from(counts.entries()).flatMap(([value, count]) => {
    const x = xFor(value);
    return Array.from({ length: count }).map((_, i) => {
      const y = axisY - 22 - i * 28;
      return `<g><line x1="${x - 7}" y1="${y - 7}" x2="${x + 7}" y2="${y + 7}" stroke="#1e293b" stroke-width="3" /><line x1="${x + 7}" y1="${y - 7}" x2="${x - 7}" y2="${y + 7}" stroke="#1e293b" stroke-width="3" /></g>`;
    });
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" rx="18" fill="#ffffff" />
    ${spec.title ? `<text x="50%" y="56" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="32" font-weight="700" fill="#0f172a">${esc(spec.title)}</text>` : ''}
    <line x1="${chartLeft}" y1="${axisY}" x2="${chartRight}" y2="${axisY}" stroke="#334155" stroke-width="3" />
    ${ticks
      .map((tick) => {
        const x = xFor(tick);
        return `<g>
          <line x1="${x}" y1="${axisY}" x2="${x}" y2="${axisY + 10}" stroke="#334155" stroke-width="2" />
          <text x="${x}" y="${axisY + 35}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="20" fill="#334155">${tick}</text>
        </g>`;
      })
      .join('')}
    ${spec.xLabel ? `<text x="${(chartLeft + chartRight) / 2}" y="${height - 34}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="600" fill="#0f172a">${esc(spec.xLabel)}</text>` : ''}
    ${xMarks.join('')}
  </svg>`;
};

const renderTable = (spec: VisualSpec): string | null => {
  const columns = (spec.columns || []).map(String);
  const rows = parseTableRows(spec.rows);
  if (!columns.length || !rows.length) return null;

  const width = 800;
  const height = 450;
  const tableX = 90;
  const tableY = 110;
  const tableW = 620;
  const rowCount = rows.length + 1;
  const rowH = Math.min(54, Math.floor(260 / rowCount));
  const tableH = rowH * rowCount;
  const colW = tableW / columns.length;
  // Shrink a column's text until its longest entry fits (~0.55em per character), so headers never spill.
  const fit = (base: number, col: number) => {
    const longest = Math.max(columns[col]?.length ?? 0, ...rows.map((row) => String(row[col] ?? '').length), 1);
    return Math.max(12, Math.min(base, Math.floor((colW - 16) / (0.55 * longest))));
  };

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" rx="18" fill="#ffffff" />
    ${spec.title ? `<text x="50%" y="56" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="32" font-weight="700" fill="#0f172a">${esc(spec.title)}</text>` : ''}
    <rect x="${tableX}" y="${tableY}" width="${tableW}" height="${tableH}" rx="8" fill="#f8fafc" stroke="#334155" stroke-width="2.5" />
    ${columns
      .map(
        (column, idx) =>
          `<text x="${tableX + colW * idx + colW / 2}" y="${tableY + rowH / 2 + 10}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="${fit(24, idx)}" font-weight="700" fill="#0f172a">${esc(column)}</text>`,
      )
      .join('')}
    ${rows
      .map((row, rowIdx) =>
        row
          .map((cell, colIdx) => {
            const x = tableX + colW * colIdx + colW / 2;
            const y = tableY + rowH * (rowIdx + 1) + rowH / 2 + 8;
            return `<text x="${x}" y="${y}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="${fit(22, colIdx)}" fill="#1f2937">${esc(cell)}</text>`;
          })
          .join(''),
      )
      .join('')}
    ${Array.from({ length: columns.length - 1 })
      .map((_, i) => {
        const x = tableX + colW * (i + 1);
        return `<line x1="${x}" y1="${tableY}" x2="${x}" y2="${tableY + tableH}" stroke="#334155" stroke-width="2" />`;
      })
      .join('')}
    ${Array.from({ length: rowCount - 1 })
      .map((_, i) => {
        const y = tableY + rowH * (i + 1);
        return `<line x1="${tableX}" y1="${y}" x2="${tableX + tableW}" y2="${y}" stroke="#334155" stroke-width="2" />`;
      })
      .join('')}
  </svg>`;
};

const renderMiniTenFrame = (
  originX: number,
  originY: number,
  cellW: number,
  gap: number,
  dotR: number,
  filled: boolean[],
): { rects: string; dots: string; width: number; height: number } => {
  const rects: string[] = [];
  const dots: string[] = [];
  for (let i = 0; i < 10; i++) {
    const row = Math.floor(i / 5);
    const col = i % 5;
    const x0 = originX + col * (cellW + gap);
    const y0 = originY + row * (cellW + gap);
    rects.push(
      `<rect x="${x0}" y="${y0}" width="${cellW}" height="${cellW}" rx="8" fill="#ffffff" stroke="#334155" stroke-width="2.5" />`,
    );
    if (filled[i]) {
      const cx = x0 + cellW / 2;
      const cy = y0 + cellW / 2;
      dots.push(`<circle cx="${cx}" cy="${cy}" r="${dotR}" fill="#2563eb" />`);
    }
  }
  const frameW = 5 * cellW + 4 * gap;
  const frameH = 2 * cellW + gap;
  return { rects: rects.join(''), dots: dots.join(''), width: frameW, height: frameH };
};

/** Ten-frame: values are exactly 10 cells, 1 = filled dot, 0 = empty (row-major: top L→R, then bottom). */
const renderTenFrame = (spec: VisualSpec): string | null => {
  const raw = parseFiniteNumbers(spec.values);
  if (raw.length !== 10) return null;

  const width = 800;
  const onesCount =
    Number.isFinite(spec.onesCount) && Number(spec.onesCount) >= 0
      ? Math.min(10, Math.floor(Number(spec.onesCount)))
      : 0;
  const tensCount =
    Number.isFinite(spec.tensCount) && Number(spec.tensCount) >= 1
      ? Math.min(9, Math.floor(Number(spec.tensCount)))
      : 0;

  if (tensCount > 1) {
    const height = 500;
    const cellW = 34;
    const gap = 5;
    const dotR = 11;
    const frameGap = 18;
    const startX = 40;
    const startY = 120;
    const frames: string[] = [];
    let cursorX = startX;
    for (let frame = 0; frame < tensCount; frame++) {
      const filled = Array.from({ length: 10 }, () => true);
      const mini = renderMiniTenFrame(cursorX, startY, cellW, gap, dotR, filled);
      frames.push(mini.rects, mini.dots);
      cursorX += mini.width + frameGap;
    }
    const onesGroupLeft = cursorX + 12;
    const onesGroupTop = startY + cellW / 2;
    const onesDotGap = 40;
    const onesDots: string[] = [];
    for (let i = 0; i < onesCount; i++) {
      const cx = onesGroupLeft + i * onesDotGap;
      const cy = onesGroupTop + cellW / 2;
      onesDots.push(`<circle cx="${cx}" cy="${cy}" r="${dotR}" fill="#2563eb" />`);
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" rx="18" fill="#ffffff" />
    ${spec.title ? `<text x="50%" y="52" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="700" fill="#0f172a">${esc(spec.title)}</text>` : ''}
    <text x="${startX}" y="${startY - 16}" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="700" fill="#334155">tens</text>
    ${frames.join('')}
    ${
      onesCount > 0
        ? `<text x="${onesGroupLeft + ((Math.max(onesCount, 1) - 1) * onesDotGap) / 2}" y="${onesGroupTop - 6}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="700" fill="#334155">ones</text>${onesDots.join('')}`
        : ''
    }
  </svg>`;
  }

  const height = onesCount > 0 ? 520 : 450;
  const gridLeft = 175;
  const gridTop = 120;
  const cellW = 90;
  const cellH = 90;
  const gap = 8;
  const dotR = 28;

  const cells = raw.map((v) => (Number.isFinite(v) && v >= 1 ? 1 : 0));

  const rects: string[] = [];
  const dots: string[] = [];

  for (let i = 0; i < 10; i++) {
    const row = Math.floor(i / 5);
    const col = i % 5;
    const x0 = gridLeft + col * (cellW + gap);
    const y0 = gridTop + row * (cellH + gap);
    rects.push(
      `<rect x="${x0}" y="${y0}" width="${cellW}" height="${cellH}" rx="10" fill="#ffffff" stroke="#334155" stroke-width="3" />`,
    );
    if (cells[i]) {
      const cx = x0 + cellW / 2;
      const cy = y0 + cellH / 2;
      dots.push(`<circle cx="${cx}" cy="${cy}" r="${dotR}" fill="#2563eb" />`);
    }
  }

  const onesGroupLeft = gridLeft + 5 * (cellW + gap) + 48;
  const onesGroupTop = gridTop + cellH / 2;
  const onesDotGap = 52;
  const onesDots: string[] = [];
  for (let i = 0; i < onesCount; i++) {
    const cx = onesGroupLeft + i * onesDotGap;
    const cy = onesGroupTop + cellH / 2;
    onesDots.push(`<circle cx="${cx}" cy="${cy}" r="${dotR}" fill="#2563eb" />`);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" rx="18" fill="#ffffff" />
    ${spec.title ? `<text x="50%" y="56" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="700" fill="#0f172a">${esc(spec.title)}</text>` : ''}
    ${onesCount > 0 ? `<text x="${gridLeft + (2.5 * (cellW + gap) - gap) / 2}" y="${gridTop - 18}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="700" fill="#334155">1 ten</text>` : ''}
    ${rects.join('')}
    ${dots.join('')}
    ${
      onesCount > 0
        ? `<text x="${onesGroupLeft + ((onesCount - 1) * onesDotGap) / 2}" y="${onesGroupTop - 8}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="700" fill="#334155">ones</text>${onesDots.join('')}`
        : ''
    }
  </svg>`;
};

/** Smallest friendly step (1, 2, 5, 10, 20, 25, 50, ...) giving at most 10 ticks up to `max`. */
const niceStep = (max: number): number => {
  for (const base of [1, 10, 100, 1000]) {
    for (const m of [1, 2, 5]) if (Math.ceil(max / (m * base)) <= 10) return m * base;
    if (Math.ceil(max / (25 * base)) <= 10) return 25 * base;
  }
  return Math.ceil(max / 10);
};

const FONT = 'font-family="Inter, Arial, sans-serif"';

/**
 * Picture graph or tally chart: one row per category. Students count icons / tally
 * marks, so nothing prints the value itself.
 */
const pictureIcon = (shape: VisualSpec['iconShape'], cx: number, cy: number, r = 15): string => {
  const fill = 'fill="#6366f1"';
  if (shape === 'square') return `<rect class="icon" x="${cx - r}" y="${cy - r}" width="${2 * r}" height="${2 * r}" rx="3" ${fill} />`;
  if (shape === 'star') {
    const pts = Array.from({ length: 10 }, (_, i) => {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const d = i % 2 ? r * 0.45 : r * 1.1;
      return `${(cx + d * Math.cos(a)).toFixed(1)},${(cy + d * Math.sin(a)).toFixed(1)}`;
    });
    return `<polygon class="icon" points="${pts.join(' ')}" ${fill} />`;
  }
  if (shape === 'heart') {
    return `<path class="icon" d="M${cx} ${cy + r} C${cx - 2 * r} ${cy - r * 0.2} ${cx - r * 0.9} ${cy - r * 1.4} ${cx} ${cy - r * 0.45} C${cx + r * 0.9} ${cy - r * 1.4} ${cx + 2 * r} ${cy - r * 0.2} ${cx} ${cy + r}Z" ${fill} />`;
  }
  const circle = `<circle class="icon" cx="${cx}" cy="${cy}" r="${r}" ${fill} />`;
  if (shape !== 'smiley') return circle;
  return `${circle}<circle cx="${cx - r * 0.35}" cy="${cy - r * 0.25}" r="${r * 0.13}" fill="#fff" /><circle cx="${cx + r * 0.35}" cy="${cy - r * 0.25}" r="${r * 0.13}" fill="#fff" /><path d="M${cx - r * 0.5} ${cy + r * 0.2} Q${cx} ${cy + r * 0.7} ${cx + r * 0.5} ${cy + r * 0.2}" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round" />`;
};

const renderCountRows = (spec: VisualSpec, categories: string[], values: number[]): string | null => {
  const tally = spec.chartStyle === 'tally';
  const unit = tally ? 1 : Number(spec.iconUnit) > 0 ? Number(spec.iconUnit) : 1;
  const counts = values.map((v) => v / unit);
  if (counts.some((c) => !Number.isInteger(c) || c < 0) || Math.max(...counts) > 30) return null;
  const width = 800;
  const rowH = 54;
  const top = spec.title ? 80 : 40;
  const labelW = 170;
  const height = top + rowH * categories.length + (tally ? 30 : 80);
  const rows = categories.map((name, r) => {
    const y = top + r * rowH;
    let marks = '';
    if (tally) {
      for (let i = 0; i < counts[r]; i++) {
        const group = Math.floor(i / 5);
        const k = i % 5;
        const gx = labelW + 30 + group * 70;
        marks += k < 4
          ? `<line class="tally" x1="${gx + k * 12}" y1="${y + 10}" x2="${gx + k * 12}" y2="${y + 44}" stroke="#0f172a" stroke-width="4" stroke-linecap="round" />`
          : `<line class="tally" x1="${gx - 8}" y1="${y + 38}" x2="${gx + 44}" y2="${y + 16}" stroke="#0f172a" stroke-width="4" stroke-linecap="round" />`;
      }
    } else {
      for (let i = 0; i < counts[r]; i++) {
        marks += pictureIcon(spec.iconShape, labelW + 50 + i * 40, y + 27);
      }
    }
    return `<text x="${labelW}" y="${y + 34}" text-anchor="end" ${FONT} font-size="22" fill="#0f172a">${esc(name)}</text>
      <line x1="${labelW + 15}" y1="${y + rowH}" x2="${width - 30}" y2="${y + rowH}" stroke="#e2e8f0" stroke-width="2" />${marks}`;
  });
  const key = tally ? '' : `${pictureIcon(spec.iconShape, labelW + 50, height - 40).replace(' class="icon"', '')}
    <text x="${labelW + 75}" y="${height - 32}" ${FONT} font-size="22" fill="#0f172a">= ${unit}${spec.yLabel ? ` ${esc(spec.yLabel)}` : ''}</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" rx="18" fill="#ffffff" />
    ${spec.title ? `<text x="50%" y="48" text-anchor="middle" ${FONT} font-size="28" font-weight="700" fill="#0f172a">${esc(spec.title)}</text>` : ''}
    ${rows.join('')}
    ${key}
  </svg>`;
};

const renderBarChart = (spec: VisualSpec): string | null => {
  const categories = (spec.categories || []).map(String);
  const values = parseFiniteNumbers(spec.values);
  // Axis labels are optional: the quiz model often omits them, and a graph without
  // titles still matches "The bar graph shows..." far better than no graph.
  if (!categories.length || categories.length !== values.length) return null;
  if (spec.chartStyle === 'pictures' || spec.chartStyle === 'tally') return renderCountRows(spec, categories, values);
  const width = 800;
  const height = 450;
  const left = 110;
  const right = width - 50;
  const top = 60;
  const bottom = height - 90;
  const minY = Number.isFinite(spec.yMin) ? Number(spec.yMin) : 0;
  const step = Number(spec.tickStep) > 0 ? Number(spec.tickStep) : niceStep(Math.max(...values) - minY);
  const maxY = Math.max(Number.isFinite(spec.yMax) ? Number(spec.yMax) : 0, minY + step * Math.ceil((Math.max(...values) - minY) / step));
  const span = Math.max(maxY - minY, 1);
  const yAt = (v: number) => bottom - ((v - minY) / span) * (bottom - top);
  const slotW = (right - left) / categories.length;
  const barW = Math.min(56, slotW * 0.55);
  // Values are read off the numbered axis (that is the skill), never printed on the bars.
  const ticks: string[] = [];
  for (let v = minY; v <= maxY + 1e-9; v += step) {
    const y = yAt(v);
    const label = Number(v.toFixed(6));
    ticks.push(`<line x1="${left}" y1="${y}" x2="${right}" y2="${y}" stroke="#e2e8f0" stroke-width="1.5" />
      <line x1="${left - 8}" y1="${y}" x2="${left}" y2="${y}" stroke="#334155" stroke-width="2" />
      <text x="${left - 14}" y="${y + 6}" text-anchor="end" ${FONT} font-size="16" fill="#334155">${label}</text>`);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" rx="18" fill="#ffffff" />
    ${spec.title ? `<text x="50%" y="40" text-anchor="middle" ${FONT} font-size="28" font-weight="700" fill="#0f172a">${esc(spec.title)}</text>` : ''}
    ${ticks.join('')}
    <line x1="${left}" y1="${bottom}" x2="${right}" y2="${bottom}" stroke="#334155" stroke-width="3" />
    <line x1="${left}" y1="${top}" x2="${left}" y2="${bottom}" stroke="#334155" stroke-width="3" />
    ${values
      .map((value, idx) => {
        const x = left + slotW * idx + (slotW - barW) / 2;
        const y = yAt(value);
        return `<g>
          <rect x="${x}" y="${y}" width="${barW}" height="${bottom - y}" rx="6" fill="#6366f1" />
          <text x="${x + barW / 2}" y="${bottom + 30}" text-anchor="middle" ${FONT} font-size="18" fill="#334155">${esc(categories[idx])}</text>
        </g>`;
      })
      .join('')}
    ${spec.xLabel ? `<text x="${(left + right) / 2}" y="${height - 26}" text-anchor="middle" ${FONT} font-size="22" font-weight="600" fill="#0f172a">${esc(spec.xLabel)}</text>` : ''}
    ${spec.yLabel ? `<text x="30" y="${(top + bottom) / 2}" transform="rotate(-90 30 ${(top + bottom) / 2})" text-anchor="middle" ${FONT} font-size="20" font-weight="600" fill="#0f172a">${esc(spec.yLabel)}</text>` : ''}
  </svg>`;
};

/** Normalize model-emitted visualType tokens to renderer/sanitizer snake_case ids. */
export const normalizeVisualTypeToken = (raw: unknown): string => {
  const text = String(raw ?? '').trim();
  if (!text) return '';
  const underscored = text
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toLowerCase();
  if (underscored === 'tenframe' || underscored === 'ten_frame') return 'ten_frame';
  if (underscored === 'numberline' || underscored === 'number_line') return 'number_line';
  if (underscored === 'fractionbar' || underscored === 'fraction_bar') return 'fraction_bar';
  if (underscored === 'arraymodel' || underscored === 'array_model') return 'array_model';
  if (underscored === 'area_model' || underscored === 'areamodel') return 'area_model';
  if (underscored === 'fractioncircle' || underscored === 'fraction_circle') return 'fraction_circle';
  if (underscored === 'coordinateplane' || underscored === 'coordinate_plane') return 'coordinate_plane';
  if (underscored === 'geometricshape' || underscored === 'geometric_shape') return 'geometric_shape';
  if (underscored === 'bar_model' || underscored === 'barmodel') return 'bar_model';
  if (underscored === 'clockface' || underscored === 'clock_face') return 'clock_face';
  if (underscored === 'lineplot' || underscored === 'line_plot') return 'line_plot';
  if (underscored === 'barchart' || underscored === 'bar_chart') return 'bar_chart';
  return underscored;
};

export const isDeterministicVisualSpecType = (visualType: string | undefined): boolean =>
  visualType === 'ten_frame' ||
  visualType === 'number_line' ||
  visualType === 'fraction_bar' ||
  visualType === 'array_model' ||
  visualType === 'area_model' ||
  visualType === 'fraction_circle' ||
  visualType === 'coordinate_plane' ||
  visualType === 'geometric_shape' ||
  visualType === 'bar_model' ||
  visualType === 'clock_face' ||
  visualType === 'line_plot' ||
  visualType === 'table' ||
  visualType === 'bar_chart';

export const normalizeVisualSpec = (value: unknown): VisualSpec | null => {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Record<string, unknown>;
  const visualType =
    normalizeVisualTypeToken(candidate.visualType) || String(candidate.visualType || '').trim();
  if (!visualType) return null;

  const gridRows =
    Number.isFinite(candidate.gridRows) && Number(candidate.gridRows) > 0
      ? Math.floor(Number(candidate.gridRows))
      : undefined;
  const gridCols =
    Number.isFinite(candidate.gridCols) && Number(candidate.gridCols) > 0
      ? Math.floor(Number(candidate.gridCols))
      : undefined;

  let values: number[];
  if (visualType === 'ten_frame' && Array.isArray(candidate.values)) {
    values = Array.from({ length: 10 }, (_, i) => {
      const raw = candidate.values![i];
      const n = typeof raw === 'number' ? raw : Number(raw);
      return Number.isFinite(n) ? n : 0;
    });
  } else if (
    visualType === 'array_model' &&
    gridRows !== undefined &&
    gridCols !== undefined &&
    gridRows * gridCols <= 120
  ) {
    const n = gridRows * gridCols;
    values = Array.from({ length: n }, (_, i) => {
      const raw = Array.isArray(candidate.values) ? candidate.values[i] : undefined;
      const num = typeof raw === 'number' ? raw : Number(raw);
      return Number.isFinite(num) && num >= 1 ? 1 : 0;
    });
  } else {
    values = parseFiniteNumbers(candidate.values);
  }

  const shadedParts = Number.isFinite(candidate.shadedParts) ? Number(candidate.shadedParts) : undefined;
  const totalParts = Number.isFinite(candidate.totalParts) ? Number(candidate.totalParts) : undefined;

  const stringArray = (raw: unknown): string[] | undefined =>
    Array.isArray(raw) ? raw.map((entry) => String(entry)) : undefined;

  const numberArray = (raw: unknown): number[] | undefined => {
    if (!Array.isArray(raw)) return undefined;
    return raw.map((entry) => {
      const n = typeof entry === 'number' ? entry : Number(entry);
      return Number.isFinite(n) ? n : 0;
    });
  };

  const points: CoordinatePoint[] | undefined = Array.isArray(candidate.points)
    ? parseCoordinatePoints(candidate.points)
    : undefined;

  const shapeName: GeometricShapeName | undefined =
    typeof candidate.shapeName === 'string' &&
    GEOMETRIC_SHAPE_NAMES.includes(candidate.shapeName as GeometricShapeName)
      ? (candidate.shapeName as GeometricShapeName)
      : undefined;

  const shapes: GeometricShapeName[] | undefined = Array.isArray(candidate.shapes)
    ? candidate.shapes
        .map((entry) => String(entry).trim())
        .filter((entry): entry is GeometricShapeName =>
          GEOMETRIC_SHAPE_NAMES.includes(entry as GeometricShapeName),
        )
    : undefined;

  const figures: VisualFigure[] | undefined = Array.isArray(candidate.figures)
    ? candidate.figures
        .map((raw): VisualFigure | null => {
          if (!raw || typeof raw !== 'object') return null;
          const source = raw as Record<string, unknown>;
          const shape = String(source.shape || '').trim() as GeometricShapeName;
          if (!GEOMETRIC_SHAPE_NAMES.includes(shape)) return null;
          const dimensions = Array.isArray(source.dimensions)
            ? source.dimensions
                .map((entry): { side: 'top' | 'right' | 'bottom' | 'left'; label: string } | null => {
                  if (!entry || typeof entry !== 'object') return null;
                  const dimension = entry as Record<string, unknown>;
                  const side = String(dimension.side || '').trim();
                  const label = String(dimension.label || '').trim();
                  if (!['top', 'right', 'bottom', 'left'].includes(side) || !label) return null;
                  return { side: side as 'top' | 'right' | 'bottom' | 'left', label };
                })
                .filter((entry): entry is { side: 'top' | 'right' | 'bottom' | 'left'; label: string } => Boolean(entry))
            : undefined;
          const width = Number(source.width);
          const height = Number(source.height);
          return {
            id: typeof source.id === 'string' ? source.id : undefined,
            shape,
            nameLabel: typeof source.nameLabel === 'string' ? source.nameLabel : undefined,
            width: Number.isFinite(width) && width > 0 ? width : undefined,
            height: Number.isFinite(height) && height > 0 ? height : undefined,
            unit: typeof source.unit === 'string' ? source.unit : undefined,
            dimensions: dimensions?.length ? dimensions : undefined,
            areaLabel: typeof source.areaLabel === 'string' ? source.areaLabel : undefined,
            angleLabels: stringArray(source.angleLabels),
          };
        })
        .filter((entry): entry is VisualFigure => Boolean(entry))
        .slice(0, 4)
    : undefined;

  return {
    visualType: visualType as VisualSpec['visualType'],
    title: typeof candidate.title === 'string' ? candidate.title : undefined,
    xLabel: typeof candidate.xLabel === 'string' ? candidate.xLabel : undefined,
    yLabel: typeof candidate.yLabel === 'string' ? candidate.yLabel : undefined,
    values,
    min: Number.isFinite(candidate.min) ? Number(candidate.min) : undefined,
    max: Number.isFinite(candidate.max) ? Number(candidate.max) : undefined,
    tickStep: Number.isFinite(candidate.tickStep) ? Number(candidate.tickStep) : undefined,
    columns: Array.isArray(candidate.columns) ? candidate.columns.map((entry) => String(entry)) : undefined,
    rows: parseTableRows(candidate.rows),
    categories: Array.isArray(candidate.categories)
      ? candidate.categories.map((entry) => String(entry))
      : undefined,
    chartStyle: candidate.chartStyle === 'pictures' || candidate.chartStyle === 'tally' ? candidate.chartStyle : undefined,
    iconUnit: Number(candidate.iconUnit) > 0 ? Number(candidate.iconUnit) : undefined,
    iconShape: ['circle', 'star', 'heart', 'square', 'smiley'].includes(candidate.iconShape as string)
      ? (candidate.iconShape as VisualSpec['iconShape'])
      : undefined,
    yMin: Number.isFinite(candidate.yMin) ? Number(candidate.yMin) : undefined,
    yMax: Number.isFinite(candidate.yMax) ? Number(candidate.yMax) : undefined,
    prompt: typeof candidate.prompt === 'string' ? candidate.prompt : undefined,
    visualIntent: typeof candidate.visualIntent === 'string' ? candidate.visualIntent : undefined,
    mustDisplay: Array.isArray(candidate.mustDisplay)
      ? candidate.mustDisplay.map((entry) => String(entry))
      : undefined,
    mustNotDisplay: Array.isArray(candidate.mustNotDisplay)
      ? candidate.mustNotDisplay.map((entry) => String(entry))
      : undefined,
    shadedParts,
    totalParts,
    gridRows,
    gridCols,
    rowLabels: stringArray(candidate.rowLabels),
    rowColors: stringArray(candidate.rowColors),
    colLabels: stringArray(candidate.colLabels),
    cellLabels: stringArray(candidate.cellLabels),
    highlightRows: Number.isFinite(candidate.highlightRows)
      ? Math.max(0, Math.floor(Number(candidate.highlightRows)))
      : undefined,
    highlightCols: Number.isFinite(candidate.highlightCols)
      ? Math.max(0, Math.floor(Number(candidate.highlightCols)))
      : undefined,
    xMin: Number.isFinite(candidate.xMin) ? Number(candidate.xMin) : undefined,
    xMax: Number.isFinite(candidate.xMax) ? Number(candidate.xMax) : undefined,
    xTickStep: Number.isFinite(candidate.xTickStep) ? Number(candidate.xTickStep) : undefined,
    yTickStep: Number.isFinite(candidate.yTickStep) ? Number(candidate.yTickStep) : undefined,
    points,
    connect: ['polygon', 'lines', 'none'].includes(candidate.connect as string)
      ? (candidate.connect as VisualSpec['connect'])
      : undefined,
    shapeName,
    shapes: shapes?.length ? shapes : undefined,
    figures: figures?.length ? figures : undefined,
    sideLabels: stringArray(candidate.sideLabels),
    angleLabels: stringArray(candidate.angleLabels),
    shapeWidth: Number.isFinite(candidate.shapeWidth) ? Number(candidate.shapeWidth) : undefined,
    shapeHeight: Number.isFinite(candidate.shapeHeight) ? Number(candidate.shapeHeight) : undefined,
    segmentLabels: stringArray(candidate.segmentLabels),
    segmentWeights: numberArray(candidate.segmentWeights),
    segmentShaded: numberArray(candidate.segmentShaded),
    hour: Number.isFinite(candidate.hour) ? Number(candidate.hour) : undefined,
    minute: Number.isFinite(candidate.minute) ? Number(candidate.minute) : undefined,
    onesCount: Number.isFinite(candidate.onesCount) ? Math.max(0, Math.floor(Number(candidate.onesCount))) : undefined,
    tensCount: Number.isFinite(candidate.tensCount)
      ? Math.max(1, Math.min(9, Math.floor(Number(candidate.tensCount))))
      : undefined,
  };
};

export const renderDeterministicVisualSvg = (spec: VisualSpec | null | undefined): string | null => {
  if (!spec) return null;
  if (spec.visualType === 'ten_frame') return renderTenFrame(spec);
  if (spec.visualType === 'number_line') return renderNumberLine(spec);
  if (spec.visualType === 'fraction_bar') return renderFractionBar(spec);
  if (spec.visualType === 'array_model') return renderArrayModel(spec);
  if (spec.visualType === 'area_model') return renderAreaModel(spec);
  if (spec.visualType === 'fraction_circle') return renderFractionCircle(spec);
  if (spec.visualType === 'coordinate_plane') return renderCoordinatePlane(spec);
  if (spec.visualType === 'geometric_shape') return renderGeometricShape(spec);
  if (spec.visualType === 'bar_model') return renderBarModel(spec);
  if (spec.visualType === 'clock_face') return renderClockFace(spec);
  if (spec.visualType === 'line_plot') return renderLinePlot(spec);
  if (spec.visualType === 'table') return renderTable(spec);
  if (spec.visualType === 'bar_chart') return renderBarChart(spec);
  return null;
};

