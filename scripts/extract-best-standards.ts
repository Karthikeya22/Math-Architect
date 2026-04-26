import fs from 'node:fs/promises';
import path from 'node:path';
import { PDFParse } from 'pdf-parse';
import { FLORIDA_STANDARDS } from '../src/constants';
import { GradeLevel } from '../src/types';
import type { StandardsGraphDataset, StandardsGraphStandard } from '../src/types';

const BEST_PDF_URL =
  'https://cpalmsmediaprod.blob.core.windows.net/uploads/docs/standards/best/ma/mathbeststandardsfinal.pdf';

const GRADE_TOKEN_TO_LABEL: Record<string, GradeLevel> = {
  K: GradeLevel.K,
  '1': GradeLevel.G1,
  '2': GradeLevel.G2,
  '3': GradeLevel.G3,
  '4': GradeLevel.G4,
  '5': GradeLevel.G5,
  '6': GradeLevel.G6,
  '7': GradeLevel.G7,
  '8': GradeLevel.G8,
};

const STRAND_FALLBACK_TITLES: Record<string, string> = {
  NSO: 'Number Sense and Operations',
  AR: 'Algebraic Reasoning',
  FR: 'Fractions',
  M: 'Measurement',
  GR: 'Geometric Reasoning',
  DA: 'Data Analysis and Probability',
};

const STANDARD_CODE_REGEX = /MA\.(K|[1-8])\.[A-Z]{1,4}\.\d+\.\d+/g;

type ParsedCode = {
  gradeToken: string;
  gradeLabel: GradeLevel;
  strandCode: string;
  benchmark: string;
};

const parseCode = (code: string): ParsedCode | null => {
  const parts = code.split('.');
  if (parts.length < 5) return null;
  const gradeToken = parts[1];
  const gradeLabel = GRADE_TOKEN_TO_LABEL[gradeToken];
  if (!gradeLabel) return null;
  return {
    gradeToken,
    gradeLabel,
    strandCode: parts[2],
    benchmark: parts[3],
  };
};

const descriptionByCode = new Map(
  FLORIDA_STANDARDS.map((standard) => [standard.code, standard.description]),
);

const strandTitleByCode = new Map<string, string>();
for (const standard of FLORIDA_STANDARDS) {
  const parsed = parseCode(standard.code);
  if (!parsed || strandTitleByCode.has(parsed.strandCode)) continue;
  const fromDescription = standard.description.split(':')[0]?.trim();
  strandTitleByCode.set(
    parsed.strandCode,
    fromDescription || STRAND_FALLBACK_TITLES[parsed.strandCode] || parsed.strandCode,
  );
}

const sortStandardCodes = (a: string, b: string) => {
  const pa = a.split('.');
  const pb = b.split('.');
  const gradeA = pa[1] === 'K' ? 0 : Number(pa[1]);
  const gradeB = pb[1] === 'K' ? 0 : Number(pb[1]);
  if (gradeA !== gradeB) return gradeA - gradeB;
  if (pa[2] !== pb[2]) return pa[2].localeCompare(pb[2]);
  if (pa[3] !== pb[3]) return Number(pa[3]) - Number(pb[3]);
  return Number(pa[4]) - Number(pb[4]);
};

const gradeSort = (grade: GradeLevel) => {
  if (grade === 'Kindergarten') return 0;
  return Number(grade.replace('Grade ', ''));
};

