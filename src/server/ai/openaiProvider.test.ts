import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildOpenAIChatMessages,
  callOpenAIProvider,
  modelSupportsCustomTemperature,
  stripNullsDeep,
} from './openaiProvider';

const okJson = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });

describe('buildOpenAIChatMessages', () => {
  it('passes plain strings through as a user message', () => {
    expect(buildOpenAIChatMessages('hello')).toEqual([{ role: 'user', content: 'hello' }]);
  });

  it('turns Gemini-style parts into OpenAI text and image_url content', () => {
    const messages = buildOpenAIChatMessages({
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: 'QUJD' } },
        { text: 'Describe the picture.' },
      ],
    });
    expect(messages).toEqual([
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,QUJD' } },
          { type: 'text', text: 'Describe the picture.' },
        ],
      },
    ]);
  });

  it('joins text-only parts into one string instead of JSON-stringifying them', () => {
    expect(buildOpenAIChatMessages({ parts: [{ text: 'a' }, { text: 'b' }] })).toEqual([
      { role: 'user', content: 'a\n\nb' },
    ]);
  });
});

describe('modelSupportsCustomTemperature', () => {
  it('rejects reasoning-family models', () => {
    expect(modelSupportsCustomTemperature('gpt-5.5')).toBe(false);
    expect(modelSupportsCustomTemperature('gpt-5.4-mini')).toBe(false);
    expect(modelSupportsCustomTemperature('o4-mini')).toBe(false);
  });

  it('allows classic chat models', () => {
    expect(modelSupportsCustomTemperature('gpt-4o-mini')).toBe(true);
    expect(modelSupportsCustomTemperature('gpt-4.1')).toBe(true);
  });
});

describe('stripNullsDeep', () => {
  it('removes null object fields recursively but keeps array positions meaningful', () => {
    expect(
      stripNullsDeep({ a: 1, b: null, c: { d: null, e: 'x' }, f: [{ g: null, h: 2 }, null] }),
    ).toEqual({ a: 1, c: { e: 'x' }, f: [{ h: 2 }] });
  });
});

describe('callOpenAIProvider', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('omits temperature and sends reasoning_effort for gpt-5 models, then strips nulls from JSON', async () => {
    const calls: any[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init: RequestInit) => {
        calls.push({ url, body: JSON.parse(String(init.body)) });
        return okJson({ choices: [{ message: { content: '{"title":"T","imagePrompt":null}' } }], usage: {} });
      }),
    );

    const res = await callOpenAIProvider(
      'k',
      {
        task: 'slides',
        contents: 'make slides',
        config: { responseSchema: { type: 'OBJECT', properties: { title: { type: 'STRING' } } } },
      },
      'gpt-5.5',
    );

    expect(calls[0].body.temperature).toBeUndefined();
    expect(calls[0].body.reasoning_effort).toBe('medium');
    expect(calls[0].body.response_format.type).toBe('json_schema');
    expect(JSON.parse(String(res.text))).toEqual({ title: 'T' });
  });

  it('uses OPENAI_BASE_URL when configured', async () => {
    vi.stubEnv('OPENAI_BASE_URL', 'https://proxy.example.com/v1/');
    const urls: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        urls.push(url);
        return okJson({ choices: [{ message: { content: 'ok' } }] });
      }),
    );
    await callOpenAIProvider('k', { task: 'analysis', contents: 'x' }, 'gpt-4o-mini');
    expect(urls[0]).toBe('https://proxy.example.com/v1/chat/completions');
  });

  it('retries once on 429 and then succeeds', async () => {
    let n = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        n += 1;
        if (n === 1) return new Response('{"error":"rate"}', { status: 429, headers: { 'retry-after': '0' } });
        return okJson({ choices: [{ message: { content: 'ok' } }] });
      }),
    );
    const res = await callOpenAIProvider('k', { task: 'analysis', contents: 'x' }, 'gpt-4o-mini');
    expect(n).toBe(2);
    expect(res.text).toBe('ok');
  });

  it('does not retry on 400', async () => {
    let n = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        n += 1;
        return new Response('{"error":"bad"}', { status: 400 });
      }),
    );
    await expect(callOpenAIProvider('k', { task: 'analysis', contents: 'x' }, 'gpt-4o-mini')).rejects.toThrow(/400/);
    expect(n).toBe(1);
  });

  it('maps image aspect ratio to size and reports the real mime type', async () => {
    const bodies: any[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init: RequestInit) => {
        bodies.push(JSON.parse(String(init.body)));
        return okJson({ data: [{ b64_json: 'QUJD' }], output_format: 'jpeg' });
      }),
    );
    const res = await callOpenAIProvider(
      'k',
      { task: 'image', contents: { parts: [{ text: 'draw' }] }, config: { imageConfig: { aspectRatio: '16:9' } } },
      'gpt-image-2',
    );
    expect(bodies[0].size).toBe('1536x1024');
    expect(res.candidates[0].content.parts[0].inlineData).toEqual({ mimeType: 'image/jpeg', data: 'QUJD' });
  });
});
