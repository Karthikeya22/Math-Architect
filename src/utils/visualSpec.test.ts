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

  it('renders area_model overlap shading for fraction products', () => {
    const svg = renderDeterministicVisualSvg({
      visualType: 'area_model',
      gridRows: 3,
      gridCols: 5,
      highlightRows: 2,
      highlightCols: 4,
    });
    expect(svg).toContain('#fde68a');
    expect(svg).toContain('#93c5fd');
    expect(svg).toContain('#86efac');
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

describe('bar_chart without axis labels (audit repro)', () => {
  // The quiz model often omits xLabel/yLabel; "The bar graph shows..." items then had no graph at all.
  it('still renders the bars and category names', () => {
    const svg = renderDeterministicVisualSvg({
      visualType: 'bar_chart',
      categories: ['Maya', 'Leo', 'Sam', 'Zoe'],
      values: [6, 9, 4, 7],
    });
    expect(svg).toMatch(/<svg/);
    expect(svg).toContain('>Leo</text>');
    expect(svg).toContain('>9</text>');
  });
});

describe('ten_frame "1 ten" label (audit repro)', () => {
  it('does not call a frame with 4 dots "1 ten"', () => {
    const svg = renderDeterministicVisualSvg({ visualType: 'ten_frame', values: [1, 1, 1, 1, 0, 0, 0, 0, 0, 0] });
    expect(svg).not.toContain('1 ten');
  });

  it('labels the full frame "1 ten" in a teen-number display', () => {
    const svg = renderDeterministicVisualSvg({ visualType: 'ten_frame', values: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], onesCount: 3 });
    expect(svg).toContain('1 ten');
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


describe('data display fixes (figure audit 2026-10-22)', () => {
  const bars = { visualType: 'bar_chart' as const, categories: ['Maya', 'Leo', 'Sam'], values: [12, 18, 8] };

  it('reads values off a numbered y-axis instead of printing them on the bars', () => {
    const svg = renderDeterministicVisualSvg({ ...bars, tickStep: 2 })!;
    expect(svg).toContain('>16</text>'); // axis tick that is not a data value
    expect(svg).not.toMatch(/>18<\/text>[^]*>18<\/text>/); // 18 appears once (axis), not again over a bar
  });

  it('draws a picture graph with a key', () => {
    const svg = renderDeterministicVisualSvg({ visualType: 'bar_chart', chartStyle: 'pictures', iconUnit: 1, categories: ['Apples', 'Bananas'], values: [6, 4] })!;
    expect((svg.match(/class="icon"/g) || []).length).toBe(10);
    expect(svg).toMatch(/= 1/);
  });

  it('draws the icon the stem names, in the rows and the key', () => {
    const svg = renderDeterministicVisualSvg({ visualType: 'bar_chart', chartStyle: 'pictures', iconShape: 'star', categories: ['Blue', 'Red'], values: [6, 2] })!;
    expect((svg.match(/<polygon class="icon"/g) || []).length).toBe(8);
    expect(svg).not.toMatch(/<circle/);
    expect((svg.match(/<polygon/g) || []).length).toBe(9); // + key
  });

  it('joins coordinate points only as the spec says', () => {
    const base = { visualType: 'coordinate_plane' as const, xMin: -4, xMax: 4, yMin: 0, yMax: 8 };
    const points = [{ x: 0, y: 3 }, { x: 2, y: 7 }, { x: -3, y: 3 }, { x: -1, y: 7 }];
    const lines = renderDeterministicVisualSvg({ ...base, points, connect: 'lines' })!;
    expect((lines.match(/<polyline[^>]*fill="none"/g) || []).length).toBe(2);
    expect(lines).not.toMatch(/rgba\(37, 99, 235/);
    const dots = renderDeterministicVisualSvg({ ...base, points, connect: 'none' })!;
    expect(dots).not.toMatch(/<polyline/);
    const shape = renderDeterministicVisualSvg({ ...base, points: points.slice(0, 3), connect: 'polygon' })!;
    expect((shape.match(/<polyline[^>]*rgba\(37, 99, 235/g) || []).length).toBe(1);
    const collinear = renderDeterministicVisualSvg({ ...base, points: [{ x: 0, y: 1 }, { x: 2, y: 5 }, { x: 1, y: 3 }], connect: 'lines' })!;
    expect((collinear.match(/<polyline/g) || []).length).toBe(1);
  });

  it('draws tally marks in groups of five', () => {
    const svg = renderDeterministicVisualSvg({ visualType: 'bar_chart', chartStyle: 'tally', categories: ['Dogs', 'Birds'], values: [7, 3] })!;
    expect((svg.match(/class="tally"/g) || []).length).toBe(10);
    expect(svg).toContain('>Dogs</text>');
  });

  it('shrinks long table headers to fit their column', () => {
    const svg = renderDeterministicVisualSvg({
      visualType: 'table',
      columns: ['', 'participate in clubs', 'do not participate', 'Total'],
      rows: [['do not play sports', '72', '48', '120']],
    })!;
    const size = Number(svg.match(/font-size="(\d+(?:\.\d+)?)"[^>]*>participate in clubs</)![1]);
    expect(size).toBeLessThan(22);
  });
});
