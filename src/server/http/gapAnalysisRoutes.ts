import type { Express } from "express";
import type { GapAnalysis, RemedialSlide } from "../../types.ts";
import {
  remedialSlidesToJson,
  toGapAnalysisInsertRow,
} from "../persistencePayloads.ts";
import { supabaseAdminClient } from "../db/supabaseAdmin.ts";
import { isUuid } from "./requestHelpers.ts";

export const registerGapAnalysisRoutes = (app: Express) => {
  app.post("/api/gap-analyses", async (req, res) => {
    if (!supabaseAdminClient) {
      return res.status(503).json({ error: "Supabase is not configured on the server." });
    }
    const body = req.body ?? {};
    const userId = body.userId != null ? String(body.userId) : "";
    const sessionId = body.sessionId != null ? String(body.sessionId) : null;
    const standardCode = String(body.standardCode || "").trim();
    const analysis = body.analysis as GapAnalysis | undefined;
    if (!userId || !standardCode || !analysis?.summary || typeof analysis.confidenceScore !== "number") {
      return res.status(400).json({ error: "userId, standardCode, and analysis (summary, confidenceScore) required." });
    }
    if (!Array.isArray(analysis.identifiedGaps) || !Array.isArray(analysis.subSkills)) {
      return res.status(400).json({ error: "analysis.identifiedGaps and analysis.subSkills must be arrays." });
    }
    try {
      const row = toGapAnalysisInsertRow({
        userId,
        sessionId: sessionId && isUuid(sessionId) ? sessionId : null,
        standardCode,
        analysis,
      });
      const { data, error } = await supabaseAdminClient.from("gap_analyses").insert(row).select("id").single();
      if (error) throw error;
      return res.status(201).json({ id: (data as { id: string }).id });
    } catch (error: any) {
      console.error("POST /api/gap-analyses:", error);
      return res.status(500).json({ error: error?.message || "Failed to save gap analysis." });
    }
  });

  app.patch("/api/gap-analyses/:gapAnalysisId", async (req, res) => {
    if (!supabaseAdminClient) {
      return res.status(503).json({ error: "Supabase is not configured on the server." });
    }
    const gapAnalysisId = String(req.params.gapAnalysisId || "").trim();
    if (!isUuid(gapAnalysisId)) {
      return res.status(400).json({ error: "Invalid gapAnalysisId." });
    }
    const body = req.body ?? {};
    const userId = body.userId != null ? String(body.userId) : "";
    const slides = body.remediationSlides as RemedialSlide[] | undefined;
    if (!userId || !Array.isArray(slides)) {
      return res.status(400).json({ error: "userId and remediationSlides array required." });
    }
    try {
      const { data: existing, error: exErr } = await supabaseAdminClient
        .from("gap_analyses")
        .select("user_id")
        .eq("id", gapAnalysisId)
        .single();
      if (exErr) throw exErr;
      if (String((existing as { user_id: string }).user_id) !== userId) {
        return res.status(403).json({ error: "userId does not match gap analysis row." });
      }
      const { error } = await supabaseAdminClient
        .from("gap_analyses")
        .update({ remediation_slides: remedialSlidesToJson(slides) })
        .eq("id", gapAnalysisId);
      if (error) throw error;
      return res.json({ id: gapAnalysisId });
    } catch (error: any) {
      console.error("PATCH /api/gap-analyses/:id:", error);
      return res.status(500).json({ error: error?.message || "Failed to update gap analysis." });
    }
  });
};
