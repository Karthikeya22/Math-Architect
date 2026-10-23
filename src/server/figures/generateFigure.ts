import { generateWithGuards } from "../ai/generateWithGuards.ts";
import { buildLcGraphicsClaim, checkLcGraphicsAccuracy } from "../lc/graphicsAccuracy.ts";
import { buildFigureContract, checkContractCoverage, extractSvgText } from "./figureContract.ts";
import { buildItemClaim } from "./itemClaim.ts";
import { composeFigureImagePrompt, requestFigureBrief } from "./figureBrief.ts";
import { extractFigureSpec } from "./extractFigureSpec.ts";
import { extractGivenQuantities } from "./givenQuantities.ts";
import { renderClaimSvg } from "./renderClaimSvg.ts";
import { renderInstrumentSvg } from "./renderInstrumentSvg.ts";
import { verifyFigure } from "./figureVerifier.ts";
import { validateVisualSpecAgainstQuestion } from "../visualSpecAnswerAlignment.ts";
import { getPreferredVisualTypes } from "../../utils/standardVisualPreferences.ts";
import type { ItemClaim } from "./itemClaim.ts";
import type { FigureCoverage } from "../../types.ts";
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
 * The contract proves the SVG matches the spec; it cannot prove the spec
 * matches the stem. A reconciler can derive a schema-valid but off-topic spec
 * (e.g. an array_model from a fraction stem), so gate every publish path on
 * stem↔spec alignment here. A misaligned spec is never shown: it becomes
 * needs_review so students get the text-only item and teachers get the reason.
 */
const specAlignmentIssue = (claim: ItemClaim, standardCode: string | undefined): string | null => {
  if (claim.kind !== "question") return null;
  const spec = claim.visualSpec;
  if (!spec || typeof spec !== "object") return null;
  // Stem-keyword reconcilers run after the sanitizer's policy check and can attach
  // a model this standard never uses (a ten-frame for "7/2 in word form"); re-check here.
  const allowed = getPreferredVisualTypes(standardCode);
  if (allowed.length && spec.visualType && !allowed.includes(spec.visualType)) {
    return `${spec.visualType} is not a model this standard uses (${allowed.join(", ")}).`;
  }
  return validateVisualSpecAgainstQuestion({
    text: claim.stemText,
    options: claim.options,
    correctAnswerIndex:
      typeof claim.correctAnswerIndex === "number" && Number.isInteger(claim.correctAnswerIndex)
        ? claim.correctAnswerIndex
        : -1,
    visualSpec: spec,
  });
};

/**
 * Question figures first try an exact spec extracted from the finished question
 * (one small model call); if that is unsure, unrenderable or rejected by the gates
 * below, the original pipeline runs unchanged, so this never does worse than before.
 */
export const generateFigure = async (
  input: FigureInput,
  generate: GenerateFn = generateWithGuards,
  env: NodeJS.ProcessEnv = process.env,
): Promise<FigureResult> => {
  if (input.kind === "question") {
    const extracted = await extractFigureSpec(input, generate, env);
    // Only an SVG-renderable spec: anything else would fall into the paid image path.
    if (extracted && renderClaimSvg(extracted)) {
      const locked = await generateClaimFigure({ ...input, visualSpec: extracted, specLocked: true }, generate, env);
      if (locked.status === "verified" && locked.svg) return { ...locked, visualSpec: extracted };
    }
  }
  return generateClaimFigure(input, generate, env);
};

/**
 * Claim-locked figure pipeline: deterministic SVG first for exact/geometric claims;
 * AI raster only for illustration, gated by local verify + LC Graphics Accuracy (forceFail).
 * Accurate or omit — never return a figure we are not confident matches.
 */
