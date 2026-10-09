import { describe, expect, it } from 'vitest';
import {
  isDeterministicVisualSpecType,
  normalizeVisualTypeToken,
  normalizeVisualSpec,
  renderDeterministicVisualSvg,
} from './visualSpec';

describe('normalizeVisualTypeToken', () => {
  it('maps hyphenated and camelCase model tokens to snake_case ids', () => {
    expect(normalizeVisualTypeToken('ten-frame')).toBe('ten_frame');
    expect(normalizeVisualTypeToken('numberLine')).toBe('number_line');
  });
});

describe('normalizeVisualSpec', () => {
  it('normalizes table visual spec with rows', () => {
    const spec = normalizeVisualSpec({
      visualType: 'table',
      columns: ['Day', 'Minutes'],
      rows: [
        ['Monday', '20'],
        ['Tuesday', '25'],
      ],
    });
    expect(spec?.visualType).toBe('table');
    expect(spec?.rows?.[0]?.[0]).toBe('Monday');
  });

  it('pads array_model values to gridRows × gridCols', () => {
    const spec = normalizeVisualSpec({
      visualType: 'array_model',
      gridRows: 2,
      gridCols: 2,
      values: [1],
    });
    expect(spec?.values?.length).toBe(4);
    expect(spec?.values).toEqual([1, 0, 0, 0]);
  });
});

