/**
 * Live quiz image smoke test (quiz text + configured image provider).
 *
 * Requires: `npm run dev` on port 3000 and provider API keys in .env (loaded by server).
 *
 * RUN_IMAGE_SMOKE=1 npx vitest run src/integration/gradeQuizImages.smoke.test.ts --testTimeout=600000
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { generateQuiz } from '../services/aiService';

const RUN = process.env.RUN_IMAGE_SMOKE === '1';

type RawStandard = {
  code: string;
  description: string;
  grade: string;
  clarifications?: string[];
  purpose_and_strategies?: string[];
  misconceptions?: string[];
  tiered_instruction?: string[];
};

function loadStandards(): RawStandard[] {
  const path = resolve(process.cwd(), 'data/processed/standards.json');
  return JSON.parse(readFileSync(path, 'utf8')) as RawStandard[];
}

function toQuizStandard(row: RawStandard, gradeLabel: string) {
  return {
    code: row.code,
    description: row.description,
    grade: gradeLabel,
    clarifications: row.clarifications ?? [],
    examples: [] as string[],
    purposeAndStrategies: row.purpose_and_strategies ?? [],
    misconceptions: row.misconceptions ?? [],
    tieredInstruction: row.tiered_instruction ?? [],
  };
}

function decodeDataUrl(dataUrl: string): { mime: string; buf: Buffer } | null {
  const m = /^data:([^;]+);base64,(.+)$/s.exec(dataUrl.trim());
  if (!m) return null;
  return { mime: m[1], buf: Buffer.from(m[2], 'base64') };
}

describe.skipIf(!RUN)('grade quiz image smoke (RUN_IMAGE_SMOKE=1)', () => {
  const imageRequests: Array<{ url: string; body: unknown }> = [];

  beforeAll(() => {
    const BASE = process.env.SMOKE_SERVER_URL ?? 'http://127.0.0.1:3000';
    const orig = globalThis.fetch.bind(globalThis);
    globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.href
            : input.url;
      if (url.startsWith('/')) {
        try {
          const body = JSON.parse(String(init?.body || '{}'));
          if (body?.task === 'image' || url.startsWith('/api/figures')) {
            imageRequests.push({ url, body });
          }
        } catch {
          /* non-JSON body */
        }
        return orig(BASE + url, init);
      }
      return orig(input as RequestInfo, init);
    };
  });

  const smokeConfig = {
    questionCount: 2,
    difficulty: 'Medium' as const,
    mode: 'item-bank' as const,
    questionTypes: [] as string[],
    focusAreas: [] as string[],
    adaptiveEnabled: false,
    adaptivePolicy: 'hybrid_guardrails' as const,
    startDifficulty: 'Medium' as const,
    sourcePolicy: 'ai_freedom' as const,
    featureFlags: { adaptiveV1Enabled: false },
  };

  it(
    'generates quizzes with visuals for K, Grade 3, Grade 5, and HS (Grade 9 band)',
    async () => {
      const rows = loadStandards();
      const findCode = (code: string) => rows.find((r) => r.code === code);
      const findGrade = (g: string) => rows.find((r) => r.grade === g && r.code.startsWith(`MA.${g}.`));

      const picks = [
        { key: 'K', standard: findCode('MA.K.NSO.1.1'), gradeLabel: 'Kindergarten' },
        { key: 'grade3', standard: findGrade('3'), gradeLabel: 'Grade 3' },
        { key: 'grade5', standard: findGrade('5'), gradeLabel: 'Grade 5' },
        {
          key: 'grade9_hs',
          standard: findCode('MA.912.GR.1.1'),
          gradeLabel: 'Grade 9',
        },
      ];

      for (const p of picks) {
        expect(p.standard, `missing standard for ${p.key}`).toBeTruthy();
      }

      const outRoot = resolve(
        process.cwd(),
        'smoke-output',
        process.env.SMOKE_OUT_DIR || 'grade-quiz-images',
      );
      mkdirSync(outRoot, { recursive: true });

      const summary: Record<
        string,
        {
          standardCode: string;
          gradeLabel: string;
          questions: Array<{
            text: string;
            options: string[];
            correctAnswerIndex?: number;
            visualPath?: string;
            figureStatus?: string;
            figureIssues?: string[];
            imageFile?: string;
          }>;
        }
      > = {};

      for (const { key, standard, gradeLabel } of picks) {
        expect(standard).toBeTruthy();
        const quizStd = toQuizStandard(standard!, gradeLabel);
        const quiz = await generateQuiz(quizStd, smokeConfig);
        expect(quiz.questions.length).toBeGreaterThan(0);

        const dir = resolve(outRoot, key);
        mkdirSync(dir, { recursive: true });

        summary[key] = {
          standardCode: standard!.code,
          gradeLabel,
          questions: [],
        };

        quiz.questions.forEach((q: any, i: number) => {
          const row: (typeof summary)[string]['questions'][number] = {
            text: String(q.text || ''),
            options: Array.isArray(q.options) ? q.options.map(String) : [],
            correctAnswerIndex: q.correctAnswerIndex,
            visualPath: q.visualPath,
            figureStatus: q.figureStatus,
            figureIssues: q.figureIssues,
          };
          const dataUrl = q.generatedImageBase64 as string | undefined;
          if (typeof dataUrl === 'string' && dataUrl.startsWith('data:')) {
            const decoded = decodeDataUrl(dataUrl);
            if (decoded) {
              const ext = decoded.mime.includes('png') ? 'png' : 'jpg';
              const name = `q${i + 1}.${ext}`;
              writeFileSync(resolve(dir, name), decoded.buf);
              row.imageFile = name;
            }
          } else if (typeof q.visual === 'string' && q.visual.includes('<svg')) {
            const name = `q${i + 1}.svg`;
            writeFileSync(resolve(dir, name), q.visual, 'utf8');
            row.imageFile = name;
          }
          summary[key].questions.push(row);
        });

        writeFileSync(resolve(dir, 'meta.json'), JSON.stringify(summary[key], null, 2), 'utf8');
      }

      writeFileSync(resolve(outRoot, 'summary.json'), JSON.stringify(summary, null, 2), 'utf8');
      writeFileSync(
        resolve(outRoot, 'image-requests.json'),
        JSON.stringify(imageRequests, null, 2),
        'utf8',
      );

      // Minimal assertions so the run fails loudly if nothing rendered
      for (const key of Object.keys(summary)) {
        const hadRaster = summary[key].questions.some((q) => q.imageFile);
        const hadSvg = summary[key].questions.some((q) => q.visualPath === 'deterministic_svg');
        expect(
          hadRaster || hadSvg,
          `${key}: expected at least one raster image or deterministic SVG`,
        ).toBe(true);
      }
    },
    600_000,
  );
});
