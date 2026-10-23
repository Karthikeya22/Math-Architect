import type { Express } from "express";
import {
  getLcEnrichmentMeta,
  getLcLearningComponentsForCode,
} from "../lc/learningComponents.ts";

export const registerLcRoutes = (app: Express) => {
  app.get("/api/lc/learning-components/:standardCode", (req, res) => {
    const standardCode = String(req.params.standardCode || "").trim();
    if (!standardCode) {
      return res.status(400).json({ error: "standardCode is required." });
    }
    const meta = getLcEnrichmentMeta();
    const learningComponents = getLcLearningComponentsForCode(standardCode);
    return res.json({
      standardCode,
      jurisdiction: meta.jurisdiction,
      generatedAt: meta.generatedAt,
      learningComponents,
    });
  });
};
