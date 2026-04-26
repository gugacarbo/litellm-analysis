import type { AgentConfig, DbAgentEntry } from "../types/index.js";

// ── Model name aliasing constants ──

const MODEL_NAMES = [
  "gpt-5.5",
  "gpt-5.4",
  "gpt-5.3",
  "gpt-5.2",
  "gpt-5.1",
] as const;

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
    globalFallbackModel?: string,
  ): Record<string, AgentConfig> {
    const result: Record<string, AgentConfig> = {};
    for (const [key, entry] of Object.entries(agents)) {
      if (Object.keys(entry).length === 0) continue;
      const output: AgentConfig = {};

      // Transform real model names to aliases
      if (entry.model) {
        output.model = `${key}/${MODEL_NAMES[0]}`;
      }

      // Always generate all 4 fallback slots (gpt-5.4 through gpt-5.1)
      // Use defined fallbacks when available, otherwise use globalFallbackModel
      const agentFallbacks: string[] = [];
      const definedFallbacks = entry.fallbackModels ?? [];
      for (let i = 1; i < MODEL_NAMES.length; i++) {
        const slotModel = definedFallbacks[i - 1] ?? globalFallbackModel;
        if (slotModel) {
          agentFallbacks.push(`${key}/${MODEL_NAMES[i]}`);
        }
      }

      if (agentFallbacks.length > 0) {
        output.fallback_models = agentFallbacks;
      }
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
