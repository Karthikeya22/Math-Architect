import { describe, expect, it } from 'vitest';
import {
  allSkeletons,
  FIGURE_SKELETONS,
  skeletonForFamily,
  skeletonForStandard,
} from './catalog';

describe('figure skeleton catalog', () => {
  it('covers every family with a unique skeleton id', () => {
    const skeletons = allSkeletons();
    expect(new Set(skeletons.map((skeleton) => skeleton.id)).size).toBe(skeletons.length);
    for (const family of Object.keys(FIGURE_SKELETONS)) {
      expect(skeletons.some((skeleton) => skeleton.family === family)).toBe(true);
    }
  });

  it('keeps every measured skeleton deterministic', () => {
    for (const skeleton of allSkeletons()) {
      if (skeleton.family === 'illustration' || skeleton.family === 'none') continue;
      expect(skeleton.deterministic).toBe(true);
      expect(skeleton.aiAllowed).toBe(false);
      expect(skeleton.visualType).not.toBeNull();
      expect(skeleton.fallback).toBe('deterministic');
    }
  });

  it('maps fraction multiplication to the area-model skeleton', () => {
    expect(skeletonForStandard('MA.5.FR.2.2', 'none').id).toBe('area_model_product');
    expect(skeletonForStandard('MA.5.FR.2.2', 'fraction_bar').id).toBe('area_model_product');
  });

  it('falls back to the family skeleton when there is no override', () => {
    expect(skeletonForFamily('coordinate_plane').id).toBe('coordinate_plane');
    expect(skeletonForFamily('none').fallback).toBe('none');
  });
});
