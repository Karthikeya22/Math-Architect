/**
 * Figure audit: does every question's picture match its question and explanation?
 *
 * Runs the app's real quiz pipeline (src/services/aiService.ts) against a running
 * dev server, for a sample of standards across every grade x strand, then asks the
 * Learning Commons Graphics Accuracy evaluator to judge each published figure.
 * Writes one summary table so fixes go to the worst rows first.
 *
 * Usage (dev server must be running on :3000):
 *   npx tsx scripts/audit-figures.ts [--grades K,1,5,912] [--strands NSO,FR] [--per-cell 1]
 *       [--questions 3] [--seed 0] [--concurrency 2] [--limit 10] [--no-judge] [--base http://localhost:3000]
 *
 * Output: reports/figure-audit/<timestamp>/{summary.md, results.json, img/*.png}
 * Costs real model calls: one quiz + up to `questions` figures + one judge call per figure.
 */
import "../src/server/loadEnv.ts";
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer";
import { checkLcGraphicsAccuracy, buildLcGraphicsClaim } from "../src/server/lc/graphicsAccuracy.ts";

const arg = (name: string, fallback = ""): string => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? String(process.argv[i + 1] ?? "") : fallback;
};
const flag = (name: string) => process.argv.includes(`--${name}`);
const list = (raw: string) => raw.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);

const BASE = arg("base", "http://localhost:3000");
const GRADES = list(arg("grades"));
const STRANDS = list(arg("strands"));
/** Exact grade x strand cells, e.g. --cells "1 DP,912 F" (re-audit just the rows that failed). */
const CELLS = list(arg("cells")).map((c) => c.replace(/\s+/g, "|"));
const PER_CELL = Math.max(1, Number(arg("per-cell", "1")));
const QUESTIONS = Math.max(1, Number(arg("questions", "3")));
const SEED = Number(arg("seed", "0")) || 0;
const CONCURRENCY = Math.max(1, Number(arg("concurrency", "2")));
const LIMIT = Number(arg("limit", "0")) || Infinity;
const JUDGE = !flag("no-judge");

// The client service uses relative URLs; point them at the dev server.
const realFetch = globalThis.fetch;
globalThis.fetch = ((input: any, init?: any) =>
  realFetch(typeof input === "string" && input.startsWith("/") ? `${BASE}${input}` : input, init)) as typeof fetch;

const { generateQuiz } = await import("../src/services/aiService.ts");
const { fetchStandardsFromApi } = await import("../src/services/standardsService.ts");
const { hasUsableQuizFigure } = await import("../src/utils/hasUsableQuizFigure.ts");
const { buildStudentSolutionWalkthrough } = await import("../src/utils/buildStudentSolutionWalkthrough.ts");

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const outDir = path.join(process.cwd(), "reports", "figure-audit", stamp);
fs.mkdirSync(path.join(outDir, "img"), { recursive: true });

type Row = {
  code: string; grade: string; strand: string; q: number; stem: string; answer: string;
  figure: "exact" | "ai_image" | "none"; status: string; visualType: string;
  verdict: "pass" | "fail" | "unjudged" | "-"; reasons: string[]; img?: string; ms: number;
};
const rows: Row[] = [];
const errors: Array<{ code: string; error: string }> = [];

const meta = (code: string) => {
  const m = code.match(/^MA\.(K|\d+)\.([A-Z]+)\./);
  return { grade: m?.[1] ?? "?", strand: m?.[2] ?? "?" };
};

// Deterministic sample: PER_CELL standards from every grade x strand cell, rotated by --seed.
const standards = await fetchStandardsFromApi();
const cells = new Map<string, typeof standards>();
for (const s of standards) {
  const { grade, strand } = meta(s.code);
  if (GRADES.length && !GRADES.includes(grade)) continue;
  if (STRANDS.length && !STRANDS.includes(strand)) continue;
  if (CELLS.length && !CELLS.includes(`${grade}|${strand}`)) continue;
  const key = `${grade}|${strand}`;
  cells.set(key, [...(cells.get(key) || []), s]);
}
const picked = [...cells.values()]
  .flatMap((cell) => Array.from({ length: Math.min(PER_CELL, cell.length) }, (_, i) => cell[(SEED + i * 7 + Math.floor(cell.length / 2)) % cell.length]))
  .slice(0, LIMIT);
console.log(`[audit] ${picked.length} standards x ${QUESTIONS} questions -> ${outDir}`);

const config = {
  questionCount: QUESTIONS, difficulty: "Medium", mode: "item-bank",
  questionTypes: { multipleChoice: true, trueFalse: false, fillInBlank: false },
  focusAreas: { wordProblems: true, visualQuestions: true, realWorld: false },
  adaptiveEnabled: false, adaptivePolicy: "hybrid_guardrails", startDifficulty: "Medium",
  sourcePolicy: "mixed_with_limits", featureFlags: { adaptiveV1Enabled: false },
};

const browser = await puppeteer.launch({ headless: true });
const toPng = async (svg: string): Promise<string> => {
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 800, height: 480 });
    await page.setContent(`<html><body style="margin:0;background:#fff"><div style="width:800px">${svg}</div></body></html>`);
    await page.evaluate(() => { const el = document.querySelector("svg"); if (el) el.setAttribute("width", "800"); });
    const el = await page.$("svg");
    return Buffer.from(await (el ?? page).screenshot({ type: "png" })).toString("base64");
  } finally {
    await page.close();
  }
};

