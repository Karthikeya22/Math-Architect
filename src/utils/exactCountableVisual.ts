import type { VisualSpec } from '../types';

/** True when visualSpec encodes exact object counts (safe for deterministic SVG / GeoGebra). */
export const isExactCountableVisualSpec = (spec: VisualSpec | null | undefined): boolean => {
  if (!spec?.visualType) return false;

  if (spec.visualType === 'ten_frame') {
    return (
      Array.isArray(spec.values) &&
      spec.values.length === 10 &&
      spec.values.some((v) => Number(v) >= 1)
    );
  }

  if (spec.visualType === 'array_model') {
    const rows = Number(spec.gridRows);
    const cols = Number(spec.gridCols);
    if (!Number.isInteger(rows) || !Number.isInteger(cols) || rows < 1 || cols < 1) {
      return false;
    }
    const values = Array.isArray(spec.values) ? spec.values : [];
    return values.some((v) => Number(v) >= 1);
  }

  return false;
};
