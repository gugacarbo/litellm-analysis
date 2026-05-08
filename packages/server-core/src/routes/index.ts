import type { Application } from "express";
import type { RouteOptions } from "../types/index.js";
import { registerAgentCatalogRoutes } from "./agent-catalog-routes.js";
import { registerAgentConfigRoutes } from "./agent-config-routes.js";
import { registerAgentDefinitionsRoutes } from "./agent-definitions-routes.js";
import { registerAgentRoutingRoutes } from "./agent-routing-routes.js";
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
  registerAgentRoutingRoutes(app, opts);
  registerAgentConfigRoutes(app, opts);
  registerAgentDefinitionsRoutes(app);
  registerPluginRoutingRoutes(app);
  registerCredentialRoutes(app, opts);
}
