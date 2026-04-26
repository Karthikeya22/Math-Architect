import fs from "fs";
import path from "path";

const BASE_URL = process.env.AB_EVAL_BASE_URL || "http://localhost:3000";
const allProviders = ["gemini", "openai"];
const providerArg = process.argv.find((arg) => arg.startsWith("--provider="));
const requestedProvider = providerArg ? providerArg.split("=")[1] : null;
const providers = requestedProvider ? [requestedProvider] : allProviders;
const suffixArg = process.argv.find((arg) => arg.startsWith("--suffix="));
const outputSuffix = suffixArg ? suffixArg.split("=")[1] : "latest";

const benchmarkPath = path.join(process.cwd(), "reports", "benchmark-matrix.json");
const benchmarkCases = JSON.parse(fs.readFileSync(benchmarkPath, "utf-8")).cases;

const RESPONSE_SCHEMAS = {
  quiz: {
    type: "OBJECT",
    properties: {
      standardCode: { type: "STRING" },
      questions: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            id: { type: "STRING" },
            text: { type: "STRING" },
            options: { type: "ARRAY", items: { type: "STRING" } },
            correctAnswerIndex: { type: "INTEGER" },
            explanation: { type: "STRING" },
            animationDescription: { type: "STRING" },
            visualIntent: { type: "STRING" },
            imagePrompt: { type: "STRING" },
            difficulty: { type: "STRING" }
          },
          required: [
            "id",
            "text",
            "options",
            "correctAnswerIndex",
            "explanation",
            "animationDescription",
            "difficulty"
          ]
        }
      }
    },
    required: ["standardCode", "questions"]
  },
  analysis: {
    type: "OBJECT",
    properties: {
      standardCode: { type: "STRING" },
      identifiedGaps: { type: "ARRAY", items: { type: "OBJECT" } },
      subSkills: { type: "ARRAY", items: { type: "OBJECT" } },
      confidenceScore: { type: "INTEGER" },
      summary: { type: "STRING" }
    },
    required: ["standardCode", "identifiedGaps", "subSkills", "confidenceScore", "summary"]
  },
  slides: {
    type: "OBJECT",
    properties: {
      slides: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            slideNumber: { type: "INTEGER" },
            title: { type: "STRING" },
            content: { type: "STRING" },
            visualDescription: { type: "STRING" },
            imagePrompt: { type: "STRING" },
            vocabulary: { type: "ARRAY", items: { type: "STRING" } }
          },
          required: ["slideNumber", "title", "content", "visualDescription", "vocabulary"]
        }
      }
    },
    required: ["slides"]
  },
  image: null
};

const pricingPer1M = {
  gemini: { input: 0.1, output: 0.4 },
  openai: { input: 0.15, output: 0.6 }
};

const estimateCostUsd = (provider, usage) => {
  if (!usage) return null;
  const pricing = pricingPer1M[provider];
  if (!pricing) return null;
  const inTok = usage.prompt_tokens || usage.input_tokens || 0;
  const outTok = usage.completion_tokens || usage.output_tokens || 0;
  return (inTok / 1_000_000) * pricing.input + (outTok / 1_000_000) * pricing.output;
};

const evaluateQualityGate = (task, parsed, requiresVisual) => {
  if (!parsed || typeof parsed !== "object") {
    return { pass: false, reason: "quality:no_json_payload", score: 0 };
  }
  if (task === "quiz") {
    const questions = parsed.questions || [];
    if (!questions.length) return { pass: false, reason: "quality:no_questions", score: 0 };
    const optionsValid = questions.every((q) => Array.isArray(q.options) && q.options.length === 4);
    const answerValid = questions.every((q) => Number.isInteger(q.correctAnswerIndex) && q.correctAnswerIndex >= 0 && q.correctAnswerIndex <= 3);
    const visualsNeededOk = !requiresVisual || questions.some((q) => q.imagePrompt && q.visualIntent);
    const score = [optionsValid, answerValid, visualsNeededOk].filter(Boolean).length / 3;
    return { pass: score >= 0.67, reason: score >= 0.67 ? null : "quality:quiz_gate_failed", score };
  }
  if (task === "analysis") {
    const pass = Array.isArray(parsed.identifiedGaps) && Array.isArray(parsed.subSkills) && typeof parsed.summary === "string";
    return { pass, reason: pass ? null : "quality:analysis_gate_failed", score: pass ? 1 : 0 };
  }
  if (task === "slides") {
    const slides = parsed.slides || [];
    const hasSlides = Array.isArray(slides) && slides.length > 0;
    const visualOk = !requiresVisual || slides.some((s) => s.imagePrompt);
    const pass = hasSlides && visualOk;
    const score = [hasSlides, visualOk].filter(Boolean).length / 2;
    return { pass, reason: pass ? null : "quality:slides_gate_failed", score };
  }
  if (task === "image") {
    const pass = true;
    return { pass, reason: null, score: 1 };
  }
  return { pass: false, reason: "quality:unknown_task", score: 0 };
};

