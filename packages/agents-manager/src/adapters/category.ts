import type { CategoryConfig, DbCategoryEntry } from "../types/index.js";

// ── Category Adapter: Convert API format ↔ DB format ──

export interface ICategoryAdapter {
  toDb(raw: Partial<CategoryConfig>): DbCategoryEntry;
}

export class CategoryAdapter implements ICategoryAdapter {
  toDb(raw: Partial<CategoryConfig>): DbCategoryEntry {
    const entry: DbCategoryEntry = {} as DbCategoryEntry;
    if (raw.model !== undefined) entry.model = raw.model;
    if (raw.fallback_models !== undefined)
      entry.fallbackModels = raw.fallback_models;
    if (raw.description !== undefined) entry.description = raw.description;
    if (raw.variant !== undefined) entry.variant = raw.variant;
    if (raw.temperature !== undefined) entry.temperature = raw.temperature;
    if (raw.top_p !== undefined) entry.top_p = raw.top_p;
    if (raw.maxTokens !== undefined) entry.maxTokens = raw.maxTokens;
    if (raw.thinking !== undefined) entry.thinking = raw.thinking;
    if (raw.reasoningEffort !== undefined)
      entry.reasoningEffort = raw.reasoningEffort;
    if (raw.textVerbosity !== undefined)
      entry.textVerbosity = raw.textVerbosity;
    if (raw.tools !== undefined) entry.tools = raw.tools;
    if (raw.prompt_append !== undefined)
      entry.prompt_append = raw.prompt_append;
    if (raw.is_unstable_agent !== undefined)
      entry.is_unstable_agent = raw.is_unstable_agent;
    return entry;
  }
}

// ── Factory ──

export function createCategoryAdapter(): CategoryAdapter {
  return new CategoryAdapter();
}
