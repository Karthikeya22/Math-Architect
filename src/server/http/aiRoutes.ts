import type { Express } from "express";
import { generateWithGuards } from "../ai/generateWithGuards.ts";
import type { GenerateRequest } from "../ai/types.ts";

export const registerAiRoutes = (app: Express) => {
  app.post("/api/genai/generate-content", async (req, res) => {
    try {
      const request = (req.body ?? {}) as GenerateRequest;
      if (!request.task || !request.contents) {
        return res.status(400).json({ error: "Missing required fields: task and contents." });
      }
      const response = await generateWithGuards(request);
      return res.json(response);
    } catch (error: any) {
      console.error("Error in /api/genai/generate-content:", error);
      return res.status(500).json({
        error: error?.message || "Failed to generate content.",
      });
    }
  });
};
