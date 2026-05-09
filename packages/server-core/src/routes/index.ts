import type { Application } from "express";
import type { RouteOptions } from "../types/index.js";
import { registerAgentCatalogRoutes } from "./agent-catalog-routes.js";
import { registerAgentConfigRoutes } from "./agent-config-routes.js";
import { registerAnalyticsRoutes } from "./analytics-routes.js";
import { registerCredentialRoutes } from "./credential-routes.js";
import { registerModelRoutes } from "./model-routes.js";
import { registerPluginRoutingRoutes } from "./plugin-routing-routes.js";
import { registerSpendRoutes } from "./spend-routes.js";

export type { RouteOptions };

export function registerAllRoutes(app: Application, opts: RouteOptions): void {
  registerAgentCatalogRoutes(app, opts);
  registerSpendRoutes(app, opts);
  registerAnalyticsRoutes(app, opts);
  registerModelRoutes(app, opts);
  registerPluginRoutingRoutes(app);
  registerAgentConfigRoutes(app, opts);
  registerCredentialRoutes(app, opts);
}
