import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  GraphicsAccuracyEvaluator,
  composeGraphicsAccuracyClaim,
} from "@learning-commons/evaluators";
import {
  isLcGraphicsConfigured,
  isLcGraphicsEnabled,
  resolveGoogleApiKey,
  resolveLcEvalMode,
} from "./config.ts";

export type LcGraphicsVerdict = {
  pass: boolean;
  issues: string[];
  basis?: string;
  skipped?: boolean;
};

export type LcGraphicsCheckArgs = {
  imageBase64: string;
  mimeType: string;
  claim: string;
  env?: NodeJS.ProcessEnv;
  /**
   * When true, treat a configured Graphics Accuracy miss as fail even if
   * LC_EVAL_MODE is shadow (used for AI illustration figures).
   */
  forceFail?: boolean;
  /** Injected for unit tests. */
  evaluate?: (imagePath: string, claim: string) => Promise<{ is_correct: boolean; basis?: string; reasoning?: string }>;
};

const extensionForMime = (mime: string): string => {
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  return "jpg";
};

export const buildLcGraphicsClaim = (args: {
  kind: "question" | "slide";
  text?: string;
  title?: string;
  visualIntent?: string;
  visualDescription?: string;
  correctAnswer?: string;
}): string => {
  if (args.kind === "question" && args.text && args.correctAnswer) {
    return composeGraphicsAccuracyClaim(args.text, args.correctAnswer);
  }
  const parts = [
    args.kind === "slide" ? args.title : args.text,
    args.visualDescription || args.visualIntent,
  ].filter(Boolean);
  return parts.join("\n").slice(0, 12_000) || "The figure matches the math claim.";
};

/**
 * Second-opinion raster check after local FIGURE_VERIFY.
 * Returns pass=true when LC is off/shadow-disabled/unconfigured (never blocks then).
 * In fail mode (LC_EVAL_MODE=fail + LC_GRAPHICS_ENABLED), a false verdict fails the figure.
 */
export const checkLcGraphicsAccuracy = async (
  args: LcGraphicsCheckArgs,
): Promise<LcGraphicsVerdict> => {
  const env = args.env ?? process.env;
  const mode = resolveLcEvalMode(env);
  if (mode === "off" || !isLcGraphicsEnabled(env)) {
    return { pass: true, issues: [], skipped: true };
  }
  if (!args.evaluate && !isLcGraphicsConfigured(env)) {
    console.warn("[lc-graphics] skipped: set GEMINI_API_KEY or GOOGLE_API_KEY");
    return { pass: true, issues: [], skipped: true };
  }

  const claim = String(args.claim || "").trim().slice(0, 12_000);
  if (!claim || !args.imageBase64) {
    return { pass: true, issues: [], skipped: true };
  }

  const dir = await mkdtemp(join(tmpdir(), "lc-gfx-"));
  const imagePath = join(dir, `figure.${extensionForMime(args.mimeType)}`);
  try {
    await writeFile(imagePath, Buffer.from(args.imageBase64, "base64"));

    const result = args.evaluate
      ? await args.evaluate(imagePath, claim)
      : (
          await new GraphicsAccuracyEvaluator({
            googleApiKey: resolveGoogleApiKey(env),
          }).evaluate({ image_paths: [imagePath], claim })
        ).result;

    const ok = Boolean(result.is_correct);
    const issues = ok
      ? []
      : [
          `Figure accuracy check: ${result.basis || "not supported"}`,
          // "defective" verdicts are about the image itself (clipped/garbled text); keep the list.
          ...(((result as { defects?: unknown[] }).defects ?? []).length
            ? [`Image defects: ${((result as { defects?: unknown[] }).defects ?? []).map((d) => (typeof d === "string" ? d : JSON.stringify(d))).join("; ").slice(0, 300)}`]
            : []),
          ...(result.reasoning ? [String(result.reasoning).slice(0, 400)] : []),
        ];

    const treatAsFail = mode === "fail" || Boolean(args.forceFail);
    if (!treatAsFail) {
      console.info(`[lc-graphics] shadow pass=${ok} basis=${result.basis || "?"}`);
      return { pass: true, issues, basis: result.basis, skipped: false };
    }

    return { pass: ok, issues, basis: result.basis, skipped: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn("[lc-graphics] error:", message);
    // Never hard-fail generation on LC transport errors.
    return { pass: true, issues: [`Figure accuracy check unavailable: ${message}`], skipped: true };
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
};
