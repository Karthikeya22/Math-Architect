import { GradeLevel, type StandardsGraphDataset, type StandardsGraphStandard } from '../types';
import { compareStrandCodes, strandStyleFor } from './coherenceAtlasStrands';

export type CoherenceAtlasScope = 'k8' | '912';

export interface CoherenceAtlasNode {
  code: string;
  grade: GradeLevel;
  columnKey: string;
  strandCode: string;
  strandTitle: string;
  title: string;
  description: string;
  lane: number;
}

export interface CoherenceAtlasLayout {
  scope: CoherenceAtlasScope;
  columns: string[];
  columnLabels: Record<string, string>;
  columnLeft: Record<string, number>;
  strands: string[];
  strandMeta: Record<string, { title: string; color: string; tint: string }>;
  nodes: CoherenceAtlasNode[];
  positions: Record<string, { x: number; y: number; w: number; h: number }>;
  laneTops: Record<string, number>;
  laneHeights: Record<string, number>;
  totalWidth: number;
  totalHeight: number;
  connections: Array<[string, string]>;
}

export const K8_GRADE_ORDER: GradeLevel[] = [
  GradeLevel.K,
  GradeLevel.G1,
  GradeLevel.G2,
  GradeLevel.G3,
  GradeLevel.G4,
  GradeLevel.G5,
  GradeLevel.G6,
  GradeLevel.G7,
  GradeLevel.G8,
];

const COL_WIDTH = 260;
const LANE_PADDING_TOP = 16;
const NODE_HEIGHT = 64;
const NODE_GAP = 8;
const HEADER_HEIGHT = 56;
const NODE_PADDING_X = 28;

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

const shortTitle = (standard: StandardsGraphStandard) => {
  const fromTopic = standard.topicTitle?.trim();
  if (fromTopic && fromTopic.length <= 48) return fromTopic;
  const text = standard.description?.trim() || standard.code;
  const sentence = text.split(/[.!?]/)[0]?.trim() || text;
  return sentence.length > 48 ? `${sentence.slice(0, 46)}…` : sentence;
};

const gradeIndex = (grade: GradeLevel) => K8_GRADE_ORDER.indexOf(grade);

export const gradeColumnLabel = (grade: GradeLevel): string => {
  if (grade === GradeLevel.K) return 'K';
  if (grade === GradeLevel.G912) return '912';
  const match = /^Grade (\d+)$/.exec(grade);
  return match?.[1] ?? grade;
};

/** Grades to center in the viewport when focusing a column (K/G8 stay on the edge). */
export const focusGradeWindow = (focusGrade: GradeLevel): GradeLevel[] => {
  const idx = gradeIndex(focusGrade);
  if (idx < 0) return [focusGrade];
  if (idx === 0) return K8_GRADE_ORDER.slice(0, 5);
  if (idx === K8_GRADE_ORDER.length - 1) return K8_GRADE_ORDER.slice(-5);
  return K8_GRADE_ORDER.slice(Math.max(0, idx - 2), idx + 3);
};

export const columnScrollLeft = (
  layout: Pick<CoherenceAtlasLayout, 'columnLeft'>,
  columnKey: string,
  containerWidth: number,
): number => {
  const left = layout.columnLeft[columnKey] ?? 0;
  const target = left - Math.max(0, (containerWidth - COL_WIDTH) / 2);
  return Math.max(0, target);
};

const collectProgressionConnections = (standards: StandardsGraphStandard[]) => {
  const codes = new Set(standards.map((row) => row.code));
  const edges = new Map<string, Set<string>>();
  const addEdge = (from: string, to: string) => {
    if (!codes.has(from) || !codes.has(to) || from === to) return;
    const bucket = edges.get(from) ?? new Set<string>();
    bucket.add(to);
    edges.set(from, bucket);
  };

  for (const row of standards) {
    for (const next of row.relationships.sequentialNext) addEdge(row.code, next);
    for (const next of row.relationships.crossGradeConceptLinks) addEdge(row.code, next);
    for (const prev of row.relationships.sequentialPrev) addEdge(prev, row.code);
  }

  const pairs: Array<[string, string]> = [];
  for (const [from, targets] of edges.entries()) {
    for (const to of targets) pairs.push([from, to]);
  }
  return pairs;
};

const buildLaneLayout = (
  columns: string[],
  strands: string[],
  nodes: CoherenceAtlasNode[],
) => {
  const laneCounts: Record<string, number> = {};
  for (const strand of strands) laneCounts[strand] = 0;

  for (const column of columns) {
    for (const strand of strands) {
      const count = nodes.filter((node) => node.strandCode === strand && node.columnKey === column).length;
      laneCounts[strand] = Math.max(laneCounts[strand], count);
    }
  }

  const laneHeights: Record<string, number> = {};
  for (const strand of strands) {
    const count = laneCounts[strand];
    laneHeights[strand] =
      LANE_PADDING_TOP * 2 + count * NODE_HEIGHT + Math.max(0, count - 1) * NODE_GAP;
  }

  const laneTops: Record<string, number> = {};
  let cursor = HEADER_HEIGHT;
  for (const strand of strands) {
    laneTops[strand] = cursor;
    cursor += laneHeights[strand];
  }

  const positions: Record<string, { x: number; y: number; w: number; h: number }> = {};
  const columnLeft: Record<string, number> = {};
  columns.forEach((column, index) => {
    columnLeft[column] = NODE_PADDING_X + index * COL_WIDTH;
  });

  for (const node of nodes) {
    const colIdx = columns.indexOf(node.columnKey);
    if (colIdx < 0) continue;
    const x = NODE_PADDING_X + colIdx * COL_WIDTH;
    const y = laneTops[node.strandCode] + LANE_PADDING_TOP + node.lane * (NODE_HEIGHT + NODE_GAP);
    positions[node.code] = {
      x,
      y,
      w: COL_WIDTH - NODE_PADDING_X * 2,
      h: NODE_HEIGHT,
    };
  }

  return {
    positions,
    laneTops,
    laneHeights,
    totalWidth: NODE_PADDING_X * 2 + columns.length * COL_WIDTH,
    totalHeight: cursor,
    columnLeft,
  };
};

