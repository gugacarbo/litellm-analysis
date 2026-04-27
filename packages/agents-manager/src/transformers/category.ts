import { MODEL_NAMES } from "@lite-llm/alias-router";
import type { CategoryConfig, DbCategoryEntry } from "../types/index.js";

// ── Category Transformer: DB format → Output config format ──

export interface ICategoryTransformer {
  toOutput(
    categories: Record<string, DbCategoryEntry>,
    globalFallbackModel?: string,
  ): Record<string, CategoryConfig>;
}

export class CategoryTransformer implements ICategoryTransformer {
  toOutput(
    categories: Record<string, DbCategoryEntry>,
    _globalFallbackModel?: string,
  ): Record<string, CategoryConfig> {
    const result: Record<string, CategoryConfig> = {};
    for (const [key, entry] of Object.entries(categories)) {
      if (Object.keys(entry).length === 0) continue;
      const output: CategoryConfig = {};

      output.model = `${key}/${MODEL_NAMES[0]}`;

      output.fallback_models = MODEL_NAMES.slice(1).map(
        (modelName) => `${key}/${modelName}`,
      );
      if (entry.description) output.description = entry.description;
      if (entry.variant) output.variant = entry.variant;
      if (entry.temperature !== undefined)
        output.temperature = entry.temperature;
      if (entry.top_p !== undefined) output.top_p = entry.top_p;
      if (entry.maxTokens) output.maxTokens = entry.maxTokens;
      if (entry.thinking) output.thinking = entry.thinking;
      if (entry.reasoningEffort) output.reasoningEffort = entry.reasoningEffort;
      if (entry.textVerbosity) output.textVerbosity = entry.textVerbosity;
      if (entry.tools) output.tools = entry.tools;
      if (entry.prompt_append) output.prompt_append = entry.prompt_append;
      if (entry.is_unstable_agent !== undefined)
        output.is_unstable_agent = entry.is_unstable_agent;
      result[key] = output;
    }
    return result;
  }
}

// ── Factory ──

export function createCategoryTransformer(): CategoryTransformer {
  return new CategoryTransformer();
}
