import type { Express } from "express";
import { supabaseAdminClient } from "../db/supabaseAdmin.ts";

type SupabaseStandardRow = {
  code: string;
  description: string;
  grade: string | number;
  clarifications?: string[] | null;
  examples?: string[] | null;
  purpose_and_strategies?: string[] | null;
  misconceptions?: string[] | null;
  tiered_instruction?: string[] | null;
};

const normalizeGradeForApi = (value: unknown): string => {
  const raw = String(value ?? "").trim();
  const lower = raw.toLowerCase();
  if (!raw) return raw;
  if (lower === "kindergarten" || lower === "k" || lower === "kg") return "Kindergarten";
  const gradePrefix = lower.match(/^grade\s+(.+)$/);
  if (gradePrefix) {
    const rest = gradePrefix[1].trim();
    const restLower = rest.toLowerCase();
    if (restLower === "kindergarten" || restLower === "k" || restLower === "kg") return "Kindergarten";
    if (/^[1-8]$/.test(rest)) return `Grade ${rest}`;
    return raw;
  }
  if (/^[1-8]$/.test(raw)) return `Grade ${raw}`;
  return raw;
};

export const registerStandardsRoutes = (app: Express) => {
  app.get("/api/standards", async (_req, res) => {
    if (!supabaseAdminClient) {
      return res.status(500).json({
        error:
          "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your server environment.",
      });
    }

    try {
      const { data, error } = await supabaseAdminClient
        .from("standards")
        .select("*")
        .order("code", { ascending: true });

      if (error) throw error;

      const standards = ((data || []) as SupabaseStandardRow[]).map((row) => ({
        code: row.code,
        description: row.description,
        grade: normalizeGradeForApi(row.grade),
        clarifications: row.clarifications ?? [],
        examples: row.examples ?? [],
        purposeAndStrategies: row.purpose_and_strategies ?? [],
        misconceptions: row.misconceptions ?? [],
        tieredInstruction: row.tiered_instruction ?? [],
      }));

      return res.json({ standards });
    } catch (error: any) {
      console.error("Error in /api/standards:", error);
      return res.status(500).json({
        error: error?.message || "Failed to load standards from Supabase.",
      });
    }
  });
};
