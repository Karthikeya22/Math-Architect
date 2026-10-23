/**
 * Phase 0 audit: summarize the official-example figure fixtures that the
 * matrix build produced. This is the first, offline audit report; the live
 * generated-question audit is scripts/audit-generated-figures.ts.
 *
 * Usage:
 *   npm run figures:audit:fixtures
 *
 * Outputs:
 *   reports/figure-coverage/fixture-audit.json
 *   reports/figure-coverage/fixture-audit.md
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const fixtureDir = path.join(root, 'tests', 'fixtures', 'figures', 'standards');
const outDir = path.join(root, 'reports', 'figure-coverage');

type Fixture = {
  standardCode: string;
  strand: string;
  source: string;
  label: string;
  stem: string;
  expected: { figureRequired: boolean; family: string; labels: string[] };
  render: { status: string; coveragePct: number | null; missing: string[]; leaks: string[]; svgLength: number };
};

const files = fs.existsSync(fixtureDir)
  ? fs.readdirSync(fixtureDir).filter((file) => file.endsWith('.json'))
  : [];
const fixtures: Fixture[] = files.map((file) => JSON.parse(fs.readFileSync(path.join(fixtureDir, file), 'utf8')) as Fixture);

const byStatus = new Map<string, number>();
const bySource = new Map<string, { total: number; pass: number; noSpec: number }>();
const byFamily = new Map<string, { total: number; pass: number }>();
const byStrand = new Map<string, { total: number; pass: number; noSpec: number }>();
for (const fixture of fixtures) {
  byStatus.set(fixture.render.status, (byStatus.get(fixture.render.status) || 0) + 1);
  const source = fixture.source || 'unknown';
  const sourceEntry = bySource.get(source) || { total: 0, pass: 0, noSpec: 0 };
  sourceEntry.total++;
  if (fixture.render.status === 'pass') sourceEntry.pass++;
  if (fixture.render.status === 'no_spec') sourceEntry.noSpec++;
  bySource.set(source, sourceEntry);
  const family = fixture.expected.family || 'unknown';
  const familyEntry = byFamily.get(family) || { total: 0, pass: 0 };
  familyEntry.total++;
  if (fixture.render.status === 'pass') familyEntry.pass++;
  byFamily.set(family, familyEntry);
  const strand = fixture.strand || 'Unknown';
  const strandEntry = byStrand.get(strand) || { total: 0, pass: 0, noSpec: 0 };
  strandEntry.total++;
  if (fixture.render.status === 'pass') strandEntry.pass++;
  if (fixture.render.status === 'no_spec') strandEntry.noSpec++;
  byStrand.set(strand, strandEntry);
}

const total = fixtures.length;
const pass = fixtures.filter((fixture) => fixture.render.status === 'pass').length;
const noSpec = fixtures.filter((fixture) => fixture.render.status === 'no_spec').length;
const dataLimited = fixtures.filter(
  (fixture) =>
    fixture.render.status === 'no_spec' &&
    (fixture.source === 'description' || fixture.source === 'clarification'),
).length;
const missingLabels = fixtures.filter((fixture) => fixture.render.status === 'missing_labels').length;
const leaks = fixtures.filter((fixture) => fixture.render.leaks.length > 0);

const json = {
  generatedAt: new Date().toISOString(),
  total,
  pass,
  noSpec,
  dataLimited,
  missingLabels,
  leaks: leaks.length,
  byStatus: Object.fromEntries([...byStatus.entries()].sort()),
  bySource: Object.fromEntries([...bySource.entries()].sort()),
  byFamily: Object.fromEntries([...byFamily.entries()].sort()),
  byStrand: Object.fromEntries([...byStrand.entries()].sort()),
  failing: fixtures
    .filter((fixture) => fixture.render.status !== 'pass')
    .map((fixture) => ({
      standardCode: fixture.standardCode,
      strand: fixture.strand,
      family: fixture.expected.family,
      source: `${fixture.source}: ${fixture.label}`,
      status: fixture.render.status,
      missing: fixture.render.missing,
      leaks: fixture.render.leaks,
      stem: fixture.stem.slice(0, 160),
    })),
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'fixture-audit.json'), `${JSON.stringify(json, null, 2)}\n`, 'utf8');

const lines: string[] = [];
lines.push('# Official-Example Figure Fixture Audit');
lines.push('');
lines.push(`Generated: ${json.generatedAt}`);
lines.push('');
lines.push('## Summary');
lines.push('');
lines.push(`- Fixtures: **${total}**`);
lines.push(`- Contract pass: **${pass}** (${total ? Math.round((pass / total) * 100) : 0}%)`);
lines.push(`- No visualSpec inferred: **${noSpec}**`);
lines.push(`  - of which data-limited (source is a standard description or clarification): **${dataLimited}**`);
lines.push(`- Missing labels: **${missingLabels}**`);
lines.push(`- Answer/label leaks: **${leaks.length}**`);
lines.push('');
if (noSpec > 0) {
  lines.push(
    '> `no_spec` means the official example contains no concrete model (specific shapes, numbers,');
  lines.push(
    '> points, or data values) for a deterministic renderer to build. It is a source-data gap, not a',
  );
  lines.push('> renderer failure; generated questions with concrete content are handled by the live reconcilers.');
  lines.push('');
}
lines.push('## By source');
lines.push('');
lines.push('| Source | Fixtures | Pass | No visualSpec |');
lines.push('|---|---:|---:|---:|');
for (const [source, entry] of [...bySource.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  lines.push(`| ${source} | ${entry.total} | ${entry.pass} | ${entry.noSpec} |`);
}
lines.push('');
lines.push('## By family');
lines.push('');
lines.push('| Family | Fixtures | Pass | Pass rate |');
lines.push('|---|---:|---:|---:|');
for (const [family, entry] of [...byFamily.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  lines.push(`| ${family} | ${entry.total} | ${entry.pass} | ${entry.total ? Math.round((entry.pass / entry.total) * 100) : 0}% |`);
}
lines.push('');
lines.push('## By strand');
lines.push('');
lines.push('| Strand | Fixtures | Pass | No visualSpec |');
lines.push('|---|---:|---:|---:|');
for (const [strand, entry] of [...byStrand.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  lines.push(`| ${strand} | ${entry.total} | ${entry.pass} | ${entry.noSpec} |`);
}
lines.push('');
lines.push('## First failing fixtures');
lines.push('');
lines.push('| Code | Family | Status | Missing | Stem |');
lines.push('|---|---|---|---|---|');
for (const row of json.failing.slice(0, 60)) {
  lines.push(
    `| ${row.standardCode} | ${row.family} | ${row.status} | ${row.missing.join(', ') || '—'} | ${row.stem.replace(/\|/g, '\\|')} |`,
  );
}
lines.push('');
fs.writeFileSync(path.join(outDir, 'fixture-audit.md'), `${lines.join('\n')}\n`, 'utf8');

console.log(`Fixtures: ${total}`);
console.log(`Pass: ${pass}`);
console.log(`No visualSpec: ${noSpec} (data-limited: ${dataLimited})`);
console.log(`Missing labels: ${missingLabels}`);
console.log(`Leaks: ${leaks.length}`);
console.log(`Report: ${path.join(outDir, 'fixture-audit.md')}`);
