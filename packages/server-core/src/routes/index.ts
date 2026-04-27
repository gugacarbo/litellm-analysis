import type { Application } from "express";
import type { RouteOptions } from "../types/index.js";
import { registerAgentConfigRoutes } from "./agent-config-routes.js";
import { registerAgentRoutingRoutes } from "./agent-routing-routes.js";
import { registerAnalyticsRoutes } from "./analytics-routes.js";
import { registerModeRoutes } from "./mode-routes.js";
import { registerModelRoutes } from "./model-routes.js";
import { registerSpendRoutes } from "./spend-routes.js";

export type { RouteOptions };

export function registerAllRoutes(app: Application, opts: RouteOptions): void {
  registerModeRoutes(app, opts);
  registerSpendRoutes(app, opts);
  registerAnalyticsRoutes(app, opts);
  registerModelRoutes(app, opts);
  registerAgentRoutingRoutes(app, opts);
  registerAgentConfigRoutes(app, opts);
}
