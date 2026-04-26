import type { AgentConfig, DbAgentEntry } from '../types/index.js';

// ── Agent Adapter: Convert API format ↔ DB format ──

export interface IAgentAdapter {
  toDb(raw: Partial<AgentConfig>): DbAgentEntry;
}

export class AgentAdapter implements IAgentAdapter {
  toDb(raw: Partial<AgentConfig>): DbAgentEntry {
    const entry: DbAgentEntry = {} as DbAgentEntry;
    if (raw.model !== undefined) entry.model = raw.model;
    if (raw.fallback_models !== undefined)
      entry.fallbackModels = raw.fallback_models;
    if (raw.description !== undefined) entry.description = raw.description;
    if (raw.color !== undefined) entry.color = raw.color;
    if (raw.disable !== undefined) entry.disable = raw.disable;
    if (raw.variant !== undefined) entry.variant = raw.variant;
    if (raw.category !== undefined) entry.category = raw.category;
    if (raw.skills !== undefined) entry.skills = raw.skills;
    if (raw.temperature !== undefined) entry.temperature = raw.temperature;
    if (raw.top_p !== undefined) entry.top_p = raw.top_p;
    if (raw.prompt !== undefined) entry.prompt = raw.prompt;
    if (raw.prompt_append !== undefined) entry.prompt_append = raw.prompt_append;
    if (raw.tools !== undefined) entry.tools = raw.tools;
    if (raw.mode !== undefined) entry.mode = raw.mode;
    if (raw.permission !== undefined) entry.permission = raw.permission;
    return entry;
  }
}

// ── Factory ──

export function createAgentAdapter(): AgentAdapter {
  return new AgentAdapter();
}
