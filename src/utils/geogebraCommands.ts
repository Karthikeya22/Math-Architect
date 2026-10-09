/**
 * GeoGebra GGBScript command builders for deterministic quiz visuals.
 * GeoGebra is free for non-commercial educational use only.
 * https://www.geogebra.org/license
 */

const clampInt = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, Math.floor(value)));

const escText = (value: string): string => String(value).replace(/"/g, '\\"');

export const buildNumberLineCommands = (
  min: number,
  max: number,
  markedValues: number[],
): string[] => {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return [];

  const span = max - min;
  const step = span > 20 ? span / 39 : 1;
  const ticks: number[] = [];
  for (let t = min; t <= max + step * 0.0001; t += step) {
    ticks.push(Number(t.toFixed(6)));
    if (ticks.length > 60) break;
  }

  const marks = [...new Set(markedValues.filter((v) => Number.isFinite(v) && v >= min && v <= max))];
  const pad = Math.max(span * 0.08, 0.5);

  const commands: string[] = [
    'ShowAxes(false)',
    'ShowGrid(false)',
    `axis = Segment((${min}, 0), (${max}, 0))`,
    'SetColor(axis, "black")',
    'SetLineThickness(axis, 3)',
  ];

  for (let i = 0; i < ticks.length; i++) {
    const x = ticks[i];
    const label = Number.isInteger(x) ? String(x) : x.toFixed(1);
    commands.push(
      `tick${i} = Segment((${x}, -0.12), (${x}, 0.12))`,
      `SetColor(tick${i}, "black")`,
      `lbl${i} = Text((${x}, -0.42), "${escText(label)}")`,
    );
  }

  for (let i = 0; i < marks.length; i++) {
    const x = marks[i];
    commands.push(
      `mark${i} = (${x}, 0)`,
      `SetPointStyle(mark${i}, 2)`,
      `SetColor(mark${i}, "blue")`,
      `SetPointSize(mark${i}, 5)`,
    );
  }

  commands.push(`ZoomIn(${min - pad}, -1.2, ${max + pad}, 1.2)`);
  return commands;
};

export const buildFractionBarCommands = (
  totalParts: number,
  shadedParts: number,
  showLabel = false,
): string[] => {
  const total = clampInt(totalParts, 1, 48);
  const shaded = clampInt(shadedParts, 0, total);
  const commands: string[] = ['ShowAxes(false)', 'ShowGrid(false)'];

  for (let i = 0; i < total; i++) {
    const x0 = i;
    const x1 = i + 1;
    commands.push(`seg${i} = Polygon((${x0}, 0), (${x1}, 0), (${x1}, 1), (${x0}, 1))`);
    if (i < shaded) {
      commands.push(`SetColor(seg${i}, "blue")`);
      commands.push(`SetFilling(seg${i}, 1)`);
    } else {
      commands.push(`SetColor(seg${i}, "white")`);
      commands.push(`SetFilling(seg${i}, 1)`);
    }
    commands.push(`SetLineThickness(seg${i}, 2)`);
  }

  if (showLabel) {
    commands.push(`fracLbl = Text((${total / 2}, -0.55), "${escText(`${shaded}/${total}`)}")`);
  }

  commands.push(`ZoomIn(-0.4, -0.9, ${total + 0.4}, 1.35)`);
  return commands;
};

export const buildFractionCircleCommands = (
  totalParts: number,
  shadedParts: number,
  showLabel = false,
): string[] => {
  const total = clampInt(totalParts, 1, 24);
  const shaded = clampInt(shadedParts, 0, total);
  const commands: string[] = [
    'ShowAxes(false)',
    'ShowGrid(false)',
    'O = (0, 0)',
    'base = (2, 0)',
    `circ = Circle(O, 2)`,
    'SetColor(circ, "black")',
  ];

  const stepDeg = 360 / total;
  for (let i = 0; i < total; i++) {
    const a1 = i * stepDeg;
    const a2 = (i + 1) * stepDeg;
    commands.push(
      `p${i}a = (${(2 * Math.cos((a1 * Math.PI) / 180)).toFixed(4)}, ${(2 * Math.sin((a1 * Math.PI) / 180)).toFixed(4)})`,
      `p${i}b = (${(2 * Math.cos((a2 * Math.PI) / 180)).toFixed(4)}, ${(2 * Math.sin((a2 * Math.PI) / 180)).toFixed(4)})`,
      `slice${i} = Sector(O, p${i}a, p${i}b)`,
    );
    if (i < shaded) {
      commands.push(`SetColor(slice${i}, "blue")`);
      commands.push(`SetFilling(slice${i}, 1)`);
    } else {
      commands.push(`SetColor(slice${i}, "white")`);
      commands.push(`SetFilling(slice${i}, 1)`);
    }
  }

  if (showLabel) {
    commands.push(`fracLbl = Text((0, -2.6), "${escText(`${shaded}/${total}`)}")`);
  }

  commands.push('ZoomIn(-2.8, -2.8, 2.8, 2.8)');
  return commands;
};

const shapePolygonCommands = (shapeName: string, cx: number, cy: number, size: number): string[] => {
  const s = shapeName.toLowerCase();
  if (s === 'circle') {
    return [`shape = Circle((${cx}, ${cy}), ${size})`, 'SetColor(shape, "lightblue")', 'SetFilling(shape, 1)'];
  }
  if (s === 'square') {
    const h = size / 2;
    return [
      `shape = Polygon((${cx - h}, ${cy - h}), (${cx + h}, ${cy - h}), (${cx + h}, ${cy + h}), (${cx - h}, ${cy + h}))`,
      'SetColor(shape, "lightblue")',
      'SetFilling(shape, 1)',
    ];
  }
  if (s === 'rectangle') {
    const w = size;
    const h = size * 0.65;
    return [
      `shape = Polygon((${cx - w / 2}, ${cy - h / 2}), (${cx + w / 2}, ${cy - h / 2}), (${cx + w / 2}, ${cy + h / 2}), (${cx - w / 2}, ${cy + h / 2}))`,
      'SetColor(shape, "lightblue")',
      'SetFilling(shape, 1)',
    ];
  }
  if (s === 'triangle' || s === 'right_triangle') {
    return [
      `shape = Polygon((${cx}, ${cy + size * 0.55}), (${cx - size * 0.55}, ${cy - size * 0.45}), (${cx + size * 0.55}, ${cy - size * 0.45}))`,
      'SetColor(shape, "lightblue")',
      'SetFilling(shape, 1)',
    ];
  }
  const sides =
    s === 'pentagon' ? 5 : s === 'hexagon' ? 6 : s === 'parallelogram' ? 4 : s === 'trapezoid' ? 4 : 3;
  if (sides >= 5) {
    return [
      `shape = RegularPolygon((${cx}, ${cy}), (${cx + size}, ${cy}), ${sides})`,
      'SetColor(shape, "lightblue")',
      'SetFilling(shape, 1)',
    ];
  }
  return [
    `shape = Polygon((${cx}, ${cy + size * 0.55}), (${cx - size * 0.55}, ${cy - size * 0.45}), (${cx + size * 0.55}, ${cy - size * 0.45}))`,
    'SetColor(shape, "lightblue")',
    'SetFilling(shape, 1)',
  ];
};

export const buildGeometricShapeCommands = (
  shapeName: string,
  labeledSides?: Record<string, number>,
  sideLabels?: string[],
): string[] => {
  const commands: string[] = ['ShowAxes(false)', 'ShowGrid(false)', ...shapePolygonCommands(shapeName, 0, 0, 2.5)];

  const labels = sideLabels?.length
    ? sideLabels
    : labeledSides
      ? Object.entries(labeledSides).map(([k, v]) => `${k}: ${v}`)
      : [];

  labels.slice(0, 6).forEach((label, i) => {
    const y = 2.8 - i * 0.35;
    commands.push(`sideLbl${i} = Text((0, ${y}), "${escText(String(label))}")`);
  });

  commands.push('ZoomIn(-3.5, -3.5, 3.5, 3.5)');
  return commands;
};

export const buildGeometricCompareCommands = (shapes: string[]): string[] => {
  const list = shapes.map((s) => String(s || '').trim()).filter(Boolean).slice(0, 4);
  if (!list.length) return [];

  const commands: string[] = ['ShowAxes(false)', 'ShowGrid(false)'];
  const spacing = 5;
  const startX = -((list.length - 1) * spacing) / 2;

  list.forEach((shape, index) => {
    const cx = startX + index * spacing;
    const prefix = `g${index}`;
    const poly = shapePolygonCommands(shape, cx, 0, 2);
    commands.push(...poly.map((line) => line.replace(/\bshape\b/g, prefix)));
  });

  const minX = startX - 3;
  const maxX = startX + (list.length - 1) * spacing + 3;
  commands.push(`ZoomIn(${minX}, -3.5, ${maxX}, 3.5)`);
  return commands;
};

export const buildFunctionGraphCommands = (
  expression: string,
  xMin: number,
  xMax: number,
): string[] => {
  const expr = String(expression || '')
    .trim()
    .replace(/^f\s*\(\s*x\s*\)\s*=\s*/i, '')
    .replace(/^y\s*=\s*/i, '');
  if (!expr || !Number.isFinite(xMin) || !Number.isFinite(xMax) || xMax <= xMin) return [];

  const safeExpr = expr.replace(/"/g, '');
  const yPad = Math.max((xMax - xMin) * 0.35, 2);

  return [
    'ShowAxes(true)',
    'ShowGrid(true)',
    `f(x) = ${safeExpr}`,
    'SetColor(f, "blue")',
    'SetLineThickness(f, 3)',
    `ZoomIn(${xMin}, ${-yPad}, ${xMax}, ${yPad})`,
    `xLbl = Text((${xMax - (xMax - xMin) * 0.05}, ${-yPad * 0.85}), "x")`,
    `yLbl = Text((${xMin + (xMax - xMin) * 0.02}, ${yPad * 0.85}), "y")`,
  ];
};

export const buildCoordinatePointsCommands = (
  points: Array<{ x: number; y: number; label?: string }>,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
): string[] => {
  if (!points.length || xMax <= xMin || yMax <= yMin) return [];

  const plotPoints = points.slice(0, 24).filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
  const commands: string[] = [
    'ShowAxes(true)',
    'ShowGrid(true)',
    `ZoomIn(${xMin}, ${yMin}, ${xMax}, ${yMax})`,
  ];

  plotPoints.forEach((p, i) => {
    commands.push(`P${i} = (${p.x}, ${p.y})`);
    commands.push(`SetPointStyle(P${i}, 2)`);
    commands.push(`SetColor(P${i}, "blue")`);
    commands.push(`SetPointSize(P${i}, 5)`);
    if (p.label) {
      commands.push(
        `Plbl${i} = Text((${p.x + (xMax - xMin) * 0.04}, ${p.y + (yMax - yMin) * 0.04}), "${escText(p.label)}")`,
      );
    }
  });

  if (plotPoints.length >= 3) {
    const names = plotPoints.map((_, i) => `P${i}`).join(', ');
    commands.push(`fig = Polygon(${names})`);
    commands.push('SetColor(fig, "blue")');
    commands.push('SetFilling(fig, 0.15)');
    commands.push('SetLineThickness(fig, 3)');
  } else if (plotPoints.length === 2) {
    commands.push('seg = Segment(P0, P1)');
    commands.push('SetColor(seg, "blue")');
    commands.push('SetLineThickness(seg, 3)');
  }

  return commands;
};

export const buildPlaceValueTableCommands = (number: number): string[] => {
  const n = Math.max(0, Math.min(9999, Math.floor(Math.abs(number))));
  const digits = String(n).padStart(4, '0').split('').map((d) => Number(d));
  const headers = ['Thousands', 'Hundreds', 'Tens', 'Ones'];
  const commands: string[] = ['ShowAxes(false)', 'ShowGrid(false)'];

  headers.forEach((header, col) => {
    const x = col * 2.2;
    commands.push(`h${col} = Text((${x}, 1.2), "${escText(header)}")`);
    commands.push(`v${col} = Text((${x}, 0), "${digits[col]}")`);
  });

  commands.push('ZoomIn(-0.8, -0.8, 8.5, 2.2)');
  return commands;
};

const GGB_COLOR: Record<string, string> = {
  red: '"red"',
  blue: '"blue"',
  green: '"green"',
  yellow: '"yellow"',
  orange: '"orange"',
  purple: '"purple"',
};

export const buildArrayModelCommands = (
  gridRows: number,
  gridCols: number,
  values: number[],
  rowColors?: string[],
): string[] => {
  const rows = Math.max(1, Math.min(8, Math.floor(gridRows)));
  const cols = Math.max(1, Math.min(20, Math.floor(gridCols)));
  if (rows * cols > 120) return [];

  const cells: number[] = [];
  for (let i = 0; i < rows * cols; i++) {
    const v = Number(values[i]);
    cells.push(Number.isFinite(v) && v >= 1 ? 1 : 0);
  }

  const commands: string[] = ['ShowAxes(false)', 'ShowGrid(false)'];
  let idx = 0;
  for (let row = 0; row < rows; row++) {
    const color = GGB_COLOR[String(rowColors?.[row] || 'blue').toLowerCase()] || '"blue"';
    for (let col = 0; col < cols; col++) {
      const x = col * 1.2;
      const y = -row * 1.2;
      commands.push(`cell${idx} = (${x}, ${y})`);
      commands.push(`SetPointStyle(cell${idx}, 2)`);
      if (cells[idx]) {
        commands.push(`SetColor(cell${idx}, ${color})`);
        commands.push(`SetPointSize(cell${idx}, 7)`);
      } else {
        commands.push(`SetColor(cell${idx}, "white")`);
        commands.push(`SetPointSize(cell${idx}, 4)`);
      }
      idx++;
    }
  }

  commands.push(`ZoomIn(-0.8, ${-rows * 1.2 - 0.5}, ${cols * 1.2 + 0.5}, 0.8)`);
  return commands;
};

export const buildTenFrameCommands = (values: number[], onesCount = 0): string[] => {
  const frame = Array.from({ length: 10 }, (_, i) => (Number(values[i]) >= 1 ? 1 : 0));
  const extra = Math.max(0, Math.min(10, Math.floor(onesCount)));
  const commands: string[] = ['ShowAxes(false)', 'ShowGrid(false)'];

  for (let i = 0; i < 10; i++) {
    const row = Math.floor(i / 5);
    const col = i % 5;
    const x = col * 1.1;
    const y = -row * 1.1;
    commands.push(`tf${i} = (${x}, ${y})`);
    commands.push(`SetPointStyle(tf${i}, 2)`);
    if (frame[i]) {
      commands.push(`SetColor(tf${i}, "blue")`);
      commands.push(`SetPointSize(tf${i}, 7)`);
    } else {
      commands.push(`SetColor(tf${i}, "white")`);
      commands.push(`SetPointSize(tf${i}, 4)`);
    }
  }

  for (let j = 0; j < extra; j++) {
    const x = 5.5 + (j % 5) * 1.1;
    const y = -Math.floor(j / 5) * 1.1;
    commands.push(`one${j} = (${x}, ${y})`);
    commands.push(`SetPointStyle(one${j}, 2)`);
    commands.push(`SetColor(one${j}, "blue")`);
    commands.push(`SetPointSize(one${j}, 7)`);
  }

  const right = extra > 0 ? 5.5 + Math.min(extra, 5) * 1.1 : 4.5;
  commands.push(`ZoomIn(-0.6, -2.4, ${right + 0.5}, 0.9)`);
  return commands;
};

export const looksLikeFunctionExpression = (prompt: string): boolean => {
  const p = String(prompt || '').trim();
  if (!p) return false;
  return (
    /^f\s*\(\s*x\s*\)\s*=/i.test(p) ||
    /^y\s*=/i.test(p) ||
    /\(x\)/i.test(p) ||
    /[xX]\s*[\^*+\-/]/.test(p)
  );
};
