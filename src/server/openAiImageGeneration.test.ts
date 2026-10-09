import { describe, expect, it } from 'vitest';
import { buildOpenAiImagesGenerationsBody } from './openAiImageGeneration';

describe('buildOpenAiImagesGenerationsBody', () => {
  it('defaults to 1024x1024, medium quality and compressed jpeg for gpt-image models', () => {
    const body = buildOpenAiImagesGenerationsBody('gpt-image-1', 'a red circle', {});
    expect(body).toEqual({
      model: 'gpt-image-1',
      prompt: 'a red circle',
      size: '1024x1024',
      quality: 'medium',
      output_format: 'jpeg',
      output_compression: 85,
    });
  });

  it('respects OPENAI_IMAGE_SIZE and OPENAI_IMAGE_QUALITY when valid', () => {
    const body = buildOpenAiImagesGenerationsBody('gpt-image-1', 'x', {
      OPENAI_IMAGE_SIZE: '1536x1024',
      OPENAI_IMAGE_QUALITY: 'high',
    });
    expect(body.size).toBe('1536x1024');
    expect(body.quality).toBe('high');
  });

  it('falls back to defaults when env values are invalid', () => {
    const body = buildOpenAiImagesGenerationsBody('gpt-image-1', 'x', {
      OPENAI_IMAGE_SIZE: '9999x9999',
      OPENAI_IMAGE_QUALITY: 'ultra',
      OPENAI_IMAGE_FORMAT: 'gif',
    });
    expect(body.size).toBe('1024x1024');
    expect(body.quality).toBe('medium');
    expect(body.output_format).toBe('jpeg');
  });

  it('does not send gpt-image-only fields for non-gpt-image models', () => {
    const body = buildOpenAiImagesGenerationsBody('dall-e-3', 'x', {
      OPENAI_IMAGE_QUALITY: 'low',
    });
    expect(body.quality).toBeUndefined();
    expect(body.output_format).toBeUndefined();
  });

  it('maps a requested aspect ratio to the closest supported size', () => {
    expect(buildOpenAiImagesGenerationsBody('gpt-image-2', 'x', {}, { aspectRatio: '16:9' }).size).toBe('1536x1024');
    expect(buildOpenAiImagesGenerationsBody('gpt-image-2', 'x', {}, { aspectRatio: '3:2' }).size).toBe('1536x1024');
    expect(buildOpenAiImagesGenerationsBody('gpt-image-2', 'x', {}, { aspectRatio: '9:16' }).size).toBe('1024x1536');
    expect(buildOpenAiImagesGenerationsBody('gpt-image-2', 'x', {}, { aspectRatio: '1:1' }).size).toBe('1024x1024');
  });

  it('lets the request aspect ratio win over the env default size', () => {
    const body = buildOpenAiImagesGenerationsBody(
      'gpt-image-2',
      'x',
      { OPENAI_IMAGE_SIZE: '1024x1024' },
      { aspectRatio: '16:9' },
    );
    expect(body.size).toBe('1536x1024');
  });

  it('keeps png without compression when requested', () => {
    const body = buildOpenAiImagesGenerationsBody('gpt-image-2', 'x', { OPENAI_IMAGE_FORMAT: 'png' });
    expect(body.output_format).toBe('png');
    expect(body.output_compression).toBeUndefined();
  });
});
