import type { Application } from "express";
import type { RouteOptions } from "../types/index.js";
import { registerConfigRoutes } from "./agent-config/config-routes.js";
import { registerGlobalFallbackRoutes } from "./agent-config/global-fallback-routes.js";
import { registerItemRoutes } from "./agent-config/item-routes.js";

export function registerAgentConfigRoutes(
  app: Application,
  opts: RouteOptions,
): void {
  registerGlobalFallbackRoutes(app, opts);
  registerConfigRoutes(app, opts);
  registerItemRoutes(app, opts);
}
