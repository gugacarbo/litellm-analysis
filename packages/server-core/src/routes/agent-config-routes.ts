import type { Application } from "express";
import type { RouteOptions } from "../types/index";
import { registerConfigRoutes } from "./agent-config/config-routes";

export function registerAgentConfigRoutes(
  app: Application,
  opts: RouteOptions,
): void {
  registerConfigRoutes(app, opts);
}
