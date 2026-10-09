/**
 * End-to-end OpenAI pipeline verification.
 *
 *   npx tsx scripts/verify_openai_pipeline.ts [outLabel]
 *
 * 1. Preflight: list models, tiny completion, low-quality image (never prints the key).
 * 2. Figure samples across K / G3–G5 / HS geometry (ladder + exact-count).
 * 3. Writes images, results, latency, cost estimate, and an HTML contact sheet
 *    under smoke-output/<outLabel>/ (default: after).
 */
import "../src/server/loadEnv.ts";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { generateFigure } from "../src/server/figures/generateFigure.ts";
import type { FigureInput } from "../src/server/figures/types.ts";
import { resolveDefaultModel } from "../src/server/ai/config.ts";

const outLabel = process.argv[2] || "after";
const outDir = resolve(process.cwd(), "smoke-output", outLabel);
mkdirSync(outDir, { recursive: true });

const apiKey = String(process.env.OPENAI_API_KEY || "").trim();
if (!apiKey) {
  console.error("OPENAI_API_KEY is not set.");
  process.exit(1);
}
const baseUrl = String(process.env.OPENAI_BASE_URL || "https://api.openai.com/v1")
  .trim()
  .replace(/\/+$/, "");

type Preflight = {
  modelsOk: boolean;
  modelCount: number;
  hasGpt54: boolean;
  hasGpt55: boolean;
  hasGptImage2: boolean;
  completionOk: boolean;
  completionMs: number;
  completionModel: string;
  imageOk: boolean;
  imageMs: number;
  imageModel: string;
  errors: string[];
};

