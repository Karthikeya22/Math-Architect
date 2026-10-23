/**
 * Phase 0: classify every B.E.S.T. math standard for figure needs and write
 * the standard figure matrix.
 *
 * Usage:
 *   npm run figures:matrix
 *
 * Outputs:
 *   reports/figure-coverage/standards-matrix.json
 *   reports/figure-coverage/standards-matrix.md
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  buildMatrixRow,
  buildStandardFixture,
  classifyStandard,
  writeMatrixReports,
  type StandardFixture,
  type StandardFigureRow,
  type StandardRecord,
} from './lib/standardFigureMatrix.ts';

const root = process.cwd();
const standardsPath = path.join(root, 'data', 'processed', 'standards.json');
const outDir = path.join(root, 'reports', 'figure-coverage');

const standards = JSON.parse(fs.readFileSync(standardsPath, 'utf8')) as StandardRecord[];
if (!Array.isArray(standards) || !standards.length) {
  throw new Error(`No standards found at ${standardsPath}`);
}

const rows: StandardFigureRow[] = [];
const fixtures: StandardFixture[] = [];
for (const standard of standards) {
  if (!standard?.code) continue;
  const classification = classifyStandard(standard);
  const fixture = classification.figureRequired ? buildStandardFixture(standard, classification) : null;
  if (fixture) fixtures.push(fixture);
  // Matrix links are filled by the fixture build script. Classification still
  // records render status so gaps are visible before any files are written.
  rows.push(buildMatrixRow(standard, fixture, null));
}

const { jsonPath, mdPath } = writeMatrixReports(rows, outDir);
const required = rows.filter((row) => row.figureRequired);
const withFixture = required.filter((row) => row.fixtureStatus !== 'not_attempted');
const passing = required.filter((row) => row.fixtureStatus === 'pass');

console.log(`Standards: ${rows.length}`);
console.log(`Figure required: ${required.length}`);
console.log(`Official-example fixture built: ${withFixture.length}`);
console.log(`Fixture contract pass: ${passing.length}`);
console.log(`Matrix: ${jsonPath}`);
console.log(`Matrix: ${mdPath}`);
if (!required.length) process.exitCode = 1;
