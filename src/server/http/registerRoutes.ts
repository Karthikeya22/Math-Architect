import type { Express } from "express";
import { registerActivityRoutes } from "./activityRoutes.ts";
import { registerAiRoutes } from "./aiRoutes.ts";
import { registerFigureRoutes } from "./figureRoutes.ts";
import { registerGapAnalysisRoutes } from "./gapAnalysisRoutes.ts";
import { registerGeoGebraRoutes } from "./geogebraRoutes.ts";
import { registerPracticeRoutes } from "./practiceRoutes.ts";
import { registerQuizSessionRoutes } from "./quizSessionRoutes.ts";
import { registerStandardsRoutes } from "./standardsRoutes.ts";
import { registerUserRoutes } from "./userRoutes.ts";

export const registerRoutes = (app: Express) => {
  registerAiRoutes(app);
  registerFigureRoutes(app);
  registerGeoGebraRoutes(app);
  registerStandardsRoutes(app);
  registerPracticeRoutes(app);
  registerUserRoutes(app);
  registerQuizSessionRoutes(app);
  registerGapAnalysisRoutes(app);
  registerActivityRoutes(app);
};