async function preflight(): Promise<Preflight> {
  const result: Preflight = {
    modelsOk: false,
    modelCount: 0,
    hasGpt54: false,
    hasGpt55: false,
    hasGptImage2: false,
    completionOk: false,
    completionMs: 0,
    completionModel: resolveDefaultModel("vision", "openai"),
    imageOk: false,
    imageMs: 0,
    imageModel: resolveDefaultModel("image", "openai"),
    errors: [],
  };

  try {
    const res = await fetch(`${baseUrl}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) throw new Error(`models HTTP ${res.status}`);
    const json = (await res.json()) as { data?: Array<{ id: string }> };
    const ids = (json.data || []).map((m) => m.id);
    result.modelsOk = true;
    result.modelCount = ids.length;
    result.hasGpt54 = ids.some((id) => id.includes("gpt-5.4"));
    result.hasGpt55 = ids.some((id) => id.includes("gpt-5.5"));
    result.hasGptImage2 = ids.some((id) => id.includes("gpt-image-2"));
  } catch (e) {
    result.errors.push(`models: ${e instanceof Error ? e.message : String(e)}`);
  }

  try {
    const started = Date.now();
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: result.completionModel,
        messages: [{ role: "user", content: 'Reply with exactly: {"ok":true}' }],
        max_completion_tokens: 32,
      }),
    });
    result.completionMs = Date.now() - started;
    if (!res.ok) throw new Error(`completion HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = json.choices?.[0]?.message?.content || "";
    result.completionOk = /ok/i.test(text);
    if (!result.completionOk) result.errors.push(`completion unexpected: ${text.slice(0, 120)}`);
  } catch (e) {
    result.errors.push(`completion: ${e instanceof Error ? e.message : String(e)}`);
  }

  try {
    const started = Date.now();
    const res = await fetch(`${baseUrl}/images/generations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: result.imageModel,
        prompt: "A simple blue circle on a white background. No text.",
        size: "1024x1024",
        quality: "low",
        output_format: "jpeg",
        output_compression: 80,
      }),
    });
    result.imageMs = Date.now() - started;
    if (!res.ok) throw new Error(`image HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const json = (await res.json()) as { data?: Array<{ b64_json?: string }> };
    const b64 = json.data?.[0]?.b64_json;
    result.imageOk = Boolean(b64 && b64.length > 100);
    if (result.imageOk && b64) {
      writeFileSync(resolve(outDir, "preflight-image.jpg"), Buffer.from(b64, "base64"));
    } else {
      result.errors.push("image: empty b64_json");
    }
  } catch (e) {
    result.errors.push(`image: ${e instanceof Error ? e.message : String(e)}`);
  }

  return result;
}

const SAMPLES: Array<{ id: string; band: string; input: FigureInput }> = [
  {
    id: "k-stars",
    band: "K",
    input: {
      kind: "question",
      grade: "Kindergarten",
      text: "Count the stars in the box. How many stars are there?",
      options: ["7", "8", "9", "10"],
      correctAnswerIndex: 1,
      visualIntent: "Eight stars arranged in two rows inside a box.",
    },
  },
  {
    id: "g3-base-ten",
    band: "G3",
    input: {
      kind: "question",
      grade: "Grade 3",
      text: "What is the standard form of the expression 8,000 + 70 + 5?",
      options: ["875", "8,705", "8,075", "8,750"],
      correctAnswerIndex: 2,
      visualIntent: "Place-value blocks or labeled place columns for thousands, tens, and ones.",
    },
  },
  {
    id: "g4-fraction-bar",
    band: "G4",
    input: {
      kind: "question",
      grade: "Grade 4",
      text: "A bar is split into 6 equal parts and 4 of the parts are shaded. What fraction of the bar is shaded?",
      options: ["4/6", "6/4", "2/6", "4/10"],
      correctAnswerIndex: 0,
      visualIntent: "One bar divided into 6 equal parts with exactly 4 shaded.",
    },
  },
  {
    id: "g5-number-line",
    band: "G5",
    input: {
      kind: "question",
      grade: "Grade 5",
      text: "On a number line from 0 to 1, a point is marked at 3/4. Which point is at 3/4?",
      options: ["A", "B", "C", "D"],
      correctAnswerIndex: 2,
      visualIntent: "Number line 0 to 1 with four equal tick marks; one unlabeled point near three-quarters.",
    },
  },
  {
    id: "g8-ladder",
    band: "HS-geo",
    input: {
      kind: "question",
      grade: "Grade 8",
      text: "A ladder leans against a wall. The foot of the ladder is 6 feet from the wall and the top reaches 8 feet up the wall. How long is the ladder?",
      options: ["9 feet", "10 feet", "12 feet", "14 feet"],
      correctAnswerIndex: 1,
      visualIntent: "Right triangle with legs labeled 6 ft and 8 ft; hypotenuse unlabeled.",
    },
  },
  {
    id: "hs-parallel-lines",
    band: "HS-geo",
    input: {
      kind: "question",
      grade: "Grade 9",
      text: "Lines l and m are parallel and are intersected by a transversal t. Two alternate interior angles are represented by the expressions (4x + 10)° and (6x - 20)°. What is the value of x?",
      options: ["5", "15", "19", "30"],
      correctAnswerIndex: 1,
      visualIntent: "Two parallel lines cut by a transversal with the two alternate interior angles marked but not evaluated.",
    },
  },
];

/** Rough USD estimates for planning; not billing truth. */
const COST = {
  briefPerCall: 0.002,
  visionPerCall: 0.003,
  imageMedium: 0.04,
  imageLow: 0.02,
};

async function main() {
  console.log(`Writing to ${outDir}`);
  console.log("--- Preflight ---");
  const pf = await preflight();
  console.log(
    `models=${pf.modelsOk ? "ok" : "FAIL"} count=${pf.modelCount} gpt-5.4=${pf.hasGpt54} gpt-5.5=${pf.hasGpt55} gpt-image-2=${pf.hasGptImage2}`,
  );
  console.log(
    `completion=${pf.completionOk ? "ok" : "FAIL"} ${pf.completionMs}ms model=${pf.completionModel}`,
  );
  console.log(`image=${pf.imageOk ? "ok" : "FAIL"} ${pf.imageMs}ms model=${pf.imageModel}`);
  if (pf.errors.length) console.error("preflight errors:", pf.errors.join(" | "));
  if (!pf.modelsOk || !pf.completionOk || !pf.imageOk) {
    writeFileSync(resolve(outDir, "preflight.json"), JSON.stringify(pf, null, 2), "utf8");
    process.exit(1);
  }

  console.log("--- Figure samples ---");
  const startedAll = Date.now();
  const results = [];
  for (const sample of SAMPLES) {
    const started = Date.now();
    const result = await generateFigure(sample.input);
    const elapsedMs = Date.now() - started;
    let imageFile: string | undefined;
    const match = result.image ? /^data:([^;]+);base64,(.+)$/s.exec(result.image) : null;
    if (match) {
      imageFile = `${sample.id}.${match[1].includes("png") ? "png" : "jpg"}`;
      writeFileSync(resolve(outDir, imageFile), Buffer.from(match[2], "base64"));
    }
    const { image: _image, ...rest } = result;
    const row = { ...sample, imageFile, elapsedMs, ...rest };
    results.push(row);
    console.log(
      `${sample.id.padEnd(20)} ${result.status.padEnd(10)} attempts=${result.attempts} ${elapsedMs}ms ${result.issues.join(" | ")}`,
    );
  }

  const totalMs = Date.now() - startedAll;
  const verified = results.filter((r) => r.status === "verified").length;
  const unverified = results.filter((r) => r.status === "unverified").length;
  const rejected = results.filter((r) => r.status === "rejected").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const imageCalls = results.reduce((n, r) => n + (r.attempts || 0), 0);
  const visionCalls = imageCalls; // one vision check per attempt when verify is on
  const briefCalls = results.length;
  const estimatedCostUsd =
    briefCalls * COST.briefPerCall +
    visionCalls * COST.visionPerCall +
    imageCalls * COST.imageMedium +
    COST.imageLow; // preflight image

  const summary = {
    outLabel,
    generatedAt: new Date().toISOString(),
    preflight: pf,
    totals: {
      samples: results.length,
      verified,
      unverified,
      rejected,
      skipped,
      totalMs,
      imageCalls,
      visionCalls,
      briefCalls,
      estimatedCostUsd: Number(estimatedCostUsd.toFixed(3)),
    },
    costAssumptions: COST,
    results: results.map(({ input, ...r }) => ({
      ...r,
      text: input.text,
      grade: input.grade,
    })),
  };

  writeFileSync(resolve(outDir, "preflight.json"), JSON.stringify(pf, null, 2), "utf8");
  writeFileSync(resolve(outDir, "results.json"), JSON.stringify(summary, null, 2), "utf8");

  const cards = results
    .map((r) => {
      const img = r.imageFile
        ? `<img src="${r.imageFile}" alt="${r.id}" />`
        : `<div class="empty">no image (${r.status})</div>`;
      return `<article class="card ${r.status}">
  <header><strong>${r.id}</strong> <span>${r.status}</span> <span>${r.attempts} att · ${r.elapsedMs}ms</span></header>
  <p class="stem">${escapeHtml(r.input.text)}</p>
  ${img}
  <p class="issues">${escapeHtml((r.issues || []).join("; ") || "—")}</p>
</article>`;
    })
    .join("\n");

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>OpenAI pipeline — ${outLabel}</title>
<style>
  body { font-family: ui-sans-serif, system-ui, sans-serif; margin: 24px; background: #f6f5f8; color: #1c1830; }
  h1 { font-size: 1.4rem; margin: 0 0 8px; }
  .meta { color: #5b5670; margin-bottom: 24px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; }
  .card { background: #fff; border: 1px solid #e4e0ec; border-radius: 12px; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
  .card header { display: flex; flex-wrap: wrap; gap: 8px; align-items: baseline; font-size: 0.85rem; }
  .card.verified header span:first-of-type { color: #15803d; font-weight: 700; }
  .card.rejected header span:first-of-type { color: #b42318; font-weight: 700; }
  .card.unverified header span:first-of-type { color: #a16207; font-weight: 700; }
  .stem { font-size: 0.9rem; margin: 0; }
  img { width: 100%; height: auto; border-radius: 8px; border: 1px solid #eee; background: #fff; }
  .empty { aspect-ratio: 3/2; display: grid; place-items: center; background: #faf9fc; border: 1px dashed #ccc; border-radius: 8px; color: #888; }
  .issues { font-size: 0.8rem; color: #6b6783; margin: 0; }
</style>
</head>
<body>
  <h1>OpenAI figure pipeline — ${escapeHtml(outLabel)}</h1>
  <p class="meta">${summary.totals.verified}/${summary.totals.samples} verified ·
    ${summary.totals.rejected} rejected · ${summary.totals.skipped} skipped ·
    ${(summary.totals.totalMs / 1000).toFixed(1)}s ·
    est. $${summary.totals.estimatedCostUsd.toFixed(2)}
    (brief+vision+image; rough)</p>
  <div class="grid">
${cards}
  </div>
</body>
</html>`;
  writeFileSync(resolve(outDir, "contact-sheet.html"), html, "utf8");

  console.log("--- Summary ---");
  console.log(
    `${verified}/${results.length} verified, ${rejected} rejected, ${skipped} skipped, ${(totalMs / 1000).toFixed(1)}s, est $${estimatedCostUsd.toFixed(2)}`,
  );
  console.log(`Contact sheet: ${resolve(outDir, "contact-sheet.html")}`);

  // Soft gate: majority should verify; exact-count / ladder failures are reported, not fatal here.
  if (verified + unverified < Math.ceil(results.length / 2)) {
    console.error("Fewer than half of samples produced a usable figure.");
    process.exit(2);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
