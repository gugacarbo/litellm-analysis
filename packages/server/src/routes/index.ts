import type { Application } from "express";
import type { RouteOptions } from "../types/index";
import { registerAgentCatalogRoutes } from "./agent-catalog-routes";
import { registerAnalyticsRoutes } from "./analytics-routes";
import { registerCategoryCatalogRoutes } from "./category-catalog-routes";
import { registerCredentialRoutes } from "./credential-routes";
import { registerModelProxyRoutes } from "./model-proxy-routes";
import { registerModelRoutes } from "./model-routes";
import { registerPluginRoutingRoutes } from "./plugin-routing-routes";
import { registerSpendRoutes } from "./spend-routes";

export type { RouteOptions };

export function registerAllRoutes(app: Application, opts: RouteOptions): void {
  registerAgentCatalogRoutes(app, opts);
  registerCategoryCatalogRoutes(app, opts);
  registerSpendRoutes(app, opts);
  registerAnalyticsRoutes(app, opts);
  registerModelRoutes(app, opts);
  registerModelProxyRoutes(app, opts);
  registerPluginRoutingRoutes(app, opts);
  registerCredentialRoutes(app, opts);
}
