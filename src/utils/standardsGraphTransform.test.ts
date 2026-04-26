import { describe, expect, it } from 'vitest';
import type {
  StandardsGraphDataset,
  StandardsGraphFilters,
} from '../types';
import { GradeLevel } from '../types';
import {
  buildGraphViewModel,
  deriveFilterOptions,
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
  it('builds standard and topic nodes plus membership links', () => {
    const filters: StandardsGraphFilters = {
      grade: GradeLevel.G4,
      relationMode: 'sequential',
      strandCode: 'all',
      topicId: 'all',
      includeTopicNodes: true,
      includeStandardNodes: true,
      searchText: '',
    };

    const view = buildGraphViewModel(sampleDataset, filters);

    expect(view.nodes.map((node) => node.id)).toContain('topic-4-nso');
    expect(view.nodes.map((node) => node.id)).toContain('MA.4.NSO.1.1');
    expect(
      view.links.some(
        (link) =>
          link.source === 'topic-4-nso' &&
          link.target === 'MA.4.NSO.1.1' &&
          link.kind === 'topic-membership',
      ),
    ).toBe(true);
  });

  it('includes cross-grade links in cross-grade mode', () => {
    const filters: StandardsGraphFilters = {
      grade: 'all',
      relationMode: 'cross-grade',
      strandCode: 'all',
      topicId: 'all',
      includeTopicNodes: true,
      includeStandardNodes: true,
      searchText: '',
    };

    const view = buildGraphViewModel(sampleDataset, filters);
    expect(
      view.links.some(
        (link) =>
          link.kind === 'cross-grade' &&
          link.source === 'MA.4.NSO.1.1' &&
          link.target === 'MA.5.NSO.1.1',
      ),
    ).toBe(true);
  });
});

describe('deriveFilterOptions', () => {
  it('returns ordered grade, strand, and topic options', () => {
    const options = deriveFilterOptions(sampleDataset);
    expect(options.grades).toEqual([GradeLevel.G4, GradeLevel.G5]);
    expect(options.strands).toEqual([
      { code: 'NSO', title: 'Number Sense and Operations' },
    ]);
    expect(options.topics.map((topic) => topic.id)).toEqual([
      'topic-4-nso',
      'topic-5-nso',
    ]);
  });
});
