import type { Express } from "express";
import { withProviderTimeout } from "../ai/config.ts";
import {
  isGeoGebraRenderEnabled,
  renderGeoGebraPngBase64,
  validateGeoGebraCommands,
} from "../geogebraImageGeneration.ts";

export const registerGeoGebraRoutes = (app: Express) => {
  app.post("/api/geogebra/render", async (req, res) => {
    if (!isGeoGebraRenderEnabled()) {
      return res.status(204).end();
    }
    try {
      const body = (req.body ?? {}) as { commands?: unknown; width?: unknown; height?: unknown };
      const commands = validateGeoGebraCommands(body.commands);
      if (!commands) {
        return res.status(400).json({ error: "Invalid commands payload." });
      }
      const width = Number(body.width);
      const height = Number(body.height);
      const geogebraTimeoutMs = Number(process.env.GEOGEBRA_RENDER_TIMEOUT_MS) || 60_000;
      const base64 = await withProviderTimeout(
        renderGeoGebraPngBase64(
          commands,
          Number.isFinite(width) ? width : 800,
          Number.isFinite(height) ? height : 500,
        ),
        geogebraTimeoutMs,
        "geogebra render",
      );
      if (!base64) {
        return res.status(204).end();
      }
      return res.json({ base64 });
    } catch (error: any) {
      console.error("Error in /api/geogebra/render:", error);
      return res.status(204).end();
    }
  });
};
