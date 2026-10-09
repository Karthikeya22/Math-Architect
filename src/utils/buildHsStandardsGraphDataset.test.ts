import { describe, expect, it } from 'vitest';
import { GradeLevel, type Standard } from '../types';
import { buildHsStandardsGraphDataset } from './buildHsStandardsGraphDataset';

describe('buildHsStandardsGraphDataset', () => {
  it('uses one topic per strand so the overview stays small', () => {
    const strandTitles: Record<string, string> = { AR: 'Algebraic Reasoning' };
    const standards: Standard[] = [
      { code: 'MA.912.AR.1.1', grade: '912', description: 'A' },
      { code: 'MA.912.AR.2.3', grade: '912', description: 'B' },
      { code: 'MA.912.DP.1.2', grade: '912', description: 'C' },
    ];
    const ds = buildHsStandardsGraphDataset(standards, strandTitles);
    expect(ds.metadata.grades).toEqual([GradeLevel.G912]);
    expect(ds.topics).toHaveLength(2);
    const topicIds = new Set(ds.topics.map((t) => t.id));
    expect(topicIds.has('912-AR')).toBe(true);
    expect(topicIds.has('912-DP')).toBe(true);
    expect(ds.standards).toHaveLength(3);
    expect(ds.standards.every((s) => s.topicId === `912-${s.strandCode}`)).toBe(true);
  });
});
