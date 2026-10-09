import {
  GradeLevel,
  type StandardsGraphDataset,
  type StandardsTreeDataset,
  type StandardsTreeGradeView,
  type StandardsTreeNode,
  type StandardsTreeNodeDetails,
} from '../types';

type HorizontalAdjacencyInput = Record<string, string[]>;

const compareCodes = (left: string, right: string) => {
  const leftParts = left.split('.');
  const rightParts = right.split('.');
  const maxLen = Math.max(leftParts.length, rightParts.length);
  for (let i = 0; i < maxLen; i++) {
    const a = leftParts[i] ?? '';
    const b = rightParts[i] ?? '';
    const aNum = Number(a);
    const bNum = Number(b);
    if (Number.isFinite(aNum) && Number.isFinite(bNum)) {
      if (aNum !== bNum) return aNum - bNum;
    } else if (a !== b) {
      return a.localeCompare(b);
    }
  }
  return 0;
};

const gradeOrder: GradeLevel[] = [
  GradeLevel.K,
  GradeLevel.G1,
  GradeLevel.G2,
  GradeLevel.G3,
  GradeLevel.G4,
  GradeLevel.G5,
  GradeLevel.G6,
  GradeLevel.G7,
  GradeLevel.G8,
  GradeLevel.G912,
];

const toFamilyCode = (benchmarkCode: string): string => {
  const parts = benchmarkCode.split('.');
  if (parts.length < 5) return benchmarkCode;
  return parts.slice(0, 4).join('.');
};

const toTopicNodeId = (topicId: string) => `topic:${topicId}`;
const toFamilyNodeId = (familyCode: string) => `family:${familyCode}`;
const toBenchmarkNodeId = (benchmarkCode: string) => `benchmark:${benchmarkCode}`;

const parseBenchmarkCodeFromNodeId = (nodeId: string) =>
  nodeId.startsWith('benchmark:') ? nodeId.slice('benchmark:'.length) : null;

const addChild = (node: StandardsTreeNode, childId: string) => {
  if (!node.childrenIds.includes(childId)) {
    node.childrenIds.push(childId);
  }
};

const toRecord = (nodesById: Map<string, StandardsTreeNode>) => {
  const out: Record<string, StandardsTreeNode> = {};
  for (const [id, node] of nodesById) out[id] = node;
  return out;
};

