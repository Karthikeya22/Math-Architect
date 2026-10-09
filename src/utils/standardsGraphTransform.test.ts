import { describe, expect, it } from 'vitest';
import type {
  StandardsGraphDataset,
} from '../types';
import { GradeLevel } from '../types';
import {
  buildStandardsTreeDataset,
  expandPathToNode,
  getBenchmarkNodeId,
  getHorizontalNeighbors,
  getNodeDetails,
  getTreeForGrade,
} from './standardsGraphTransform';

const sampleDataset: StandardsGraphDataset = {
  metadata: {
    source: 'unit-test',
    generatedAt: '2026-04-26T00:00:00.000Z',
    totalStandards: 3,
    totalTopics: 2,
    grades: [GradeLevel.G4, GradeLevel.G5],
  },
  topics: [
    {
      id: 'topic-4-nso',
      title: 'Number Sense and Operations',
      grade: GradeLevel.G4,
      strandCode: 'NSO',
      strandTitle: 'Number Sense and Operations',
      keywords: ['number', 'operations'],
    },
    {
      id: 'topic-5-nso',
      title: 'Number Sense and Operations',
      grade: GradeLevel.G5,
      strandCode: 'NSO',
      strandTitle: 'Number Sense and Operations',
      keywords: ['number', 'operations'],
    },
  ],
  standards: [
    {
      code: 'MA.4.NSO.1.1',
      grade: GradeLevel.G4,
      topicId: 'topic-4-nso',
      topicTitle: 'Number Sense and Operations',
      strandCode: 'NSO',
      strandTitle: 'Number Sense and Operations',
      description: 'Understand place value relationships.',
      keywords: ['place value'],
      sequenceOrder: 1,
      relationships: {
        sequentialPrev: [],
        sequentialNext: ['MA.4.NSO.1.2'],
        crossGradeConceptLinks: ['MA.5.NSO.1.1'],
      },
    },
    {
      code: 'MA.4.NSO.1.2',
      grade: GradeLevel.G4,
      topicId: 'topic-4-nso',
      topicTitle: 'Number Sense and Operations',
      strandCode: 'NSO',
      strandTitle: 'Number Sense and Operations',
      description: 'Compare numbers based on place value.',
      keywords: ['compare'],
      sequenceOrder: 2,
      relationships: {
        sequentialPrev: ['MA.4.NSO.1.1'],
        sequentialNext: [],
        crossGradeConceptLinks: [],
      },
    },
    {
      code: 'MA.5.NSO.1.1',
      grade: GradeLevel.G5,
      topicId: 'topic-5-nso',
      topicTitle: 'Number Sense and Operations',
      strandCode: 'NSO',
      strandTitle: 'Number Sense and Operations',
      description: 'Extend place value understanding.',
      keywords: ['place value'],
      sequenceOrder: 1,
      relationships: {
        sequentialPrev: [],
        sequentialNext: [],
        crossGradeConceptLinks: ['MA.4.NSO.1.1'],
      },
    },
  ],
};

describe('buildGraphViewModel', () => {
  it('builds topic, family, and benchmark hierarchy', () => {
    const tree = buildStandardsTreeDataset(sampleDataset);
    const gradeView = getTreeForGrade(tree, GradeLevel.G4);
    expect(gradeView).not.toBeNull();
    if (!gradeView) return;

    const topicNode = gradeView.rootNodeIds
      .map((id) => gradeView.nodesById[id])
      .find((node) => node.kind === 'topic');
    expect(topicNode?.code).toBe('NSO');
    expect(topicNode?.childrenIds.length).toBeGreaterThan(0);

    const familyNode = topicNode
      ? gradeView.nodesById[topicNode.childrenIds[0]]
      : null;
    expect(familyNode?.kind).toBe('family');
    expect(familyNode?.code).toBe('MA.4.NSO.1');

    const benchmarkNode = familyNode
      ? gradeView.nodesById[familyNode.childrenIds[0]]
      : null;
    expect(benchmarkNode?.kind).toBe('benchmark');
    expect(benchmarkNode?.code).toBe('MA.4.NSO.1.1');
  });

  it('maps horizontal neighbors leaf-to-leaf', () => {
    const tree = buildStandardsTreeDataset(sampleDataset);
    const neighbors = getHorizontalNeighbors(tree, 'MA.4.NSO.1.1');
    expect(neighbors).toContain('MA.5.NSO.1.1');
    const details = getNodeDetails(
      tree,
      GradeLevel.G4,
      getBenchmarkNodeId('MA.4.NSO.1.1'),
    );
    expect(details?.horizontalNeighbors.length).toBe(0);
    const g5Details = getNodeDetails(
      tree,
      GradeLevel.G5,
      getBenchmarkNodeId('MA.5.NSO.1.1'),
    );
    expect(g5Details?.horizontalNeighbors).toEqual([]);
  });

  it('expands path to benchmark node', () => {
    const tree = buildStandardsTreeDataset(sampleDataset);
    const expanded = expandPathToNode(
      tree,
      GradeLevel.G4,
      getBenchmarkNodeId('MA.4.NSO.1.2'),
    );
    expect(expanded.some((id) => id.startsWith('topic:'))).toBe(true);
    expect(expanded.some((id) => id.startsWith('family:MA.4.NSO.1'))).toBe(true);
  });
});
