import { describe, expect, it } from 'vitest';
import { GradeLevel } from '../types';
import { buildCoherenceMapPath, parseCoherenceMapPath } from './coherenceMapRoute';

describe('coherenceMapRoute', () => {
  it('parses a legacy coherence-map URL into route state', () => {
    const parsed = parseCoherenceMapPath(
      '/coherence-map/g4/NSO/topic-4-nso/MA.4.NSO.1.1/MA.4.NSO.1.2/1',
    );
    expect(parsed).toEqual({
      band: 'k8',
      grade: GradeLevel.G4,
      category: 'NSO',
      domain: 'topic-4-nso',
      root: 'MA.4.NSO.1.1',
      standard: 'MA.4.NSO.1.2',
      standardIndex: 1,
    });
  });

  it('parses atlas URLs with explicit band segments', () => {
    expect(parseCoherenceMapPath('/coherence-map/k8/g4/NSO/MA.4.NSO.1.1')).toEqual({
      band: 'k8',
      grade: GradeLevel.G4,
      category: 'NSO',
      domain: null,
      root: 'MA.4.NSO.1.1',
      standard: 'MA.4.NSO.1.1',
      standardIndex: null,
    });
    expect(parseCoherenceMapPath('/coherence-map/912/AR/MA.912.AR.1.1')).toEqual({
      band: '912',
      grade: GradeLevel.G912,
      category: 'AR',
      domain: null,
      root: 'MA.912.AR.1.1',
      standard: 'MA.912.AR.1.1',
      standardIndex: null,
    });
  });

  it('builds route path from route state', () => {
    const path = buildCoherenceMapPath({
      band: 'k8',
      grade: GradeLevel.G5,
      category: 'NSO',
      domain: null,
      root: 'MA.5.NSO.1.1',
      standard: 'MA.5.NSO.1.1',
      standardIndex: null,
    });
    expect(path).toBe('/coherence-map/k8/g5/NSO/MA.5.NSO.1.1');
  });
});