describe('renderDeterministicVisualSvg', () => {
  it('renders number_line with ticks and dots', () => {
    const svg = renderDeterministicVisualSvg({
      visualType: 'number_line',
      min: 0,
      max: 10,
      tickStep: 1,
      values: [3, 7],
      xLabel: 'Numbers',
    });
    expect(svg).toContain('<svg');
    expect(svg).toContain('Numbers');
    expect(svg).toContain('<circle');
  });

  it('renders fraction_bar segments', () => {
    const svg = renderDeterministicVisualSvg({
      visualType: 'fraction_bar',
      totalParts: 8,
      shadedParts: 3,
    });
    expect(svg).toContain('<svg');
    expect(svg).toContain('#2563eb');
  });

  it('renders ten_frame with extra ones dots for teen place value', () => {
    const svg = renderDeterministicVisualSvg({
      visualType: 'ten_frame',
      values: Array.from({ length: 10 }, () => 1),
      onesCount: 4,
    });
    expect(svg).toContain('<svg');
    expect(svg).toContain('1 ten');
    expect(svg).toContain('ones');
    expect(svg?.match(/<circle/g)?.length).toBe(14);
  });

  it('renders multiple full ten-frames plus ones for forty-three', () => {
    const svg = renderDeterministicVisualSvg({
      visualType: 'ten_frame',
      values: Array.from({ length: 10 }, () => 1),
      tensCount: 4,
      onesCount: 3,
    });
    expect(svg).toContain('<svg');
    expect(svg).toContain('tens');
    expect(svg).toContain('ones');
    expect(svg?.match(/<circle/g)?.length).toBe(43);
  });

  it('renders array_model grid', () => {
    const svg = renderDeterministicVisualSvg({
      visualType: 'array_model',
      gridRows: 2,
      gridCols: 5,
      values: [1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
    });
    expect(svg).toContain('<svg');
    expect(svg).toContain('<circle');
  });

  it('renders area_model with row/col headers and inner cell labels', () => {
    const svg = renderDeterministicVisualSvg({
      visualType: 'area_model',
      gridRows: 2,
      gridCols: 2,
      rowLabels: ['20', '3'],
      colLabels: ['40', '7'],
      cellLabels: ['800', '140', '120', '21'],
    });
    expect(svg).toContain('<svg');
    expect(svg).toContain('800');
    expect(svg).toContain('140');
    expect(svg).toContain('20');
    expect(svg).toContain('40');
  });

  it('renders fraction_circle as pie sectors', () => {
    const svg = renderDeterministicVisualSvg({
      visualType: 'fraction_circle',
      totalParts: 4,
      shadedParts: 1,
    });
    expect(svg).toContain('<svg');
    expect(svg).toContain('<path');
    expect(svg).toContain('#2563eb');
  });

  it('renders fraction_circle whole when totalParts=1', () => {
    const svg = renderDeterministicVisualSvg({
      visualType: 'fraction_circle',
      totalParts: 1,
      shadedParts: 1,
    });
    expect(svg).toContain('<circle');
    expect(svg).toContain('#2563eb');
  });

  it('renders coordinate_plane with plotted point label', () => {
    const svg = renderDeterministicVisualSvg({
      visualType: 'coordinate_plane',
      xMin: -5,
      xMax: 5,
      yMin: -5,
      yMax: 5,
      points: [{ x: 2, y: 3, label: 'A' }],
      xLabel: 'x',
      yLabel: 'y',
    });
    expect(svg).toContain('<svg');
    expect(svg).toContain('<circle');
    expect(svg).toContain('>A<');
  });

  it('renders geometric_shape polygon for triangle', () => {
    const svg = renderDeterministicVisualSvg({
      visualType: 'geometric_shape',
      shapeName: 'triangle',
      sideLabels: ['5 cm', '5 cm', '5 cm'],
    });
    expect(svg).toContain('<polygon');
    expect(svg).toContain('5 cm');
  });

  it('renders geometric_shape with multiple named shapes side by side', () => {
    const svg = renderDeterministicVisualSvg({
      visualType: 'geometric_shape',
      shapes: ['triangle', 'square'],
    });
    expect(svg).toContain('<polygon');
    expect((svg?.match(/<polygon/g) || []).length).toBe(2);
  });

  it('renders bar_model with weighted segments and shading', () => {
    const svg = renderDeterministicVisualSvg({
      visualType: 'bar_model',
      segmentLabels: ['12', '12', '?'],
      segmentWeights: [1, 1, 1],
      segmentShaded: [1, 1, 0],
    });
    expect(svg).toContain('<svg');
    expect(svg).toContain('<rect');
    expect(svg).toContain('?');
    expect(svg).toContain('#2563eb');
  });

  it('renders clock_face with both hands and 12 at top', () => {
    const svg = renderDeterministicVisualSvg({
      visualType: 'clock_face',
      hour: 3,
      minute: 15,
    });
    expect(svg).toContain('<svg');
    expect(svg).toContain('>12<');
    expect(svg).toContain('>3<');
  });

  it('renders line plot SVG with x-label and values', () => {
    const svg = renderDeterministicVisualSvg({
      visualType: 'line_plot',
      xLabel: 'Books Read',
      values: [2, 2, 3, 5, 5, 5, 8],
    });
    expect(svg).toContain('Books Read');
    expect(svg).toContain('<svg');
  });

  it('renders table SVG with all row labels', () => {
    const svg = renderDeterministicVisualSvg({
      visualType: 'table',
      title: 'Flute Practice',
      columns: ['Day', 'Minutes'],
      rows: [
        ['Monday', '20'],
        ['Tuesday', '25'],
        ['Wednesday', '20'],
      ],
    });
    expect(svg).toContain('Flute Practice');
    expect(svg).toContain('Wednesday');
    expect(svg).toContain('Minutes');
  });

  it('renders ten-frame SVG with ten cells', () => {
    const svg = renderDeterministicVisualSvg({
      visualType: 'ten_frame',
      values: [1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
    });
    expect(svg).toContain('<svg');
    expect(svg).toContain('<circle');
  });
});

describe('isDeterministicVisualSpecType', () => {
  it('returns true only for deterministic chart-like visual types', () => {
    expect(isDeterministicVisualSpecType('ten_frame')).toBe(true);
    expect(isDeterministicVisualSpecType('number_line')).toBe(true);
    expect(isDeterministicVisualSpecType('fraction_bar')).toBe(true);
    expect(isDeterministicVisualSpecType('array_model')).toBe(true);
    expect(isDeterministicVisualSpecType('area_model')).toBe(true);
    expect(isDeterministicVisualSpecType('fraction_circle')).toBe(true);
    expect(isDeterministicVisualSpecType('coordinate_plane')).toBe(true);
    expect(isDeterministicVisualSpecType('geometric_shape')).toBe(true);
    expect(isDeterministicVisualSpecType('bar_model')).toBe(true);
    expect(isDeterministicVisualSpecType('clock_face')).toBe(true);
    expect(isDeterministicVisualSpecType('line_plot')).toBe(true);
    expect(isDeterministicVisualSpecType('table')).toBe(true);
    expect(isDeterministicVisualSpecType('bar_chart')).toBe(true);
    expect(isDeterministicVisualSpecType('scene_only')).toBe(false);
  });
});

