import type { VisualSpec } from "../../types.ts";
import { prepareQuestionVisualFields } from "../../utils/prepareQuestionVisual.ts";
import { classifyClaim, type VisualClass } from "./classifyClaim.ts";
import type { FigureInput } from "./types.ts";

export type ItemClaim = {
  kind: "question" | "slide";
  grade: string;
  standardCode?: string;
  stemText: string;
  options: string[];
  correctAnswerIndex?: number;
  correctAnswerText?: string;
  visualIntent?: string;
  visualSpec?: VisualSpec | null;
  visualClass: VisualClass;
  mustShow: string[];
  mustNotShow: string[];
};

const deriveMustShow = (claim: Omit<ItemClaim, "visualClass" | "mustShow" | "mustNotShow">): string[] => {
  const bits: string[] = [];
  if (claim.correctAnswerText) bits.push(`keyed answer value: ${claim.correctAnswerText}`);
  if (claim.visualIntent) bits.push(claim.visualIntent);
  if (claim.visualSpec?.visualType) bits.push(`visualType ${claim.visualSpec.visualType}`);
  return bits;
};

/**
 * Lock stem, keyed answer, and repaired visualSpec into one claim for the figure cycle.
 */
export const buildItemClaim = (input: FigureInput): ItemClaim => {
  if (input.kind === "slide") {
    const base = {
      kind: "slide" as const,
      grade: input.grade,
      standardCode: input.standardCode,
      stemText: input.title,
      options: [],
      visualIntent: input.visualDescription || input.imagePrompt,
      visualSpec: null as VisualSpec | null,
    };
    const mustShow = deriveMustShow(base);
    const mustNotShow = ["option letters", "the correct multiple-choice letter"];
    const visualClass = classifyClaim(base);
    return { ...base, visualClass, mustShow, mustNotShow };
  }

  const options = Array.isArray(input.options) ? input.options.map((o) => String(o ?? "")) : [];
  const correctAnswerIndex =
    typeof input.correctAnswerIndex === "number" && Number.isInteger(input.correctAnswerIndex)
      ? input.correctAnswerIndex
      : undefined;
  const correctAnswerText =
    correctAnswerIndex !== undefined && correctAnswerIndex >= 0 && correctAnswerIndex < options.length
      ? String(options[correctAnswerIndex] ?? "").trim() || undefined
      : undefined;

  const scratch: {
    text: string;
    options: string[];
    correctAnswerIndex?: number;
    visualSpec?: VisualSpec | null;
    visualIntent?: string;
    imagePrompt?: string;
  } = {
    text: input.text,
    options,
    correctAnswerIndex,
    visualSpec: input.visualSpec ?? null,
    visualIntent: input.visualIntent,
    imagePrompt: input.imagePrompt,
  };
  prepareQuestionVisualFields(scratch, { reconcile: !input.specLocked });

  const base = {
    kind: "question" as const,
    grade: input.grade,
    standardCode: input.standardCode,
    stemText: input.text,
    options,
    correctAnswerIndex,
    correctAnswerText,
    visualIntent: input.visualIntent || input.imagePrompt,
    visualSpec: scratch.visualSpec ?? null,
  };
  const mustShow = deriveMustShow(base);
  const mustNotShow = [
    "the number that is the correct answer as a label",
    "option letters A B C D",
    "words that name the correct choice",
  ];
  const visualClass = classifyClaim(base);
  return { ...base, visualClass, mustShow, mustNotShow };
};
