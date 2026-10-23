import { describe, expect, it } from 'vitest';
import {
  FIGURE_FAMILY_REGISTRY,
  assertRegistryComplete,
  familyForVisualType,
  getFigureFamilyHandler,
  visualTypeForFamily,
} from './registry.ts';

describe('figure family registry', () => {
  it('has no incomplete deterministic families', () => {
    expect(assertRegistryComplete()).toEqual([]);
  });

  it('maps every deterministic family to the documented visual type', () => {
    expect(visualTypeForFamily('dimensioned_rectangles')).toBe('geometric_shape');
    expect(visualTypeForFamily('named_shapes')).toBe('geometric_shape');
    expect(visualTypeForFamily('fraction_bar')).toBe('fraction_bar');
    expect(visualTypeForFamily('coordinate_plane')).toBe('coordinate_plane');
    expect(visualTypeForFamily('clock_face')).toBe('clock_face');
    expect(visualTypeForFamily('illustration')).toBeUndefined();
    expect(visualTypeForFamily('none')).toBeUndefined();
  });

  it('only allows AI raster for the illustration family', () => {
    const aiFamilies = Object.values(FIGURE_FAMILY_REGISTRY)
      .filter((handler) => handler.aiAllowed)
      .map((handler) => handler.family);
    expect(aiFamilies).toEqual(['illustration']);
  });

  it('never marks measured-geometry families as AI-drawable', () => {
    for (const family of [
      'dimensioned_rectangles',
      'named_shapes',
      'geometric_shape',
      'coordinate_plane',
      'fraction_bar',
      'fraction_circle',
      'number_line',
      'line_plot',
      'bar_chart',
      'table',
    ] as const) {
      expect(getFigureFamilyHandler(family).aiAllowed).toBe(false);
      expect(getFigureFamilyHandler(family).deterministic).toBe(true);
    }
  });

  it('reverse maps a visual type back to its canonical family', () => {
    expect(familyForVisualType('geometric_shape')).toBe('geometric_shape');
    expect(familyForVisualType('fraction_circle')).toBe('fraction_circle');
    expect(familyForVisualType('unknown')).toBe('none');
    expect(familyForVisualType(undefined)).toBe('none');
  });
});
