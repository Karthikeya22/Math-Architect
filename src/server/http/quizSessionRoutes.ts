import type { Express } from "express";
import { parseStandardCodeMeta } from "../../utils/parseStandardCode.ts";
import { supabaseAdminClient } from "../db/supabaseAdmin.ts";
import { mergeQuizSessionMetadataForComplete } from "../persistencePayloads.ts";
import {
  buildPerQuestionAttemptRows,
  isQuizHybridSchemaEnabled,
  toQuestionAttemptInsertRow,
  toQuestionInsertRow,
} from "../quizTelemetryPayloads.ts";
import { isUuid, stripQuestionForStorage } from "./requestHelpers.ts";

export const registerQuizSessionRoutes = (app: Express) => {
  app.patch("/api/quiz-sessions/:sessionId/complete", async (req, res) => {
    if (!supabaseAdminClient) {
      return res.status(503).json({ error: "Supabase is not configured on the server." });
    }
    const sessionId = String(req.params.sessionId || "").trim();
    if (!isUuid(sessionId)) {
      return res.status(400).json({ error: "Invalid sessionId." });
    }
    const body = req.body ?? {};
    const userId = body.userId != null ? String(body.userId) : "";
    const score = Number(body.score);
    const total = Number(body.total);
    if (!userId || !Number.isFinite(score) || !Number.isFinite(total)) {
      return res.status(400).json({ error: "userId, score, and total are required." });
    }
    try {
      const { data: sess, error: selErr } = await supabaseAdminClient
        .from("quiz_sessions")
        .select("user_id, metadata")
        .eq("id", sessionId)
        .single();
      if (selErr) throw selErr;
      const s = sess as { user_id: string; metadata: unknown };
      if (String(s.user_id) !== userId) {
        return res.status(403).json({ error: "userId does not match session." });
      }
      const extra =
        body.metadata && typeof body.metadata === "object" ? (body.metadata as Record<string, unknown>) : {};
      const merged = mergeQuizSessionMetadataForComplete(s.metadata as Record<string, unknown> | null, {
        score,
        total,
        completedAtIso: new Date().toISOString(),
        extraMetadata: extra,
      });
      const { error: upErr } = await supabaseAdminClient
        .from("quiz_sessions")
        .update({
          completed_at: new Date().toISOString(),
          score,
          metadata: merged,
        })
        .eq("id", sessionId);
      if (upErr) throw upErr;
      return res.json({ sessionId, score, total });
    } catch (error: any) {
      console.error("PATCH /api/quiz-sessions/:sessionId/complete:", error);
      return res.status(500).json({ error: error?.message || "Failed to update session." });
    }
  });

  app.post("/api/ai-quiz-generations", async (req, res) => {
    if (!supabaseAdminClient) {
      return res.status(503).json({ error: "Supabase is not configured on the server." });
    }

    const body = req.body ?? {};
    const standard = body.standard;
    const config = body.config;
    const quiz = body.quiz;
    const userId = body.userId != null ? String(body.userId) : null;
    const sessionMetadata = body.sessionMetadata && typeof body.sessionMetadata === "object"
      ? body.sessionMetadata
      : null;

    if (!standard || typeof standard.code !== "string" || !standard.description || !standard.grade) {
      return res.status(400).json({ error: "Invalid standard payload." });
    }
    if (!config || typeof config !== "object") {
      return res.status(400).json({ error: "Invalid quiz config." });
    }
    if (!quiz || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
      return res.status(400).json({ error: "Invalid quiz payload: questions required." });
    }

    const { strandCode, gradeToken } = parseStandardCodeMeta(standard.code);
    const generationSourceMeta = {
      origin: "ai_generated",
      generated_by: "llm",
      standard_code: String(standard.code),
      grade_token: gradeToken,
      strand_code: strandCode,
    };

    const hybridQuiz = isQuizHybridSchemaEnabled();
    const baseSessionRow = {
      standard_code: String(standard.code),
      strand_code: strandCode,
      grade_token: gradeToken,
      standard_grade_label: String(standard.grade),
      standard_description: String(standard.description),
      standard_clarifications: standard.clarifications ?? null,
      standard_examples: standard.examples ?? null,
      standard_purpose_and_strategies: standard.purposeAndStrategies ?? null,
      standard_misconceptions: standard.misconceptions ?? null,
      standard_tiered_instruction: standard.tieredInstruction ?? null,
      quiz_config: config,
      adaptive_enabled: Boolean(config.adaptiveEnabled),
      adaptive_policy: config.adaptivePolicy ?? null,
      source_policy: config.sourcePolicy ?? null,
      prompt_version: body.providerMetadata?.promptVersion ?? null,
      session_metadata: sessionMetadata,
      provider_metadata: {
        ...(body.providerMetadata ?? {}),
        ...generationSourceMeta,
      },
    };

    const generationRow = hybridQuiz
      ? {
          ...baseSessionRow,
          user_id: userId != null && String(userId).trim() !== "" ? String(userId) : "anonymous",
          grade: String(standard.grade),
          started_at: new Date().toISOString(),
          config,
        }
      : {
          ...baseSessionRow,
          user_id: userId,
        };

    try {
      const { data: inserted, error: genError } = await supabaseAdminClient
        .from("quiz_sessions")
        .insert(generationRow)
        .select("id")
        .single();

      if (genError) throw genError;
      const generationId = inserted?.id as string;

      const questionRows = quiz.questions.map((q: unknown, index: number) => {
        const cleaned = stripQuestionForStorage(q as Record<string, unknown>);
        return toQuestionInsertRow(
          {
            sessionId: generationId,
            questionIndex: index,
            cleaned,
            standard: { code: String(standard.code), grade: String(standard.grade) },
            strandCode,
            gradeToken,
            config: config as { sourcePolicy?: string | null },
            promptVersionFromMeta: body.providerMetadata?.promptVersion ?? null,
          },
          { hybridDb: hybridQuiz }
        );
      });

      const { error: qError } = await supabaseAdminClient.from("questions").insert(questionRows);

      if (qError) {
        await supabaseAdminClient.from("quiz_sessions").delete().eq("id", generationId);
        throw qError;
      }

      return res.status(201).json({ generationId, sessionId: generationId });
    } catch (error: any) {
      console.error("Error in POST /api/ai-quiz-generations:", error);
      return res.status(500).json({
        error: error?.message || "Failed to persist AI quiz generation.",
      });
    }
  });

  app.post("/api/ai-quiz-generations/:generationId/attempt", async (req, res) => {
    if (!supabaseAdminClient) {
      return res.status(503).json({ error: "Supabase is not configured on the server." });
    }

    const generationId = String(req.params.generationId || "").trim();
    if (!isUuid(generationId)) {
      return res.status(400).json({ error: "Invalid generationId." });
    }

    const results = (req.body ?? {}).results;
    const adaptiveEnabled = Boolean((req.body ?? {}).adaptiveEnabled);
    const requestUserId = (req.body ?? {}).userId != null ? String((req.body ?? {}).userId) : null;
    const adaptivePath = Array.isArray((req.body ?? {}).adaptivePath) ? (req.body ?? {}).adaptivePath : [];
    const attemptMetadata =
      (req.body ?? {}).attemptMetadata && typeof (req.body ?? {}).attemptMetadata === "object"
        ? (req.body ?? {}).attemptMetadata
        : null;
    if (!Array.isArray(results) || results.length === 0) {
      return res.status(400).json({ error: "Invalid results array." });
    }

    const score = results.filter((r: any) => r && r.isCorrect === true).length;
    const total = results.length;

    try {
      const hybridAttempt = isQuizHybridSchemaEnabled();

      if (hybridAttempt) {
        const { data: sessionRow, error: sessionErr } = await supabaseAdminClient
          .from("quiz_sessions")
          .select("standard_code")
          .eq("id", generationId)
          .single();
        if (sessionErr) throw sessionErr;

        const { data: questionRows, error: qListErr } = await supabaseAdminClient
          .from("questions")
          .select("id, question_index, options")
          .eq("session_id", generationId)
          .order("question_index", { ascending: true });
        if (qListErr) throw qListErr;

        const questionIdsByIndex = new Map<number, string>();
        const optionsByQuestionIndex = new Map<number, unknown>();
        for (const row of questionRows || []) {
          const r = row as { id: string; question_index: number | null; options: unknown };
          if (typeof r.question_index === "number") {
            questionIdsByIndex.set(r.question_index, r.id);
            optionsByQuestionIndex.set(r.question_index, r.options);
          }
        }

        const attemptRows = buildPerQuestionAttemptRows({
          sessionId: generationId,
          standardCode: sessionRow?.standard_code != null ? String(sessionRow.standard_code) : null,
          userId: requestUserId,
          results,
          adaptiveEnabled,
          adaptivePath,
          attemptMetadata: attemptMetadata || {},
          questionIdsByIndex,
          optionsByQuestionIndex,
        });

        const { error } = await supabaseAdminClient.from("question_attempts").insert(attemptRows);
        if (error) throw error;
      } else {
        const attemptRow = toQuestionAttemptInsertRow({
          sessionId: generationId,
          userId: requestUserId,
          results,
          score,
          total,
          adaptiveEnabled,
          adaptivePath,
          attemptMetadata: {
            ...(attemptMetadata || {}),
            perQuestion: results.map((result: any) => ({
              questionIndex: result?.questionIndex ?? null,
              questionId: result?.questionId ?? null,
              isCorrect: Boolean(result?.isCorrect),
              timeTakenSeconds:
                typeof result?.timeTaken === "number" ? Math.max(0, Math.round(result.timeTaken)) : 0,
              nextDifficulty: result?.nextDifficulty ?? null,
              adaptiveDecisionReason: result?.adaptiveDecisionReason ?? null,
              difficultyChanged: result?.difficultyChanged ?? null,
            })),
          },
        });

        const { error } = await supabaseAdminClient.from("question_attempts").insert([attemptRow]);
        if (error) throw error;
      }

      try {
        const { data: sessRow } = await supabaseAdminClient
          .from("quiz_sessions")
          .select("metadata")
          .eq("id", generationId)
          .maybeSingle();
        const merged = mergeQuizSessionMetadataForComplete(sessRow?.metadata as Record<string, unknown> | null, {
          score,
          total,
          completedAtIso: new Date().toISOString(),
          extraMetadata: (attemptMetadata && typeof attemptMetadata === "object" ? attemptMetadata : {}) as Record<
            string,
            unknown
          >,
        });
        const { error: upSess } = await supabaseAdminClient
          .from("quiz_sessions")
          .update({
            completed_at: new Date().toISOString(),
            score,
            metadata: merged,
          })
          .eq("id", generationId);
        if (upSess) console.warn("quiz_sessions completion update:", upSess.message);
      } catch (e) {
        console.warn("quiz_sessions completion update failed", e);
      }

      return res.status(201).json({ generationId, sessionId: generationId, score, total });
    } catch (error: any) {
      console.error("Error in POST /api/ai-quiz-generations/:id/attempt:", error);
      return res.status(500).json({
        error: error?.message || "Failed to persist quiz attempt.",
      });
    }
  });
};
