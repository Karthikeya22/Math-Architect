import type {
  StandardsGraphDataset,
  StandardsGraphFilterOptions,
  StandardsGraphFilters,
  StandardsGraphLinkView,
  StandardsGraphNodeView,
  StandardsGraphStandard,
  StandardsGraphViewModel,
} from '../types';

const addUniqueLink = (
  links: StandardsGraphLinkView[],
  seen: Set<string>,
  link: StandardsGraphLinkView,
) => {
  const key = `${link.kind}:${link.source}->${link.target}`;
  if (!seen.has(key)) {
    links.push(link);
    seen.add(key);
  }
};

const includesText = (value: string, query: string) =>
  value.toLowerCase().includes(query.toLowerCase());

export function deriveFilterOptions(
  dataset: StandardsGraphDataset,
): StandardsGraphFilterOptions {
  const grades = [...dataset.metadata.grades].sort();
  const strandMap = new Map<string, string>();

  for (const topic of dataset.topics) {
    if (!strandMap.has(topic.strandCode)) {
      strandMap.set(topic.strandCode, topic.strandTitle);
    }
  }

  const strands = [...strandMap.entries()]
    .map(([code, title]) => ({ code, title }))
    .sort((a, b) => a.code.localeCompare(b.code));

  const topics = [...dataset.topics].sort((a, b) => {
    const gradeCompare = a.grade.localeCompare(b.grade);
    if (gradeCompare !== 0) return gradeCompare;
    return a.title.localeCompare(b.title);
  });

  return { grades, strands, topics };
}

const matchesFilters = (
  standard: StandardsGraphStandard,
  filters: StandardsGraphFilters,
) => {
  if (filters.grade !== 'all' && standard.grade !== filters.grade) {
    return false;
  }
  if (filters.strandCode !== 'all' && standard.strandCode !== filters.strandCode) {
    return false;
  }
  if (filters.topicId !== 'all' && standard.topicId !== filters.topicId) {
    return false;
  }
  if (filters.searchText.trim()) {
    const query = filters.searchText.trim();
    const searchable = [
      standard.code,
      standard.description,
      standard.topicTitle,
      standard.strandTitle,
      ...standard.keywords,
    ].join(' ');
    if (!includesText(searchable, query)) {
      return false;
    }
  }
  return true;
};

export function buildGraphViewModel(
  dataset: StandardsGraphDataset,
  filters: StandardsGraphFilters,
): StandardsGraphViewModel {
  const standards = dataset.standards.filter((standard) =>
    matchesFilters(standard, filters),
  );
  const standardCodeSet = new Set(standards.map((standard) => standard.code));
  const topicsById = new Map(dataset.topics.map((topic) => [topic.id, topic]));
  const nodes: StandardsGraphNodeView[] = [];
  const links: StandardsGraphLinkView[] = [];
  const seenLinks = new Set<string>();
  const usedTopics = new Set<string>();

  if (filters.includeStandardNodes) {
    for (const standard of standards) {
      nodes.push({
        id: standard.code,
        kind: 'standard',
        label: standard.code,
        grade: standard.grade,
        strandCode: standard.strandCode,
        topicId: standard.topicId,
        standardCode: standard.code,
        description: standard.description,
        value: 10,
        category: `${standard.grade}:${standard.strandCode}`,
      });
      usedTopics.add(standard.topicId);
    }
  }

  if (filters.includeTopicNodes) {
    for (const topicId of usedTopics) {
      const topic = topicsById.get(topicId);
      if (!topic) continue;
      nodes.push({
        id: topic.id,
        kind: 'topic',
        label: topic.title,
        grade: topic.grade,
        strandCode: topic.strandCode,
        topicId: topic.id,
        value: 18,
        category: `topic:${topic.strandCode}`,
      });
    }
  }

  for (const standard of standards) {
    if (filters.includeTopicNodes && filters.includeStandardNodes) {
      addUniqueLink(links, seenLinks, {
        source: standard.topicId,
        target: standard.code,
        kind: 'topic-membership',
      });
    }

    const shouldIncludeSequential =
      filters.relationMode === 'sequential' || filters.relationMode === 'hybrid';
    if (shouldIncludeSequential) {
      for (const nextCode of standard.relationships.sequentialNext) {
        if (standardCodeSet.has(nextCode)) {
          addUniqueLink(links, seenLinks, {
            source: standard.code,
            target: nextCode,
            kind: 'sequential',
          });
        }
      }
    }

    const shouldIncludeCrossGrade =
      filters.relationMode === 'cross-grade' || filters.relationMode === 'hybrid';
    if (shouldIncludeCrossGrade) {
      for (const targetCode of standard.relationships.crossGradeConceptLinks) {
        if (standardCodeSet.has(targetCode)) {
          addUniqueLink(links, seenLinks, {
            source: standard.code,
            target: targetCode,
            kind: 'cross-grade',
          });
        }
      }
    }
  }

  return { nodes, links };
}
