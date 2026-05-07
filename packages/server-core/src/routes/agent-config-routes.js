import { registerConfigRoutes } from "./agent-config/config-routes.js";
import { registerGlobalFallbackRoutes } from "./agent-config/global-fallback-routes.js";
import { registerItemRoutes } from "./agent-config/item-routes.js";
export function registerAgentConfigRoutes(app, opts) {
  registerGlobalFallbackRoutes(app, opts);
  registerConfigRoutes(app, opts);
  registerItemRoutes(app, opts);
}
