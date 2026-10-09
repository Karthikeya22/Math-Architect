import { describe, expect, it } from 'vitest';
import standardsGraphDataset from '../data/best-standards-graph.json';
import { GradeLevel, type StandardsGraphDataset } from '../types';
import {
  buildCoherenceAtlasLayout,
  focusGradeWindow,
  gradeColumnLabel,
  K8_GRADE_ORDER,
  layoutForVisibleStrands,
} from './buildCoherenceAtlasModel';

describe('buildCoherenceAtlasLayout', () => {
  it('includes every strand from the bundled K-8 dataset', () => {
    const dataset = standardsGraphDataset as StandardsGraphDataset;
    const layout = buildCoherenceAtlasLayout(dataset, 'k8');
    const datasetStrands = new Set(dataset.standards.map((row: { strandCode: string }) => row.strandCode));
    expect(new Set(layout.strands)).toEqual(datasetStrands);
    expect(layout.nodes).toHaveLength(dataset.standards.length);
  });
});

describe('layoutForVisibleStrands', () => {
  it('collapses hidden strands so remaining lanes stack from the header', () => {
    const dataset = standardsGraphDataset as StandardsGraphDataset;
    const layout = buildCoherenceAtlasLayout(dataset, 'k8');
    const [hiddenStrand, ...remainingStrands] = layout.strands;
    const visible = new Set(remainingStrands);
    const filtered = layoutForVisibleStrands(layout, visible);

    expect(filtered.strands).toEqual(remainingStrands);
    expect(filtered.totalHeight).toBeLessThan(layout.totalHeight);
    expect(filtered.laneTops[remainingStrands[0]]).toBe(56);
    expect(filtered.nodes.every((node) => node.strandCode !== hiddenStrand)).toBe(true);
  });
});

describe('focusGradeWindow', () => {
  it('keeps Kindergarten on the left edge with the next four grades', () => {
    expect(focusGradeWindow(GradeLevel.K)).toEqual(K8_GRADE_ORDER.slice(0, 5));
  });

  it('keeps Grade 8 on the right edge with the previous four grades', () => {
    expect(focusGradeWindow(GradeLevel.G8)).toEqual(K8_GRADE_ORDER.slice(-5));
  });

  it('centers Grade 4 with two grades on each side', () => {
    expect(focusGradeWindow(GradeLevel.G4)).toEqual([
      GradeLevel.G2,
      GradeLevel.G3,
      GradeLevel.G4,
      GradeLevel.G5,
      GradeLevel.G6,
    ]);
  });
});

describe('gradeColumnLabel', () => {
  it('maps kindergarten and numeric grades', () => {
    expect(gradeColumnLabel(GradeLevel.K)).toBe('K');
    expect(gradeColumnLabel(GradeLevel.G4)).toBe('4');
  });
});
