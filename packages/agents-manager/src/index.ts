// ── Main export file ──
// Factory and repository client for agent management

// Repository client (wraps agents-repository)
import { createRepositoryClient } from "./repository/client";

export { createRepositoryClient };

import { AgentService } from "./services/agent.service";
// Services are intentionally not re-exported from the root barrel.
// Import them directly from ./services/* if needed for tests or specialized use.
import { AgentCatalogService } from "./services/agent-catalog.service";
import { CategoryService } from "./services/category.service";
import { RoutingService } from "./services/routing.service";

// Factory
export function createAgentsManager() {
  const repository = createRepositoryClient();

  const services = {
    agents: new AgentService({ repository }),
    catalog: new AgentCatalogService({ repository }),
    categories: new CategoryService({ repository }),
    routing: new RoutingService({ repository }),
  };

  return { repository, services };
}
