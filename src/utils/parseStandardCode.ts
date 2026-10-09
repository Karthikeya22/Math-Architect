/** Parsed segments from a Florida B.E.S.T. math standard code (e.g. MA.4.FR.1.3). */

export type ParsedStandardCodeMeta = {
  strandCode: string | null;
  gradeToken: string | null;
};

/**
 * Expects codes like MA.{grade}.{strand}.{rest...}
 * - grade: K, 1–8, or 912 (high school)
 * - strand: letter code (NSO, FR, AR, C, etc.)
 */
export const parseStandardCodeMeta = (code: string): ParsedStandardCodeMeta => {
  const parts = code.split('.').filter((p) => p.length > 0);
  if (parts.length < 3 || parts[0].toUpperCase() !== 'MA') {
    return { strandCode: null, gradeToken: null };
  }

  const gradeToken = parts[1] || null;
  const strandCandidate = parts[2] || '';

  const strandCode = /^[A-Za-z]+$/.test(strandCandidate) ? strandCandidate.toUpperCase() : null;

  return {
    strandCode,
    gradeToken: gradeToken ? String(gradeToken) : null,
  };
};