export const buildCoherenceAtlasLayout = (
  dataset: StandardsGraphDataset,
  scope: CoherenceAtlasScope,
): CoherenceAtlasLayout => {
  const standards = dataset.standards.filter((row) =>
    scope === 'k8' ? K8_GRADE_ORDER.includes(row.grade) : row.grade === GradeLevel.G912,
  );

  const strandCodes = [...new Set(standards.map((row) => row.strandCode).filter(Boolean))].sort(
    compareStrandCodes,
  );

  const strandMeta: CoherenceAtlasLayout['strandMeta'] = {};
  for (const code of strandCodes) {
    const title =
      standards.find((row) => row.strandCode === code)?.strandTitle ||
      strandStyleFor(code).name;
    const style = strandStyleFor(code, title);
    strandMeta[code] = { title: style.name, color: style.color, tint: style.tint };
  }

  const nodes: CoherenceAtlasNode[] = [];
  const columns =
    scope === 'k8'
      ? K8_GRADE_ORDER.filter((grade) => standards.some((row) => row.grade === grade)).map(String)
      : strandCodes;

  if (scope === 'k8') {
    for (const strand of strandCodes) {
      for (const grade of columns) {
        const bucket = standards
          .filter((row) => row.strandCode === strand && String(row.grade) === grade)
          .sort((a, b) => a.sequenceOrder - b.sequenceOrder || compareCodes(a.code, b.code));
        bucket.forEach((row, lane) => {
          nodes.push({
            code: row.code,
            grade: row.grade,
            columnKey: String(row.grade),
            strandCode: row.strandCode,
            strandTitle: row.strandTitle,
            title: shortTitle(row),
            description: row.description,
            lane,
          });
        });
      }
    }
  } else {
    for (const strand of strandCodes) {
      const bucket = standards
        .filter((row) => row.strandCode === strand)
        .sort((a, b) => compareCodes(a.code, b.code));
      bucket.forEach((row, lane) => {
        nodes.push({
          code: row.code,
          grade: row.grade,
          columnKey: strand,
          strandCode: row.strandCode,
          strandTitle: row.strandTitle,
          title: shortTitle(row),
          description: row.description,
          lane,
        });
      });
    }
  }

  const laneLayout = buildLaneLayout(columns, strandCodes, nodes);
  const columnLabels = Object.fromEntries(
    columns.map((column) => [
      column,
      scope === 'k8' ? gradeColumnLabel(column as GradeLevel) : column,
    ]),
  );

  const connections = collectProgressionConnections(standards).filter(([from, to]) => {
    const fromNode = nodes.find((node) => node.code === from);
    const toNode = nodes.find((node) => node.code === to);
    if (!fromNode || !toNode) return false;
    if (scope === 'k8') return gradeIndex(fromNode.grade) < gradeIndex(toNode.grade);
    return fromNode.strandCode === toNode.strandCode && fromNode.lane < toNode.lane;
  });

  return {
    scope,
    columns,
    columnLabels,
    strands: strandCodes,
    strandMeta,
    nodes,
    connections,
    ...laneLayout,
  };
};

export const layoutForVisibleStrands = (
  layout: CoherenceAtlasLayout,
  visibleStrands: Set<string>,
): CoherenceAtlasLayout => {
  const activeStrands = layout.strands.filter((strand) => visibleStrands.has(strand));
  if (activeStrands.length === layout.strands.length) return layout;

  const visibleNodes = layout.nodes.filter((node) => visibleStrands.has(node.strandCode));
  const laneLayout = buildLaneLayout(layout.columns, activeStrands, visibleNodes);
  const visibleCodes = new Set(visibleNodes.map((node) => node.code));
  const connections = layout.connections.filter(
    ([from, to]) => visibleCodes.has(from) && visibleCodes.has(to),
  );

  return {
    ...layout,
    strands: activeStrands,
    nodes: visibleNodes,
    connections,
    ...laneLayout,
  };
};

export const walkProgressionChain = (
  connections: Array<[string, string]>,
  focusCode: string | null,
) => {
  if (!focusCode) return { upstream: new Set<string>(), downstream: new Set<string>() };
  const upstream = new Set<string>();
  const downstream = new Set<string>();

  const walkUp = (code: string) => {
    for (const [from, to] of connections) {
      if (to === code && !upstream.has(from)) {
        upstream.add(from);
        walkUp(from);
      }
    }
  };
  const walkDown = (code: string) => {
    for (const [from, to] of connections) {
      if (from === code && !downstream.has(to)) {
        downstream.add(to);
        walkDown(to);
      }
    }
  };

  walkUp(focusCode);
  walkDown(focusCode);
  return { upstream, downstream };
};

export const visibleConnections = (
  connections: Array<[string, string]>,
  focusCode: string | null,
) => {
  if (!focusCode) return [];
  const { upstream, downstream } = walkProgressionChain(connections, focusCode);
  const chain = new Set<string>([focusCode, ...upstream, ...downstream]);
  return connections.filter(([from, to]) => chain.has(from) && chain.has(to));
};