const generateClaimFigure = async (
  input: FigureInput,
  generate: GenerateFn,
  env: NodeJS.ProcessEnv,
): Promise<FigureResult> => {
  const started = Date.now();
  const done = (result: Omit<FigureResult, "elapsedMs">): FigureResult => ({
    ...result,
    elapsedMs: Date.now() - started,
  });

  const claim = buildItemClaim(input);
  const contract = buildFigureContract(input, claim);
  // Product decision (2026-10-22): every question gets a picture; when no exact model
  // fits it goes to the verified AI illustration path, which gives up after two failed tries.
  const everyQuestion =
    input.kind === "question" && String(env.FIGURE_EVERY_QUESTION ?? "true").trim().toLowerCase() !== "false";

  if (!contract.required && !everyQuestion) {
    return done({
      status: "skipped",
      visualPath: "figure_omitted",
      attempts: 0,
      issues: [contract.reason],
      contract,
      coverage: { required: [], present: [], missing: [], leaks: [], pct: 100 },
    });
  }

  // Publish gate: never render a figure whose spec disagrees with the stem.
  const alignmentIssue = specAlignmentIssue(claim, input.standardCode);
  // Every question gets a picture: a rejected model spec is dropped (and locked so reconcilers
  // cannot rebuild it) and the item goes to the verified illustration path instead.
  if (alignmentIssue && everyQuestion && input.kind === "question" && !(input.specLocked && !input.visualSpec)) {
    return generateClaimFigure({ ...input, visualSpec: null, specLocked: true }, generate, env);
  }
  if (alignmentIssue) {
    return done({
      status: "needs_review",
      visualPath: "figure_needs_review",
      attempts: 0,
      issues: [
        `Figure spec does not match the stem: ${alignmentIssue}`,
        ...(contract.reason ? [contract.reason] : []),
      ],
      contract,
      coverage: { required: contract.givenLabels, present: [], missing: contract.givenLabels, leaks: [], pct: 0 },
    });
  }

  // Scale readings need an exact tick; AI images approximate by ~half a unit,
  // which changes the answer. Render those deterministically and skip the AI
  // path entirely.
  if (contract.instrumentScale) {
    const instrumentSvg = renderInstrumentSvg(claim);
    if (instrumentSvg) {
      const coverage = checkContractCoverage(contract, extractSvgText(instrumentSvg));
      if (coverage.pct === 100) {
        return done({
          status: "verified",
          svg: instrumentSvg,
          visualPath: "deterministic_svg",
          attempts: 0,
          issues: [],
          contract,
          coverage,
        });
      }
    }
  }

  // No math model fits a stem that is about numbers. Boxes of those numbers
  // (the old "given quantities" figure) explained nothing and often implied the
  // wrong operation, and an image model would only approximate them: omit.
  if (!everyQuestion && claim.visualClass === "none" && extractGivenQuantities(claim.stemText).length > 0) {
    return done({
      status: "skipped",
      visualPath: "figure_omitted",
      attempts: 0,
      issues: ["No math model fits this numeric stem; text-only is clearer than a value-box figure."],
      contract,
      coverage: { required: [], present: [], missing: [], leaks: [], pct: 100 },
    });
  }

  if (claim.visualClass === "exact" || claim.visualClass === "geometric") {
    const svg = renderClaimSvg(claim.visualSpec);
    if (svg) {
      const coverage = checkContractCoverage(contract, extractSvgText(svg));
      if (coverage.pct === 100) {
        return done({
          status: "verified",
          svg,
          visualPath: "deterministic_svg",
          attempts: 0,
          issues: [],
          contract,
          coverage,
        });
      }
      return done({
        status: "needs_review",
        visualPath: "figure_needs_review",
        attempts: 0,
        issues: [
          `Deterministic figure is missing required labels: ${coverage.missing.join(", ") || "(unknown)"}.`,
          ...(coverage.leaks?.length ? [`Figure shows forbidden content: ${coverage.leaks.join(", ")}.`] : []),
        ],
        contract,
        coverage,
      });
    }
    // Exact/geometric without a renderable SVG: do not invent pixels.
    return done({
      status: "needs_review",
      visualPath: "figure_needs_review",
      attempts: 0,
      issues: ["No confident deterministic figure for this exact claim.", contract.reason],
      contract,
      coverage: { required: contract.givenLabels, present: [], missing: contract.givenLabels, leaks: [], pct: 0 },
    });
  }

  // No deterministic skeleton matched. Instead of giving up, draw the figure
  // directly from the question via prompt generation ("skeleton miss"). The
  // verifier, contract coverage, and LC accuracy check still gate publication,
  // so an unmatched question only ships when the rendered image is complete.
  const usedPromptFallback = claim.visualClass === "none";

  // illustration path
  let brief;
  try {
    brief = await requestFigureBrief(input, generate);
  } catch (error) {
    return done({
      status: "needs_review",
      attempts: 0,
      issues: [`Figure plan failed: ${errorMessage(error)}`],
      contract,
      coverage: { required: contract.givenLabels, present: [], missing: contract.givenLabels, leaks: [], pct: 0 },
      visualPath: "figure_needs_review",
    });
  }
  // The contract outranks the brief: if the stem needs a figure, keep trying
  // even when the planner would skip it. Never silently drop a required figure.
  if (!brief.needsFigure) {
    brief = {
      needsFigure: true,
      skipReason: "",
      figureType: contract.family === "illustration" ? "illustration" : "diagram",
      subject: contract.altText,
      mustShow: contract.mustShow,
      labels: contract.givenLabels,
      layout: "Clear, uncluttered diagram with every required label visible.",
      mustNotShow: contract.mustNotShow,
    };
  }

  // Prefer claim mustShow/mustNot when brief is empty-ish.
  if (claim.mustShow.length && (!brief.mustShow || brief.mustShow.length === 0)) {
    brief = { ...brief, mustShow: claim.mustShow };
  }
  if (claim.mustNotShow.length) {
    brief = {
      ...brief,
      mustNotShow: [...new Set([...(brief.mustNotShow || []), ...claim.mustNotShow])],
    };
  }
  if (contract.givenLabels.length) {
    brief = {
      ...brief,
      labels: [...new Set([...(brief.labels || []), ...contract.givenLabels])],
      mustShow: [...new Set([...(brief.mustShow || []), ...contract.givenLabels])],
    };
  }
  if (contract.mustNotShow.length) {
    brief = {
      ...brief,
      mustNotShow: [...new Set([...(brief.mustNotShow || []), ...contract.mustNotShow])],
    };
  }

  // A measurement item is only answerable if the drawing is measurable: the
  // object must span the exact scale interval that encodes the reading. The
  // answer is construction data for the renderer, never a printed label.
  const measuredAnswer =
    input.kind === "question" &&
    Array.isArray(input.options) &&
    Number.isInteger(input.correctAnswerIndex) &&
    input.correctAnswerIndex! >= 0 &&
    input.correctAnswerIndex! < input.options.length
      ? String(input.options[input.correctAnswerIndex!] ?? "").trim()
      : "";
  if (contract.instrumentScale && measuredAnswer) {
    brief = {
      ...brief,
      mustShow: [
        ...new Set([
          ...(brief.mustShow || []),
          `the measured quantity is exactly ${measuredAnswer}: the object or indicator aligns exactly with that mark on the scale, starting at the instrument's zero/start mark, drawn so the student can read it`,
        ]),
      ],
      mustNotShow: [
        ...new Set([
          ...(brief.mustNotShow || []),
          `a separate written label, callout or arrow stating the reading ${measuredAnswer}`,
        ]),
      ],
    };
  }

  const maxAttempts = resolveMaxAttempts(env);
  let feedback: string[] = [];
  let attempts = 0;
  let imageModel: string | undefined;
  let lastCoverage: FigureCoverage | undefined;

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
      if (contract.givenLabels.length) {
        return done({
          status: "needs_review",
          attempts,
          issues: ["Figure verification is disabled, so required labels could not be checked."],
          brief,
          imageModel,
          contract,
          coverage: { required: contract.givenLabels, present: [], missing: contract.givenLabels, leaks: [], pct: 0 },
          visualPath: "figure_needs_review",
        });
      }
      return done({
        status: "unverified",
        image: dataUrl,
        attempts,
        issues: [],
        brief,
        imageModel,
        contract,
        visualPath: usedPromptFallback ? "openai_image_fallback_unverified" : "openai_image_unverified",
      });
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
        status: "needs_review",
        attempts,
        issues: [`Verification unavailable: ${errorMessage(error)}`],
        brief,
        imageModel,
        contract,
        coverage: { required: contract.givenLabels, present: [], missing: contract.givenLabels, leaks: [], pct: 0 },
        visualPath: "figure_needs_review",
      });
    }
    if (!verdict.pass) {
      feedback = verdict.issues;
      continue;
    }

    // Prefer the verifier's exact visible text; prose `observed` is a fallback
    // for old mocks and for providers that omit the array.
    const observedTokens =
      Array.isArray(verdict.visibleText) && verdict.visibleText.length
        ? verdict.visibleText
        : verdict.observed
          ? [verdict.observed]
          : brief.labels || [];
    const coverage = checkContractCoverage(contract, observedTokens);
    lastCoverage = coverage;
    if (coverage.pct !== 100) {
      feedback = [
        ...(coverage.missing.length
          ? [`Missing required labels: ${coverage.missing.join(", ")}.`]
          : []),
        ...(coverage.leaks?.length ? [`Figure shows forbidden content: ${coverage.leaks.join(", ")}.`] : []),
      ];
      continue;
    }

    const lcClaim = buildLcGraphicsClaim({
      kind: claim.kind,
      text: claim.kind === "question" ? claim.stemText : undefined,
      title: claim.kind === "slide" ? claim.stemText : undefined,
      visualIntent: claim.visualIntent,
      visualDescription: claim.visualIntent,
      correctAnswer: claim.correctAnswerText,
    });
    const lc = await checkLcGraphicsAccuracy({
      imageBase64: image.data,
      mimeType: image.mimeType,
      claim: lcClaim,
      env,
      forceFail: true,
    });
    if (!lc.pass) {
      feedback = lc.issues.length ? lc.issues : ["Figure accuracy check rejected the figure."];
      continue;
    }
    return done({
      status: "verified",
      image: dataUrl,
      attempts,
      issues: [],
      brief,
      imageModel,
      contract,
      coverage,
      visualPath: usedPromptFallback
        ? attempts > 1
          ? "openai_image_fallback_retry"
          : "openai_image_fallback"
        : attempts > 1
          ? "openai_image_retry"
          : "openai_image",
    });
  }

  return done({
    status: "needs_review",
    attempts,
    issues: feedback.length
      ? feedback
      : [
          usedPromptFallback
            ? "No deterministic skeleton matched; prompt-generated figure did not pass verification."
            : "Could not produce a complete figure after all attempts.",
        ],
    brief,
    imageModel,
    contract,
    coverage:
      lastCoverage ||
      {
        required: contract.givenLabels,
        present: [],
        missing: contract.givenLabels,
        leaks: [],
        pct: 0,
      },
    visualPath: "figure_needs_review",
  });
};
