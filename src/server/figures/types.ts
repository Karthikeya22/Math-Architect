import type { GenerateRequest, GenerateResponse } from "../ai/types.ts";

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
};

export type FigureStatus = "verified" | "unverified" | "rejected" | "skipped" | "error";

export type FigureResult = {
  status: FigureStatus;
  /** `data:<mime>;base64,...` when status is verified or unverified. */
  image?: string;
  attempts: number;
  issues: string[];
  brief?: FigureBrief;
  imageModel?: string;
  elapsedMs: number;
};
