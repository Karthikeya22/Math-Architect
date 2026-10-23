import fs from 'node:fs';
import path from 'node:path';
import type { VisualSpec } from '../../src/types.ts';
import { applyQuestionVisualReconcilers } from '../../src/utils/reconcileVisualFromStem.ts';
import { normalizeVisualSpec, renderDeterministicVisualSvg } from '../../src/utils/visualSpec.ts';
import { buildFigureContract, checkContractCoverage, extractSvgText } from '../../src/server/figures/figureContract.ts';
import { buildItemClaim } from '../../src/server/figures/itemClaim.ts';
import type { FigureFamily } from '../../src/server/figures/figureContract.ts';

export type StandardRecord = {
  id?: number;
  code: string;
  grade: string;
  subject?: string;
  strand?: string;
  cluster?: string;
  description?: string;
  clarifications?: string[];
  instructional_tasks?: string[];
  instructional_items?: string[];
  tiered_instruction?: string[];
  purpose_and_strategies?: string[];
  misconceptions?: string[];
  glossary_terms?: string[];
  source_url?: string;
};

export type ExampleCandidate = {
  source: 'instructional_item' | 'instructional_task' | 'clarification' | 'description';
  label: string;
  stem: string;
  options: string[];
};

export type FixtureStatus = 'pass' | 'missing_labels' | 'no_spec' | 'no_svg' | 'not_attempted';

export type StandardFigureRow = {
  code: string;
  grade: string;
  gradeBand: string;
  strandCode: string;
  strand: string;
  cluster: string;
  description: string;
  figureRequired: boolean;
  family: FigureFamily;
  figureReason: string;
  priority: 'P0' | 'P1' | 'P2' | 'none';
  exampleCounts: {
    instructionalItems: number;
    instructionalTasks: number;
    clarifications: number;
  };
  fixturePath: string | null;
  fixtureSource: string | null;
  fixtureStatus: FixtureStatus;
  expectedLabels: string[];
  coveragePct: number | null;
  missingLabels: string[];
  notes: string[];
};

export type StandardFixture = {
  standardCode: string;
  grade: string;
  strand: string;
  source: ExampleCandidate['source'];
  label: string;
  stem: string;
  options: string[];
  expected: {
    figureRequired: boolean;
    family: FigureFamily;
    labels: string[];
    mustNotShow: string[];
    altText: string;
    reason: string;
  };
  visualSpec: VisualSpec | null;
  render: {
    status: FixtureStatus;
    coveragePct: number | null;
    missing: string[];
    leaks: string[];
    svgLength: number;
  };
};

const VISUAL_WORDS =
  /\b(?:graph|plot|table|chart|histogram|scatter|coordinate|number line|fraction (?:bar|strip|model|circle)|area model|array|ten frame|base[- ]ten|place value|number bond|tape diagram|bar model|clock|ruler|thermometer|scale|protractor|angle|triangle|rectangle|square|circle|polygon|prism|cylinder|cone|sphere|pyramid|net|area|perimeter|volume|surface area|parallel|perpendicular|intersect|line segment|ray|venn|set diagram|tree diagram|spinner|dot plot|line plot|box plot|stem[- ]and[- ]leaf|graph paper|grid)\b/i;

const GEOMETRY_WORDS = /\b(?:triangle|rectangle|square|circle|polygon|parallelogram|trapezoid|pentagon|hexagon|prism|cylinder|cone|sphere|pyramid|angle|parallel|perpendicular|line segment|ray|area|perimeter|volume|surface area|net)\b/i;
const RECTANGLE_WORDS = /\b(?:rectangle|square|area|perimeter|length|width)\b/i;
const FRACTION_WORDS = /\b(?:fraction|numerator|denominator|equivalent|mixed number|number line|fraction bar|fraction strip|fraction model)\b/i;
const PLACE_VALUE_WORDS = /\b(?:place value|base[- ]ten|ten frame|array|area model|hundreds|tens|ones|expanded form|standard form|word form|compose|decompose)\b/i;
const MEASUREMENT_WORDS = /\b(?:measure|ruler|length|width|height|time|clock|money|temperature|thermometer|volume|mass|weight|perimeter|area|unit|inches|feet|yards|centimeters|meters|grams|kilograms|liters|milliliters)\b/i;
const DATA_WORDS = /\b(?:graph|plot|table|chart|histogram|scatter|coordinate|data|survey|frequency|dot plot|line plot|bar graph|picture graph|stem[- ]and[- ]leaf|box plot)\b/i;
const LOGIC_WORDS = /\b(?:venn|set|truth table|logic|conditional|converse|contrapositive|counterexample|valid|argument)\b/i;
const FUNCTION_WORDS = /\b(?:function|graph|coordinate|slope|intercept|quadratic|exponential|logarithm|trigonometric|sine|cosine|tangent|unit circle|derivative|integral|limit|rate of change)\b/i;
const FINANCIAL_WORDS = /\b(?:budget|interest|loan|tax|income|expense|savings|credit|debit|financial|cost|price|profit)\b/i;

