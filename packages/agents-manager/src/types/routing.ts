// ── Plugin Routing Types ──
// Defines how system agents are routed to plugins for output generation.

import type { AgentVersion } from "./system-agent.js";

export interface PluginRoutingRule {
  enabled: boolean;
  versionOverrides?: Partial<Record<string, AgentVersion>>;
}

export interface PluginRoutingConfig {
  version: number;
  plugins: Record<
    string,
    {
      enabled: boolean;
      outputFile: string;
      agents: Record<string, PluginRoutingRule>;
    }
  >;
  globalFallbackModel?: string;
}
