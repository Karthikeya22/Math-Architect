import { VisualType } from '../types';

/**
 * Per-standard policy for which deterministic visualTypes are acceptable
 * and whether non-deterministic Gemini imagePrompt fallback is allowed.
 *
 * Strategy:
 * - Heuristic from the standard code (`MA.<grade>.<strand>.<cluster>.<benchmark>`).
 * - Manual OVERRIDES patch any code where the heuristic is wrong.
 * - Unknown codes return an empty preference list and `forbidGeminiFallback: false`.
 * - Deterministic visualTypes are preferred; Gemini is the backup when no valid
 *   visualSpec can be rendered for the stem.
 *
 * Strand legend (Florida B.E.S.T. Math):
 *   NSO – Number Sense and Operations
 *   FR  – Fractions
 *   AR  – Algebraic Reasoning
 *   M   – Measurement
 *   GR  – Geometric Reasoning
 *   DP  – Data Analysis and Probability
 */

export interface PreferredVisualPolicy {
  /** If non-empty, visualType (when present) MUST be one of these. */
  preferredTypes: VisualType[];
  /** If true, imagePrompt (Gemini path) is forbidden for this standard. */
  forbidGeminiFallback: boolean;
}

const EMPTY_POLICY: PreferredVisualPolicy = {
  preferredTypes: [],
  forbidGeminiFallback: false,
};

interface ParsedStandardCode {
  grade: number | null;
  strand: string;
  isHighSchool: boolean;
}

const parseStandardCode = (code: string): ParsedStandardCode | null => {
  if (typeof code !== 'string') return null;
  const trimmed = code.trim().toUpperCase();
  const match = trimmed.match(/^MA\.(K|\d{1,3})\.([A-Z]+)\./);
  if (!match) return null;
  const gradeRaw = match[1];
  const strand = match[2];
  if (gradeRaw === 'K') return { grade: 0, strand, isHighSchool: false };
  if (gradeRaw === '912') return { grade: 12, strand, isHighSchool: true };
  const num = Number(gradeRaw);
  if (!Number.isInteger(num) || num < 0 || num > 12) return null;
  return { grade: num, strand, isHighSchool: false };
};

const inBand = (grade: number | null, lo: number, hi: number): boolean =>
  grade !== null && grade >= lo && grade <= hi;

/**
 * Manual overrides keyed by exact standard code. Patch here when the heuristic
 * picks the wrong types for a specific benchmark.
 */
export const STANDARD_VISUAL_POLICY_OVERRIDES: Record<string, PreferredVisualPolicy> = {};

/**
 * Resolve the visual policy for a standard code. Always returns a defined policy.
 */
export const getPreferredVisualPolicy = (code: string | undefined | null): PreferredVisualPolicy => {
  if (!code) return EMPTY_POLICY;
  const trimmed = String(code).trim().toUpperCase();
  if (STANDARD_VISUAL_POLICY_OVERRIDES[trimmed]) {
    return STANDARD_VISUAL_POLICY_OVERRIDES[trimmed];
  }
  const parsed = parseStandardCode(trimmed);
  if (!parsed) return EMPTY_POLICY;

  const { grade, strand, isHighSchool } = parsed;

  if (strand === 'FR') {
    return {
      preferredTypes: [
        'fraction_bar',
        'fraction_circle',
        'number_line',
        'area_model',
        'bar_model',
      ],
      forbidGeminiFallback: false,
    };
  }

  if (strand === 'NSO') {
    if (inBand(grade, 0, 2)) {
      return {
        preferredTypes: ['ten_frame', 'number_line', 'array_model', 'bar_model'],
        forbidGeminiFallback: false,
      };
    }
    if (inBand(grade, 3, 5)) {
      return {
        preferredTypes: ['number_line', 'array_model', 'area_model', 'bar_model'],
        forbidGeminiFallback: false,
      };
    }
    return {
      preferredTypes: ['number_line', 'area_model', 'bar_model'],
      forbidGeminiFallback: false,
    };
  }

  if (strand === 'AR') {
    // K–2 AR (e.g. MA.K.AR.1.1) uses the same concrete representations as early
    // number work: ten-frames and arrays for joining/separating and equations.
    // Without ten_frame here, a valid K item gets rejected by policy while NSO
    // items do not — confusing and wrong for teachers.
    if (inBand(grade, 0, 2)) {
      return {
        preferredTypes: [
          'ten_frame',
          'array_model',
          'bar_model',
          'table',
          'number_line',
          'area_model',
        ],
        forbidGeminiFallback: false,
      };
    }
    if (inBand(grade, 3, 5)) {
      return {
        preferredTypes: ['bar_model', 'table', 'number_line', 'area_model'],
        forbidGeminiFallback: false,
      };
    }
    return {
      preferredTypes: ['coordinate_plane', 'bar_model', 'table', 'area_model'],
      forbidGeminiFallback: false,
    };
  }

  if (strand === 'M') {
    if (inBand(grade, 0, 2)) {
      return {
        preferredTypes: ['array_model', 'clock_face', 'number_line', 'bar_chart'],
        forbidGeminiFallback: false,
      };
    }
    return {
      preferredTypes: [
        'clock_face',
        'coordinate_plane',
        'bar_chart',
        'geometric_shape',
        'number_line',
      ],
      forbidGeminiFallback: false,
    };
  }

  if (strand === 'GR') {
    return {
      preferredTypes: ['geometric_shape', 'coordinate_plane'],
      forbidGeminiFallback: false,
    };
  }

  if (strand === 'DP') {
    return {
      preferredTypes: ['bar_chart', 'line_plot', 'table'],
      forbidGeminiFallback: false,
    };
  }

  if (isHighSchool) {
    return {
      preferredTypes: ['coordinate_plane', 'geometric_shape', 'table', 'bar_chart', 'area_model'],
      forbidGeminiFallback: false,
    };
  }

  return EMPTY_POLICY;
};

/** Convenience: just the allowed visualType list (or undefined when no policy). */
export const getPreferredVisualTypes = (code: string | undefined | null): VisualType[] =>
  getPreferredVisualPolicy(code).preferredTypes;
