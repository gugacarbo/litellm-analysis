import type { CategoryConfig, DbCategoryEntry } from "../types/index.js";

// ── Model name aliasing constants ──

const MODEL_NAMES = [
  "gpt-5.5",
  "gpt-5.4",
  "gpt-5.3",
  "gpt-5.2",
  "gpt-5.1",
] as const;

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
    globalFallbackModel?: string,
  ): Record<string, CategoryConfig> {
    const result: Record<string, CategoryConfig> = {};
    for (const [key, entry] of Object.entries(categories)) {
      if (Object.keys(entry).length === 0) continue;
      const output: CategoryConfig = {};

      output.model = `${key}/${MODEL_NAMES[0]}`;

      // Always generate all 4 fallback slots (gpt-5.4 through gpt-5.1)
      // Use defined fallbacks when available, otherwise use globalFallbackModel
      const categoryFallbacks: string[] = [];
      const definedFallbacks = entry.fallbackModels ?? [];
      for (let i = 1; i < MODEL_NAMES.length; i++) {
        const slotModel = definedFallbacks[i - 1] ?? globalFallbackModel;
        if (slotModel) {
          categoryFallbacks.push(`${key}/${MODEL_NAMES[i]}`);
        }
      }

      if (categoryFallbacks.length > 0) {
        output.fallback_models = categoryFallbacks;
      }
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
