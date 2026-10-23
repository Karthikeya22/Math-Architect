/**
 * Join Learning Commons math learning components onto local Florida MA.* codes.
 * Additive only — never overwrites clarifications/misconceptions in standards.json.
 *
 * Requires LEARNING_COMMONS_API_KEY in .env.
 * Usage: npx tsx scripts/enrich_lc_math_components.ts [--limit N]
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadDotenv } from "dotenv";

loadDotenv();

const API = "https://api.learningcommons.org/knowledge-graph/v0";
const OUT = resolve(process.cwd(), "data/processed/lc_math_learning_components.json");
/** Client-safe copy — Vite can only import JSON under `src/`. */
const OUT_SRC = resolve(process.cwd(), "src/data/lc_math_learning_components.json");
const STANDARDS = resolve(process.cwd(), "data/processed/standards.json");

type LcRow = {
  code: string;
  caseIdentifierUUID?: string;
  statementCode?: string;
  status: string;
  learningComponents: Array<{ identifier: string; description: string }>;
};

const apiKey = String(process.env.LEARNING_COMMONS_API_KEY || "").trim();
const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : Number(process.env.LC_ENRICH_LIMIT || 0);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const lcGet = async (path: string): Promise<any> => {
  const res = await fetch(`${API}${path}`, {
    headers: { "x-api-key": apiKey, Accept: "application/json" },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status} ${path}: ${body.slice(0, 200)}`);
  }
  return res.json();
};

const fetchLcsForCode = async (code: string): Promise<LcRow> => {
  const params = new URLSearchParams({
    statementCode: code,
    jurisdiction: "Florida",
    academicSubject: "Mathematics",
    limit: "5",
  });
  const search = await lcGet(`/academic-standards/search?${params}`);
  const hits = Array.isArray(search) ? search : search?.data || [];
  if (!hits.length) {
    return { code, status: "not-found", learningComponents: [] };
  }
  const hit = hits[0];
  const uuid = hit.caseIdentifierUUID as string;
  const components: Array<{ identifier: string; description: string }> = [];
  let cursor: string | null = null;
  do {
    const q = new URLSearchParams({ limit: "100" });
    if (cursor) q.set("cursor", cursor);
    const page = await lcGet(`/academic-standards/${uuid}/learning-components?${q}`);
    for (const row of page?.data || []) {
      if (row?.identifier && row?.description) {
        components.push({ identifier: String(row.identifier), description: String(row.description) });
      }
    }
    cursor = page?.pagination?.hasMore ? page.pagination.nextCursor : null;
  } while (cursor);

  return {
    code,
    caseIdentifierUUID: uuid,
    statementCode: hit.statementCode || code,
    status: components.length ? "resolved" : "no-learning-components",
    learningComponents: components,
  };
};

const main = async () => {
  if (!apiKey) {
    const stub = {
      source: "learning-commons-knowledge-graph",
      jurisdiction: "Florida",
      generatedAt: new Date().toISOString(),
      note: "Run with LEARNING_COMMONS_API_KEY set: npm run lc:enrich",
      standards: {} as Record<string, LcRow>,
    };
    const text = JSON.stringify(stub, null, 2);
    writeFileSync(OUT, text, "utf8");
    writeFileSync(OUT_SRC, text, "utf8");
    console.error("LEARNING_COMMONS_API_KEY missing — wrote empty stub to", OUT);
    process.exitCode = 1;
    return;
  }

  if (!existsSync(STANDARDS)) {
    throw new Error(`Missing ${STANDARDS}`);
  }
  const standards = JSON.parse(readFileSync(STANDARDS, "utf8")) as Array<{ code: string }>;
  const codes = standards.map((s) => s.code).filter(Boolean);
  const slice = limit > 0 ? codes.slice(0, limit) : codes;

  const out: Record<string, LcRow> = {};
  let ok = 0;
  let miss = 0;
  for (let i = 0; i < slice.length; i++) {
    const code = slice[i];
    try {
      const row = await fetchLcsForCode(code);
      out[code] = row;
      if (row.learningComponents.length) ok += 1;
      else miss += 1;
      if ((i + 1) % 25 === 0) {
        console.info(`[lc:enrich] ${i + 1}/${slice.length} (with LCs=${ok}, empty=${miss})`);
      }
    } catch (error) {
      miss += 1;
      out[code] = {
        code,
        status: "error",
        learningComponents: [],
      };
      console.warn(`[lc:enrich] ${code}:`, error instanceof Error ? error.message : error);
    }
    await sleep(80);
  }

  const payload = {
    source: "learning-commons-knowledge-graph",
    jurisdiction: "Florida",
    generatedAt: new Date().toISOString(),
    count: Object.keys(out).length,
    withLearningComponents: ok,
    standards: out,
  };
  const text = JSON.stringify(payload, null, 2);
  writeFileSync(OUT, text, "utf8");
  writeFileSync(OUT_SRC, text, "utf8");
  console.info(`[lc:enrich] wrote ${OUT} and ${OUT_SRC} (${ok} with LCs / ${slice.length} attempted)`);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
