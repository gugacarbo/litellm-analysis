import { MODEL_NAMES } from "@lite-llm/alias-router";
import type { AgentConfig, DbAgentEntry } from "../types/index.js";

// ── Agent Transformer: DB format → Output config format ──

export interface IAgentTransformer {
  toOutput(
    agents: Record<string, DbAgentEntry>,
    globalFallbackModel?: string,
  ): Record<string, AgentConfig>;
}

export class AgentTransformer implements IAgentTransformer {
  toOutput(
    agents: Record<string, DbAgentEntry>,
    _globalFallbackModel?: string,
  ): Record<string, AgentConfig> {
    const result: Record<string, AgentConfig> = {};
    for (const [key, entry] of Object.entries(agents)) {
      if (Object.keys(entry).length === 0) continue;
      const output: AgentConfig = {};

      // Always set the primary logical alias.
      output.model = `${key}/${MODEL_NAMES[0]}`;

      // Always expose the full logical fallback chain (5.4 -> 5.1).
      output.fallback_models = MODEL_NAMES.slice(1).map(
        (modelName) => `${key}/${modelName}`,
      );
      if (entry.description) output.description = entry.description;
      if (entry.color) output.color = entry.color;
      if (entry.disable !== undefined) output.disable = entry.disable;
      if (entry.variant) output.variant = entry.variant;
      if (entry.category) output.category = entry.category;
      if (entry.skills?.length) output.skills = entry.skills;
      if (entry.temperature !== undefined)
        output.temperature = entry.temperature;
      if (entry.top_p !== undefined) output.top_p = entry.top_p;
      if (entry.prompt) output.prompt = entry.prompt;
      if (entry.prompt_append) output.prompt_append = entry.prompt_append;
      if (entry.tools) output.tools = entry.tools;
      if (entry.mode) output.mode = entry.mode;
      if (entry.permission) output.permission = entry.permission;
      result[key] = output;
    }
    return result;
  }
}

// ── Factory ──

export function createAgentTransformer(): AgentTransformer {
  return new AgentTransformer();
}
