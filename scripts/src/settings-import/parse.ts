import { readFileSync } from "node:fs";
import {
  agentsConfigSchema,
  pluginsConfigSchema,
} from "@lite-llm/agents-repository/schemas";
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
