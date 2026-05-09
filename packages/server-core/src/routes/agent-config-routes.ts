import type { Application } from "express";
import type { RouteOptions } from "../types/index.js";
import { registerConfigRoutes } from "./agent-config/config-routes.js";

export function registerAgentConfigRoutes(
  app: Application,
  opts: RouteOptions,
): void {
  registerConfigRoutes(app, opts);
}