/** Explanation steps that point at a picture the student cannot see. */
const FIGURE_WORDS = /\b(?:shaded|picture|figure|diagram|shown|look at the|on the (?:graph|grid|number line|table|chart|model))\b/i;
const judgeEnv = { ...process.env, LC_EVAL_MODE: "fail", LC_GRAPHICS_ENABLED: "true" };

const save = () => fs.writeFileSync(path.join(outDir, "results.json"), JSON.stringify({ rows, errors }, null, 1));

const runOne = async (s: (typeof picked)[number]) => {
  const { grade, strand } = meta(s.code);
  const t0 = Date.now();
  try {
    const quiz = await generateQuiz(s, config);
    const ms = Date.now() - t0;
    for (const [i, q] of (quiz.questions as any[]).entries()) {
      const shown = hasUsableQuizFigure(q);
      const answer = String(q.options?.[q.correctAnswerIndex] ?? "");
      const row: Row = {
        code: s.code, grade, strand, q: i + 1, stem: String(q.text || ""), answer,
        figure: !shown ? "none" : q.generatedImageBase64 ? "ai_image" : "exact",
        status: String(q.figureStatus || "-"), visualType: String(q.visualSpec?.visualType || "-"),
        verdict: "-", reasons: [], ms,
      };
      const steps = buildStudentSolutionWalkthrough(q).map((st: any) => `${st.title} ${st.body}`).join(" ");
      if (!shown && FIGURE_WORDS.test(steps)) row.reasons.push("explanation refers to a figure that is not shown");
      if (!shown && /\b(?:look at the|shown below|in the picture)\b/i.test(row.stem)) row.reasons.push("stem refers to a figure that is not shown");
      if (!shown && q.figureIssues?.length) row.reasons.push(`no figure: ${String(q.figureIssues[0]).slice(0, 160)}`);
      if (shown) {
        const b64 = q.generatedImageBase64
          ? String(q.generatedImageBase64).replace(/^data:image\/\w+;base64,/, "")
          : await toPng(String(q.visual));
        const file = `${s.code}_q${i + 1}.png`;
        fs.writeFileSync(path.join(outDir, "img", file), Buffer.from(b64, "base64"));
        row.img = `img/${file}`;
        if (JUDGE) {
          const v = await checkLcGraphicsAccuracy({
            imageBase64: b64, mimeType: "image/png", env: judgeEnv,
            claim: buildLcGraphicsClaim({ kind: "question", text: row.stem, correctAnswer: answer }),
          });
          row.verdict = v.skipped ? "unjudged" : v.pass ? "pass" : "fail";
          if (!v.pass || v.skipped) row.reasons.push(...v.issues.map((x) => x.slice(0, 200)));
        }
      }
      rows.push(row);
    }
  } catch (e: any) {
    errors.push({ code: s.code, error: String(e?.message || e).slice(0, 300) });
  }
  save();
  console.log(`[audit] ${rows.length} items, ${errors.length} errors (${s.code} ${Math.round((Date.now() - t0) / 1000)}s)`);
};

const queue = [...picked];
await Promise.all(Array.from({ length: CONCURRENCY }, async () => { while (queue.length) await runOne(queue.shift()!); }));
await browser.close();

// Summary: one row per grade x strand, worst first, then every problem item.
const bad = (r: Row) => r.verdict === "fail" || r.reasons.some((x) => /refers to a figure/.test(x));
const groups = new Map<string, Row[]>();
for (const r of rows) groups.set(`${r.grade} ${r.strand}`, [...(groups.get(`${r.grade} ${r.strand}`) || []), r]);
const pct = (n: number, d: number) => (d ? `${Math.round((100 * n) / d)}%` : "-");
const table = [...groups.entries()]
  .map(([k, rs]) => {
    const shown = rs.filter((r) => r.figure !== "none");
    return { k, n: rs.length, shown: shown.length, pass: shown.filter((r) => r.verdict === "pass").length, bad: rs.filter(bad).length };
  })
  .sort((a, b) => b.bad - a.bad || a.shown / a.n - b.shown / b.n);
const total = rows.length, shownAll = rows.filter((r) => r.figure !== "none").length, badAll = rows.filter(bad).length;
const md = [
  `# Figure audit ${stamp}`,
  "",
  `${picked.length} standards, ${total} questions, ${errors.length} quiz errors. Figures on ${shownAll}/${total} (${pct(shownAll, total)}); ` +
    `judge pass ${rows.filter((r) => r.verdict === "pass").length}/${shownAll}; problems ${badAll}.`,
  "",
  "| grade strand | questions | with figure | judge pass | problems |",
  "|---|---|---|---|---|",
  ...table.map((t) => `| ${t.k} | ${t.n} | ${t.shown} (${pct(t.shown, t.n)}) | ${t.pass}/${t.shown} | ${t.bad} |`),
  "",
  "## Problems",
  ...rows.filter(bad).map((r) => `- **${r.code} q${r.q}** [${r.figure}/${r.visualType}] ${r.stem.slice(0, 140)} — ${r.reasons.join("; ")}${r.img ? ` (${r.img})` : ""}`),
  "",
  "## No figure (why)",
  ...rows.filter((r) => r.figure === "none").map((r) => `- ${r.code} q${r.q}: ${r.reasons.find((x) => x.startsWith("no figure")) || r.status}`),
  ...(errors.length ? ["", "## Quiz errors", ...errors.map((e) => `- ${e.code}: ${e.error}`)] : []),
].join("\n");
fs.writeFileSync(path.join(outDir, "summary.md"), md);
console.log(`[audit] done -> ${path.join(outDir, "summary.md")}`);
