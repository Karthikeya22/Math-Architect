import { GradeLevel, type CoherenceMapRouteState } from '../types';

const ROUTE_PREFIX = '/coherence-map';

const GRADE_SEGMENTS: Array<{ segment: string; grade: GradeLevel }> = [
  { segment: 'k', grade: GradeLevel.K },
  { segment: 'g1', grade: GradeLevel.G1 },
  { segment: 'g2', grade: GradeLevel.G2 },
  { segment: 'g3', grade: GradeLevel.G3 },
  { segment: 'g4', grade: GradeLevel.G4 },
  { segment: 'g5', grade: GradeLevel.G5 },
  { segment: 'g6', grade: GradeLevel.G6 },
  { segment: 'g7', grade: GradeLevel.G7 },
  { segment: 'g8', grade: GradeLevel.G8 },
];

const gradeToSegment = new Map(GRADE_SEGMENTS.map((entry) => [entry.grade, entry.segment]));
const segmentToGrade = new Map(GRADE_SEGMENTS.map((entry) => [entry.segment, entry.grade]));

export const emptyCoherenceMapRouteState = (): CoherenceMapRouteState => ({
  band: null,
  grade: null,
  category: null,
  domain: null,
  root: null,
  standard: null,
  standardIndex: null,
});

export function parseCoherenceMapPath(pathname: string): CoherenceMapRouteState {
  if (!pathname.startsWith(ROUTE_PREFIX)) return emptyCoherenceMapRouteState();
  const raw = pathname.slice(ROUTE_PREFIX.length).replace(/^\/+/, '');
  if (!raw) return emptyCoherenceMapRouteState();
  const segments = raw.split('/').map((segment) => decodeURIComponent(segment));
  const first = (segments[0] ?? '').toLowerCase();

  if (first === 'k8' || first === '912') {
    const band = first as 'k8' | '912';
    if (band === 'k8') {
      const grade = segmentToGrade.get((segments[1] ?? '').toLowerCase()) ?? null;
      const category = segments[2] || null;
      const standard = segments[3] || null;
      return {
        band,
        grade,
        category,
        domain: null,
        root: standard,
        standard,
        standardIndex: null,
      };
    }
    const category = segments[1] || null;
    const standard = segments[2] || null;
    return {
      band,
      grade: GradeLevel.G912,
      category,
      domain: null,
      root: standard,
      standard,
      standardIndex: null,
    };
  }

  const grade = segmentToGrade.get(first) ?? null;
  const category = segments[1] || null;
  const domain = segments[2] || null;
  const root = segments[3] || null;
  const standard = segments[4] || null;
  const standardIndexRaw = segments[5];
  const numericStandardIndex =
    standardIndexRaw && /^\d+$/.test(standardIndexRaw) ? Number(standardIndexRaw) : null;

  return {
    band: grade ? 'k8' : null,
    grade,
    category,
    domain,
    root,
    standard,
    standardIndex: numericStandardIndex,
  };
}

export function buildCoherenceMapPath(route: CoherenceMapRouteState): string {
  const segments: string[] = [];
  if (route.band === '912') {
    segments.push('912');
    if (route.category) segments.push(route.category);
    if (route.standard) segments.push(route.standard);
  } else if (route.band === 'k8' || route.grade) {
    segments.push('k8');
    if (route.grade) {
      const gradeSegment = gradeToSegment.get(route.grade);
      if (gradeSegment) segments.push(gradeSegment);
    }
    if (route.category) segments.push(route.category);
    if (route.standard) segments.push(route.standard);
  } else {
    if (route.grade) {
      const gradeSegment = gradeToSegment.get(route.grade);
      if (gradeSegment) segments.push(gradeSegment);
    }
    if (route.category) segments.push(route.category);
    if (route.domain) segments.push(route.domain);
    if (route.root) segments.push(route.root);
    if (route.standard) segments.push(route.standard);
    if (typeof route.standardIndex === 'number') segments.push(String(route.standardIndex));
  }

  if (segments.length === 0) return ROUTE_PREFIX;
  return `${ROUTE_PREFIX}/${segments.map((segment) => encodeURIComponent(segment)).join('/')}`;
}
