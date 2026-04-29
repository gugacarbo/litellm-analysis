import { registerAllRoutes } from "@lite-llm/server-core/routes";
import type { RouteOptions } from "@lite-llm/server-core/types";
import express, { type Application } from "express";
import { createMonitorApplicationService } from "./application/monitor-application-service.js";
import { createMonitorRouter } from "./routes/monitor-routes.js";

export function createApiServer(opts: RouteOptions): Application {
  const app = express();
  app.use(express.json());
  registerAllRoutes(app, opts);

  const monitorService = createMonitorApplicationService();
  app.use("/monitor", createMonitorRouter(monitorService));
  return app;
}

export default createApiServer;
