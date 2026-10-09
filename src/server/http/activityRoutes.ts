import type { Express } from "express";
import { supabaseAdminClient } from "../db/supabaseAdmin.ts";
import { isUuid } from "./requestHelpers.ts";

export const registerActivityRoutes = (app: Express) => {
  app.post("/api/activity-events", async (req, res) => {
    if (!supabaseAdminClient) {
      return res.status(503).json({ error: "Supabase is not configured on the server." });
    }
    const body = req.body ?? {};
    const events = body.events;
    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: "events array required." });
    }
    const rows = events.slice(0, 50).map((ev: unknown) => {
      const e = ev as Record<string, unknown>;
      return {
        user_id: String(e.userId ?? ""),
        action: String(e.action ?? "UNKNOWN"),
        metadata: e.metadata && typeof e.metadata === "object" ? e.metadata : null,
        quiz_session_id: typeof e.quizSessionId === "string" && isUuid(e.quizSessionId) ? e.quizSessionId : null,
      };
    });
    if (rows.some((r) => !r.user_id)) {
      return res.status(400).json({ error: "Each event must include userId." });
    }
    try {
      const { error } = await supabaseAdminClient.from("activity_events").insert(rows);
      if (error) throw error;
      return res.status(201).json({ inserted: rows.length });
    } catch (error: any) {
      console.error("POST /api/activity-events:", error);
      return res.status(500).json({ error: error?.message || "Failed to log activity." });
    }
  });
};