const clean = (value: unknown): string => String(value ?? '').replace(/\s+/g, ' ').trim();

const splitCode = (code: string): { strandCode: string; gradeBand: string } => {
  const match = String(code || '').match(/^MA\.([^.]+)\.([^.]+)\./i);
  const gradeBand = match?.[1] || '';
  const strandCode = (match?.[2] || '').toUpperCase();
  return { strandCode, gradeBand };
};

const gradeBandFor = (gradeBand: string): string => {
  if (/^K$/i.test(gradeBand)) return 'K';
  if (/^912$/.test(gradeBand)) return '9-12';
  if (/^K12$/i.test(gradeBand)) return 'K-12';
  return gradeBand;
};

const priorityFor = (strandCode: string, required: boolean): StandardFigureRow['priority'] => {
  if (!required) return 'none';
  if (['GR', 'M', 'DP'].includes(strandCode)) return 'P0';
  if (['NSO', 'FR', 'AR'].includes(strandCode)) return 'P1';
  return 'P2';
};

const familyFor = (std: StandardRecord, text: string): FigureFamily => {
  const { strandCode } = splitCode(std.code);
  if (strandCode === 'MTR') return 'none';
  if (/\bfraction circle\b/i.test(text)) return 'fraction_circle';
  // Fraction multiplication is an area-model standard, not a single-fraction bar.
  if (
    /\bmultiply\w*\b[^.]{0,80}\bfractions?\b|\bfractions?\b[^.]{0,80}\bmultipl(?:y|ied|ication)\b|\bfraction\s+by\s+a\s+fraction\b|\barea model\b/i.test(
      text,
    )
  ) {
    return 'area_model';
  }
  if (/\b(?:clock|analog|digital clock|a\.m\.|p\.m\.|half[- ]hour|quarter[- ]hour)\b/i.test(text)) {
    return 'clock_face';
  }
  if (FRACTION_WORDS.test(text)) return 'fraction_bar';
  if (/\b(?:ten frame|base[- ]ten|place value|number bond)\b/i.test(text)) return 'ten_frame';
  if (/\b(?:array|area model)\b/i.test(text)) return 'area_model';
  if (/\b(?:dot plot|line plot|histogram|scatter|stem[- ]and[- ]leaf|box plot|picture graph|bar graph)\b/i.test(text)) {
    return 'line_plot';
  }
  if (/\b(?:bar chart|frequency table|categorical data)\b/i.test(text)) return 'bar_chart';
  if (/\b(?:angle|parallel|perpendicular|intersect|line segment|ray)\b/i.test(text)) return 'geometric_shape';
  if (RECTANGLE_WORDS.test(text) && /\b(?:area|perimeter|length|width)\b/i.test(text)) return 'dimensioned_rectangles';
  if (GEOMETRY_WORDS.test(text)) return 'named_shapes';
  if (FUNCTION_WORDS.test(text)) return 'coordinate_plane';
  if (LOGIC_WORDS.test(text)) return 'geometric_shape';
  if (MEASUREMENT_WORDS.test(text)) return 'geometric_shape';
  if (FINANCIAL_WORDS.test(text)) return 'illustration';
  return 'none';
};

const defaultFamilyForStrand = (strandCode: string): FigureFamily => {
  switch (strandCode) {
    case 'GR':
      return 'named_shapes';
    case 'M':
      return 'geometric_shape';
    case 'DP':
      return 'bar_chart';
    case 'FR':
      return 'fraction_bar';
    case 'NSO':
      return 'ten_frame';
    case 'AR':
      return 'coordinate_plane';
    case 'F':
      return 'coordinate_plane';
    case 'T':
      return 'geometric_shape';
    case 'C':
      return 'coordinate_plane';
    case 'LT':
      return 'geometric_shape';
    case 'FL':
      return 'illustration';
    default:
      return 'illustration';
  }
};

