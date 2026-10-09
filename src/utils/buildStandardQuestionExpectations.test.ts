import { describe, expect, it } from 'vitest';
import { buildStandardQuestionExpectations } from './buildStandardQuestionExpectations';

describe('buildStandardQuestionExpectations', () => {
  it('returns a short highlight list for a fraction standard', () => {
    const profile = buildStandardQuestionExpectations({
      standardCode: 'MA.4.FR.1.1',
      description: 'Plot, order and compare fractions with unlike denominators.',
    });

    expect(profile.highlights).toHaveLength(3);
    expect(profile.highlights[0]).toContain('Plot, order and compare fractions');
    expect(profile.highlights[1]).toContain('Multiple-choice');
    expect(profile.highlights[2]).toContain('fraction bars');
  });

  it('keeps the list short when no materials are available', () => {
    const profile = buildStandardQuestionExpectations({
      standardCode: 'MA.6.DP.1.2',
      description: 'Develop and interpret box plots.',
    });

    expect(profile.highlights).toHaveLength(3);
    expect(profile.highlights[0]).toContain('box plots');
    expect(profile.highlights[2]).toContain('bar charts');
  });
});
