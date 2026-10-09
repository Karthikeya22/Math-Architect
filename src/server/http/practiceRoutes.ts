import fs from "node:fs/promises";
import path from "node:path";
import type { Express, Response } from "express";
import { supabaseAdminClient } from "../db/supabaseAdmin.ts";

type PracticeLinkRow = { title: string; url: string };
type QuestionMaterialRow = {
  id: string;
  provider: string;
  provider_item_id: string;
  standard_code: string;
  grade: string | null;
  title: string;
  description: string | null;
  url: string;
  content_kind: string | null;
  keywords: string[] | null;
  difficulty_hint: "Easy" | "Medium" | "Hard" | null;
  metadata: Record<string, unknown> | null;
};

type KhanMappingsFile = {
  byStandard: Record<string, { exercises: PracticeLinkRow[] }>;
};

const PRACTICE_LINKS_JSON = path.join(process.cwd(), "data", "processed", "best-khan-mappings.json");

const loadPracticeLinksFromFile = async (standardId: string): Promise<PracticeLinkRow[]> => {
  try {
    const raw = await fs.readFile(PRACTICE_LINKS_JSON, "utf8");
    const parsed = JSON.parse(raw) as KhanMappingsFile;
    return parsed.byStandard?.[standardId]?.exercises ?? [];
  } catch {
    return [];
  }
};

const fetchPracticeLinksFromSupabase = async (
  standardId: string,
  limit: number
): Promise<PracticeLinkRow[] | null> => {
  if (!supabaseAdminClient) return null;
  try {
    const { data, error } = await supabaseAdminClient
      .from("standard_practice_links")
      .select("content_title, content_url")
      .eq("standard_id", standardId)
      .order("content_title", { ascending: true })
      .limit(limit);

    if (error) throw error;
    return (data || []).map((row: { content_title: string; content_url: string }) => ({
      title: row.content_title,
      url: row.content_url,
    }));
  } catch (err) {
    console.warn("Practice links Supabase query failed, will try file fallback:", err);
    return null;
  }
};

const fetchQuestionMaterialsFromSupabase = async (args: {
  standardId: string;
  grade?: string;
  provider?: string;
  limit: number;
}): Promise<QuestionMaterialRow[]> => {
  if (!supabaseAdminClient) return [];
  let query = supabaseAdminClient
    .from("question_materials")
    .select(
      "id, provider, provider_item_id, standard_code, grade, title, description, url, content_kind, keywords, difficulty_hint, metadata"
    )
    .eq("standard_code", args.standardId)
    .eq("is_active", true)
    .limit(args.limit);

  if (args.provider) query = query.eq("provider", args.provider);
  if (args.grade) query = query.eq("grade", args.grade);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as QuestionMaterialRow[];
};

const handlePracticeLinks = async (
  standardIdRaw: string | undefined,
  limitRaw: unknown,
  res: Response
) => {
  const standardId = decodeURIComponent(String(standardIdRaw || "")).trim();
  if (!standardId) {
    return res.status(400).json({ error: "Missing standardId." });
  }

  const limit = Math.min(Number(limitRaw) || 50, 100);

  try {
    const fromDb = await fetchPracticeLinksFromSupabase(standardId, limit);
    let links: PracticeLinkRow[];
    let source: "supabase" | "file";

    if (fromDb !== null && fromDb.length > 0) {
      links = fromDb;
      source = "supabase";
    } else {
      links = (await loadPracticeLinksFromFile(standardId)).slice(0, limit);
      source = links.length > 0 ? "file" : fromDb !== null ? "supabase" : "file";
    }

    return res.json({ standardId, links, source });
  } catch (error: any) {
    console.error("Error in /api/practice-links:", error);
    return res.status(500).json({
      error: error?.message || "Failed to load practice links.",
    });
  }
};

export const registerPracticeRoutes = (app: Express) => {
  app.get("/api/practice-links/:standardId", async (req, res) => {
    console.log(`[api] practice-links standardId=${req.params.standardId}`);
    return handlePracticeLinks(String(req.params.standardId || ""), req.query.limit, res);
  });

  app.get("/api/practice-links", async (req, res) => {
    const standardId = String(req.query.standard_id || req.query.standardId || "");
    return handlePracticeLinks(standardId, req.query.limit, res);
  });

  app.get("/api/question-materials", async (req, res) => {
    const standardId = String(req.query.standard_id || req.query.standardId || "").trim();
    if (!standardId) {
      return res.status(400).json({ error: "Missing standard_id." });
    }
    const grade = String(req.query.grade || "").trim() || undefined;
    const provider = String(req.query.provider || "").trim() || undefined;
    const limit = Math.min(Number(req.query.limit) || 50, 200);

    try {
      const materials = await fetchQuestionMaterialsFromSupabase({
        standardId,
        grade,
        provider,
        limit,
      });
      return res.json({ standardId, materials });
    } catch (error: any) {
      console.error("Error in /api/question-materials:", error);
      return res.status(500).json({
        error: error?.message || "Failed to load question materials.",
      });
    }
  });

  app.get("/api/question-materials/providers-summary", async (req, res) => {
    const standardId = String(req.query.standard_id || req.query.standardId || "").trim();
    if (!standardId) {
      return res.status(400).json({ error: "Missing standard_id." });
    }
    if (!supabaseAdminClient) {
      return res.json({ standardId, providers: [] });
    }
    try {
      const { data, error } = await supabaseAdminClient
        .from("question_materials")
        .select("provider")
        .eq("standard_code", standardId)
        .eq("is_active", true);
      if (error) throw error;

      const counts = new Map<string, number>();
      for (const row of data || []) {
        const provider = String((row as { provider: string }).provider || "UNKNOWN");
        counts.set(provider, (counts.get(provider) || 0) + 1);
      }
      const providers = [...counts.entries()].map(([provider, count]) => ({ provider, count }));
      return res.json({ standardId, providers });
    } catch (error: any) {
      console.error("Error in /api/question-materials/providers-summary:", error);
      return res.status(500).json({
        error: error?.message || "Failed to load provider summary.",
      });
    }
  });
};