export const classifyStandard = (std: StandardRecord): Pick<
  StandardFigureRow,
  'figureRequired' | 'family' | 'figureReason' | 'priority'
> => {
  const { strandCode } = splitCode(std.code);
  const description = clean(std.description);
  const cluster = clean(std.cluster);
  const clarifications = (std.clarifications || []).map(clean).join(' ');
  const exampleCandidates = extractExampleCandidates(std);
  const examples = exampleCandidates.map((candidate) => `${candidate.stem} ${candidate.options.join(' ')}`).join(' ');
  const text = `${description} ${cluster} ${clarifications} ${examples}`;

  if (strandCode === 'MTR') {
    return {
      figureRequired: false,
      family: 'none',
      figureReason: 'MTR standards describe mathematical thinking practices, not item-level figures.',
      priority: 'none',
    };
  }

  const hasVisual = VISUAL_WORDS.test(text);
  const hasGeometry = GEOMETRY_WORDS.test(text);
  const hasExamples = (std.instructional_items || []).length + (std.instructional_tasks || []).length > 0;

  let required = false;
  let reason = '';
  switch (strandCode) {
    case 'GR':
      required = true;
      reason = 'Geometric Reasoning standards describe figures, their attributes, or their measurements.';
      break;
    case 'M':
      required = MEASUREMENT_WORDS.test(text) || hasVisual;
      reason = required
        ? 'Measurement standards use instruments, units, or measured figures.'
        : 'No instrument or measured figure is needed for this measurement standard.';
      break;
    case 'DP':
      required = DATA_WORDS.test(text) || /\b(?:spinner|die|dice|coin|probability experiment)\b/i.test(text);
      reason = required
        ? 'Data Analysis and Probability standards use displays, grids, or experiment models.'
        : 'No data display or experiment model is needed for this standard.';
      break;
    case 'FR':
      required =
        (FRACTION_WORDS.test(text) && hasVisual) ||
        /\bmultiply\w*\b[^.]{0,80}\bfractions?\b|\bfractions?\b[^.]{0,80}\bmultipl(?:y|ied|ication)\b|\bfraction\s+by\s+a\s+fraction\b/i.test(
          text,
        );
      reason = required
        ? 'Fraction standard references a fraction model, strip, circle, or number line.'
        : 'Fraction standard is symbolic; no figure is required by the stem.';
      break;
    case 'NSO':
      required = PLACE_VALUE_WORDS.test(text) || /\b(?:count|objects|compare|number line)\b/i.test(text);
      reason = required
        ? 'Number Sense standard uses place-value, counting, array, or number-line models.'
        : 'Number Sense standard is symbolic; no figure is required.';
      break;
    case 'AR':
      required = /\b(?:area model|array|pattern|balance|graph|table)\b/i.test(text);
      reason = required
        ? 'Algebraic Reasoning standard references a model, pattern, graph, or table.'
        : 'Algebraic Reasoning standard is symbolic; no figure is required.';
      break;
    case 'F':
      required = FUNCTION_WORDS.test(text);
      reason = required
        ? 'Functions standard uses a graph, table, or coordinate model.'
        : 'Functions standard is symbolic; no figure is required.';
      break;
    case 'T':
      required = /\b(?:triangle|angle|unit circle|graph|sine|cosine|tangent|vector)\b/i.test(text);
      reason = required
        ? 'Trigonometry standard uses a triangle, angle, unit circle, or graph.'
        : 'Trigonometry standard is symbolic; no figure is required.';
      break;
    case 'C':
      required = /\b(?:graph|area|curve|limit|slope|derivative|integral)\b/i.test(text) && hasVisual;
      reason = required
        ? 'Calculus standard uses a graph or area model.'
        : 'Calculus standard is symbolic; no figure is required.';
      break;
    case 'LT':
      required = LOGIC_WORDS.test(text);
      reason = required
        ? 'Logic standard uses a Venn diagram, set diagram, or truth table.'
        : 'Logic standard is symbolic; no figure is required.';
      break;
    case 'FL':
      required = /\b(?:table|graph|budget|receipt|invoice)\b/i.test(text);
      reason = required
        ? 'Financial Literacy standard uses a table, graph, or financial document.'
        : 'Financial Literacy standard is text-based; no figure is required.';
      break;
    default:
      required = hasGeometry || hasVisual;
      reason = required
        ? 'Standard references a visual model or measured figure.'
        : hasExamples
          ? 'Official examples are text-based; no figure is required.'
          : 'No figure trigger found in the standard text or examples.';
      break;
  }

  const family = required ? familyFor(std, text) : 'none';
  const resolvedFamily = required && family === 'none' ? defaultFamilyForStrand(strandCode) : family;
  return {
    figureRequired: required,
    family: resolvedFamily,
    figureReason: reason,
    priority: priorityFor(strandCode, required),
  };
};

