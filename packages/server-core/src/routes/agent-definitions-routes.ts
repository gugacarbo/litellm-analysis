import type { IAgentCatalogService } from "@lite-llm/agents-manager";
import { createAgentsManager } from "@lite-llm/agents-manager";
import type { Application } from "express";

type AgentDefinition = {
  key: string;
  name: string;
  description: string;
  icon: string;
};

type CategoryDefinition = {
  key: string;
  name: string;
  description: string;
  icon?: string;
};

function toTitleCase(input: string): string {
  return input
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeDescription(
  key: string,
  description: string | undefined,
  fallback?: string,
): string {
  if (description && description.trim().length > 0) {
    return description;
  }
  return fallback ?? `Configuration metadata for ${toTitleCase(key)}.`;
}

async function toAgentDefinition(
  key: string,
  entry: { description?: string },
  catalog: IAgentCatalogService,
): Promise<AgentDefinition> {
  const agent = await catalog.get(key);
  return {
    key,
    name: agent?.displayName ?? toTitleCase(key),
    icon: agent?.icon ?? "🤖",
    description: normalizeDescription(
      key,
      entry.description,
      agent?.description,
    ),
  };
}

function toCategoryDefinition(
  key: string,
  entry: { description?: string },
): CategoryDefinition {
  return {
    key,
    name: toTitleCase(key),
    description: normalizeDescription(key, entry.description),
  };
}

export function registerAgentDefinitionsRoutes(app: Application): void {
  app.get("/agent-definitions", async (_req, res) => {
    try {
      const { services } = createAgentsManager();
      const agents = await services.agents.getAll();
      const categories = await services.categories.getAll();
      const catalog = services.catalog;

      const agentDefs = await Promise.all(
        Object.entries(agents).map(([key, entry]) =>
          toAgentDefinition(key, entry, catalog),
        ),
      );
      const categoryDefs = Object.entries(categories).map(([key, entry]) =>
        toCategoryDefinition(key, entry),
      );

      res.json({ agents: agentDefs, categories: categoryDefs });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });
}
