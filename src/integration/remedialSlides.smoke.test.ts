/**
 * Live remedial-slides smoke test (slide text + slide figures through the running server).
 *
 * Requires: `npm run dev` on port 3000 and provider API keys in .env (loaded by server).
 *
 * RUN_SLIDES_SMOKE=1 SMOKE_OUT_DIR=after npx vitest run src/integration/remedialSlides.smoke.test.ts --testTimeout=900000
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { generateRemedialSlides } from '../services/aiService';
import { FIXTURE_ANALYSIS, FIXTURE_QUESTIONS, FIXTURE_RESULTS, FIXTURE_STANDARD } from '../dev/remedialFixtures';

const RUN = process.env.RUN_SLIDES_SMOKE === '1';

describe.skipIf(!RUN)('remedial slides smoke (RUN_SLIDES_SMOKE=1)', () => {
  beforeAll(() => {
    const BASE = process.env.SMOKE_SERVER_URL ?? 'http://127.0.0.1:3000';
    const orig = globalThis.fetch.bind(globalThis);
    globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      if (url.startsWith('/')) return orig(BASE + url, init);
      return orig(input as RequestInfo, init);
    };
  });

  it(
    'generates a remedial deck for a fixture gap analysis',
    async () => {
      const started = Date.now();
      const slides = await generateRemedialSlides(
        FIXTURE_STANDARD,
        FIXTURE_ANALYSIS,
        FIXTURE_QUESTIONS,
        FIXTURE_RESULTS,
      );
      const elapsedMs = Date.now() - started;
      expect(slides.length).toBeGreaterThan(0);

      const outDir = resolve(process.cwd(), 'smoke-output', process.env.SMOKE_OUT_DIR || 'slides', 'slides');
      mkdirSync(outDir, { recursive: true });

      const stripped = slides.map((slide, i) => {
        const { generatedImageBase64, ...rest } = slide;
        if (typeof generatedImageBase64 === 'string') {
          const m = /^data:([^;]+);base64,(.+)$/s.exec(generatedImageBase64);
          if (m) {
            const name = `slide${i + 1}.${m[1].includes('png') ? 'png' : 'jpg'}`;
            writeFileSync(resolve(outDir, name), Buffer.from(m[2], 'base64'));
            return { ...rest, imageFile: name };
          }
        }
        return rest;
      });
      writeFileSync(resolve(outDir, 'slides.json'), JSON.stringify({ elapsedMs, slides: stripped }, null, 2), 'utf8');
    },
    900_000,
  );
});
