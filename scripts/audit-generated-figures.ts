/**
 * Audit already-generated quiz questions against their figure contracts.
 *
 * This is intentionally local-first: point it at a JSON dump of generated
 * questions and it will replay the same contract + coverage checks the live
 * pipeline uses. When no input is provided it writes an empty report so the
 * command is safe to run in CI.
 *
 * Usage:
 *   tsx scripts/audit-generated-figures.ts --input reports/figure-coverage/generated-input.json
 *   npm run figures:audit:generated
 *
 * Input shape: an array of questions or `{ questions: [...] }`, each with
 * { text, options, correctAnswerIndex, visualSpec, visual, generatedImageBase64,
 *   standardCode, grade, visualPath, figureStatus }.
 *
 * Outputs:
 *   reports/figure-coverage/generated-audit.json
 *   reports/figure-coverage/generated-audit.md
 */
import fs from 'node:fs';
import path from 'node:path';
import type { VisualSpec } from '../src/types.ts';
import { buildFigureContract, checkContractCoverage, extractSvgText } from '../src/server/figures/figureContract.ts';
import { buildItemClaim } from '../src/server/figures/itemClaim.ts';

type GeneratedQuestion = {
  text?: string;
  options?: string[];
  correctAnswerIndex?: number;
  visualSpec?: VisualSpec | null;
  visual?: string;
  generatedImageBase64?: string;
  standardCode?: string;
  grade?: string;
  visualPath?: string;
  figureStatus?: string;
};

const root = process.cwd();
const outDir = path.join(root, 'reports', 'figure-coverage');

const readInput = (): GeneratedQuestion[] => {
  const inputIndex = process.argv.indexOf('--input');
  const inputPath = inputIndex >= 0 ? process.argv[inputIndex + 1] : process.env.FIGURE_AUDIT_INPUT;
  const fallback = path.join(outDir, 'generated-input.json');
  const file = inputPath || (fs.existsSync(fallback) ? fallback : '');
  if (!file || !fs.existsSync(file)) return [];
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (Array.isArray(raw)) return raw as GeneratedQuestion[];
  if (Array.isArray(raw?.questions)) return raw.questions as GeneratedQuestion[];
  return [];
};

const questions = readInput();

type AuditRow = {
  standardCode: string;
  grade: string;
  visualPath: string;
  figureStatus: string;
  required: boolean;
  family: string;
  coveragePct: number;
  missing: string[];
  leaks: string[];
  verdict: 'pass' | 'needs_review' | 'no_figure_needed';
  stem: string;
};

const rows: AuditRow[] = questions.map((question) => {
  const input = {
    kind: 'question' as const,
    grade: String(question.grade || ''),
    standardCode: question.standardCode,
    text: String(question.text || ''),
    options: Array.isArray(question.options) ? question.options.map(String) : [],
    correctAnswerIndex: Number.isInteger(question.correctAnswerIndex) ? Number(question.correctAnswerIndex) : -1,
    visualIntent: '',
    imagePrompt: '',
    visualSpec: question.visualSpec ?? null,
  };
  const claim = buildItemClaim(input);
  const contract = buildFigureContract(input, claim);
  const hasSvg = typeof question.visual === 'string' && /<svg[\s>]/i.test(question.visual);
  const coverage = hasSvg
    ? checkContractCoverage(contract, extractSvgText(question.visual || ''))
    : { required: contract.givenLabels, present: [], missing: contract.givenLabels, leaks: [], pct: 0 };
  const verdict: AuditRow['verdict'] = !contract.required
    ? 'no_figure_needed'
    : coverage.pct === 100 && !coverage.leaks?.length
      ? 'pass'
      : 'needs_review';
  return {
    standardCode: contract.required ? question.standardCode || 'UNKNOWN' : 'UNKNOWN',
    grade: String(question.grade || ''),
    visualPath: String(question.visualPath || (hasSvg ? 'legacy_svg' : 'no_visual')),
    figureStatus: String(question.figureStatus || 'unknown'),
    required: contract.required,
    family: contract.family,
    coveragePct: coverage.pct,
    missing: coverage.missing,
    leaks: coverage.leaks || [],
    verdict,
    stem: String(question.text || '').slice(0, 140),
  };
});

const byStandard = new Map<string, { total: number; pass: number; review: number }>();
const byStrand = new Map<string, { total: number; pass: number; review: number }>();
for (const row of rows) {
  const key = row.standardCode;
  const entry = byStandard.get(key) || { total: 0, pass: 0, review: 0 };
  entry.total++;
  if (row.verdict === 'pass') entry.pass++;
  if (row.verdict === 'needs_review') entry.review++;
  byStandard.set(key, entry);

  const strand = key.split('.')[2] || 'UNKNOWN';
  const strandEntry = byStrand.get(strand) || { total: 0, pass: 0, review: 0 };
  strandEntry.total++;
  if (row.verdict === 'pass') strandEntry.pass++;
  if (row.verdict === 'needs_review') strandEntry.review++;
  byStrand.set(strand, strandEntry);
}

const summary = {
  generatedAt: new Date().toISOString(),
  inputQuestions: questions.length,
  audited: rows.length,
  pass: rows.filter((row) => row.verdict === 'pass').length,
  needsReview: rows.filter((row) => row.verdict === 'needs_review').length,
  noFigureNeeded: rows.filter((row) => row.verdict === 'no_figure_needed').length,
  byStrand: Object.fromEntries([...byStrand.entries()].sort()),
  byStandard: Object.fromEntries([...byStandard.entries()].sort()),
  rows,
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'generated-audit.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');

const lines: string[] = [];
lines.push('# Generated-Question Figure Audit');
lines.push('');
lines.push(`Generated: ${summary.generatedAt}`);
lines.push('');
if (!rows.length) {
  lines.push('No generated-question input was found.');
  lines.push('');
  lines.push('Provide one with `--input <path>` or `FIGURE_AUDIT_INPUT`, or place a dump at');
  lines.push('`reports/figure-coverage/generated-input.json`.');
} else {
  lines.push('## Summary');
  lines.push('');
  lines.push(`- Audited questions: **${summary.audited}**`);
  lines.push(`- Figure contract pass: **${summary.pass}**`);
  lines.push(`- Needs review: **${summary.needsReview}**`);
  lines.push(`- No figure needed: **${summary.noFigureNeeded}**`);
  lines.push('');
  lines.push('## By strand');
  lines.push('');
  lines.push('| Strand | Questions | Pass | Needs review |');
  lines.push('|---|---:|---:|---:|');
  for (const [strand, entry] of [...byStrand.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    lines.push(`| ${strand} | ${entry.total} | ${entry.pass} | ${entry.review} |`);
  }
  lines.push('');
  lines.push('## Needs review');
  lines.push('');
  lines.push('| Code | Family | Coverage | Missing | Stem |');
  lines.push('|---|---|---:|---|---|');
  for (const row of rows.filter((entry) => entry.verdict === 'needs_review').slice(0, 100)) {
    lines.push(
      `| ${row.standardCode} | ${row.family} | ${row.coveragePct} | ${row.missing.join(', ') || '—'} | ${row.stem.replace(/\|/g, '\\|')} |`,
    );
  }
}
lines.push('');
fs.writeFileSync(path.join(outDir, 'generated-audit.md'), `${lines.join('\n')}\n`, 'utf8');

console.log(`Audited: ${summary.audited}`);
console.log(`Pass: ${summary.pass}`);
console.log(`Needs review: ${summary.needsReview}`);
console.log(`Report: ${path.join(outDir, 'generated-audit.md')}`);
