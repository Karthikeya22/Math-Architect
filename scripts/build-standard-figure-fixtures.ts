/**
 * Phase 0: build official-example figure fixtures for every standard that needs
 * a figure, then write the fixture paths back into the standards matrix.
 *
 * Usage:
 *   npm run figures:fixtures
 *
 * Outputs:
 *   tests/fixtures/figures/standards/<code>.json
 *   reports/figure-coverage/standards-matrix.json
 *   reports/figure-coverage/standards-matrix.md
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  buildMatrixRow,
  buildStandardFixture,
  classifyStandard,
  writeFixture,
  writeMatrixReports,
  type StandardFixture,
  type StandardFigureRow,
  type StandardRecord,
} from './lib/standardFigureMatrix.ts';

const root = process.cwd();
const standardsPath = path.join(root, 'data', 'processed', 'standards.json');
const reportDir = path.join(root, 'reports', 'figure-coverage');
const fixtureDir = path.join(root, 'tests', 'fixtures', 'figures', 'standards');

const standards = JSON.parse(fs.readFileSync(standardsPath, 'utf8')) as StandardRecord[];
if (!Array.isArray(standards) || !standards.length) {
  throw new Error(`No standards found at ${standardsPath}`);
}

const rows: StandardFigureRow[] = [];
const fixtures: StandardFixture[] = [];
let written = 0;
for (const standard of standards) {
  if (!standard?.code) continue;
  const classification = classifyStandard(standard);
  const fixture = classification.figureRequired ? buildStandardFixture(standard, classification) : null;
  let fixturePath: string | null = null;
  if (fixture) {
    const absolute = writeFixture(fixture, fixtureDir);
    fixturePath = path.relative(root, absolute).replace(/\\/g, '/');
    fixtures.push(fixture);
    written++;
  }
  rows.push(buildMatrixRow(standard, fixture, fixturePath));
}

const { jsonPath, mdPath } = writeMatrixReports(rows, reportDir);
const required = rows.filter((row) => row.figureRequired);
const withFixture = required.filter((row) => row.fixturePath);
const passing = required.filter((row) => row.fixtureStatus === 'pass');
const failing = required.filter((row) => row.fixturePath && row.fixtureStatus !== 'pass');

console.log(`Standards: ${rows.length}`);
console.log(`Figure required: ${required.length}`);
console.log(`Fixtures written: ${written}`);
console.log(`Fixture contract pass: ${passing.length}`);
console.log(`Fixture contract fail: ${failing.length}`);
console.log(`Fixtures: ${fixtureDir}`);
console.log(`Matrix: ${jsonPath}`);
console.log(`Matrix: ${mdPath}`);
if (failing.length) {
  console.log('\nFirst failing fixtures:');
  for (const row of failing.slice(0, 15)) {
    console.log(`- ${row.code} [${row.fixtureStatus}] ${row.missingLabels.join(', ') || row.notes.join('; ')}`);
  }
}
