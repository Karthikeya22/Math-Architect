import "./loadEnv.ts";
import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import path from "path";
import {
  initGeoGebraPool,
  isGeoGebraRenderEnabled,
  releaseGeoGebraPool,
} from "./geogebraImageGeneration.ts";
import { registerRoutes } from "./http/registerRoutes.ts";

export async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  console.log("Provider router version: hybrid-v3 (quiz visual soft-sanitize + structure repair)");

  app.use(cors());
  app.use("/data", express.static(path.join(process.cwd(), "data")));
  app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || "50mb" }));

  registerRoutes(app);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // SPA Fallback: for any unhandled requests, serve index.html
    app.use((_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (isGeoGebraRenderEnabled()) {
    initGeoGebraPool().catch((error) => {
      console.warn("[geogebra] pool init failed:", error);
    });
  }

  const shutdownGeoGebra = () => {
    void releaseGeoGebraPool();
  };
  process.on("SIGINT", shutdownGeoGebra);
  process.on("SIGTERM", shutdownGeoGebra);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