const callGenerate = async (testCase, provider) => {
  const { task, prompt, requiresVisual, id } = testCase;
  const responseSchema = RESPONSE_SCHEMAS[task];
  const started = Date.now();
  const res = await fetch(`${BASE_URL}/api/genai/generate-content`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      task,
      provider,
      contents: prompt,
      config: responseSchema
        ? { responseMimeType: "application/json", responseSchema }
        : undefined,
      metadata: { disableFallback: true },
    }),
  });

  const elapsedMs = Date.now() - started;
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return {
      ok: false,
      elapsedMs,
      error: data?.error || `HTTP ${res.status}`,
      provider,
      requestedProvider: provider,
      task,
      caseId: id,
      gateFailures: ["http_error"],
    };
  }

  let parsed = null;
  let schemaCompliance = false;
  const imageHasData =
    task === "image" &&
    !!data?.candidates?.[0]?.content?.parts?.some((p) => p?.inlineData?.data);
  const gateFailures = [];
  if (task === "image") {
    // Image task is binary: did provider return image bytes?
    schemaCompliance = imageHasData;
    parsed = { imageReturned: imageHasData };
  } else {
    try {
      parsed = data?.text ? JSON.parse(data.text) : null;
      schemaCompliance = !!parsed && typeof parsed === "object";
    } catch {
      schemaCompliance = false;
      gateFailures.push("schema");
    }
  }

  const visualRelevance =
    task !== "quiz"
      ? "n/a"
      : (() => {
          const questions = parsed?.questions || [];
          if (!questions.length) return false;
          const withVisual = questions.filter((q) => q.imagePrompt);
          if (!withVisual.length) return true;
          return withVisual.every((q) => q.visualIntent);
        })();

  if (!schemaCompliance) gateFailures.push("schema");
  if (task === "quiz" && visualRelevance === false) gateFailures.push("visual");
  if ((task === "slides" || task === "quiz") && requiresVisual && visualRelevance === "n/a") {
    gateFailures.push("visual");
  }

  const qualityGate =
    task === "image"
      ? { pass: imageHasData, reason: imageHasData ? null : "quality:no_image_bytes", score: imageHasData ? 1 : 0 }
      : evaluateQualityGate(task, parsed, requiresVisual);
  if (!qualityGate.pass) gateFailures.push("quality");
  const usage = data?.usage || null;
  const estCostUsd = estimateCostUsd(provider, usage);
  const pass = schemaCompliance && (visualRelevance !== false) && qualityGate.pass;

  return {
    ok: pass,
    elapsedMs,
    requestedProvider: provider,
    provider: data?.provider || provider,
    model: data?.model || "unknown",
    task,
    caseId: id,
    schemaCompliance,
    visualRelevance,
    qualityScore: qualityGate.score,
    usage,
    estimatedCostUsd: estCostUsd,
    gateFailures,
  };
};

const run = async () => {
  const results = [];
  for (const testCase of benchmarkCases) {
    for (const provider of providers) {
      const result = await callGenerate(testCase, provider);
      results.push(result);
      console.log(`${testCase.id} | ${provider} | ${result.ok ? "PASS" : "FAIL"} | ${result.elapsedMs}ms`);
    }
  }

  const summary = providers.map((provider) => {
    const providerRows = results.filter((r) => r.requestedProvider === provider);
    const passes = providerRows.filter((r) => r.ok).length;
    const schemaPasses = providerRows.filter((r) => r.schemaCompliance).length;
    const qualityAvg =
      providerRows.length > 0
        ? providerRows.reduce((sum, r) => sum + (r.qualityScore || 0), 0) / providerRows.length
        : null;
    const totalCost = providerRows.reduce((sum, r) => sum + (r.estimatedCostUsd || 0), 0);
    const avgLatency =
      providerRows.length > 0
        ? Math.round(providerRows.reduce((sum, r) => sum + r.elapsedMs, 0) / providerRows.length)
        : null;

    return {
      provider,
      total: providerRows.length,
      passes,
      schemaPasses,
      avgQualityScore: qualityAvg,
      totalEstimatedCostUsd: Number(totalCost.toFixed(6)),
      avgLatencyMs: avgLatency,
    };
  });

  const taskWinners = {};
  const tasks = [...new Set(results.map((r) => r.task))];
  for (const task of tasks) {
    const taskRows = results.filter((r) => r.task === task);
    const byProvider = providers
      .map((provider) => {
        const rows = taskRows.filter((r) => r.requestedProvider === provider);
        const passCount = rows.filter((r) => r.ok).length;
        const total = rows.length || 1;
        const passRate = passCount / total;
        const avgLatencyMs = rows.reduce((s, r) => s + r.elapsedMs, 0) / total;
        const totalCost = rows.reduce((s, r) => s + (r.estimatedCostUsd || 0), 0);
        return { provider, passRate, avgLatencyMs, totalCost };
      })
      .filter((r) => r.passRate > 0);

    if (byProvider.length === 0) {
      taskWinners[task] = { winner: null, reason: "No provider passed quality gates." };
      continue;
    }

    byProvider.sort((a, b) => {
      const aCostKnown = a.totalCost > 0;
      const bCostKnown = b.totalCost > 0;
      if (aCostKnown && bCostKnown && a.totalCost !== b.totalCost) {
        return a.totalCost - b.totalCost;
      }
      if (a.passRate !== b.passRate) return b.passRate - a.passRate;
      return a.avgLatencyMs - b.avgLatencyMs;
    });

    taskWinners[task] = {
      winner: byProvider[0].provider,
      rationale: "cost_first_with_quality_gates",
      metrics: byProvider[0],
    };
  }

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    providers,
    results,
    summary,
    taskWinners,
  };

  const reportDir = path.join(process.cwd(), "reports");
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, `ab-eval-${outputSuffix}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf-8");
  console.log(`Saved report to ${reportPath}`);
};

run().catch((error) => {
  console.error("A/B eval failed:", error);
  process.exit(1);
});
