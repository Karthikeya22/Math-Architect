import { afterEach, describe, expect, it } from 'vitest';
import {
  STANDARD_VISUAL_POLICY_OVERRIDES,
  getPreferredVisualPolicy,
  getPreferredVisualTypes,
} from './standardVisualPreferences';

describe('getPreferredVisualPolicy', () => {
  it('returns empty policy for falsy or unparseable codes', () => {
    expect(getPreferredVisualPolicy(undefined).preferredTypes).toEqual([]);
    expect(getPreferredVisualPolicy('').preferredTypes).toEqual([]);
    expect(getPreferredVisualPolicy('not-a-standard').preferredTypes).toEqual([]);
    expect(getPreferredVisualPolicy('not-a-standard').forbidGeminiFallback).toBe(false);
  });

  describe('FR (Fractions)', () => {
    it('uses fraction-friendly types and still allows Gemini as a backup', () => {
      const p = getPreferredVisualPolicy('MA.4.FR.2.1');
      expect(p.preferredTypes).toEqual([
        'fraction_bar',
        'fraction_circle',
        'number_line',
        'area_model',
        'bar_model',
      ]);
      expect(p.forbidGeminiFallback).toBe(false);
    });

    it('applies same policy regardless of grade', () => {
      const p = getPreferredVisualPolicy('MA.1.FR.1.1');
      expect(p.preferredTypes).toContain('fraction_bar');
      expect(p.forbidGeminiFallback).toBe(false);
    });
  });

  describe('NSO (Number Sense and Operations)', () => {
    it('K-2 includes ten_frame', () => {
      const p = getPreferredVisualPolicy('MA.K.NSO.1.1');
      expect(p.preferredTypes).toContain('ten_frame');
      expect(p.forbidGeminiFallback).toBe(false);
    });

    it('grade 1 includes ten_frame', () => {
      expect(getPreferredVisualPolicy('MA.1.NSO.1.1').preferredTypes).toContain('ten_frame');
    });

    it('grade 3 drops ten_frame in favor of area_model', () => {
      const p = getPreferredVisualPolicy('MA.3.NSO.2.1');
      expect(p.preferredTypes).not.toContain('ten_frame');
      expect(p.preferredTypes).toContain('area_model');
    });

    it('grade 6+ uses upper-band types', () => {
      const p = getPreferredVisualPolicy('MA.7.NSO.1.1');
      expect(p.preferredTypes).not.toContain('array_model');
      expect(p.preferredTypes).toContain('area_model');
    });
  });

  describe('AR (Algebraic Reasoning)', () => {
    it('K includes ten_frame for early equation/representation items (MA.K.AR.*)', () => {
      const p = getPreferredVisualPolicy('MA.K.AR.1.1');
      expect(p.preferredTypes).toContain('ten_frame');
      expect(p.preferredTypes).toContain('array_model');
      expect(p.forbidGeminiFallback).toBe(false);
    });

    it('K-5 keeps Gemini allowed for story scenes', () => {
      const p = getPreferredVisualPolicy('MA.2.AR.1.1');
      expect(p.preferredTypes).toContain('bar_model');
      expect(p.forbidGeminiFallback).toBe(false);
    });

    it('grades 6-12 add coordinate_plane and still allow Gemini backup', () => {
      const p = getPreferredVisualPolicy('MA.8.AR.1.1');
      expect(p.preferredTypes).toContain('coordinate_plane');
      expect(p.forbidGeminiFallback).toBe(false);
    });
  });

  describe('M (Measurement)', () => {
    it('K-2 includes clock_face and allows Gemini for rulers/scales', () => {
      const p = getPreferredVisualPolicy('MA.1.M.2.1');
      expect(p.preferredTypes).toContain('array_model');
      expect(p.preferredTypes).toContain('clock_face');
      expect(p.forbidGeminiFallback).toBe(false);
    });

    it('upper grades include geometric_shape', () => {
      const p = getPreferredVisualPolicy('MA.5.M.1.1');
      expect(p.preferredTypes).toContain('geometric_shape');
    });
  });

  describe('GR (Geometric Reasoning)', () => {
    it('uses geometric_shape and coordinate_plane and still allows Gemini backup', () => {
      const p = getPreferredVisualPolicy('MA.5.GR.1.1');
      expect(p.preferredTypes).toEqual(['geometric_shape', 'coordinate_plane']);
      expect(p.forbidGeminiFallback).toBe(false);
    });
  });

  describe('DP (Data Analysis and Probability)', () => {
    it('uses chart-like types and still allows Gemini backup', () => {
      const p = getPreferredVisualPolicy('MA.3.DP.1.1');
      expect(p.preferredTypes).toEqual(['bar_chart', 'line_plot', 'table']);
      expect(p.forbidGeminiFallback).toBe(false);
    });
  });

  describe('high school MA.912.*', () => {
    it('FR-style high school still uses FR policy when matched', () => {
      const p = getPreferredVisualPolicy('MA.912.GR.1.1');
      expect(p.preferredTypes).toEqual(['geometric_shape', 'coordinate_plane']);
    });

    it('high-school strands not specifically mapped fall back to HS default', () => {
      const p = getPreferredVisualPolicy('MA.912.F.1.1');
      expect(p.preferredTypes).toContain('coordinate_plane');
    });

    it('HS never uses ten_frame', () => {
      const p = getPreferredVisualPolicy('MA.912.NSO.1.1');
      expect(p.preferredTypes).not.toContain('ten_frame');
    });
  });

  describe('OVERRIDES', () => {
    afterEach(() => {
      delete STANDARD_VISUAL_POLICY_OVERRIDES['MA.4.FR.2.1'];
    });

    it('takes precedence over heuristic when present', () => {
      STANDARD_VISUAL_POLICY_OVERRIDES['MA.4.FR.2.1'] = {
        preferredTypes: ['table'],
        forbidGeminiFallback: false,
      };
      const p = getPreferredVisualPolicy('MA.4.FR.2.1');
      expect(p.preferredTypes).toEqual(['table']);
      expect(p.forbidGeminiFallback).toBe(false);
    });
  });

  it('getPreferredVisualTypes is a thin alias', () => {
    expect(getPreferredVisualTypes('MA.4.FR.2.1')).toEqual(
      getPreferredVisualPolicy('MA.4.FR.2.1').preferredTypes,
    );
  });
});