export function buildStandardsTreeDataset(
  dataset: StandardsGraphDataset,
  externalHorizontalAdjacency?: HorizontalAdjacencyInput,
): StandardsTreeDataset {
  const topicsById = new Map(dataset.topics.map((topic) => [topic.id, topic]));
  const benchmarkByCode = new Map(dataset.standards.map((item) => [item.code, item]));
  const horizontalAdjacency = new Map<string, Set<string>>();

  const gradesView = new Map<GradeLevel, StandardsTreeGradeView>();
  const grades = [...new Set(dataset.metadata.grades as GradeLevel[])].sort(
    (a, b) => gradeOrder.indexOf(a) - gradeOrder.indexOf(b),
  );

  for (const grade of grades) {
    gradesView.set(grade, {
      grade,
      rootNodeIds: [],
      nodesById: {},
    });
  }

  for (const standard of dataset.standards) {
    const gradeView = gradesView.get(standard.grade);
    if (!gradeView) continue;

    const nodesById = new Map(Object.entries(gradeView.nodesById));
    const topic = topicsById.get(standard.topicId);
    if (!topic) continue;

    const topicNodeId = toTopicNodeId(topic.id);
    const familyCode = toFamilyCode(standard.code);
    const familyNodeId = toFamilyNodeId(familyCode);
    const benchmarkNodeId = toBenchmarkNodeId(standard.code);

    if (!nodesById.has(topicNodeId)) {
      nodesById.set(topicNodeId, {
        id: topicNodeId,
        code: topic.strandCode,
        label: `${topic.strandCode} - ${topic.title}`,
        kind: 'topic',
        grade: topic.grade,
        strandCode: topic.strandCode,
        strandTitle: topic.strandTitle,
        topicId: topic.id,
        topicTitle: topic.title,
        parentId: null,
        childrenIds: [],
        keywords: topic.keywords,
        counts: {
          familyCount: 0,
          benchmarkCount: 0,
        },
      });
      gradeView.rootNodeIds.push(topicNodeId);
    }

    if (!nodesById.has(familyNodeId)) {
      nodesById.set(familyNodeId, {
        id: familyNodeId,
        code: familyCode,
        label: familyCode,
        kind: 'family',
        grade: standard.grade,
        strandCode: topic.strandCode,
        strandTitle: topic.strandTitle,
        topicId: topic.id,
        topicTitle: topic.title,
        parentId: topicNodeId,
        childrenIds: [],
        description: standard.topicTitle,
        counts: {
          childCount: 0,
          horizontalLinkCount: 0,
        },
      });
      const topicNode = nodesById.get(topicNodeId)!;
      addChild(topicNode, familyNodeId);
      topicNode.counts.familyCount = topicNode.childrenIds.length;
    }

    if (!nodesById.has(benchmarkNodeId)) {
      nodesById.set(benchmarkNodeId, {
        id: benchmarkNodeId,
        code: standard.code,
        label: `${standard.code} ${standard.description}`,
        kind: 'benchmark',
        grade: standard.grade,
        strandCode: standard.strandCode,
        strandTitle: standard.strandTitle,
        topicId: standard.topicId,
        topicTitle: standard.topicTitle,
        parentId: familyNodeId,
        childrenIds: [],
        description: standard.description,
        keywords: standard.keywords,
        counts: {
          horizontalLinkCount: 0,
        },
      });
      const familyNode = nodesById.get(familyNodeId)!;
      addChild(familyNode, benchmarkNodeId);
      familyNode.counts.childCount = familyNode.childrenIds.length;
    }

    for (const linkCode of standard.relationships.crossGradeConceptLinks || []) {
      if (!benchmarkByCode.has(linkCode) || linkCode === standard.code) continue;
      const sourceSet = horizontalAdjacency.get(standard.code) ?? new Set<string>();
      sourceSet.add(linkCode);
      horizontalAdjacency.set(standard.code, sourceSet);
      const reverseSet = horizontalAdjacency.get(linkCode) ?? new Set<string>();
      reverseSet.add(standard.code);
      horizontalAdjacency.set(linkCode, reverseSet);
    }

    gradeView.nodesById = toRecord(nodesById);
  }

  // Final sorting and count hydration.
  for (const gradeView of gradesView.values()) {
    const nodesById = new Map(Object.entries(gradeView.nodesById));
    for (const node of nodesById.values()) {
      node.childrenIds.sort((a, b) => {
        const aNode = nodesById.get(a);
        const bNode = nodesById.get(b);
        if (!aNode || !bNode) return a.localeCompare(b);
        if (aNode.kind !== bNode.kind) {
          const order = ['topic', 'family', 'benchmark'];
          return order.indexOf(aNode.kind) - order.indexOf(bNode.kind);
        }
        return compareCodes(aNode.code, bNode.code);
      });
      if (node.kind === 'topic') {
        const benchmarkCount = node.childrenIds.reduce((sum, familyId) => {
          const family = nodesById.get(familyId);
          return sum + (family?.childrenIds.length ?? 0);
        }, 0);
        node.counts.familyCount = node.childrenIds.length;
        node.counts.benchmarkCount = benchmarkCount;
      }
      if (node.kind === 'benchmark') {
        node.counts.horizontalLinkCount = horizontalAdjacency.get(node.code)?.size ?? 0;
      }
      if (node.kind === 'family') {
        const horizontalCount = node.childrenIds.reduce((sum, benchmarkId) => {
          const benchmark = nodesById.get(benchmarkId);
          if (!benchmark) return sum;
          return sum + (horizontalAdjacency.get(benchmark.code)?.size ?? 0);
        }, 0);
        node.counts.horizontalLinkCount = horizontalCount;
      }
    }
    gradeView.rootNodeIds.sort((a, b) => {
      const left = nodesById.get(a);
      const right = nodesById.get(b);
      if (!left || !right) return a.localeCompare(b);
      if (left.strandCode !== right.strandCode) {
        return left.strandCode.localeCompare(right.strandCode);
      }
      return left.topicTitle.localeCompare(right.topicTitle);
    });
    gradeView.nodesById = toRecord(nodesById);
  }

  const adjacencyRecord: Record<string, string[]> = {};
  for (const [code, neighbors] of horizontalAdjacency.entries()) {
    adjacencyRecord[code] = [...neighbors].sort(compareCodes);
  }

  if (externalHorizontalAdjacency && Object.keys(externalHorizontalAdjacency).length > 0) {
    const externalRecord: Record<string, string[]> = {};
    for (const [source, targets] of Object.entries(externalHorizontalAdjacency)) {
      const set = new Set<string>();
      for (const target of targets) {
        if (target && target !== source) set.add(target);
      }
      externalRecord[source] = [...set].sort(compareCodes);
    }
    // Prefer processed CPALMS horizontal edges whenever available.
    Object.keys(adjacencyRecord).forEach((key) => delete adjacencyRecord[key]);
    Object.assign(adjacencyRecord, externalRecord);
  }

  const gradeViewsRecord: Record<GradeLevel, StandardsTreeGradeView> = {} as Record<
    GradeLevel,
    StandardsTreeGradeView
  >;
  for (const grade of grades) {
    const view = gradesView.get(grade);
    if (view) gradeViewsRecord[grade] = view;
  }

  return {
    metadata: dataset.metadata,
    grades,
    gradesView: gradeViewsRecord,
    horizontalAdjacency: adjacencyRecord,
  };
}

