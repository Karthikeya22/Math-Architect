import { describe, expect, it } from 'vitest';
import { getDefaultProviderForTask, isFallbackEnabled, resolveDefaultModel } from './config';

describe('AI config defaults', () => {
  it('routes every task to OpenAI unless a task is explicitly set to gemini', () => {
    expect(getDefaultProviderForTask('quiz', {})).toBe('openai');
    expect(getDefaultProviderForTask('slides', {})).toBe('openai');
    expect(getDefaultProviderForTask('image', {})).toBe('openai');
    expect(getDefaultProviderForTask('vision', {})).toBe('openai');
    expect(getDefaultProviderForTask('quiz', { AI_PROVIDER_QUIZ: 'gemini' })).toBe('gemini');
  });

  it('uses the balanced OpenAI tier by default', () => {
    expect(resolveDefaultModel('quiz', 'openai', {})).toBe('gpt-5.4');
    expect(resolveDefaultModel('slides', 'openai', {})).toBe('gpt-5.5');
    expect(resolveDefaultModel('analysis', 'openai', {})).toBe('gpt-5.4-mini');
    expect(resolveDefaultModel('vision', 'openai', {})).toBe('gpt-5.4-mini');
    expect(resolveDefaultModel('image', 'openai', {})).toBe('gpt-image-2');
  });

  it('prefers per-task env overrides over the family-wide override', () => {
    const env = { OPENAI_TEXT_MODEL: 'gpt-4.1', OPENAI_SLIDES_MODEL: 'gpt-5.4' };
    expect(resolveDefaultModel('slides', 'openai', env)).toBe('gpt-5.4');
    expect(resolveDefaultModel('quiz', 'openai', env)).toBe('gpt-4.1');
    expect(resolveDefaultModel('image', 'openai', { OPENAI_IMAGE_MODEL: 'gpt-image-1.5' })).toBe('gpt-image-1.5');
  });

  it('keeps cross-provider fallback off unless enabled', () => {
    expect(isFallbackEnabled({})).toBe(false);
    expect(isFallbackEnabled({ AI_FALLBACK_ENABLED: 'true' })).toBe(true);
  });
});
