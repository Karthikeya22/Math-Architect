import type { GenerateRequest, GenerateResponse } from "../ai/types.ts";
import type { FigureCoverage, VisualSpec } from "../../types.ts";
import type { FigureContract } from "./figureContract.ts";

export type GenerateFn = (request: GenerateRequest) => Promise<GenerateResponse>;

export type QuestionFigureInput = {
  kind: "question";
  grade: string;
  standardCode?: string;
  text: string;
  options?: string[];
  correctAnswerIndex?: number;
  visualIntent?: string;
  imagePrompt?: string;
  visualSpec?: VisualSpec | null;
  /** Spec came from extractFigureSpec: draw it as is, without stem-keyword reconcilers. */
  specLocked?: boolean;
};

export type SlideFigureInput = {
  kind: "slide";
  grade: string;
  standardCode?: string;
  title: string;
  keyPoints?: string[];
  visualDescription?: string;
  imagePrompt?: string;
};

export type FigureInput = QuestionFigureInput | SlideFigureInput;

export type FigureBrief = {
  needsFigure: boolean;
  skipReason: string;
  figureType: "diagram" | "illustration";
  subject: string;
  mustShow: string[];
  labels: string[];
  layout: string;
  mustNotShow: string[];
};

export type FigureVerdict = {
  pass: boolean;
  issues: string[];
  observed: string;
  /** Exact text the verifier could read in the image, used for contract coverage. */
  visibleText: string[];
};

export type FigureStatus = "verified" | "unverified" | "rejected" | "skipped" | "needs_review" | "error";

export type FigureResult = {
  status: FigureStatus;
  /** `data:<mime>;base64,...` when status is verified or unverified. */
  image?: string;
  /** Deterministic SVG markup when the claim rendered without AI. */
  svg?: string;
  /** How the figure was produced (e.g. deterministic_svg, openai_image). */
  visualPath?: string;
  attempts: number;
  issues: string[];
  brief?: FigureBrief;
  imageModel?: string;
  /** Contract the figure was checked against (teacher/debug only). */
  contract?: FigureContract;
  /** Required-label coverage. Published figures must be 100. */
  coverage?: FigureCoverage;
  /** The spec actually drawn, when it came from extractFigureSpec (client hints/steps must use it). */
  visualSpec?: VisualSpec;
  elapsedMs: number;
};
