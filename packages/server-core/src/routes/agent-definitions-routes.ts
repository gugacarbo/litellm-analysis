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

const AGENT_METADATA: Record<
  string,
  { name: string; icon: string; description?: string }
> = {
  sisyphus: { name: "Sisyphus", icon: "🔄" },
  oracle: { name: "Oracle", icon: "🔮" },
  prometheus: { name: "Prometheus", icon: "🔥" },
  explore: { name: "Explore", icon: "🔍" },
  "multimodal-looker": { name: "Multimodal Looker", icon: "👁️" },
  metis: { name: "Metis", icon: "🧩" },
  atlas: { name: "Atlas", icon: "🧭" },
  librarian: { name: "Librarian", icon: "📚" },
  "sisyphus-junior": { name: "Sisyphus Junior", icon: "🤖" },
  momus: { name: "Momus", icon: "✅" },
  hephaestus: { name: "Hephaestus", icon: "🔨" },
  build: { name: "Build", icon: "🔧" },
  plan: { name: "Plan", icon: "📋" },
  "OpenCode-Builder": { name: "OpenCode Builder", icon: "🏗️" },
};

const CATEGORY_METADATA: Record<
  string,
  { name: string; icon?: string; description?: string }
> = {
  "visual-engineering": { name: "Visual Engineering" },
  ultrabrain: { name: "Ultrabrain" },
  deep: { name: "Deep" },
  artistry: { name: "Artistry" },
  quick: { name: "Quick" },
  "unspecified-low": { name: "Unspecified Low" },
  "unspecified-high": { name: "Unspecified High" },
  writing: { name: "Writing" },
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

function toAgentDefinition(
  key: string,
  entry: { description?: string },
): AgentDefinition {
  const metadata = AGENT_METADATA[key];
  return {
    key,
    name: metadata?.name ?? toTitleCase(key),
    icon: metadata?.icon ?? "🤖",
    description: normalizeDescription(
      key,
      entry.description,
      metadata?.description,
    ),
  };
}

function toCategoryDefinition(
  key: string,
  entry: { description?: string },
): CategoryDefinition {
  const metadata = CATEGORY_METADATA[key];
  return {
    key,
    name: metadata?.name ?? toTitleCase(key),
    icon: metadata?.icon,
    description: normalizeDescription(
      key,
      entry.description,
      metadata?.description,
    ),
  };
}

export function registerAgentDefinitionsRoutes(app: Application): void {
  app.get("/agent-definitions", async (_req, res) => {
    try {
      const { services } = createAgentsManager();
      const agents = await services.agents.getAll();
      const categories = await services.categories.getAll();

      const agentDefs = Object.entries(agents).map(([key, entry]) =>
        toAgentDefinition(key, entry),
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
