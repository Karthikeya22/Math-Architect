import { GradeLevel, Standard, StandardsGraphDataset, StandardsGraphStandard, StandardsGraphTopic } from '../types';
import { HS_STRAND_FALLBACK_TITLES } from '../constants/hsStrandTitles';
import { parseStandardCodeMeta } from './parseStandardCode';

const toFamilyCode = (benchmarkCode: string): string => {
  const parts = benchmarkCode.split('.').filter(Boolean);
  if (parts.length < 5) return benchmarkCode;
  return parts.slice(0, 4).join('.');
};

/**
 * Build a K-8-shaped StandardsGraphDataset for high school (MA.912.*) rows from /api/standards.
 * One **strand** topic per strand (e.g. all AR benchmarks share one topic) so the graph overview
 * stays readable; families still split by MA.912.{strand}.{big idea} clusters.
 */
export function buildHsStandardsGraphDataset(
  standards: Standard[],
  strandTitleByCode: Record<string, string>,
): StandardsGraphDataset {
  const hsRows = standards.filter((row) => {
    const meta = parseStandardCodeMeta(row.code);
    return meta.gradeToken === '912' || String(row.grade).trim() === '912';
  });

  const topicMap = new Map<string, StandardsGraphTopic>();
  const graphStandards: StandardsGraphStandard[] = [];
  let seq = 0;

  for (const row of hsRows) {
    const meta = parseStandardCodeMeta(row.code);
    const strand = meta.strandCode;
    if (!strand) continue;

    const familyCode = toFamilyCode(row.code);
    const parts = familyCode.split('.').filter(Boolean);
    const bigIdea = parts[3] ?? '';
    const topicId = `912-${strand}`;
    const strandTitle =
      strandTitleByCode[strand] || HS_STRAND_FALLBACK_TITLES[strand] || strand;

    if (!topicMap.has(topicId)) {
      topicMap.set(topicId, {
        id: topicId,
        title: strandTitle,
        grade: GradeLevel.G912,
        strandCode: strand,
        strandTitle,
        keywords: [strand, '912'],
      });
    }

    graphStandards.push({
      code: row.code,
      grade: GradeLevel.G912,
      topicId,
      topicTitle: strandTitle,
      strandCode: strand,
      strandTitle,
      description: row.description,
      keywords: [strand, bigIdea],
      sequenceOrder: seq++,
      relationships: {
        sequentialPrev: [],
        sequentialNext: [],
        crossGradeConceptLinks: [],
      },
    });
  }

  const topics = [...topicMap.values()].sort((a, b) => {
    if (a.strandCode !== b.strandCode) return a.strandCode.localeCompare(b.strandCode);
    return a.title.localeCompare(b.title);
  });

  graphStandards.sort((a, b) => a.code.localeCompare(b.code));

  return {
    metadata: {
      source: 'synthetic-high-school-912',
      generatedAt: new Date().toISOString(),
      totalStandards: graphStandards.length,
      totalTopics: topics.length,
      grades: [GradeLevel.G912],
    },
    topics,
    standards: graphStandards,
  };
}
