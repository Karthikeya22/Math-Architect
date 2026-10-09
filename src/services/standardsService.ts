import { GradeLevel, Standard } from '../types';

type StandardsApiResponse = {
  standards: Array<{
    code: string;
    description: string;
    grade: string;
    clarifications?: string[];
    examples?: string[];
    purposeAndStrategies?: string[];
    misconceptions?: string[];
    tieredInstruction?: string[];
  }>;
};

/** Maps `/api/standards` grade strings to app `GradeLevel` (K and Grades 1–8). Exported for tests. */
export const mapApiGradeToGradeLevel = (grade: string): GradeLevel | null => {
  const raw = grade.trim();
  const normalized = raw.toLowerCase();

  if (
    normalized === 'kindergarten' ||
    normalized === 'k' ||
    normalized === 'kg' ||
    normalized.includes('kindergarten')
  ) {
    return GradeLevel.K;
  }

  const gradeWord = normalized.match(/^grade\s+(.+)$/);
  if (gradeWord) {
    const rest = gradeWord[1].trim();
    if (rest === 'k' || rest === 'kg' || rest === 'kindergarten') return GradeLevel.K;
    const n = Number(rest);
    if (n >= 1 && n <= 8) return `Grade ${n}` as GradeLevel;
    return null;
  }

  const onlyDigit = normalized.match(/^(\d+)$/);
  if (onlyDigit) {
    const gradeNumber = Number(onlyDigit[1]);
    if (gradeNumber >= 1 && gradeNumber <= 8) return `Grade ${gradeNumber}` as GradeLevel;
    return null;
  }

  return null;
};

export const fetchStandardsFromApi = async (): Promise<Standard[]> => {
  const response = await fetch('/api/standards');
  if (!response.ok) {
    const bodyText = await response.text();
    throw new Error(`Failed to fetch standards: ${response.status} ${bodyText}`);
  }

  const payload = (await response.json()) as StandardsApiResponse;
  return (payload.standards || [])
    .map((row): Standard | null => {
      const mappedGrade = mapApiGradeToGradeLevel(row.grade);
      const normalizedGradeLabel = row.grade.trim();
      if (!mappedGrade && !normalizedGradeLabel) return null;
      return {
        code: row.code,
        description: row.description,
        grade: mappedGrade ?? normalizedGradeLabel,
        clarifications: row.clarifications ?? [],
        examples: row.examples ?? [],
        purposeAndStrategies: row.purposeAndStrategies ?? [],
        misconceptions: row.misconceptions ?? [],
        tieredInstruction: row.tieredInstruction ?? [],
      };
    })
    .filter((item): item is Standard => Boolean(item));
};