async function extract(): Promise<void> {
  const response = await fetch(BEST_PDF_URL);
  if (!response.ok) {
    throw new Error(`Failed to download PDF: ${response.status} ${response.statusText}`);
  }

  const pdfBuffer = Buffer.from(await response.arrayBuffer());
  const parser = new PDFParse({ data: pdfBuffer });
  const textResult = await parser.getText();
  const foundCodes = textResult.text.match(STANDARD_CODE_REGEX) ?? [];
  await parser.destroy();
  const uniqueCodes = [...new Set(foundCodes)].sort(sortStandardCodes);

  const groupedByTopic = new Map<string, string[]>();
  const groupedByConcept = new Map<string, string[]>();
  const standards: StandardsGraphStandard[] = [];

  for (const code of uniqueCodes) {
    const parsed = parseCode(code);
    if (!parsed) continue;

    const strandTitle =
      strandTitleByCode.get(parsed.strandCode) ??
      STRAND_FALLBACK_TITLES[parsed.strandCode] ??
      parsed.strandCode;
    const topicId = `${parsed.gradeToken}-${parsed.strandCode}-${parsed.benchmark}`;
    const topicTitle = `${strandTitle} ${parsed.benchmark}`;
    const conceptKey = `${parsed.strandCode}-${parsed.benchmark}`;

    const standard: StandardsGraphStandard = {
      code,
      grade: parsed.gradeLabel,
      topicId,
      topicTitle,
      strandCode: parsed.strandCode,
      strandTitle,
      description:
        descriptionByCode.get(code) ??
        `${strandTitle}: Refer to B.E.S.T. standard ${code}.`,
      keywords: [parsed.strandCode, parsed.benchmark, parsed.gradeLabel],
      sequenceOrder: 0,
      relationships: {
        sequentialPrev: [],
        sequentialNext: [],
        crossGradeConceptLinks: [],
      },
    };

    standards.push(standard);
    groupedByTopic.set(topicId, [...(groupedByTopic.get(topicId) ?? []), code]);
    groupedByConcept.set(conceptKey, [...(groupedByConcept.get(conceptKey) ?? []), code]);
  }

  const standardsByCode = new Map(standards.map((standard) => [standard.code, standard]));

  for (const codes of groupedByTopic.values()) {
    const sorted = [...codes].sort(sortStandardCodes);
    for (let i = 0; i < sorted.length; i++) {
      const code = sorted[i];
      const standard = standardsByCode.get(code);
      if (!standard) continue;
      standard.sequenceOrder = i + 1;
      standard.relationships.sequentialPrev = i > 0 ? [sorted[i - 1]] : [];
      standard.relationships.sequentialNext = i < sorted.length - 1 ? [sorted[i + 1]] : [];
    }
  }

  for (const codes of groupedByConcept.values()) {
    const sorted = [...codes].sort(sortStandardCodes);
    for (let i = 0; i < sorted.length; i++) {
      const code = sorted[i];
      const standard = standardsByCode.get(code);
      if (!standard) continue;
      const links: string[] = [];
      if (i > 0) links.push(sorted[i - 1]);
      if (i < sorted.length - 1) links.push(sorted[i + 1]);
      standard.relationships.crossGradeConceptLinks = [...new Set(links)];
    }
  }

  const topics = [...groupedByTopic.keys()]
    .map((topicId) => {
      const [gradeToken, strandCode, benchmark] = topicId.split('-');
      const grade = GRADE_TOKEN_TO_LABEL[gradeToken];
      const strandTitle =
        strandTitleByCode.get(strandCode) ??
        STRAND_FALLBACK_TITLES[strandCode] ??
        strandCode;
      return {
        id: topicId,
        title: `${strandTitle} ${benchmark}`,
        grade,
        strandCode,
        strandTitle,
        keywords: [strandCode, benchmark, grade],
      };
    })
    .sort((a, b) => {
      const gradeComparison = gradeSort(a.grade) - gradeSort(b.grade);
      if (gradeComparison !== 0) return gradeComparison;
      if (a.strandCode !== b.strandCode) return a.strandCode.localeCompare(b.strandCode);
      return a.id.localeCompare(b.id);
    });

  const grades = [...new Set(standards.map((standard) => standard.grade))].sort(
    (a, b) => gradeSort(a) - gradeSort(b),
  );

  const dataset: StandardsGraphDataset = {
    metadata: {
      source: BEST_PDF_URL,
      generatedAt: new Date().toISOString(),
      totalStandards: standards.length,
      totalTopics: topics.length,
      grades,
    },
    topics,
    standards: standards.sort((a, b) => sortStandardCodes(a.code, b.code)),
  };

  const outPath = path.resolve(process.cwd(), 'src/data/best-standards-graph.json');
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, `${JSON.stringify(dataset, null, 2)}\n`, 'utf8');

  console.log(
    `Wrote ${dataset.metadata.totalStandards} standards across ${dataset.metadata.totalTopics} topics to ${outPath}`,
  );
}

extract().catch((error) => {
  console.error(error);
  process.exit(1);
});