export const getTreeForGrade = (
  treeDataset: StandardsTreeDataset,
  grade: GradeLevel | '',
) => {
  if (!grade) return null;
  return treeDataset.gradesView[grade] ?? null;
};

export const getHorizontalNeighbors = (
  treeDataset: StandardsTreeDataset,
  benchmarkCode: string,
) => treeDataset.horizontalAdjacency[benchmarkCode] ?? [];

export const expandPathToNode = (
  treeDataset: StandardsTreeDataset,
  grade: GradeLevel,
  nodeId: string,
) => {
  const gradeView = treeDataset.gradesView[grade];
  if (!gradeView) return [];
  const expanded = new Set<string>();
  let current = gradeView.nodesById[nodeId];
  while (current?.parentId) {
    expanded.add(current.parentId);
    current = gradeView.nodesById[current.parentId];
  }
  return [...expanded];
};

export const getNodeDetails = (
  treeDataset: StandardsTreeDataset,
  grade: GradeLevel,
  nodeId: string,
): StandardsTreeNodeDetails | null => {
  const gradeView = treeDataset.gradesView[grade];
  if (!gradeView) return null;
  const node = gradeView.nodesById[nodeId];
  if (!node) return null;

  const benchmarkCode = parseBenchmarkCodeFromNodeId(nodeId);
  const neighborCodes = benchmarkCode
    ? getHorizontalNeighbors(treeDataset, benchmarkCode)
    : [];
  const horizontalNeighbors = neighborCodes
    .map((code) => gradeView.nodesById[toBenchmarkNodeId(code)])
    .filter((item): item is StandardsTreeNode => Boolean(item));

  return {
    node,
    horizontalNeighbors,
  };
};

export const getBenchmarkNodeId = (code: string) => toBenchmarkNodeId(code);
export const getTopicNodeId = (topicId: string) => toTopicNodeId(topicId);
