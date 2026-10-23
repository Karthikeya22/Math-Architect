/**
 * Shadow-mode smoke for Learning Commons hooks (no fail-closed drops).
 * Usage: npx tsx scripts/verify_lc_shadow.ts
 *
 * Requires LEARNING_COMMONS_API_KEY + ANTHROPIC_API_KEY for live alignment.
 * Without keys, prints config status and exits 0 after dry checks.
 */
import { config as loadDotenv } from "dotenv";
import { applyLcMathStandardsAlignment } from "../src/server/lc/mathStandardsAlignment.ts";
import { getLcSkillPromptPack } from "../src/lc/skills.ts";
import { getLcEnrichmentMeta, getLcLearningComponentsForCode } from "../src/lc/learningComponents.ts";
import {
  isLcAlignmentConfigured,
  isLcGraphicsConfigured,
  resolveLcEvalMode,
} from "../src/server/lc/config.ts";

loadDotenv();

const main = async () => {
  console.info("[lc-smoke] LC_EVAL_MODE=", resolveLcEvalMode());
  console.info("[lc-smoke] alignment configured=", isLcAlignmentConfigured());
  console.info("[lc-smoke] graphics configured=", isLcGraphicsConfigured());
  console.info("[lc-smoke] quiz skill pack chars=", getLcSkillPromptPack("quiz").length);
  console.info("[lc-smoke] enrichment meta=", getLcEnrichmentMeta());
  console.info(
    "[lc-smoke] sample MA.K.NSO.1.1 LCs=",
    getLcLearningComponentsForCode("MA.K.NSO.1.1").length,
  );

  if (!isLcAlignmentConfigured()) {
    console.info("[lc-smoke] skip live Math Standards Alignment (missing keys)");
    return;
  }

  const payload = {
    standardCode: "MA.3.NSO.1.1",
    questions: [
      {
        question: "What is 7 + 5?",
        options: ["10", "11", "12", "13"],
        correctAnswerIndex: 2,
      },
    ],
  };

  const { report } = await applyLcMathStandardsAlignment({
    payload,
    statementCode: "MA.3.NSO.1.1",
    env: { ...process.env, LC_EVAL_MODE: "shadow" },
  });

  console.info("[lc-smoke] alignment report:", JSON.stringify(report, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
