import { describe, expect, it } from 'vitest';
import { validateQuestionVisualSpec } from './visualSpecValidation';

describe('validateQuestionVisualSpec', () => {
  it('passes when no visualSpec is provided', () => {
    expect(validateQuestionVisualSpec(undefined)).toBeNull();
    expect(validateQuestionVisualSpec(null)).toBeNull();
    expect(validateQuestionVisualSpec({})).toBeNull();
  });

  describe('ten_frame', () => {
    it('accepts 10 entries', () => {
      expect(
        validateQuestionVisualSpec({
          visualType: 'ten_frame',
          values: [1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
        }),
      ).toBeNull();
    });

    it('rejects non-array values', () => {
      expect(
        validateQuestionVisualSpec({ visualType: 'ten_frame', values: 'oops' }),
      ).toMatch(/ten_frame/);
    });

    it('rejects wrong length', () => {
      expect(
        validateQuestionVisualSpec({ visualType: 'ten_frame', values: [1, 0, 1] }),
      ).toMatch(/exactly 10 entries/);
    });
  });

  describe('fraction_bar', () => {
    it('accepts valid total/shaded', () => {
      expect(
        validateQuestionVisualSpec({
          visualType: 'fraction_bar',
          totalParts: 8,
          shadedParts: 3,
        }),
      ).toBeNull();
    });

    it('rejects totalParts out of range', () => {
      expect(
        validateQuestionVisualSpec({
          visualType: 'fraction_bar',
          totalParts: 0,
          shadedParts: 0,
        }),
      ).toMatch(/totalParts/);
      expect(
        validateQuestionVisualSpec({
          visualType: 'fraction_bar',
          totalParts: 100,
          shadedParts: 1,
        }),
      ).toMatch(/totalParts/);
    });

    it('rejects shadedParts > totalParts', () => {
      expect(
        validateQuestionVisualSpec({
          visualType: 'fraction_bar',
          totalParts: 4,
          shadedParts: 5,
        }),
      ).toMatch(/shadedParts/);
    });

    it('rejects negative shadedParts', () => {
      expect(
        validateQuestionVisualSpec({
          visualType: 'fraction_bar',
          totalParts: 4,
          shadedParts: -1,
        }),
      ).toMatch(/shadedParts/);
    });

    it('rejects non-integer parts', () => {
      expect(
        validateQuestionVisualSpec({
          visualType: 'fraction_bar',
          totalParts: 4.5,
          shadedParts: 1,
        }),
      ).toMatch(/totalParts/);
    });
  });

  describe('number_line', () => {
    it('accepts a basic number line', () => {
      expect(
        validateQuestionVisualSpec({
          visualType: 'number_line',
          min: 0,
          max: 10,
          tickStep: 1,
          values: [3, 7],
        }),
      ).toBeNull();
    });

    it('rejects max <= min', () => {
      expect(
        validateQuestionVisualSpec({
          visualType: 'number_line',
          min: 5,
          max: 5,
        }),
      ).toMatch(/min and max/);
    });

    it('rejects non-positive tickStep', () => {
      expect(
        validateQuestionVisualSpec({
          visualType: 'number_line',
          min: 0,
          max: 10,
          tickStep: 0,
        }),
      ).toMatch(/tickStep/);
    });

    it('rejects too many ticks', () => {
      expect(
        validateQuestionVisualSpec({
          visualType: 'number_line',
          min: 0,
          max: 1000,
          tickStep: 1,
        }),
      ).toMatch(/too many ticks/);
    });

    it('rejects values outside [min, max]', () => {
      expect(
        validateQuestionVisualSpec({
          visualType: 'number_line',
          min: 0,
          max: 10,
          values: [11],
        }),
      ).toMatch(/within \[min, max\]/);
    });
  });

  describe('array_model', () => {
    it('accepts a valid grid', () => {
      expect(
        validateQuestionVisualSpec({
          visualType: 'array_model',
          gridRows: 2,
          gridCols: 5,
          values: [1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
        }),
      ).toBeNull();
    });

    it('rejects missing or non-integer dimensions', () => {
      expect(
        validateQuestionVisualSpec({
          visualType: 'array_model',
          gridRows: 0,
          gridCols: 5,
        }),
      ).toMatch(/gridRows and gridCols/);
      expect(
        validateQuestionVisualSpec({
          visualType: 'array_model',
          gridRows: 2.5,
          gridCols: 5,
        }),
      ).toMatch(/gridRows and gridCols/);
    });

    it('rejects grids larger than 120 cells', () => {
      expect(
        validateQuestionVisualSpec({
          visualType: 'array_model',
          gridRows: 12,
          gridCols: 11,
        }),
      ).toMatch(/≤ 120/);
    });

    it('rejects values longer than gridRows × gridCols', () => {
      expect(
        validateQuestionVisualSpec({
          visualType: 'array_model',
          gridRows: 2,
          gridCols: 2,
          values: [1, 0, 1, 0, 1],
        }),
      ).toMatch(/no longer than/);
    });

    it('rejects non-binary values', () => {
      expect(
        validateQuestionVisualSpec({
          visualType: 'array_model',
          gridRows: 2,
          gridCols: 2,
          values: [1, 0, 2, 0],
        }),
      ).toMatch(/0 or 1/);
    });

    it('accepts shorter values arrays (will pad to grid size)', () => {
      expect(
        validateQuestionVisualSpec({
          visualType: 'array_model',
          gridRows: 2,
          gridCols: 2,
          values: [1],
        }),
      ).toBeNull();
    });
  });

  describe('area_model', () => {
    it('accepts a valid 2x2 partial-product layout', () => {
      expect(
        validateQuestionVisualSpec({
          visualType: 'area_model',
          gridRows: 2,
          gridCols: 2,
          rowLabels: ['20', '3'],
          colLabels: ['40', '7'],
          cellLabels: ['800', '140', '120', '21'],
        }),
      ).toBeNull();
    });

    it('rejects oversized grids', () => {
      expect(
        validateQuestionVisualSpec({
          visualType: 'area_model',
          gridRows: 9,
          gridCols: 2,
        }),
      ).toMatch(/between 1 and 8/);
    });

    it('rejects too many row/col/cell labels', () => {
      expect(
        validateQuestionVisualSpec({
          visualType: 'area_model',
          gridRows: 2,
          gridCols: 2,
          rowLabels: ['a', 'b', 'c'],
        }),
      ).toMatch(/rowLabels/);
      expect(
        validateQuestionVisualSpec({
          visualType: 'area_model',
          gridRows: 2,
          gridCols: 2,
          cellLabels: ['1', '2', '3', '4', '5'],
        }),
      ).toMatch(/cellLabels/);
    });
  });

  describe('fraction_circle', () => {
    it('accepts valid total/shaded', () => {
      expect(
        validateQuestionVisualSpec({
          visualType: 'fraction_circle',
          totalParts: 6,
          shadedParts: 5,
        }),
      ).toBeNull();
    });

    it('rejects totalParts > 24', () => {
      expect(
        validateQuestionVisualSpec({
          visualType: 'fraction_circle',
          totalParts: 25,
          shadedParts: 1,
        }),
      ).toMatch(/totalParts/);
    });

    it('rejects shadedParts > totalParts', () => {
      expect(
        validateQuestionVisualSpec({
          visualType: 'fraction_circle',
          totalParts: 4,
          shadedParts: 5,
        }),
      ).toMatch(/shadedParts/);
    });
  });

  describe('coordinate_plane', () => {
    it('accepts a valid plane with points', () => {
      expect(
        validateQuestionVisualSpec({
          visualType: 'coordinate_plane',
          xMin: -5,
          xMax: 5,
          yMin: -5,
          yMax: 5,
          points: [
            { x: 1, y: 1 },
            { x: -3, y: 2, label: 'B' },
          ],
        }),
      ).toBeNull();
    });

    it('rejects xMax <= xMin', () => {
      expect(
        validateQuestionVisualSpec({
          visualType: 'coordinate_plane',
          xMin: 5,
          xMax: 5,
          yMin: -5,
          yMax: 5,
        }),
      ).toMatch(/xMin and xMax/);
    });

    it('rejects too many grid lines', () => {
      expect(
        validateQuestionVisualSpec({
          visualType: 'coordinate_plane',
          xMin: 0,
          xMax: 100,
          yMin: 0,
          yMax: 100,
          xTickStep: 1,
        }),
      ).toMatch(/too many grid lines/);
    });

    it('rejects out-of-bounds points', () => {
      expect(
        validateQuestionVisualSpec({
          visualType: 'coordinate_plane',
          xMin: -5,
          xMax: 5,
          yMin: -5,
          yMax: 5,
          points: [{ x: 99, y: 0 }],
        }),
      ).toMatch(/within the configured bounds/);
    });

    it('rejects too many points', () => {
      const points = Array.from({ length: 33 }, (_, i) => ({ x: 0, y: i % 5 }));
      expect(
        validateQuestionVisualSpec({
          visualType: 'coordinate_plane',
          xMin: -5,
          xMax: 5,
          yMin: -5,
          yMax: 5,
          points,
        }),
      ).toMatch(/at most 32 points/);
    });
  });

  describe('geometric_shape', () => {
    it('accepts a triangle with side labels', () => {
      expect(
        validateQuestionVisualSpec({
          visualType: 'geometric_shape',
          shapeName: 'triangle',
          sideLabels: ['5', '5', '5'],
          angleLabels: ['60°', '60°', '60°'],
        }),
      ).toBeNull();
    });

    it('rejects unknown shapeName', () => {
      expect(
        validateQuestionVisualSpec({
          visualType: 'geometric_shape',
          shapeName: 'octagon',
        }),
      ).toMatch(/shapeName/);
    });

    it('rejects too many side labels for the shape', () => {
      expect(
        validateQuestionVisualSpec({
          visualType: 'geometric_shape',
          shapeName: 'triangle',
          sideLabels: ['a', 'b', 'c', 'd'],
        }),
      ).toMatch(/sideLabels/);
    });
  });

  describe('bar_model', () => {
    it('accepts labeled segments with weights and shading', () => {
      expect(
        validateQuestionVisualSpec({
          visualType: 'bar_model',
          segmentLabels: ['12', '12', '?'],
          segmentWeights: [1, 1, 1],
          segmentShaded: [1, 1, 0],
        }),
      ).toBeNull();
    });

    it('rejects missing segmentLabels', () => {
      expect(
        validateQuestionVisualSpec({
          visualType: 'bar_model',
        }),
      ).toMatch(/segmentLabels/);
    });

    it('rejects mismatched segmentWeights length', () => {
      expect(
        validateQuestionVisualSpec({
          visualType: 'bar_model',
          segmentLabels: ['a', 'b'],
          segmentWeights: [1],
        }),
      ).toMatch(/segmentWeights/);
    });

    it('rejects non-positive weights', () => {
      expect(
        validateQuestionVisualSpec({
          visualType: 'bar_model',
          segmentLabels: ['a', 'b'],
          segmentWeights: [1, 0],
        }),
      ).toMatch(/positive finite/);
    });

    it('rejects non-binary shading', () => {
      expect(
        validateQuestionVisualSpec({
          visualType: 'bar_model',
          segmentLabels: ['a', 'b'],
          segmentShaded: [1, 2],
        }),
      ).toMatch(/0 or 1/);
    });
  });

  describe('clock_face', () => {
    it('accepts a valid time', () => {
      expect(
        validateQuestionVisualSpec({
          visualType: 'clock_face',
          hour: 9,
          minute: 30,
        }),
      ).toBeNull();
    });

    it('rejects out-of-range hour', () => {
      expect(
        validateQuestionVisualSpec({
          visualType: 'clock_face',
          hour: 24,
          minute: 0,
        }),
      ).toMatch(/hour/);
    });

    it('rejects out-of-range minute', () => {
      expect(
        validateQuestionVisualSpec({
          visualType: 'clock_face',
          hour: 9,
          minute: 60,
        }),
      ).toMatch(/minute/);
    });

    it('rejects non-integer time', () => {
      expect(
        validateQuestionVisualSpec({
          visualType: 'clock_face',
          hour: 9.5,
          minute: 30,
        }),
      ).toMatch(/hour/);
    });
  });
});
