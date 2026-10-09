import { generateWithGuards } from "../ai/generateWithGuards.ts";
import { composeFigureImagePrompt, requestFigureBrief } from "./figureBrief.ts";
import { verifyFigure } from "./figureVerifier.ts";
import type { FigureInput, FigureResult, GenerateFn } from "./types.ts";

const extractImage = (response: any): { data: string; mimeType: string; model?: string } | null => {
  const parts = response?.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part?.inlineData?.data) {
      return { data: part.inlineData.data, mimeType: part.inlineData.mimeType || "image/png", model: response?.model };
    }
  }
  return null;
};

const resolveMaxAttempts = (env: NodeJS.ProcessEnv): number => {
  const n = Number(env.FIGURE_MAX_ATTEMPTS);
  return Number.isInteger(n) && n >= 1 && n <= 4 ? n : 2;
};

const isVerificationEnabled = (env: NodeJS.ProcessEnv): boolean =>
  String(env.FIGURE_VERIFY ?? "true").trim().toLowerCase() !== "false";

const errorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error));

/**
 * Plan, render and check one figure. A figure is only returned as `verified` when the vision
 * reviewer passes it; after the last failed attempt the caller gets `rejected` and no image.
 */
export const generateFigure = async (
  input: FigureInput,
  generate: GenerateFn = generateWithGuards,
  env: NodeJS.ProcessEnv = process.env,
): Promise<FigureResult> => {
  const started = Date.now();
  const done = (result: Omit<FigureResult, "elapsedMs">): FigureResult => ({
    ...result,
    elapsedMs: Date.now() - started,
  });

  let brief;
  try {
    brief = await requestFigureBrief(input, generate);
  } catch (error) {
    return done({ status: "error", attempts: 0, issues: [`Figure plan failed: ${errorMessage(error)}`] });
  }
  if (!brief.needsFigure) {
    return done({ status: "skipped", attempts: 0, issues: brief.skipReason ? [brief.skipReason] : [], brief });
  }

  const maxAttempts = resolveMaxAttempts(env);
  let feedback: string[] = [];
  let attempts = 0;
  let imageModel: string | undefined;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    attempts = attempt + 1;
    let image;
    try {
      const response = await generate({
        task: "image",
        contents: { parts: [{ text: composeFigureImagePrompt(brief, input, feedback) }] },
        config: { imageConfig: { aspectRatio: "3:2" } },
        metadata: { standardCode: input.standardCode, grade: input.grade, disableFallback: true },
      });
      image = extractImage(response);
    } catch (error) {
      feedback = [`Image generation failed: ${errorMessage(error)}`];
      continue;
    }
    if (!image) {
      feedback = ["No image was returned."];
      continue;
    }
    imageModel = image.model;
    const dataUrl = `data:${image.mimeType};base64,${image.data}`;

    if (!isVerificationEnabled(env)) {
      return done({ status: "unverified", image: dataUrl, attempts, issues: [], brief, imageModel });
    }

    let verdict;
    try {
      verdict = await verifyFigure({
        input,
        brief,
        imageBase64: image.data,
        mimeType: image.mimeType,
        generate,
      });
    } catch (error) {
      return done({
        status: "rejected",
        attempts,
        issues: [`Verification unavailable: ${errorMessage(error)}`],
        brief,
        imageModel,
      });
    }
    if (verdict.pass) {
      return done({ status: "verified", image: dataUrl, attempts, issues: [], brief, imageModel });
    }
    feedback = verdict.issues;
  }

  return done({ status: "rejected", attempts, issues: feedback, brief, imageModel });
};
