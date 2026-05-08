// ── v1 → v2 Migration ──
// Converts the legacy flat-agent-map config format (version < 2)
// to the new format with structured SystemAgent[] and PluginRoutingConfig fields.

import type {
  AgentEntry,
  DbConfig,
} from "@lite-llm/agents-repository/repository";
import { DEFAULT_ROUTING, DEFAULT_SYSTEM_AGENTS } from "../config/defaults.js";
import type { PluginRoutingConfig, SystemAgent } from "../types/index.js";

// ── Public Types ──

export interface MigrationResult {
  config: DbConfig & {
    systemAgents: SystemAgent[];
    routing: PluginRoutingConfig;
  };
  migrated: boolean;
}

// ── Helpers ──

function toTitleCase(str: string): string {
  if (str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function migrateAgentEntry(key: string, entry: AgentEntry): SystemAgent {
  return {
    id: key,
    displayName: toTitleCase(key),
    icon: "🤖",
    description: entry.description ?? "",
    versions: [
      {
        id: "v1",
        displayName: "V1",
        modelIdStrategy: "model-name",
        limits: { context: 200000, output: 32768 },
      },
    ],
    model: entry.model ?? "",
    fallbackModels: entry.fallbackModels ?? [],
    enabledPlugins: ["opencode"],
    config: {
      mode: entry.mode,
      color: entry.color,
      disable: entry.disable,
      tools: entry.tools,
    },
  };
}

// ── Migration Function ──

export function migrateV1ToV2(config: DbConfig): MigrationResult {
  // Already v2 — check by duck-typing since DbConfig doesn't have systemAgents
  if (config.version >= 2 && (config as Record<string, unknown>).systemAgents) {
    return {
      config: config as DbConfig & {
        systemAgents: SystemAgent[];
        routing: PluginRoutingConfig;
      },
      migrated: false,
    };
  }

  // Step 1: Convert flat agent map to SystemAgent[]
  const migratedAgents: SystemAgent[] = [];
  const migratedAgentIds = new Set<string>();

  for (const [key, entry] of Object.entries(config.agents)) {
    const systemAgent = migrateAgentEntry(key, entry);
    migratedAgents.push(systemAgent);
    migratedAgentIds.add(key);
  }

  // Step 2: Merge with defaults (migrated agents take priority, defaults fill gaps)
  for (const defaultAgent of DEFAULT_SYSTEM_AGENTS) {
    if (!migratedAgentIds.has(defaultAgent.id)) {
      migratedAgents.push(defaultAgent);
    }
  }

  // Step 3: Set routing config, preserving globalFallbackModel
  const routing: PluginRoutingConfig = {
    ...DEFAULT_ROUTING,
    globalFallbackModel: config.globalFallbackModel,
  };

  // Step 4: Build result with v2 fields
  const result = {
    ...config,
    version: 2 as const,
    systemAgents: migratedAgents,
    routing,
  } satisfies DbConfig & {
    systemAgents: SystemAgent[];
    routing: PluginRoutingConfig;
  };

  return { config: result, migrated: true };
}