const META_LINE =
  /^(?:Subject Area:|Mathematics \(B\.E\.S\.T\.\)|Grade:|Strand:|Standard:|Date Adopted|Date of Last Rating:|Status:|This benchmark is part of)/i;

const isOptionLine = (line: string): boolean => /^(?:[a-eA-E][.)]|[-*•])\s+/.test(line);

const normalizeExampleLines = (lines: string[]): string[] =>
  lines.map(clean).filter((line) => line && !META_LINE.test(line));

const buildCandidate = (
  source: ExampleCandidate['source'],
  label: string,
  lines: string[],
): ExampleCandidate | null => {
  const cleaned = normalizeExampleLines(lines);
  if (!cleaned.length) return null;
  const stemParts: string[] = [];
  const options: string[] = [];
  for (const line of cleaned) {
    if (isOptionLine(line) || (stemParts.length > 0 && /^(?:\d|\(?\d+\s*[×x*])/i.test(line) && line.length < 60)) {
      options.push(line.replace(/^[a-eA-E][.)]\s*/, '').trim());
    } else if (options.length === 0) {
      stemParts.push(line);
    }
  }
  const stem = clean(stemParts.join(' '));
  if (!stem) return null;
  return { source, label, stem, options: options.slice(0, 8) };
};

const METADATA_LINE =
  /^(?:Subject Area|Mathematics|Grade|Strand|Standard|Date Adopted|Status|This benchmark|Benchmark)\b/i;

const normalizeForCompare = (text: string): string =>
  clean(text)
    .toLowerCase()
    .replace(/&[a-z]+;/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/**
 * Official-example arrays in the source data are sometimes polluted with
 * document metadata or the cluster heading repeated as an "item". Those lines
 * are not questions and must never win the fixture selection.
 */
const isHeadingOrMetadata = (std: StandardRecord, candidate: ExampleCandidate): boolean => {
  const raw = clean(candidate.stem);
  if (!raw || METADATA_LINE.test(raw)) return true;
  const stem = normalizeForCompare(raw);
  if (!stem) return true;
  const strand = normalizeForCompare(String(std.strand || ''));
  const cluster = normalizeForCompare(String(std.cluster || ''));
  if (cluster && stem === cluster) return true;
  if (strand && (stem === strand || stem.startsWith(`${strand} `))) return true;
  return false;
};

export const extractExampleCandidates = (std: StandardRecord): ExampleCandidate[] => {
  const out: ExampleCandidate[] = [];
  const items = std.instructional_items || [];
  let label = '';
  let lines: string[] = [];
  const flushItems = () => {
    if (!label) return;
    const candidate = buildCandidate('instructional_item', label, lines);
    if (candidate) out.push(candidate);
    label = '';
    lines = [];
  };
  for (const raw of items) {
    const line = clean(raw);
    const header = line.match(/^Instructional Item\s+(\d+)/i);
    if (header) {
      flushItems();
      label = `Instructional Item ${header[1]}`;
    } else if (label) {
      lines.push(line);
    }
  }
  flushItems();

  const tasks = std.instructional_tasks || [];
  label = '';
  lines = [];
  const flushTasks = () => {
    if (!label) return;
    const candidate = buildCandidate('instructional_task', label, lines);
    if (candidate) out.push(candidate);
    label = '';
    lines = [];
  };
  for (const raw of tasks) {
    const line = clean(raw);
    const header = line.match(/^Instructional Task\s+(\d+)/i);
    if (header) {
      flushTasks();
      label = `Instructional Task ${header[1]}`;
    } else if (label) {
      if (/^Part [A-Z][.)]/i.test(line)) continue;
      lines.push(line);
    }
  }
  flushTasks();

  for (const [index, clarification] of (std.clarifications || []).entries()) {
    const text = clean(clarification).replace(/^Clarification\s+\d+:\s*/i, '');
    if (text && VISUAL_WORDS.test(text)) {
      out.push({
        source: 'clarification',
        label: `Clarification ${index + 1}`,
        stem: text,
        options: [],
      });
    }
  }

  const filtered = out.filter((candidate) => !isHeadingOrMetadata(std, candidate));
  if (!filtered.length && std.description) {
    filtered.push({
      source: 'description',
      label: 'Standard description',
      stem: clean(std.description),
      options: [],
    });
  }
  return filtered;
};

