import { registerAgentConfigRoutes } from "./agent-config-routes.js";
import { registerAgentDefinitionsRoutes } from "./agent-definitions-routes.js";
import { registerAgentRoutingRoutes } from "./agent-routing-routes.js";
import { registerAnalyticsRoutes } from "./analytics-routes.js";
import { registerCredentialRoutes } from "./credential-routes.js";
import { registerModelRoutes } from "./model-routes.js";
import { registerSpendRoutes } from "./spend-routes.js";
export function registerAllRoutes(app, opts) {
  registerSpendRoutes(app, opts);
  registerAnalyticsRoutes(app, opts);
  registerModelRoutes(app, opts);
  registerAgentRoutingRoutes(app, opts);
  registerAgentConfigRoutes(app, opts);
  registerAgentDefinitionsRoutes(app);
  registerCredentialRoutes(app, opts);
}
