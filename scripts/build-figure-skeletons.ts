/**
 * Build the per-standard figure skeleton catalog across all 642 standards.
 *
 * Reads the figure matrix (standards-matrix.json) and maps every standard's
 * family to the deterministic skeleton that best matches it, plus the fallback
 * policy when a generated question cannot be instantiated from that skeleton.
 *
 * Outputs:
 *   reports/figure-coverage/figure-skeletons.json
 *   reports/figure-coverage/figure-skeletons.md
 *
 * Usage: npm run figures:skeletons
 */
import fs from 'node:fs';
import path from 'node:path';
import type { FigureFamily } from '../src/server/figures/figureContract.ts';
import {
  allSkeletons,
  skeletonForStandard,
  type FigureSkeleton,
} from '../src/server/figures/skeletons/catalog.ts';

type MatrixRow = {
  code: string;
  grade: string;
  strandCode: string;
  strand: string;
  figureRequired: boolean;
  priority: string;
  family: FigureFamily;
};

type CatalogEntry = {
  code: string;
  grade: string;
  strandCode: string;
  strand: string;
  figureRequired: boolean;
  priority: string;
  family: FigureFamily;
  skeletonId: string;
  skeletonLabel: string;
  visualType: FigureSkeleton['visualType'];
  fallback: FigureSkeleton['fallback'];
  matchHint: string;
  promptGuide: string;
};

const root = process.cwd();
const outDir = path.join(root, 'reports', 'figure-coverage');
const matrixPath = path.join(outDir, 'standards-matrix.json');

const rows: MatrixRow[] = JSON.parse(fs.readFileSync(matrixPath, 'utf8'));

const entries: CatalogEntry[] = rows.map((row) => {
  const skeleton = skeletonForStandard(row.code, row.family);
  return {
    code: row.code,
    grade: row.grade,
    strandCode: row.strandCode,
    strand: row.strand,
    figureRequired: row.figureRequired,
    priority: row.priority,
    family: row.family,
    skeletonId: skeleton.id,
    skeletonLabel: skeleton.label,
    visualType: skeleton.visualType,
    fallback: skeleton.fallback,
    matchHint: skeleton.matchHint,
    promptGuide: skeleton.promptGuide,
  };
});

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, 'figure-skeletons.json'),
  `${JSON.stringify(entries, null, 2)}\n`,
  'utf8',
);

const bySkeleton = new Map<string, CatalogEntry[]>();
for (const entry of entries) {
  bySkeleton.set(entry.skeletonId, [...(bySkeleton.get(entry.skeletonId) ?? []), entry]);
}

const required = entries.filter((entry) => entry.figureRequired);
const none = entries.filter((entry) => entry.fallback === 'none');
const requiredDeterministic = required.filter((entry) => entry.fallback === 'deterministic').length;
const requiredAiPrompt = required.filter((entry) => entry.fallback === 'ai_prompt').length;

const lines: string[] = [];
lines.push('# Figure Skeleton Catalog');
lines.push('');
lines.push(
  `${entries.length} standards. ${required.length} require a figure, ${entries.length - required.length} do not.`,
);
lines.push(
  `Primary skeletons: ${requiredDeterministic} deterministic, ${requiredAiPrompt} AI prompt, ${none.length} no figure.`,
);
lines.push('');
lines.push(
  'Runtime fallback: when a generated question cannot be instantiated from its deterministic skeleton (`visualClass === "none"`), `generateFigure` draws the figure directly from the question via prompt generation. Publication still requires the verifier, contract coverage, and LC accuracy check, so an incomplete or off-topic image becomes `needs_review` (text-only + teacher flag) instead of shipping.',
);
lines.push('');
lines.push('| Skeleton | Family | Visual type | Fallback | Required | Total |');
lines.push('| --- | --- | --- | --- | --- | --- |');
for (const skeleton of allSkeletons()) {
  const group = bySkeleton.get(skeleton.id) ?? [];
  if (!group.length) continue;
  lines.push(
    `| ${skeleton.id} | ${skeleton.family} | ${skeleton.visualType ?? '—'} | ${skeleton.fallback} | ${group.filter((e) => e.figureRequired).length} | ${group.length} |`,
  );
}
lines.push('');
for (const skeleton of allSkeletons()) {
  const group = bySkeleton.get(skeleton.id) ?? [];
  if (!group.length) continue;
  lines.push(`## ${skeleton.id} — ${skeleton.label}`);
  lines.push('');
  lines.push(`- Family: \`${skeleton.family}\` | visualType: \`${skeleton.visualType ?? '—'}\` | fallback: \`${skeleton.fallback}\``);
  lines.push(`- Match: ${skeleton.matchHint}`);
  if (skeleton.promptGuide) lines.push(`- Prompt fallback: ${skeleton.promptGuide}`);
  lines.push(`- Standards (${group.length}): ${group.map((e) => e.code).join(', ')}`);
  lines.push('');
}

fs.writeFileSync(path.join(outDir, 'figure-skeletons.md'), `${lines.join('\n')}\n`, 'utf8');

console.log(`Skeletons: ${outDir}\\figure-skeletons.json`);
console.log(`Skeletons: ${outDir}\\figure-skeletons.md`);
console.log(`Standards: ${entries.length} | required ${required.length} | deterministic ${requiredDeterministic} | ai_prompt ${requiredAiPrompt} | none ${none.length}`);
