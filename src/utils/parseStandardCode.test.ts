import { describe, expect, it } from 'vitest';
import { parseStandardCodeMeta } from './parseStandardCode';

describe('parseStandardCodeMeta', () => {
  it('parses elementary standard', () => {
    expect(parseStandardCodeMeta('MA.4.FR.1.3')).toEqual({
      gradeToken: '4',
      strandCode: 'FR',
    });
  });

  it('parses kindergarten', () => {
    expect(parseStandardCodeMeta('MA.K.NSO.1.1')).toEqual({
      gradeToken: 'K',
      strandCode: 'NSO',
    });
  });

  it('parses high school code', () => {
    expect(parseStandardCodeMeta('MA.912.C.1.4')).toEqual({
      gradeToken: '912',
      strandCode: 'C',
    });
  });

  it('returns nulls for invalid prefix', () => {
    expect(parseStandardCodeMeta('X.4.FR.1.3')).toEqual({
      gradeToken: null,
      strandCode: null,
    });
  });
});
