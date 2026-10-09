/**
 * Per-visual-type validation for question visualSpec payloads.
 * Mirrors the renderer constraints in src/utils/visualSpec.ts so that we can
 * reject malformed AI payloads early (before they reach the renderer).
 *
 * Returns a string error label scoped to the question (e.g. "ten_frame requires …")
 * or null if the visualSpec is acceptable. Unknown visualTypes are not rejected
 * here; non-deterministic types are validated by the AI image-prompt path instead.
 */
export const validateQuestionVisualSpec = (
  vs: unknown,
): string | null => {
  if (!vs || typeof vs !== 'object') return null;
  const spec = vs as Record<string, unknown>;
  const visualType = String(spec.visualType || '').trim();

  if (visualType === 'ten_frame') {
    const vals = spec.values;
    if (!Array.isArray(vals) || vals.length !== 10) {
      return 'ten_frame requires visualSpec.values with exactly 10 entries (1=filled, 0=empty).';
    }
    if (spec.onesCount !== undefined) {
      const ones = Number(spec.onesCount);
      if (!Number.isInteger(ones) || ones < 0 || ones > 10) {
        return 'ten_frame onesCount must be an integer between 0 and 10 when provided.';
      }
    }
    if (spec.tensCount !== undefined) {
      const tens = Number(spec.tensCount);
      if (!Number.isInteger(tens) || tens < 1 || tens > 9) {
        return 'ten_frame tensCount must be an integer between 1 and 9 when provided.';
      }
    }
    return null;
  }

  if (visualType === 'fraction_bar') {
    const total = Number(spec.totalParts);
    const shaded = Number(spec.shadedParts);
    if (!Number.isFinite(total) || !Number.isInteger(total) || total < 1 || total > 48) {
      return 'fraction_bar requires integer totalParts between 1 and 48.';
    }
    if (!Number.isFinite(shaded) || !Number.isInteger(shaded) || shaded < 0 || shaded > total) {
      return 'fraction_bar requires integer shadedParts between 0 and totalParts.';
    }
    return null;
  }

  if (visualType === 'number_line') {
    const min = Number(spec.min);
    const max = Number(spec.max);
    if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) {
      return 'number_line requires finite min and max with max > min.';
    }
    const tickStep = spec.tickStep === undefined ? undefined : Number(spec.tickStep);
    if (tickStep !== undefined && (!Number.isFinite(tickStep) || tickStep <= 0)) {
      return 'number_line tickStep must be a positive number when provided.';
    }
    if (tickStep !== undefined && (max - min) / tickStep > 60) {
      return 'number_line tickStep produces too many ticks (>60).';
    }
    if (Array.isArray(spec.values)) {
      for (const v of spec.values) {
        const n = Number(v);
        if (!Number.isFinite(n) || n < min || n > max) {
          return 'number_line values must be finite numbers within [min, max].';
        }
      }
    }
    return null;
  }

  if (visualType === 'array_model') {
    const r = Number(spec.gridRows);
    const c = Number(spec.gridCols);
    if (!Number.isInteger(r) || !Number.isInteger(c) || r < 1 || c < 1) {
      return 'array_model requires integer gridRows and gridCols ≥ 1.';
    }
    if (r * c > 120) {
      return 'array_model gridRows × gridCols must be ≤ 120.';
    }
    if (spec.values !== undefined) {
      if (!Array.isArray(spec.values) || spec.values.length > r * c) {
        return 'array_model values must be an array no longer than gridRows × gridCols.';
      }
      for (const v of spec.values) {
        const n = Number(v);
        if (!Number.isFinite(n) || (n !== 0 && n !== 1)) {
          return 'array_model values must be 0 or 1.';
        }
      }
    }
    return null;
  }

  if (visualType === 'area_model') {
    const r = Number(spec.gridRows);
    const c = Number(spec.gridCols);
    if (!Number.isInteger(r) || !Number.isInteger(c) || r < 1 || c < 1 || r > 8 || c > 8) {
      return 'area_model requires integer gridRows and gridCols between 1 and 8.';
    }
    if (spec.rowLabels !== undefined && (!Array.isArray(spec.rowLabels) || spec.rowLabels.length > r)) {
      return 'area_model rowLabels must be an array of length ≤ gridRows.';
    }
    if (spec.colLabels !== undefined && (!Array.isArray(spec.colLabels) || spec.colLabels.length > c)) {
      return 'area_model colLabels must be an array of length ≤ gridCols.';
    }
    if (spec.cellLabels !== undefined && (!Array.isArray(spec.cellLabels) || spec.cellLabels.length > r * c)) {
      return 'area_model cellLabels must be an array of length ≤ gridRows × gridCols.';
    }
    return null;
  }

  if (visualType === 'fraction_circle') {
    const total = Number(spec.totalParts);
    const shaded = Number(spec.shadedParts);
    if (!Number.isFinite(total) || !Number.isInteger(total) || total < 1 || total > 24) {
      return 'fraction_circle requires integer totalParts between 1 and 24.';
    }
    if (!Number.isFinite(shaded) || !Number.isInteger(shaded) || shaded < 0 || shaded > total) {
      return 'fraction_circle requires integer shadedParts between 0 and totalParts.';
    }
    return null;
  }

  if (visualType === 'coordinate_plane') {
    const xMin = Number(spec.xMin);
    const xMax = Number(spec.xMax);
    const yMin = Number(spec.yMin);
    const yMax = Number(spec.yMax);
    if (!Number.isFinite(xMin) || !Number.isFinite(xMax) || xMax <= xMin) {
      return 'coordinate_plane requires finite xMin and xMax with xMax > xMin.';
    }
    if (!Number.isFinite(yMin) || !Number.isFinite(yMax) || yMax <= yMin) {
      return 'coordinate_plane requires finite yMin and yMax with yMax > yMin.';
    }
    const xStep = spec.xTickStep === undefined ? 1 : Number(spec.xTickStep);
    const yStep = spec.yTickStep === undefined ? 1 : Number(spec.yTickStep);
    if (!Number.isFinite(xStep) || xStep <= 0 || !Number.isFinite(yStep) || yStep <= 0) {
      return 'coordinate_plane xTickStep / yTickStep must be positive when provided.';
    }
    if ((xMax - xMin) / xStep > 40 || (yMax - yMin) / yStep > 40) {
      return 'coordinate_plane tick steps produce too many grid lines (>40 per axis).';
    }
    if (spec.points !== undefined) {
      if (!Array.isArray(spec.points) || spec.points.length > 32) {
        return 'coordinate_plane points must be an array of at most 32 points.';
      }
      for (const p of spec.points) {
        if (!p || typeof p !== 'object') {
          return 'coordinate_plane points entries must be objects with x and y.';
        }
        const px = Number((p as { x?: unknown }).x);
        const py = Number((p as { y?: unknown }).y);
        if (!Number.isFinite(px) || !Number.isFinite(py)) {
          return 'coordinate_plane point x/y must be finite numbers.';
        }
        if (px < xMin || px > xMax || py < yMin || py > yMax) {
          return 'coordinate_plane points must lie within the configured bounds.';
        }
      }
    }
    return null;
  }

  if (visualType === 'geometric_shape') {
    const allowed = new Set([
      'triangle',
      'right_triangle',
      'square',
      'rectangle',
      'parallelogram',
      'trapezoid',
      'pentagon',
      'hexagon',
    ]);
    const shapes = Array.isArray(spec.shapes)
      ? spec.shapes.map((entry) => String(entry).trim()).filter(Boolean)
      : [];
    if (shapes.length >= 2) {
      if (shapes.length > 4) {
        return 'geometric_shape shapes must contain 2 to 4 named figures.';
      }
      for (const shape of shapes) {
        if (!allowed.has(shape)) {
          return `geometric_shape shapes entries must be one of: ${[...allowed].join(', ')}.`;
        }
      }
      return null;
    }
    const shape = String(spec.shapeName || '').trim();
    if (!allowed.has(shape)) {
      return `geometric_shape requires shapeName to be one of: ${[...allowed].join(', ')}.`;
    }
    const expectedSides: Record<string, number> = {
      triangle: 3,
      right_triangle: 3,
      square: 4,
      rectangle: 4,
      parallelogram: 4,
      trapezoid: 4,
      pentagon: 5,
      hexagon: 6,
    };
    const sides = expectedSides[shape];
    if (spec.sideLabels !== undefined && (!Array.isArray(spec.sideLabels) || spec.sideLabels.length > sides)) {
      return `geometric_shape sideLabels must have at most ${sides} entries for ${shape}.`;
    }
    if (spec.angleLabels !== undefined && (!Array.isArray(spec.angleLabels) || spec.angleLabels.length > sides)) {
      return `geometric_shape angleLabels must have at most ${sides} entries for ${shape}.`;
    }
    return null;
  }

  if (visualType === 'bar_model') {
    if (!Array.isArray(spec.segmentLabels) || spec.segmentLabels.length < 1 || spec.segmentLabels.length > 12) {
      return 'bar_model requires segmentLabels with 1 to 12 entries.';
    }
    const segCount = spec.segmentLabels.length;
    if (spec.segmentWeights !== undefined) {
      if (!Array.isArray(spec.segmentWeights) || spec.segmentWeights.length !== segCount) {
        return 'bar_model segmentWeights must be an array matching segmentLabels length.';
      }
      for (const w of spec.segmentWeights) {
        const n = Number(w);
        if (!Number.isFinite(n) || n <= 0) {
          return 'bar_model segmentWeights must be positive finite numbers.';
        }
      }
    }
    if (spec.segmentShaded !== undefined) {
      if (!Array.isArray(spec.segmentShaded) || spec.segmentShaded.length !== segCount) {
        return 'bar_model segmentShaded must be an array matching segmentLabels length.';
      }
      for (const v of spec.segmentShaded) {
        const n = Number(v);
        if (!Number.isFinite(n) || (n !== 0 && n !== 1)) {
          return 'bar_model segmentShaded entries must be 0 or 1.';
        }
      }
    }
    return null;
  }

  if (visualType === 'clock_face') {
    const hour = Number(spec.hour);
    const minute = Number(spec.minute);
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
      return 'clock_face requires integer hour between 0 and 23.';
    }
    if (!Number.isInteger(minute) || minute < 0 || minute > 59) {
      return 'clock_face requires integer minute between 0 and 59.';
    }
    return null;
  }

  return null;
};