const buildFixtureForCandidate = (
  std: StandardRecord,
  candidate: ExampleCandidate,
  classification: ReturnType<typeof classifyStandard>,
): StandardFixture => {
  const input = {
    kind: 'question' as const,
    grade: String(std.grade || ''),
    standardCode: std.code,
    text: candidate.stem,
    options: candidate.options,
    correctAnswerIndex: -1,
    visualSpec: null as VisualSpec | null,
    visualIntent: '',
    imagePrompt: '',
  };

  const scratch: {
    text: string;
    options: string[];
    correctAnswerIndex: number;
    visualSpec: VisualSpec | null;
    visualIntent?: string;
    imagePrompt?: string;
  } = {
    text: input.text,
    options: input.options,
    correctAnswerIndex: -1,
    visualSpec: null,
    visualIntent: '',
    imagePrompt: '',
  };

  try {
    applyQuestionVisualReconcilers(scratch);
  } catch {
    // A fixture that cannot be reconciled is still recorded; the matrix shows the gap.
  }

  const spec = normalizeVisualSpec(scratch.visualSpec);
  const svg = renderDeterministicVisualSvg(spec);
  const claim = buildItemClaim({ ...input, visualSpec: spec ?? null });
  const contract = buildFigureContract({ ...input, visualSpec: spec ?? null }, claim);
  const coverage = svg ? checkContractCoverage(contract, extractSvgText(svg)) : null;

  let status: FixtureStatus = 'not_attempted';
  if (!spec) status = 'no_spec';
  else if (!svg) status = 'no_svg';
  else if (coverage && coverage.pct === 100) status = 'pass';
  else status = 'missing_labels';

  return {
    standardCode: std.code,
    grade: String(std.grade || ''),
    strand: clean(std.strand),
    source: candidate.source,
    label: candidate.label,
    stem: candidate.stem,
    options: candidate.options,
    expected: {
      figureRequired: classification.figureRequired,
      family: classification.family,
      labels: contract.givenLabels,
      mustNotShow: contract.mustNotShow,
      altText: contract.altText,
      reason: classification.figureReason,
    },
    visualSpec: spec,
    render: {
      status,
      coveragePct: coverage?.pct ?? null,
      missing: coverage?.missing ?? [],
      leaks: coverage?.leaks ?? [],
      svgLength: svg?.length ?? 0,
    },
  };
};

export const buildStandardFixture = (
  std: StandardRecord,
  classification: ReturnType<typeof classifyStandard>,
): StandardFixture | null => {
  const candidates = extractExampleCandidates(std);
  if (!candidates.length) return null;

  const scored = candidates.map((candidate) => {
    const fixture = buildFixtureForCandidate(std, candidate, classification);
    const statusScore = fixture.render.status === 'pass' ? 0 : fixture.render.status === 'missing_labels' ? 1 : 2;
    const sourceScore = candidate.source === 'instructional_item' ? 0 : candidate.source === 'instructional_task' ? 1 : 2;
    return { fixture, score: statusScore * 10 + sourceScore };
  });
  scored.sort((a, b) => a.score - b.score);
  return scored[0]?.fixture ?? null;
};

