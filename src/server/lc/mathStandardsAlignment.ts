import { Jurisdiction, MathStandardsAlignmentEvaluator } from "@learning-commons/evaluators";
import {
  isLcAlignmentConfigured,
  resolveLcAlignLlm,
  resolveLcAlignMinRatio,
  resolveLcEvalMode,
  resolveLearningCommonsApiKey,
  type LcEvalMode,
} from "./config.ts";

export type LcAlignmentQuestionReport = {
  questionIndex: number;
  statementCode: string;
  alignedCount: number;
  totalCount: number;
  ratio: number;
  learningComponents: Array<{
    identifier: string;
    description: string;
    aligned: boolean;
    feedback: string;
  }>;
  error?: string;
};

export type LcAlignmentQuizReport = {
  mode: LcEvalMode;
  jurisdiction: string;
  statementCode: string;
  questions: LcAlignmentQuestionReport[];
};

export type AlignQuizArgs = {
  payload: any;
  statementCode: string;
  env?: NodeJS.ProcessEnv;
  /** Injected for unit tests — skips live SDK. */
  evaluateQuestion?: (questionText: string, statementCode: string) => Promise<{
    aligned_count: number;
    total_count: number;
    learning_components: Array<{
      identifier: string;
      description: string;
      aligned: boolean;
      feedback: string;
    }>;
  }>;
};

const questionText = (q: any): string => {
  const stem = String(q?.question || q?.questionText || q?.text || "").trim();
  const options = Array.isArray(q?.options)
    ? q.options.map((o: unknown, i: number) => `${String.fromCharCode(65 + i)}. ${String(o)}`).join("\n")
    : "";
  return options ? `${stem}\n${options}` : stem;
};

const createEvaluator = (env: NodeJS.ProcessEnv) => {
  const llm = resolveLcAlignLlm(env);
  if (!llm) throw new Error("No LLM key available for LC Math Standards Alignment.");
  console.info(`[lc-align] llm=${llm.label}${llm.modelOverride ? ` model=${llm.modelOverride.model}` : ""}`);
  return new MathStandardsAlignmentEvaluator({
    learningCommonsApiKey: resolveLearningCommonsApiKey(env),
    anthropicApiKey: llm.anthropicApiKey,
    openaiApiKey: llm.openaiApiKey,
    googleApiKey: llm.googleApiKey,
    modelOverride: llm.modelOverride,
  });
};

/**
 * Score quiz questions against LC Math Standards Alignment.
 * Mutates payload: attaches `_lcAlignment` summary; in fail mode drops weak questions.
 */
export const applyLcMathStandardsAlignment = async (
  args: AlignQuizArgs,
): Promise<{ report: LcAlignmentQuizReport | null; dropped: number }> => {
  const env = args.env ?? process.env;
  const mode = resolveLcEvalMode(env);
  if (mode === "off") return { report: null, dropped: 0 };

  const statementCode = String(args.statementCode || args.payload?.standardCode || "").trim();
  if (!statementCode || !Array.isArray(args.payload?.questions)) {
    return { report: null, dropped: 0 };
  }

  if (!args.evaluateQuestion && !isLcAlignmentConfigured(env)) {
    console.warn(
      "[lc-align] skipped: set LEARNING_COMMONS_API_KEY and ANTHROPIC_API_KEY (or LC_EVAL_MODE=off)",
    );
    return { report: null, dropped: 0 };
  }

  const evaluate =
    args.evaluateQuestion ||
    (async (text: string, code: string) => {
      const evaluator = createEvaluator(env);
      const { result } = await evaluator.evaluate({
        question: text.slice(0, 10_000),
        statement_code: code.slice(0, 50),
        jurisdiction: Jurisdiction.Florida,
      });
      return result;
    });

  const minRatio = resolveLcAlignMinRatio(env);
  const reports: LcAlignmentQuestionReport[] = [];
  const kept: any[] = [];
  let dropped = 0;

  for (const [index, question] of args.payload.questions.entries()) {
    if (!question || typeof question !== "object") continue;
    const text = questionText(question);
    if (!text) {
      kept.push(question);
      continue;
    }

    let report: LcAlignmentQuestionReport;
    try {
      const result = await evaluate(text, statementCode);
      const total = Number(result.total_count) || 0;
      const aligned = Number(result.aligned_count) || 0;
      const ratio = total > 0 ? aligned / total : 0;
      report = {
        questionIndex: index,
        statementCode,
        alignedCount: aligned,
        totalCount: total,
        ratio,
        learningComponents: (result.learning_components || []).map((lc) => ({
          identifier: lc.identifier,
          description: lc.description,
          aligned: Boolean(lc.aligned),
          feedback: lc.feedback,
        })),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[lc-align] question ${index + 1} failed:`, message);
      report = {
        questionIndex: index,
        statementCode,
        alignedCount: 0,
        totalCount: 0,
        ratio: 0,
        learningComponents: [],
        error: message,
      };
      // Shadow / eval errors never drop; fail mode only drops measured weak items.
      kept.push(question);
      reports.push(report);
      question._lcAlignment = report;
      continue;
    }

    reports.push(report);
    question._lcAlignment = report;

    const weak = report.totalCount > 0 && report.ratio < minRatio;
    if (mode === "fail" && weak) {
      dropped += 1;
      console.warn(
        `[lc-align] drop Q${index + 1}: ${report.alignedCount}/${report.totalCount} < ${minRatio}`,
      );
      continue;
    }
    kept.push(question);
  }

  if (mode === "fail") {
    args.payload.questions = kept;
  }

  const summary: LcAlignmentQuizReport = {
    mode,
    jurisdiction: Jurisdiction.Florida,
    statementCode,
    questions: reports,
  };
  args.payload._lcAlignment = summary;
  console.info(
    `[lc-align] mode=${mode} code=${statementCode} scored=${reports.length} dropped=${dropped}`,
  );
  return { report: summary, dropped };
};
