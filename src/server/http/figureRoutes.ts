import type { Express } from "express";
import { generateFigure } from "../figures/generateFigure.ts";
import type { FigureInput, FigureResult } from "../figures/types.ts";

const str = (value: unknown): string => (typeof value === "string" ? value : "");

const strList = (value: unknown): string[] =>
  Array.isArray(value) ? value.map((v) => String(v ?? "")).filter((v) => v.trim()) : [];

export const parseQuestionFigureBody = (body: any): FigureInput | null => {
  const question = body?.question ?? {};
  const text = str(question.text).trim();
  if (!text) return null;
  return {
    kind: "question",
    grade: str(body?.grade) || "K-12",
    standardCode: str(body?.standardCode) || undefined,
    text,
    options: strList(question.options),
    correctAnswerIndex: Number.isInteger(question.correctAnswerIndex) ? question.correctAnswerIndex : undefined,
    visualIntent: str(question.visualIntent) || undefined,
    imagePrompt: str(question.imagePrompt) || undefined,
  };
};

export const parseSlideFigureBody = (body: any): FigureInput | null => {
  const slide = body?.slide ?? {};
  const title = str(slide.title).trim();
  if (!title) return null;
  return {
    kind: "slide",
    grade: str(body?.grade) || "K-12",
    standardCode: str(body?.standardCode) || undefined,
    title,
    keyPoints: strList(slide.keyPoints),
    visualDescription: str(slide.visualDescription) || undefined,
    imagePrompt: str(slide.imagePrompt) || undefined,
  };
};

const logFigure = (input: FigureInput, result: FigureResult) => {
  const label = input.kind === "question" ? input.text : input.title;
  console.info(
    `[figure] kind=${input.kind} status=${result.status} attempts=${result.attempts} ms=${result.elapsedMs} ` +
      `model=${result.imageModel || "-"} "${label.slice(0, 70)}"` +
      (result.issues.length ? ` issues=${JSON.stringify(result.issues)}` : ""),
  );
};

export const registerFigureRoutes = (app: Express) => {
  const handle =
    (parse: (body: any) => FigureInput | null, missing: string) => async (req: any, res: any) => {
      const input = parse(req.body);
      if (!input) return res.status(400).json({ error: missing });
      try {
        const result = await generateFigure(input);
        logFigure(input, result);
        return res.json(result);
      } catch (error: any) {
        console.error(`Error in figure route (${input.kind}):`, error);
        return res.status(500).json({ error: error?.message || "Failed to generate figure." });
      }
    };

  app.post("/api/figures/question", handle(parseQuestionFigureBody, "question.text is required."));
  app.post("/api/figures/slide", handle(parseSlideFigureBody, "slide.title is required."));
};
