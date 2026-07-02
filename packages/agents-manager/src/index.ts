// ── Main export file ──
// Services for agent, category, and routing management

// Re-export types from agents-repository
export type {
  AgentEntry,
  CategoryEntry,
  DbConfig,
  IAgentsRepository,
  ModelSpec,
  RepositoryOptions,
} from "@lite-llm/agents-repository/repository";

// Repository client (wraps agents-repository)
import { createRepositoryClient } from "./repository/client";

export { createRepositoryClient };

// Services
import {
  AgentService,
  type AgentServiceOptions,
  type IAgentService,
} from "./services/agent.service";
import {
  AgentCatalogService,
  type AgentCatalogServiceOptions,
  type IAgentCatalogService,
} from "./services/agent-catalog.service";
import {
  CategoryService,
  type CategoryServiceOptions,
  type ICategoryService,
} from "./services/category.service";
import {
  type IRoutingService,
  RoutingService,
  type RoutingServiceOptions,
} from "./services/routing.service";

// Types from agents-repository
export type {
  AgentExtraConfig,
  PluginRouting,
  PluginRoutingRule,
  SystemAgent,
} from "@lite-llm/agents-repository/schemas";

// Service interfaces and implementations
export type {
  AgentCatalogServiceOptions,
  AgentServiceOptions,
  CategoryServiceOptions,
  IAgentCatalogService,
  IAgentService,
  ICategoryService,
  IRoutingService,
  RoutingServiceOptions,
};
export { AgentCatalogService, AgentService, CategoryService, RoutingService };

// Config
import { DEFAULT_AGENTS } from "./config/defaults";

export { DEFAULT_AGENTS };

// ── Factory ──

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
