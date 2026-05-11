import { registerAllRoutes } from "@lite-llm/server-core/routes";
import type { RouteOptions } from "@lite-llm/server-core/types";
import express, { type Application } from "express";
import { createHealthCheckApplicationService } from "../application/health-check-application-service";
import { createMonitorApplicationService } from "../application/monitor-application-service";
import type { AppContext } from "../contexts";
import { createHealthCheckRouter } from "../routes/health-check-routes";
import { createMonitorRouter } from "../routes/monitor-routes";

export function createApiServer(
  opts: RouteOptions,
  ctx: AppContext,
): Application {
  const app = express();
  app.use(express.json());

  // Health / liveness probe — always returns 200
  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  // Readiness probe — checks database connectivity
  app.get("/ready", async (_req, res) => {
    try {
      await ctx.analytics.checkReadiness();
      res.status(200).json({ status: "ok", database: "connected" });
    } catch {
      res.status(503).json({ status: "error", database: "disconnected" });
    }
  });

  registerAllRoutes(app, opts);

  const monitorService = createMonitorApplicationService();
  app.use("/monitor", createMonitorRouter(monitorService));

  const healthCheckService = createHealthCheckApplicationService();
  app.use("/health-check", createHealthCheckRouter(healthCheckService));

  return app;
}
