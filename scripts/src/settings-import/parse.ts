import { readFileSync } from "node:fs";
import {
  agentsConfigSchema,
  pluginsConfigSchema,
} from "@lite-llm/agents-repository/schemas";
import {
  type ModelsConfig,
  modelsConfigSchema,
} from "@lite-llm/models-repository/schemas";
import {
  normalizeConfig,
  parseConfigContent,
} from "@lite-llm/repository-utils/jsonc";

export function readAgentsFile(filePath: string) {
  const content = readFileSync(filePath, "utf-8");
  const parsed = normalizeConfig(parseConfigContent(content, filePath));
  const result = agentsConfigSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      `Invalid agents config at ${filePath}: ${result.error.message}`,
    );
  }
  return result.data;
}

export function readPluginsFile(filePath: string) {
  const content = readFileSync(filePath, "utf-8");
  const parsed = normalizeConfig(parseConfigContent(content, filePath));
  const result = pluginsConfigSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      `Invalid plugins config at ${filePath}: ${result.error.message}`,
    );
  }
  return result.data.plugins;
}

export function readModelsFile(filePath: string): ModelsConfig {
  const content = readFileSync(filePath, "utf-8");
  const parsed = normalizeConfig(parseConfigContent(content, filePath));
  const result = modelsConfigSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      `Invalid models config at ${filePath}: ${result.error.message}`,
    );
  }
  return result.data;
}

export function collectAgentReferencedModels(
  agents: Record<string, { model?: string }>,
  categories: Record<string, { model?: string }>,
  globalFallbackModel?: string,
): Set<string> {
  const names = new Set<string>();

  for (const agent of Object.values(agents)) {
    const model = agent.model?.trim();
    if (model) {
      names.add(model);
    }
  }

  for (const category of Object.values(categories)) {
    const model = category.model?.trim();
    if (model) {
      names.add(model);
    }
  }

  const fallback = globalFallbackModel?.trim();
  if (fallback) {
    names.add(fallback);
  }

  return names;
}
