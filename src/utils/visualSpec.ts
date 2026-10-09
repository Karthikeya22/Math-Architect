import { CoordinatePoint, GeometricShapeName, VisualSpec } from '../types';
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

  const tickSvg = ticks
    .map((tick) => {
      const x = xAt(tick);
      return `<g>
        <line x1="${x}" y1="${axisY}" x2="${x}" y2="${axisY + 12}" stroke="#334155" stroke-width="2.5" />
        <text x="${x}" y="${axisY + 38}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="17" fill="#334155">${Number.isInteger(tick) ? tick : tick.toFixed(1)}</text>
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

  const rects: string[] = [];
  const inner: string[] = [];
  let idx = 0;
  for (let row = 0; row < r; row++) {
    for (let col = 0; col < c; col++) {
      const x0 = left + col * cellW;
      const y0 = top + labelGutter + row * cellH;
      rects.push(
        `<rect x="${x0}" y="${y0}" width="${cellW}" height="${cellH}" fill="#eef2ff" stroke="#1e3a8a" stroke-width="2.5" />`,
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

  let polygonSvg = '';
  if (points.length >= 2) {
    const pathPts = points
      .map((p) => `${xAt(p.x)},${yAt(p.y)}`)
      .join(' ');
    const closedPts =
      points.length >= 3 ? `${pathPts} ${xAt(points[0].x)},${yAt(points[0].y)}` : pathPts;
    polygonSvg = `<polyline points="${closedPts}" fill="rgba(37, 99, 235, 0.12)" stroke="#2563eb" stroke-width="2.5" stroke-linejoin="round" />`;
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

/** Geometric shape: named polygon with optional side and angle labels (clockwise from first vertex). */
const renderGeometricShape = (spec: VisualSpec): string | null => {
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
        return renderGeometricShapePolygon(shape, cx, cy, baseSize, 0.7);
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

  const verts = polygonPoints(shape, cx, cy, baseSize, aspect);
  const pointsAttr = verts.map((p) => `${p.x},${p.y}`).join(' ');

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
    <polygon points="${pointsAttr}" fill="#dbeafe" stroke="#1e3a8a" stroke-width="3" stroke-linejoin="round" />
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
      `<text x="${nx}" y="${ny + 7}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="700" fill="#0f172a">${num}</text>`,
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
    ${numbers.join('')}
    <line x1="${cx}" y1="${cy}" x2="${hx}" y2="${hy}" stroke="#0f172a" stroke-width="6" stroke-linecap="round" />
    <line x1="${cx}" y1="${cy}" x2="${mx}" y2="${my}" stroke="#1d4ed8" stroke-width="4" stroke-linecap="round" />
    <circle cx="${cx}" cy="${cy}" r="6" fill="#0f172a" />
  </svg>`;
};

const renderLinePlot = (spec: VisualSpec): string | null => {
  const values = parseFiniteNumbers(spec.values);
  if (!values.length || !spec.xLabel) return null;
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
    <text x="${(chartLeft + chartRight) / 2}" y="${height - 34}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="600" fill="#0f172a">${esc(spec.xLabel)}</text>
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

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" rx="18" fill="#ffffff" />
    ${spec.title ? `<text x="50%" y="56" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="32" font-weight="700" fill="#0f172a">${esc(spec.title)}</text>` : ''}
    <rect x="${tableX}" y="${tableY}" width="${tableW}" height="${tableH}" rx="8" fill="#f8fafc" stroke="#334155" stroke-width="2.5" />
    ${columns
      .map(
        (column, idx) =>
          `<text x="${tableX + colW * idx + colW / 2}" y="${tableY + rowH / 2 + 10}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="700" fill="#0f172a">${esc(column)}</text>`,
      )
      .join('')}
    ${rows
      .map((row, rowIdx) =>
        row
          .map((cell, colIdx) => {
            const x = tableX + colW * colIdx + colW / 2;
            const y = tableY + rowH * (rowIdx + 1) + rowH / 2 + 8;
            return `<text x="${x}" y="${y}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="22" fill="#1f2937">${esc(cell)}</text>`;
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
      const filled = Array.from({ length: 10 }, () => 1);
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
    <text x="${gridLeft + (2.5 * (cellW + gap) - gap) / 2}" y="${gridTop - 18}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="700" fill="#334155">1 ten</text>
    ${rects.join('')}
    ${dots.join('')}
    ${
      onesCount > 0
        ? `<text x="${onesGroupLeft + ((onesCount - 1) * onesDotGap) / 2}" y="${onesGroupTop - 8}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="700" fill="#334155">ones</text>${onesDots.join('')}`
        : ''
    }
  </svg>`;
};

const renderBarChart = (spec: VisualSpec): string | null => {
  const categories = (spec.categories || []).map(String);
  const values = parseFiniteNumbers(spec.values);
  if (!categories.length || categories.length !== values.length || !spec.yLabel || !spec.xLabel) return null;
  const width = 800;
  const height = 450;
  const left = 90;
  const right = width - 50;
  const top = 80;
  const bottom = height - 90;
  const maxY = Number.isFinite(spec.yMax) ? Number(spec.yMax) : Math.max(...values);
  const minY = Number.isFinite(spec.yMin) ? Number(spec.yMin) : 0;
  const span = Math.max(maxY - minY, 1);
  const slotW = (right - left) / categories.length;
  const barW = Math.min(56, slotW * 0.55);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" rx="18" fill="#ffffff" />
    ${spec.title ? `<text x="50%" y="50" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="700" fill="#0f172a">${esc(spec.title)}</text>` : ''}
    <line x1="${left}" y1="${bottom}" x2="${right}" y2="${bottom}" stroke="#334155" stroke-width="3" />
    <line x1="${left}" y1="${top}" x2="${left}" y2="${bottom}" stroke="#334155" stroke-width="3" />
    ${values
      .map((value, idx) => {
        const h = ((value - minY) / span) * (bottom - top);
        const x = left + slotW * idx + (slotW - barW) / 2;
        const y = bottom - h;
        return `<g>
          <rect x="${x}" y="${y}" width="${barW}" height="${h}" rx="8" fill="#6366f1" />
          <text x="${x + barW / 2}" y="${bottom + 30}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="18" fill="#334155">${esc(categories[idx])}</text>
          <text x="${x + barW / 2}" y="${y - 8}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="16" fill="#1f2937">${value}</text>
        </g>`;
      })
      .join('')}
    <text x="${(left + right) / 2}" y="${height - 26}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="600" fill="#0f172a">${esc(spec.xLabel)}</text>
    <text x="28" y="${(top + bottom) / 2}" transform="rotate(-90 28 ${(top + bottom) / 2})" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="600" fill="#0f172a">${esc(spec.yLabel)}</text>
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
    xMin: Number.isFinite(candidate.xMin) ? Number(candidate.xMin) : undefined,
    xMax: Number.isFinite(candidate.xMax) ? Number(candidate.xMax) : undefined,
    xTickStep: Number.isFinite(candidate.xTickStep) ? Number(candidate.xTickStep) : undefined,
    yTickStep: Number.isFinite(candidate.yTickStep) ? Number(candidate.yTickStep) : undefined,
    points,
    shapeName,
    shapes: shapes?.length ? shapes : undefined,
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