export const buildMatrixRow = (
  std: StandardRecord,
  fixture: StandardFixture | null,
  fixturePath: string | null,
): StandardFigureRow => {
  const classification = classifyStandard(std);
  const { strandCode } = splitCode(std.code);
  const examples = extractExampleCandidates(std);
  const notes: string[] = [];
  if (classification.figureRequired && !fixture) {
    notes.push('No official-example fixture could be built.');
  }
  if (classification.figureRequired && fixture && fixture.render.status !== 'pass') {
    notes.push(`Fixture status: ${fixture.render.status}.`);
  }
  if (!classification.figureRequired && fixture && fixture.visualSpec) {
    notes.push('A visualSpec was inferred from an example even though the standard is marked not required.');
  }

  return {
    code: std.code,
    grade: String(std.grade || ''),
    gradeBand: gradeBandFor(splitCode(std.code).gradeBand),
    strandCode,
    strand: clean(std.strand),
    cluster: clean(std.cluster),
    description: clean(std.description),
    figureRequired: classification.figureRequired,
    family: classification.family,
    figureReason: classification.figureReason,
    priority: classification.priority,
    exampleCounts: {
      instructionalItems: (std.instructional_items || []).filter((line) => /^Instructional Item\s+\d+/i.test(clean(line))).length,
      instructionalTasks: (std.instructional_tasks || []).filter((line) => /^Instructional Task\s+\d+/i.test(clean(line))).length,
      clarifications: (std.clarifications || []).length,
    },
    fixturePath,
    fixtureSource: fixture ? `${fixture.source}: ${fixture.label}` : null,
    fixtureStatus: fixture?.render.status ?? 'not_attempted',
    expectedLabels: fixture?.expected.labels ?? [],
    coveragePct: fixture?.render.coveragePct ?? null,
    missingLabels: fixture?.render.missing ?? [],
    notes,
  };
};

export const writeMatrixReports = (
  rows: StandardFigureRow[],
  outDir: string,
): { jsonPath: string; mdPath: string } => {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, 'standards-matrix.json');
  const mdPath = path.join(outDir, 'standards-matrix.md');
  fs.writeFileSync(jsonPath, `${JSON.stringify(rows, null, 2)}\n`, 'utf8');

  const total = rows.length;
  const required = rows.filter((row) => row.figureRequired).length;
  const withFixture = rows.filter((row) => row.figureRequired && row.fixturePath).length;
  const passing = rows.filter((row) => row.figureRequired && row.fixtureStatus === 'pass').length;
  const byStrand = new Map<string, { total: number; required: number; fixtures: number; passing: number }>();
  for (const row of rows) {
    const key = row.strandCode || 'UNKNOWN';
    const entry = byStrand.get(key) || { total: 0, required: 0, fixtures: 0, passing: 0 };
    entry.total++;
    if (row.figureRequired) entry.required++;
    if (row.fixturePath) entry.fixtures++;
    if (row.fixtureStatus === 'pass') entry.passing++;
    byStrand.set(key, entry);
  }

  const lines: string[] = [];
  lines.push('# Standard Figure Matrix');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- Standards: **${total}**`);
  lines.push(`- Figure required: **${required}**`);
  lines.push(`- With an official-example fixture: **${withFixture}**`);
  lines.push(`- Fixtures passing contract coverage: **${passing}**`);
  lines.push('');
  lines.push('| Strand | Standards | Required | Fixtures | Passing |');
  lines.push('|---|---:|---:|---:|---:|');
  for (const [strand, entry] of [...byStrand.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    lines.push(`| ${strand} | ${entry.total} | ${entry.required} | ${entry.fixtures} | ${entry.passing} |`);
  }
  lines.push('');
  lines.push('## All standards');
  lines.push('');
  lines.push('| Code | Grade | Strand | Required | Family | Fixture | Status | Coverage | Reason |');
  lines.push('|---|---|---|---|---|---|---|---:|---|');
  for (const row of rows.slice().sort((a, b) => a.code.localeCompare(b.code))) {
    const fixture = row.fixturePath ? `[${row.fixtureSource || 'fixture'}](${row.fixturePath})` : '—';
    lines.push(
      `| ${row.code} | ${row.gradeBand} | ${row.strandCode} | ${row.figureRequired ? 'yes' : 'no'} | ${row.family} | ${fixture} | ${row.fixtureStatus} | ${row.coveragePct ?? '—'} | ${row.figureReason.replace(/\|/g, '\\|')} |`,
    );
  }
  lines.push('');
  fs.writeFileSync(mdPath, `${lines.join('\n')}\n`, 'utf8');
  return { jsonPath, mdPath };
};

export const writeFixture = (fixture: StandardFixture, outDir: string): string => {
  fs.mkdirSync(outDir, { recursive: true });
  const filePath = path.join(outDir, `${fixture.standardCode}.json`);
  fs.writeFileSync(filePath, `${JSON.stringify(fixture, null, 2)}\n`, 'utf8');
  return filePath;
};
